/**
 * ALGORITHM 3.0 - PHASE 8: INNOVATION #29
 * Contrastive Learning
 *
 * Aligns visual, audio, and text embeddings in a shared space.
 * Similar content (e.g., blood visual + "blood" text) should have similar embeddings.
 *
 * Research: Chen et al. (2020) SimCLR - +10-15% accuracy with contrastive learning
 *
 * Equal Treatment: All 28 categories benefit from aligned embedding space
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Multi-modal embeddings for contrastive learning
 */
export interface ContrastiveEmbeddings {
    visual?: number[];
    audio?: number[];
    text?: number[];
    category: TriggerCategory;
    label: boolean;
}
/**
 * Contrastive learning result
 */
export interface ContrastiveResult {
    alignedEmbedding: number[];
    similarityScores: {
        visualAudio: number;
        visualText: number;
        audioText: number;
    };
    isAligned: boolean;
    contrastiveLoss: number;
}
/**
 * Contrastive learning statistics
 */
interface ContrastiveStats {
    totalSamples: number;
    positivePairs: number;
    negativePairs: number;
    avgContrastiveLoss: number;
    avgSimilarityPositive: number;
    avgSimilarityNegative: number;
    embeddingNorm: number;
}
/**
 * Contrastive Learner
 *
 * Learns to align embeddings from different modalities in a shared space
 */
export declare class ContrastiveLearner {
    private visualProjection;
    private audioProjection;
    private textProjection;
    private readonly EMBEDDING_DIM;
    private readonly TEMPERATURE;
    private readonly MARGIN;
    private readonly LEARNING_RATE;
    private stats;
    constructor();
    /**
     * Align embeddings using contrastive learning
     */
    align(embeddings: ContrastiveEmbeddings): ContrastiveResult;
    /**
     * Learn from positive/negative pairs
     */
    learnFromPair(anchor: ContrastiveEmbeddings, positive: ContrastiveEmbeddings, negative: ContrastiveEmbeddings): number;
    /**
     * Project modality-specific embeddings to shared space
     */
    private projectToSharedSpace;
    /**
     * Project embedding using learned matrix
     */
    private project;
    /**
     * Compute pairwise similarities
     */
    private computeSimilarities;
    /**
     * Cosine similarity
     */
    private cosineSimilarity;
    /**
     * Euclidean distance
     */
    private computeDistance;
    /**
     * Compute contrastive loss (InfoNCE)
     */
    private computeContrastiveLoss;
    /**
     * Check if embeddings are well-aligned
     */
    private checkAlignment;
    /**
     * Update projection matrices (simplified gradient descent)
     */
    private updateProjections;
    /**
     * Update single projection matrix
     */
    private updateProjectionMatrix;
    /**
     * Average embeddings
     */
    private averageEmbeddings;
    /**
     * L2 normalization
     */
    private normalize;
    /**
     * Initialize projection matrices
     */
    private initializeProjections;
    /**
     * Random matrix with Xavier initialization
     */
    private randomMatrix;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Get statistics
     */
    getStats(): ContrastiveStats;
    /**
     * Clear state
     */
    clear(): void;
}
export declare const contrastiveLearner: ContrastiveLearner;
export {};
//# sourceMappingURL=ContrastiveLearner.d.ts.map