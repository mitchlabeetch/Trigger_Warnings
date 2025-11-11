/**
 * CONFIDENCE FUSION SYSTEM
 *
 * Combines multiple detection signals using Bayesian probability and correlation analysis
 * This is the "brain" that makes intelligent decisions based on all available evidence
 *
 * Features:
 * - Bayesian probability combination
 * - Multi-signal correlation bonuses
 * - Temporal consistency checking
 * - False positive filtering
 * - Confidence boosting for correlated detections
 *
 * Example:
 * - Subtitle says "[gunshot]" (85% confidence)
 * - Audio detects gunshot sound (90% confidence)
 * - Visual shows muzzle flash (red spike) (75% confidence)
 * → Fused confidence: 98% (all three signals agree!)
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import type { Warning, TriggerCategory } from '@shared/types/Warning.types';
interface Detection {
    source: 'subtitle' | 'audio-waveform' | 'audio-frequency' | 'visual' | 'photosensitivity' | 'temporal-pattern' | 'database';
    category: TriggerCategory;
    timestamp: number;
    confidence: number;
    warning: Warning;
}
export declare class ConfidenceFusionSystem {
    private recentDetections;
    private fusedWarnings;
    private readonly DETECTION_WINDOW;
    private readonly MIN_CONFIDENCE_THRESHOLD;
    private readonly OUTPUT_THRESHOLD;
    private stats;
    /**
     * Add a detection from any source
     */
    addDetection(detection: Detection): void;
    /**
     * Remove detections older than window
     */
    private cleanOldDetections;
    /**
     * Attempt to fuse new detection with recent ones
     */
    private attemptFusion;
    /**
     * Apply multi-modal validation for single detections
     *
     * ADDRESSES CONCERN: "How does it make sure it's SHOWN and not just TALKING about it??"
     *
     * Visual triggers (blood, gore, vomit, etc.) should require BOTH:
     * - Subtitle/audio detection AND visual confirmation
     * OR have significantly reduced confidence if only one modality detects
     */
    private applyMultiModalValidation;
    /**
     * Find detections related to the new one
     */
    private findRelatedDetections;
    /**
     * Calculate fused confidence using Bayesian probability
     */
    private calculateFusedConfidence;
    /**
     * Get prior probability for category (base rate)
     */
    private getPriorProbability;
    /**
     * Calculate correlation bonus for multiple sources
     */
    private calculateCorrelationBonus;
    /**
     * Calculate temporal consistency (are detections happening in logical sequence?)
     */
    private calculateTemporalConsistency;
    /**
     * Check if detection is likely a false positive
     */
    private isFalsePositive;
    /**
     * Output fused warning
     */
    private outputFusedWarning;
    /**
     * Get fused warnings
     */
    getFusedWarnings(): Warning[];
    /**
     * Get statistics
     */
    getStats(): typeof this.stats;
    /**
     * Clear state
     */
    clear(): void;
    /**
     * Register callback for fused warnings
     */
    onFusedWarning(callback: (warning: Warning) => void): void;
}
export {};
//# sourceMappingURL=ConfidenceFusionSystem.d.ts.map