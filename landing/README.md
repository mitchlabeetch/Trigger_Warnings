# Trigger Warnings Landing Page

This directory contains the marketing/documentation landing page for the Trigger Warnings browser extension.

## 🚀 Deployment (GitHub Pages)

### Automatic Deployment (Recommended)

The landing page is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

**Setup Steps:**

1. **Enable GitHub Pages** in your repository:
   - Go to: `Settings` → `Pages`
   - Source: `GitHub Actions`
   - The workflow in `.github/workflows/deploy-pages.yml` will handle deployment

2. **Your site will be live at:**
   ```
   https://lightmyfireadmin.github.io/triggerwarnings/
   ```

3. **Custom Domain (Optional):**
   - Buy domain (e.g., `triggerwarnings.app`)
   - Add CNAME record pointing to: `lightmyfireadmin.github.io`
   - Add `CNAME` file to this directory with your domain
   - Configure in GitHub Settings → Pages → Custom Domain

### Manual Deployment

You can also manually deploy by:
1. Going to: `Actions` → `Deploy Landing Page to GitHub Pages`
2. Click: `Run workflow`

## 📝 Files

- **index.html** - Complete single-page website with:
  - Hero section with gradient background
  - Features grid (6 cards)
  - Platform support (7 streaming services)
  - Comprehensive FAQ (13 questions)
  - Modern CSS with animations
  - Mobile-responsive design

## 🛠️ Local Development

To test locally:

```bash
# Option 1: Python simple server
cd landing
python -m http.server 8000
# Visit: http://localhost:8000

# Option 2: Node.js http-server
npx http-server landing -p 8000
# Visit: http://localhost:8000
```

## 🔗 Update Download Links

Before deploying, update the installation links in `index.html`:

```html
<!-- Line ~85: Update Chrome Web Store URL -->
<a href="YOUR_CHROME_STORE_URL" class="btn btn-primary">
  Install for Chrome
</a>

<!-- Add Firefox Add-ons URL when ready -->
<a href="YOUR_FIREFOX_ADDONS_URL" class="btn btn-secondary">
  Install for Firefox
</a>
```

## 📊 Analytics (Optional)

To track visitors, add Google Analytics or privacy-friendly alternatives:

**Plausible Analytics** (Privacy-friendly, recommended):
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

**Google Analytics**:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🎨 Customization

The landing page uses CSS variables for easy theming:

```css
:root {
  --primary: #667eea;      /* Purple */
  --secondary: #764ba2;    /* Deep purple */
  --accent: #f093fb;       /* Pink accent */
}
```

Modify these in `index.html` (line ~16) to change the color scheme.

## 📱 Mobile Support

The page is fully responsive with breakpoints:
- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

Test on multiple devices before deploying!

## ✅ Pre-Launch Checklist

Before going live:

- [ ] Update Chrome Web Store download link
- [ ] Update GitHub repository link
- [ ] Add analytics (optional)
- [ ] Test on mobile devices
- [ ] Check all FAQ links work
- [ ] Verify all feature descriptions are accurate
- [ ] Test form submissions (if contact form added)
- [ ] Check HTTPS works (GitHub Pages auto-enables)
- [ ] SEO: Update meta description and title
- [ ] Add Open Graph tags for social sharing

## 🔍 SEO Tips

Current meta tags:
```html
<title>Trigger Warnings - Watch with Confidence</title>
<meta name="description" content="Community-powered trigger warnings for streaming content...">
```

Add these for better social sharing:

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://yourdomain.com/">
<meta property="og:title" content="Trigger Warnings - Watch with Confidence">
<meta property="og:description" content="Get advance warnings for sensitive content while streaming.">
<meta property="og:image" content="https://yourdomain.com/social-preview.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://yourdomain.com/">
<meta property="twitter:title" content="Trigger Warnings - Watch with Confidence">
<meta property="twitter:description" content="Get advance warnings for sensitive content while streaming.">
<meta property="twitter:image" content="https://yourdomain.com/social-preview.png">
```

## 🎯 Next Steps

1. ✅ GitHub Pages enabled
2. ⏳ Upload to Chrome Web Store
3. ⏳ Update download links in index.html
4. ⏳ Add analytics
5. ⏳ Share on social media
6. ⏳ Submit to Product Hunt / Hacker News
