# Installation Guide

This guide covers how to install Trigger Warnings on different browsers and operating systems.

---

## 📦 Table of Contents

1. [Chrome / Edge / Brave](#chrome--edge--brave)
2. [Firefox](#firefox)
3. [Safari](#safari-coming-soon)
4. [Manual Installation (Developer Mode)](#manual-installation-developer-mode)
5. [Troubleshooting](#troubleshooting)
6. [Updating the Extension](#updating-the-extension)
7. [Uninstalling](#uninstalling)

---

## Chrome / Edge / Brave

### From Chrome Web Store (Recommended)

**Coming Soon!** The extension is currently under review.

Once published:

1. **Visit the Chrome Web Store**
   - Link: [Chrome Web Store - Trigger Warnings](#) *(pending approval)*

2. **Click "Add to Chrome"** (or "Add to Edge"/"Add to Brave")
   - Browser will show a permission prompt

3. **Review permissions**
   - Storage (save your preferences)
   - Active Tab (see what you're watching)
   - Host permissions (access streaming sites)

4. **Click "Add Extension"**
   - Extension icon will appear in your toolbar

5. **Pin the extension** (optional but recommended)
   - Click the puzzle icon in your toolbar
   - Find "Trigger Warnings"
   - Click the pin icon

6. **Configure your preferences**
   - Click the extension icon
   - Select your trigger categories
   - Set your warning style

7. **Start watching!**
   - Navigate to Netflix, Hulu, or any supported platform

### System Requirements

- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Version 88+ (Chromium-based)
- **Brave**: Version 1.20+
- **Operating System**: Windows 7+, macOS 10.11+, Linux (any)
- **RAM**: 4GB minimum (8GB recommended for AI features)
- **Internet**: Required for downloading warnings (offline mode coming soon)

---

## Firefox

### From Firefox Add-ons (Recommended)

**Coming Soon!** The extension is currently under review.

Once published:

1. **Visit Firefox Add-ons**
   - Link: [Firefox Add-ons - Trigger Warnings](#) *(pending approval)*

2. **Click "Add to Firefox"**
   - Firefox will show a permission prompt

3. **Review permissions**
   - Access your data for specific websites
   - Store unlimited amount of client-side data

4. **Click "Add"**
   - Extension icon appears in toolbar

5. **Configure preferences**
   - Click the extension icon
   - Choose your trigger categories

6. **Navigate to a streaming site**
   - The extension will activate automatically

### Firefox-Specific Notes

- **Manifest Version**: Uses MV2 (Firefox's current standard)
- **Private Browsing**: Extension works in private windows (requires enabling in settings)
- **Android Support**: Not yet available (Firefox for Android extension support is limited)

### System Requirements

- **Firefox**: Version 91+ (recommended: latest ESR or stable)
- **Operating System**: Windows 7+, macOS 10.12+, Linux (any)
- **RAM**: 4GB minimum
- **Internet**: Required for warning database

---

## Safari (Coming Soon)

Safari support is planned for a future release.

### Why Not Yet?

- Safari uses a different extension format (Safari App Extensions)
- Requires macOS/iOS app wrapper
- Apple Developer Program membership ($99/year)
- Different review process (App Store)

### Estimated Timeline

- **Q2 2025**: Safari development begins
- **Q3 2025**: Beta testing on macOS
- **Q4 2025**: App Store submission

**Stay updated**: Watch our [GitHub Discussions](https://github.com/mitchlabeetch/Trigger_Warnings/discussions) for Safari progress.

---

## Manual Installation (Developer Mode)

For developers or users who want to try the latest unreleased features:

### Chrome / Edge / Brave

1. **Download the extension**
   ```bash
   # Option 1: Clone from GitHub
   git clone https://github.com/mitchlabeetch/Trigger_Warnings.git
   cd Trigger_Warnings
   
   # Option 2: Download ZIP
   # Visit: https://github.com/mitchlabeetch/Trigger_Warnings
   # Click "Code" → "Download ZIP"
   # Extract the ZIP file
   ```

2. **Install dependencies and build**
   ```bash
   npm install
   npm run build:chrome
   ```
   
   This creates a `dist/chrome` folder with the built extension.

3. **Load unpacked extension**
   - Open Chrome/Edge/Brave
   - Navigate to `chrome://extensions/` (or `edge://extensions/`, `brave://extensions/`)
   - Enable **"Developer mode"** (toggle in top-right corner)
   - Click **"Load unpacked"**
   - Select the `dist/chrome` folder
   - Extension is now installed!

4. **Verify installation**
   - Extension icon should appear in toolbar
   - Click it to configure preferences

### Firefox

1. **Download and build** (same as Chrome above)
   ```bash
   git clone https://github.com/mitchlabeetch/Trigger_Warnings.git
   cd Trigger_Warnings
   npm install
   npm run build:firefox
   ```

2. **Load temporary add-on**
   - Open Firefox
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click **"Load Temporary Add-on..."**
   - Navigate to `dist/firefox` folder
   - Select **any file** in that folder (e.g., `manifest.json`)
   - Extension is now loaded!

3. **Note**: Temporary add-ons in Firefox are removed when you close the browser
   - For persistent installation, you'll need to create a signed XPI file
   - See: https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/

### Building from Source

#### Prerequisites
- **Node.js**: v18+ ([Download](https://nodejs.org/))
- **npm**: v9+ (comes with Node.js)
- **Git**: ([Download](https://git-scm.com/))

#### Build Commands
```bash
# Install dependencies
npm install

# Development build (with hot reload)
npm run dev:chrome
npm run dev:firefox

# Production build (optimized)
npm run build:chrome
npm run build:firefox

# Build for all browsers
npm run build:all

# Run tests
npm test

# Lint code
npm run lint
```

#### Build Output
- **Chrome/Edge/Brave**: `dist/chrome/`
- **Firefox**: `dist/firefox/`
- **Safari**: `dist/safari/` (not yet implemented)

---

## Troubleshooting

### Installation Failed

**Error: "Package is invalid"**
- **Cause**: Corrupted download or incompatible browser version
- **Fix**: Re-download the extension, ensure browser is up-to-date

**Error: "Cannot load extension"**
- **Cause**: Developer mode not enabled (manual install)
- **Fix**: Enable Developer mode in extensions page

### Extension Not Appearing

**Toolbar icon missing:**
- **Fix 1**: Click the puzzle icon (extensions menu) → Pin Trigger Warnings
- **Fix 2**: Right-click toolbar → Customize → Drag extension icon to toolbar

**Extension installed but not working:**
- **Check**: Is the extension enabled? (`chrome://extensions/`)
- **Check**: Do you have permission on the site? (some sites block extensions)
- **Fix**: Refresh the streaming platform page

### Permissions Errors

**"Extension needs permission to run on this site"**
- **Cause**: Chrome's site-specific permission model
- **Fix**: Right-click extension icon → "This can read and change site data" → "On all sites" (or "On [specific site]")

**Firefox: "Extension is disabled in private windows"**
- **Fix**: `about:addons` → Trigger Warnings → Details → "Run in Private Windows" → Enable

### Performance Issues

**High CPU/RAM usage:**
- **Cause**: AI detection features (experimental)
- **Fix**: Disable local detection: Settings → "Local AI Detection" → OFF

**Video buffering or lag:**
- **Fix**: Lower warning frequency or disable real-time monitoring
- **Also try**: Close other tabs, disable hardware acceleration in browser

---

## Updating the Extension

### Automatic Updates (Chrome Web Store / Firefox Add-ons)

Extensions update automatically by default:
- Chrome checks for updates every few hours
- Firefox checks on browser startup

**Manual update:**
1. Go to `chrome://extensions/` (or `edge://extensions/`, `brave://extensions/`)
2. Click **"Update"** button at the top
3. Wait for "Extension is up to date" message

### Manual Updates (Developer Mode)

1. **Pull latest changes**
   ```bash
   cd Trigger_Warnings
   git pull origin main
   ```

2. **Rebuild**
   ```bash
   npm install  # Update dependencies if needed
   npm run build:chrome  # Or build:firefox
   ```

3. **Reload extension**
   - Go to `chrome://extensions/`
   - Find "Trigger Warnings"
   - Click the reload icon (🔄)

---

## Uninstalling

### Chrome / Edge / Brave

1. **Open extensions page**
   - `chrome://extensions/` (or `edge://extensions/`, `brave://extensions/`)

2. **Find "Trigger Warnings"**
   - Click **"Remove"** button

3. **Confirm removal**
   - Click **"Remove"** in the popup

4. **Optional: Clear data**
   - Extension data (preferences, cached warnings) is automatically removed
   - If you want to clear backend data (warning votes), contact us

### Firefox

1. **Open Add-ons Manager**
   - Click menu (☰) → "Add-ons and themes"
   - Or navigate to `about:addons`

2. **Find "Trigger Warnings"**
   - Click the three dots (⋯) → **"Remove"**

3. **Confirm removal**

### What Gets Deleted?

**Automatically removed:**
- ✅ Extension files
- ✅ Local preferences (trigger categories, profiles)
- ✅ Cached warning data
- ✅ Browsing permissions

**NOT removed (stored on our servers):**
- ⚠️ Warnings you've submitted (these remain for the community)
- ⚠️ Your votes on warnings (anonymized, cannot be traced to you)

If you want your contributions removed:
- Email: privacy@triggerwarnings.app (coming soon)
- Include: List of warnings you want deleted (with timestamps/content IDs)

---

## Platform-Specific Tips

### Windows

- **Keyboard shortcut**: Create a custom shortcut in `chrome://extensions/shortcuts`
- **Startup**: Extension auto-starts with browser (no action needed)
- **Taskbar**: Pin Chrome/Firefox to taskbar for quick access

### macOS

- **Touch Bar**: Extension icon may appear in Touch Bar (if supported)
- **Spotlight**: Search "Trigger Warnings" to open Chrome with extension
- **Permissions**: macOS may ask for Accessibility permissions (for keyboard shortcuts)

### Linux

- **Package managers**: Not yet available in apt/snap/flatpak (manual install only)
- **Permissions**: Some distros require manual permission to load extensions
- **Wayland**: May have issues with some features (use X11 if problems occur)

---

## Need Help?

**Installation issues?**
- [GitHub Discussions](https://github.com/mitchlabeetch/Trigger_Warnings/discussions)
- [Open an Issue](https://github.com/mitchlabeetch/Trigger_Warnings/issues)
- Email: support@triggerwarnings.app (coming soon)

**See also:**
- [User Guide](USER_GUIDE.md) – How to use the extension
- [FAQ](FAQ.md) – Common questions
- [Troubleshooting](USER_GUIDE.md#troubleshooting) – More detailed fixes

---

<div align="center">

**Installation complete? Time to [configure your preferences](USER_GUIDE.md#setting-up-your-preferences)!** 🎬

[Back to README](../README.md)

</div>
