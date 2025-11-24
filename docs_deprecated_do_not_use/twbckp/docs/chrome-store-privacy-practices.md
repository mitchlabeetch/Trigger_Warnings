# Chrome Web Store - Privacy Practices & Submission Requirements

**Extension Name**: Trigger Warnings
**Version**: 2.0.0
**Last Updated**: 2025-11-08

---

## PRIVACY PRACTICES TAB - ALL REQUIRED JUSTIFICATIONS

### 1. SINGLE PURPOSE DESCRIPTION (Required)

**Character Limit**: 500 characters max

```
This extension provides advance trigger warnings for sensitive content on streaming platforms. It detects and displays warnings for 27 trigger categories (violence, gore, sexual content, medical procedures, etc.) by analyzing video subtitles in real-time and querying a community database. Users receive 5-second advance notifications before potentially triggering content, allowing them to prepare, skip, or continue watching. The extension supports 7 major streaming platforms and includes photosensitivity detection to protect viewers with epilepsy.
```

**Character Count**: 499 characters ✓

---

### 2. PERMISSION JUSTIFICATIONS

#### **A. activeTab Permission**

**Justification**:
```
The activeTab permission is required to:

1. Access the video player element on the current streaming platform tab to detect media playback state and current playback position
2. Inject the warning banner UI overlay into the video player interface at the precise moment triggers are detected
3. Analyze subtitle/caption tracks in real-time to detect trigger keywords as content plays
4. Monitor video element for photosensitivity detection (flashing light analysis) to protect users with epilepsy

This permission is only used when the user is actively watching content on supported streaming platforms. No data from other tabs is accessed or collected.
```

---

#### **B. alarms Permission**

**Justification**:
```
The alarms permission is required to:

1. Schedule periodic checks for warning database updates (every 24 hours) to ensure users have the latest community-submitted trigger warnings
2. Manage timed countdown notifications that display "5 seconds until trigger" advance warnings based on video playback position
3. Clean up expired warning cache data to maintain performance and storage efficiency

All alarm operations run locally in the browser. No external services are contacted except for scheduled database updates from our Supabase backend (anonymous queries only).
```

---

#### **C. storage Permission**

**Justification**:
```
The storage permission is required to:

1. Save user preferences including enabled trigger categories (27 categories), display settings, and customization options
2. Store multiple user profiles with individual trigger preferences for different viewing contexts (personal, family, work-safe, etc.)
3. Cache warning data locally to reduce network requests and improve performance during video playback
4. Remember user's choice of warning lead time (3-60 seconds), banner position, font size, transparency, and theme preferences

All data is stored locally using chrome.storage.local and chrome.storage.sync. No personal information, viewing history, or video content is stored. Only anonymous video IDs and warning metadata are cached.
```

---

#### **D. tabs Permission**

**Justification**:
```
The tabs permission is required to:

1. Detect which streaming platform the user is currently viewing (Netflix, YouTube, Prime Video, Hulu, Disney+, Max, or Peacock) to load the appropriate platform-specific integration
2. Identify when a user navigates to a video playback page versus a browse/search page to activate warning detection only during actual video playback
3. Manage content script injection across multiple platform domains

This permission does NOT access tab content, browsing history, or user behavior. It only reads the tab URL to determine which streaming platform provider to initialize.
```

---

#### **E. Host Permissions** (netflix.com, youtube.com, primevideo.com, amazon.com, hulu.com, disneyplus.com, max.com, peacocktv.com, supabase.co)

**Justification**:
```
Host permissions are required for the following purposes:

STREAMING PLATFORMS (netflix.com, youtube.com, primevideo.com, amazon.com, hulu.com, disneyplus.com, max.com, peacocktv.com):
1. Detect and access the video player element to monitor playback state (play, pause, seek, current time)
2. Access subtitle/caption tracks for real-time trigger keyword analysis
3. Inject warning banner overlay UI into the video player interface
4. Analyze video frames for photosensitivity detection (rapid flashing that may trigger epilepsy)

DATABASE (supabase.co):
1. Query the community warning database using anonymous video IDs to retrieve trigger warnings
2. Submit user-contributed warnings (timestamps and categories only, no personal data)
3. Send community votes (confirm/refute warnings) to maintain database quality

NO PERSONAL DATA is collected from streaming platforms. Only the current video ID is extracted to query our database. No viewing history, account information, or user behavior is tracked or stored.

PRIVACY GUARANTEE: The extension does not modify, record, or transmit video content. All subtitle analysis and photosensitivity detection happens locally in the browser.
```

---

### 3. REMOTE CODE JUSTIFICATION (Required)

**Does your extension execute remote code?**

**Answer**: NO

