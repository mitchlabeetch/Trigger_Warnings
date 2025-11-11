/**
 * TEMPORAL PATTERN DETECTOR
 *
 * Detects escalation sequences and patterns across multiple subtitle cues
 * Example: "Can't take this" → "One way out" → "Goodbye" → [gunshot] = Suicide warning
 *
 * This addresses a major weakness in the v1 algorithm which analyzed
 * each cue independently and missed contextual build-ups.
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import type { Warning, TriggerCategory } from '@shared/types/Warning.types';
interface EscalationPattern {
    name: string;
    category: TriggerCategory;
    phases: string[][];
    minimumPhases: number;
    windowSize: number;
    baseConfidence: number;
    description: string;
}
interface PatternMatch {
    pattern: EscalationPattern;
    matchedPhases: number[];
    confidence: number;
    firstCueTime: number;
    lastCueTime: number;
}
export declare class TemporalPatternDetector {
    private recentCues;
    private detectedPatterns;
    private onPatternDetected;
    private patterns;
    /**
     * Add a new subtitle cue to the buffer
     */
    addCue(text: string, time: number): void;
    /**
     * Remove cues older than the maximum window size
     */
    private cleanOldCues;
    /**
     * Analyze recent cues for escalation patterns
     */
    private analyzePatterns;
    /**
     * Check if a pattern matches recent cues
     */
    private checkPattern;
    /**
     * Check if matched phases are in sequential order
     */
    private isSequential;
    /**
     * Create warning from pattern match
     */
    private createWarning;
    /**
     * Register callback for pattern detection
     */
    onDetection(callback: (warning: Warning) => void): void;
    /**
     * Get all detected patterns
     */
    getDetectedPatterns(): PatternMatch[];
    /**
     * Clear detected patterns
     */
    clear(): void;
    /**
     * Get statistics
     */
    getStats(): {
        totalPatterns: number;
        recentCuesCount: number;
        detectedPatternsCount: number;
    };
}
export {};
//# sourceMappingURL=TemporalPatternDetector.d.ts.map