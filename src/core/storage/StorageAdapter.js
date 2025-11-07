/**
 * Storage adapter for browser extension storage
 * Provides a typed interface to chrome.storage.sync
 */
import browser from 'webextension-polyfill';
export class StorageAdapter {
    static changeListeners = new Map();
    /**
     * Get a value from storage
     */
    static async get(key) {
        try {
            const result = await browser.storage.sync.get(key);
            return result[key] ?? null;
        }
        catch (error) {
            console.error(`[TW Storage] Error getting ${key}:`, error);
            return null;
        }
    }
    /**
     * Set a value in storage
     */
    static async set(key, value) {
        try {
            await browser.storage.sync.set({ [key]: value });
            return true;
        }
        catch (error) {
            console.error(`[TW Storage] Error setting ${key}:`, error);
            return false;
        }
    }
    /**
     * Remove a key from storage
     */
    static async remove(key) {
        try {
            await browser.storage.sync.remove(key);
            return true;
        }
        catch (error) {
            console.error(`[TW Storage] Error removing ${key}:`, error);
            return false;
        }
    }
    /**
     * Clear all storage
     */
    static async clear() {
        try {
            await browser.storage.sync.clear();
            return true;
        }
        catch (error) {
            console.error('[TW Storage] Error clearing storage:', error);
            return false;
        }
    }
    /**
     * Get multiple values from storage
     */
    static async getMultiple(keys) {
        try {
            const result = await browser.storage.sync.get(keys);
            return result;
        }
        catch (error) {
            console.error('[TW Storage] Error getting multiple values:', error);
            return {};
        }
    }
    /**
     * Set multiple values in storage
     */
    static async setMultiple(values) {
        try {
            await browser.storage.sync.set(values);
            return true;
        }
        catch (error) {
            console.error('[TW Storage] Error setting multiple values:', error);
            return false;
        }
    }
    /**
     * Listen for changes to a specific key
     */
    static onChange(key, callback) {
        if (!this.changeListeners.has(key)) {
            this.changeListeners.set(key, new Set());
        }
        const listeners = this.changeListeners.get(key);
        listeners.add(callback);
        // Return unsubscribe function
        return () => {
            listeners.delete(callback);
            if (listeners.size === 0) {
                this.changeListeners.delete(key);
            }
        };
    }
    /**
     * Initialize storage change listener
     * Should be called once at startup
     */
    static initializeChangeListener() {
        browser.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'sync')
                return;
            for (const [key, change] of Object.entries(changes)) {
                const listeners = this.changeListeners.get(key);
                if (listeners) {
                    listeners.forEach((callback) => {
                        callback({
                            oldValue: change.oldValue,
                            newValue: change.newValue,
                        }, key);
                    });
                }
            }
        });
    }
    /**
     * Get storage usage information
     */
    static async getUsage() {
        try {
            const bytesInUse = await browser.storage.sync.getBytesInUse();
            // Chrome sync storage quota is 102,400 bytes
            const quota = 102400;
            return { bytesInUse, quota };
        }
        catch (error) {
            console.error('[TW Storage] Error getting usage:', error);
            return { bytesInUse: 0, quota: 102400 };
        }
    }
}
// Initialize change listener
StorageAdapter.initializeChangeListener();
//# sourceMappingURL=StorageAdapter.js.map