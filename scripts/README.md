# Data Import Scripts

This directory contains scripts to import trigger warning data into the database.

## Overview

We support importing trigger warning data from IMDb Parental Guide (via Kaggle dataset). This provides community-sourced trigger warnings for thousands of movies and TV shows.

## ⚠️ Important Limitations

1. **No Timestamps**: Imported data only indicates IF a trigger exists, not WHEN it occurs
2. **No Platform IDs**: Data uses IMDb IDs, which need to be mapped to platform-specific video IDs
3. **General Warnings**: Imported warnings will have placeholder timestamps (0 to end) and need manual refinement

These limitations are solved by:
- **Real-time subtitle analysis**: Provides exact timestamps through keyword detection
- **Community submissions**: Users can submit precise timestamps
- **Translation support**: Works on any language content

## Prerequisites

1. **Node.js**: The import scripts require Node.js (v14+)
2. **IMDb Dataset**: Download from Kaggle (see below)

## Files

- `imdb-parser.js` - IMDb Parental Guide CSV parser
- `platform-id-mapper.js` - Helper to map IMDb IDs to platform IDs
- `quickstart.sh` - Interactive menu for common operations
- `popular-movies.txt` - Sample list of popular movies
- `README.md` - This file

## Data Sources

### IMDb Parental Guide (Kaggle)

**Dataset**: https://www.kaggle.com/datasets/barryhaworth/imdb-parental-guide

**What it provides:**
- 5,000+ titles (movies and TV shows)
- 5 severity categories: Violence, Gore, Profanity, Alcohol, Frightening
- Severity ratings: None, Mild, Moderate, Severe, Extreme

**Usage:**

```bash
# Download CSV from Kaggle first
# Then run:
node scripts/imdb-parser.js \
  --csv path/to/imdb-parental-guide.csv \
  --output sql \
  --limit 1000
```

This will:
1. Parse the CSV file
2. Map severity ratings to confidence scores
3. Map IMDb categories to our trigger categories
4. Generate SQL INSERT statements
5. Save to `database/imdb-import-TIMESTAMP.sql`

## Category Mapping

### IMDb → Our Categories

The parser maps IMDb's 5 categories to our 28 trigger categories:

```javascript
{
  violence: 'violence',        // IMDb Violence → violence
  gore: 'gore',                // IMDb Gore → gore
  profanity: 'discrimination', // IMDb Profanity → discrimination
  alcohol: 'drugs',            // IMDb Alcohol → drugs
  frightening: 'medical_procedures' // IMDb Frightening → medical_procedures
}
```

### Severity → Confidence

IMDb severity ratings are converted to confidence scores (0-100):

| Severity | Confidence | Notes |
|----------|-----------|-------|
| None     | 0%        | Skipped (not imported) |
| Mild     | 25%       | Low confidence |
| Moderate | 50%       | Medium confidence |
| Severe   | 75%       | High confidence |
| Extreme  | 90%       | Very high confidence |

## Quickstart

Use the interactive menu:

```bash
chmod +x scripts/quickstart.sh
./scripts/quickstart.sh
```

**Options:**
1. Import from IMDb Parental Guide CSV
2. Process SQL file for platform mapping
3. Exit

## Platform ID Mapping

After importing, you need to map IMDb IDs to platform-specific video IDs.

### Using the Platform Mapper

```bash
node scripts/platform-id-mapper.js \
  --sql-file database/imdb-import-TIMESTAMP.sql \
  --platform netflix
```

This will analyze the SQL file and show you:
- How many entries need mapping
- Platform-specific instructions
- Example mappings

### Platform-Specific IDs

| Platform | ID Format | Example | How to Find |
|----------|-----------|---------|-------------|
| Netflix | Numeric | `80154610` | URL: netflix.com/watch/80154610 |
| YouTube | Video ID | `dQw4w9WgXcQ` | URL: youtube.com/watch?v=dQw4w9WgXcQ |
| Prime Video | ASIN | `B01M63W2LZ` | URL or page source |
| Hulu | Numeric/slug | `the-matrix` | URL path |
| Disney+ | GUID | Various formats | URL or API |
| Max | Slug | `game-of-thrones` | URL path |
| Peacock | Numeric | Various | URL or API |

## Output Format

### SQL Output

Generated SQL files contain INSERT statements:

```sql
INSERT INTO triggers (
  video_id, platform, category_key,
  start_time, end_time, description,
  confidence_level, status, submitted_by
) VALUES (
  'tt0133093',           -- IMDb ID (needs platform mapping)
  'unknown',             -- Platform (needs manual update)
  'violence',            -- Mapped category
  0,                     -- Start time (placeholder)
  999999,                -- End time (placeholder)
  'Severe violence',     -- Description from IMDb
  75,                    -- Confidence (75% = "Severe")
  'approved',            -- Auto-approved (from trusted source)
  'imdb-import'          -- Source identifier
);
```

## Post-Processing Workflow

1. **Import data** using IMDb parser
2. **Review SQL file** - Check categories and confidence scores
3. **Map platform IDs** - Convert IMDb IDs to platform-specific IDs
4. **Add timestamps** - Replace placeholders with actual times (optional)
5. **Import to database** - Load SQL into Supabase

## Best Practices

### Quality Control

- **Review imports** before loading to production database
- **Test with small batches** (limit=100) first
- **Verify category mappings** make sense for your use case
- **Add user feedback** mechanism to improve data quality

### Performance

- **Batch imports** in chunks of 1000-5000 entries
- **Use transactions** when importing to database
- **Index properly** on video_id and platform for fast queries

### Maintenance

- **Regular updates** - Re-import periodically for new content
- **Community feedback** - Let users correct/improve warnings
- **Timestamp refinement** - Encourage community timestamp submissions

## Troubleshooting

### "File not found" error

```bash
# Verify file path
ls -la path/to/file.csv

# Use absolute path
node scripts/imdb-parser.js --csv /full/path/to/file.csv
```

### No output generated

```bash
# Check if CSV is valid
head -5 path/to/file.csv

# Try with verbose logging
node scripts/imdb-parser.js --csv file.csv --output sql --limit 10
```

### Invalid IMDb IDs

The platform mapper helps identify which IDs need manual mapping:

```bash
node scripts/platform-id-mapper.js --sql-file database/imdb-import-*.sql --platform netflix
```

## Data Privacy

**What we import:**
- IMDb ID
- Category/severity information
- Public parental guide descriptions

**What we DON'T import:**
- User viewing history
- Personal information
- Video content

All imported data is publicly available parental guidance information.

## Contributing

Help improve the import scripts:

1. **Better category mappings** - Submit PRs to improve IMDb → TW category mapping
2. **New data sources** - Add parsers for other public datasets
3. **Automation** - Scripts to auto-map platform IDs
4. **Quality improvements** - Better confidence scoring algorithms

## Future Enhancements

- [ ] Automated platform ID mapping via TMDB/IMDb APIs
- [ ] Multi-language support for IMDb descriptions
- [ ] Timestamp estimation from subtitle analysis
- [ ] Automatic deduplication of similar warnings
- [ ] Machine learning for category prediction

## Support

- **Documentation**: See main README.md
- **Issues**: https://github.com/lightmyfireadmin/triggerwarnings/issues
- **Dataset Issues**: Report to Kaggle dataset maintainers

---

**Remember**: Imported data provides broad coverage but lacks precision. Real-time subtitle analysis and community submissions provide the exact timestamps users need.
