/**
 * Platform ID Mapper
 *
 * Helper script to find platform-specific video IDs from TMDB/IMDb IDs.
 *
 * Usage:
 *   node scripts/platform-id-mapper.js --tmdb 603 --platform netflix
 *   node scripts/platform-id-mapper.js --imdb tt0133093 --platform primevideo
 *
 * This is a manual lookup tool. For automated mapping, you would need:
 * - Netflix API access (not publicly available)
 * - YouTube Data API
 * - Platform-specific catalog APIs
 */

const https = require('https');

class PlatformMapper {
  constructor() {
    this.platformInstructions = {
      netflix: `
Netflix Video IDs:
1. Go to https://www.netflix.com
2. Search for the title
3. Click on the title to open it
4. Look at the URL: https://www.netflix.com/title/XXXXXXXX
5. The number XXXXXXXX is your video ID

Example: The Matrix → 20557190
URL: https://www.netflix.com/title/20557190
      `,

      youtube: `
YouTube Video IDs:
1. Go to https://www.youtube.com
2. Search for the title (e.g., "The Matrix full movie")
3. Look for official/legal uploads (often from movie studios)
4. Click on the video
5. Look at the URL: https://www.youtube.com/watch?v=XXXXXXXXXXX
6. The string after v= is your video ID

Example: The Matrix Trailer → 9ix7TUGVYIo
URL: https://www.youtube.com/watch?v=9ix7TUGVYIo

Note: Many movies on YouTube are rentals/purchases. Free movies are rare.
      `,

      primevideo: `
Prime Video IDs (ASIN):
1. Go to https://www.primevideo.com
2. Search for the title
3. Click on the title
4. Look at the URL: https://www.primevideo.com/detail/XXXXXXXXXX/
5. The ASIN XXXXXXXXXX is your video ID

Example: The Matrix → B00FGDW0KW
URL: https://www.primevideo.com/detail/B00FGDW0KW/

Alternative method:
- Search Amazon for the title
- Find the Prime Video version
- The ASIN in Amazon URL is the same
      `,

      hulu: `
Hulu Video IDs:
1. Go to https://www.hulu.com
2. Search for the title
3. Click on the title
4. Look at the URL: https://www.hulu.com/movie/SLUG-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
5. The UUID part is your video ID

Example: The Matrix → 78dfd0d0-8d5f-4544-9a19-9a7cf5e6e8a7
URL: https://www.hulu.com/movie/the-matrix-78dfd0d0-8d5f-4544-9a19-9a7cf5e6e8a7

Note: Hulu uses UUIDs in their URLs
      `,

      disneyplus: `
Disney+ Video IDs:
1. Go to https://www.disneyplus.com
2. Search for the title
3. Click on the title
4. Look at the URL: https://www.disneyplus.com/movies/SLUG/XXXXXXXXXXXXXXXXXXX
5. The long string at the end is your video ID

Example: The Lion King → 1HqwiEodnoGF4Pd0YX7hHs
URL: https://www.disneyplus.com/movies/the-lion-king/1HqwiEodnoGF4Pd0YX7hHs
      `,

      max: `
Max (HBO) Video IDs:
1. Go to https://www.max.com
2. Search for the title
3. Click on the title
4. Look at the URL: https://www.max.com/movies/SLUG/XXXXXXXXXXX
5. The ID at the end is your video ID

Example: The Matrix → urn:hbo:feature:GXJvvPwOqMIIhOgEAAACw
URL: https://www.max.com/movies/the-matrix/urn:hbo:feature:GXJvvPwOqMIIhOgEAAACw

Note: Max uses URN format for IDs
      `,

      peacocktv: `
Peacock Video IDs:
1. Go to https://www.peacocktv.com
2. Search for the title
3. Click on the title
4. Look at the URL: https://www.peacocktv.com/watch/asset/SLUG/XXXXXXXXXXXXXXXXXXX
5. The long string at the end is your video ID

Example: The Matrix → 6179e1c2-1fd4-35b5-867a-2a36a65e3a97
URL: https://www.peacocktv.com/watch/asset/the-matrix/6179e1c2-1fd4-35b5-867a-2a36a65e3a97
      `,
    };
  }

  /**
   * Get TMDB data
   */
  async getTMDBInfo(tmdbId, type = 'movie') {
    // Note: This would require TMDB API key
    // For now, just provide instructions
    return {
      instructions: `
To get more info about TMDB ID ${tmdbId}:
1. Go to https://www.themoviedb.org/${type}/${tmdbId}
2. View external IDs (IMDb, etc.) on the sidebar
3. Use those IDs to search on streaming platforms
      `.trim(),
    };
  }

