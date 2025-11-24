/**
 * ALGORITHM 3.0 - PHASE 7: INNOVATION #25
 * Progressive Learning State Manager
 *
 * Persists all learning state to IndexedDB:
 * - Adaptive thresholds (Phase 4)
 * - Multi-task learning weights (Phase 5)
 * - Few-shot examples (Phase 5)
 * - User feedback history
 *
 * Enables progressive learning across sessions and weeks/months.
 *
 * Equal Treatment: All 28 categories' learning state preserved equally
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Adaptive threshold data (Phase 4)
 */
export interface ThresholdData {
    category: TriggerCategory;
    threshold: number;
    defaultThreshold: number;
    adjustmentCount: number;
    lastAdjusted: number;
    confidenceHistory: number[];
    userFeedbackCount: number;
}
/**
 * Multi-task learning weights (Phase 5)
 */
export interface MultiTaskWeights {
    sharedEncoders: Record<string, number[]>;
    taskHeads: Record<TriggerCategory, number[]>;
    knowledgeTransferMatrix: number[][];
    lastUpdated: number;
    trainingIterations: number;
}
/**
 * Few-shot example (Phase 5)
 */
export interface FewShotExample {
    id: string;
    category: TriggerCategory;
    features: number[];
    label: boolean;
    contributedAt: number;
    source: 'user' | 'community' | 'algorithm';
    confidence?: number;
}
/**
 * User feedback history
 */
export interface FeedbackHistory {
    id: string;
    category: TriggerCategory;
    feedbackType: string;
    timestamp: number;
    contentFingerprint?: string;
    confidence?: number;
    severityAdjustment?: number;
}
/**
 * Complete learning state snapshot
 */
export interface LearningStateSnapshot {
    version: string;
    userId: string;
    savedAt: number;
    thresholds: ThresholdData[];
    multiTaskWeights: MultiTaskWeights | null;
    fewShotExamples: FewShotExample[];
    feedbackHistory: FeedbackHistory[];
}
/**
 * Storage statistics
 */
interface StorageStats {
    totalThresholds: number;
    totalFewShotExamples: number;
    totalFeedback: number;
    storageUsedBytes: number;
    lastSaved: number;
    lastLoaded: number;
    saveCount: number;
    loadCount: number;
}
/**
 * Progressive Learning State Manager
 *
 * Manages persistent storage of all learning state
 */
export declare class ProgressiveLearningState {
    private indexedDB;
    private readonly DB_NAME;
    private readonly DB_VERSION;
    private readonly STORES;
    private readonly MAX_FEEDBACK_HISTORY;
    private readonly MAX_FEW_SHOT_EXAMPLES;
    private readonly AUTOSAVE_INTERVAL;
    private thresholdsCache;
    private fewShotCache;
    private feedbackCache;
    private stats;
    private userId;
    private algorithmVersion;
    private autosaveTimer;
    constructor(userId: string, algorithmVersion?: string);
    /**
     * Initialize IndexedDB with all object stores
     */
    private initializeIndexedDB;
    /**
     * Save adaptive thresholds for a category
     */
    saveThresholds(thresholds: ThresholdData[]): Promise<boolean>;
    /**
     * Load adaptive thresholds for a category
     */
    loadThresholds(category?: TriggerCategory): Promise<ThresholdData[]>;
    /**
     * Save multi-task learning weights
     */
    saveMultiTaskWeights(weights: MultiTaskWeights): Promise<boolean>;
    /**
     * Load multi-task learning weights
     */
    loadMultiTaskWeights(): Promise<MultiTaskWeights | null>;
    /**
     * Save few-shot examples
     */
    saveFewShotExamples(examples: FewShotExample[]): Promise<boolean>;
    /**
     * Load few-shot examples for a category
     */
    loadFewShotExamples(category?: TriggerCategory): Promise<FewShotExample[]>;
    /**
     * Prune old few-shot examples (keep best N per category)
     */
    pruneFewShotExamples(maxPerCategory?: number): Promise<void>;
    /**
     * Save user feedback
     */
    saveFeedback(feedback: FeedbackHistory[]): Promise<boolean>;
    /**
     * Load feedback history
     */
    loadFeedback(category?: TriggerCategory, limit?: number): Promise<FeedbackHistory[]>;
    /**
     * Create complete state snapshot
     */
    createSnapshot(): Promise<boolean>;
    /**
     * Restore from snapshot
     */
    restoreSnapshot(timestamp: number): Promise<boolean>;
    /**
     * Load all state (on startup)
     */
    loadAllState(): Promise<void>;
    /**
     * Save all state
     */
    saveAllState(thresholds: ThresholdData[], multiTask: MultiTaskWeights | null, fewShot: FewShotExample[], feedback: FeedbackHistory[]): Promise<boolean>;
    /**
     * Start autosave timer
     */
    private startAutosave;
    /**
     * Wait for IndexedDB transaction to complete
     */
    private waitForTransaction;
    /**
     * Wait for IndexedDB request to complete
     */
    private waitForRequest;
    /**
     * Get statistics
     */
    getStats(): StorageStats;
    /**
     * Clear all learning state
     */
    clearAll(): Promise<void>;
    /**
     * Dispose (cleanup)
     */
    dispose(): void;
}
export declare function initializeProgressiveLearning(userId: string, version?: string): ProgressiveLearningState;
export declare function getProgressiveLearning(): ProgressiveLearningState | null;
export {};
//# sourceMappingURL=ProgressiveLearningState.d.ts.map