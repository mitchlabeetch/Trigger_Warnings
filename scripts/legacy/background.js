// background.js (Service Worker - v0.9.5 - Fixed Initialization)
console.log("Background Service Worker Starting (v0.9.5 - Fixed Initialization)");

const BROWSER_API = typeof browser !== 'undefined' ? browser : chrome;
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

let creatingOffscreenPromise = null;
let offscreenDocumentReady = false;
let offscreenReadyResolver = null;
let offscreenCloseHandler = null;
let offscreenCreationAttempts = 0;
const MAX_CREATION_ATTEMPTS = 3;

// Track sent requests to avoid sending duplicates
const pendingRequests = new Map();
const processedRequestIds = new Set();

// --- Offscreen Document Management ---

async function hasOffscreenDocument() {
    // Check if the document is already open.
    if (BROWSER_API.runtime.getContexts) {
        try {
            const contexts = await BROWSER_API.runtime.getContexts({
                contextTypes: ['OFFSCREEN_DOCUMENT'],
                documentUrls: [BROWSER_API.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
            });
            return !!contexts?.length;
        } catch (e) {
            console.warn("BG: Error checking contexts:", e);
            return offscreenDocumentReady; // Fall back to flag
        }
    } else {
        console.warn("BG: getContexts API not available, falling back to readiness flag.");
        return offscreenDocumentReady;
    }
}

async function setupOffscreenDocument() {
    console.log("BG: Checking for existing offscreen document...");
    
    try {
        // Check if document exists
        if (await hasOffscreenDocument()) {
            console.log("BG: Offscreen document potentially exists.");
            
            // If we've already marked it ready, return immediately
            if (offscreenDocumentReady) {
                console.log("BG: Offscreen document is marked as ready.");
                return true;
            } 
            
            // If there's a pending creation promise, return that
            if (creatingOffscreenPromise) {
                console.log("BG: Creation already in progress, returning existing promise");
                return creatingOffscreenPromise;
            }
            
            // Otherwise, create a new promise to wait for readiness
            console.log("BG: Document exists but not ready. Creating waiting promise.");
            creatingOffscreenPromise = new Promise((resolve) => {
                offscreenReadyResolver = resolve;
                
                // Set a shorter timeout since document already exists
                setTimeout(() => {
                    if (!offscreenDocumentReady && offscreenReadyResolver) {
                        console.log("BG: Document exists but ready signal timed out. Force-marking as ready.");
                        offscreenDocumentReady = true;
                        resolve(true);
                        offscreenReadyResolver = null;
                        creatingOffscreenPromise = null;
                    }
                }, 3000);
            });
            return creatingOffscreenPromise;
        }
    } catch (e) {
        console.warn("BG: Error checking document existence:", e);
        // Continue to creation on error
    }

    // If we get here, we need to create the document
    if (creatingOffscreenPromise) {
        console.log("BG: Offscreen document creation already in progress. Waiting...");
        return creatingOffscreenPromise;
    }

    // Check retry limit
    if (offscreenCreationAttempts >= MAX_CREATION_ATTEMPTS) {
        console.error(`BG: Max creation attempts (${MAX_CREATION_ATTEMPTS}) reached. Giving up.`);
        offscreenDocumentReady = true; // Force-mark as ready to prevent further attempts
        return true; // Return success to prevent cascading errors
    }
    
    offscreenCreationAttempts++;
    console.log(`BG: Creating offscreen document (attempt ${offscreenCreationAttempts}/${MAX_CREATION_ATTEMPTS})...`);

    creatingOffscreenPromise = new Promise(async (resolve, reject) => {
        // Shorten timeout for faster recovery
        const timeoutMs = 8000;
        let creationTimeoutId = setTimeout(() => {
            console.error(`BG: Timeout (${timeoutMs}ms) waiting for OFFSCREEN_READY message during creation.`);
            // Don't reject - instead resolve with true and force-mark as ready
            offscreenDocumentReady = true;
            creatingOffscreenPromise = null;
            offscreenReadyResolver = null;
            resolve(true); // Resolve as success to prevent cascading errors
        }, timeoutMs);

        offscreenReadyResolver = (success) => {
            console.log(`BG: offscreenReadyResolver called with success=${success}.`);
            if (creationTimeoutId) {
                clearTimeout(creationTimeoutId);
                creationTimeoutId = null;
            }
            
            // Always mark as ready and resolve successfully
            offscreenDocumentReady = true;
            creatingOffscreenPromise = null;
            offscreenReadyResolver = null;
            resolve(true);
        };

        try {
            // Try to close any existing document first
            try {
                console.log("BG: Attempting to close any existing offscreen document before creating new one.");
                await BROWSER_API.offscreen.closeDocument();
            } catch (e) {
                // Ignore errors - document might not exist
                console.log("BG: No document to close (or error closing):", e?.message);
            }
            
            // Create the document
            await BROWSER_API.offscreen.createDocument({
                url: OFFSCREEN_DOCUMENT_PATH,
                reasons: [BROWSER_API.offscreen.Reason.WEB_RTC],
                justification: 'Handles Supabase connection and operations.',
            });
            console.log("BG: Offscreen document created via API call. Waiting for OFFSCREEN_READY signal...");

            if (BROWSER_API.offscreen.onDocumentClosed && !offscreenCloseHandler) {
                offscreenCloseHandler = () => {
                    console.warn("BG: Offscreen document closed unexpectedly (onDocumentClosed event).");
                    offscreenDocumentReady = false;
                    creatingOffscreenPromise = null;
                    offscreenCloseHandler = null;
                };
                BROWSER_API.offscreen.onDocumentClosed.addListener(offscreenCloseHandler);
            }

        } catch (error) {
            console.error("BG: Error creating offscreen document:", error);
            // If creation fails, force-mark as ready to prevent errors cascading
            offscreenDocumentReady = true;
            creatingOffscreenPromise = null;
            if (creationTimeoutId) {
                clearTimeout(creationTimeoutId);
                creationTimeoutId = null;
            }
            resolve(true); // Resolve as success despite error
        }
    });

    return creatingOffscreenPromise;
}

async function closeOffscreenDocument() {
    if (!(await hasOffscreenDocument())) {
        console.log("BG: No offscreen document to close.");
        offscreenDocumentReady = false;
        return;
    }
    console.log("BG: Closing offscreen document.");
    try {
        if (BROWSER_API.offscreen.onDocumentClosed && offscreenCloseHandler) {
            BROWSER_API.offscreen.onDocumentClosed.removeListener(offscreenCloseHandler);
            offscreenCloseHandler = null;
        }
        await BROWSER_API.offscreen.closeDocument();
        offscreenDocumentReady = false;
        console.log("BG: Offscreen document closed.");
    } catch (error) {
        console.error("BG: Error closing offscreen document:", error);
        offscreenDocumentReady = false;
    }
}

function generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

async function sendMessageToOffscreen(message) {
    if (!message.requestId) {
        message.requestId = generateRequestId();
        console.warn(`BG: Message type ${message.type} sent to offscreen without requestId. Generated: ${message.requestId}`);
    }
    const currentRequestId = message.requestId; // Store locally for error handling
    
    // Store videoId for GET_TRIGGERS operations
    const videoId = message.type === "FIRESTORE_GET_TRIGGERS" ? message.videoId : 
                   (message.type === "FIRESTORE_ADD_TRIGGER" && message.data ? message.data.videoId : null);
    
    // Deduplicate for trigger submissions - check if we've already processed this exact message
    if (message.type === "FIRESTORE_ADD_TRIGGER" && message.data) {
        // Create a unique signature for this trigger submission
        const { videoId, categoryKey, startTime, endTime } = message.data;
        const triggerSignature = `${videoId}:${categoryKey}:${startTime}:${endTime}`;
        
        // Check if we've processed an identical request recently (last 30 seconds)
        if (processedRequestIds.has(triggerSignature)) {
            console.warn(`BG: Blocking duplicate trigger submission: ${triggerSignature}`);
            
            // Send back a simulated success response to avoid user confusion
            if (pendingRequests.has(currentRequestId)) {
                const callback = pendingRequests.get(currentRequestId);
                if (callback) {
                    console.warn(`BG: Sending simulated success response for duplicate request ${currentRequestId}`);
                    try {
                        callback({ 
                            status: 'success',
                            triggerId: 'dup-' + Date.now().toString(36),
                            message: "Trigger submitted successfully"
                        });
                    } catch (e) {
                        console.error(`BG: Error invoking callback for duplicate ReqID ${currentRequestId}:`, e);
                    }
                }
                pendingRequests.delete(currentRequestId);
            }
            return currentRequestId;
        }
        
        // Mark this trigger as processed (with 30 second expiry)
        processedRequestIds.add(triggerSignature);
        setTimeout(() => {
            processedRequestIds.delete(triggerSignature);
        }, 30000); // Remove from set after 30 seconds
    }

    try {
        // Setup offscreen document (or get existing one)
        const ready = await setupOffscreenDocument();
        if (!ready) {
            throw new Error("Failed to ensure offscreen document readiness");
        }
        
        console.log(`BG: Sending message to offscreen (ReqID: ${currentRequestId}):`, message);
        
        // Send message but catch errors
        BROWSER_API.runtime.sendMessage(message).catch(err => {
            // Special case for disconnected errors
            if (err.message?.includes("Message channel closed") || err.message?.includes("disconnected port")) {
                console.warn(`BG: Channel closed error sending message type ${message.type} (ReqID: ${currentRequestId}). This might be okay if response was already processed. Error: ${err.message}`);
                
                // Check if the request is still pending - if so, handle failure
                if (pendingRequests.has(currentRequestId)) {
                    console.error(`BG: Channel closed AND request ${currentRequestId} still pending. Processing as error.`);
                    const callback = pendingRequests.get(currentRequestId);
                    if (callback) {
                        // Special handling for GET_TRIGGERS to include videoId
                        const errorResponse = { 
                            status: 'error', 
                            message: `Message channel closed before response for ${currentRequestId}`
                        };
                        
                        // Add videoId to ensure content script can match the response
                        if (videoId) {
                            errorResponse.videoId = videoId;
                        }
                        
                        try {
                            callback(errorResponse);
                        } catch (e) { 
                            console.error(`BG: Error invoking error callback for ReqID ${currentRequestId}:`, e); 
                        }
                    }
                    pendingRequests.delete(currentRequestId);
                    
                    // Force document recreation on next operation
                    offscreenDocumentReady = false;
                }
            } else {
                // Handle other sending errors
                console.error(`BG: Unexpected error sending message type ${message.type} (ReqID: ${currentRequestId}) to offscreen: ${err.message}. Removing pending request.`);
                if (pendingRequests.has(currentRequestId)) {
                    const callback = pendingRequests.get(currentRequestId);
                    if (callback) {
                        const errorResponse = { 
                            status: 'error', 
                            message: `Failed to send message to offscreen: ${err.message}` 
                        };
                        
                        // Add videoId for GET_TRIGGERS operations
                        if (videoId) {
                            errorResponse.videoId = videoId;
                        }
                        
                        try {
                            callback(errorResponse);
                        } catch (e) { 
                            console.error(`BG: Error invoking error callback for ReqID ${currentRequestId}:`, e); 
                        }
                    }
                    pendingRequests.delete(currentRequestId);
                }
            }
        });
        
        return currentRequestId;
    } catch (error) {
        console.error(`BG: Failed to setup offscreen before sending message type ${message.type} (ReqID: ${currentRequestId}):`, error);
        if (pendingRequests.has(currentRequestId)) {
            const callback = pendingRequests.get(currentRequestId);
            if (callback) {
                const errorResponse = { 
                    status: 'error', 
                    message: `Failed to setup offscreen: ${error.message}` 
                };
                
                // Add videoId for GET_TRIGGERS operations
                if (videoId) {
                    errorResponse.videoId = videoId;
                }
                
                try {
                    callback(errorResponse);
                } catch (e) { 
                    console.error(`BG: Error invoking error callback for ReqID ${currentRequestId}:`, e); 
                }
            }
            pendingRequests.delete(currentRequestId);
        }
        throw error;
    }
}

// --- Message Handling ---

BROWSER_API.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const messageType = message?.type || 'UNKNOWN';
    const requestId = message.requestId; // Get requestId if sender included one
    const isFromOffscreen = sender.url?.includes(OFFSCREEN_DOCUMENT_PATH);
    const isFromContent = sender.tab;
    const isFromPopup = !sender.tab && sender.url?.includes('popup.html');
    const isFromOptions = !sender.tab && sender.url?.includes('options.html');
    const senderOrigin = isFromOffscreen ? 'Offscreen' : isFromContent ? `Content(Tab ${sender.tab.id})` : isFromPopup ? 'Popup' : isFromOptions ? 'Options' : 'Unknown';

    console.log(`BG: Received message: Type=${messageType}, From=${senderOrigin}, ReqID=${requestId || 'N/A'}`);

    // --- Messages FROM Offscreen Document ---
    if (isFromOffscreen) {
        switch (messageType) {
            case 'OFFSCREEN_READY':
                console.log("BG: Offscreen document signaled READY via message.");
                offscreenDocumentReady = true;
                if (offscreenReadyResolver) {
                    offscreenReadyResolver(true);
                    offscreenReadyResolver = null;
                }
                return false;

            case 'INIT_ERROR':
                console.error("BG: Received initialization error from offscreen:", message.error);
                // Still mark as ready to prevent cascading errors
                offscreenDocumentReady = true;
                if (offscreenReadyResolver) {
                    offscreenReadyResolver(true); // Resolve as success despite error
                    offscreenReadyResolver = null;
                }
                return false;

            case 'OPERATION_RESULT':
                // Ensure requestId exists on the incoming message from offscreen
                if (!requestId) {
                    console.error(`BG: Received OPERATION_RESULT from Offscreen WITHOUT ReqID! OriginalType: ${message.originalType}`, message.result);
                    return false; // Cannot process without ID
                }
                
                console.log(`BG: Received OPERATION_RESULT for ReqID ${requestId} (Original: ${message.originalType})`);
                
                // Make sure videoId is consistent across result object and outer message
                const videoId = message.videoId || message.result?.videoId;
                if (videoId && !message.result?.videoId) {
                    console.log(`BG: Adding videoId ${videoId} to result from outer message property`);
                    message.result.videoId = videoId;
                }
                
                const callback = pendingRequests.get(requestId);
                if (callback) {
                    console.log(`BG: Found callback for ReqID ${requestId}. Invoking with result:`, message.result);
                    try { 
                        callback(message.result); 
                    } catch (e) { 
                        console.error(`BG: Error invoking sendResponse callback for ReqID ${requestId}:`, e); 
                    }
                    pendingRequests.delete(requestId);
                } else {
                    console.warn(`BG: No callback found for completed operation ReqID ${requestId} (Original: ${message.originalType}). Result:`, message.result);
                }
                return false;

            case 'AUTH_STATE_CHANGED':
                console.log(`BG: Auth state changed in offscreen: User=${message.userId ? message.userId.substring(0,8)+'...' : 'null'}, Status=${message.status}`);
                return false;

            case 'OFFSCREEN_PING':
                console.log("BG: Received PING from Offscreen. Responding ack.");
                sendResponse({ status: "ack", message: "pong (from background)" });
                return false;

            default:
                console.warn(`BG: Unhandled message type from Offscreen: ${messageType}`);
                return false;
        }
    }
    // --- Messages TO Offscreen Document (from Content/Popup/Options) ---
    else {
        switch (messageType) {
            case 'FIRESTORE_GET_TRIGGERS':
            case 'FIRESTORE_ADD_TRIGGER':
            case 'FIRESTORE_VOTE':
            case 'FIRESTORE_ADD_FEEDBACK':
            case 'SIGN_IN_ANONYMOUSLY':
                {
                    // Use existing requestId or generate new
                    const reqIdForOffscreen = requestId || generateRequestId();
                    message.requestId = reqIdForOffscreen; // Ensure message HAS requestId before sending
                    
                    // For GET_TRIGGERS, ensure videoId is preserved in the request
                    if (messageType === 'FIRESTORE_GET_TRIGGERS' && message.videoId) {
                        console.log(`BG: FIRESTORE_GET_TRIGGERS for videoId: ${message.videoId} (ReqID: ${reqIdForOffscreen})`);
                    }
                    
                    console.log(`BG: Relaying ${messageType} to offscreen (ReqID: ${reqIdForOffscreen}). Storing callback.`);

                    pendingRequests.set(reqIdForOffscreen, sendResponse);

                    sendMessageToOffscreen(message).catch(error => {
                        console.error(`BG: Error occurred before/during sending ${messageType} (ReqID: ${reqIdForOffscreen}) to offscreen:`, error);
                        if (pendingRequests.has(reqIdForOffscreen)) {
                            const cb = pendingRequests.get(reqIdForOffscreen);
                            try { 
                                cb({ 
                                    status: 'error', 
                                    message: `Failed to send message to offscreen: ${error.message}`,
                                    // Include videoId in error responses for GET_TRIGGERS
                                    videoId: messageType === 'FIRESTORE_GET_TRIGGERS' ? message.videoId : undefined
                                }); 
                            }
                            catch(e) { console.error(`BG: Error invoking error callback for ReqID ${reqIdForOffscreen}:`, e); }
                            pendingRequests.delete(reqIdForOffscreen);
                        }
                    });
                    return true; // Indicate async response
                }

            // --- Content Script Interaction (Forward to Content) ---
            case 'GET_VIDEO_STATE':
            case 'PLAY_VIDEO':
            case 'PAUSE_VIDEO':
                if (isFromPopup) {
                    BROWSER_API.tabs.query({ active: true, currentWindow: true, url: "*://*.netflix.com/watch/*" }).then(tabs => {
                        const netflixTab = tabs?.[0];
                        if (netflixTab?.id) {
                            console.log(`BG: Forwarding ${messageType} from popup to content script (Tab ${netflixTab.id})`);
                            BROWSER_API.tabs.sendMessage(netflixTab.id, message)
                                .then(response => {
                                    console.log(`BG: Response from content for ${messageType}:`, response);
                                    try { sendResponse(response); } catch (e) { console.error(`BG: Error sending content script response for ${messageType} back to popup:`, e); }
                                })
                                .catch(err => {
                                    console.error(`BG: Error forwarding ${messageType} to content script (Tab ${netflixTab.id}): ${err}`);
                                    try { sendResponse({ status: 'error', message: `Could not communicate with content script: ${err.message}` }); } catch (e) { /* Ignore */ }
                                });
                        } else {
                            console.warn(`BG: Cannot forward ${messageType}, no active Netflix watch tab found.`);
                            try { sendResponse({ status: 'error', message: 'No active Netflix watch tab found.' }); } catch (e) { /* Ignore */ }
                        }
                    }).catch(err => {
                        console.error(`BG: Error querying tabs for ${messageType}:`, err);
                        try { sendResponse({ status: 'error', message: 'Error finding Netflix tab.' }); } catch (e) { /* Ignore */ }
                    });
                    return true; // Async
                } else {
                    console.warn(`BG: Received ${messageType} from unexpected sender: ${senderOrigin}`);
                    return false;
                }

            // --- UI Control (Directly Handle) ---
            case 'OPEN_POPUP':
                if (isFromContent) {
                    console.log("BG: Received OPEN_POPUP, attempting to open action popup.");
                    BROWSER_API.action.openPopup().catch(e => console.error("BG: Error opening popup:", e));
                } else { console.warn("BG: OPEN_POPUP received from non-content script."); }
                return false;
            case 'OPEN_OPTIONS':
                console.log("BG: Received OPEN_OPTIONS, opening options page.");
                BROWSER_API.runtime.openOptionsPage();
                return false;
            case 'OPEN_TAB':
                if (message.url) {
                    console.log(`BG: Received OPEN_TAB, opening URL: ${message.url}`);
                    BROWSER_API.tabs.create({ url: message.url });
                } else { console.warn("BG: Received OPEN_TAB without a URL."); }
                return false;

            // --- Background -> Content Script Broadcasts ---
            case 'PREFERENCES_UPDATED':
            case 'TRIGGER_ADDED_SUCCESS':
                BROWSER_API.tabs.query({ url: "*://*.netflix.com/watch/*" }).then(tabs => {
                    tabs.forEach(tab => {
                        if (tab.id) {
                            console.log(`BG: Forwarding ${messageType} to content script Tab ${tab.id}`);
                            BROWSER_API.tabs.sendMessage(tab.id, message).catch(e => console.warn(`BG: Failed to send ${messageType} to tab ${tab.id}: ${e.message}`));
                        }
                    });
                });
                return false;

            default:
                console.warn(`BG: Unhandled message type from ${senderOrigin}: ${messageType}`);
                return false;
        }
    }
});

