# DTDD Data Import Scripts

This directory contains scripts to import trigger warning data from the "Does the Dog Die" (DTDD) API into our database.

## Overview

The DTDD API provides community-sourced trigger warnings for movies and TV shows. We can use this data to seed our database with trigger warnings for popular content.

## ⚠️ Important Limitations

1. **No Timestamps**: DTDD only indicates IF a trigger exists, not WHEN it occurs in the content
2. **No Platform IDs**: DTDD uses TMDB/IMDb IDs, which need to be mapped to platform-specific video IDs
3. **General Warnings**: Imported warnings will have placeholder timestamps (0 to end) and need manual refinement

## Prerequisites

1. **DTDD API Key**: Get your API key from https://www.doesthedogdie.com/profile
2. **Node.js**: The scraper requires Node.js (v14+)

## Files

- `dtdd-scraper.js` - Main scraper script
- `dtdd-mapping.json` - Category mappings (DTDD topics → our categories)
- `popular-movies.txt` - Sample list of popular movies to import
- `README.md` - This file

## Usage

### 1. Search for a Single Movie

```bash
node scripts/dtdd-scraper.js \
  --api-key YOUR_API_KEY \
  --search "The Shawshank Redemption" \
  --output sql
```

This will:
1. Search DTDD for "The Shawshank Redemption"
2. Fetch all trigger warnings
3. Map them to our categories
4. Generate SQL INSERT statements
5. Save to `database/dtdd-import-TIMESTAMP.sql`

### 2. Search by IMDb ID

```bash
node scripts/dtdd-scraper.js \
  --api-key YOUR_API_KEY \
  --imdb tt0111161 \
  --output sql
```

### 3. Batch Import from File

```bash
node scripts/dtdd-scraper.js \
  --api-key YOUR_API_KEY \
  --batch scripts/popular-movies.txt \
  --output sql \
  --confidence 0.8 \
  --min-votes 10
```

This processes all movies in the file with higher quality thresholds.

### 4. Export as JSON

```bash
node scripts/dtdd-scraper.js \
  --api-key YOUR_API_KEY \
  --search "Inception" \
  --output json
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--api-key` | Your DTDD API key (required) | - |
| `--search` | Search by movie/show title | - |
| `--imdb` | Search by IMDb ID (e.g., tt0111161) | - |
| `--batch` | Process list from file (one title per line) | - |
| `--output` | Output format: `sql` or `json` | `sql` |
| `--confidence` | Minimum confidence (0.0-1.0) | 0.7 |
| `--min-votes` | Minimum total votes required | 5 |

## Category Mapping

The scraper maps DTDD topics to our categories automatically:

| Our Category | DTDD Topics (examples) |
|--------------|------------------------|
| `violence` | "blood", "someone is shot", "torture", etc. |
| `gore` | "gore", "body horror", "graphic violence" |
| `death` | "a main character dies", "suicide", "murder" |
| `animals` | "a dog dies", "animal cruelty", "a pet dies" |
| `sexual_content` | "sexual assault", "rape", "sex scenes" |
| `abuse` | "child abuse", "domestic abuse", "gaslighting" |
| `substance_abuse` | "drug use", "alcoholism", "drinking" |
| `mental_health` | "depression", "self harm", "panic attack" |
| `medical` | "needles", "surgery", "childbirth" |
| `discrimination` | "racism", "homophobia", "hate crime" |

See `dtdd-mapping.json` for the complete mapping.

## Output Format

### SQL Output

```sql
-- The Shawshank Redemption (1994)
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
  '278',  -- TMDB ID (placeholder)
  'unknown',
  'violence',
  0,  -- Placeholder start time
  999999,  -- Placeholder end time
  'A character is severely beaten',
  87,  -- Confidence percentage
  'approved',
  'dtdd-import',
  54,  -- Score based on yes/no votes
  false
);
```

### JSON Output

```json
[
  {
    "videoId": "278",
    "platform": "unknown",
    "categoryKey": "violence",
    "startTime": 0,
    "endTime": 999999,
    "description": "A character is severely beaten",
    "confidenceLevel": 87,
    "status": "approved",
    "submittedBy": "dtdd-import",
    "score": 54,
    "requiresModeration": false,
    "metadata": {
      "source": "dtdd",
      "topicName": "someone is punched/beaten-up",
      "yesVotes": 57,
      "noVotes": 3
    }
  }
]
```

