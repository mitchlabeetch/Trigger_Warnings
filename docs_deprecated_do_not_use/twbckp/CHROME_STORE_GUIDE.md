# Chrome Web Store Submission Guide

Complete guide to publishing the Trigger Warnings extension on the Chrome Web Store.

## 📋 Prerequisites

- [ ] Chrome Web Store Developer Account ($5 one-time fee)
- [ ] Extension built and tested (`npm run build`)
- [ ] Store listing assets (screenshots, promotional images)
- [ ] Privacy policy URL

## 🔧 Step 1: Prepare Extension Package

### Build Production Version

```bash
# Build the extension
npm run build

# Create ZIP file for upload
cd dist
zip -r ../trigger-warnings-extension.zip .
cd ..

# Verify ZIP contents (should contain manifest.json at root)
unzip -l trigger-warnings-extension.zip | head -20
```

### Verify Manifest

Check that `dist/manifest.json` has correct information:

```json
{
  "manifest_version": 3,
  "name": "Trigger Warnings",
  "version": "1.0.0",
  "description": "Get advance warnings for sensitive content while streaming",
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "*://*.netflix.com/*",
    "*://*.youtube.com/*",
    "*://*.primevideo.com/*",
    "*://*.hulu.com/*",
    "*://*.disneyplus.com/*",
    "*://*.max.com/*",
    "*://*.peacocktv.com/*"
  ]
}
```

## 🎨 Step 2: Create Store Listing Assets

### Required Images

1. **Icon (128x128)** ✅
   - Already at: `public/icon-128.png`

2. **Small Promo Tile (440x280)** ⏳
   - Create promotional image with logo + tagline
   - Tools: Figma, Canva, or Photoshop

3. **Screenshots (1280x800 or 640x400)** ⏳
   - Minimum: 1 screenshot
   - Recommended: 3-5 screenshots showing key features
   - Capture:
     1. Warning banner in action
     2. Settings/profile configuration
     3. Category selection
     4. Timeline view with warnings
     5. Mobile view (optional)

4. **Marquee Promo Tile (1400x560)** - Optional
   - Large promotional banner for featured listings

### Screenshot Guide

**What to show:**
```
Screenshot 1: Warning Banner
- Show Netflix/YouTube with warning banner visible
- Highlight the 5-second advance notice
- Caption: "Get advance warnings before sensitive content appears"

Screenshot 2: Settings Panel
- Show profile management interface
- Display category toggles
- Caption: "Customize which warnings you see with profile support"

Screenshot 3: Timeline View
- Show video timeline with warning markers
- Multiple categories visible
- Caption: "See all warnings at a glance on the video timeline"

Screenshot 4: Category Selection
- Show the 28 category options
- Checkboxes for enabling/disabling
- Caption: "28 comprehensive trigger categories to choose from"

Screenshot 5: Real-Time Detection
- Subtitle analysis in action
- Translation features
- Caption: "Works on any content with real-time subtitle analysis"
```

### Tools for Screenshots

```bash
# Install screenshot extension
# Chrome: "Awesome Screenshot" or "Nimbus Screenshot"

# Or use browser DevTools
# 1. Open extension on streaming site
# 2. Press F12 → Device Toolbar
# 3. Set to 1280x800
# 4. Take screenshot
```

## 📝 Step 3: Write Store Listing Copy

### Short Description (132 characters max)

```
Get advance warnings for triggers in streaming content. Real-time detection, 28 categories, 100% private.
```

### Detailed Description