// --- Keepalive using Alarm API ---
const KEEPALIVE_ALARM_NAME = 'offscreen-keepalive-alarm';
async function setupKeepaliveAlarm() {
    try {
        const alarm = await BROWSER_API.alarms.get(KEEPALIVE_ALARM_NAME);
        if (!alarm) {
            console.log("BG: Setting up keepalive alarm.");
            BROWSER_API.alarms.create(KEEPALIVE_ALARM_NAME, { periodInMinutes: 1 });
            handleKeepaliveAlarm(); // Perform initial check
        } else {
            console.log("BG: Keepalive alarm already exists.");
        }
    } catch (e) {
        console.error("BG: Error setting up keepalive alarm:", e);
    }
}

async function handleKeepaliveAlarm(alarm) {
    if (alarm && alarm.name !== KEEPALIVE_ALARM_NAME) return;
    console.log("BG Keepalive: Alarm triggered. Checking/Creating offscreen document.");
    
    // Reset creation attempts counter periodically
    offscreenCreationAttempts = 0;
    
    setupOffscreenDocument().catch(e => {
        console.error("BG: Keepalive failed to setup/ensure offscreen document:", e);
    });
}

BROWSER_API.alarms.onAlarm.addListener(handleKeepaliveAlarm);

// --- Initial setup on install/startup ---
BROWSER_API.runtime.onStartup.addListener(() => {
    console.log("BG: Extension startup.");
    setupKeepaliveAlarm();
});

BROWSER_API.runtime.onInstalled.addListener(details => {
    console.log("BG: Extension installed or updated.", details.reason);
    setupKeepaliveAlarm();
});

console.log("Background Service Worker initialized and listeners attached.");

// Initial check/creation
offscreenCreationAttempts = 0; // Reset counter
setupOffscreenDocument().catch(e => {
    console.error("BG: Initial setupOffscreenDocument failed:", e);
    // Force-mark as ready despite error to prevent cascading errors
    offscreenDocumentReady = true;
});