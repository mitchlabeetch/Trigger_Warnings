/**
 * ALGORITHM 3.0 - PHASE 8: INNOVATION #28
 * Modal Fusion Transformers
 *
 * Deep transformer-based fusion of visual, audio, and text modalities.
 * Uses multi-head self-attention for rich cross-modal understanding.
 *
 * Research: Tsai et al. (2019) - +20-25% accuracy with transformer fusion
 *
 * Equal Treatment: All 28 categories benefit from same transformer architecture
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Multi-modal input for transformer
 */
export interface TransformerInput {
    visual?: number[];
    audio?: number[];
    text?: number[];
    category?: TriggerCategory;
}
/**
 * Transformer fusion result
 */
export interface TransformerFusionResult {
    category: TriggerCategory;
    fusedEmbedding: number[];
    confidence: number;
    attentionMap: number[][];
    layerOutputs: number[][];
}
/**
 * Transformer configuration
 */
interface TransformerConfig {
    numLayers: number;
    numHeads: number;
    hiddenDim: number;
    ffnDim: number;
    dropoutRate: number;
}
/**
 * Transformer statistics
 */
interface TransformerStats {
    totalFusions: number;
    avgConfidence: number;
    avgAttentionEntropy: number;
    layerActivations: number[];
}
/**
 * Modal Fusion Transformer
 *
 * Deep multi-layer transformer for rich cross-modal understanding
 */
export declare class ModalFusionTransformer {
    private config;
    private layerWeights;
    private attentionWeights;
    private stats;
    constructor(config?: Partial<TransformerConfig>);
    /**
     * Fuse modalities using transformer
     */
    fuse(input: TransformerInput, category: TriggerCategory): TransformerFusionResult;
    /**
     * Single transformer layer
     */
    private transformerLayer;
    /**
     * Multi-head self-attention
     */
    private multiHeadAttention;
    /**
     * Single-head attention
     */
    private singleHeadAttention;
    /**
     * Feed-forward network
     */
    private feedForward;
    /**
     * Add and normalize (residual connection + layer norm)
     */
    private addAndNorm;
    /**
     * Concatenate modalities into single sequence
     */
    private concatenateModalities;
    /**
     * Add positional encoding
     */
    private addPositionalEncoding;
    /**
     * Pool output to fixed-size embedding
     */
    private poolOutput;
    /**
     * Compute confidence from fused embedding
     */
    private computeConfidence;
    /**
     * Average attention maps across heads
     */
    private averageAttention;
    /**
     * Aggregate attention across layers
     */
    private aggregateAttention;
    /**
     * Compute attention entropy (diversity measure)
     */
    private computeAttentionEntropy;
    /**
     * Softmax over 2D matrix
     */
    private softmax2D;
    /**
     * Random matrix initialization
     */
    private randomMatrix;
    /**
     * Initialize transformer parameters
     */
    private initializeParameters;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Get statistics
     */
    getStats(): TransformerStats;
    /**
     * Clear state
     */
    clear(): void;
}
export declare const modalFusionTransformer: ModalFusionTransformer;
export {};
//# sourceMappingURL=ModalFusionTransformer.d.ts.map