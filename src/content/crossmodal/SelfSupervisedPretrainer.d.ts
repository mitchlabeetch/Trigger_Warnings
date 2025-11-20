/**
 * ALGORITHM 3.0 - PHASE 8: INNOVATION #30
 * Self-Supervised Pre-training
 *
 * Learns from unlabeled content using masked reconstruction and contrastive predictive coding.
 * Pre-trains on large corpus of unlabeled data, then transfers to trigger detection.
 *
 * Research: Devlin et al. (2019) BERT - +15-20% accuracy with self-supervised pre-training
 *
 * Equal Treatment: All 28 categories benefit from same pre-training approach
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Unlabeled content sample
 */
export interface UnlabeledSample {
    visual?: number[];
    audio?: number[];
    text?: number[];
    timestamp?: number;
    source?: string;
}
/**
 * Pre-training result
 */
export interface PretrainingResult {
    reconstructionLoss: number;
    contrastiveLoss: number;
    totalLoss: number;
    reconstructionAccuracy: number;
    embeddingQuality: number;
}
/**
 * Transfer learning result
 */
export interface TransferLearningResult {
    transferredEmbedding: number[];
    confidence: number;
    pretrainingBenefit: number;
    domainAdaptation: number;
}
/**
 * Pre-training statistics
 */
interface PretrainingStats {
    totalSamples: number;
    totalEpochs: number;
    avgReconstructionLoss: number;
    avgContrastiveLoss: number;
    avgReconstructionAccuracy: number;
    embeddingNorm: number;
    pretrainingTime: number;
    transferCount: number;
}
/**
 * Self-Supervised Pretrainer
 *
 * Learns rich representations from unlabeled data, then transfers to trigger detection
 */
export declare class SelfSupervisedPretrainer {
    private readonly MASK_RATIO;
    private readonly EMBEDDING_DIM;
    private readonly LEARNING_RATE;
    private readonly TEMPERATURE;
    private visualEncoder;
    private audioEncoder;
    private textEncoder;
    private visualDecoder;
    private audioDecoder;
    private textDecoder;
    private pretrainedEmbeddings;
    private stats;
    constructor();
    /**
     * Pre-train on unlabeled sample
     */
    pretrain(sample: UnlabeledSample): PretrainingResult;
    /**
     * Pre-train on batch of samples (more efficient)
     */
    pretrainBatch(samples: UnlabeledSample[]): PretrainingResult;
    /**
     * Transfer pre-trained knowledge to trigger detection
     */
    transfer(sample: UnlabeledSample, category: TriggerCategory): TransferLearningResult;
    /**
     * Mask portions of sample for reconstruction
     */
    private maskSample;
    /**
     * Mask single modality
     */
    private maskModality;
    /**
     * Encode masked input to embeddings
     */
    private encodeToEmbeddings;
    /**
     * Encode using learned encoder
     */
    private encode;
    /**
     * Reconstruct original from embeddings
     */
    private reconstructFromEmbeddings;
    /**
     * Decode using learned decoder
     */
    private decode;
    /**
     * Compute reconstruction loss (MSE on masked positions)
     */
    private computeReconstructionLoss;
    /**
     * Compute MSE only on masked positions
     */
    private computeMaskedMSE;
    /**
     * Compute contrastive loss (embeddings cluster by similarity)
     */
    private computeContrastiveLoss;
    /**
     * Compute reconstruction accuracy (% correctly reconstructed)
     */
    private computeReconstructionAccuracy;
    /**
     * Compute accuracy on masked positions
     */
    private computeMaskedAccuracy;
    /**
     * Compute embedding quality (norm, variance)
     */
    private computeEmbeddingQuality;
    /**
     * Combine embeddings for transfer learning
     */
    private combineEmbeddings;
    /**
     * Compute transfer confidence
     */
    private computeTransferConfidence;
    /**
     * Measure pre-training benefit
     */
    private measurePretrainingBenefit;
    /**
     * Measure domain adaptation
     */
    private measureDomainAdaptation;
    /**
     * Store pre-trained embedding
     */
    private storePretrainedEmbedding;
    /**
     * Hash sample for storage
     */
    private hashSample;
    /**
     * Update encoder/decoder networks
     */
    private updateNetworks;
    /**
     * Update single matrix
     */
    private updateMatrix;
    /**
     * Cosine similarity
     */
    private cosineSimilarity;
    /**
     * L2 normalization
     */
    private normalize;
    /**
     * Shuffle array in-place
     */
    private shuffleArray;
    /**
     * Random matrix initialization
     */
    private randomMatrix;
    /**
     * Initialize encoder/decoder networks
     */
    private initializeNetworks;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Get statistics
     */
    getStats(): PretrainingStats;
    /**
     * Clear state
     */
    clear(): void;
}
export declare const selfSupervisedPretrainer: SelfSupervisedPretrainer;
export {};
//# sourceMappingURL=SelfSupervisedPretrainer.d.ts.map