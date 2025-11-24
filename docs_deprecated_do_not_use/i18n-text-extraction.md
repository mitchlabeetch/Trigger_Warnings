# Frontend Text Extraction for Internationalization

This document catalogs all user-facing text strings in the Trigger Warnings extension that need to be extracted for multilingual support.

## Current State

- **Existing i18n**: Chrome extension i18n structure exists at `_locales/en/messages.json` with 110+ keys
- **Issue**: New Svelte components (src/) have hardcoded English text and don't use the i18n system
- **Solution**: Extract all hardcoded strings and integrate with Chrome's i18n API

---

## Text Strings by Component

### 1. Popup Component (`src/popup/Popup.svelte`)

| Line | Text | Suggested Key | Context |
|------|------|---------------|---------|
| 179 | "Trigger Warnings" | `extensionName` | Header title (already exists) |
| 184 | "Loading..." | `popupLoading` | Loading state |
| 190 | "Active Profile" | `popupActiveProfile` | Section title |
| 191 | "Create new profile" | `popupCreateProfileTooltip` | Button tooltip |
| 199 | "categories enabled" | `popupCategoriesEnabled` | Profile stats |
| 203 | "Rename profile" | `popupRenameProfileTooltip` | Button tooltip |
| 207 | "Delete profile" | `popupDeleteProfileTooltip` | Button tooltip |
| 218 | "Switch Profile" | `popupSwitchProfile` | Section title |
| 229 | "categories" | `popupCategories` | Profile stats (short) |
| 244 | "Submit Warning" | `popupSubmitWarning` | Button text |
| 249 | "Settings & Customization" | `popupSettingsCustomization` | Button text |
| 256 | "Extension is active and monitoring for trigger warnings on" | `popupExtensionActive` | Footer info |
| 256 | "this video" | `popupThisVideo` | Footer info |
| 256 | "supported platforms" | `popupSupportedPlatforms` | Footer info |
| 261 | "Failed to load profile data" | `popupFailedLoadProfile` | Error message |

### 2. Popup - Submit Warning Component (`src/popup/components/SubmitWarning.svelte`)

| Line | Text | Suggested Key | Context |
|------|------|---------------|---------|
| 130 | "Submit Trigger Warning" | `submitWarningTitle` | Modal title |
| 136 | "Warning submitted successfully!" | `submitWarningSuccess` | Success message |
| 137 | "Thank you for contributing to the community." | `submitWarningThanks` | Success subtext |
| 143 | "Trigger Category *" | `submitWarningCategoryLabel` | Form label |
| 145 | "Select a category..." | `submitWarningCategoryPlaceholder` | Select placeholder |
| 157 | "Start Time (seconds) *" | `submitWarningStartTimeLabel` | Form label |
| 169 | "End Time (seconds) *" | `submitWarningEndTimeLabel` | Form label |
| 183 | "Duration:" | `submitWarningDuration` | Duration label |
| 186 | "too short - minimum" | `submitWarningTooShort` | Validation error |
| 188 | "too long - maximum" | `submitWarningTooLong` | Validation error |
| 196 | "Description (optional)" | `submitWarningDescriptionLabel` | Form label |
| 204 | "Brief description of the content..." | `submitWarningDescriptionPlaceholder` | Textarea placeholder |
| 209 | "Description is too long" | `submitWarningDescriptionTooLong` | Validation error |
| 216 | "Confidence:" | `submitWarningConfidence` | Slider label |
| 227 | "Not sure" | `submitWarningNotSure` | Confidence min label |
| 228 | "Very confident" | `submitWarningVeryConfident` | Confidence max label |
| 239 | "Cancel" | `buttonCancel` | Button text |
| 242 | "Submitting..." | `submitWarningSubmitting` | Button text (loading) |
| 242 | "Submit Warning" | `submitWarningSubmitButton` | Button text |
| 247 | "* Submitted warnings will be reviewed by the community before appearing to others." | `submitWarningReviewNote` | Form note |
| 26 | "Please select a trigger category" | `submitWarningErrorCategory` | Validation error |
| 31 | "Cannot submit - no video detected. Please refresh the page." | `submitWarningErrorNoVideo` | Validation error |
| 36 | "Start time cannot be negative" | `submitWarningErrorNegativeTime` | Validation error |
| 40 | "End time must be after start time" | `submitWarningErrorEndTime` | Validation error |
| 45 | "Warning must be at least ${MIN_WARNING_DURATION} second(s) long" | `submitWarningErrorMinDuration` | Validation error |
| 49 | "Warning cannot be longer than ${Math.floor(MAX_WARNING_DURATION / 60)} minutes" | `submitWarningErrorMaxDuration` | Validation error |
| 54 | "Description must be ${MAX_DESCRIPTION_LENGTH} characters or less" | `submitWarningErrorDescriptionLength` | Validation error |
| 59 | "Confidence must be between 0 and 100" | `submitWarningErrorConfidence` | Validation error |
| 104 | "Failed to submit warning" | `submitWarningErrorGeneric` | Error message |
| 107 | "Error submitting warning:" | `submitWarningErrorPrefix` | Error message |

