# Image Asset Integration Guide

This guide helps you copy the newly created image assets from your desktop to the repository.

## 📁 File Copy Commands

Run these commands from your **repository root** (`/home/user/triggerwarnings/`):

### 1. Extension Icons (Replace existing)
```bash
# Copy from desktop to repo
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/images/icon16.png ./images/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/images/icon32.png ./images/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/images/icon48.png ./images/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/images/icon128.png ./images/
```

### 2. Chrome Web Store Assets
```bash
# Create store-assets directory if needed
mkdir -p store-assets

# Copy screenshots and promotional tiles
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/store-assets/promo-tile-440x280.png ./store-assets/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/store-assets/promo-marquee-1400x560.png ./store-assets/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/store-assets/screenshot-1-banner-1280x800.png ./store-assets/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/store-assets/screenshot-2-settings-1280x800.png ./store-assets/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/store-assets/screenshot-3-timeline-1280x800.png ./store-assets/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/store-assets/screenshot-4-categories-1280x800.png ./store-assets/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/store-assets/screenshot-5-platforms-1280x800.png ./store-assets/
```

### 3. Landing Page Assets
```bash
# Create landing/images directory structure
mkdir -p landing/images/features

# Copy hero logo
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/hero-logo.png ./landing/images/

# Copy feature icons
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/features/database.png ./landing/images/features/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/features/community.png ./landing/images/features/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/features/real-time.png ./landing/images/features/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/features/customization.png ./landing/images/features/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/features/privacy.png ./landing/images/features/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/features/profiles.png ./landing/images/features/

# Copy social media images
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/social-preview.png ./landing/images/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/twitter-card.png ./landing/images/
```

### 4. Extension UI Assets
```bash
# Create src/assets directory structure
mkdir -p src/assets/illustrations src/assets/animations src/assets/category-icons

# Copy UI illustrations
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/src/assets/illustrations/empty-state.png ./src/assets/illustrations/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/src/assets/animations/loading.png ./src/assets/animations/

# Copy all category icons
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/src/assets/category-icons/*.png ./src/assets/category-icons/
```

## ✅ Quick Copy-All Script

Create a script to copy everything at once:

```bash
#!/bin/bash
# save as: copy-assets.sh

DESKTOP_PATH="/Users/utilisateur/Desktop/TriggerWarningsExtension"
REPO_PATH="."

# Create directories
mkdir -p $REPO_PATH/store-assets
mkdir -p $REPO_PATH/landing/images/features
mkdir -p $REPO_PATH/src/assets/illustrations
mkdir -p $REPO_PATH/src/assets/animations
mkdir -p $REPO_PATH/src/assets/category-icons

# Copy extension icons
cp $DESKTOP_PATH/images/*.png $REPO_PATH/images/

# Copy store assets
cp $DESKTOP_PATH/store-assets/*.png $REPO_PATH/store-assets/

# Copy landing page assets
cp $DESKTOP_PATH/landing/images/hero-logo.png $REPO_PATH/landing/images/
cp $DESKTOP_PATH/landing/images/features/*.png $REPO_PATH/landing/images/features/
cp $DESKTOP_PATH/landing/images/*.png $REPO_PATH/landing/images/

# Copy extension UI assets
cp $DESKTOP_PATH/src/assets/illustrations/*.png $REPO_PATH/src/assets/illustrations/
cp $DESKTOP_PATH/src/assets/animations/*.png $REPO_PATH/src/assets/animations/
cp $DESKTOP_PATH/src/assets/category-icons/*.png $REPO_PATH/src/assets/category-icons/

echo "✅ All assets copied successfully!"
```

Run with:
```bash
chmod +x copy-assets.sh
./copy-assets.sh
```

## 📋 Verification Checklist

After copying, verify with:

```bash
# Check extension icons (should be 4 files)
ls -la images/icon*.png | wc -l

# Check store assets (should be 7 files)
ls -la store-assets/*.png | wc -l

# Check landing page features (should be 6 files)
ls -la landing/images/features/*.png | wc -l

# Check category icons (should be 28 files)
ls -la src/assets/category-icons/*.png | wc -l

# Check total PNG files
find . -name "*.png" -not -path "./node_modules/*" | wc -l
```

Expected totals:
- Extension icons: 4
- Store assets: 7
- Landing features: 6
- Landing other: 3 (hero-logo, social-preview, twitter-card)
- UI assets: 2 (empty-state, loading)
- Category icons: 28
- **Total: ~50 PNG files**

## 🔄 After Copying

Once files are copied, the following integration updates will be automatically applied:
1. Landing page HTML updated to reference new images
2. Category constants updated to use PNG icons
3. Build configuration updated to include assets
4. Social media meta tags added with preview images

---

**Note**: If you're on a different system where the desktop path differs, update the `DESKTOP_PATH` variable in the script accordingly.
