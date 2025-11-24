/**
 * i18n utilities for Chrome Extension
 *
 * Provides a Svelte-friendly wrapper around Chrome's i18n API with reactive stores
 */
import { type Readable } from 'svelte/store';
/**
 * Get a translated message from the extension's locale files
 *
 * @param key - The message key (e.g., 'extensionName')
 * @param substitutions - Optional substitution values for placeholders
 * @returns Translated string or the key if translation not found
 */
export declare function t(key: string, substitutions?: string | string[]): string;
/**
 * Get current UI language code (e.g., 'en', 'es', 'fr')
 */
export declare function getLocale(): string;
/**
 * Create a reactive Svelte store for a translation
 * Useful for reactive UI updates if locale changes
 *
 * @param key - The message key
 * @param substitutions - Optional substitution values
 * @returns Readable store containing the translated string
 */
export declare function createTranslationStore(key: string, substitutions?: string | string[]): Readable<string>;
/**
 * Svelte store containing the current locale
 */
export declare const locale: import("svelte/store").Writable<string>;
/**
 * Helper for translations that need dynamic substitutions
 * Returns a function that takes substitutions and returns the translated string
 *
 * @param key - The message key
 * @returns Function that accepts substitutions and returns translated string
 */
export declare function tFunc(key: string): (substitutions?: string | string[]) => string;
/**
 * Batch translate multiple keys at once
 *
 * @param keys - Array of message keys
 * @returns Object mapping keys to translated strings
 */
export declare function tBatch(keys: string[]): Record<string, string>;
/**
 * Check if a translation key exists
 *
 * @param key - The message key to check
 * @returns true if the key exists, false otherwise
 */
export declare function hasTranslation(key: string): boolean;
declare const _default: {
    t: typeof t;
    tFunc: typeof tFunc;
    tBatch: typeof tBatch;
    getLocale: typeof getLocale;
    locale: import("svelte/store").Writable<string>;
    hasTranslation: typeof hasTranslation;
    createTranslationStore: typeof createTranslationStore;
};
export default _default;
//# sourceMappingURL=index.d.ts.map