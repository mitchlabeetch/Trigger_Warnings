# Deployment Guide

Quick reference for deploying the landing page and extension.

## 🌐 GitHub Pages Deployment

### Automatic Deployment (Recommended)

The landing page deploys automatically via GitHub Actions whenever you push to `main`.

**Setup Steps:**

1. **Enable GitHub Pages:**
   ```bash
   # Go to your repo: https://github.com/lightmyfireadmin/triggerwarnings
   # Navigate to: Settings → Pages
   # Under "Build and deployment":
   #   - Source: GitHub Actions
   #
   # The workflow at .github/workflows/deploy-pages.yml handles everything
   ```

2. **Your site will be live at:**
   ```
   https://lightmyfireadmin.github.io/triggerwarnings/
   ```

3. **Test locally first:**
   ```bash
   cd landing
   python -m http.server 8000
   # Visit: http://localhost:8000
   ```

4. **Deploy to GitHub:**
   ```bash
   git add landing/
   git commit -m "Update landing page"
   git push origin main

   # GitHub Actions will automatically deploy
   # Check progress: Actions tab on GitHub
   ```

### Manual Deployment

Trigger deployment manually:
```bash
# Go to: Actions → Deploy Landing Page to GitHub Pages
# Click: "Run workflow" → "Run workflow"
```

### Custom Domain (Optional)

1. **Buy domain** (e.g., triggerwarnings.app from Namecheap, Google Domains)

2. **Configure DNS:**
   ```
   Type: CNAME
   Name: www
   Value: lightmyfireadmin.github.io

   Type: A (root domain)
   Value: 185.199.108.153
   Value: 185.199.109.153
   Value: 185.199.110.153
   Value: 185.199.111.153
   ```

3. **Add CNAME file:**
   ```bash
   echo "www.triggerwarnings.app" > landing/CNAME
   git add landing/CNAME
   git commit -m "Add custom domain"
   git push origin main
   ```

4. **Configure in GitHub:**
   - Settings → Pages → Custom Domain
   - Enter: www.triggerwarnings.app
   - Check: "Enforce HTTPS"

## 📦 Chrome Web Store Deployment

### 1. Build Extension

```bash
# Build production version
npm run build

# Package for Chrome Web Store
chmod +x scripts/package-extension.sh
./scripts/package-extension.sh

# This creates: trigger-warnings-v1.0.0.zip
```

### 2. Register Developer Account

1. Go to: https://chrome.google.com/webstore/devconsole
2. Pay $5 one-time registration fee
3. Accept developer agreement

### 3. Upload Extension

1. Click "New Item"
2. Upload the ZIP file created above
3. Wait for automated checks (~2 minutes)

### 4. Complete Store Listing

Follow the detailed guide in `CHROME_STORE_GUIDE.md`:

- Upload screenshots (1280x800)
- Write store description
- Add privacy policy URL
- Set pricing (free)
- Select category (Accessibility)
- Justify permissions

**Quick checklist:**
- [ ] Icon uploaded (128x128)
- [ ] Screenshots added (minimum 1, recommended 5)
- [ ] Description written (see CHROME_STORE_GUIDE.md)
- [ ] Privacy policy URL: `https://lightmyfireadmin.github.io/triggerwarnings/privacy.html`
- [ ] Official URL: `https://lightmyfireadmin.github.io/triggerwarnings`
- [ ] Support URL: `https://github.com/lightmyfireadmin/triggerwarnings/issues`

### 5. Submit for Review

1. Click "Submit for Review"
2. Wait 1-3 business days
3. Receive email notification

### 6. After Approval

Update landing page with Chrome Web Store URL:

```bash
# Edit landing/index.html
# Find line ~85 and update:
<a href="https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID" class="btn btn-primary">
    Install for Chrome
</a>

git add landing/index.html
git commit -m "Add Chrome Web Store link"
git push origin main
```

## 🔄 Release Workflow

### Version Update

```bash
# Patch: 1.0.0 → 1.0.1 (bug fixes)
npm version patch

# Minor: 1.0.0 → 1.1.0 (new features)
npm version minor

# Major: 1.0.0 → 2.0.0 (breaking changes)
npm version major
```