## Post-Processing Steps

After running the scraper, you need to:

### 1. Map Video IDs to Platforms

The scraper uses TMDB/IMDb IDs as placeholders. You need to:

1. **For Netflix**: Use the Netflix video ID from the URL
   - Example: `https://www.netflix.com/watch/80117401` → `80117401`

2. **For YouTube**: Find the movie on YouTube and extract video ID
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → `dQw4w9WgXcQ`

3. **For Prime Video**: Use the Amazon ASIN
   - Example: `https://www.primevideo.com/detail/B00ABC123` → `B00ABC123`

4. **For others**: Similar platform-specific ID extraction

### 2. Add Timestamps

DTDD doesn't provide timestamps, so all warnings have placeholders:
- `start_time: 0`
- `end_time: 999999`

You need to:
1. Watch the content (or use existing resources)
2. Note when triggers actually occur
3. Update the timestamps in the SQL/database

### 3. Review Categories

While the mapping is comprehensive, some topics might map to multiple categories. Review and adjust as needed.

### 4. Import to Database

Once you've processed the data:

```bash
# Connect to Supabase SQL editor or psql
psql -h your-db-host -U postgres -d postgres < database/dtdd-import-TIMESTAMP.sql
```

Or use the Supabase dashboard SQL editor.

## Example Workflow

```bash
# 1. Export API key
export DTDD_API_KEY="your-api-key-here"

# 2. Test with a single movie
node scripts/dtdd-scraper.js \
  --api-key $DTDD_API_KEY \
  --search "The Matrix" \
  --output sql

# 3. Review the output
cat database/dtdd-import-*.sql

# 4. If it looks good, batch process popular movies
node scripts/dtdd-scraper.js \
  --api-key $DTDD_API_KEY \
  --batch scripts/popular-movies.txt \
  --output sql \
  --confidence 0.75 \
  --min-votes 8

# 5. Post-process the SQL file
# - Replace TMDB IDs with platform video IDs
# - Add real timestamps where known
# - Review categories

# 6. Import to Supabase
# Use Supabase SQL editor to run the import file
```

## Quality Thresholds

Recommended settings for different use cases:

### High Confidence (Production)
```bash
--confidence 0.8 \
--min-votes 10
```

### Moderate (Initial Seed)
```bash
--confidence 0.7 \
--min-votes 5
```

### Comprehensive (Include More)
```bash
--confidence 0.6 \
--min-votes 3
```

## Troubleshooting

### Error: HTTP 401
- Your API key is invalid or expired
- Get a new key from https://www.doesthedogdie.com/profile

### Error: HTTP 429
- Rate limited by DTDD
- The script includes 1-second delays between requests
- For large batches, run in smaller chunks

### No triggers found
- The movie/show might not be in DTDD database
- Try searching by IMDb ID instead of title
- Lower the confidence threshold

### Wrong category mappings
- Edit `dtdd-mapping.json` to adjust mappings
- Add new DTDD topics to the appropriate category arrays

## Extending the Scraper

### Add New Category Mappings

Edit `dtdd-mapping.json`:

```json
{
  "categoryMapping": {
    "your_category": [
      "dtdd topic 1",
      "dtdd topic 2"
    ]
  }
}
```

### Custom Processing

The scraper is modular. You can import and extend it:

```javascript
const DTDDScraper = require('./dtdd-scraper');

const scraper = new DTDDScraper('your-api-key');

// Custom processing
const results = await scraper.search('Movie Name');
const mediaData = await scraper.getMedia(results[0].id);
const processed = scraper.processTriggers(mediaData);

// Your custom logic here
```

## Next Steps

1. **Get API Key**: Sign up at https://www.doesthedogdie.com
2. **Test Script**: Run with a single movie
3. **Review Output**: Check SQL/JSON output
4. **Batch Import**: Process popular movies list
5. **Post-Process**: Add platform IDs and timestamps
6. **Import**: Load into Supabase database

## Support

For DTDD API issues: https://www.doesthedogdie.com/help
For scraper issues: Check the main project repository