**Justification**:
```
This extension does NOT execute remote code. All code is bundled within the extension package at build time.

The extension only makes data requests (not code requests) to:
1. Supabase database for trigger warning metadata (JSON data only)
2. MyMemory Translation API for subtitle translation (text translation only, optional feature)

All application logic, detection algorithms, and UI rendering code is contained within the extension bundle. No external JavaScript, eval(), or dynamic code execution is used.

The extension is built using TypeScript and Svelte, compiled to static JavaScript files using Vite. All dependencies are bundled at build time and included in the extension package.

Source code is publicly available at: https://github.com/lightmyfireadmin/triggerwarnings
```

---

## DATA HANDLING & PRIVACY CERTIFICATION

### **Data Usage Compliance**

**Question**: Does your extension collect or transmit user data?

**Answer**: YES (limited)

**Data Collected**:
```
WHAT IS COLLECTED:
1. Anonymous video IDs (e.g., Netflix ID, YouTube video ID) - used only to query warning database
2. User preference settings (enabled categories, display options) - stored locally only
3. Optional community contributions (warning timestamps and categories) - submitted anonymously

WHAT IS NOT COLLECTED:
❌ Personal information (name, email, account data)
❌ Viewing history or watch patterns
❌ Video content or screenshots
❌ Subtitle text content
❌ Location data
❌ Browser history
❌ Cookies or tracking identifiers
❌ Analytics or telemetry data
```

---

### **Data Handling Disclosures**

#### **A. What data is collected?**
```
1. ANONYMOUS VIDEO IDENTIFIERS
   - Type: Video IDs from streaming platforms (e.g., "81234567" for Netflix)
   - Purpose: Query warning database to retrieve trigger warnings for the current video
   - Storage: Cached locally for 24 hours, then auto-deleted
   - Transmission: Sent to Supabase database via HTTPS (anonymous query only)

2. USER PREFERENCES
   - Type: Settings data (enabled categories, display options, profiles)
   - Purpose: Remember user's trigger warning preferences and customization
   - Storage: Local browser storage only (chrome.storage.local)
   - Transmission: Never transmitted; stays on user's device

3. OPTIONAL COMMUNITY CONTRIBUTIONS
   - Type: Warning submissions (video ID, timestamp, category)
   - Purpose: Help other users by submitting missing trigger warnings
   - Storage: Stored in Supabase database
   - Transmission: Sent via HTTPS with anonymous user ID (UUID, not linked to identity)
```

#### **B. How is data used?**
```
1. Video IDs: Query database to retrieve relevant trigger warnings
2. Preferences: Customize warning display and enabled categories
3. Contributions: Build community database of trigger warnings
4. NO advertising, profiling, tracking, or third-party sharing
```

#### **C. Is data sold or shared with third parties?**
```
NO. We do not sell, share, rent, or monetize any user data.

Third-party services used:
1. Supabase (database hosting) - stores only anonymous video IDs and warning data
2. MyMemory API (optional subtitle translation) - receives only subtitle text for translation, no user identifiers

Neither service receives personally identifiable information.
```

#### **D. Is data transmitted securely?**
```
YES. All network requests use HTTPS encryption:
- Supabase database queries: HTTPS only
- MyMemory translation API: HTTPS only
- Content Security Policy enforces secure connections only
```

#### **E. Is data anonymized?**
```
YES. All data is anonymous or anonymized:
- Video IDs are generic platform identifiers, not linked to user accounts
- Community contributions use randomly generated UUIDs (not user identifiers)
- No tracking cookies, fingerprinting, or persistent identifiers
- IP addresses are not logged or stored
```

---

## CERTIFICATION STATEMENTS

### **Developer Program Policies Compliance**

**I certify that**:
```
✓ My extension complies with the Chrome Web Store Developer Program Policies
✓ The extension has a single purpose (providing trigger warnings for streaming content)
✓ User data handling is limited, secure, and transparent
✓ No deceptive, malicious, or prohibited content is included
✓ The extension does not violate user privacy
✓ All permissions are necessary for core functionality
✓ The extension does not collect sensitive or unnecessary data
✓ Users are informed about data collection and usage
✓ The privacy policy is publicly accessible and accurate
```

---

## ADDITIONAL DISCLOSURE REQUIREMENTS

### **Chrome Web Store Data Disclosures**

**Question**: Does your extension use cookies?
```
NO. This extension does not use cookies for tracking or analytics.
```

**Question**: Does your extension collect personally identifiable information?
```
NO. No PII is collected. Only anonymous video IDs and user preferences (stored locally).
```

**Question**: Does your extension collect health information?
```
NO. While users may enable categories related to health topics (medical procedures, eating disorders, etc.), the extension does not collect any health information about users.
```

