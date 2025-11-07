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
export declare class SubtitleAnalyzer {
    private textTrack;
    private detectedTriggers;
    private keywordDictionary;
    private onTriggerDetected;
    constructor();
    /**
     * Build comprehensive trigger keyword dictionary
     * Maps to actual TriggerCategory types from the system
     */
    private buildKeywordDictionary;
    /**
     * Initialize subtitle tracking for a video element
     */
    initialize(video: HTMLVideoElement): void;
    /**
     * Attach listeners to subtitle cues
     */
    private attachListeners;
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
}
//# sourceMappingURL=SubtitleAnalyzer.d.ts.map