  /**
   * Get platform-specific instructions
   */
  getPlatformInstructions(platform) {
    return this.platformInstructions[platform] || `
Unknown platform: ${platform}

Supported platforms:
- netflix
- youtube
- primevideo
- hulu
- disneyplus
- max
- peacocktv

Use: --platform <name>
    `.trim();
  }

  /**
   * Interactive helper
   */
  async interactiveHelper(options) {
    const { tmdb, imdb, platform, title } = options;

    console.log('\n🎬 Platform ID Mapper\n');
    console.log('═'.repeat(60));

    if (title) {
      console.log(`\n📺 Title: ${title}`);
    }

    if (tmdb) {
      console.log(`\n🎞️  TMDB ID: ${tmdb}`);
      console.log(`   TMDB URL: https://www.themoviedb.org/movie/${tmdb}`);
      const info = await this.getTMDBInfo(tmdb);
      console.log(info.instructions);
    }

    if (imdb) {
      console.log(`\n🎬 IMDb ID: ${imdb}`);
      console.log(`   IMDb URL: https://www.imdb.com/title/${imdb}/`);
    }

    if (platform) {
      console.log(`\n📱 Platform: ${platform.toUpperCase()}`);
      console.log('═'.repeat(60));
      console.log(this.getPlatformInstructions(platform));
    } else {
      console.log('\n💡 Tip: Use --platform <name> to get platform-specific instructions');
      console.log('\nSupported platforms:');
      Object.keys(this.platformInstructions).forEach(p => {
        console.log(`  - ${p}`);
      });
    }

    console.log('\n═'.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('1. Follow the instructions above to find the platform video ID');
    console.log('2. Update your SQL file: Replace the placeholder video_id');
    console.log('3. Set the correct platform value');
    console.log('4. Import to database\n');
  }

  /**
   * Bulk process from SQL file
   */
  async processSQLFile(filepath) {
    const fs = require('fs');
    const content = fs.readFileSync(filepath, 'utf8');

    // Extract video IDs that look like TMDB/IMDb IDs
    const lines = content.split('\n');
    const videoIds = new Set();

    for (const line of lines) {
      const match = line.match(/video_id.*?'([^']+)'/);
      if (match) {
        videoIds.add(match[1]);
      }
    }

    console.log('\n🔍 Found video IDs in SQL file:\n');
    videoIds.forEach(id => {
      if (id.startsWith('tt')) {
        console.log(`${id} → IMDb ID (https://www.imdb.com/title/${id}/)`);
      } else if (/^\d+$/.test(id)) {
        console.log(`${id} → TMDB ID (https://www.themoviedb.org/movie/${id})`);
      } else {
        console.log(`${id} → Unknown format`);
      }
    });

    console.log(`\n💡 Found ${videoIds.size} unique video IDs`);
    console.log('   Use --platform <name> with each ID to get mapping instructions\n');
  }
}

/**
 * Main CLI
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    tmdb: null,
    imdb: null,
    platform: null,
    title: null,
    sqlFile: null,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  const mapper = new PlatformMapper();

  if (options.sqlFile) {
    await mapper.processSQLFile(options.sqlFile);
  } else if (options.tmdb || options.imdb || options.platform || options.title) {
    await mapper.interactiveHelper(options);
  } else {
    console.log('\n🎬 Platform ID Mapper - Usage\n');
    console.log('Find platform-specific video IDs from TMDB/IMDb IDs\n');
    console.log('Examples:');
    console.log('  # Get Netflix ID for a TMDB ID');
    console.log('  node scripts/platform-id-mapper.js --tmdb 603 --platform netflix\n');
    console.log('  # Get Prime Video ID for an IMDb ID');
    console.log('  node scripts/platform-id-mapper.js --imdb tt0133093 --platform primevideo\n');
    console.log('  # Process all IDs in a SQL file');
    console.log('  node scripts/platform-id-mapper.js --sql-file database/dtdd-import.sql\n');
    console.log('  # Get general info with title');
    console.log('  node scripts/platform-id-mapper.js --title "The Matrix" --tmdb 603\n');
    console.log('Options:');
    console.log('  --tmdb       TMDB ID');
    console.log('  --imdb       IMDb ID (e.g., tt0133093)');
    console.log('  --platform   Platform name (netflix, youtube, etc.)');
    console.log('  --title      Movie/show title (for context)');
    console.log('  --sql-file   Analyze SQL file and list IDs\n');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = PlatformMapper;
