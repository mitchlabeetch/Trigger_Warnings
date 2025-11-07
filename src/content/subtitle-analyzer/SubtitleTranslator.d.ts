/**
 * Subtitle translator using MyMemory free translation API
 *
 * Features:
 * - Free tier: 10,000 words/day (no API key required)
 * - 200+ languages supported
 * - Smart caching with localStorage persistence
 * - Rate limiting with graceful degradation
 * - Prefetching for zero-latency translation
 */
export declare class SubtitleTranslator {
    private translationCache;
    private requestsToday;
    private dailyLimit;
    private lastResetDate;
    private apiEndpoint;
    private suspiciousPatterns;
    constructor();
    /**
     * Check if we need to reset the daily request counter
     */
    private checkDailyReset;
    /**
     * Load translation cache from localStorage
     */
    private loadCacheFromStorage;
    /**
     * Save translation cache to localStorage
     */
    private saveCacheToStorage;
    /**
     * Save daily request count to localStorage
     */
    private saveDailyCount;
    /**
     * Check if text contains suspicious patterns that might indicate triggers
     */
    private hasSuspiciousPattern;
    /**
     * Translate text from source language to English
     *
     * @param text - Text to translate
     * @param sourceLang - Source language code (e.g., 'es', 'fr', 'ja')
     * @returns Translated text or original if translation fails
     */
    translateText(text: string, sourceLang: string): Promise<string>;
    /**
     * Prefetch translations for upcoming subtitle cues
     *
     * @param cues - Array of upcoming VTT cues
     * @param sourceLang - Source language code
     * @param prefetchWindow - How far ahead to prefetch (seconds)
     */
    prefetchTranslations(cues: VTTCue[], sourceLang: string, currentTime: number, prefetchWindow?: number): Promise<void>;
    /**
     * Clear all cached translations
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        cacheSize: number;
        requestsToday: number;
        dailyLimit: number;
        remainingRequests: number;
    };
}
//# sourceMappingURL=SubtitleTranslator.d.ts.map