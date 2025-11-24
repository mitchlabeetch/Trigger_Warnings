# Next Development Steps

## Immediate Priority (Phase 4)

### 1. Database Integration & Configuration
**Estimated Time:** 30 minutes

- [ ] Create new Supabase project at https://supabase.com
- [ ] Run `database/schema.sql` in Supabase SQL Editor
- [ ] Enable anonymous authentication in Supabase Auth settings
- [ ] Get new API credentials (URL and anon key)
- [ ] Update `src/core/api/SupabaseClient.ts` with new credentials
- [ ] Update `.env` file with credentials (if using env vars)
- [ ] Test database connection with simple query

**Files to modify:**
- `src/core/api/SupabaseClient.ts` - Update SUPABASE_URL and SUPABASE_ANON_KEY

### 2. Testing & Validation
**Estimated Time:** 2-3 hours

- [ ] Test extension installation in Chrome
- [ ] Test each streaming provider (all 7 platforms):
  - [ ] Netflix - Video detection and banner display
  - [ ] Prime Video - Video detection and banner display
  - [ ] YouTube - Video detection and banner display
  - [ ] Hulu - Video detection and banner display
  - [ ] Disney+ - Video detection and banner display
  - [ ] Max - Video detection and banner display
  - [ ] Peacock - Video detection and banner display
- [ ] Test warning submission flow:
  - [ ] Submit a warning for test video
  - [ ] Verify it appears in database as 'pending'
  - [ ] Vote up/down on warnings
  - [ ] Verify auto-approval at +3 score
  - [ ] Verify auto-rejection at -5 score
- [ ] Test profile system:
  - [ ] Create new profile
  - [ ] Switch between profiles
  - [ ] Enable/disable categories
  - [ ] Delete profile
- [ ] Test banner behavior:
  - [ ] Warning appears before trigger
  - [ ] Warning becomes "Active" during trigger
  - [ ] Ignore this time functionality
  - [ ] Ignore for video functionality

**Known Issues to Watch For:**
- Anonymous auth initialization timing
- Provider detection on page load vs navigation
- Video element finding in different platform states
- Banner z-index conflicts with platform UI

---

## High Priority (Phase 5)

### 3. Enhanced UI/UX Features
**Estimated Time:** 4-5 hours

#### 3.1 Profile Management UI
- [ ] Add "Create Profile" button to popup
- [ ] Create `ProfileCreate.svelte` component with form:
  - Profile name input
  - "Copy settings from" dropdown (optional)
  - Create button
- [ ] Add "Delete Profile" button (with confirmation)
- [ ] Add profile rename functionality
- [ ] Add profile export/import buttons

**New files:**
- `src/popup/components/ProfileCreate.svelte`
- `src/popup/components/ProfileDelete.svelte`
- `src/popup/components/ProfileExport.svelte`

#### 3.2 Advanced Settings UI
- [ ] Create Settings tab in options page
- [ ] Add banner position selector:
  - Top-left, Top-right, Bottom-left, Bottom-right
  - Preview visualization
- [ ] Add banner appearance customization:
  - Size slider (small/medium/large)
  - Opacity slider
  - Duration before trigger (5-60 seconds)
- [ ] Add spoiler-free mode toggle
- [ ] Add theme selector (light/dark/auto)

**Files to modify:**
- `src/options/Options.svelte` - Add Settings tab
- `src/shared/types/Profile.types.ts` - Add UI preference fields
- `src/content/banner/Banner.svelte` - Apply position/appearance settings

#### 3.3 Helper Mode Features
- [ ] Add "Confirm" button to banner (when warning is active)
- [ ] Add "This is wrong" button to banner
- [ ] Show visual feedback when vote is submitted
- [ ] Add toast notifications for user actions
- [ ] Show warning confidence level in banner

**Files to modify:**
- `src/content/banner/Banner.svelte` - Add helper mode buttons
- `src/content/banner/BannerManager.ts` - Handle feedback actions

---

### 4. Error Handling & Edge Cases
**Estimated Time:** 2-3 hours

- [ ] Add comprehensive error handling to SupabaseClient:
  - Network errors with retry logic
  - Rate limiting handling
  - Invalid response handling
- [ ] Add fallback behavior when database is unreachable:
  - Show cached warnings if available
  - Graceful degradation message
- [ ] Handle extension update scenarios:
  - Migrate storage schema if needed
  - Preserve user profiles
- [ ] Add validation to warning submission:
  - Validate time ranges
  - Sanitize description input
  - Prevent duplicate submissions
- [ ] Handle provider edge cases:
  - Multiple videos on page (playlists)
  - Video ID changes during playback
  - Platform UI updates breaking selectors

**Files to modify:**
- `src/core/api/SupabaseClient.ts` - Add error handling
- `src/popup/components/SubmitWarning.svelte` - Add validation
- All provider files - Add edge case handling

---

### 5. Performance Optimization
**Estimated Time:** 2 hours

- [ ] Implement warning cache in memory:
  - Cache fetched warnings for 5 minutes
  - Reduce database queries
- [ ] Optimize video time polling:
  - Use requestAnimationFrame instead of setInterval
  - Pause polling when video is paused
- [ ] Lazy load Svelte components:
  - Only load popup components when needed
  - Defer non-critical initialization
