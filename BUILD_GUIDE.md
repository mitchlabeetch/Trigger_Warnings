# 🛠️ Trigger Warnings Extension - Local Build Guide

Complete step-by-step guide to build and test the Trigger Warnings extension locally from the GitHub repository.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18 or higher recommended)
   ```bash
   node --version  # Should show v18.x.x or higher
   ```
   Download from: https://nodejs.org/

2. **npm** (comes with Node.js)
   ```bash
   npm --version  # Should show 9.x.x or higher
   ```

3. **Git**
   ```bash
   git --version
   ```
   Download from: https://git-scm.com/

4. **A Chromium-based browser** (Chrome, Edge, Brave, etc.)

### Optional but Recommended

- **VS Code** or your preferred code editor
- **Supabase account** (for database features) - https://supabase.com

---

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/lightmyfireadmin/triggerwarnings.git

# Navigate into the project directory
cd triggerwarnings

# Verify you're in the right directory
ls -la
# You should see: package.json, tsconfig.json, manifest.json, src/, etc.
```

---

## Step 2: Install Dependencies

```bash
# Install all npm dependencies
npm install

# This will install:
# - Svelte (UI framework)
# - Vite (build tool)
# - TypeScript
# - Tailwind CSS
# - Supabase client
# - And all other dependencies

# Wait for installation to complete (may take 1-3 minutes)
```

### Verify Installation

```bash
# Check that node_modules was created
ls node_modules

# Verify key packages are installed
npm list svelte vite typescript
```

---

## Step 3: Configure Environment (Optional but Recommended)

### Option A: Use Existing Supabase Instance

The extension comes pre-configured with a Supabase instance. You can use it for testing or set up your own.

### Option B: Set Up Your Own Supabase Database

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Sign up / Log in
   - Click "New Project"
   - Name it (e.g., "TriggerWarnings Dev")
   - Set a database password
   - Choose a region
   - Wait for project to initialize (~2 minutes)

2. **Run the Database Schema**
   - In Supabase Dashboard, go to SQL Editor
   - Copy the entire SQL schema from `/database/schema.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for completion (should see "Success" message)

3. **Enable Anonymous Authentication**
   - Go to Authentication → Providers
   - Find "Anonymous Sign-ins"
   - Toggle it ON

4. **Get API Credentials**
   - Go to Settings → API
   - Copy:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - `anon` / `public` key (long string starting with `eyJ...`)

5. **Update Extension Configuration**
   - Open `/src/shared/constants/defaults.ts`
   - Update `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   ```typescript
   export const SUPABASE_URL = 'https://your-project.supabase.co';
   export const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

---

## Step 4: Build the Extension

### Development Build (with hot reload)

```bash
# Start development server
npm run dev

# You should see:
# ✓ Vite dev server running
# ✓ Building extension...
# ✓ Output: dist/
```

This command:
- Compiles TypeScript to JavaScript
- Processes Svelte components
- Compiles Tailwind CSS
- Watches for file changes
- Outputs to `dist/` directory

**Keep this terminal window open** - it will rebuild automatically when you change files.

### Production Build (optimized)

```bash
# Build for production
npm run build

# Creates optimized bundle in dist/
```

Production build:
- Minifies JavaScript
- Optimizes CSS
- Removes source maps
- Smaller file sizes

---

## Step 5: Load Extension in Chrome

### Open Chrome Extensions Page

1. Open Chrome/Edge/Brave
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in top-right corner)

### Load Unpacked Extension

1. Click **"Load unpacked"** button
2. Navigate to your project folder
3. Select the **`dist`** folder
4. Click **"Select Folder"**

### Verify Installation

You should now see:
- ✅ Trigger Warnings extension card
- Extension ID
- Version number (from manifest.json)
- Enable/Disable toggle (should be ON)
- Three buttons: Details, Remove, Errors

### Troubleshooting Load Errors

If you see errors:

**Error: "Manifest file is missing or unreadable"**
```bash
# Ensure build completed successfully
npm run build
# Check that dist/manifest.json exists
ls dist/manifest.json
```

**Error: "Could not load background script"**
```bash
# Check for TypeScript errors
npm run build
# Look for compilation errors in terminal
```

**Error: "Required permissions missing"**
- This is normal - some permissions request user approval
- Click "Details" → Permissions tab to review

---

## Step 6: Test the Extension

### Test on Netflix

