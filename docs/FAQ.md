# Frequently Asked Questions (FAQ)

Quick answers to common questions about Trigger Warnings.

---

## 📋 Table of Contents

- [General](#general)
- [Privacy & Security](#privacy--security)
- [Technical](#technical)
- [Content & Warnings](#content--warnings)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [Future Plans](#future-plans)

---

## General

### What is Trigger Warnings?

Trigger Warnings is a free, open-source browser extension that provides real-time content warnings for streaming platforms. It uses community-submitted warnings and experimental AI detection to alert you about potentially triggering content before it appears on screen.

### How much does it cost?

**100% free, forever.** No premium tiers, no ads, no data selling. It's open-source and community-funded (via donations, but never required).

### Which streaming platforms are supported?

Currently:
- ✅ Netflix
- ✅ Prime Video (Amazon)
- ✅ Hulu
- ✅ Disney+
- ✅ Max (HBO Max)
- ✅ Peacock
- ✅ YouTube

**Coming soon**: Apple TV+, Paramount+, Tubi, Crunchyroll

### Which browsers are supported?

- ✅ **Chrome** (v88+)
- ✅ **Edge** (Chromium, v88+)
- ✅ **Brave** (v1.20+)
- ✅ **Firefox** (v91+)
- 🔜 **Safari** (Q3-Q4 2025)
- ❌ Opera (technically works, not officially tested)

### Does it work on mobile?

**Not yet.** Browser extensions have very limited support on mobile browsers. We're exploring:
- Native mobile apps (iOS/Android)
- Browser-specific solutions (Firefox for Android supports some extensions)

### What about smart TVs / streaming devices?

Unfortunately, **no.** Extensions only work in web browsers on computers. Smart TVs and devices (Roku, Fire Stick, Apple TV) don't support browser extensions.

---

## Privacy & Security

### Do you track what I watch?

**No.** Your viewing history never leaves your device. We have **zero** visibility into:
- What shows/movies you watch
- When you watch them
- How long you watch
- Your Netflix/Hulu/etc. account info

### What data DO you collect?

Only **anonymous, aggregated warning data**:
- **What we store**: Warning timestamps (e.g., "Game of Thrones S01E01 has violence at 05:23")
- **What we DON'T store**: Who watched it, when, or any personal info

### Can other users see my warnings or votes?

**No.** All contributions are anonymous. We don't have user accounts (yet), so there's nothing to link to you.

### Is my data encrypted?

Yes:
- **In transit**: All API calls use HTTPS (TLS 1.3)
- **At rest**: Backend database (Supabase) encrypts all data
- **Locally**: Browser's built-in encryption protects stored preferences

### What about AI detection? Does that send my video to a server?

**No!** All AI processing happens **100% locally** in your browser using TensorFlow.js. Video frames never leave your device.

### Why do you need so many permissions?

We only request what's necessary:
- **Storage**: Save your preferences and cached warnings
- **Tabs**: Know which streaming site you're on
- **Active Tab**: See current video playback time
- **Host Permissions**: Inject warning UI on streaming sites
- **Alarms**: Check for warning updates periodically

Full explanation: [SECURITY.md](../SECURITY.md)

---

## Technical

### How does the extension detect what I'm watching?

We use **video player DOM inspection**:
1. Extension detects you're on Netflix (or other supported site)
2. Injects a content script that monitors the video player
3. Reads video metadata (title, episode, timestamp) from the page
4. Matches against our warning database
5. Displays warnings at the right time

**No screenshot capture or video analysis** (unless you enable experimental AI features).

### How accurate are the timestamps?

Pretty accurate! Usually within **±3 seconds**. Variations occur because:
- Different regions have different video edits
- Streaming platforms sometimes trim/add frames
- User's playback speed affects timing

### Does it slow down my browser or video playback?

**Minimal impact**:
- **RAM usage**: ~10-20MB (about one browser tab)
- **CPU usage**: <1% (unless AI detection is enabled, then ~5-10%)
- **Network**: ~100KB per show/movie (downloading warnings)

If you experience lag:
- Disable AI detection (Settings → "Local Detection" → OFF)
- Lower warning frequency (Settings → "Max warnings per minute")

### Can I use it with a VPN?

**Yes!** VPNs don't affect the extension. However:
- If your VPN blocks our API domain, warnings won't load
- Some streaming platforms block VPNs (not our issue)

### Does it work with ad blockers?

**Yes**, but don't block our API domain (`*.supabase.co`). Otherwise, warnings can't be fetched.

### Can I use it offline?

**Partially**:
- ✅ Warnings you've already loaded are cached
- ❌ New content requires internet to download warnings
- 🔜 Full offline mode planned (pre-download warning packs)

---

## Content & Warnings

### How do you determine what's a "trigger"?

We rely on **community consensus**. Triggers are subjective, so we use a voting system:
- Users submit warnings with categories (violence, gore, spiders, etc.)
- Other users upvote (accurate) or downvote (inaccurate)
- Warnings with high downvotes are hidden

### What if I disagree with a warning?

That's okay! Triggers are personal. You can:
- **Disable that category**: Settings → Uncheck the category
- **Adjust sensitivity**: Settings → Set severity threshold (Mild/Moderate/Severe only)
- **Vote it down**: If you think it's objectively wrong (bad timestamp, wrong type)

### What if a warning is missing?

**Add it!** Click the extension icon → "Add Warning". Takes ~30 seconds.

### What if a warning is wrong (bad timing, wrong type)?

**Downvote it**. Enough downvotes will hide it for everyone. You can also:
- Submit a corrected version (same timestamp, better info)
- Report malicious warnings (spam, spoilers)

### Do you moderate warnings?

**Community-moderated** + automated filters:
- Obvious spam (e.g., all warnings at 00:00) is auto-removed
- Downvoted warnings are hidden after a threshold
- Moderators (trusted community members) can remove malicious content

### Can I add custom trigger categories?

**Not yet**, but it's on the roadmap! Currently, you can only choose from predefined categories. Custom categories will be added in a future version.

### What about spoilers?

**Warnings should NOT contain spoilers.** Guidelines:
- ✅ Good: "Violence (fight scene)"
- ❌ Bad: "Violence (John kills the villain)"

If a warning contains spoilers, **downvote and report it**.

---

## Contributing

### How can I help if I'm not a developer?

Lots of ways!
- **Add warnings**: Use the extension to tag triggers
- **Vote on warnings**: Help validate community submissions
- **Spread the word**: Tell friends, share on social media
- **Provide feedback**: Open a [discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions)
- **Test new features**: Join our beta program (coming soon)

### I found a bug. Where do I report it?

[GitHub Issues](https://github.com/mitchlabeetch/Trigger_Warnings/issues) → "New Issue" → "Bug Report"

Include:
- Browser and version
- Extension version
- Steps to reproduce
- Screenshots/console errors

### I have a feature idea. Who do I tell?

[GitHub Discussions](https://github.com/mitchlabeetch/Trigger_Warnings/discussions) → "Ideas"

Or open a [feature request issue](https://github.com/mitchlabeetch/Trigger_Warnings/issues).

### Can I contribute code?

**Yes!** See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full guide.

Quick start:
1. Fork the repo
2. Create a branch (`git checkout -b feature/my-feature`)
3. Make changes
4. Submit a Pull Request

### How do I add support for a new streaming platform?

See [docs/PROVIDERS.md](PROVIDERS.md) for a detailed guide. TL;DR:
1. Create a new provider class extending `BaseProvider`
2. Implement video detection and time-tracking
3. Add manifest permissions
4. Test on the platform
5. Submit a PR

---

## Troubleshooting

### Extension icon is grayed out

**Cause**: You're not on a supported streaming site, or the page hasn't fully loaded.

**Fix**: 
- Navigate to Netflix, Hulu, etc.
- Refresh the page (Ctrl+R / Cmd+R)
- Check that the extension is enabled (`chrome://extensions/`)

### Warnings not showing up

**Possible causes:**
1. **No warnings exist**: Be the first to add them!
2. **Category disabled**: Check Settings → Ensure category is enabled
3. **Cache issue**: Settings → "Clear cache" → Reload page
4. **Content not identified**: Some shows lack IMDb IDs (rare)

### "Failed to load warnings" error

**Causes:**
- No internet connection
- API server is down (check [status page](#))
- Browser is blocking requests (check ad blocker)

**Fix:**
- Check internet connection
- Disable ad blocker for `*.supabase.co`
- Refresh the page

### Extension slowing down my browser

**Fixes:**
1. Disable AI detection: Settings → "Local Detection" → OFF
2. Close unused tabs (free up RAM)
3. Update to latest extension version
4. Restart browser

### Warning timestamps are off

**Causes:**
- Regional video differences
- Playback speed (1.5x, 2x) affects timing
- Database timestamp was submitted incorrectly

**Fix:**
- Submit a corrected warning
- Downvote the incorrect one

---

## Future Plans

### When will [feature X] be added?

Check our [Roadmap](ROADMAP.md) for planned features and timelines. Current priorities:
1. Safari support (Q3-Q4 2025)
2. Custom trigger categories (Q2 2025)
3. Mobile apps (Q4 2025 - Q1 2026)
4. Advanced AI detection (ongoing)

### Will you ever charge for this?

**No.** The core extension will always be free. Possible future revenue (to cover costs):
- **Donations** (Patreon, GitHub Sponsors)
- **Partnerships** (with streaming platforms or creators)
- **Enterprise API** (for studios to self-report warnings)

But the extension will **never** require payment.

### Can I download the warning database?

**Not yet**, but it's planned! We'll offer:
- Full database exports (JSON, CSV)
- API access for researchers/developers
- Bulk warning uploads for content creators

Stay tuned!

### Will you add [streaming platform X]?

We want to support as many platforms as possible! Priority is based on:
- User demand (request it in [Discussions](https://github.com/mitchlabeetch/Trigger_Warnings/discussions))
- Technical feasibility (some platforms block extensions)
- Developer availability (we're a small team + community)

To request a platform: Open a [feature request](https://github.com/mitchlabeetch/Trigger_Warnings/issues).

---

## Still Have Questions?

- **User Guide**: [docs/USER_GUIDE.md](USER_GUIDE.md)
- **GitHub Discussions**: https://github.com/mitchlabeetch/Trigger_Warnings/discussions
- **GitHub Issues**: https://github.com/mitchlabeetch/Trigger_Warnings/issues
- **Email**: support@triggerwarnings.app (coming soon)

---

<div align="center">

**Didn't find your answer? [Ask in Discussions](https://github.com/mitchlabeetch/Trigger_Warnings/discussions)** 💬

[Back to README](../README.md)

</div>
