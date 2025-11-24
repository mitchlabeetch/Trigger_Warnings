// offscreen.js - Modified version without ES imports
console.log("OFFSCREEN: Starting (Supabase version without ES imports)...");

// --- Supabase Configuration ---
const SUPABASE_URL = 'https://qasvqvtoyrucrwshojzd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhc3ZxdnRveXJ1Y3J3c2hvanpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3Mjk5NzIsImV4cCI6MjA2MDMwNTk3Mn0.4HaleG-RqyEp-TgJ1Zhalm455AyN2nM57nDBa7iNHmY';

// --- State ---
let supabase;
let isSupabaseInitialized = false;
let initializationError = null;
let currentUserId = null;
let currentSession = null;
let isAuthReady = false;
let authReadyPromise = null;
let resolveAuthReady;
let rejectAuthReady;
authReadyPromise = new Promise((resolve, reject) => {
    resolveAuthReady = resolve;
    rejectAuthReady = reject;
});

// --- HTML Status Element & updateStatus ---
const statusElement = document.getElementById('status');
function updateStatus(message, isError = false) {
    console.log(`OFFSCREEN STATUS: ${message}`);
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = isError ? 'red' : 'green';
    }
}

// --- Initialization & Auth Handling ---
async function initializeSupabase() {
    updateStatus("Initializing Supabase client...");
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('<') || SUPABASE_ANON_KEY.includes('<')) { 
            throw new Error("Supabase URL or Anon Key is missing or invalid."); 
        }
        
        // Use the global supabaseJs from the script tag
        if (typeof supabaseJs !== 'undefined') {
            supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
            });
        } else {
            // Fallback to imported module if available
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
            });
        }
        
        console.log("OFFSCREEN: Supabase client initialized."); 
        isSupabaseInitialized = true;
        setupAuthListener(); 
        updateStatus("Supabase Initialized. Checking Auth..."); 
        sendReadySignal();
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) { console.error("OFFSCREEN: Error getting initial session:", sessionError); }
        if (session) { 
            console.log("OFFSCREEN: Initial session found."); 
            handleAuthSuccess(session); 
        } else { 
            console.log("OFFSCREEN: No initial session found. Waiting for auth state change or sign-in request."); 
        }
    } catch (error) {
        console.error("OFFSCREEN: FATAL Supabase Initialization Error:", error); 
        initializationError = `Supabase Client Init Error: ${error.message}`; 
        isSupabaseInitialized = false;
        updateStatus(`FATAL: Supabase Init Failed: ${error.message}`, true); 
        sendInitError(initializationError);
        if (rejectAuthReady) { 
            rejectAuthReady(new Error(initializationError)); 
            rejectAuthReady = null; 
            resolveAuthReady = null;
        }
    }
}

function handleAuthSuccess(session) {
     if (!session || !session.user) { console.error("OFFSCREEN: handleAuthSuccess called with invalid session"); return; }
     const user = session.user;
     if (currentUserId !== user.id || !isAuthReady) {
          currentUserId = user.id; currentSession = session; isAuthReady = true;
          console.log(`OFFSCREEN: Auth state change: SIGNED IN. UID: ${currentUserId}`); updateStatus(`Authenticated (User ID: ${currentUserId.substring(0, 8)}...)`); sendAuthStateChange(currentUserId, 'SIGNED_IN');
          if (resolveAuthReady) { console.log("OFFSCREEN: Resolving authReadyPromise."); resolveAuthReady(); resolveAuthReady = null; rejectAuthReady = null; }
     }
}

function handleAuthError(error) {
     console.error("OFFSCREEN: Auth Error:", error);
     if (currentUserId !== null || isAuthReady) {
          currentUserId = null; currentSession = null; isAuthReady = false;
          const authError = `Auth Error: ${error?.message || 'Unknown auth error'}`;
          if (!initializationError) initializationError = authError;
          updateStatus(`Auth Error: ${error?.message}`, true); sendAuthStateChange(null, 'SIGNED_OUT'); sendInitError(authError);
          if (rejectAuthReady) { console.error("OFFSCREEN: Rejecting authReadyPromise."); rejectAuthReady(new Error(authError)); rejectAuthReady = null; resolveAuthReady = null; }
          if (!resolveAuthReady && !rejectAuthReady) { authReadyPromise = new Promise((resolve, reject) => { resolveAuthReady = resolve; rejectAuthReady = reject; }); }
     }
}