### 3. Popup - Profile Create Component (`src/popup/components/ProfileCreate.svelte`)

| Line | Text | Suggested Key | Context |
|------|------|---------------|---------|
| 68 | "Create New Profile" | `profileCreateTitle` | Modal title |
| 74 | "Profile Name" | `profileCreateNameLabel` | Form label |
| 82 | "e.g., Work Safe, Family Mode" | `profileCreateNamePlaceholder` | Input placeholder |
| 88 | "Choose a descriptive name for your profile" | `profileCreateNameHint` | Form hint |
| 94 | "Copy Settings From (Optional)" | `profileCreateCopyLabel` | Form label |
| 97 | "Start from default settings" | `profileCreateDefaultOption` | Select option |
| 103 | "Copy enabled categories and preferences from an existing profile" | `profileCreateCopyHint` | Form hint |
| 120 | "Cancel" | `buttonCancel` | Button text |
| 128 | "Creating..." | `profileCreateCreating` | Button text (loading) |
| 130 | "Create Profile" | `profileCreateButton` | Button text |
| 17 | "Profile name is required" | `profileCreateErrorRequired` | Validation error |
| 22 | "Profile name must be 50 characters or less" | `profileCreateErrorLength` | Validation error |
| 27 | "A profile with this name already exists" | `profileCreateErrorExists` | Validation error |
| 47 | "Failed to create profile" | `profileCreateErrorGeneric` | Error message |

### 4. Popup - Profile Rename Component (`src/popup/components/ProfileRename.svelte`)

| Line | Text | Suggested Key | Context |
|------|------|---------------|---------|
| 73 | "Rename Profile" | `profileRenameTitle` | Modal title |
| 80 | "New Profile Name" | `profileRenameNewNameLabel` | Form label |
| 87 | "Enter new name" | `profileRenameNamePlaceholder` | Input placeholder |
| 93 | "Current name:" | `profileRenameCurrentName` | Form hint |
| 110 | "Cancel" | `buttonCancel` | Button text |
| 117 | "Renaming..." | `profileRenameRenaming` | Button text (loading) |
| 119 | "Rename" | `profileRenameButton` | Button text |
| 17 | "Profile name is required" | `profileRenameErrorRequired` | Validation error |
| 22 | "Profile name must be 50 characters or less" | `profileRenameErrorLength` | Validation error |
| 32 | "A profile with this name already exists" | `profileRenameErrorExists` | Validation error |
| 52 | "Failed to rename profile" | `profileRenameErrorGeneric` | Error message |

### 5. Popup - Profile Delete Component (`src/popup/components/ProfileDelete.svelte`)

| Line | Text | Suggested Key | Context |
|------|------|---------------|---------|
| 51 | "Delete Profile" | `profileDeleteTitle` | Modal title |
| 59 | "Are you sure you want to delete this profile?" | `profileDeleteConfirmTitle` | Warning title |
| 61 | "This will permanently delete the profile" | `profileDeleteWarningText` | Warning text |
| 61 | "and all its settings." | `profileDeleteWarningSettings` | Warning text |
| 64 | "This action cannot be undone." | `profileDeleteWarningUndone` | Warning text |
| 71 | "Type" | `profileDeleteTypeLabel` | Form label |
| 71 | "to confirm" | `profileDeleteToConfirm` | Form label |
| 96 | "Cancel" | `buttonCancel` | Button text |
| 104 | "Deleting..." | `profileDeleteDeleting` | Button text (loading) |
| 106 | "Delete Profile" | `profileDeleteButton` | Button text |
| 15 | "Please type the profile name to confirm" | `profileDeleteErrorConfirm` | Validation error |
| 32 | "Failed to delete profile" | `profileDeleteErrorGeneric` | Error message |

### 6. Options Component (`src/options/Options.svelte`)

