/**
 * ALGORITHM 3.0 - PHASE 8: INNOVATION #27
 * Cross-Modal Attention
 *
 * Learns correlations between visual and audio modalities.
 * Example: Visual (red splatter) + Audio (impact sound) = high confidence blood
 *
 * Research: Baltrusaitis et al. (2019) - +15-20% accuracy with cross-modal attention
 *
 * Equal Treatment: All 28 categories benefit from cross-modal correlation learning
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Multi-modal features for attention
 */
export interface ModalFeatures {
    visual?: number[];
    audio?: number[];
    text?: number[];
}
/**
 * Cross-modal attention weights
 */
export interface AttentionWeights {
    visualToAudio: number[][];
    audioToVisual: number[][];
    visualToText: number[][];
    textToVisual: number[][];
    audioToText: number[][];
    textToAudio: number[][];
}
/**
 * Cross-modal attention result
 */
export interface CrossModalResult {
    category: TriggerCategory;
    fusedFeatures: number[];
    attentionWeights: AttentionWeights;
    crossModalBoost: number;
    dominantCorrelation: string;
    correlationScore: number;
    dominantPair: string[];
}
/**
 * Learned correlation patterns
 */
interface CorrelationPattern {
    category: TriggerCategory;
    modalities: [string, string];
    strength: number;
    examples: number;
}
/**
 * Cross-modal attention statistics
 */
interface AttentionStats {
    totalAttentions: number;
    avgCrossModalBoost: number;
    avgCorrelationScore: number;
    strongestCorrelations: CorrelationPattern[];
    weakestCorrelations: CorrelationPattern[];
    modalityPairCounts: Record<string, number>;
}
/**
 * Cross-Modal Attention Mechanism
 *
 * Learns which combinations of visual, audio, and text features
 * are most indicative of each trigger category
 */
export declare class CrossModalAttention {
    private attentionWeights;
    private correlationPatterns;
    private readonly VISUAL_DIM;
    private readonly AUDIO_DIM;
    private readonly TEXT_DIM;
    private readonly FUSED_DIM;
    private readonly LEARNING_RATE;
    private readonly CORRELATION_THRESHOLD;
    private stats;
    private readonly CATEGORIES;
    constructor();
    /**
     * Compute cross-modal attention for detection
     */
    computeAttention(category: TriggerCategory, features: ModalFeatures): CrossModalResult;
    /**
     * Compute attention for all modality pairs
     */
    private computePairwiseAttention;
    /**
     * Apply attention from query to key
     */
    private applyAttention;
    /**
     * Compute alignment score (how well modalities agree)
     */
    private computeAlignmentScore;
    /**
     * Find strongest modality correlation
     */
    private findStrongestCorrelation;
    /**
     * Compute cross-modal boost based on correlation
     */
    private computeCrossModalBoost;
    /**
     * Fuse features with cross-modal attention
     */
    private fuseWithAttention;
    /**
     * Update attention weights based on feedback
     */
    updateWeights(category: TriggerCategory, features: ModalFeatures, correct: boolean): void;
    /**
     * Update weight matrix with gradient
     */
    private updateWeightMatrix;
    /**
     * Learn correlation pattern from examples
     */
    learnCorrelation(category: TriggerCategory, modalities: [string, string], strength: number): void;
    /**
     * Initialize attention weights for all categories
     */
    private initializeWeights;
    /**
     * Get default attention weights (random initialization)
     */
    private getDefaultWeights;
    /**
     * Create random weight matrix
     */
    private randomMatrix;
    /**
     * Load known correlation patterns (domain knowledge)
     */
    private loadKnownCorrelations;
    /**
     * Get available modalities from features
     */
    private getAvailableModalities;
    /**
     * Get result for single modality (no cross-modal attention)
     */
    private getSingleModalityResult;
    /**
     * Average two feature vectors
     */
    private average;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Update correlation statistics
     */
    private updateCorrelationStats;
    /**
     * Get statistics
     */
    getStats(): AttentionStats;
    /**
     * Clear all state
     */
    clear(): void;
}
export declare const crossModalAttention: CrossModalAttention;
export {};
//# sourceMappingURL=CrossModalAttention.d.ts.map