function setupAuthListener() {
    if (!supabase) return; console.log("OFFSCREEN: Setting up Supabase Auth State Listener...");
    supabase.auth.onAuthStateChange((event, session) => {
        console.log(`OFFSCREEN: Supabase Auth Event: ${event}`);
        switch(event) {
            case 'INITIAL_SESSION': if (session) handleAuthSuccess(session); else console.log("OFFSCREEN: Initial session is null."); break;
            case 'SIGNED_IN': case 'TOKEN_REFRESHED': case 'USER_UPDATED': if (session) handleAuthSuccess(session); else handleAuthError(new Error(`${event} event with null session`)); break;
            case 'SIGNED_OUT': case 'USER_DELETED': handleAuthError(new Error(event === 'SIGNED_OUT' ? "User signed out" : "User deleted")); break;
            default: console.log(`OFFSCREEN: Unhandled auth event: ${event}`);
        }
    });
}

async function signInAnonymouslySupabase() {
    if (!supabase || !isSupabaseInitialized) return { status: "error", message: "Supabase client not initialized" };
    if (isAuthReady && currentUserId) { console.log("OFFSCREEN: signInAnonymously called, but already authenticated."); return { status: "success", userId: currentUserId }; }
    console.log("OFFSCREEN: Attempting anonymous sign-in..."); updateStatus("Authenticating...");
    if (!isAuthReady && !resolveAuthReady && !rejectAuthReady) { console.log("OFFSCREEN: Creating new authReadyPromise for sign-in attempt."); authReadyPromise = new Promise((resolve, reject) => { resolveAuthReady = resolve; rejectAuthReady = reject; }); }
    else if (!isAuthReady) { console.log("OFFSCREEN: Existing auth promise pending during sign-in request."); }
    try {
        console.log("OFFSCREEN: Calling supabase.auth.signInAnonymously()...");
        const { data, error } = await supabase.auth.signInAnonymously();
        console.log("OFFSCREEN: supabase.auth.signInAnonymously() completed.", { data: !!data, error: error?.message });
        if (error) throw error; if (!data?.session || !data?.user) throw new Error("Sign-in response missing session or user data.");
        handleAuthSuccess(data.session); await authReadyPromise; console.log("OFFSCREEN: Auth promise resolved/rejected after sign-in call.");
        if(isAuthReady && currentUserId){ return { status: "success", userId: currentUserId }; }
        else { throw new Error(initializationError || "Auth state inconsistent after sign-in attempt."); }
    } catch (error) {
         console.error("OFFSCREEN: signInAnonymouslySupabase Catch Block:", error);
         const authError = `Auth Sign-in Error: ${error.message || error.error_description || 'Unknown error'}`;
         handleAuthError(new Error(authError)); return { status: "error", message: authError };
    }
}

// --- Supabase Database Operations ---
async function getTriggers(videoId) {
    if (!supabase || !isSupabaseInitialized) return { status: "error", message: "Supabase not initialized" };
    if (!videoId) return { status: "error", message: "Missing videoId" };
    try {
        console.log(`OFFSCREEN: Querying triggers for video_id: ${videoId}`);
        const { data, error, status } = await supabase.from('triggers').select('*').eq('video_id', videoId).eq('status', 'approved');
        if (error) throw error;
        console.log(`OFFSCREEN: Found ${data?.length ?? 0} triggers for videoId ${videoId}. Status: ${status}`);
        return { status: "success", videoId: videoId, triggers: data || [] };
    } catch (error) {
        console.error(`OFFSCREEN: Supabase fetch error for videoId ${videoId}:`, error); updateStatus(`Error fetching triggers: ${error.message}`, true);
        const userMessage = (error.code === 'PGRST' && error.message.includes('JWT')) ? "Permission denied (Auth Issue)." : `Supabase fetch error: ${error.message}`;
        return { status: "error", message: userMessage, code: error.code };
    }
}