```markdown
Trigger Warnings helps you watch streaming content with confidence by providing advance warnings for sensitive content.

⭐ KEY FEATURES

🔔 Advance Warnings
Get 5-second advance notice before potentially triggering content appears. Warnings display as a subtle banner that doesn't spoil the content.

🎯 28 Comprehensive Categories
Choose exactly which warnings you want to see:
• Violence, Gore, Blood, Murder
• Suicide, Self-Harm, Mental Health
• Sexual Assault, Domestic Violence
• Medical Procedures, Needles, Vomit
• Animal Cruelty, Death of Pets
• Eating Disorders, Body Shaming
• Racial Violence, LGBTQ+ Phobia
• Child Abuse, Torture
• Substance Abuse, Alcohol
• Flashing Lights (Photosensitivity)
• And more...

👥 Multiple Profiles
Create different profiles for different viewing contexts:
• Work-Safe mode
• Family viewing
• Personal viewing
• Custom profiles

🌍 Works on Any Language
Real-time subtitle analysis with automatic translation support (200+ languages). Works even on content not in our database.

📊 Community Database
5,000+ pre-seeded warnings from IMDb Parental Guide. Help improve coverage by submitting warnings with precise timestamps.

🔒 100% Private
All processing happens locally on your device. No tracking, no viewing history, no personal data collected. Your privacy is guaranteed.

✨ Real-Time Detection
• Subtitle/caption analysis with keyword detection
• Photosensitivity detection (WCAG 2.1 compliant)
• Works on content without database entries

🎬 SUPPORTED PLATFORMS

• Netflix
• YouTube
• Prime Video
• Hulu
• Disney+
• Max (HBO Max)
• Peacock

📱 HOW IT WORKS

1. Install the extension
2. Choose which categories you want warnings for
3. Start watching on any supported platform
4. Get notified 5 seconds before triggers appear
5. Skip, prepare, or continue watching - your choice

🎨 CUSTOMIZATION

• Adjustable banner position (top/bottom)
• Font size control
• Transparency settings
• Warning lead time (3-10 seconds)
• Dark/light/auto themes

🤝 COMMUNITY-POWERED

Help make the extension better for everyone:
• Submit warnings with timestamps
• Vote on warning accuracy
• Report false positives
• Contribute to category mapping

💡 WHO IS THIS FOR?

• People with PTSD or anxiety disorders
• Survivors processing trauma
• Parents monitoring content for children
• Anyone who wants to watch with more control
• Photosensitive viewers (epilepsy protection)
• People with specific phobias or sensitivities

🔐 PRIVACY & SECURITY

• No account required
• No data collection
• No tracking or analytics
• Open source (view the code on GitHub)
• All processing happens locally
• Only video IDs are queried from database

📖 LEARN MORE

• Website: https://lightmyfireadmin.github.io/triggerwarnings
• GitHub: https://github.com/lightmyfireadmin/triggerwarnings
• Report Issues: https://github.com/lightmyfireadmin/triggerwarnings/issues
• Privacy Policy: [YOUR_PRIVACY_POLICY_URL]

---

Trigger Warnings is completely free and open source. No subscriptions, no hidden costs, no premium tiers.

Take control of your viewing experience. Watch with confidence.
```

## 🔒 Step 4: Privacy Policy

Chrome Web Store **requires** a privacy policy. Create one at:

**Option 1: Use a privacy policy generator**
- https://www.privacypolicies.com/
- https://www.freeprivacypolicy.com/

**Option 2: Host on GitHub Pages**
Create `landing/privacy.html` with your privacy policy, then link to:
```
https://lightmyfireadmin.github.io/triggerwarnings/privacy.html
```

**Required sections:**
1. What data is collected (none, except video IDs for database queries)
2. How data is used (video IDs only used for warning lookups)
3. Third-party services (MyMemory Translation API, Supabase database)
4. Data storage (localStorage for preferences and cache)
5. User rights (can clear all data in extension settings)

## 📤 Step 5: Submit to Chrome Web Store

### 1. Register Developer Account

1. Go to: https://chrome.google.com/webstore/devconsole
2. Pay $5 one-time registration fee
3. Accept developer agreement

### 2. Create New Item

1. Click "New Item"
2. Upload `trigger-warnings-extension.zip`
3. Wait for automated checks to complete

### 3. Fill Out Store Listing

