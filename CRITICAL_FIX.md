# 🚨 CRITICAL: Extension Not Loading

## The Problem

Your extension isn't working because of one of these issues:

### 1. Loading Wrong Folder (MOST COMMON)
**You MUST load the `dist` folder, NOT the root folder!**

```bash
# Correct path to load:
/home/user/triggerwarnings/dist

# WRONG paths (don't use these):
/home/user/triggerwarnings
~/triggerwarnings
```

### 2. Stale Cache
Chrome may be caching old version.

## Quick Fix Steps

### Step 1: Clean Build
```bash
cd /home/user/triggerwarnings
rm -rf dist
npm run build
```

### Step 2: Remove Extension
1. Go to `chrome://extensions/`
2. Find "Trigger Warnings"
3. Click **Remove**
4. Confirm removal

### Step 3: Reload Extension
1. Still on `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Navigate to and select: `/home/user/triggerwarnings/dist`
5. **NOT** the root `/home/user/triggerwarnings` folder!

### Step 4: Verify Loading
Extension card should show:
- Name: "Trigger Warnings"
- Version: "2.0.0"
- ID: (some random string)
- **service worker** link (clickable - click it to check for errors)

### Step 5: Test Popup
1. Click extension icon in toolbar
2. Popup should open showing:
   - Profile selector dropdown at top
   - Three tabs: Quick Add, Settings, Info
   - No console errors (right-click popup → Inspect → check Console tab)

### Step 6: Enable Some Triggers (CRITICAL!)
**The extension won't show any warnings if no categories are enabled!**

1. In popup, click "Settings" tab
2. Scroll to "Enabled Trigger Categories"
3. Click on several category cards to enable them:
   - Violence
   - Blood/Gore
   - Jump Scares
   - Sexual Content
4. Enabled cards should have **thick purple border** and gradient background

### Step 7: Test on Video Page
1. Go to a streaming platform:
   - Netflix watch page
   - YouTube video
   - etc.
2. Open DevTools (F12)
3. Check Console for initialization logs:
   ```
   [TW Provider] Initializing [Platform] provider
   [TW WarningManager] Initializing warning manager
   [TW BannerManager] Initializing banner manager
   ```
4. Look for purple "TW Active" button in corner of page

## Troubleshooting Specific Issues

### "Gap errors on buttons"
This means you're seeing the OLD version. Steps:
1. Remove extension completely
2. Clear browser cache: Ctrl+Shift+Delete → check "Cached images and files"
3. Rebuild: `npm run build`
4. Reload from `dist` folder

### "Supabase errors when adding preferences"
Check background service worker console:
1. Go to `chrome://extensions/`
2. Click "service worker" link under extension
3. Look for errors containing "Supabase"

Common Supabase errors:
- **"Missing Supabase credentials"** → The build failed. Run `npm run build` again
- **"Network error"** → Firewall blocking supabase.co. Check host_permissions in manifest
- **"Anonymous sign-in error"** → Supabase project might be paused. Extension will still work with local-only features

### "No overlay appears"
Checklist:
- ✅ Loaded `dist` folder (not root)
- ✅ At least one category enabled in settings
- ✅ On actual video watch page (not browse/home page)
- ✅ Video is playing or paused (not loading screen)
- ✅ Console shows initialization logs (F12 → Console)

If still no overlay:
- The database might not have warnings for this specific video
- Try testing on popular/mainstream content first
- SubtitleAnalyzer fallback requires closed captions to be available

## Checking Console Logs

### Background Service Worker Console
```
chrome://extensions/
→ Click "service worker" link
→ Look for:
  [TW Supabase] Initialized successfully
  [TW ProfileManager] Loaded profiles
```

### Popup Console
```
Right-click extension icon → click popup
Right-click popup window → Inspect
→ Look for:
  No errors about missing files
  Profile data loading correctly
```

### Content Script Console (Video Page)
```
F12 on video page → Console tab
→ Look for:
  [TW Provider] Initializing [platform] provider
  [TW WarningManager] Initializing
  [TW BannerManager] Container injected into DOM
  [TW SubtitleAnalyzer] Initialized with X keyword patterns
```

## What Should Work After Latest Build

### ✅ Popup Improvements
- No scrolling in popup window (height optimized to 580px)
- Reset timestamp buttons:
  - "↺ Reset Start" button
  - "↺ Reset End" button
  - "⟲ Reset Both" button (full width)
- Live timestamp updates (updates every 500ms)
- Enhanced error messages with warning icon and gradient
- Compact layout fits all content without gaps

### ✅ Overlay Improvements
- Positioned 16px from top (was 20px)
- Support for "Top Center" and "Bottom Center" positioning
- Maintains center position in fullscreen mode
- Purple/violet "TW Active" indicator

### ✅ Settings Improvements
- Category cards show clear enabled/disabled state
- Thick purple border when enabled
- Gradient background on selected categories
- Better visual feedback

## Still Not Working?

Provide these details:

1. **Which folder did you load?**
   - Output of: `pwd` when selecting folder

2. **Console errors:**
   - Background service worker console (screenshot)
   - Popup console errors (screenshot)
   - Video page console errors (screenshot)

3. **Extension info:**
   - Go to `chrome://extensions/`
   - Screenshot of the extension card

4. **Build output:**
   ```bash
   npm run build 2>&1 | tail -20
   ```

5. **File verification:**
   ```bash
   ls -lh dist/src/popup/index.js
   ls -lh dist/src/content/index.js
   ls -lh dist/manifest.json
   ```

All three should exist with sizes > 1KB.
