/**
 * Subtitle Analyzer
 *
 * Analyzes video subtitles in real-time to detect trigger warnings
 * even for content not in the database.
 *
 * Works with:
 * - .vtt (WebVTT) - Most common on streaming platforms
 * - .srt (SubRip) - Standard subtitle format
 * - Native browser subtitle tracks
 */
import type { Warning } from '@shared/types/Warning.types';
import { SubtitleTranslator } from './SubtitleTranslator';
export declare class SubtitleAnalyzer {
    private textTrack;
    private detectedTriggers;
    private keywordDictionary;
    private onTriggerDetected;
    private translator;
    private needsTranslation;
    private sourceLanguage;
    private video;
    private prefetchInterval;
    constructor();
    /**
     * Build comprehensive trigger keyword dictionary
     * Maps to actual TriggerCategory types from the system
     */
    private buildKeywordDictionary;
    /**
     * Initialize subtitle tracking for a video element
     *
     * CRITICAL: Analyzer runs INDEPENDENTLY from user's subtitle choice
     *
     * Track Selection Strategy:
     * 1. ALWAYS prefer English track for analyzer (runs in 'hidden' mode)
     * 2. If no English track → Use first available language + translation
     * 3. User can show/hide any subtitles they want without affecting analyzer
     *
     * Examples:
     * - User shows Spanish subtitles → Analyzer uses English track (hidden)
     * - User shows no subtitles → Analyzer uses English track (hidden)
     * - Only Spanish available → Analyzer uses Spanish + translates to English
     */
    initialize(video: HTMLVideoElement): void;
    /**
     * Attach listeners to subtitle cues
     */
    private attachListeners;
    /**
     * Start prefetching translations ahead of playback
     */
    private startPrefetching;
    /**
     * Analyze current subtitle cues for trigger keywords
     */
    private analyzeCues;
    /**
     * Analyze text for trigger keywords
     */
    private analyzeText;
    /**
     * Register callback for when triggers are detected
     */
    onDetection(callback: (warning: Warning) => void): void;
    /**
     * Get all detected triggers
     */
    getDetectedTriggers(): Warning[];
    /**
     * Clear detected triggers
     */
    clear(): void;
    /**
     * Dispose of analyzer
     */
    dispose(): void;
    /**
     * Get translation statistics
     */
    getTranslationStats(): {
        enabled: boolean;
        language: string;
        cacheStats: ReturnType<SubtitleTranslator['getCacheStats']>;
    };
}
//# sourceMappingURL=SubtitleAnalyzer.d.ts.map