- [ ] Reduce bundle size:
  - Code splitting for provider files
  - Tree-shake unused Tailwind classes
- [ ] Add service worker keepalive optimization:
  - Only run when actively needed
  - Reduce memory footprint

**Files to modify:**
- `src/core/warning-system/WarningManager.ts` - Add caching
- `src/content/index.ts` - Optimize polling
- `vite.config.ts` - Add code splitting

---

## Medium Priority (Phase 6)

### 6. Moderation Dashboard
**Estimated Time:** 4-6 hours

- [ ] Create moderation page (`src/moderation/Moderation.svelte`)
- [ ] Add to manifest as new page
- [ ] Display pending warnings queue
- [ ] Add approve/reject buttons
- [ ] Show warning preview with video timestamp
- [ ] Display vote counts and confidence
- [ ] Add filtering (by platform, category, score)
- [ ] Add bulk actions (approve/reject multiple)

**New files:**
- `src/moderation/index.html`
- `src/moderation/Moderation.svelte`
- `src/moderation/components/WarningReview.svelte`

**Requires:** Moderator user role in database

---

### 7. Analytics & Insights
**Estimated Time:** 3-4 hours

- [ ] Create stats page showing:
  - Total warnings in database
  - Warnings by category (bar chart)
  - Warnings by platform (pie chart)
  - Your contribution stats
  - Top contributors leaderboard
- [ ] Add to options page as new tab
- [ ] Use Chart.js or similar for visualizations
- [ ] Add export functionality (CSV/JSON)

**New files:**
- `src/options/components/Stats.svelte`
- `src/options/components/charts/CategoryChart.svelte`

---

### 8. Advanced Features
**Estimated Time:** 6-8 hours

#### 8.1 Video Metadata Integration
- [ ] Fetch and store video titles from platforms
- [ ] Display video title in warnings list
- [ ] Add search functionality by title
- [ ] Link warnings to IMDB/TMDB for better identification

#### 8.2 Sync Across Devices
- [ ] Use Supabase for profile storage (in addition to local)
- [ ] Add "Sync profiles" toggle in settings
- [ ] Sync enabled categories across devices
- [ ] Sync ignored warnings across devices

#### 8.3 Notification System
- [ ] Desktop notifications for upcoming warnings
- [ ] Notification preferences in settings
- [ ] Sound alerts option
- [ ] Custom notification duration

#### 8.4 Community Features
- [ ] Add comments to warnings
- [ ] Report inappropriate warnings
- [ ] User reputation system
- [ ] Trusted contributor badges

---

## Lower Priority (Polish & Future)

### 9. Cross-Browser Support
**Estimated Time:** 3-4 hours

- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Test in Safari (if possible)
- [ ] Add browser-specific polyfills if needed
- [ ] Create separate build configs for each browser
- [ ] Submit to browser extension stores

### 10. Accessibility Improvements
**Estimated Time:** 2-3 hours

- [ ] Add ARIA labels to all interactive elements
- [ ] Add keyboard navigation support
- [ ] Test with screen readers
- [ ] Add high contrast mode
- [ ] Add focus indicators
- [ ] Add skip links

### 11. Documentation
**Estimated Time:** 2-3 hours

- [ ] Create user guide (GUIDE.md)
- [ ] Add screenshots to README
- [ ] Create video demo
- [ ] Write privacy policy
- [ ] Write terms of service
- [ ] Create contributing guidelines
- [ ] Add code comments and JSDoc

### 12. Automated Testing
**Estimated Time:** 6-8 hours

- [ ] Set up Jest for unit tests
- [ ] Write tests for core systems:
  - StorageAdapter
  - ProfileManager
  - WarningManager
  - SupabaseClient
- [ ] Set up Playwright for E2E tests
- [ ] Write integration tests for providers
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add test coverage reporting

---

## Recommended Order of Execution

1. **Phase 4:** Database Integration & Testing (Immediate - validate everything works)
2. **Phase 5:** Enhanced UI/UX + Error Handling (High value, user-facing improvements)
3. **Phase 6:** Moderation Dashboard (Critical for community management)
4. **Phase 5:** Performance Optimization (Before public release)
5. **Phase 6:** Analytics & Insights (Nice to have, builds engagement)
6. **Phase 8:** Advanced Features (As needed based on user feedback)
7. **Future:** Cross-browser, Accessibility, Documentation, Testing

---

## Success Metrics

### Phase 4 Complete When:
- ✅ Extension loads without errors
- ✅ Can detect videos on all 7 platforms
- ✅ Warnings fetch from database
- ✅ Warnings display correctly
- ✅ Can submit new warnings
- ✅ Can vote on warnings

### Phase 5 Complete When:
- ✅ Can create/delete/rename profiles from UI
- ✅ Can customize banner position and appearance
- ✅ All error states handled gracefully
- ✅ Extension performs smoothly (no lag)

### Ready for Beta Release When:
- ✅ Phases 4-5 complete
- ✅ Manual testing completed on all platforms
- ✅ No critical bugs
- ✅ Basic documentation exists
- ✅ Privacy policy written

### Ready for Public Release When:
- ✅ Beta testing completed with users
- ✅ Moderation system working
- ✅ Performance optimized
- ✅ Cross-browser support
- ✅ Comprehensive documentation
- ✅ Automated tests passing
