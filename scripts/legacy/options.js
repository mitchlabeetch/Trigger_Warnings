// options.js v0.8.2 (Use correct message types for Supabase backend, naming cleanup)

document.addEventListener('DOMContentLoaded', () => {
    console.log("Options: DOM fully loaded and parsed.");

    // --- Constants ---
    const BROWSER_API = typeof browser !== 'undefined' ? browser : chrome;

    // Central Definition matching messages.json trigger keys
    const availableTriggers = {
        detonations_bombs: "triggerDetonationsBombs", vomit: "triggerVomit", sexual_assault: "triggerSexualAssault",
        sex: "triggerSex", self_harm: "triggerSelfHarm", suicide: "triggerSuicide", spiders_snakes: "triggerSpidersSnakes",
        blood: "triggerBlood", swear_words: "triggerSwearWords", drugs: "triggerDrugs", violence: "triggerViolence",
        eating_disorders: "triggerEatingDisorders", dead_body_body_horror: "triggerDeadBodyBodyHorror", gore: "triggerGore",
        torture: "triggerTorture", children_screaming: "triggerChildrenScreaming", racial_violence: "triggerRacialViolence",
        domestic_violence: "triggerDomesticViolence", animal_cruelty: "triggerAnimalCruelty", child_abuse: "triggerChildAbuse",
        flashing_lights: "triggerFlashingLights", medical_procedures: "triggerMedicalProcedures",
        natural_disasters: "triggerNaturalDisasters", religious_trauma: "triggerReligiousTrauma",
        jumpscares: "triggerJumpscares", murder: "triggerMurder", lgbtq_phobia: "triggerLgbtqPhobia",
        cannibalism: "triggerCannibalism"
    };

    // Supported languages for the dropdown
    const supportedLanguages = { "en": "English" /* Add more {"locale": "Language Name"} here */ };

    // --- DOM Elements ---
    const elements = {
        get pageTitle() { return document.getElementById('page-title'); }, // Assumes you might have this in your HTML's <head>
        get mainHeading() { return document.getElementById('main-heading'); },
        get communityDisclaimer() { return document.getElementById('community-disclaimer'); },
        get generalSettingsHeading() { return document.getElementById('general-settings-heading'); },
        get leadTimeLabel() { return document.getElementById('lead-time-label'); },
        get leadTimeInput() { return document.getElementById('lead-time'); },
        get bannerColorWarnLabel() { return document.getElementById('banner-color-warn-label'); },
        get bannerColorWarnInput() { return document.getElementById('banner-color-warn'); },
        get bannerColorActiveLabel() { return document.getElementById('banner-color-active-label'); },
        get bannerColorActiveInput() { return document.getElementById('banner-color-active'); },
        get playSoundLabelText() { return document.getElementById('play-sound-label-text'); },
        get playSoundInput() { return document.getElementById('play-sound'); },
        get showFloatingButtonLabelText() { return document.getElementById('show-floating-button-label-text'); },
        get showFloatingButtonInput() { return document.getElementById('show-floating-button'); },
        get languageLabel() { return document.getElementById('language-label'); },
        get languageSelect() { return document.getElementById('language-select'); },
        get selectTriggersHeading() { return document.getElementById('select-triggers-heading'); },
        get triggersListDiv() { return document.getElementById('triggers-list'); },
        get triggersLoadingPlaceholder() { return document.getElementById('triggers-loading-placeholder'); }, // Add this ID to your HTML if needed
        get saveButton() { return document.getElementById('save-button'); },
        get statusMessageDiv() { return document.getElementById('status-message'); },
        get feedbackSection() { return document.getElementById('feedback-section'); },
        get feedbackHeading() { return document.getElementById('feedback-heading'); },
        get feedbackForm() { return document.getElementById('feedback-form'); },
        get feedbackNameLabel() { return document.getElementById('feedback-name-label'); },
        get feedbackNameInput() { return document.getElementById('feedback-name'); },
        get feedbackEmailLabel() { return document.getElementById('feedback-email-label'); },
        get feedbackEmailInput() { return document.getElementById('feedback-email'); },
        get feedbackMessageLabel() { return document.getElementById('feedback-message-label'); },
        get feedbackMessageInput() { return document.getElementById('feedback-message'); },
        get feedbackSubmitButton() { return document.getElementById('feedback-submit-button'); },
        get feedbackStatusDiv() { return document.getElementById('feedback-status'); }
    };

    // --- State ---
    let state = { messages: {}, translationsReady: false, statusTimeoutId: null, feedbackStatusTimeoutId: null, isLoading: true, currentLanguage: 'auto' };

    // --- Utility Functions ---
    function getMsg(key, fallback = '') {
        const messageData = state.messages[key];
        if (state.translationsReady && messageData?.message) {
            return messageData.message;
        }
        if (state.translationsReady && !messageData && fallback !== null) {
            console.warn(`Options: i18n key missing: "${key}", using fallback: "${fallback || key}"`);
        }
        return fallback || key;
    }

    function showStatus(messageKey, type = 'success', clearAfterMs = 3000) {
        const statusDiv = elements.statusMessageDiv;
        if (!statusDiv) return;
        if (state.statusTimeoutId) clearTimeout(state.statusTimeoutId);
        state.statusTimeoutId = null;
        const messageText = messageKey ? getMsg(messageKey, messageKey) : '';
        statusDiv.textContent = messageText;
        statusDiv.className = messageKey ? type : ''; // Use class for styling (e.g., .success, .error)
        if (clearAfterMs > 0 && messageText) {
            state.statusTimeoutId = setTimeout(() => {
                if (statusDiv.textContent === messageText) { // Avoid clearing if a new message was shown
                    statusDiv.textContent = '';
                    statusDiv.className = '';
                }
                state.statusTimeoutId = null;
            }, clearAfterMs);
        }
    }

    function showFeedbackStatus(messageKey, type = 'success', clearAfterMs = 4000) {
        const feedbackStatus = elements.feedbackStatusDiv;
        if (!feedbackStatus) return;
        if (state.feedbackStatusTimeoutId) clearTimeout(state.feedbackStatusTimeoutId);
        state.feedbackStatusTimeoutId = null;
        const messageText = messageKey ? getMsg(messageKey, messageKey) : '';
        feedbackStatus.textContent = messageText;
        feedbackStatus.className = messageKey ? type : ''; // Use class for styling
        if (clearAfterMs > 0 && messageText) {
            state.feedbackStatusTimeoutId = setTimeout(() => {
                if (feedbackStatus.textContent === messageText) {
                    feedbackStatus.textContent = '';
                    feedbackStatus.className = '';
                }
                state.feedbackStatusTimeoutId = null;
            }, clearAfterMs);
        }
    }

    // --- Translation Loading & Application ---
    async function loadTranslations() {
        state.translationsReady = false;
        state.messages = {};
        let loadedLocale = 'en';
        let messagesData = null;

        try {
            // Determine target locale (respect saved setting first, then browser UI, then fallback)
            const savedSettings = await BROWSER_API.storage.sync.get({ generalSettings: { language: 'auto' } });
            let targetLocale = savedSettings.generalSettings?.language;

            if (!targetLocale || targetLocale === 'auto') {
                targetLocale = BROWSER_API.i18n?.getUILanguage ? BROWSER_API.i18n.getUILanguage().split('-')[0] : 'en';
            }
            console.log(`Options: Target locale: ${targetLocale}. Attempting to load translations...`);

            // Try loading target locale
            if (targetLocale !== 'en') {
                try {
                    const primaryUrl = BROWSER_API.runtime.getURL(`_locales/${targetLocale}/messages.json`);
                    const response = await fetch(primaryUrl);
                    if (response.ok) {
                        messagesData = await response.json();
                        loadedLocale = targetLocale;
                    } else {
                        console.warn(`Options: Error fetching primary locale '${targetLocale}' (Status: ${response.status})`);
                    }
                } catch (e) {
                    console.warn(`Options: Network error fetching primary locale '${targetLocale}':`, e);
                }
            }

            // Fallback to English if target locale failed or was English
            if (!messagesData) {
                const fallbackUrl = BROWSER_API.runtime.getURL('_locales/en/messages.json');
                const response = await fetch(fallbackUrl);
                if (!response.ok) throw new Error(`Failed English fallback fetch (Status: ${response.status})`);
                messagesData = await response.json();
                loadedLocale = 'en';
            }

            state.messages = messagesData;
            state.translationsReady = true;
            console.log(`Options: Translations ready (using '${loadedLocale}').`);
            applyStaticTranslations(); // Apply translations to the DOM

        } catch (e) {
            console.error("Options: CRITICAL - Failed to load any translations:", e);
            state.messages = {}; // Ensure messages is an empty object on failure
            state.translationsReady = false;
            applyStaticTranslations(true); // Try applying with fallbacks
            showStatus("optionsInitError", 'error', 0); // Show persistent error
        }
    }

    function applyStaticTranslations(useFallback = false) {
        const msg = (key, fb) => useFallback ? (fb || key) : getMsg(key, fb);
        try {
            if (elements.pageTitle) elements.pageTitle.textContent = msg("optionsTitle", "Options"); // For HTML <title>
            elements.mainHeading.textContent = msg("optionsTitle", "Trigger Warnings Settings");
            elements.communityDisclaimer.textContent = msg("optionsCommunityDisclaimer", "Community data notice...");
            elements.generalSettingsHeading.textContent = msg("optionsGeneralSettingsHeading", "General Settings");
            elements.leadTimeLabel.textContent = msg("optionsLeadTimeLabel", "Warning Lead Time (sec):");
            elements.bannerColorWarnLabel.textContent = msg("optionsBannerColorWarnLabel", "Warning Banner Color:");
            elements.bannerColorActiveLabel.textContent = msg("optionsBannerColorActiveLabel", "Active Trigger Banner Color:");
            elements.playSoundLabelText.textContent = msg("optionsPlaySoundLabel", "Play Sound on Warning:");
            elements.showFloatingButtonLabelText.textContent = msg("optionsShowFloatingButtonLabel", "Show Floating Add Button:");
            elements.languageLabel.textContent = msg("optionsLanguageLabel", "Extension Language:");
            elements.selectTriggersHeading.textContent = msg("optionsSelectTriggersHeading", "Configure Trigger Actions:");
            elements.saveButton.textContent = msg("optionsSaveButton", "Save Preferences");

            // Feedback Section
            elements.feedbackHeading.textContent = msg("optionsFeedbackHeading", "Submit Feedback");
            elements.feedbackNameLabel.textContent = msg("optionsFeedbackNameLabel", "Name:");
            elements.feedbackEmailLabel.textContent = msg("optionsFeedbackEmailLabel", "Email:");
            elements.feedbackMessageLabel.textContent = msg("optionsFeedbackMessageLabel", "Message:");
            elements.feedbackSubmitButton.textContent = msg("optionsFeedbackSubmitButton", "Send Feedback");

        } catch (e) {
            console.error("Options: Error applying static translations to DOM elements:", e);
            showStatus("optionsInitError", 'error', 0);
        }
        // Always repopulate these as they depend on translations
        populateLanguageDropdown();
        displayTriggerCheckboxes(); // Also redraws triggers with current translations
    }

    function populateLanguageDropdown() {
        const select = elements.languageSelect;
        if (!select) { console.error("Options: Language select element not found."); return; }
        const currentVal = state.currentLanguage; // Use state value
        select.innerHTML = ''; // Clear existing

        // Add Auto-detect option
        const autoOption = document.createElement('option');
        autoOption.value = "auto";
        autoOption.textContent = getMsg("optionsLanguageDetect", "Detect Automatically");
        select.appendChild(autoOption);

        // Add supported languages
        for (const code in supportedLanguages) {
            const langOption = document.createElement('option');
            langOption.value = code;
            langOption.textContent = supportedLanguages[code]; // Assumes names are in English or handled elsewhere
            select.appendChild(langOption);
        }

        select.value = currentVal; // Set the loaded value
    }

    function getTriggerActions() {
        // Gets the translated action names for the dropdowns
        return {
            warn: getMsg("optionsActionWarn", "Warn Only"),
            mute: getMsg("optionsActionMute", "Mute Audio"),
            hide: getMsg("optionsActionHide", "Hide Video"),
            mute_hide: getMsg("optionsActionMuteHide", "Mute & Hide")
        };
    }

    // --- Options Logic ---
    function displayTriggerCheckboxes() {
        const listDiv = elements.triggersListDiv;
        if (!listDiv) return;
        const placeholder = elements.triggersLoadingPlaceholder;
        if (placeholder) placeholder.style.display = 'none'; // Hide loading text

        const savedScrollPosition = listDiv.scrollTop; // Preserve scroll position
        listDiv.innerHTML = ''; // Clear current list

        const triggerActions = getTriggerActions();
        const sortedTriggerKeys = Object.keys(availableTriggers).sort((a, b) => {
            // Sort alphabetically based on translated display name
            const labelA = getMsg(availableTriggers[a], a).toLowerCase();
            const labelB = getMsg(availableTriggers[b], b).toLowerCase();
            return labelA.localeCompare(labelB);
        });

        if (sortedTriggerKeys.length === 0) {
            listDiv.textContent = "No trigger categories defined."; // Should not happen
            return;
        }

        for (const triggerKey of sortedTriggerKeys) {
            const messageKey = availableTriggers[triggerKey];
            const fallbackLabel = triggerKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const labelText = getMsg(messageKey, fallbackLabel);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'trigger-item'; // Use class for styling

            // Checkbox and its label
            const label = document.createElement('label');
            label.htmlFor = triggerKey; // Associate label with checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = triggerKey;
            checkbox.name = 'trigger_enabled'; // Group checkboxes logically
            checkbox.value = triggerKey; // Value represents the key
            checkbox.setAttribute('aria-label', labelText); // Accessibility
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${labelText}`)); // Add space before text

            // Action dropdown
            const select = document.createElement('select');
            select.id = `action-${triggerKey}`;
            select.name = 'trigger_action';
            select.dataset.triggerKey = triggerKey; // Store key for saving
            select.setAttribute('aria-label', `Action for ${labelText}`); // Accessibility
            for (const actionKey in triggerActions) {
                const option = document.createElement('option');
                option.value = actionKey;
                option.textContent = triggerActions[actionKey];
                select.appendChild(option);
            }
            select.value = 'warn'; // Default action

            itemDiv.appendChild(label); // Add checkbox/label
            itemDiv.appendChild(select); // Add dropdown
            listDiv.appendChild(itemDiv); // Add item to the list
        }
        listDiv.scrollTop = savedScrollPosition; // Restore scroll position
    }

    function saveOptions() {
        if (state.isLoading) return;
        showStatus(''); // Clear previous status
        elements.saveButton.disabled = true;

        const triggerPrefsToSave = {};
        const triggerItems = elements.triggersListDiv?.querySelectorAll('.trigger-item');

        if (!triggerItems) {
            console.error("Options: Could not find trigger items to save.");
            showStatus("optionsStatusError", 'error', 0);
            elements.saveButton.disabled = false;
            return;
        }

        triggerItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const select = item.querySelector('select');
            if (checkbox?.id && select) {
                triggerPrefsToSave[checkbox.id] = {
                    enabled: checkbox.checked,
                    action: select.value
                };
            }
        });

        const generalSettingsToSave = {
            leadTime: parseInt(elements.leadTimeInput?.value, 10) || 10,
            bannerColorWarn: elements.bannerColorWarnInput?.value || '#ffa500',
            bannerColorActive: elements.bannerColorActiveInput?.value || '#dc143c',
            playSound: elements.playSoundInput?.checked ?? false,
            showFloatingButton: elements.showFloatingButtonInput?.checked ?? true,
            language: elements.languageSelect?.value || 'auto'
        };

        console.log("Options: Saving preferences...", { triggerPrefsToSave, generalSettingsToSave });

        BROWSER_API.storage.sync.set({
            triggerPreferences: triggerPrefsToSave,
            generalSettings: generalSettingsToSave
        })
        .then(() => {
            console.log("Options: Preferences saved successfully to sync storage.");
            showStatus("optionsStatusSaved", 'success');
            state.currentLanguage = generalSettingsToSave.language; // Update internal state
            // Notify other parts of the extension (like content script)
            return BROWSER_API.runtime.sendMessage({ type: "PREFERENCES_UPDATED" });
        })
        .then(() => {
            console.log("Options: PREFERENCES_UPDATED message sent.");
        })
        .catch(error => {
            console.error("Options: Save or message sending error:", error);
            showStatus("optionsStatusError", 'error', 0);
        })
        .finally(() => {
            // Re-enable button only if not still loading (shouldn't be, but safety check)
            if (!state.isLoading) {
                elements.saveButton.disabled = false;
            }
        });
    }

    async function loadOptions() {
        state.isLoading = true;
        elements.saveButton.disabled = true;
        elements.feedbackSubmitButton.disabled = true;
        console.log("Options: Loading saved preferences...");

        const defaultGeneralSettings = {
            leadTime: 10,
            bannerColorWarn: '#ffa500',
            bannerColorActive: '#dc143c',
            playSound: false,
            showFloatingButton: true,
            language: 'auto'
        };
        const defaultTriggerPrefs = {}; // No triggers enabled/configured by default

        try {
            const items = await BROWSER_API.storage.sync.get({
                triggerPreferences: defaultTriggerPrefs,
                generalSettings: defaultGeneralSettings
            });

            const savedTriggerPrefs = items.triggerPreferences || defaultTriggerPrefs;
            // Merge defaults with saved settings to ensure all keys exist
            const savedGeneralSettings = { ...defaultGeneralSettings, ...(items.generalSettings || {}) };

            console.log("Options: Loaded data from storage", { savedTriggerPrefs, savedGeneralSettings });

            // Apply General Settings to form
            if (elements.leadTimeInput) elements.leadTimeInput.value = savedGeneralSettings.leadTime;
            if (elements.bannerColorWarnInput) elements.bannerColorWarnInput.value = savedGeneralSettings.bannerColorWarn;
            if (elements.bannerColorActiveInput) elements.bannerColorActiveInput.value = savedGeneralSettings.bannerColorActive;
            if (elements.playSoundInput) elements.playSoundInput.checked = !!savedGeneralSettings.playSound; // Ensure boolean
            if (elements.showFloatingButtonInput) elements.showFloatingButtonInput.checked = !!savedGeneralSettings.showFloatingButton; // Ensure boolean

            // Set language state and dropdown value AFTER translations are ready and dropdown populated
            state.currentLanguage = savedGeneralSettings.language || 'auto';
            if (elements.languageSelect) elements.languageSelect.value = state.currentLanguage;


            // Apply Trigger Preferences to checkboxes and dropdowns
            const triggerItems = elements.triggersListDiv?.querySelectorAll('.trigger-item');
            if (triggerItems && triggerItems.length > 0) {
                 triggerItems.forEach(item => {
                     const checkbox = item.querySelector('input[type="checkbox"]');
                     const select = item.querySelector('select');
                     const triggerKey = checkbox?.id;
                     if (triggerKey && checkbox && select) {
                         const prefsForKey = savedTriggerPrefs[triggerKey];
                         checkbox.checked = prefsForKey?.enabled ?? false; // Default to false if not saved
                         select.value = prefsForKey?.action || 'warn'; // Default to 'warn' if not saved
                     }
                 });
                 console.log("Options: Trigger settings applied.");
             } else {
                 // This might happen if loadOptions runs before displayTriggerCheckboxes finishes
                 console.warn("Options: Trigger list elements not found when loadOptions executed. Retrying application after slight delay.");
                 // Defer re-application slightly
                 setTimeout(() => {
                     const currentTriggerItems = elements.triggersListDiv?.querySelectorAll('.trigger-item');
                      if (currentTriggerItems && currentTriggerItems.length > 0) {
                          currentTriggerItems.forEach(item => {
                              const checkbox = item.querySelector('input[type="checkbox"]');
                              const select = item.querySelector('select');
                              const triggerKey = checkbox?.id;
                              if (triggerKey && checkbox && select) {
                                  const prefsForKey = savedTriggerPrefs[triggerKey];
                                  checkbox.checked = prefsForKey?.enabled ?? false;
                                  select.value = prefsForKey?.action || 'warn';
                              }
                          });
                          console.log("Options: Trigger settings applied (deferred).");
                      } else {
                           console.error("Options: Trigger list still not found after delay.");
                      }
                 }, 100); // 100ms delay
             }

            console.log("Options: Form populated successfully.");
            showStatus(''); // Clear any loading/error status

        } catch (error) {
            console.error("Options: Load Error:", error);
            showStatus("optionsInitError", 'error', 0); // Show persistent error
        } finally {
            state.isLoading = false;
            elements.saveButton.disabled = false;
            elements.feedbackSubmitButton.disabled = false;
            console.log("Options: Loading process finished.");
        }
    }

    // --- Feedback Form Logic ---
    function handleFeedbackSubmit(event) {
        event.preventDefault();
        if (state.isLoading || elements.feedbackSubmitButton.disabled) return;

        const nameInput = elements.feedbackNameInput;
        const emailInput = elements.feedbackEmailInput;
        const messageInput = elements.feedbackMessageInput;
        const name = nameInput?.value.trim();
        const email = emailInput?.value.trim();
        const message = messageInput?.value.trim();
        let isValid = true;

        // Clear previous validation states and status
        [nameInput, emailInput, messageInput].forEach(input => input?.classList.remove('invalid'));
        showFeedbackStatus(''); // Clear feedback status area

        // Basic validation
        if (!name) { nameInput?.classList.add('invalid'); isValid = false; }
        if (!message) { messageInput?.classList.add('invalid'); isValid = false; }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) { // Simple email format check
            emailInput?.classList.add('invalid');
            isValid = false;
            // Show specific email error if email is present but invalid, else generic validation error
            showFeedbackStatus(email ? "optionsFeedbackValidationEmailError" : "optionsFeedbackValidationError", 'error');
        }

        // If any field is invalid (and it wasn't the email format error already shown), show generic validation error
        if (!isValid && !emailInput?.classList.contains('invalid')) {
            showFeedbackStatus("optionsFeedbackValidationError", 'error');
        }
        if (!isValid) return; // Stop if validation failed

        // Disable button and show submitting status
        elements.feedbackSubmitButton.disabled = true;
        showFeedbackStatus("optionsFeedbackStatusSubmitting", 'submitting', 0); // Persistent submitting message
        const feedbackData = { name, email, message };
        console.log("Options: Submitting Feedback via background script:", feedbackData);

        // Send message to background to handle the Supabase submission
        BROWSER_API.runtime.sendMessage({ type: "FIRESTORE_ADD_FEEDBACK", data: feedbackData }) // CORRECTED MESSAGE TYPE
            .then(response => {
                 // Check for potential errors during message sending itself
                 if (BROWSER_API.runtime.lastError) {
                     throw new Error(`Runtime Error: ${BROWSER_API.runtime.lastError.message}`);
                 }
                 // Check the logical response from the background/offscreen
                 if (response?.status === "success") {
                     console.log("Options: Feedback submission acknowledged by background.");
                     showFeedbackStatus("optionsFeedbackStatusSuccess", 'success', 4000);
                     elements.feedbackForm?.reset(); // Clear form on success
                     [nameInput, emailInput, messageInput].forEach(input => input?.classList.remove('invalid')); // Clear validation styles
                 } else {
                      // Handle specific errors returned from backend if available
                      const errorKey = response?.code === 'permission-denied' ? "popupErrorPermissionDenied" // Example mapping
                                       : "optionsFeedbackStatusError"; // Generic fallback
                      const errorMessage = response?.message || "Unknown feedback response from background";
                     console.error(`Options: Feedback submission failed. Status: ${response?.status}, Message: ${errorMessage}`);
                     showFeedbackStatus(errorKey, 'error', 5000);
                 }
            })
            .catch(error => {
                // Handle errors in sending the message or if the promise rejects unexpectedly
                console.error("Options: Error sending FIRESTORE_ADD_FEEDBACK message:", error);
                showFeedbackStatus("optionsFeedbackStatusError", 'error', 5000);
            })
            .finally(() => {
                 // Re-enable button unless the page is still in a loading state (unlikely here)
                 if (!state.isLoading) {
                     elements.feedbackSubmitButton.disabled = false;
                 }
            });
    }

    // --- Initialization Sequence ---
    async function initializePage() {
        console.log("Options: Initializing page...");
        state.isLoading = true;
        elements.saveButton.disabled = true;
        elements.feedbackSubmitButton.disabled = true;
        // Ensure triggers list is empty or shows loading initially
        if (elements.triggersListDiv) elements.triggersListDiv.innerHTML = '';
        if (elements.triggersLoadingPlaceholder) elements.triggersLoadingPlaceholder.style.display = 'block';


        try {
            await loadTranslations(); // Load translations, populates dropdowns & redraws triggers
            await loadOptions();      // Load saved data into the form elements

            // Attach event listeners after elements are populated and data loaded
            elements.saveButton?.addEventListener('click', saveOptions);
            elements.feedbackForm?.addEventListener('submit', handleFeedbackSubmit);
            // Add listener for language change to reload translations/UI
            elements.languageSelect?.addEventListener('change', async () => {
                 const newLang = elements.languageSelect.value;
                 console.log(`Options: Language changed to ${newLang}. Reloading translations and saving.`);
                 state.currentLanguage = newLang; // Update state immediately
                 await loadTranslations(); // Reload translations and apply
                 await loadOptions(); // Reload options to ensure consistency if needed
                 saveOptions(); // Save the new language preference immediately
            });

            console.log("Options: Page initialization complete.");
        } catch (e) {
            console.error("Options Page Initialization Error:", e);
            showStatus("optionsInitError", 'error', 0); // Show persistent error
            // Keep buttons disabled on critical init error
            elements.saveButton.disabled = true;
            elements.feedbackSubmitButton.disabled = true;
        }
        // No finally block needed here for isLoading, loadOptions handles it
    }

    // --- Run Initialization ---
    initializePage();

});