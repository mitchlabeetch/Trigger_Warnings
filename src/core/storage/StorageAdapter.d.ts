/**
 * Storage adapter for browser extension storage
 * Provides a typed interface to chrome.storage.sync
 */
import type { StorageSchema, StorageKey, StorageChangeCallback } from '@shared/types/Storage.types';
export declare class StorageAdapter {
    private static changeListeners;
    /**
     * Get a value from storage
     */
    static get<K extends StorageKey>(key: K): Promise<StorageSchema[K] | null>;
    /**
     * Set a value in storage
     */
    static set<K extends StorageKey>(key: K, value: StorageSchema[K]): Promise<boolean>;
    /**
     * Remove a key from storage
     */
    static remove(key: StorageKey): Promise<boolean>;
    /**
     * Clear all storage
     */
    static clear(): Promise<boolean>;
    /**
     * Get multiple values from storage
     */
    static getMultiple<K extends StorageKey>(keys: K[]): Promise<Partial<StorageSchema>>;
    /**
     * Set multiple values in storage
     */
    static setMultiple(values: Partial<StorageSchema>): Promise<boolean>;
    /**
     * Listen for changes to a specific key
     */
    static onChange<K extends StorageKey>(key: K, callback: StorageChangeCallback<StorageSchema[K]>): () => void;
    /**
     * Initialize storage change listener
     * Should be called once at startup
     */
    static initializeChangeListener(): void;
    /**
     * Get storage usage information
     */
    static getUsage(): Promise<{
        bytesInUse: number;
        quota: number;
    }>;
}
//# sourceMappingURL=StorageAdapter.d.ts.map