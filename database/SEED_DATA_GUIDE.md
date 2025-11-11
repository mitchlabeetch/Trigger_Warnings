# Seed Test Data Guide

## Overview
This guide explains how to use the seed test data for the Trigger Warnings extension.

## Files Created

### 1. `/scripts/.env`
Contains Supabase credentials and configuration:
- **SUPABASE_URL**: https://rzkynplgzcxlaecxlylm.supabase.co
- **SUPABASE_ANON_KEY**: Your anonymous key for database access

### 2. `/database/seed-test-data.sql`
Test data for YouTube video: https://www.youtube.com/watch?v=ZKCmFcMR2tU

## Applying the Seed Data

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project:**
   - Visit https://supabase.com/dashboard
   - Navigate to your project: rzkynplgzcxlaecxlylm

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste the contents of `seed-test-data.sql`**

4. **Run the query:**
   - Click "Run" or press `Ctrl+Enter`
   - You should see success messages confirming the data was inserted

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref rzkynplgzcxlaecxlylm

# Run the seed file
supabase db execute -f database/seed-test-data.sql
```

### Option 3: Using psql (Direct PostgreSQL Connection)

```bash
# Get your database connection string from Supabase dashboard
# Then run:
psql "your-connection-string-here" -f database/seed-test-data.sql
```

## What's in the Seed Data?

The seed data includes **15 triggers** across **14 categories** for comprehensive testing:

| Time Range | Category | Description | Score |
|------------|----------|-------------|-------|
| 0:28-0:32 | Swear Words | Strong language | 5 |
| 0:45-1:07 | Violence | Physical altercation | 12 |
| 1:12-1:35 | Blood | Visible blood from injury | 15 |
| 1:38-1:42 | Swear Words | Multiple expletives | 7 |
| 2:00-2:15 | Flashing Lights | Rapid strobe effects | 20 |
| 2:35-3:10 | Drugs | Drug use depicted | 9 |
| 3:00-3:30 | Violence | Intense fight scene | 8 |
| 4:00-4:02 | Jumpscares | Sudden loud sound | 18 |
| 4:25-4:45 | Detonations/Bombs | Explosion | 16 |
| 5:05-5:15 | Spiders/Snakes | Close-up of spider | 11 |
| 5:20-5:45 | Gore | Graphic injury | 6 |
| 6:20-6:23 | Jumpscares | Unexpected appearance | 14 |
| 7:00-7:08 | Vomit | Character vomiting | 4 |
| 7:30-7:55 | Medical Procedures | Needle injection | 10 |
| 8:20-8:50 | Torture | Interrogation scene | 0 (Pending) |

## Testing the Extension

1. **Rebuild the extension:**
   ```bash
   npm run build
   ```

2. **Reload extension in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click reload icon for Trigger Warnings

3. **Navigate to the test video:**
   - Open https://www.youtube.com/watch?v=ZKCmFcMR2tU
   - The extension should load (check console for 🚀 logs)

4. **What to expect:**
   - Extension popup should show active profile
   - Timer should start counting
   - Warnings should appear as you reach trigger timestamps
   - Banner should display with category and description

5. **Test different scenarios:**
   - Enable/disable specific categories in settings
   - Try different warning actions (warn, pause, mute)
   - Test overlay positioning options
   - Submit new warnings through the popup

## Verifying the Data

After applying the seed data, verify it worked:

### Check in Supabase Dashboard:
1. Go to "Table Editor"
2. Select the "triggers" table
3. Filter by `video_id = 'ZKCmFcMR2tU'`
4. You should see 15 rows

### Check via SQL:
```sql
SELECT
  category_key,
  start_time,
  end_time,
  description,
  score,
  status
FROM triggers
WHERE video_id = 'ZKCmFcMR2tU'
  AND platform = 'youtube'
ORDER BY start_time;
```

## Cleaning Up Test Data

To remove the test data when done:

```sql
-- Remove votes first (foreign key constraint)
DELETE FROM trigger_votes
WHERE trigger_id IN (
  SELECT id FROM triggers
  WHERE video_id = 'ZKCmFcMR2tU' AND platform = 'youtube'
);

-- Remove triggers
DELETE FROM triggers
WHERE video_id = 'ZKCmFcMR2tU' AND platform = 'youtube';
```

## Troubleshooting

### "Permission denied" error
- Make sure you're using the correct Supabase credentials
- Check that Row Level Security (RLS) policies allow inserts
- You may need to temporarily disable RLS for testing

### "Relation does not exist" error
- Run the schema.sql first to create tables
- Verify you're connected to the correct database

### Extension not showing warnings
- Check browser console for errors
- Verify the extension loaded (look for 🚀 emoji logs)
- Make sure you're on the exact URL: youtube.com/watch?v=ZKCmFcMR2tU
- Verify triggers are in "approved" status
- Check that categories are enabled in your profile

## Next Steps

Once the seed data is working:
1. Test all trigger categories
2. Test the voting system
3. Test submitting new warnings
4. Test the moderation workflow (pending triggers)
5. Add more test data for Netflix, Prime Video, etc.
