// offscreen-wrapper.js (Bundled - Ultra-Focused Debug v1.1.13)

// --- Log Start ---
console.log('[OFFSCREEN_ULTRA_DEBUG] Script execution started.');
let initStage = 'start'; // Track progress

// --- DOM Element & Status ---
const statusElement = document.getElementById('status');
function updateStatus(message, isError = false) {
    const prefix = isError ? '[OFFSCREEN ERROR]' : '[OFFSCREEN STATUS]';
    console.log(`${prefix}: ${message}`);
    if (statusElement) {
        try { statusElement.textContent = `[${initStage}] ${message}`; statusElement.style.color = isError ? 'red' : 'green'; }
        catch (e) { console.warn("[OFFSCREEN_ULTRA_DEBUG] Failed to update status element:", e); }
    } else {
        console.warn("[OFFSCREEN_ULTRA_DEBUG] Status element not found.");
    }
}

// --- Signal Functions ---
function sendReadySignal() {
    initStage = 'sending_ready';
    console.log('[OFFSCREEN_ULTRA_DEBUG] Attempting to send OFFSCREEN_READY signal NOW...');
    updateStatus("Attempting to send READY signal...");
    try {
        if (chrome.runtime?.id) {
            chrome.runtime.sendMessage({ type: "OFFSCREEN_READY" });
            console.log('[OFFSCREEN_ULTRA_DEBUG] OFFSCREEN_READY signal sent (API call made).');
            updateStatus("READY signal sent.");
        } else {
            console.warn("[OFFSCREEN_ULTRA_DEBUG] chrome.runtime not available, cannot send READY signal.");
            updateStatus("Cannot send READY (runtime invalid).", true);
        }
    } catch (e) {
        console.error("[OFFSCREEN_ULTRA_DEBUG] Exception sending READY signal:", e);
        updateStatus(`EXCEPTION sending READY: ${e.message}`, true);
    }
    initStage = 'sent_ready';
}
function sendInitError(errorMessage) {
    console.error(`[OFFSCREEN_ULTRA_DEBUG] Sending INIT_ERROR: ${errorMessage}`);
    updateStatus(`INIT ERROR: ${errorMessage}`, true);
    try {
         if (chrome.runtime?.id) {
            chrome.runtime.sendMessage({ type: "INIT_ERROR", error: `[${initStage}] ${errorMessage}` });
         } else {
             console.warn("[OFFSCREEN_ULTRA_DEBUG] chrome.runtime not available, cannot send INIT_ERROR signal.");
         }
    } catch (e) {
        console.error("[OFFSCREEN_ULTRA_DEBUG] Exception sending INIT_ERROR signal:", e);
    }
}

