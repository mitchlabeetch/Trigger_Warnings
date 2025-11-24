import { Logger } from '@shared/utils/logger';

const logger = new Logger('SubtitleTranslator');

interface TranslationResponse {
  responseData: {
    translatedText: string;
    match: number; // 0-1 confidence score
  };
  responseStatus: number;
  responseDetails: string;
}

interface CachedTranslation {
  text: string;
  timestamp: number;
  confidence: number;
}

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
export class SubtitleTranslator {
  private translationCache: Map<string, CachedTranslation> = new Map();
  private requestsToday: number = 0;
  private dailyLimit: number = 9000; // Stay safely under 10k
  private lastResetDate: string = '';
  private apiEndpoint: string = 'https://api.mymemory.translated.net/get';

  // Suspicious patterns that might contain triggers (reduce API calls by 90%)
  private suspiciousPatterns: RegExp[] = [
    // Violence & Death keywords (similar across languages)
    /suicid/i,
    /murder/i,
    /kill/i,
    /death/i,
    /dead/i,
    /die/i,
    /violen/i,
    /blood/i,
    /shoot/i,
    /stab/i,
    /rape/i,
    /assault/i,
    /abuse/i,
    /torture/i,

    // Subtitle descriptors (usually in English/brackets)
    /\[.*\]/,
    /\(.*scream.*\)/i,
    /\(.*gun.*\)/i,
    /\(.*explo.*\)/i,

    // Emotional indicators
    /[A-Z]{5,}/, // Excessive caps (SCREAMING)
    /!{2,}/, // Multiple exclamation marks
    /\.\.\./,  // Ellipsis (tension)
  ];

  constructor() {
    this.loadCacheFromStorage();
    this.checkDailyReset();
  }

  /**
   * Check if we need to reset the daily request counter
   */
  private checkDailyReset(): void {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (this.lastResetDate !== today) {
      this.requestsToday = 0;
      this.lastResetDate = today;
      this.saveDailyCount();
      logger.info('Daily translation counter reset');
    }
  }

  /**
   * Load translation cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem('tw_translation_cache');
      const dailyCount = localStorage.getItem('tw_translation_daily_count');
      const lastReset = localStorage.getItem('tw_translation_last_reset');

      if (cached) {
        const parsed = JSON.parse(cached);
        this.translationCache = new Map(Object.entries(parsed));
        logger.debug(`Loaded ${this.translationCache.size} cached translations`);
      }

      if (dailyCount) {
        this.requestsToday = parseInt(dailyCount, 10) || 0;
      }

      if (lastReset) {
        this.lastResetDate = lastReset;
      }
    } catch (error) {
      logger.error('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save translation cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const cacheObj = Object.fromEntries(this.translationCache);
      localStorage.setItem('tw_translation_cache', JSON.stringify(cacheObj));
    } catch (error) {
      logger.error('Failed to save cache to storage:', error);
    }
  }

  /**
   * Save daily request count to localStorage
   */
  private saveDailyCount(): void {
    try {
      localStorage.setItem('tw_translation_daily_count', this.requestsToday.toString());
      localStorage.setItem('tw_translation_last_reset', this.lastResetDate);
    } catch (error) {
      logger.error('Failed to save daily count:', error);
    }
  }

  /**
   * Check if text contains suspicious patterns that might indicate triggers
   */
  private hasSuspiciousPattern(text: string): boolean {
    return this.suspiciousPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Translate text from source language to English
   *
   * @param text - Text to translate
   * @param sourceLang - Source language code (e.g., 'es', 'fr', 'ja')
   * @returns Translated text or original if translation fails
   */
  async translateText(text: string, sourceLang: string): Promise<string> {
    // Normalize source language (remove region codes)
    const normalizedLang = sourceLang.toLowerCase().split('-')[0];

    // Skip translation if already English
    if (normalizedLang === 'en') {
      return text;
    }

    // Check cache first
    const cacheKey = `${normalizedLang}:${text}`;
    if (this.translationCache.has(cacheKey)) {
      const cached = this.translationCache.get(cacheKey)!;

      // Cache valid for 7 days
      const cacheAge = Date.now() - cached.timestamp;
      if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
        logger.debug('Using cached translation');
        return cached.text;
      }
    }

    // Check daily rate limit
    this.checkDailyReset();

    if (this.requestsToday >= this.dailyLimit) {
      logger.warn(`Translation rate limit reached (${this.requestsToday}/${this.dailyLimit})`);
      return text; // Graceful degradation
    }

    // Phase 1: Only translate suspicious text (reduces API calls by ~90%)
    if (!this.hasSuspiciousPattern(text)) {
      logger.debug('Text has no suspicious patterns, skipping translation');
      return text;
    }

    // Phase 2: Translate suspicious text
    try {
      const url = `${this.apiEndpoint}?q=${encodeURIComponent(text)}&langpair=${normalizedLang}|en`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: TranslationResponse = await response.json();

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText;
        const confidence = data.responseData.match || 0;

        // Cache the translation
        this.translationCache.set(cacheKey, {
          text: translated,
          timestamp: Date.now(),
          confidence,
        });

        this.requestsToday++;
        this.saveCacheToStorage();
        this.saveDailyCount();

        logger.debug(
          `Translated (${normalizedLang}→en): "${text.substring(0, 30)}..." → "${translated.substring(0, 30)}..." (confidence: ${confidence})`
        );

        return translated;
      } else {
        logger.warn('Translation API returned error:', data.responseDetails);
        return text;
      }
    } catch (error) {
      logger.error('Translation failed:', error);
      return text; // Fallback to original text
    }
  }

  /**
   * Prefetch translations for upcoming subtitle cues
   *
   * @param cues - Array of upcoming VTT cues
   * @param sourceLang - Source language code
   * @param prefetchWindow - How far ahead to prefetch (seconds)
   */
  async prefetchTranslations(
    cues: VTTCue[],
    sourceLang: string,
    currentTime: number,
    prefetchWindow: number = 30
  ): Promise<void> {
    // Get upcoming cues in prefetch window
    const upcomingCues = cues.filter(
      (cue) =>
        cue.startTime >= currentTime && cue.startTime <= currentTime + prefetchWindow
    );

    if (upcomingCues.length === 0) {
      return;
    }

    logger.debug(`Prefetching ${upcomingCues.length} upcoming subtitle translations`);

    // Prefetch in parallel (don't await individually)
    const translations = upcomingCues.map((cue) =>
      this.translateText(cue.text, sourceLang).catch((error) => {
        logger.error('Prefetch failed for cue:', error);
        return cue.text; // Fallback
      })
    );

    await Promise.all(translations);
  }

  /**
   * Clear all cached translations
   */
  clearCache(): void {
    this.translationCache.clear();
    this.saveCacheToStorage();
    logger.info('Translation cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cacheSize: number;
    requestsToday: number;
    dailyLimit: number;
    remainingRequests: number;
  } {
    return {
      cacheSize: this.translationCache.size,
      requestsToday: this.requestsToday,
      dailyLimit: this.dailyLimit,
      remainingRequests: this.dailyLimit - this.requestsToday,
    };
  }
}
