/**
 * Background service worker
 * Handles message routing, Supabase initialization, and extension lifecycle
 */

import browser from 'webextension-polyfill';
import { SupabaseClient } from '@core/api/SupabaseClient';
import { ProfileManager } from '@core/profiles/ProfileManager';
import { StorageAdapter } from '@core/storage/StorageAdapter';
import type {
  Message,
  MessageResponse,
  WarningsResponse,
  ProfileResponse,
  ProfilesResponse,
  VoidResponse,
} from '@shared/types/Messages.types';

console.log('[TW Background] Service worker started');

/**
 * Initialize Supabase client on startup
 */
async function initialize(): Promise<void> {
  console.log('[TW Background] Initializing...');

  try {
    // Initialize Supabase
    await SupabaseClient.initialize();

    // Ensure default profile exists
    await ProfileManager.getActive();

    // Set up keepalive alarm (every 1 minute)
    browser.alarms.create('keepalive', { periodInMinutes: 1 });

    console.log('[TW Background] Initialization complete');
  } catch (error) {
    console.error('[TW Background] Initialization error:', error);
  }
}

/**
 * Handle incoming messages from content scripts, popup, or options
 */
async function handleMessage(
  message: Message,
  sender: browser.Runtime.MessageSender
): Promise<MessageResponse> {
  console.log('[TW Background] Received message:', message.type, sender.tab?.id);

  try {
    switch (message.type) {
      case 'GET_WARNINGS': {
        const warnings = await SupabaseClient.getTriggers(message.videoId);
        return { success: true, data: warnings } as WarningsResponse;
      }

      case 'SUBMIT_WARNING': {
        const success = await SupabaseClient.submitTrigger(message.submission);
        return { success, data: undefined } as VoidResponse;
      }

      case 'VOTE_WARNING': {
        const success = await SupabaseClient.voteTrigger(message.triggerId, message.voteType);
        return { success, data: undefined } as VoidResponse;
      }

      case 'GET_ACTIVE_PROFILE': {
        const profile = await ProfileManager.getActive();
        return { success: true, data: profile } as ProfileResponse;
      }

      case 'SET_ACTIVE_PROFILE': {
        const success = await ProfileManager.setActive(message.profileId);
        if (success) {
          // Broadcast profile change to all tabs
          await broadcastProfileChange(message.profileId);
        }
        return { success, data: undefined } as VoidResponse;
      }

      case 'CREATE_PROFILE': {
        const profile = await ProfileManager.create(message.profile);
        return { success: true, data: profile } as ProfileResponse;
      }

      case 'UPDATE_PROFILE': {
        const profile = await ProfileManager.update(message.profileId, message.updates);
        if (profile) {
          // If this is the active profile, broadcast the change
          const activeProfileId = await StorageAdapter.get('activeProfileId');
          if (activeProfileId === message.profileId) {
            await broadcastProfileChange(message.profileId);
          }
          return { success: true, data: profile } as ProfileResponse;
        }
        return { success: false, error: 'Profile not found' } as ProfileResponse;
      }

      case 'DELETE_PROFILE': {
        const success = await ProfileManager.delete(message.profileId);
        return { success, data: undefined } as VoidResponse;
      }

      case 'GET_ALL_PROFILES': {
        const profiles = await ProfileManager.getAll();
        return { success: true, data: profiles } as ProfilesResponse;
      }

      case 'SUBMIT_FEEDBACK': {
        const success = await SupabaseClient.submitFeedback(
          message.message,
          message.name,
          message.email
        );
        return { success, data: undefined } as VoidResponse;
      }

      default:
        return {
          success: false,
          error: `Unknown message type: ${(message as any).type}`,
        };
    }
  } catch (error) {
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
async function broadcastProfileChange(profileId: string): Promise<void> {
  const tabs = await browser.tabs.query({});

  for (const tab of tabs) {
    if (tab.id && tab.url) {
      // Only send to tabs with our content scripts
      const isSupported =
        tab.url.includes('netflix.com') ||
        tab.url.includes('primevideo.com') ||
        tab.url.includes('amazon.com') ||
        tab.url.includes('youtube.com') ||
        tab.url.includes('hulu.com') ||
        tab.url.includes('disneyplus.com') ||
        tab.url.includes('max.com') ||
        tab.url.includes('peacocktv.com');

      if (isSupported) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: 'PROFILE_CHANGED',
            profileId,
          });
        } catch (error) {
          // Tab might not have content script loaded yet
          console.warn('[TW Background] Failed to send message to tab:', tab.id);
        }
      }
    }
  }
}

/**
 * Handle alarm events (keepalive)
 */
function handleAlarm(alarm: browser.Alarms.Alarm): void {
  if (alarm.name === 'keepalive') {
    // Just log to keep service worker alive
    console.log('[TW Background] Keepalive ping');
  }
}

/**
 * Handle extension installation/update
 */
async function handleInstalled(details: browser.Runtime.OnInstalledDetailsType): Promise<void> {
  console.log('[TW Background] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First installation
    await StorageAdapter.set('isFirstRun', true);

    // Create default profile
    await ProfileManager.getActive();

    console.log('[TW Background] First-time setup complete');
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('[TW Background] Extension updated to version:', browser.runtime.getManifest().version);
  }
}

// Set up event listeners
browser.runtime.onMessage.addListener((message, sender) => {
  return handleMessage(message as Message, sender);
});

browser.alarms.onAlarm.addListener(handleAlarm);

browser.runtime.onInstalled.addListener(handleInstalled);

// Initialize on startup
initialize();
