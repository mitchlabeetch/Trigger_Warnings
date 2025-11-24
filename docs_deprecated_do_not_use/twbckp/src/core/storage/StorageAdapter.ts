/**
 * Storage adapter for browser extension storage
 * Provides a typed interface to chrome.storage.sync
 */

import type { StorageSchema, StorageKey, StorageChangeCallback } from '@shared/types/Storage.types';
import browser from 'webextension-polyfill';

export class StorageAdapter {
  private static changeListeners: Map<StorageKey, Set<StorageChangeCallback>> = new Map();

  /**
   * Get a value from storage
   */
  static async get<K extends StorageKey>(key: K): Promise<StorageSchema[K] | null> {
    try {
      const result = await browser.storage.sync.get(key);
      return result[key] ?? null;
    } catch (error) {
      console.error(`[TW Storage] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in storage
   */
  static async set<K extends StorageKey>(key: K, value: StorageSchema[K]): Promise<boolean> {
    try {
      await browser.storage.sync.set({ [key]: value });
      return true;
    } catch (error) {
      console.error(`[TW Storage] Error setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove a key from storage
   */
  static async remove(key: StorageKey): Promise<boolean> {
    try {
      await browser.storage.sync.remove(key);
      return true;
    } catch (error) {
      console.error(`[TW Storage] Error removing ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  static async clear(): Promise<boolean> {
    try {
      await browser.storage.sync.clear();
      return true;
    } catch (error) {
      console.error('[TW Storage] Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Get multiple values from storage
   */
  static async getMultiple<K extends StorageKey>(
    keys: K[]
  ): Promise<Partial<StorageSchema>> {
    try {
      const result = await browser.storage.sync.get(keys);
      return result as Partial<StorageSchema>;
    } catch (error) {
      console.error('[TW Storage] Error getting multiple values:', error);
      return {};
    }
  }

  /**
   * Set multiple values in storage
   */
  static async setMultiple(values: Partial<StorageSchema>): Promise<boolean> {
    try {
      await browser.storage.sync.set(values);
      return true;
    } catch (error) {
      console.error('[TW Storage] Error setting multiple values:', error);
      return false;
    }
  }

  /**
   * Listen for changes to a specific key
   */
  static onChange<K extends StorageKey>(
    key: K,
    callback: StorageChangeCallback<StorageSchema[K]>
  ): () => void {
    if (!this.changeListeners.has(key)) {
      this.changeListeners.set(key, new Set());
    }

    const listeners = this.changeListeners.get(key)!;
    listeners.add(callback as StorageChangeCallback);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback as StorageChangeCallback);
      if (listeners.size === 0) {
        this.changeListeners.delete(key);
      }
    };
  }

  /**
   * Initialize storage change listener
   * Should be called once at startup
   */
  static initializeChangeListener(): void {
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;

      for (const [key, change] of Object.entries(changes)) {
        const listeners = this.changeListeners.get(key as StorageKey);
        if (listeners) {
          listeners.forEach((callback) => {
            callback(
              {
                oldValue: change.oldValue,
                newValue: change.newValue,
              },
              key as StorageKey
            );
          });
        }
      }
    });
  }

  /**
   * Get storage usage information
   */
  static async getUsage(): Promise<{ bytesInUse: number; quota: number }> {
    try {
      const bytesInUse = await browser.storage.sync.getBytesInUse();
      // Chrome sync storage quota is 102,400 bytes
      const quota = 102400;
      return { bytesInUse, quota };
    } catch (error) {
      console.error('[TW Storage] Error getting usage:', error);
      return { bytesInUse: 0, quota: 102400 };
    }
  }
}

// Initialize change listener
StorageAdapter.initializeChangeListener();
