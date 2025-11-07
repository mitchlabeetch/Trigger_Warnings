/**
 * IMDb Parental Guide Parser
 *
 * Parses IMDb Parental Guide CSV from Kaggle and converts to our database format.
 *
 * Dataset: https://www.kaggle.com/datasets/barryhaworth/imdb-parental-guide
 *
 * Usage:
 *   node scripts/imdb-parser.js --csv path/to/imdb-parental-guide.csv --output sql
 *   node scripts/imdb-parser.js --csv imdb-guide.csv --output json --min-score 5
 *
 * CSV Format:
 *   tconst,title,parentalguide_sections,violence,gore,profanity,alcohol,frightening
 *
 * Options:
 *   --csv          Path to CSV file (required)
 *   --output       Output format: sql, json (default: sql)
 *   --min-score    Minimum IMDb rating (0-10, default: 6.0)
 *   --limit        Limit number of entries (default: unlimited)
 *   --platform     Default platform (default: unknown)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class IMDbParser {
  constructor() {
    this.categoryMapping = {
      violence: 'violence',
      gore: 'gore',
      profanity: 'discrimination', // Map profanity to discrimination (slurs, etc.)
      alcohol: 'substance_abuse',
      frightening: 'mental_health', // Frightening scenes can trigger anxiety
    };

    // Severity thresholds
    this.severityMap = {
      none: 0,
      mild: 25,
      moderate: 50,
      severe: 75,
      extreme: 90,
    };
  }

  /**
   * Parse IMDb CSV file
   */
  async parseCSV(filepath, options = {}) {
    const {
      minScore = 6.0,
      limit = Infinity,
      platform = 'unknown',
    } = options;

    const results = [];
    let count = 0;

    const fileStream = fs.createReadStream(filepath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let isFirstLine = true;

    for await (const line of rl) {
      // Skip header
      if (isFirstLine) {
        isFirstLine = false;
        continue;
      }

      if (count >= limit) {
        break;
      }

      try {
        const entry = this.parseLine(line);

        if (entry && entry.triggers.length > 0) {
          results.push(entry);
          count++;
        }
      } catch (error) {
        console.warn(`Failed to parse line: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Parse a single CSV line
   */
  parseLine(line) {
    // Basic CSV parsing (handles quoted fields)
    const fields = this.parseCSVLine(line);

    if (fields.length < 6) {
      return null;
    }

    const [imdbId, title, sections, violence, gore, profanity, alcohol, frightening] = fields;

    if (!imdbId || !title) {
      return null;
    }

    const triggers = [];

    // Parse each category
    const categories = {
      violence,
      gore,
      profanity,
      alcohol,
      frightening,
    };

    for (const [imdbCategory, severity] of Object.entries(categories)) {
      if (!severity || severity.toLowerCase() === 'none') {
        continue;
      }

      const category = this.categoryMapping[imdbCategory];
      if (!category) continue;

      const confidence = this.getSeverityScore(severity);

      triggers.push({
        category,
        imdbCategory,
        severity: severity.toLowerCase(),
        confidence,
        description: `${severity} ${imdbCategory} (IMDb Parental Guide)`,
      });
    }

    return {
      imdbId,
      title,
      triggers,
    };
  }

  /**
   * Parse CSV line (handles quoted fields with commas)
   */
  parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    fields.push(current.trim());
    return fields;
  }

  /**
   * Get confidence score from severity string
   */
  getSeverityScore(severity) {
    const lower = severity.toLowerCase();

    for (const [key, score] of Object.entries(this.severityMap)) {
      if (lower.includes(key)) {
        return score;
      }
    }

    return 50; // Default moderate
  }

  /**
   * Generate SQL INSERT statements
   */
  generateSQL(entries, platform = 'unknown') {
    const sql = [];

    for (const entry of entries) {
      for (const trigger of entry.triggers) {
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
  '${entry.imdbId}',
  '${platform}',
  '${trigger.category}',
  0,
  999999,
  '${this.escapeSql(trigger.description)}',
  ${trigger.confidence},
  'approved',
  'imdb-import',
  0,
  false
);`.trim();

        sql.push(insert);
      }
    }

    return sql.join('\n\n');
  }

  /**
   * Generate JSON output
   */
  generateJSON(entries, platform = 'unknown') {
    const results = [];

    for (const entry of entries) {
      for (const trigger of entry.triggers) {
        results.push({
          videoId: entry.imdbId,
          title: entry.title,
          platform,
          categoryKey: trigger.category,
          startTime: 0,
          endTime: 999999,
          description: trigger.description,
          confidenceLevel: trigger.confidence,
          status: 'approved',
          submittedBy: 'imdb-import',
          score: 0,
          requiresModeration: false,
          metadata: {
            source: 'imdb-parental-guide',
            imdbCategory: trigger.imdbCategory,
            severity: trigger.severity,
          },
        });
      }
    }

    return results;
  }

  /**
   * Escape SQL strings
   */
  escapeSql(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const config = {
    csv: null,
    output: 'sql',
    minScore: 6.0,
    limit: Infinity,
    platform: 'unknown',
  };

  // Parse arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];

    if (key === 'min-score') {
      config.minScore = parseFloat(value);
    } else if (key === 'limit') {
      config.limit = parseInt(value);
    } else {
      config[key] = value;
    }
  }

  if (!config.csv) {
    console.error('❌ Error: --csv is required');
    console.log('\nUsage:');
    console.log('  node scripts/imdb-parser.js --csv path/to/imdb-guide.csv --output sql');
    console.log('\nDownload dataset from:');
    console.log('  https://www.kaggle.com/datasets/barryhaworth/imdb-parental-guide');
    process.exit(1);
  }

  if (!fs.existsSync(config.csv)) {
    console.error(`❌ Error: File not found: ${config.csv}`);
    process.exit(1);
  }

  const parser = new IMDbParser();

  console.log('📊 Parsing IMDb Parental Guide CSV...');
  console.log(`   File: ${config.csv}`);
  console.log(`   Format: ${config.output}`);
  console.log(`   Min Score: ${config.minScore}`);
  console.log(`   Limit: ${config.limit === Infinity ? 'unlimited' : config.limit}\n`);

  try {
    const entries = await parser.parseCSV(config.csv, {
      minScore: config.minScore,
      limit: config.limit,
      platform: config.platform,
    });

    console.log(`✅ Parsed ${entries.length} entries with triggers\n`);

    // Calculate statistics
    const categoryCounts = {};
    let totalTriggers = 0;

    entries.forEach((entry) => {
      entry.triggers.forEach((trigger) => {
        categoryCounts[trigger.category] = (categoryCounts[trigger.category] || 0) + 1;
        totalTriggers++;
      });
    });

    console.log('📊 Statistics:');
    console.log(`   Total Entries: ${entries.length}`);
    console.log(`   Total Triggers: ${totalTriggers}`);
    console.log('   By Category:');
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`     - ${cat}: ${count}`);
      });

    // Generate output
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `imdb-import-${timestamp}.${config.output}`;
    const filepath = path.join(__dirname, '..', 'database', filename);

    if (config.output === 'sql') {
      const sql = parser.generateSQL(entries, config.platform);
      fs.writeFileSync(filepath, sql);
      console.log(`\n✅ SQL output saved to: ${filepath}`);
      console.log(`\n⚠️  NOTE: Video IDs are IMDb IDs (ttXXXXXXX).`);
      console.log(`   You need to map these to platform-specific video IDs.`);
      console.log(`   Use: node scripts/platform-id-mapper.js --imdb <id> --platform <name>`);
    } else if (config.output === 'json') {
      const json = parser.generateJSON(entries, config.platform);
      fs.writeFileSync(filepath, JSON.stringify(json, null, 2));
      console.log(`\n✅ JSON output saved to: ${filepath}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = IMDbParser;
