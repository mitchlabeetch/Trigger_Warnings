# 🚀 Fresh Start Setup Guide - Trigger Warnings Extension

This is your complete, step-by-step guide to set up and test the Trigger Warnings extension from scratch.

---

## 📋 Table of Contents

1. [Environment Setup](#environment-setup)
2. [Database Setup](#database-setup)
3. [Extension Build & Installation](#extension-build--installation)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## 1. Environment Setup

### A. Supabase Credentials

**✅ GOOD NEWS**: Supabase credentials are already hardcoded in the extension at:
- File: `src/shared/constants/defaults.ts` (lines 46-48)
- No additional `.env` file needed for the extension itself

```typescript
// Already configured in the extension:
export const SUPABASE_URL = 'https://rzkynplgzcxlaecxlylm.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjE2OTAsImV4cCI6MjA3ODI5NzY5MH0.24lj8QXRK-FS8uQQRtA4H--laEDosdGBCGXnmmnWg_8';
```

### B. Optional: Scripts Environment File

**Only needed if you plan to run data import scripts** (not required for testing).

Create file: `/home/user/triggerwarnings/scripts/.env`

```env
# Supabase Configuration
SUPABASE_URL=https://rzkynplgzcxlaecxlylm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjE2OTAsImV4cCI6MjA3ODI5NzY5MH0.24lj8QXRK-FS8uQQRtA4H--laEDosdGBCGXnmmnWg_8

# Does the Dog Die API Configuration (optional)
DTDD_API_KEY=your_api_key_here

# Quality Thresholds
CONFIDENCE_THRESHOLD=0.7
MIN_VOTES=5

# Rate Limiting
REQUEST_DELAY_MS=1000

# Output Settings
OUTPUT_FORMAT=sql
OUTPUT_DIR=../database
```

**Note**: This file is gitignored and will stay local only.

---

## 2. Database Setup

### Step 1: Access Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/rzkynplgzcxlaecxlylm
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Run the Seed Data Script

Copy and paste the **complete SQL script below** into the SQL Editor:

```sql
-- =====================================================
-- SEED TEST DATA FOR YOUTUBE VIDEO
-- Video: https://www.youtube.com/watch?v=ZKCmFcMR2tU
-- =====================================================
-- This seed data is for testing the Trigger Warnings extension
-- with various trigger categories and time ranges.
-- =====================================================

-- Clear existing test data for this video (if any)
DELETE FROM trigger_votes WHERE trigger_id IN (
  SELECT id FROM triggers WHERE video_id = 'ZKCmFcMR2tU' AND platform = 'youtube'
);
DELETE FROM triggers WHERE video_id = 'ZKCmFcMR2tU' AND platform = 'youtube';

-- =====================================================
-- NOTE: No need to disable triggers anymore!
-- The increment_user_submissions() function now handles NULL values gracefully
-- =====================================================

-- =====================================================
-- SEED TRIGGERS FOR TEST VIDEO
-- =====================================================

-- Violence (multiple instances)
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'violence',
  45,
  67,
  'Physical altercation with punching',
  85,
  'approved',
  12,
  NULL,
  NOW() - INTERVAL '7 days'
),
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'violence',
  180,
  210,
  'Intense fight scene',
  90,
  'approved',
  8,
  NULL,
  NOW() - INTERVAL '6 days'
);

-- Blood and Gore
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'blood',
  72,
  95,
  'Visible blood from injury',
  80,
  'approved',
  15,
  NULL,
  NOW() - INTERVAL '5 days'
),
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'gore',
  320,
  345,
  'Graphic injury detail',
  75,
  'approved',
  6,
  NULL,
  NOW() - INTERVAL '5 days'
);

-- Flashing Lights (Photosensitivity)
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'flashing_lights',
  120,
  135,
  'Rapid strobe effects during party scene',
  95,
  'approved',
  20,
  NULL,
  NOW() - INTERVAL '4 days'
);

-- Jumpscares
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'jumpscares',
  240,
  242,
  'Sudden loud sound with quick cut',
  88,
  'approved',
  18,
  NULL,
  NOW() - INTERVAL '3 days'
),
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'jumpscares',
  380,
  383,
  'Unexpected appearance with scream',
  92,
  'approved',
  14,
  NULL,
  NOW() - INTERVAL '3 days'
);

-- Drugs and Alcohol
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'drugs',
  155,
  190,
  'Drug use depicted on screen',
  82,
  'approved',
  9,
  NULL,
  NOW() - INTERVAL '2 days'
);

-- Swearing
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'swear_words',
  28,
  32,
  'Strong language',
  90,
  'approved',
  5,
  NULL,
  NOW() - INTERVAL '2 days'
),
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'swear_words',
  98,
  102,
  'Multiple expletives',
  88,
  'approved',
  7,
  NULL,
  NOW() - INTERVAL '1 day'
);

-- Detonations/Bombs
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'detonations_bombs',
  265,
  285,
  'Explosion with loud sound',
  91,
  'approved',
  16,
  NULL,
  NOW() - INTERVAL '1 day'
);

-- Vomit
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'vomit',
  420,
  428,
  'Character vomiting on screen',
  79,
  'approved',
  4,
  NULL,
  NOW() - INTERVAL '12 hours'
);

-- Spiders/Snakes
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'spiders_snakes',
  305,
  315,
  'Close-up of spider',
  86,
  'approved',
  11,
  NULL,
  NOW() - INTERVAL '6 hours'
);

-- Medical Procedures
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'medical_procedures',
  450,
  475,
  'Needle injection shown',
  83,
  'approved',
  10,
  NULL,
  NOW() - INTERVAL '3 hours'
);

-- Pending trigger (for testing moderation)
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'torture',
  500,
  530,
  'Intense interrogation scene',
  70,
  'pending',
  0,
  NULL,
  NOW() - INTERVAL '1 hour'
);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Check that data was inserted correctly
SELECT
  category_key,
  start_time,
  end_time,
  description,
  score,
  status,
  created_at
FROM triggers
WHERE video_id = 'ZKCmFcMR2tU' AND platform = 'youtube'
ORDER BY start_time;

-- Display summary
SELECT
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) as total_count
FROM triggers
WHERE video_id = 'ZKCmFcMR2tU' AND platform = 'youtube';

```

### Step 3: Click "Run" or Press Ctrl+Enter

You should see:
- ✅ Success message
- ✅ A results table showing 15 rows (14 approved + 1 pending)

### Step 4: Verify the Data

The verification query at the end shows your inserted triggers:

| Time | Category | Status | Score |
|------|----------|--------|-------|
| 0:28-0:32 | swear_words | approved | 5 |
| 0:45-1:07 | violence | approved | 12 |
| 1:12-1:35 | blood | approved | 15 |
| 1:38-1:42 | swear_words | approved | 7 |
| 2:00-2:15 | flashing_lights | approved | 20 |
| 2:35-3:10 | drugs | approved | 9 |
| 3:00-3:30 | violence | approved | 8 |
| 4:00-4:02 | jumpscares | approved | 18 |
| 4:25-4:45 | detonations_bombs | approved | 16 |
| 5:05-5:15 | spiders_snakes | approved | 11 |
| 5:20-5:45 | gore | approved | 6 |
| 6:20-6:23 | jumpscares | approved | 14 |
| 7:00-7:08 | vomit | approved | 4 |
| 7:30-7:55 | medical_procedures | approved | 10 |
| 8:20-8:50 | torture | pending | 0 |

---

## 3. Extension Build & Installation

### Step 1: Clean and Rebuild

```bash
# Navigate to project directory
cd /home/user/triggerwarnings

# Install dependencies (if not already installed)
npm install

# Build the extension
npm run build
```

**Expected Output:**
```
✓ Building src/background/index.ts (1/4)
✓ Building src/options/index.html (2/4)
✓ Building src/popup/index.html (3/4)
✓ Building src/content/index.ts (4/4)
✓ All steps completed.
```

### Step 2: Load Extension in Chrome

1. **Open Chrome Extensions Page:**
   - Navigate to: `chrome://extensions/`
   - **OR** Menu → More Tools → Extensions

2. **Enable Developer Mode:**
   - Toggle the switch in the top-right corner

3. **Load the Extension:**
   - Click **"Load unpacked"**
   - Navigate to: `/home/user/triggerwarnings/dist`
   - Click **"Select Folder"**

4. **Verify Installation:**
   - ✅ Extension appears in the list
   - ✅ Extension icon appears in Chrome toolbar
   - ✅ No errors shown

### Step 3: Reload Extension (if already installed)

If you previously had the extension installed:
1. Find "Trigger Warnings" in `chrome://extensions/`
2. Click the **reload icon** (circular arrow)
3. Verify "Version 2.0.0" is displayed

---

## 4. Testing

### Phase 1: Verify Content Script Loads

1. **Open the Test Video:**
   ```
   https://www.youtube.com/watch?v=ZKCmFcMR2tU
   ```

2. **Open Developer Console:**
   - Press **F12** or Right-click → Inspect
   - Click **"Console"** tab

3. **Look for Initialization Logs:**

   **✅ SUCCESS - You should see:**
   ```
   🚀 [TW] Content script file loaded at: [timestamp]
   🌐 [TW] Current URL: https://www.youtube.com/watch?v=ZKCmFcMR2tU
   📍 [TW] Document ready state: [state]
   🎬 [TW] Starting initialization...
   🔍 [TW] Checking if site is supported...
   ✅ [TW] Site is supported
   🏭 [TW] Creating provider...
   ✅ [TW] Provider created: YouTube
   🎉 [TW] Content script initialized successfully!
   ```

   **❌ FAILURE - If you see nothing:**
   - Content script is not loading
   - See [Troubleshooting](#troubleshooting) section

### Phase 2: Verify Extension Popup

1. **Click the Trigger Warnings icon** in Chrome toolbar

2. **You should see:**
   - ✅ Popup window opens (not blank)
   - ✅ Active profile displayed
   - ✅ Timer showing current video time (should be counting)
   - ✅ "Submit Warning" form visible

3. **Check Timer:**
   - Timer should start at 0:00 and count up
   - Should match YouTube video playback time

### Phase 3: Verify Trigger Warnings Display

1. **Enable Test Categories:**
   - Click extension icon → **"Settings"** button
   - Enable these categories:
     - ✅ Violence
     - ✅ Blood
     - ✅ Swear Words
     - ✅ Flashing Lights
     - ✅ Jumpscares
   - Click **"Save"**

2. **Test Warning Display:**
   - Go back to: https://www.youtube.com/watch?v=ZKCmFcMR2tU
   - Start playing the video
   - Seek to **0:18** (10 seconds before first warning at 0:28)

3. **Expected Behavior:**

   **At 0:18 (10 seconds before trigger):**
   - ✅ Warning banner appears at top of video
   - ✅ Shows: "⚠️ Swear Words - Strong language"
   - ✅ Countdown: "In 10 seconds"
   - ✅ Banner disappears after 5 seconds

   **At 0:35 (10 seconds before violence):**
   - ✅ New warning: "⚠️ Violence - Physical altercation with punching"
   - ✅ Countdown: "In 10 seconds"

### Phase 4: Test Multiple Triggers

**Quick Test Timeline:**
1. **0:28** → Swear Words warning (at 0:18)
2. **0:45** → Violence warning (at 0:35)
3. **1:12** → Blood warning (at 1:02)
4. **2:00** → Flashing Lights warning (at 1:50) ⚠️ HIGH SCORE
5. **4:00** → Jumpscare warning (at 3:50)

### Phase 5: Test Settings

1. **Disable a Category:**
   - Go to Settings
   - Disable "Violence"
   - Save and reload video

2. **Expected:**
   - ✅ Violence warnings no longer appear
   - ✅ Other warnings still work

3. **Test Lead Time:**
   - Change lead time to 5 seconds (instead of 10)
   - Warnings should appear 5 seconds before triggers

### Phase 6: Test Warning Submission

1. **Open Extension Popup**
2. **Fill out "Submit Warning" form:**
   - Category: Select any (e.g., "Spiders/Snakes")
   - Start Time: Set to current video time
   - End Time: +10 seconds
   - Description: "Test submission"
3. **Click "Submit"**

4. **Expected:**
   - ✅ Success message appears
   - ✅ No errors in console

---

## 5. Troubleshooting

### Issue: No Console Logs Appear

**Symptom:** No 🚀 emoji logs, completely silent

**Solutions:**

1. **Check Extension is Loaded:**
   ```
   chrome://extensions/
   ```
   - Verify Trigger Warnings is enabled
   - Check for any error messages

2. **Check URL Pattern:**
   - Must be: `youtube.com/watch?v=...`
   - NOT: `youtube.com` (homepage)
   - NOT: `youtu.be/...` (short link)

3. **Hard Reload:**
   - Press: `Ctrl + Shift + R` (Windows/Linux)
   - OR: `Cmd + Shift + R` (Mac)

4. **Check Manifest Injection Timing:**
   ```bash
   # Verify manifest has document_end
   cat dist/manifest.json | jq '.content_scripts[6]'
   ```
   Should show: `"run_at": "document_end"`

5. **Rebuild Extension:**
   ```bash
   npm run build
   # Then reload in chrome://extensions/
   ```

### Issue: Warnings Don't Appear

**Symptom:** Console logs work, but no warning banners

**Solutions:**

1. **Check Categories Are Enabled:**
   - Open Settings
   - Verify categories are toggled ON
   - Click Save

2. **Check Console for API Errors:**
   - Look for errors mentioning "Supabase" or "fetch"
   - Check network tab for failed requests

3. **Verify Database Data:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT COUNT(*) FROM triggers
   WHERE video_id = 'ZKCmFcMR2tU'
   AND platform = 'youtube'
   AND status = 'approved';
   ```
   Should return: 14

4. **Check Lead Time:**
   - Warnings appear BEFORE triggers (default: 10 seconds)
   - If video is at 0:25, you missed the 0:28 warning
   - Seek back to 0:15 and replay

### Issue: Timer Stays at 0:00

**Symptom:** Extension loads but timer doesn't count

**Solutions:**

1. **Check Video Element Detection:**
   - Console should show: `[TW YouTube] Video element found successfully`
   - If not, video detection failed

2. **Check for Console Errors:**
   - Look for red error messages
   - Common: "Cannot read property of null"

3. **Refresh Page:**
   - Sometimes YouTube's SPA navigation confuses the extension
   - Hard refresh: `Ctrl + Shift + R`

### Issue: Database Permission Errors

**Symptom:** Console shows "RLS policy" or "permission denied"

**Solutions:**

1. **Check Anonymous Auth is Enabled:**
   - Go to: https://supabase.com/dashboard/project/rzkynplgzcxlaecxlylm/auth/settings
   - Verify "Enable anonymous sign-ins" is ON

2. **Temporary: Disable RLS (Testing Only):**
   ```sql
   -- Run in Supabase SQL Editor
   ALTER TABLE triggers DISABLE ROW LEVEL SECURITY;
   ```
   **⚠️ Warning:** Re-enable for production!

### Issue: Popup is Blank

**Symptom:** Extension icon works but popup is empty

**Solutions:**

1. **Check Console Errors:**
   - Right-click extension icon → "Inspect popup"
   - Check console for errors

2. **Verify Build Output:**
   ```bash
   ls -lh dist/src/popup/
   # Should show index.html and index.js
   ```

3. **Rebuild:**
   ```bash
   npm run build
   # Reload extension
   ```

### Issue: Build Fails

**Symptom:** `npm run build` shows errors

**Common Solutions:**

1. **Clear Node Modules:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check Node Version:**
   ```bash
   node --version
   # Should be v18 or higher
   ```

3. **Check for TypeScript Errors:**
   ```bash
   npm run type-check
   ```

---

## 📊 Quick Reference

### Test Video
```
https://www.youtube.com/watch?v=ZKCmFcMR2tU
```

### Supabase Dashboard
```
https://supabase.com/dashboard/project/rzkynplgzcxlaecxlylm
```

### Extension Location
```
/home/user/triggerwarnings/dist
```

### Key Commands
```bash
# Build extension
npm run build

# Type check
npm run type-check

# Clean rebuild
rm -rf dist && npm run build
```

### First Warning Time
```
Video Time: 0:28 (swear words)
Warning Appears: 0:18 (10 seconds before)
```

---

## ✅ Success Checklist

- [ ] Database seed data applied (15 triggers inserted)
- [ ] Extension built successfully
- [ ] Extension loaded in Chrome
- [ ] Console logs appear with 🚀 emoji
- [ ] Extension popup opens and shows timer
- [ ] Timer counts up with video
- [ ] Warning banner appears at 0:18
- [ ] Warning shows correct category and description
- [ ] Multiple warnings work throughout video
- [ ] Settings can enable/disable categories
- [ ] Submit warning form works

---

## 🎯 Next Steps After Testing

Once everything works:

1. **Test Other Platforms:**
   - Add seed data for Netflix, Prime Video, etc.
   - Test on those platforms

2. **Test Advanced Features:**
   - Voting on triggers
   - Submitting new warnings
   - Profile switching
   - Different warning actions (pause, mute)

3. **Performance Testing:**
   - Long videos (2+ hours)
   - Many triggers (50+)
   - Multiple tabs open

4. **User Experience:**
   - Overlay positioning
   - Banner styling
   - Sound notifications
   - Spoiler-free mode

---

## 📞 Support

If you encounter issues not covered in troubleshooting:

1. Check browser console for error messages
2. Check Supabase logs in dashboard
3. Verify all steps were followed exactly
4. Try with a fresh Chrome profile (to rule out extension conflicts)

---

**Last Updated:** 2025-11-11
**Extension Version:** 2.0.0
**Critical Fix Applied:** Content script injection timing (document_end)