// --- Initialization Function (Simplified, Synchronous Focus) ---
function initialize() {
    initStage = 'init_called';
    console.log('[OFFSCREEN_ULTRA_DEBUG] initialize() function called.');
    updateStatus("Initializing...");

    let supabaseClientInstance = null; // Local variable for the client
    let clientCreationFailed = false;

    try {
        initStage = 'import_check';
        console.log('[OFFSCREEN_ULTRA_DEBUG] Checking Supabase import...');
        // Ensure createClient is available (Webpack should provide it)
        const { createClient } = require('@supabase/supabase-js'); // Or import
        if (typeof createClient !== 'function') {
            throw new Error('createClient function not available after import/require.');
        }
        console.log('[OFFSCREEN_ULTRA_DEBUG] createClient function confirmed available.');

        initStage = 'constants_check';
        const SUPABASE_URL = 'https://qasvqvtoyrucrwshojzd.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhc3ZxdnRveXJ1Y3J3c2hvanpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3Mjk5NzIsImV4cCI6MjA2MDMwNTk3Mn0.4HaleG-RqyEp-TgJ1Zhalm455AyN2nM57nDBa7iNHmY';
        console.log('[OFFSCREEN_ULTRA_DEBUG] Constants defined.');
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("URL or Key is missing.");

        initStage = 'create_client_attempt';
        console.log('[OFFSCREEN_ULTRA_DEBUG] --- Attempting createClient call NOW ---');
        updateStatus("Creating Supabase client...");
        try {
            supabaseClientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
                // Add storage options if needed, but keep minimal for now
                 // storage: { /* options */ }
            });
            console.log('[OFFSCREEN_ULTRA_DEBUG] --- createClient call finished ---');

            if (!supabaseClientInstance) {
                console.error('[OFFSCREEN_ULTRA_DEBUG] createClient returned null/undefined!');
                clientCreationFailed = true;
                updateStatus("Client creation returned null!", true);
            } else {
                console.log('[OFFSCREEN_ULTRA_DEBUG] Supabase client instance CREATED successfully.');
                updateStatus("Client created.", false);
                // Assign to global scope *only if successful* for message handlers later
                supabase = supabaseClientInstance;
            }
        } catch (clientError) {
            console.error('[OFFSCREEN_ULTRA_DEBUG] --- Error DURING createClient call: ---', clientError);
            clientCreationFailed = true;
            updateStatus(`CreateClient ERROR: ${clientError.message}`, true);
            initializationError = `createClient failed: ${clientError.message}`; // Store error message
        }

        // --- Send Ready Signal Immediately After Attempt ---
        initStage = 'post_create_attempt';
        console.log(`[OFFSCREEN_ULTRA_DEBUG] Reached point after createClient attempt (Success: ${!clientCreationFailed}). Sending READY signal.`);
        sendReadySignal(); // Send ready regardless of client creation success

        // --- Setup Listener ONLY if client creation succeeded ---
        if (!clientCreationFailed && supabaseClientInstance) {
            initStage = 'setup_listeners';
            console.log('[OFFSCREEN_ULTRA_DEBUG] Client created, now setting up message listener...');
            setupMessageListener(); // Use a basic one for now
            console.log('[OFFSCREEN_ULTRA_DEBUG] Message listener setup finished.');
            updateStatus("Client OK, Listener Setup.", false);
        } else {
             console.error('[OFFSCREEN_ULTRA_DEBUG] Client creation failed, skipping listener setup.');
             // Send error signal *after* ready signal was sent
             sendInitError(initializationError || "Client creation failed silently");
        }

    } catch (earlyError) {
        // Catches errors before the createClient attempt (import, constants)
        console.error("[OFFSCREEN_ULTRA_DEBUG] VERY EARLY INITIALIZATION FAILURE:", earlyError);
        updateStatus(`EARLY INIT FAIL: ${earlyError.message}`, true);
        // Attempt to send an error signal (READY won't have been sent)
        sendInitError(`[${initStage}] ${earlyError.message}`);
    }
    initStage = 'init_finished';
    console.log('[OFFSCREEN_ULTRA_DEBUG] initialize() function finished execution.');
}


// --- Basic Message Listener for Debugging ---
let messageListenerAttached = false;
function setupMessageListener() {
    if (messageListenerAttached) return;
    console.log('[OFFSCREEN_ULTRA_DEBUG] Setting up BASIC message listener...');
    try {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (!sender || sender.id !== chrome.runtime.id) return false;
            console.log(`[OFFSCREEN_ULTRA_DEBUG] BASIC Listener Received: ${message?.type}`);
            // Don't process further, just acknowledge reception for debugging
            return false;
        });
        messageListenerAttached = true;
        console.log('[OFFSCREEN_ULTRA_DEBUG] BASIC message listener attached.');
    } catch (e) {
        console.error('[OFFSCREEN_ULTRA_DEBUG] Failed to attach BASIC message listener:', e);
        updateStatus("CRITICAL: Message listener setup failed.", true);
    }
}


// --- Event Listeners ---
window.addEventListener('DOMContentLoaded', () => {
     console.log('[OFFSCREEN_ULTRA_DEBUG] DOMContentLoaded event fired.');
     updateStatus("DOM Ready. Initializing...", false);
     initialize();
});

window.addEventListener('unload', () => {
    console.log("[OFFSCREEN_ULTRA_DEBUG] Unloading document...");
    messageListenerAttached = false;
    supabase = null;
});

// --- Initial Status ---
updateStatus("Offscreen script loaded. Waiting for DOMContentLoaded...", false);
console.log("[OFFSCREEN_ULTRA_DEBUG] Script execution finished (end of file).");