### Complete Release Process

```bash
# 1. Update version
npm version minor  # or patch/major

# 2. Rebuild extension
npm run build

# 3. Package for Chrome Web Store
./scripts/package-extension.sh

# 4. Commit version bump
git add package.json package-lock.json
git commit -m "chore: Bump version to $(node -p "require('./package.json').version")"
git push origin main

# 5. Create GitHub release
git tag v$(node -p "require('./package.json').version")
git push origin --tags

# 6. Upload to Chrome Web Store
# - Go to developer dashboard
# - Upload new ZIP
# - Submit for review

# 7. Update landing page if needed
# Edit landing/index.html with new features
git add landing/
git commit -m "docs: Update landing page for new release"
git push origin main
```

## 🎯 Pre-Launch Checklist

Before going public:

### Landing Page
- [ ] GitHub Pages enabled and working
- [ ] Privacy policy accessible
- [ ] All links functional
- [ ] Mobile responsive
- [ ] Analytics added (optional)
- [ ] SEO meta tags optimized

### Extension
- [ ] All features tested on all platforms
- [ ] No console errors
- [ ] Performance optimized
- [ ] Chrome Web Store approved
- [ ] Version number matches across all files

### Documentation
- [ ] README.md updated
- [ ] FEATURES.md accurate
- [ ] Installation instructions clear
- [ ] Contribution guidelines added
- [ ] Code of conduct added

### Marketing
- [ ] Screenshots captured
- [ ] Demo video created (optional)
- [ ] Social media posts drafted
- [ ] Product Hunt listing prepared
- [ ] Reddit posts planned
- [ ] Email list setup (optional)

## 🐛 Troubleshooting

### GitHub Pages Not Deploying

```bash
# Check workflow status
# Go to: Actions tab on GitHub
# Look for failed deployments

# Common fixes:
# 1. Ensure workflow file exists: .github/workflows/deploy-pages.yml
# 2. Check GitHub Pages settings: Settings → Pages
# 3. Verify main branch is default: Settings → Branches
```

### Extension ZIP Upload Fails

```bash
# Verify ZIP structure
unzip -l trigger-warnings-v1.0.0.zip | head -20

# manifest.json should be at root, not in subfolder
# If wrong structure:
cd dist
zip -r ../trigger-warnings-v1.0.0.zip .
cd ..
```

### Privacy Policy Not Accessible

```bash
# Ensure file exists
ls landing/privacy.html

# Test locally
cd landing
python -m http.server 8000
# Visit: http://localhost:8000/privacy.html

# After deploying to GitHub Pages:
# URL: https://lightmyfireadmin.github.io/triggerwarnings/privacy.html
```

## 📊 Post-Deployment Monitoring

### Chrome Web Store Metrics

Monitor in Developer Dashboard:
- Daily installs
- Uninstall rate
- User reviews
- Crash reports

### Landing Page Analytics

Add Google Analytics or Plausible:

```html
<!-- Plausible (privacy-friendly) -->
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### GitHub Insights

Track repo activity:
- Stars / Forks
- Issues / PRs
- Traffic analytics
- Clone statistics

## 🚀 Marketing Launch

After everything is deployed:

1. **Announce on social media:**
   - Twitter/X
   - Reddit (r/chrome, r/accessibility, r/ptsd)
   - Hacker News "Show HN"
   - Product Hunt

2. **Reach out to communities:**
   - Mental health organizations
   - Accessibility advocates
   - PTSD support groups
   - Content creator communities

3. **Create content:**
   - Blog post about development journey
   - Demo video on YouTube
   - Tutorial for users
   - Press kit for journalists

4. **Monitor and iterate:**
   - Respond to user feedback
   - Fix reported bugs quickly
   - Plan feature updates based on requests
   - Maintain active community engagement

---

**Need Help?**

- GitHub Pages: https://docs.github.com/en/pages
- Chrome Web Store: https://developer.chrome.com/docs/webstore/
- This Project: https://github.com/lightmyfireadmin/triggerwarnings/issues
