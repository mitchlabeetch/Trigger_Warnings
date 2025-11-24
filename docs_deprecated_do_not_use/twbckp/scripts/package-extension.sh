#!/bin/bash

# Package Extension for Chrome Web Store Submission
# Creates a ZIP file ready for upload

set -e  # Exit on error

echo "🎁 Packaging Trigger Warnings Extension for Chrome Web Store..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  dist/ directory not found. Running build first...${NC}"
    npm run build
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
FILENAME="trigger-warnings-v${VERSION}.zip"

echo -e "${BLUE}📦 Version: ${VERSION}${NC}"
echo ""

# Remove old package if exists
if [ -f "$FILENAME" ]; then
    echo -e "${YELLOW}🗑️  Removing old package: ${FILENAME}${NC}"
    rm "$FILENAME"
fi

# Create ZIP package
echo -e "${BLUE}📁 Creating ZIP package...${NC}"
cd dist

# Exclude unnecessary files
zip -r "../${FILENAME}" . \
    -x "*.map" \
    -x "*.DS_Store" \
    -x "*.git*" \
    -x "*node_modules*" \
    -x "*.log"

cd ..

# Verify ZIP contents
echo ""
echo -e "${GREEN}✅ Package created: ${FILENAME}${NC}"
echo ""
echo -e "${BLUE}📋 ZIP Contents Preview:${NC}"
unzip -l "$FILENAME" | head -25

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Extension packaged successfully!${NC}"
echo ""
echo -e "${BLUE}📤 Next steps:${NC}"
echo "  1. Go to: https://chrome.google.com/webstore/devconsole"
echo "  2. Click 'New Item'"
echo "  3. Upload: ${FILENAME}"
echo "  4. Fill out store listing (see CHROME_STORE_GUIDE.md)"
echo "  5. Submit for review"
echo ""
echo -e "${YELLOW}⚠️  Important checklist before uploading:${NC}"
echo "  • Privacy policy URL ready"
echo "  • Screenshots prepared (1280x800)"
echo "  • Store description written"
echo "  • Icon uploaded (128x128)"
echo "  • All permissions justified"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
