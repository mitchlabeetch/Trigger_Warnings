# Extension Loading Guide

## ⚠️ CRITICAL: Load the Correct Folder

**YOU MUST LOAD THE `dist` FOLDER, NOT THE ROOT FOLDER!**

### Steps to Load Extension:

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Open Chrome/Edge:**
   - Navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
   - Enable "Developer mode" (toggle in top right)

3. **Load the extension:**
   - Click "Load unpacked"
   - **Navigate to and select the `dist` folder** (NOT the root `triggerwarnings` folder!)
   - Path should be: `/home/user/triggerwarnings/dist`

4. **Verify it loaded:**
   - Check extension icon appears in toolbar
   - Extension should show "Trigger Warnings v2.0.0"

5. **If already loaded:**
   - Click the refresh icon on the extension card
   - Or remove and re-add from the `dist` folder

## Testing the Extension

### 1. Test Popup
- Click the extension icon in toolbar
- Popup should appear with profile selector and tabs
- No console errors should appear

### 2. Test on Streaming Platform
- Go to a video page on:
  - Netflix: `https://www.netflix.com/watch/[video-id]`
  - YouTube: `https://www.youtube.com/watch?v=[video-id]`
  - etc.

- You should see:
  - "TW Active" indicator in corner (purple/violet button)
  - Click it to see active warnings count
  - Warnings appear based on your profile settings

### 3. Enable Triggers in Settings
**THIS IS CRITICAL - Extension won't show warnings if no categories are enabled!**

1. Click extension icon → "Settings" tab
2. Scroll to "Enabled Trigger Categories"
3. **Click cards to enable categories** (they should have purple border when enabled)
4. Try enabling: Violence, Blood/Gore, Jump Scares for testing

### 4. Check Console for Errors
On video page:
- Press F12 to open DevTools
- Go to Console tab
- Look for logs starting with:
  - `[TW WarningManager]`
  - `[TW BannerManager]`
  - `[TW SubtitleAnalyzer]`
  - `[TW Provider]`

## Common Issues

### Issue: Popup doesn't open
**Solution:** You're loading the root folder instead of `dist`. Remove extension and reload from `dist` folder.

### Issue: No overlay appears on video
**Causes:**
1. **No triggers enabled in settings** → Enable some categories
2. **No warnings in database for this video** → Try well-known content
3. **Wrong URL pattern** → Must be on `/watch/` or `/watch?v=` URL
4. **Extension not loaded** → Check DevTools console for errors

### Issue: Supabase errors
**Causes:**
1. **Missing environment variables** → Check `.env` exists
2. **Network blocked** → Check host_permissions in manifest includes supabase
3. **Invalid credentials** → Verify Supabase keys are correct

### Issue: "Gap errors on buttons"
If buttons appear misaligned or overlapping:
1. Hard refresh the popup: Ctrl+Shift+R
2. Clear extension cache: Remove and re-add extension
3. Verify you're running latest build from `dist`

## Environment Setup

Make sure you have a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Build process will inject these into the compiled code.

## Debugging Steps

1. **Check manifest loaded correctly:**
   ```bash
   cat dist/manifest.json | grep service_worker
   # Should show: "service_worker":"src/background/index.js"
   ```

2. **Verify files exist:**
   ```bash
   ls -lh dist/src/popup/index.js
   ls -lh dist/src/content/index.js
   ls -lh dist/src/background/index.js
   # All should exist with significant file sizes
   ```

3. **Check for build errors:**
   ```bash
   npm run build 2>&1 | grep -i error
   # Should show no critical errors
   ```

4. **Inspect background service worker:**
   - Go to `chrome://extensions/`
   - Find "Trigger Warnings" extension
   - Click "service worker" link
   - Check console for errors

5. **Inspect content script:**
   - Go to video page
   - Press F12
   - Console should show initialization logs like:
     ```
     [TW Provider] Initializing Netflix provider
     [TW WarningManager] Initializing warning manager
     [TW BannerManager] Initializing banner manager
     ```

## Expected Behavior After Fixes

### Popup Window
- ✅ No scrolling required
- ✅ All buttons fit without gaps/overlaps
- ✅ Reset timestamp buttons visible (↺ Reset Start, ↺ Reset End, ⟲ Reset Both)
- ✅ Enhanced error messages with gradient and warning icon
- ✅ Live timestamp updates every 500ms

### Overlay/Banner
- ✅ Positioned 16px from top (was 20px)
- ✅ Supports top-center and bottom-center positioning
- ✅ Maintains centering in fullscreen mode
- ✅ Purple/violet "TW Active" indicator visible

### Settings Page
- ✅ Category cards have clear visual state (thick purple border when enabled)
- ✅ Gradient background on enabled categories
- ✅ Position selector includes "Top Center" and "Bottom Center" options

## If Nothing Works

If extension still doesn't work after following all steps:

1. **Completely remove extension:**
   - Go to `chrome://extensions/`
   - Remove "Trigger Warnings"

2. **Clean build:**
   ```bash
   rm -rf node_modules dist
   npm install --ignore-scripts
   npm run build
   ```

3. **Re-add extension:**
   - Load unpacked from fresh `dist` folder

4. **Check browser console immediately:**
   - Background service worker console
   - Popup DevTools console (right-click popup → Inspect)
   - Content script console (F12 on video page)

5. **Share error messages:**
   - Any errors from the consoles above
   - Screenshots of what you see (or don't see)