| Line | Text | Suggested Key | Context |
|------|------|---------------|---------|
| 132 | "Trigger Warnings Settings" | `optionsTitle` | Header title (exists) |
| 135 | "Saving..." | `optionsSaving` | Saving indicator |
| 143 | "Loading settings..." | `optionsLoading` | Loading state |
| 148 | "Active Profile" | `optionsActiveProfile` | Section title |
| 158 | "categories" | `optionsCategories` | Profile stats |
| 172 | "Categories" | `optionsTabCategories` | Tab label |
| 179 | "Settings" | `optionsTabSettings` | Tab label |
| 186 | "Stats" | `optionsTabStats` | Tab label |
| 193 | "Trigger Warning Categories" | `optionsCategoriesTitle` | Section title |
| 195 | "Select which trigger warnings you want to see. Click on any category to enable or disable it." | `optionsCategoriesDescription` | Description |
| 225 | "How It Works" | `optionsHowItWorksTitle` | Info box title |
| 227 | "Enable the categories you want to be warned about" | `optionsHowItWorksStep1` | List item |
| 228 | "Warnings will appear when watching content on supported platforms" | `optionsHowItWorksStep2` | List item |
| 229 | "You can vote on warning accuracy to improve the community database" | `optionsHowItWorksStep3` | List item |
| 230 | "Create multiple profiles for different viewing situations" | `optionsHowItWorksStep4` | List item |
| 239 | "Banner Appearance" | `optionsBannerAppearanceTitle` | Section title |
| 243 | "Banner Position" | `optionsBannerPositionLabel` | Label |
| 251 | "Top Left" | `optionsPositionTopLeft` | Position option |
| 259 | "Top Right" | `optionsPositionTopRight` | Position option |
| 267 | "Bottom Left" | `optionsPositionBottomLeft` | Position option |
| 275 | "Bottom Right" | `optionsPositionBottomRight` | Position option |
| 283 | "Font Size:" | `optionsFontSizeLabel` | Label |
| 297 | "Transparency:" | `optionsTransparencyLabel` | Label |
| 318 | "Spoiler-Free Mode (hide specific timing details)" | `optionsSpoilerFreeMode` | Checkbox label |
| 322 | "Behavior Settings" | `optionsBehaviorSettingsTitle` | Section title |
| 327 | "Warning Lead Time:" | `optionsLeadTimeLabel` | Label (exists) |
| 327 | "seconds" | `optionsSeconds` | Unit |
| 329 | "How early before the trigger to show the warning" | `optionsLeadTimeHint` | Hint text |
| 348 | "Sound Alerts" | `optionsSoundAlertsLabel` | Checkbox label |
| 354 | "Theme" | `optionsThemeLabel` | Label |
| 361 | "☀️ Light" | `optionsThemeLight` | Theme option |
| 368 | "🌙 Dark" | `optionsThemeDark` | Theme option |
| 375 | "💻 System" | `optionsThemeSystem` | Theme option |
| 392 | "Failed to load settings" | `optionsErrorLoad` | Error message |
| 73 | "Settings saved successfully" | `optionsSavedSuccess` | Toast message |
| 75 | "Failed to save settings" | `optionsSaveError` | Toast message |

### 7. Options - Stats Component (`src/options/components/Stats.svelte`)

| Line | Text | Suggested Key | Context |
|------|------|---------------|---------|
| 62 | "Loading statistics..." | `statsLoading` | Loading state |
| 66 | "⚠️ Failed to Load Statistics" | `statsErrorTitle` | Error title |
| 67 | "Unable to fetch analytics data. Please try again later." | `statsErrorMessage` | Error message |
| 68 | "Retry" | `statsRetryButton` | Button text |
| 77 | "Total Warnings" | `statsTotalWarnings` | Stat label |
| 85 | "Approved" | `statsApproved` | Stat label |
| 93 | "Pending Review" | `statsPendingReview` | Stat label |
| 101 | "Rejected" | `statsRejected` | Stat label |
| 108 | "Warnings by Category" | `statsWarningsByCategory` | Section title |
| 109 | "Distribution of approved warnings across trigger categories" | `statsWarningsByCategoryHint` | Section hint |
| 136 | "No category data available yet." | `statsNoCategoryData` | Empty state |
| 142 | "📈 About These Statistics" | `statsAboutTitle` | Info box title |
| 144 | "Statistics are updated in real-time from the community database" | `statsAboutRealtime` | List item |
| 145 | "Only approved warnings are counted in category breakdowns" | `statsAboutApproved` | List item |
| 146 | "The moderation queue size shows warnings awaiting review" | `statsAboutModeration` | List item |
| 147 | "You can help improve accuracy by voting on warnings you encounter" | `statsAboutVoting` | List item |

### 8. Banner Component (`src/content/banner/Banner.svelte`)