// FIXED: Updated addTrigger function to ensure triggers are approved automatically
async function addTrigger(triggerData) {
    if (!supabase || !isSupabaseInitialized) return { status: "error", message: "Supabase not initialized" };
    console.log(`OFFSCREEN: addTrigger - Checking auth state (isAuthReady: ${isAuthReady}). Waiting for authReadyPromise...`);
    
    try { 
        await authReadyPromise; 
        console.log(`OFFSCREEN: addTrigger - authReadyPromise resolved. Proceeding. (isAuthReady: ${isAuthReady}, userId: ${currentUserId})`); 
    } catch (authError) { 
        console.error(`OFFSCREEN: addTrigger - authReadyPromise rejected: ${authError.message}`); 
        return { status: "error", message: `Authentication required: ${authError.message}` }; 
    }
    
    if (!isAuthReady || !currentUserId) { 
        console.error("OFFSCREEN: addTrigger - Not authenticated after waiting."); 
        return { status: "error", message: "Not authenticated" }; 
    }
    
    if (!triggerData || !triggerData.videoId || !triggerData.categoryKey || 
        typeof triggerData.startTime !== 'number' || typeof triggerData.endTime !== 'number' || 
        triggerData.endTime <= triggerData.startTime) { 
        return { status: "error", message: "Invalid trigger data provided" }; 
    }

    console.log(`OFFSCREEN: Attempting to add trigger for videoId: ${triggerData.videoId}`);
    
    try {
        // Use snake_case keys matching the database columns, and EXPLICITLY set status to 'approved'
        const docToAdd = {
            video_id: triggerData.videoId,
            category_key: triggerData.categoryKey,
            start_time: triggerData.startTime,
            end_time: triggerData.endTime,
            submitted_by: currentUserId,
            status: 'approved', // Explicitly set to approved
            score: 0 // Initialize score to 0
        };
        
        console.log("OFFSCREEN: Inserting trigger data with explicit values:", docToAdd);
        console.log("OFFSCREEN: User ID being used:", currentUserId);
        console.log("OFFSCREEN: Calling supabase.from('triggers').insert()...");
        
        const { data, error } = await supabase.from('triggers').insert(docToAdd).select('id').single();
        console.log("OFFSCREEN: supabase.from('triggers').insert() call completed.", data);

        if (error) { 
            console.error("OFFSCREEN: Supabase insert returned an error object:", JSON.stringify(error)); 
            throw error; 
        }
        
        const newTriggerId = data?.id; 
        if (!newTriggerId) { 
            throw new Error("Insert succeeded but did not return an ID."); 
        }

        console.log(`OFFSCREEN: Trigger submitted successfully with ID: ${newTriggerId}`); 
        updateStatus(`Trigger submitted for video ${triggerData.videoId}`);
        return { status: "success", triggerId: newTriggerId, message: "Trigger submitted successfully" };
    } catch (error) {
        console.error(`OFFSCREEN: Catch block in addTrigger for ${triggerData.videoId}:`, error);
        updateStatus(`Error adding trigger: ${error.message}`, true);
        
        // Improved error message details for debugging
        console.error("OFFSCREEN: Error details:", {
            errorCode: error.code,
            errorMessage: error.message,
            authState: { isAuthReady, currentUserId: currentUserId?.substring(0, 8) + '...' }
        });
        
        const userMessage = 
            (error.code === 'PGRST' && error.message.includes('JWT')) ? 
                "Permission denied (Auth Issue)." :
            (error.code === '23514' && error.message.includes('end_time_after_start_time')) ? 
                "End time must be after start time." :
            (error.code === '42501') ? 
                "Permission Denied. Please check if you're signed in and have proper permissions." :
                `Supabase insert error: ${error.message}`;
                
        return { status: "error", message: userMessage, code: error.code };
    }
}