1. Open a new tab
2. Go to https://www.netflix.com
3. Log in (if not already)
4. Navigate to any video (e.g., https://www.netflix.com/watch/70242311)
5. Start playing the video

**What should happen:**
- Extension icon should activate (colored, not grayed out)
- Look for warning banners if triggers are in database
- Open browser console (F12) → Console tab
- Look for `[TW]` prefixed logs:
  ```
  [TW] Initialized provider: Netflix
  [TW] Fetching warnings for video: 70242311
  [TW] Found 3 warnings
  ```

### Test on YouTube

1. Go to https://www.youtube.com/watch?v=dQw4w9WgXcQ
2. Play the video
3. Check console for `[TW] Initialized provider: YouTube`

### Test Other Platforms

- Prime Video: https://www.primevideo.com
- Hulu: https://www.hulu.com
- Disney+: https://www.disneyplus.com
- Max: https://www.max.com
- Peacock: https://www.peacocktv.com

### Test the Popup

1. Click the extension icon in Chrome toolbar
2. You should see:
   - Profile selector
   - Submit warning form
   - Current video detection (if on supported platform)

### Test Options Page

1. Right-click extension icon → Options
   OR
2. Go to `chrome://extensions/` → Trigger Warnings → Details → Extension options
3. You should see:
   - Categories tab (28 trigger categories)
   - Settings tab (display, theme, etc.)
   - Stats tab

---

## Step 7: Development Workflow

### Making Changes

1. **Edit source files** in `src/`
   - TypeScript: `src/**/*.ts`
   - Svelte: `src/**/*.svelte`
   - Styles: `src/**/*.css`

2. **Auto-rebuild** (if using `npm run dev`)
   - Save file
   - Vite rebuilds automatically
   - Check terminal for build success

3. **Reload extension in Chrome**
   - Go to `chrome://extensions/`
   - Click the ↻ (reload) button on Trigger Warnings card
   - OR press `Ctrl+R` on extensions page

4. **Test your changes**
   - Navigate to test page
   - Refresh page (`Ctrl+R` or `Cmd+R`)
   - Test functionality

### Debugging Tips

**View Background Service Worker Logs:**
1. Go to `chrome://extensions/`
2. Click "Details" on Trigger Warnings
3. Click "Inspect views: service worker"
4. Console tab shows background script logs

**View Content Script Logs:**
1. Open any supported streaming site
2. Press `F12` (DevTools)
3. Console tab shows content script logs
4. Look for `[TW]` prefixed messages

**View Network Requests:**
1. F12 → Network tab
2. Filter by "Fetch/XHR"
3. Look for Supabase API calls

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Changes not appearing | Reload extension in chrome://extensions/ |
| Content script not loading | Check manifest.json content_scripts matches |
| Background errors | Check service worker console |
| Build fails | Run `npm install` again, check for TypeScript errors |
| Supabase errors | Verify API keys in defaults.ts |

---

## Step 8: Running Tests

### Check for Errors

```bash
# Type-check with TypeScript
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Content script loads on Netflix
- [ ] Content script loads on YouTube
- [ ] Popup opens and shows current video
- [ ] Options page loads all tabs
- [ ] Can toggle trigger categories
- [ ] Can create/delete profiles
- [ ] Can submit warning (if database configured)
- [ ] Can vote on warning
- [ ] Warnings appear during playback
- [ ] Photosensitivity detection works

---

## Step 9: Building for Distribution

### Create Production Build

```bash
# Clean previous builds
rm -rf dist/

# Create optimized production build
npm run build

# Verify build output
ls dist/
# Should contain: manifest.json, background.js, content.js, popup.html, etc.
```

### Create ZIP for Chrome Web Store

```bash
# Create archive
cd dist
zip -r ../trigger-warnings-extension.zip .
cd ..

# You now have trigger-warnings-extension.zip ready for upload
```

### Upload to Chrome Web Store

1. Go to https://chrome.google.com/webstore/devconsole
2. Click "New Item"
3. Upload ZIP file
4. Fill in store listing details
5. Submit for review

---

## Project Structure Reference

```
triggerwarnings/
├── dist/                    # Build output (generated)
├── src/
│   ├── background/          # Service worker
│   │   └── index.ts
│   ├── content/             # Content scripts
│   │   ├── index.ts
│   │   ├── providers/       # Platform-specific providers
│   │   ├── warning/         # Warning detection
│   │   └── banner/          # UI banners
│   ├── popup/               # Extension popup
│   │   ├── Popup.svelte
│   │   └── index.ts
│   ├── options/             # Options page
│   │   ├── Options.svelte
│   │   └── index.ts
│   ├── moderation/          # Moderation dashboard
│   ├── core/                # Core business logic
│   │   ├── api/             # Supabase client
│   │   ├── profiles/        # Profile management
│   │   └── storage/         # Browser storage
│   └── shared/              # Shared utilities
│       ├── types/           # TypeScript types
│       ├── constants/       # Constants
│       └── utils/           # Utility functions
├── database/
│   └── schema.sql           # Database schema
├── landing/                 # Landing page (GitHub Pages)
├── manifest.json            # Extension manifest
├── package.json             # npm dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind CSS config
├── vite.config.ts           # Vite build config
└── README.md
```

---

## Useful Commands Reference

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking

# Cleanup
rm -rf node_modules dist # Clean everything
npm install              # Reinstall
npm run build            # Rebuild
```

---

## Getting Help

### Resources

- **GitHub Issues**: https://github.com/lightmyfireadmin/triggerwarnings/issues
- **Supabase Docs**: https://supabase.com/docs
- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/
- **Svelte Docs**: https://svelte.dev/docs
- **Vite Docs**: https://vitejs.dev/

### Common Questions

**Q: Why isn't the extension showing warnings?**
A: Check:
1. Video has triggers in database (`SELECT * FROM triggers WHERE video_id = 'xxx'`)
2. Categories are enabled in your profile
3. Console shows no errors
4. Supabase connection is working

**Q: How do I add a new streaming platform?**
A: See CONTRIBUTING.md for guide on adding new providers

**Q: Can I use a different database?**
A: Yes, but you'll need to implement a new client in `src/core/api/`

**Q: The build is slow, can I speed it up?**
A: Development mode (`npm run dev`) is faster with hot reload

---

## Next Steps

✅ You're all set! Here's what to explore next:

1. **Add test data**: Insert some triggers into your database
2. **Customize UI**: Modify Svelte components in `src/popup/` and `src/options/`
3. **Add features**: Implement new trigger detection algorithms
4. **Contribute**: Submit PRs to improve the extension
5. **Deploy**: Build and publish to Chrome Web Store

Happy coding! 🎉