**Question**: Does your extension collect financial information?
```
NO. No payment processing or financial data is collected.
```

**Question**: Does your extension collect authentication information?
```
NO. The extension does not access streaming platform login credentials or account information.
```

**Question**: Does your extension use analytics?
```
NO. Zero analytics, telemetry, or usage tracking.
```

---

## SCREENSHOT REQUIREMENTS

### **Minimum Requirements**
- At least 1 screenshot (1280x800 or 640x400 pixels)
- Recommended: 5 screenshots showing key features

### **Screenshot Checklist**
- [ ] Screenshot 1: Warning banner in action (see docs/graphic-assets-requirements.md)
- [ ] Screenshot 2: Settings/profile configuration
- [ ] Screenshot 3: Timeline view with warnings
- [ ] Screenshot 4: Category selection interface
- [ ] Screenshot 5: Multi-platform support showcase

**Note**: See `docs/graphic-assets-requirements.md` for detailed AI prompts to generate these screenshots.

---

## EMAIL VERIFICATION

**Requirement**: Verify your contact email before publishing

**Steps**:
1. Go to Chrome Web Store Developer Dashboard
2. Navigate to "Account" tab
3. Click "Verify Email"
4. Check your email inbox for verification link
5. Click the verification link
6. Return to dashboard to confirm verification

---

## PUBLICATION SETTINGS

### **Visibility**
```
Unlisted (for testing) → Public (after testing complete)
```

### **Distribution**
```
Geographic Distribution: All countries
Language: English (US)
```

### **Category**
```
Accessibility
```

---

## TESTING WITH UNLISTED EXTENSION

### **Steps to Publish as Unlisted for Testing**

1. **Complete all requirements** above
2. **Upload extension package** (ZIP from `npm run build`)
3. **Fill out all Privacy Practices fields** (use text above)
4. **Upload at least 1 screenshot**
5. **Set visibility to "Unlisted"**
6. **Click "Submit for Review"**
7. **Wait for approval** (1-3 business days)
8. **Install via unlisted link** to test
9. **Test thoroughly** on all 7 platforms
10. **Fix any issues** and submit update
11. **Change visibility to "Public"** when ready

### **Unlisted Benefits**
- Extension can be installed via direct link
- Not searchable in Chrome Web Store
- Not publicly listed
- Perfect for beta testing
- Can switch to Public anytime after approval

---

## PRE-SUBMISSION CHECKLIST

### **Required**
- [ ] Email verified
- [ ] Extension ZIP uploaded
- [ ] Single purpose description filled (500 chars max)
- [ ] All 6 permission justifications written
- [ ] Remote code justification provided
- [ ] Data usage compliance certified
- [ ] At least 1 screenshot uploaded
- [ ] Icon 128x128 included in package
- [ ] Privacy policy URL provided and accessible
- [ ] Support URL provided (GitHub issues)
- [ ] Official website URL provided

### **Recommended**
- [ ] 5 screenshots uploaded
- [ ] Small promotional tile uploaded (440x280)
- [ ] Detailed description optimized (from chrome-store-description.md)
- [ ] Short description finalized (132 chars max)
- [ ] All metadata fields completed
- [ ] Tested extension locally before submission
- [ ] Privacy policy reviewed for accuracy
- [ ] Support channels monitored (GitHub issues)

---

## COMMON REJECTION REASONS TO AVOID

❌ **Unclear permissions** - Use detailed justifications above ✓
❌ **Missing privacy policy** - Ensure URL is accessible ✓
❌ **Keyword stuffing** - Write naturally ✓
❌ **Misleading screenshots** - Show actual functionality ✓
❌ **Broken functionality** - Test thoroughly before submission ✓
❌ **Single purpose violation** - Extension has clear single purpose ✓
❌ **Excessive permissions** - All permissions are necessary ✓

---

## QUICK COPY-PASTE REFERENCE

### **Single Purpose** (500 chars):
```
This extension provides advance trigger warnings for sensitive content on streaming platforms. It detects and displays warnings for 27 trigger categories (violence, gore, sexual content, medical procedures, etc.) by analyzing video subtitles in real-time and querying a community database. Users receive 5-second advance notifications before potentially triggering content, allowing them to prepare, skip, or continue watching. The extension supports 7 major streaming platforms and includes photosensitivity detection to protect viewers with epilepsy.
```

### **Remote Code**:
```
NO - All code is bundled. Only data requests to Supabase (warnings) and MyMemory (translation).
```

### **Data Collected**:
```
Anonymous video IDs (for warning queries), user preferences (local storage only), optional community contributions (anonymous). NO personal info, viewing history, or tracking.
```

---

**Document Version**: 1.0
**For Extension Version**: 2.0.0
**Status**: Ready for submission
