/**
 * ALGORITHM 3.0 - PHASE 9: INNOVATION #32
 * Meta-Learner (MAML-inspired)
 *
 * Model-Agnostic Meta-Learning for rapid adaptation to new trigger patterns
 * with just 1-5 examples. Learns optimal initialization parameters that enable
 * fast fine-tuning to novel categories.
 *
 * Research: Finn et al. (2017) - Model-Agnostic Meta-Learning for Fast Adaptation
 *           +15-20% accuracy on novel patterns with few examples
 *
 * Equal Treatment: All 28 categories benefit from same meta-learning approach
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Support example (for meta-learning)
 */
export interface SupportExample {
    features: number[];
    category: TriggerCategory;
    label: boolean;
}
/**
 * Task for meta-learning (few-shot learning task)
 */
export interface MetaTask {
    category: TriggerCategory;
    supportSet: SupportExample[];
    querySet: SupportExample[];
}
/**
 * Meta-learning result
 */
export interface MetaLearningResult {
    category: TriggerCategory;
    adaptedConfidence: number;
    preAdaptationConfidence: number;
    adaptationGain: number;
    numGradientSteps: number;
    finalLoss: number;
    converged: boolean;
}
/**
 * Model parameters (simplified - weight matrices)
 */
interface ModelParameters {
    weights: number[][];
    bias: number[];
}
/**
 * Meta-learner statistics
 */
interface MetaLearnerStats {
    totalAdaptations: number;
    totalMetaTasks: number;
    avgAdaptationGain: number;
    avgGradientSteps: number;
    avgFinalLoss: number;
    convergenceRate: number;
    fewShotAccuracy: Map<number, number>;
}
/**
 * Meta-Learner
 *
 * Learns optimal initialization for rapid adaptation to new patterns
 */
export declare class MetaLearner {
    private metaParameters;
    private adaptedParameters;
    private readonly INNER_LR;
    private readonly OUTER_LR;
    private readonly MAX_INNER_STEPS;
    private readonly CONVERGENCE_THRESHOLD;
    private readonly INPUT_DIM;
    private readonly HIDDEN_DIM;
    private readonly OUTPUT_DIM;
    private stats;
    constructor();
    /**
     * Adapt to new task using support set (1-5 shot learning)
     */
    adapt(task: MetaTask): MetaLearningResult;
    /**
     * Meta-train on multiple tasks (outer loop)
     */
    metaTrain(tasks: MetaTask[]): void;
    /**
     * Inner loop adaptation (for meta-training)
     */
    private innerLoop;
    /**
     * Predict using parameters
     */
    predict(features: number[], params: ModelParameters): number;
    /**
     * Predict with adapted parameters (if available)
     */
    predictAdapted(features: number[], category: TriggerCategory): number;
    /**
     * Forward pass
     */
    private forward;
    /**
     * Compute loss on examples
     */
    private computeLoss;
    /**
     * Compute gradients (simplified - numerical gradients)
     */
    private computeGradients;
    /**
     * Compute meta-gradient (gradient of query loss w.r.t. meta-params)
     */
    private computeMetaGradient;
    /**
     * Update parameters using gradients
     */
    private updateParameters;
    /**
     * Average gradients across tasks
     */
    private averageGradients;
    /**
     * Initialize parameters with Xavier initialization
     */
    private initializeParameters;
    /**
     * Clone parameters
     */
    private cloneParameters;
    /**
     * Sigmoid activation
     */
    private sigmoid;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Get statistics
     */
    getStats(): MetaLearnerStats;
    /**
     * Clear state
     */
    clear(): void;
}
export declare const metaLearner: MetaLearner;
export {};
//# sourceMappingURL=MetaLearner.d.ts.map