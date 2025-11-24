# Image Assets Usage Guide

This document explains how to use the newly integrated image assets in the Trigger Warnings extension.

## 📁 Asset Locations

### Extension Icons
- **Location**: `/images/`
- **Files**: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
- **Usage**: Referenced in `manifest.json`, automatically used by browser

### Chrome Web Store Assets
- **Location**: `/store-assets/`
- **Files**:
  - `promo-tile-440x280.png`
  - `promo-marquee-1400x560.png`
  - `screenshot-1-banner-1280x800.png`
  - `screenshot-2-settings-1280x800.png`
  - `screenshot-3-timeline-1280x800.png`
  - `screenshot-4-categories-1280x800.png`
  - `screenshot-5-platforms-1280x800.png`
- **Usage**: Upload to Chrome Web Store Developer Dashboard

### Landing Page Assets
- **Location**: `/landing/images/`
- **Files**:
  - `hero-logo.png` - Main logo in hero section
  - `social-preview.png` - Open Graph preview (1200×630)
  - `twitter-card.png` - Twitter card preview (1200×600)
  - `features/database.png`
  - `features/community.png`
  - `features/real-time.png`
  - `features/customization.png` (or `profiles.png`)
  - `features/privacy.png`
  - `features/profiles.png`
- **Usage**: Referenced in `landing/index.html`

### Category Icons
- **Location**: `/src/assets/category-icons/`
- **Files**: 28 PNG icons for each trigger category
- **Usage**: Can be used in extension UI (optional, emojis are fallback)

### UI Assets
- **Location**: `/src/assets/`
- **Subdirectories**:
  - `illustrations/empty-state.png`
  - `animations/loading.png`
- **Usage**: Future UI enhancements

## 🎨 How Assets Are Used

### 1. Landing Page (index.html)

#### Hero Logo
```html
<div class="hero-logo">
    <img src="images/hero-logo.png" alt="Trigger Warnings Logo">
</div>
```

#### Feature Cards
```html
<div class="feature-icon">
    <img src="images/features/database.png" alt="Database icon">
</div>
```

#### Social Media Meta Tags
```html
<!-- Open Graph -->
<meta property="og:image" content="https://lightmyfireadmin.github.io/triggerwarnings/images/social-preview.png">

<!-- Twitter -->
<meta property="twitter:image" content="https://lightmyfireadmin.github.io/triggerwarnings/images/twitter-card.png">
```

### 2. Category Icons (Extension)

#### Using the Icon Mapping System

The extension can use PNG icons instead of emojis. See `src/shared/constants/category-icon-mapping.ts`:

```typescript
import { getCategoryIcon, ICON_MODE } from '@shared/constants/category-icon-mapping';

// Get icon path
const iconPath = getCategoryIcon('violence'); // Returns: /src/assets/category-icons/violence.png

// In Svelte components
<script>
  import { getCategoryIcon } from '@shared/constants/category-icon-mapping';

  export let category;

  $: iconSrc = getCategoryIcon(category);
</script>

{#if ICON_MODE === 'png'}
  <img src={iconSrc} alt="{category} icon" class="category-icon" />
{:else}
  <span>{getCategoryInfo(category).icon}</span>
{/if}
```

#### Switching Between Emoji and PNG Icons

In `src/shared/constants/category-icon-mapping.ts`:

```typescript
// Use PNG icons
export const ICON_MODE: IconMode = 'png';

// Or use emoji fallback
export const ICON_MODE: IconMode = 'emoji';
```

### 3. Build Configuration

The Vite configuration includes an alias for easy asset importing:

```typescript
// In any TypeScript/JavaScript file
import logoUrl from '@assets/illustrations/empty-state.png';

// Or relative import
import iconUrl from '../assets/category-icons/violence.png';
```

### 4. Manifest Integration

Extension icons are automatically referenced in `manifest.json`:

```json
{
  "icons": {
    "16": "images/icon16.png",
    "32": "images/icon32.png",
    "48": "images/icon48.png",
    "128": "images/icon128.png"
  }
}
```

## 📋 Asset Checklist

### Before Deploying Landing Page
- [ ] Copy all landing page images to `/landing/images/`
- [ ] Verify hero logo displays correctly
- [ ] Check all feature icons load
- [ ] Test social preview images (share on Twitter/Facebook to verify)
- [ ] Ensure images are optimized (compressed)

