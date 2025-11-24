# Extension Debugging Guide

## ✅ Landing Page - COMPLETED

All landing page improvements have been implemented:
- Logo path fixed
- Scroll buttons working
- GitHub link removed
- Mobile layout improved
- Browser list expanded
- Platforms section moved earlier with disclaimer

## 🔍 Extension Issues Analysis

### Why Warnings May Not Be Appearing

The extension code is well-structured and SHOULD work. Based on the logs and architecture, here are the most likely causes:

#### 1. **Profile Settings** (MOST LIKELY ISSUE)
```typescript
// In WarningManager.ts:219-223
private filterWarningsByProfile(warnings: Warning[]): Warning[] {
  return warnings.filter((warning) => {
    return this.profile.enabledCategories.includes(warning.categoryKey);
  });
}
```

**To Debug:**
1. Open Chrome DevTools Console
2. Look for log: `[TW WarningManager] ✅ Profile loaded: "..." with X enabled categories`
3. Check if your test category (e.g., "blood") is in the enabled categories list

**Fix:** Open extension options/settings and ensure the trigger categories you're testing are ENABLED in your active profile.

####2. **No Database Entries for Video**
```typescript
// In WarningManager.ts:186-199
console.log(`[TW WarningManager] 🌐 Fetching warnings from backend for video: ${videoId}`);
const allWarnings = await SupabaseClient.getTriggers(videoId);
console.log(`[TW WarningManager] 📦 Received ${allWarnings.length} total warnings from backend`);
```

**To Debug:**
- Check console for: "Received X total warnings from backend"
- If X = 0, the video isn't in the database yet

**Expected Behavior:** Subtitle analyzer should kick in as fallback

#### 3. **Subtitle Analyzer Not Detecting**
```typescript
// In SubtitleAnalyzer.ts - Line 60
{ keyword: 'blood', category: 'blood', confidence: 70 }
```

**To Debug:**
1. Ensure subtitles/captions are available on the video
2. Check console for subtitle analyzer logs:
   - `[TW SubtitleAnalyzer] Subtitles found`
   - `[TW SubtitleAnalyzer] Trigger detected: ...`

**Note:** Analyzer needs English subtitles OR will attempt translation

#### 4. **Provider Not Initializing**
```typescript
// In content/index.ts:32-35
if (!ProviderFactory.isSupported()) {
  logger.warn('Site not supported');
  return;
}
```

**To Debug:**
- Check console for: "Provider initialized: Netflix" (or YouTube, etc.)
- If you see "Site not supported", the platform isn't recognized

### Recommended Debugging Steps

Run these checks in order:

```javascript
// 1. Check if extension loaded
console.log('[DEBUG] Extension loaded?', typeof browser !== 'undefined' || typeof chrome !== 'undefined');

// 2. Check active profile (run in DevTools)
browser.runtime.sendMessage({ type: 'GET_ACTIVE_PROFILE' })
  .then(r => console.log('[DEBUG] Profile:', r.data));

// 3. Check if video detected
// Look for console logs starting with [TW WarningManager] or [Content]

// 4. Force enable all categories for testing
// (Do this in extension settings UI)
```

### Enhanced Logging Recommendations

The code already has extensive logging. To see full debug output:

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Filter by "TW" or "SubtitleAnalyzer"
4. Check for initialization logs
5. Watch for warning detection logs

Key logs to look for:
```
✅ [TW WarningManager] 🚀 Initializing warning manager...
✅ [TW WarningManager] ✅ Profile loaded
✅ [TW WarningManager] 🎬 Media detected
✅ [TW BannerManager] 🚀 Initializing banner manager...
✅ [TW WarningManager] 🔍 Checking warnings at Xs
```

## 🎯 Next Steps for Full Implementation

### High Priority Extension Improvements

1. **SubmitWarning.svelte** - Add live timestamps
   - Currently: Timestamp captured at button click
   - Needed: Live updating timestamp as video plays
   - File: `src/popup/components/SubmitWarning.svelte`

2. **Options.svelte** - Add visual feedback for trigger selection
   - Currently: No visual indication of selected triggers
   - Needed: Highlight selected triggers clearly
   - File: `src/options/Options.svelte`

3. **ActiveIndicator.svelte** - Make button more violet
   - Currently: Generic color
   - Needed: More vibrant violet, customizable
   - File: `src/content/indicator/ActiveIndicator.svelte`

4. **Banner.svelte** - Enhanced helper mode
   - Currently: Basic confirm/wrong buttons
   - Needed: Animated expansion with more context
   - File: `src/content/banner/Banner.svelte`

### Workflow Improvements Needed

1. **Popup Layout** (SubmitWarning.svelte):
   - Change from scrolling to page-by-page workflow
   - Reduce button sizes for better fit
   - Add clear timestamp reset buttons
   - Prevent scrolling on small popup window

2. **Overlay Positioning** (Banner.svelte):
   - Currently: Fixed position from profile settings
   - Needed: Center of video player, 16px from top
   - Add customization for appearing mode
   - Implement all animation behaviors

3. **Add Trigger from Overlay**:
   - Currently: Only from popup
   - Needed: Inline workflow within overlay
   - Extend overlay nicely with glassmorphism
   - Keep overlay centered when extended

## 🏗️ Build & Test Process

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Output will be in dist/ folder

# Load in Chrome:
# 1. Go to chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the project root directory
```

### Testing Checklist

- [ ] Extension loads without errors
- [ ] Provider initializes on streaming platform
- [ ] Profile loads correctly
- [ ] Banner appears when triggers detected
- [ ] Subtitle analyzer detects keywords
- [ ] Helper mode voting works
- [ ] Add trigger workflow functional
- [ ] Mobile responsive

## 📝 Code Quality Notes

The codebase is well-architected:
- ✅ TypeScript for type safety
- ✅ Svelte for reactive UI
- ✅ Modular provider system
- ✅ Comprehensive logging
- ✅ Profile-based filtering
- ✅ Multiple detection systems
- ✅ Clean separation of concerns

Main areas for improvement are UX/UI enhancements, not core functionality.

## 🐛 Common Pitfalls

1. **Editing compiled files**: Always edit `src/` files, not root `.js` files
2. **Forgetting to rebuild**: Run `npm run build` after changes
3. **Profile settings**: Most "not working" issues are profile configuration
4. **Supabase connection**: Ensure backend is accessible
5. **Platform support**: Only works on recognized streaming platforms

## 💡 Quick Fixes

If overlay not appearing:
1. Check console for errors
2. Verify profile has categories enabled
3. Ensure you're on a supported platform (Netflix, YouTube, etc.)
4. Check that video element is detected
5. Try adding triggers manually to database for test video

If subtitle detection not working:
1. Enable subtitles/captions on video
2. Check for English subtitles (or any language for translation)
3. Verify SubtitleAnalyzer logs in console
4. Ensure profile has subtitle categories enabled
