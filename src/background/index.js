/**
 * Background service worker
 * Handles message routing, Supabase initialization, and extension lifecycle
 */
import browser from 'webextension-polyfill';
import { SupabaseClient } from '@core/api/SupabaseClient';
import { ProfileManager } from '@core/profiles/ProfileManager';
import { StorageAdapter } from '@core/storage/StorageAdapter';
import { isSupportedPlatform } from '@shared/utils/platformDetection';
import { DEFAULT_PROFILE } from '@shared/constants/defaults';
console.log('[TW Background] Service worker started');
/**
 * Initialize Supabase client on startup
 */
async function initialize() {
    console.log('[TW Background] Initializing...');
    try {
        // Initialize Supabase in the background (non-blocking)
        // Extension should work even if Supabase is unavailable
        SupabaseClient.initialize()
            .then(() => console.log('[TW Background] Supabase connected'))
            .catch((error) => console.warn('[TW Background] Supabase unavailable:', error));
        // Ensure default profile exists (uses local storage, doesn't need Supabase)
        await ProfileManager.getActive();
        // Set up keepalive alarm (every 1 minute)
        browser.alarms.create('keepalive', { periodInMinutes: 1 });
        console.log('[TW Background] Initialization complete');
    }
    catch (error) {
        console.error('[TW Background] Initialization error:', error);
    }
}
/**
 * Handle incoming messages from content scripts, popup, or options
 */
async function handleMessage(message, sender) {
    console.log('[TW Background] Received message:', message.type, sender.tab?.id);
    try {
        switch (message.type) {
            case 'GET_WARNINGS': {
                const warnings = await SupabaseClient.getTriggers(message.videoId);
                return { success: true, data: warnings };
            }
            case 'SUBMIT_WARNING': {
                const success = await SupabaseClient.submitTrigger(message.submission);
                return { success, data: undefined };
            }
            case 'VOTE_WARNING': {
                const success = await SupabaseClient.voteTrigger(message.triggerId, message.voteType);
                return { success, data: undefined };
            }
            case 'GET_ACTIVE_PROFILE': {
                try {
                    console.log('[TW Background] Getting active profile...');
                    const profile = await ProfileManager.getActive();
                    console.log('[TW Background] Active profile retrieved:', profile?.name);
                    return { success: true, data: profile };
                }
                catch (error) {
                    console.error('[TW Background] Error getting active profile:', error);
                    // Return a minimal default profile so popup doesn't hang
                    return {
                        success: true,
                        data: {
                            id: 'emergency_profile',
                            ...DEFAULT_PROFILE,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    };
                }
            }
            case 'SET_ACTIVE_PROFILE': {
                const success = await ProfileManager.setActive(message.profileId);
                if (success) {
                    // Broadcast profile change to all tabs
                    await broadcastProfileChange(message.profileId);
                }
                return { success, data: undefined };
            }
            case 'CREATE_PROFILE': {
                const profile = await ProfileManager.create(message.profile);
                return { success: true, data: profile };
            }
            case 'UPDATE_PROFILE': {
                const profile = await ProfileManager.update(message.profileId, message.updates);
                if (profile) {
                    // If this is the active profile, broadcast the change
                    const activeProfileId = await StorageAdapter.get('activeProfileId');
                    if (activeProfileId === message.profileId) {
                        await broadcastProfileChange(message.profileId);
                    }
                    return { success: true, data: profile };
                }
                return { success: false, error: 'Profile not found' };
            }
            case 'DELETE_PROFILE': {
                const success = await ProfileManager.delete(message.profileId);
                return { success, data: undefined };
            }
            case 'GET_ALL_PROFILES': {
                try {
                    console.log('[TW Background] Getting all profiles...');
                    const profiles = await ProfileManager.getAll();
                    console.log('[TW Background] Retrieved', profiles.length, 'profiles');
                    return { success: true, data: profiles };
                }
                catch (error) {
                    console.error('[TW Background] Error getting profiles:', error);
                    // Return empty array so popup doesn't hang
                    return { success: true, data: [] };
                }
            }
            case 'SUBMIT_FEEDBACK': {
                const success = await SupabaseClient.submitFeedback(message.message, message.name, message.email);
                return { success, data: undefined };
            }
            case 'STORE_QUICK_ADD_CONTEXT': {
                // Store the current video context for quick-add trigger functionality
                await StorageAdapter.set('quickAddContext', {
                    videoId: message.videoId,
                    timestamp: message.timestamp,
                    savedAt: Date.now(),
                });
                console.log('[TW Background] Stored quick add context:', message.videoId, message.timestamp);
                return { success: true, data: undefined };
            }
            case 'GET_QUICK_ADD_CONTEXT': {
                const context = await StorageAdapter.get('quickAddContext');
                // Clear context after retrieval (one-time use)
                if (context) {
                    await StorageAdapter.remove('quickAddContext');
                }
                return { success: true, data: context };
            }
            default:
                return {
                    success: false,
                    error: `Unknown message type: ${message.type}`,
                };
        }
    }
    catch (error) {
        console.error('[TW Background] Error handling message:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Broadcast profile change to all tabs with content scripts
 */
async function broadcastProfileChange(profileId) {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
        if (tab.id && tab.url) {
            // Only send to tabs with our content scripts - use centralized platform detection
            if (isSupportedPlatform(tab.url)) {
                try {
                    await browser.tabs.sendMessage(tab.id, {
                        type: 'PROFILE_CHANGED',
                        profileId,
                    });
                    console.log('[TW Background] Sent profile change to tab:', tab.id);
                }
                catch (error) {
                    // Tab might not have content script loaded yet, or user navigated away
                    console.warn('[TW Background] Failed to send message to tab:', tab.id);
                }
            }
        }
    }
}
/**
 * Handle alarm events (keepalive)
 */
function handleAlarm(alarm) {
    if (alarm.name === 'keepalive') {
        // Just log to keep service worker alive
        console.log('[TW Background] Keepalive ping');
    }
}
/**
 * Handle extension installation/update
 */
async function handleInstalled(details) {
    console.log('[TW Background] Extension installed/updated:', details.reason);
    if (details.reason === 'install') {
        // First installation
        await StorageAdapter.set('isFirstRun', true);
        // Create default profile
        await ProfileManager.getActive();
        console.log('[TW Background] First-time setup complete');
    }
    else if (details.reason === 'update') {
        // Extension updated
        console.log('[TW Background] Extension updated to version:', browser.runtime.getManifest().version);
    }
}
// Set up event listeners
browser.runtime.onMessage.addListener((message, sender) => {
    return handleMessage(message, sender);
});
browser.alarms.onAlarm.addListener(handleAlarm);
browser.runtime.onInstalled.addListener(handleInstalled);
// Initialize on startup
initialize();
//# sourceMappingURL=index.js.map