// offscreen.js - Updated voteTrigger function to handle score changes
async function voteTrigger(voteData) {
    if (!supabase || !isSupabaseInitialized) return { status: "error", message: "Supabase not initialized" };
   if (!voteData?.triggerId || !voteData.voteType || !['up', 'down'].includes(voteData.voteType)) { 
       return { status: "error", message: "Invalid vote data" }; 
   }
   try { 
       await authReadyPromise; 
   } catch (authError) { 
       return { status: "error", message: `Authentication required: ${authError.message}` }; 
   }
   if (!isAuthReady || !currentUserId) { 
       return { status: "error", message: "Not authenticated" }; 
   }
   
   console.log(`OFFSCREEN: Attempting to ${voteData.voteType}-vote trigger ${voteData.triggerId}`);
   try {
       const { error } = await supabase.rpc('handle_vote', { 
           trigger_id_in: voteData.triggerId, 
           user_id_in: currentUserId, 
           vote_type_in: voteData.voteType 
       });
       
       if (error) throw error;
       console.log(`OFFSCREEN: Vote ${voteData.voteType} processed for trigger ${voteData.triggerId}`); 
       updateStatus(`Vote recorded for trigger ${voteData.triggerId}`);
       return { status: "success", message: "Vote recorded" };
   } catch (error) {
       console.error(`OFFSCREEN: Error processing vote for ${voteData.triggerId}:`, error); 
       updateStatus(`Error voting: ${error.message}`, true);
       const userMessage = (error.code === 'PGRST' && error.message.includes('JWT')) ? 
           "Permission denied (Auth Issue)." : 
           (error.code === '42501') ? 
               "Permission Denied. Check function security or RLS." : 
               `Supabase RPC error: ${error.message}`;
       return { status: "error", message: userMessage, code: error.code };
   }
}

async function addFeedback(feedbackData) {
     if (!supabase || !isSupabaseInitialized) return { status: "error", message: "Supabase not initialized" };
    if (!feedbackData?.message) { return { status: "error", message: "Invalid feedback data (message required)" }; }
    let submitterId = null;
    try { await authReadyPromise; if (isAuthReady && currentUserId) submitterId = currentUserId; }
    catch (authError) { console.warn("OFFSCREEN: Could not confirm auth state before submitting feedback, submitting anonymously.", authError.message); submitterId = null; }
    console.log(`OFFSCREEN: Attempting to add feedback (Authenticated: ${!!submitterId})`);
    try {
        // Use snake_case for insert object keys to match DB columns
        const docToAdd = {
            name: feedbackData.name || null,
            email: feedbackData.email || null,
            message: feedbackData.message,
            submitted_by: submitterId
        };
        const { error } = await supabase.from('feedback').insert(docToAdd);
        if (error) throw error;
        console.log(`OFFSCREEN: Feedback submitted successfully.`); updateStatus(`Feedback submitted.`);
        return { status: "success", message: "Feedback submitted" };
    } catch (error) {
        console.error(`OFFSCREEN: Error adding feedback:`, error); updateStatus(`Error submitting feedback: ${error.message}`, true);
        const userMessage = (error.code === 'PGRST' && error.message.includes('JWT')) ? "Permission denied (Auth Issue)." : (error.code === '42501') ? "Permission Denied. Check RLS policies." : `Supabase insert error: ${error.message}`;
        return { status: "error", message: userMessage, code: error.code };
    }
}

// --- Communication functions ---
function sendReadySignal() { console.log("OFFSCREEN: Sending OFFSCREEN_READY to background"); try { chrome.runtime.sendMessage({ type: "OFFSCREEN_READY" }); } catch (e) { console.warn("OFFSCREEN: Error sending READY signal:", e.message); } }
function sendInitError(errorMessage) { console.error(`OFFSCREEN: Sending INIT_ERROR: ${errorMessage}`); try { chrome.runtime.sendMessage({ type: "INIT_ERROR", error: errorMessage }); } catch (e) { console.warn("OFFSCREEN: Error sending INIT_ERROR:", e.message); } }
function sendAuthStateChange(userId, status) { console.log(`OFFSCREEN: Sending AUTH_STATE_CHANGED: User=${userId ? userId.substring(0,8)+'...' : 'null'}, Status=${status}`); try { chrome.runtime.sendMessage({ type: "AUTH_STATE_CHANGED", userId: userId, status: status }); } catch (e) { console.warn("OFFSCREEN: Error sending AUTH_STATE_CHANGED:", e.message); } }

