/**
 * Does the Dog Die (DTDD) API Scraper
 *
 * Fetches trigger warning data from DTDD API and converts to our database format.
 *
 * Usage:
 *   node scripts/dtdd-scraper.js --api-key YOUR_KEY --search "Movie Title"
 *   node scripts/dtdd-scraper.js --api-key YOUR_KEY --imdb tt0062852
 *   node scripts/dtdd-scraper.js --api-key YOUR_KEY --batch popular-movies.txt
 *
 * Options:
 *   --api-key      Your DTDD API key (required)
 *   --search       Search by movie/show title
 *   --imdb         Search by IMDb ID
 *   --batch        Process list of titles from file (one per line)
 *   --output       Output format: sql, json (default: sql)
 *   --confidence   Minimum confidence threshold 0-1 (default: 0.7)
 *   --min-votes    Minimum total votes (default: 5)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load category mapping
const mapping = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'dtdd-mapping.json'), 'utf8')
);

class DTDDScraper {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'www.doesthedogdie.com';
    this.categoryMapping = mapping.categoryMapping;
  }

  /**
   * Make HTTP request to DTDD API
   */
  async request(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: path,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': this.apiKey,
        },
      };

      https.get(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(new Error(`Failed to parse JSON: ${err.message}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Search for media by title
   */
  async search(title) {
    const encodedTitle = encodeURIComponent(title);
    const data = await this.request(`/dddsearch?q=${encodedTitle}`);
    return data.items || [];
  }

  /**
   * Search for media by IMDb ID
   */
  async searchByImdb(imdbId) {
    const data = await this.request(`/dddsearch?imdb=${imdbId}`);
    return data.items || [];
  }

  /**
   * Get full media details including all triggers
   */
  async getMedia(itemId) {
    const data = await this.request(`/media/${itemId}`);
    return data;
  }

  /**
   * Map DTDD topic to our category
   */
  mapTopicToCategory(topicName) {
    const lowerTopic = topicName.toLowerCase();

    for (const [category, keywords] of Object.entries(this.categoryMapping)) {
      for (const keyword of keywords) {
        if (lowerTopic.includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(lowerTopic)) {
          return category;
        }
      }
    }

    return null; // No mapping found
  }

  /**
   * Process media and extract triggers
   */
  processTriggers(mediaData, options = {}) {
    const {
      minConfidence = 0.7,
      minVotes = 5,
    } = options;

    const item = mediaData.item;
    const triggers = [];

    if (!mediaData.topicItemStats) {
      return triggers;
    }

    for (const stat of mediaData.topicItemStats) {
      const totalVotes = stat.yesSum + stat.noSum;

      // Skip if not enough votes
      if (totalVotes < minVotes) {
        continue;
      }

      // Calculate confidence
      const confidence = stat.yesSum / totalVotes;

      // Skip if below confidence threshold
      if (confidence < minConfidence) {
        continue;
      }

      // Skip if it's a "no" answer (no trigger present)
      if (!stat.isYes) {
        continue;
      }

      // Map to our category
      const category = this.mapTopicToCategory(stat.topic.name);

      if (!category) {
        console.warn(`⚠️  No mapping for topic: "${stat.topic.name}"`);
        continue;
      }

      triggers.push({
        category: category,
        topicName: stat.topic.name,
        description: stat.comment || stat.topic.name,
        confidence: Math.round(confidence * 100),
        yesVotes: stat.yesSum,
        noVotes: stat.noSum,
        comments: stat.comments?.length || 0,
      });
    }

    return {
      item: {
        id: item.id,
        name: item.name,
        year: item.releaseYear,
        type: item.itemType?.name || 'Unknown',
        tmdbId: item.tmdbId,
        imdbId: item.imdbId,
        overview: item.overview,
      },
      triggers: triggers,
    };
  }

  /**
   * Generate SQL INSERT statements
   */
  generateSQL(processedData, videoId, platform = 'unknown') {
    const sql = [];
    const submittedBy = 'dtdd-import'; // Placeholder user ID

    for (const trigger of processedData.triggers) {
      // NOTE: We don't have timestamps from DTDD, so we use 0 as placeholder
      // Users will need to refine these later with actual timestamps
      const insert = `
INSERT INTO triggers (
  video_id,
  platform,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  submitted_by,
  score,
  requires_moderation
) VALUES (
  '${videoId}',
  '${platform}',
  '${trigger.category}',
  0,
  999999,
  '${this.escapeSql(trigger.description)}',
  ${trigger.confidence},
  'approved',
  '${submittedBy}',
  ${trigger.yesVotes - trigger.noVotes},
  false
);`.trim();

      sql.push(insert);
    }

    return sql.join('\n\n');
  }

  /**
   * Escape SQL strings
   */
  escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
  }

  /**
   * Generate JSON output
   */
  generateJSON(processedData, videoId, platform = 'unknown') {
    return processedData.triggers.map(trigger => ({
      videoId: videoId,
      platform: platform,
      categoryKey: trigger.category,
      startTime: 0,
      endTime: 999999,
      description: trigger.description,
      confidenceLevel: trigger.confidence,
      status: 'approved',
      submittedBy: 'dtdd-import',
      score: trigger.yesVotes - trigger.noVotes,
      requiresModeration: false,
      metadata: {
        source: 'dtdd',
        topicName: trigger.topicName,
        yesVotes: trigger.yesVotes,
        noVotes: trigger.noVotes,
      },
    }));
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const config = {
    apiKey: null,
    search: null,
    imdb: null,
    batch: null,
    output: 'sql',
    confidence: 0.7,
    minVotes: 5,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];

    if (key === 'confidence') {
      config[key] = parseFloat(value);
    } else if (key === 'min-votes') {
      config.minVotes = parseInt(value);
    } else {
      config[key] = value;
    }
  }

  if (!config.apiKey) {
    console.error('❌ Error: --api-key is required');
    console.log('\nUsage:');
    console.log('  node scripts/dtdd-scraper.js --api-key YOUR_KEY --search "Movie Title"');
    console.log('  node scripts/dtdd-scraper.js --api-key YOUR_KEY --imdb tt0062852');
    process.exit(1);
  }

  const scraper = new DTDDScraper(config.apiKey);

  try {
    let results = [];

    // Search by title
    if (config.search) {
      console.log(`🔍 Searching for: "${config.search}"...`);
      results = await scraper.search(config.search);
      console.log(`✅ Found ${results.length} results\n`);
    }
    // Search by IMDb ID
    else if (config.imdb) {
      console.log(`🔍 Searching for IMDb ID: ${config.imdb}...`);
      results = await scraper.searchByImdb(config.imdb);
      console.log(`✅ Found ${results.length} results\n`);
    }
    // Batch processing
    else if (config.batch) {
      console.log(`📋 Processing batch file: ${config.batch}...`);
      const titles = fs.readFileSync(config.batch, 'utf8')
        .split('\n')
        .filter(line => line.trim());

      for (const title of titles) {
        console.log(`\n🔍 Searching for: "${title}"...`);
        const searchResults = await scraper.search(title);
        if (searchResults.length > 0) {
          results.push(searchResults[0]); // Take first result
        }
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    else {
      console.error('❌ Error: Must specify --search, --imdb, or --batch');
      process.exit(1);
    }

    if (results.length === 0) {
      console.log('❌ No results found');
      return;
    }

    // Process each result
    const allOutputs = [];

    for (const result of results) {
      console.log(`\n📺 Processing: ${result.name} (${result.releaseYear})`);
      console.log(`   Type: ${result.itemType?.name || 'Unknown'}`);
      console.log(`   DTDD ID: ${result.id}`);

      if (result.tmdbId) console.log(`   TMDB: ${result.tmdbId}`);
      if (result.imdbId) console.log(`   IMDb: ${result.imdbId}`);

      // Fetch full media data
      console.log(`   Fetching triggers...`);
      const mediaData = await scraper.getMedia(result.id);

      // Process triggers
      const processed = scraper.processTriggers(mediaData, {
        minConfidence: config.confidence,
        minVotes: config.minVotes,
      });

      console.log(`   ✅ Found ${processed.triggers.length} triggers (after filtering)`);

      if (processed.triggers.length > 0) {
        // Show trigger summary
        const categoryCounts = {};
        processed.triggers.forEach(t => {
          categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
        });
        console.log(`   Categories:`, categoryCounts);

        // Generate output
        const videoId = result.tmdbId || result.imdbId || `dtdd-${result.id}`;
        const platform = 'unknown'; // User needs to map this

        if (config.output === 'sql') {
          const sql = scraper.generateSQL(processed, videoId, platform);
          allOutputs.push(`-- ${result.name} (${result.releaseYear})\n${sql}`);
        } else if (config.output === 'json') {
          const json = scraper.generateJSON(processed, videoId, platform);
          allOutputs.push(...json);
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Output results
    if (allOutputs.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `dtdd-import-${timestamp}.${config.output}`;
      const filepath = path.join(__dirname, '..', 'database', filename);

      if (config.output === 'sql') {
        fs.writeFileSync(filepath, allOutputs.join('\n\n'));
        console.log(`\n✅ SQL output saved to: ${filepath}`);
        console.log(`\n⚠️  NOTE: Video IDs are placeholders. You need to:`);
        console.log(`   1. Map TMDB/IMDb IDs to actual platform video IDs`);
        console.log(`   2. Add real timestamps (currently set to 0-999999)`);
        console.log(`   3. Review and adjust categories as needed`);
      } else if (config.output === 'json') {
        fs.writeFileSync(filepath, JSON.stringify(allOutputs, null, 2));
        console.log(`\n✅ JSON output saved to: ${filepath}`);
      }
    } else {
      console.log('\n❌ No triggers to output');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DTDDScraper;
