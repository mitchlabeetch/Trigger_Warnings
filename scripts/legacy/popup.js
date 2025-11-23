// popup.js - Version 0.8.7 (Prevent Double Submit)

document.addEventListener('DOMContentLoaded', () => {
    console.log("Popup: DOM fully loaded and parsed (v0.8.7).");

    // --- Constants ---
    const BROWSER_API = typeof browser !== 'undefined' ? browser : chrome;
    const SUPPORT_LINK = "https://www.buymeacoffee.com/MitchB";

    // Central definition matching messages.json trigger keys
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

    // --- DOM Elements ---
    const elements = {
        get pageTitle() { return document.getElementById('popup-page-title'); },
        get popupTitle() { return document.getElementById('popup-title'); },
        get markTimingLabel() { return document.getElementById('mark-timing-label'); },
        get markStartBtn() { return document.getElementById('mark-start'); },
        get markEndBtn() { return document.getElementById('mark-end'); },
        get startTimeLabel() { return document.getElementById('start-time-label'); },
        get endTimeLabel() { return document.getElementById('end-time-label'); },
        get startTimeDisplay() { return document.getElementById('start-time'); },
        get endTimeDisplay() { return document.getElementById('end-time'); },
        get instructionsDiv() { return document.getElementById('instructions'); },
        get playBtn() { return document.getElementById('play-button'); },
        get pauseBtn() { return document.getElementById('pause-button'); },
        get categorySelectLabel() { return document.getElementById('category-select-label'); },
        get categorySelect() { return document.getElementById('category-select'); },
        get submitBtn() { return document.getElementById('submit-trigger'); },
        get statusContainer() { return document.getElementById('status-container'); },
        get actionButtonsContainer() { return document.getElementById('action-buttons'); },
        get settingsBtn() { return document.getElementById('popup-settings-button'); },
        get supportBtn() { return document.getElementById('popup-support-button'); }
    };

    // --- State Variables ---
    let state = {
        currentTabId: null, currentVideoId: null, markedStartTime: null, markedEndTime: null,
        isNetflixWatchTab: false, translations: {}, translationsReady: false, statusTimeoutId: null,
        isSubmitting: false, isVideoPlaying: false, listenersAttached: false // Flag to prevent double attachment
    };

    // --- Utility Functions ---
    function formatTime(totalSeconds) {
        if (totalSeconds === null || typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds < 0) { return "--:--:--"; }
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return [hours, minutes, seconds].map(v => String(v).padStart(2, '0')).join(':');
    }

    function getMsg(key, fallback = '') {
        const messageData = state.translations[key];
        if (state.translationsReady && messageData?.message) { return messageData.message; }
        if (state.translationsReady && !messageData && fallback !== null) {
            console.warn(`Popup: Missing translation key: ${key}, using fallback: ${fallback || key}`);
        }
        return fallback || key;
    }

    function showStatus(messageKey, type = 'success', clearAfterMs = 3500) {
        if (!elements.statusContainer) {
            console.error("Popup: Status container element not found!");
            return;
        }
        if (state.statusTimeoutId) {
            clearTimeout(state.statusTimeoutId);
            state.statusTimeoutId = null;
        }
        let messageText = '';
        if (messageKey) {
            messageText = getMsg(messageKey, messageKey);
             console.log(`Popup: [STATUS] Displaying (${type}): "${messageText}" (Key: ${messageKey})`);
        } else {
             console.log("Popup: [STATUS] Clearing status.");
        }
        elements.statusContainer.innerHTML = '';
        if (messageText) {
            const msgElement = document.createElement('span');
            msgElement.className = `message ${type}`;
            msgElement.textContent = messageText;
            elements.statusContainer.appendChild(msgElement);
            if (clearAfterMs > 0) {
                state.statusTimeoutId = setTimeout(() => {
                    if (elements.statusContainer && elements.statusContainer.firstChild === msgElement) {
                         console.log(`Popup: [STATUS] Clearing status message automatically: "${messageText}"`);
                        elements.statusContainer.innerHTML = '';
                    }
                    state.statusTimeoutId = null;
                }, clearAfterMs);
            }
        }
    }

    function updatePlaybackButtons() {
        if (!elements.playBtn || !elements.pauseBtn) return;
        elements.playBtn.style.display = state.isVideoPlaying ? 'none' : 'inline-block';
        elements.pauseBtn.style.display = state.isVideoPlaying ? 'inline-block' : 'none';
        elements.playBtn.disabled = !state.isNetflixWatchTab;
        elements.pauseBtn.disabled = !state.isNetflixWatchTab;
        if (elements.playBtn) elements.playBtn.title = getMsg("popupPlayButtonTitle", "Play Video");
        if (elements.pauseBtn) elements.pauseBtn.title = getMsg("popupPauseButtonTitle", "Pause Video");
    }

    function setControlsDisabledState(isDisabled) {
        console.log(`Popup: Setting controls disabled state: ${isDisabled}`);
        const mainControls = [elements.markStartBtn, elements.markEndBtn, elements.playBtn, elements.pauseBtn, elements.categorySelect];
        mainControls.forEach(el => { if (el) el.disabled = isDisabled; });
        // Always keep settings/support enabled
        if (elements.settingsBtn) elements.settingsBtn.disabled = false;
        if (elements.supportBtn) elements.supportBtn.disabled = false;
        // Ensure these containers/buttons are visible
        if (elements.actionButtonsContainer) elements.actionButtonsContainer.style.display = 'flex';
        if (elements.settingsBtn) elements.settingsBtn.style.display = 'inline-block';
        if (elements.supportBtn) elements.supportBtn.style.display = 'inline-block';

        if (isDisabled) {
            if (elements.submitBtn) elements.submitBtn.disabled = true;
        } else {
            // Re-enable based on current state when enabling controls
            updateSubmitButtonState();
            updatePlaybackButtons();
        }
    }

    function updateSubmitButtonState() {
        if (!elements.submitBtn) return;
        const categorySelected = elements.categorySelect?.value && elements.categorySelect.value !== "";
        const timesValid = state.markedStartTime !== null && state.markedEndTime !== null && state.markedEndTime > state.markedStartTime;
        const prerequisitesMet = state.translationsReady && state.isNetflixWatchTab && state.currentVideoId !== null;
        const shouldBeEnabled = prerequisitesMet && timesValid && categorySelected && !state.isSubmitting;
        elements.submitBtn.disabled = !shouldBeEnabled;
    }

    // --- Core Logic Functions ---
    async function loadTranslations() {
        state.translationsReady = false; state.translations = {}; let loadedLocale = 'en';
        console.log("Popup: Loading translations...");
        try {
            const uiLocale = BROWSER_API.i18n?.getUILanguage ? BROWSER_API.i18n.getUILanguage().split('-')[0] : 'en';
            let messagesData = null;
            if (uiLocale !== 'en') {
                try { const resp = await fetch(BROWSER_API.runtime.getURL(`_locales/${uiLocale}/messages.json`)); if (resp.ok) { messagesData = await resp.json(); loadedLocale = uiLocale; } else { console.warn(`Popup: Failed locale fetch '${uiLocale}'`); } }
                catch (e) { console.warn(`Popup: Error fetching locale '${uiLocale}'.`, e); }
            }
            if (!messagesData) { const resp = await fetch(BROWSER_API.runtime.getURL('_locales/en/messages.json')); if (!resp.ok) throw new Error(`Fallback fetch fail`); messagesData = await resp.json(); loadedLocale = 'en'; }
            state.translations = messagesData; state.translationsReady = true;
            console.log(`Popup: Translations ready (using '${loadedLocale}'). Applying...`);
            applyStaticTranslations();
        } catch (e) { console.error("Popup: CRITICAL failure loading translations:", e); applyStaticTranslations(true); showStatus("popupErrorLoadingText", 'error', 0); }
    }

    function applyStaticTranslations(useFallback = false) {
        console.log("Popup: Applying static translations...");
        const msg = (key, fb) => useFallback ? (fb || key) : getMsg(key, fb);
        try {
            if (elements.pageTitle) elements.pageTitle.textContent = msg("popupAddTriggerTitle", "Add Trigger");
            if (elements.popupTitle) elements.popupTitle.textContent = msg("popupAddTriggerTitle", "Add New Trigger");
            if (elements.markTimingLabel) elements.markTimingLabel.textContent = msg("popupMarkTimingLabel", "Mark Timing:");
            if (elements.markStartBtn) elements.markStartBtn.textContent = msg("popupMarkStartButton", "Mark Start");
            if (elements.markEndBtn) elements.markEndBtn.textContent = msg("popupMarkEndButton", "Mark End");
            if (elements.startTimeLabel) elements.startTimeLabel.textContent = msg("popupStartTimeLabel", "Start:");
            if (elements.endTimeLabel) elements.endTimeLabel.textContent = msg("popupEndTimeLabel", "End:");
            if (elements.categorySelectLabel) elements.categorySelectLabel.textContent = msg("popupCategorySelectLabel", "Select Category:");
            if (elements.submitBtn) elements.submitBtn.textContent = msg("popupSubmitButton", "Submit Trigger");
            if (elements.instructionsDiv) elements.instructionsDiv.textContent = msg("popupHowToMarkInstructions", "Instructions...");
            if (elements.playBtn) elements.playBtn.title = msg("popupPlayButtonTitle", "Play Video");
            if (elements.pauseBtn) elements.pauseBtn.title = msg("popupPauseButtonTitle", "Pause Video");
            if (elements.settingsBtn) elements.settingsBtn.title = msg("popupSettingsButtonTitle", "Open Settings");
            if (elements.supportBtn) elements.supportBtn.title = msg("popupSupportButtonTitle", "Support Developer");
             console.log("Popup: Static translations applied.");
        } catch (e) { console.error("Popup: Error applying translations to DOM:", e); }
        populateCategoryDropdown(); // Always repopulate after applying text
         console.log("Popup: Category dropdown populated.");
    }

    function populateCategoryDropdown() {
        if (!elements.categorySelect) { console.error("Popup: Category select element not found."); return; }
        const currentVal = elements.categorySelect.value; elements.categorySelect.innerHTML = '';
        const defaultOption = document.createElement('option'); defaultOption.value = ""; defaultOption.textContent = getMsg("popupCategoryDefaultOption", "-- Select a Category --"); defaultOption.disabled = true; defaultOption.selected = !currentVal; elements.categorySelect.appendChild(defaultOption);
        const sortedTriggerKeys = Object.keys(availableTriggers).sort((a, b) => { const nameA = getMsg(availableTriggers[a], a).toLowerCase(); const nameB = getMsg(availableTriggers[b], b).toLowerCase(); return nameA.localeCompare(nameB); });
        for (const triggerKey of sortedTriggerKeys) { const messageKey = availableTriggers[triggerKey]; const fallbackName = triggerKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); const categoryName = getMsg(messageKey, fallbackName); const option = document.createElement('option'); option.value = triggerKey; option.textContent = categoryName; if (triggerKey === currentVal) option.selected = true; elements.categorySelect.appendChild(option); }
    }

    async function fetchVideoState(retryCount = 0) {
        if (!state.currentTabId || !state.isNetflixWatchTab) { showStatus("popupErrorNotNetflix", 'warning', 5000); return null; }
        console.log(`Popup: Sending GET_VIDEO_STATE (Attempt ${retryCount + 1}) to tab ${state.currentTabId}`);
        try {
            const response = await BROWSER_API.tabs.sendMessage(state.currentTabId, { type: "GET_VIDEO_STATE" });
            if (BROWSER_API.runtime.lastError) throw new Error(`Runtime Error: ${BROWSER_API.runtime.lastError.message}`);
            if (!response) throw new Error("No response from content script.");
            console.log(`Popup: Received response for GET_VIDEO_STATE:`, response);
            if (response.videoId !== undefined && typeof response.currentTime === 'number' && response.currentTime >= 0) {
                if (state.currentVideoId !== response.videoId && response.videoId !== null) { console.log(`Popup: Updated videoId: ${response.videoId}`); state.currentVideoId = response.videoId; state.markedStartTime = null; state.markedEndTime = null; if (elements.startTimeDisplay) elements.startTimeDisplay.textContent = formatTime(null); if (elements.endTimeDisplay) elements.endTimeDisplay.textContent = formatTime(null); }
                else if (response.videoId === null && state.currentVideoId !== null) { console.log("Popup: Null videoId received."); state.currentVideoId = null; setControlsDisabledState(true); showStatus("popupErrorNoVideoId", 'warning', 5000); }
                state.isVideoPlaying = response.isPlaying ?? false; updatePlaybackButtons(); updateSubmitButtonState(); return response.currentTime;
            } else { console.warn(`Popup: Invalid state response:`, response); state.isVideoPlaying = response?.isPlaying ?? false; updatePlaybackButtons(); updateSubmitButtonState(); throw new Error(`Invalid response structure.`); }
        } catch (error) {
            console.error(`Popup: Error fetchVideoState (Attempt ${retryCount + 1}):`, error.message);
            const isConnError = error.message?.includes("Receiving end does not exist") || error.message?.includes("Could not establish connection") || error.message?.includes("Port closed");
            if (isConnError && retryCount < 2) { const delay = 300 * Math.pow(2, retryCount); console.log(`Popup: Connection error, retrying in ${delay}ms...`); await new Promise(resolve => setTimeout(resolve, delay)); return fetchVideoState(retryCount + 1); }
            state.currentVideoId = null; state.isVideoPlaying = false; const errorKey = isConnError ? "popupErrorConnection" : "popupErrorGetTime"; showStatus(errorKey, 'error', 5000); setControlsDisabledState(true); updateSubmitButtonState(); return null;
        }
    }

    async function sendPlayPauseCommand(command) {
         if (!state.currentTabId || !state.isNetflixWatchTab) { showStatus("popupErrorNotNetflix", 'error'); return; }
         const targetPlayingState = (command === "PLAY_VIDEO"); state.isVideoPlaying = targetPlayingState; updatePlaybackButtons(); showStatus(''); console.log(`Popup: Sending ${command} to tab ${state.currentTabId}`);
         try { await BROWSER_API.tabs.sendMessage(state.currentTabId, { type: command }); console.log(`Popup: ${command} sent successfully.`); }
         catch (error) { console.error(`Popup: Error sending ${command}:`, error); const isConnErr = error.message?.includes("connection") || error.message?.includes("Receiving end does not exist") || error.message?.includes("Port closed"); showStatus(isConnErr ? "popupErrorConnection" : "popupErrorPlayPause", 'error'); state.isVideoPlaying = !targetPlayingState; updatePlaybackButtons(); }
    }

    async function handleMarkStart() {
        if (!state.isNetflixWatchTab || elements.markStartBtn?.disabled) return; console.log("Popup: Mark Start clicked."); showStatus('');
        const time = await fetchVideoState();
        if (time !== null) { state.markedStartTime = time; if (elements.startTimeDisplay) elements.startTimeDisplay.textContent = formatTime(state.markedStartTime); console.log(`Popup: Start time marked at ${formatTime(state.markedStartTime)}`); if (state.markedEndTime !== null && state.markedEndTime <= state.markedStartTime) { console.log("Popup: Clearing end time."); state.markedEndTime = null; if (elements.endTimeDisplay) elements.endTimeDisplay.textContent = formatTime(null); showStatus("popupWarnEndTimeCleared", 'warning', 2500); } }
        updateSubmitButtonState();
    }

    async function handleMarkEnd() {
        if (!state.isNetflixWatchTab || elements.markEndBtn?.disabled) return; console.log("Popup: Mark End clicked."); showStatus('');
        const time = await fetchVideoState();
        if (time !== null) { if (state.markedStartTime === null || time <= state.markedStartTime) { console.log("Popup: Invalid end time."); showStatus("popupErrorEndTime", 'error', 4000); state.markedEndTime = null; if (elements.endTimeDisplay) elements.endTimeDisplay.textContent = formatTime(null); } else { state.markedEndTime = time; if (elements.endTimeDisplay) elements.endTimeDisplay.textContent = formatTime(state.markedEndTime); console.log(`Popup: End time marked at ${formatTime(state.markedEndTime)}`); } }
        updateSubmitButtonState();
    }

    async function handleSubmitTrigger() {
        if (elements.submitBtn?.disabled || state.isSubmitting) { console.log("Popup: Submit prevented."); return; }
        showStatus('');
        if (!state.translationsReady) { showStatus("popupErrorLoadingText", 'error', 4000); return; }
        if (!state.isNetflixWatchTab) { showStatus("popupErrorNotNetflix", 'error', 4000); return; }
        if (!state.currentVideoId) { await fetchVideoState(); if (!state.currentVideoId) { showStatus("popupErrorNoVideoId", 'error', 4000); return; } }
        const selectedCategoryKey = elements.categorySelect?.value; const timesValid = state.markedStartTime !== null && state.markedEndTime !== null && state.markedEndTime > state.markedStartTime;
        if (!timesValid) { showStatus("popupErrorEndTime", 'error', 4000); return; }
        if (!selectedCategoryKey || selectedCategoryKey === "") { showStatus("popupErrorCategory", 'error', 4000); return; }

        const triggerData = { videoId: state.currentVideoId, categoryKey: selectedCategoryKey, startTime: state.markedStartTime, endTime: state.markedEndTime };
        console.log("Popup: Submitting Trigger Data:", triggerData);
        state.isSubmitting = true; updateSubmitButtonState(); showStatus("popupStatusSubmitting", 'submitting', 0);

        let responseReceived = false; const submitTimeoutMs = 20000;
        const submitTimeoutId = setTimeout(() => { if (!responseReceived && BROWSER_API.runtime?.id) { console.warn("Popup: Submit timed out."); state.isSubmitting = false; showStatus("popupErrorTimeout", 'error', 0); updateSubmitButtonState(); } }, submitTimeoutMs);

        try {
            const response = await BROWSER_API.runtime.sendMessage({ type: "FIRESTORE_ADD_TRIGGER", data: triggerData });
            responseReceived = true; clearTimeout(submitTimeoutId); console.log("Popup: Received response from background:", response);
            if (response?.status === "success") { console.log("Popup: Submission successful!"); showStatus("popupStatusSuccess", 'success', 3500); state.markedStartTime = null; state.markedEndTime = null; if (elements.startTimeDisplay) elements.startTimeDisplay.textContent = formatTime(null); if (elements.endTimeDisplay) elements.endTimeDisplay.textContent = formatTime(null); if (elements.categorySelect) elements.categorySelect.value = ""; }
            else { const errorKey = response?.code === 'permission-denied' ? "popupErrorPermissionDenied" : response?.message?.includes("duplicate") ? "popupErrorDuplicate" : "popupErrorSubmit"; const errorMessage = response?.message || "Unknown error"; console.error(`Popup: Submission failed. Status: ${response?.status}, Msg: ${errorMessage}`); showStatus(errorKey, 'error', 5000); }
        } catch (error) {
            responseReceived = true; clearTimeout(submitTimeoutId); console.error("Popup: Error sending message or processing response:", error); const isConnError = error.message?.includes("Receiving end does not exist") || error.message?.includes("Port closed"); showStatus(isConnError ? "popupErrorConnection" : "popupErrorSubmit", 'error', 5000);
        } finally { if (BROWSER_API.runtime?.id) { state.isSubmitting = false; updateSubmitButtonState(); } }
    }

    // --- Initialization and Event Listeners ---
    async function initializePopup() {
        console.log("Popup: Initializing...");
        setControlsDisabledState(true); showStatus('');
        if (elements.actionButtonsContainer) elements.actionButtonsContainer.style.display = 'flex'; if (elements.settingsBtn) { elements.settingsBtn.style.display = 'inline-block'; elements.settingsBtn.disabled = false; } if (elements.supportBtn) { elements.supportBtn.style.display = 'inline-block'; elements.supportBtn.disabled = false; }
        await loadTranslations();
        console.log("Popup: Translations loaded. Querying active tab...");
        try {
            const tabs = await BROWSER_API.tabs.query({ active: true, currentWindow: true }); const activeTab = tabs?.[0];
            if (!activeTab?.id) throw new Error("No active tab found.");
            state.currentTabId = activeTab.id; console.log(`Popup: Active Tab ID: ${state.currentTabId}, URL: ${activeTab.url}`);
            state.isNetflixWatchTab = !!activeTab.url?.match(/^https?:\/\/www\.netflix\.com\/watch\/\d+/);
            if (!state.isNetflixWatchTab) { console.log("Popup: Not on Netflix watch page."); showStatus("popupErrorNotNetflix", 'warning', 0); setControlsDisabledState(true); }
            else { console.log("Popup: Netflix watch page detected."); setControlsDisabledState(false); await fetchVideoState(); console.log("Popup: Initial video state fetched."); }
        } catch (e) { console.error("Popup initialization error:", e); const errorKey = e.message === "No active tab found." ? "popupErrorNoTab" : "popupErrorGeneric"; showStatus(errorKey, 'error', 0); setControlsDisabledState(true); }
        finally {
             // *** Attach listeners only ONCE ***
             if (!state.listenersAttached) {
                  console.log("Popup: Attaching listeners...");
                  attachListeners();
                  state.listenersAttached = true;
                  console.log("Popup: Listeners attached.");
             } else {
                 console.log("Popup: Listeners already attached, skipping re-attachment.");
             }
             updateSubmitButtonState();
             console.log("Popup: Initialization complete.");
        }
    }

    function attachListeners() {
        // Helper to safely add listeners
        const safeAddListener = (element, event, handler) => {
            if (element) {
                // Remove first to prevent duplicates if this were ever called again accidentally
                element.removeEventListener(event, handler);
                element.addEventListener(event, handler);
            } else {
                console.warn(`Popup: Element not found for listener: ${event}`);
            }
        };

        safeAddListener(elements.markStartBtn, 'click', handleMarkStart);
        safeAddListener(elements.markEndBtn, 'click', handleMarkEnd);
        safeAddListener(elements.categorySelect, 'change', updateSubmitButtonState);
        safeAddListener(elements.submitBtn, 'click', handleSubmitTrigger);
        safeAddListener(elements.playBtn, 'click', () => sendPlayPauseCommand("PLAY_VIDEO"));
        safeAddListener(elements.pauseBtn, 'click', () => sendPlayPauseCommand("PAUSE_VIDEO"));
        safeAddListener(elements.settingsBtn, 'click', () => { BROWSER_API.runtime.sendMessage({ type: "OPEN_OPTIONS" }).catch(e => console.error("Popup: Error sending OPEN_OPTIONS:", e)); });
        safeAddListener(elements.supportBtn, 'click', () => { if (!SUPPORT_LINK || SUPPORT_LINK.includes("YOUR")) { console.error("Support link invalid!"); showStatus("popupErrorSupportLink", "error", 4000); return; } BROWSER_API.runtime.sendMessage({ type: "OPEN_TAB", url: SUPPORT_LINK }).catch(e => console.error("Popup: Error sending OPEN_TAB:", e)); });
    }

    // --- Run Initialization ---
    initializePopup();
});