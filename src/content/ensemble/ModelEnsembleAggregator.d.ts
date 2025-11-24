/**
 * ALGORITHM 3.0 - PHASE 9: INNOVATION #31
 * Model Ensemble Aggregator
 *
 * Intelligently combines predictions from multiple models using learned weights,
 * voting strategies, and stacking to achieve superior accuracy.
 *
 * Research: Dietterich (2000) - Ensemble Methods in Machine Learning
 *           +12-18% accuracy improvement with ensembles
 *
 * Equal Treatment: All 28 categories benefit from same ensemble architecture
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Individual model prediction
 */
export interface ModelPrediction {
    modelName: string;
    category: TriggerCategory;
    confidence: number;
    features?: number[];
    metadata?: Record<string, any>;
}
/**
 * Ensemble aggregation result
 */
export interface EnsembleResult {
    category: TriggerCategory;
    ensembleConfidence: number;
    votingConfidence: number;
    stackingConfidence: number;
    boostingConfidence: number;
    modelAgreement: number;
    diversityScore: number;
    contributingModels: string[];
    modelWeights: Record<string, number>;
    aggregationStrategy: 'voting' | 'stacking' | 'boosting' | 'hybrid';
}
/**
 * Model performance metrics
 */
interface ModelPerformance {
    modelName: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    totalPredictions: number;
    correctPredictions: number;
}
/**
 * Ensemble statistics
 */
interface EnsembleStats {
    totalAggregations: number;
    avgEnsembleConfidence: number;
    avgModelAgreement: number;
    avgDiversityScore: number;
    votingUsed: number;
    stackingUsed: number;
    boostingUsed: number;
    hybridUsed: number;
    modelPerformance: Map<string, ModelPerformance>;
}
/**
 * Model Ensemble Aggregator
 *
 * Combines predictions from multiple models for superior accuracy
 */
export declare class ModelEnsembleAggregator {
    private modelWeights;
    private stackingWeights;
    private boostingWeights;
    private modelPerformance;
    private readonly VOTING_THRESHOLD;
    private readonly DIVERSITY_THRESHOLD;
    private readonly LEARNING_RATE;
    private stats;
    constructor();
    /**
     * Aggregate predictions from multiple models
     */
    aggregate(predictions: ModelPrediction[], category: TriggerCategory): EnsembleResult;
    /**
     * Weighted voting aggregation
     */
    private weightedVoting;
    /**
     * Stacking aggregation (meta-model on predictions)
     */
    private stacking;
    /**
     * Boosting aggregation (emphasize hard examples)
     */
    private boosting;
    /**
     * Select best aggregation strategy
     */
    private selectAggregationStrategy;
    /**
     * Compute final ensemble confidence
     */
    private computeFinalConfidence;
    /**
     * Compute how much models agree (0-1)
     */
    private computeModelAgreement;
    /**
     * Compute model diversity (higher = better for ensemble)
     */
    private computeDiversityScore;
    /**
     * Get model weight for category
     */
    private getModelWeight;
    /**
     * Get all model weights for category
     */
    private getModelWeightsForCategory;
    /**
     * Update model weight based on performance
     */
    updateModelWeight(modelName: string, category: TriggerCategory, correct: boolean): void;
    /**
     * Update boosting weight
     */
    updateBoostingWeight(modelName: string, handlesHardExamples: boolean): void;
    /**
     * Update model performance metrics
     */
    private updateModelPerformance;
    /**
     * Get model performance
     */
    getModelPerformance(modelName: string): ModelPerformance | undefined;
    /**
     * Get all model performances
     */
    getAllModelPerformances(): ModelPerformance[];
    /**
     * Single model result (no ensemble)
     */
    private singleModelResult;
    /**
     * Sigmoid activation
     */
    private sigmoid;
    /**
     * Initialize default weights
     */
    private initializeDefaultWeights;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Get statistics
     */
    getStats(): EnsembleStats;
    /**
     * Clear state
     */
    clear(): void;
}
export declare const modelEnsembleAggregator: ModelEnsembleAggregator;
export {};
//# sourceMappingURL=ModelEnsembleAggregator.d.ts.map