| Line | Text | Suggested Key | Context |
|------|------|---------------|---------|
| 109 | "⚠️ Active" | `bannerActive` | Status badge |
| 135 | "Confirm" | `bannerConfirm` | Button text |
| 132 | "Confirm this warning is accurate" | `bannerConfirmTooltip` | Tooltip |
| 142 | "Wrong" | `bannerWrong` | Button text |
| 140 | "This warning is wrong" | `bannerWrongTooltip` | Tooltip |
| 155 | "Ignore" | `bannerIgnore` | Button text |
| 152 | "Hide this specific warning" | `bannerIgnoreTooltip` | Tooltip |
| 162 | "Ignore All" | `bannerIgnoreAll` | Button text |
| 159 | "Hide all {category} warnings for this video" | `bannerIgnoreAllTooltip` | Tooltip |
| 169 | "Dismiss" | `bannerDismiss` | Close button tooltip |
| 121 | "Duration:" | `bannerDuration` | Duration label |

### 9. Moderation Component (`src/moderation/Moderation.svelte`)

| Line | Text | Suggested Key | Context |
|------|------|---------------|---------|
| 101 | "🛡️ Moderation Dashboard" | `moderationTitle` | Header title |
| 102 | "Review and approve pending trigger warnings" | `moderationSubtitle` | Subtitle |
| 107 | "Category:" | `moderationFilterCategory` | Filter label |
| 109 | "All Categories" | `moderationAllCategories` | Filter option |
| 124 | "Min Score:" | `moderationFilterMinScore` | Filter label |
| 135 | "Sort By:" | `moderationFilterSortBy` | Filter label |
| 137 | "Newest First" | `moderationSortNewest` | Sort option |
| 138 | "Oldest First" | `moderationSortOldest` | Sort option |
| 139 | "Highest Score" | `moderationSortScore` | Sort option |
| 148 | "Loading pending warnings..." | `moderationLoading` | Loading state |
| 153 | "No Pending Warnings" | `moderationEmptyTitle` | Empty state title |
| 154 | "Great job! The moderation queue is empty." | `moderationEmptyMessage` | Empty state message |
| 173 | "← Previous" | `moderationPrevious` | Button text |
| 175 | "Page" | `moderationPage` | Pagination text |
| 180 | "Next →" | `moderationNext` | Button text |
| 60 | "Warning approved!" | `moderationApprovedToast` | Toast message |
| 63 | "Failed to approve warning" | `moderationApproveError` | Toast message |
| 70 | "Warning rejected" | `moderationRejectedToast` | Toast message |
| 73 | "Failed to reject warning" | `moderationRejectError` | Toast message |
| 51 | "Failed to load pending warnings" | `moderationLoadError` | Toast message |

### 10. Time Utilities (`src/shared/utils/time.ts`)

| Line | Text | Suggested Key | Context |
|------|------|---------------|---------|
| 24 | "now" | `timeNow` | Countdown text |
| 27 | "in ${seconds}s" | `timeInSeconds` | Countdown format |
| 30 | "in ${minutes}m" | `timeInMinutes` | Countdown format |

### 11. Category Definitions (`src/shared/constants/categories.ts`)

**All 28 category names and descriptions** - Already have corresponding keys in messages.json (triggerViolence, triggerBlood, etc.)

Categories need both name and description extracted:
- Violence, Blood, Gore, Sexual Assault, Sex/Nudity, Self-Harm, Suicide, Eating Disorders, Drugs
- Profanity, Spiders/Snakes, Animal Cruelty, Child Abuse, Children Screaming, Domestic Violence
- Racial Violence, LGBTQ+ Phobia, Religious Trauma, Dead Bodies/Body Horror, Torture, Murder
- Explosions/Bombs, Medical Procedures, Vomit/Nausea, Flashing Lights, Jump Scares
- Natural Disasters, Cannibalism

Severity labels:
- "high", "medium", "low" (needs translation)

---

## Summary Statistics

- **Total UI strings identified**: ~200+
- **Existing i18n keys in messages.json**: 110
- **New keys needed**: ~90+
- **Components requiring updates**: 12 Svelte files
- **Categories**: 28 (already have keys)
- **Utilities with text**: 2 (time.ts has format strings)

---

## Implementation Strategy

1. ✅ **Audit Complete**: All text strings cataloged above
2. **Create i18n helper**: Svelte utility to access Chrome's i18n API
3. **Update messages.json**: Add all missing keys
4. **Update components**: Replace hardcoded strings with i18n calls
5. **Test**: Verify all strings display correctly
6. **Add languages**: Create additional locale folders (es, fr, de, etc.)

---

## Chrome Extension i18n Integration

The extension should use Chrome's built-in i18n system:

```typescript
// Access messages
chrome.i18n.getMessage('keyName')
chrome.i18n.getMessage('keyWithPlaceholder', ['value'])

// Current locale
chrome.i18n.getUILanguage()
```

For Svelte components, we'll create a reactive i18n store that wraps this API.