**Product Details:**
- **Language:** English (US)
- **Extension name:** Trigger Warnings
- **Short description:** [Use text from Step 3]
- **Detailed description:** [Use text from Step 3]
- **Category:** Accessibility
- **Language:** English

**Graphic Assets:**
- Upload icon (128x128)
- Upload screenshots (1280x800) - minimum 1, recommended 5
- Upload small promo tile (440x280)
- Upload marquee tile (1400x560) - optional

**Additional Fields:**
- **Official URL:** https://lightmyfireadmin.github.io/triggerwarnings
- **Privacy policy:** [YOUR_PRIVACY_POLICY_URL]
- **Support URL:** https://github.com/lightmyfireadmin/triggerwarnings/issues

**Pricing & Distribution:**
- **Price:** Free
- **Regions:** All regions
- **Visibility:** Public

**Permissions Justification:**
Explain why you need each permission:

```
Storage: Required to save user preferences, profiles, and warning cache
ActiveTab: Required to inject warning banner into streaming video pages
Host Permissions (Netflix, YouTube, etc.): Required to detect videos and display warnings on supported streaming platforms
```

### 4. Submit for Review

1. Click "Submit for Review"
2. Review typically takes 1-3 business days
3. You'll receive email notification

## 🎯 Post-Submission

### Track Metrics

Monitor in Chrome Web Store Developer Dashboard:
- **Installs:** Daily/weekly/total installations
- **Uninstalls:** Track churn rate
- **User ratings:** Average rating and review count
- **Impressions:** How often your extension appears in search

### Respond to Reviews

- Reply to user feedback (good and bad)
- Address bug reports quickly
- Thank users for suggestions

### Updates

To release updates:

```bash
# 1. Update version in package.json
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# 2. Rebuild extension
npm run build

# 3. Create new ZIP
cd dist && zip -r ../trigger-warnings-extension.zip . && cd ..

# 4. Upload to Chrome Web Store Dashboard
# 5. Submit for review
```

## 🚀 Marketing Checklist

After approval:

- [ ] Update landing page with Chrome Web Store URL
- [ ] Post on Twitter/X
- [ ] Submit to Product Hunt
- [ ] Post on Reddit (r/chrome, r/accessibility, r/ptsd)
- [ ] Post on Hacker News "Show HN"
- [ ] Email to DoesTheDogDie.com (partnership?)
- [ ] Reach out to mental health organizations
- [ ] Create demo video for YouTube
- [ ] Write blog post about development journey

## 📊 Chrome Web Store Optimization (ASO)

**Keywords to target:**
- trigger warnings
- content warnings
- streaming safety
- ptsd support
- accessibility
- photosensitivity
- sensitive content
- parental controls

**Optimize for search:**
- Include keywords in description naturally
- Use relevant categories and tags
- Encourage reviews (higher ratings = better ranking)
- Regular updates (shows extension is maintained)

## ⚠️ Common Rejection Reasons

Avoid these issues:

1. **Unclear permissions** - Clearly explain why each permission is needed
2. **Missing privacy policy** - Required for all extensions
3. **Keyword stuffing** - Write naturally, don't spam keywords
4. **Misleading screenshots** - Show actual functionality
5. **Broken functionality** - Test thoroughly before submitting
6. **Malware/suspicious code** - Ensure clean build
7. **Single purpose policy violation** - Extension should do one thing well

## 🎉 Launch Day Checklist

- [ ] Extension approved and published
- [ ] Landing page updated with install link
- [ ] Privacy policy live
- [ ] GitHub README updated
- [ ] Social media posts scheduled
- [ ] Product Hunt submission ready
- [ ] Demo video uploaded
- [ ] Press kit prepared
- [ ] Support email/GitHub issues monitored

---

**Need Help?**

- Chrome Web Store Help: https://support.google.com/chrome_webstore/
- Extension Development Docs: https://developer.chrome.com/docs/extensions/
- This project: https://github.com/lightmyfireadmin/triggerwarnings/issues
