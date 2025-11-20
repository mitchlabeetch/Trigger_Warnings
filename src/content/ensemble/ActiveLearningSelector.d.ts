/**
 * ALGORITHM 3.0 - PHASE 9: INNOVATION #34
 * Active Learning Selector
 *
 * Intelligently selects the most informative samples for user feedback
 * to maximize learning efficiency. Uses uncertainty sampling, query-by-committee,
 * and diversity-based selection.
 *
 * Research: Settles (2009) - Active Learning Literature Survey
 *           50% fewer labels needed for same accuracy
 *
 * Equal Treatment: All 28 categories benefit from same active learning strategy
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Sample to potentially query
 */
export interface QueryCandidate {
    id: string;
    features: number[];
    category: TriggerCategory;
    confidence: number;
    uncertainty?: number;
    timestamp?: number;
    metadata?: Record<string, any>;
}
/**
 * Query selection result
 */
export interface QuerySelection {
    candidate: QueryCandidate;
    score: number;
    strategy: 'uncertainty' | 'committee' | 'expected-change' | 'diversity';
    reason: string;
    priority: 'high' | 'medium' | 'low';
}
/**
 * Committee prediction (for query-by-committee)
 */
interface CommitteePrediction {
    modelName: string;
    prediction: number;
}
/**
 * Active learning statistics
 */
interface ActiveLearningStats {
    totalQueries: number;
    uncertaintyQueries: number;
    committeeQueries: number;
    expectedChangeQueries: number;
    diversityQueries: number;
    avgInformativenessScore: number;
    labelEfficiency: number;
    diversityCoverage: number;
}
/**
 * Active Learning Selector
 *
 * Selects most informative samples for labeling
 */
export declare class ActiveLearningSelector {
    private readonly UNCERTAINTY_THRESHOLD;
    private readonly COMMITTEE_DISAGREEMENT_MIN;
    private readonly DIVERSITY_RADIUS;
    private queriedSamples;
    private queriedFeatures;
    private stats;
    constructor();
    /**
     * Select best candidates to query for labels
     */
    selectQueries(candidates: QueryCandidate[], maxQueries?: number): QuerySelection[];
    /**
     * Uncertainty sampling - select samples with highest uncertainty
     */
    private uncertaintySampling;
    /**
     * Query-by-committee - select samples where models disagree
     */
    queryByCommittee(candidate: QueryCandidate, committeePredictions: CommitteePrediction[]): number;
    /**
     * Expected model change - select samples that would change model most
     */
    expectedModelChange(candidate: QueryCandidate): number;
    /**
     * Diversity sampling - select samples from unexplored feature space
     */
    private diversitySampling;
    /**
     * Generate reason for selection
     */
    private generateReason;
    /**
     * Estimate uncertainty from confidence
     */
    private estimateUncertainty;
    /**
     * Euclidean distance between feature vectors
     */
    private euclideanDistance;
    /**
     * Update diversity coverage
     */
    private updateDiversityCoverage;
    /**
     * Update learning efficiency after receiving label
     */
    updateLabelEfficiency(selection: QuerySelection, accuracyGain: number): void;
    /**
     * Reset query for re-evaluation
     */
    resetQuery(candidateId: string): void;
    /**
     * Select batch of diverse queries
     */
    selectDiverseBatch(candidates: QueryCandidate[], batchSize: number): QuerySelection[];
    /**
     * Get statistics
     */
    getStats(): ActiveLearningStats;
    /**
     * Clear state
     */
    clear(): void;
}
export declare const activeLearningSelector: ActiveLearningSelector;
export {};
//# sourceMappingURL=ActiveLearningSelector.d.ts.map