### Before Chrome Web Store Submission
- [ ] Copy all store assets to `/store-assets/`
- [ ] Upload 5 screenshots to Chrome Web Store
- [ ] Upload small promo tile (440×280)
- [ ] Optional: Upload marquee tile (1400×560)
- [ ] Verify all images meet size requirements

### Before Extension Build
- [ ] Copy extension icons to `/images/`
- [ ] Copy category icons to `/src/assets/category-icons/`
- [ ] Update `ICON_MODE` if using PNG icons
- [ ] Run `npm run build` and verify assets are bundled
- [ ] Test extension with new icons

## 🔄 Asset Updates

### Updating Extension Icons

1. Replace files in `/images/`
2. Ensure sizes match: 16×16, 32×32, 48×48, 128×128
3. Rebuild extension: `npm run build`
4. Reload extension in browser

### Updating Landing Page Images

1. Replace files in `/landing/images/`
2. Commit and push to GitHub
3. GitHub Pages will auto-deploy
4. Clear browser cache to see updates

### Updating Category Icons

1. Replace files in `/src/assets/category-icons/`
2. Ensure filenames match `CATEGORY_ICON_FILES` mapping
3. Rebuild extension: `npm run build`
4. Test in browser

## 🎯 Image Optimization Tips

### Recommended Tools
- **TinyPNG**: https://tinypng.com/ (compress PNG files)
- **ImageOptim**: https://imageoptim.com/ (Mac app)
- **Squoosh**: https://squoosh.app/ (web-based)

### Size Guidelines
- Extension icons: < 50 KB each
- Landing page images: < 200 KB each
- Screenshots: < 500 KB each
- Category icons: < 20 KB each
- Social previews: < 1 MB

### Optimization Commands

```bash
# Install imagemagick for batch optimization
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Linux

# Optimize all PNGs in a directory
mogrify -strip -quality 85 -path ./optimized *.png

# Resize screenshots to exact dimensions
mogrify -resize 1280x800! -path ./screenshots *.png
```

## 🚀 Deployment Workflow

### 1. Copy Assets from Desktop
```bash
# Run the copy script
./copy-assets.sh

# Or copy manually
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/images/*.png ./images/
# ... (see asset-integration-guide.md for full commands)
```

### 2. Verify Assets
```bash
# Check that all assets copied correctly
npm run check-assets  # (script to add in package.json)

# Manual verification
find . -name "*.png" -not -path "./node_modules/*" | wc -l
# Should show ~50 PNG files
```

### 3. Build and Test
```bash
# Build extension
npm run build

# Check dist directory
ls -la dist/images/
ls -la dist/src/assets/
```

### 4. Deploy
```bash
# Commit assets
git add images/ landing/images/ store-assets/ src/assets/
git commit -m "feat: Add all graphic assets (icons, screenshots, landing page images)"

# Push to GitHub (triggers GitHub Pages deploy)
git push origin main
```

## 📝 Asset Manifest

Current asset inventory:

```
Total PNG files: ~50

Extension Icons (4):
- icon16.png
- icon32.png
- icon48.png
- icon128.png

Store Assets (7):
- promo-tile-440x280.png
- promo-marquee-1400x560.png
- 5× screenshots (1280×800)

Landing Page (9):
- hero-logo.png
- 6× feature icons
- social-preview.png
- twitter-card.png

Category Icons (28):
- violence.png, blood.png, gore.png, etc.

UI Assets (2):
- empty-state.png
- loading.png
```

## 🐛 Troubleshooting

### Images not loading on landing page
- Check file paths are relative (use `images/...` not `/images/...`)
- Verify files exist in `/landing/images/`
- Clear browser cache
- Check browser console for 404 errors

### Icons not showing in extension
- Ensure `manifest.json` paths are correct
- Rebuild extension: `npm run build`
- Check `dist/images/` contains icon files
- Reload extension in browser

### Category icons showing emojis instead of PNGs
- Check `ICON_MODE` in `category-icon-mapping.ts`
- Verify PNG files exist in `/src/assets/category-icons/`
- Ensure filenames match `CATEGORY_ICON_FILES` mapping
- Rebuild extension

### Build errors related to assets
- Check Vite config has `@assets` alias
- Ensure asset imports use correct paths
- Verify asset files exist before building
- Check file permissions

---

**Last Updated**: 2025-11-08
**For Extension Version**: 2.0.0
