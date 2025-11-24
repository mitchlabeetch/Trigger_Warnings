# Quick Start: Copy Assets to Repository

## Current Status
- ✅ Code integration complete
- ❌ Image files need to be copied (3/50 currently in repo)

## How to Copy Files

### Using File Manager (Easiest)

1. **Open two file browser windows:**
   - Window 1: Your desktop folder `/Users/utilisateur/Desktop/TriggerWarningsExtension/`
   - Window 2: This repository `/home/user/triggerwarnings/`

2. **Drag and drop files:**
   - Drag `images/*.png` → Repo `images/` folder
   - Drag `store-assets/*.png` → Repo `store-assets/` folder
   - Drag `landing/images/*` → Repo `landing/images/` folder
   - Drag `src/assets/*` → Repo `src/assets/` folder

### Using Terminal

If both locations are accessible from terminal:

```bash
cd /home/user/triggerwarnings/

# Copy extension icons (4 files)
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/images/*.png ./images/

# Copy store assets (7 files)  
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/store-assets/*.png ./store-assets/

# Copy landing page hero logo
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/hero-logo.png ./landing/images/

# Copy landing page feature icons (6 files)
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/features/*.png ./landing/images/features/

# Copy social media images (2 files)
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/social-preview.png ./landing/images/
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/landing/images/twitter-card.png ./landing/images/

# Copy category icons (28 files)
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/src/assets/category-icons/*.png ./src/assets/category-icons/

# Copy illustrations (1 file)
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/src/assets/illustrations/*.png ./src/assets/illustrations/

# Copy animations (1 file)
cp /Users/utilisateur/Desktop/TriggerWarningsExtension/src/assets/animations/*.png ./src/assets/animations/
```

## Verify Files Were Copied

Run the verification script:

```bash
./check-assets.sh
```

Should show: `Total PNG files: 50 (expected: 50)` ✅

## Commit to Git

Once files are copied:

```bash
git add images/ landing/images/ store-assets/ src/assets/
git commit -m "feat: Add all graphic assets (icons, screenshots, images)"
git push origin claude/generate-asset-prompts-011CUuZ7JragHrZMjppba2AB
```

## Troubleshooting

**"Can't find desktop folder"**
- Verify the exact path to your TriggerWarningsExtension folder
- It might be in Downloads instead of Desktop
- Use `find ~ -name "TriggerWarningsExtension" -type d` to locate it

**"Permission denied"**
- Make sure you have read access to desktop folder
- Make sure you have write access to repository folder
- Try using `sudo` if necessary (not recommended)

**"Files not showing in Git"**
- Run `git status` to see if Git detected the new files
- Make sure files are in the correct directories
- Check file names match exactly (case-sensitive)

## Next Steps After Committing

1. **Merge to main branch** or create pull request
2. **Deploy to GitHub Pages** (automatic after merge)
3. **Test landing page** at https://lightmyfireadmin.github.io/triggerwarnings
4. **Submit to Chrome Web Store** using screenshots from `/store-assets/`

---

**Need help?** See `ASSET_INTEGRATION_SUMMARY.md` for full documentation.
