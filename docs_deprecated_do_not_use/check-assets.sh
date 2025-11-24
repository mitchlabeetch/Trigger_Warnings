#!/bin/bash

# Check if assets were copied
echo "🔍 Checking for copied assets..."
echo ""

# Count files
ICONS=$(find ./images -name "*.png" 2>/dev/null | wc -l)
STORE=$(find ./store-assets -name "*.png" 2>/dev/null | wc -l)
LANDING=$(find ./landing/images -name "*.png" 2>/dev/null | wc -l)
CATEGORY=$(find ./src/assets/category-icons -name "*.png" 2>/dev/null | wc -l)
ILLUSTRATIONS=$(find ./src/assets/illustrations -name "*.png" 2>/dev/null | wc -l)
ANIMATIONS=$(find ./src/assets/animations -name "*.png" 2>/dev/null | wc -l)

echo "📊 Asset Count:"
echo "  Extension icons: $ICONS (expected: 4)"
echo "  Store assets: $STORE (expected: 7)"
echo "  Landing images: $LANDING (expected: 9)"
echo "  Category icons: $CATEGORY (expected: 28)"
echo "  Illustrations: $ILLUSTRATIONS (expected: 1)"
echo "  Animations: $ANIMATIONS (expected: 1)"
echo ""

TOTAL=$((ICONS + STORE + LANDING + CATEGORY + ILLUSTRATIONS + ANIMATIONS))
echo "  Total PNG files: $TOTAL (expected: 50)"
echo ""

if [ $TOTAL -gt 40 ]; then
    echo "✅ Assets detected! Ready to commit."
    echo ""
    echo "Run these commands to commit:"
    echo "  git add images/ landing/images/ store-assets/ src/assets/"
    echo "  git commit -m 'feat: Add all graphic assets (icons, screenshots, images)'"
    echo "  git push origin claude/generate-asset-prompts-011CUuZ7JragHrZMjppba2AB"
else
    echo "❌ Not enough assets found ($TOTAL/50). Please copy files first."
    echo ""
    echo "Files should be copied from your desktop to:"
    echo "  - ./images/ (4 icon files)"
    echo "  - ./store-assets/ (7 screenshot/promo files)"
    echo "  - ./landing/images/ (1 hero-logo + 2 social + 6 in features/)"
    echo "  - ./src/assets/category-icons/ (28 icon files)"
    echo "  - ./src/assets/illustrations/ (1 empty-state file)"
    echo "  - ./src/assets/animations/ (1 loading file)"
    echo ""
    echo "See ASSET_INTEGRATION_SUMMARY.md for detailed instructions."
fi