// --- Message Handling ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const messageType = message?.type || 'unknown';
    const requestId = message.requestId;
    console.log(`OFFSCREEN Received: Type=${messageType}${requestId ? ` (ReqID: ${requestId})` : ''} from background.`);

    // Use FIRESTORE_ prefixes for keys to match what background script sends
    const databaseOperations = {
        "FIRESTORE_GET_TRIGGERS": getTriggers,
        "FIRESTORE_ADD_TRIGGER": addTrigger,
        "FIRESTORE_VOTE": voteTrigger,
        "FIRESTORE_ADD_FEEDBACK": addFeedback
    };
    const authOperations = {
        "SIGN_IN_ANONYMOUSLY": signInAnonymouslySupabase
    };
    const otherOperations = {
        "OFFSCREEN_PING": async () => ({ status: "success", message: "pong" })
    };

    let operation = null;
    let payload = null;
    let isDbOperation = false;

    if (databaseOperations[messageType]) {
        operation = databaseOperations[messageType];
        payload = messageType === 'FIRESTORE_GET_TRIGGERS' ? message.videoId : message.data;
        isDbOperation = true;
    } else if (authOperations[messageType]) {
        operation = authOperations[messageType];
        payload = message.data;
    } else if (otherOperations[messageType]) {
        operation = otherOperations[messageType];
        payload = message.data;
    }

    if (operation) {
        // No immediate ack needed now, relying on async result passing
        // if (isDbOperation) { try { sendResponse({ status: "processing" }); } catch(e) {} }

        (async (currentRequestId) => {
            let response;
            try {
                 if (initializationError && messageType !== 'SIGN_IN_ANONYMOUSLY') { throw new Error(`Supabase init error: ${initializationError}`); }
                 if (!isSupabaseInitialized && messageType !== 'SIGN_IN_ANONYMOUSLY') { throw new Error(`Supabase client not initialized`); }
                console.log(`OFFSCREEN: Executing operation for ${messageType} (ReqID: ${currentRequestId})`);
                response = await operation(payload);
                console.log(`OFFSCREEN: Result for ${messageType} (ReqID: ${currentRequestId}):`, response);
            } catch (opError) {
                 console.error(`OFFSCREEN: Error during operation ${messageType} (ReqID: ${currentRequestId}):`, opError);
                 response = { status: "error", message: opError.message || `Operation failed for ${messageType}` };
            }
            try {
                 if (isDbOperation) {
                      chrome.runtime.sendMessage({ type: "OPERATION_RESULT", originalType: messageType, result: response, videoId: message.videoId, requestId: currentRequestId });
                 } else {
                      if (typeof sendResponse === 'function') { if (currentRequestId && typeof response === 'object' && response !== null) response.requestId = currentRequestId; sendResponse(response); }
                      else { console.warn(`OFFSCREEN: sendResponse invalid for ${messageType}`); }
                 }
            } catch (e) { console.error(`OFFSCREEN: Error sending ${isDbOperation ? 'result' : 'response'} for ${messageType}:`, e); }
        })(requestId);

        return !isDbOperation; // Return true only for non-DB ops

    } else {
        console.warn(`OFFSCREEN: Unhandled message type received: ${messageType}`);
        try { sendResponse({ status: "error", message: `Unknown message type in offscreen: ${messageType}`, requestId: requestId }); } catch(e) {}
        return false;
    }
});

// --- Initialization & Keep-Alive ---
window.addEventListener('load', function() {
    // Small delay to ensure supabase library is loaded
    setTimeout(() => {
        initializeSupabase();
    }, 500);
});

const keepAliveInterval = setInterval(() => { 
    if (supabase && !initializationError) { 
        chrome.runtime.sendMessage({ type: "OFFSCREEN_PING" }).catch(_ => {}); 
    } 
}, 20000);

self.addEventListener('unload', () => { 
    console.log("OFFSCREEN: Unloading..."); 
    if (keepAliveInterval) clearInterval(keepAliveInterval); 
});

updateStatus("Offscreen script loaded. Initializing Supabase...", false);
console.log("OFFSCREEN: Script execution finished. Listeners attached.");