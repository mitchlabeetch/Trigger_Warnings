/**
 * ALGORITHM 3.0 - PHASE 7: INNOVATION #26
 * Cross-Device Sync & Analytics
 *
 * Syncs learning state across devices via backend.
 * Provides analytics and insights on detection performance.
 *
 * Privacy-preserving: User controls what syncs, anonymous analytics
 *
 * Equal Treatment: All 28 categories tracked and synced equally
 */
import type { TriggerCategory } from '../types/triggers';
import type { LearningStateSnapshot } from './ProgressiveLearningState';
/**
 * Sync configuration
 */
export interface SyncConfig {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
    syncThresholds: boolean;
    syncFewShot: boolean;
    syncFeedback: boolean;
    uploadAnalytics: boolean;
}
/**
 * Sync status
 */
export interface SyncStatus {
    lastSyncAttempt: number;
    lastSuccessfulSync: number;
    lastSyncError?: string;
    itemsSynced: number;
    itemsFailed: number;
    isSyncing: boolean;
    nextScheduledSync?: number;
}
/**
 * Analytics data (anonymized)
 */
export interface AnalyticsData {
    userId: string;
    periodStart: number;
    periodEnd: number;
    totalDetections: number;
    detectionsByCategory: Record<TriggerCategory, number>;
    avgConfidenceByCategory: Record<TriggerCategory, number>;
    totalFeedback: number;
    feedbackByType: Record<string, number>;
    dismissRateByCategory: Record<TriggerCategory, number>;
    falsePositiveRate: number;
    falseNegativeRate: number;
    userSatisfactionScore: number;
    thresholdsAdjusted: number;
    fewShotExamplesAdded: number;
    avgThresholdChange: number;
    triggersSubmitted: number;
    triggersApproved: number;
    validationsProvided: number;
}
/**
 * Sync statistics
 */
interface SyncStats {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    dataUploaded: number;
    dataDownloaded: number;
    avgSyncDuration: number;
    lastSyncDuration: number;
}
/**
 * Cross-Device Sync Manager
 *
 * Handles synchronization of learning state across devices
 */
export declare class CrossDeviceSync {
    private supabaseUrl;
    private supabaseKey;
    private supabase;
    private userId;
    private deviceId;
    private config;
    private status;
    private stats;
    private syncTimer;
    private analyticsBuffer;
    constructor(supabaseUrl: string, supabaseKey: string, userId: string, config?: Partial<SyncConfig>);
    /**
     * Initialize Supabase client
     */
    private initializeSupabase;
    /**
     * Sync learning state to backend
     */
    syncToBackend(snapshot: LearningStateSnapshot): Promise<boolean>;
    /**
     * Sync from backend (pull latest state)
     */
    syncFromBackend(): Promise<LearningStateSnapshot | null>;
    /**
     * Bidirectional sync (merge local and remote)
     */
    bidirectionalSync(localSnapshot: LearningStateSnapshot): Promise<LearningStateSnapshot>;
    /**
     * Sync adaptive thresholds
     */
    private syncThresholds;
    /**
     * Sync few-shot examples
     */
    private syncFewShotExamples;
    /**
     * Sync feedback summary (aggregated, not full history)
     */
    private syncFeedbackSummary;
    /**
     * Collect analytics data (anonymized)
     */
    collectAnalytics(data: Partial<AnalyticsData>): void;
    /**
     * Upload analytics to backend
     */
    private uploadAnalytics;
    /**
     * Anonymize user ID (one-way hash)
     */
    private anonymizeUserId;
    /**
     * Merge local and remote snapshots
     */
    private mergeSnapshots;
    /**
     * Start automatic sync
     */
    private startAutoSync;
    /**
     * Stop automatic sync
     */
    stopAutoSync(): void;
    /**
     * Update sync configuration
     */
    updateConfig(config: Partial<SyncConfig>): void;
    /**
     * Get sync configuration
     */
    getConfig(): SyncConfig;
    /**
     * Get sync status
     */
    getStatus(): SyncStatus;
    /**
     * Get sync statistics
     */
    getStats(): SyncStats;
    /**
     * Generate device ID
     */
    private generateDeviceId;
    /**
     * Clear sync data
     */
    clear(): void;
    /**
     * Dispose
     */
    dispose(): void;
}
export declare function initializeCrossDeviceSync(supabaseUrl: string, supabaseKey: string, userId: string, config?: Partial<SyncConfig>): CrossDeviceSync;
export declare function getCrossDeviceSync(): CrossDeviceSync | null;
export {};
//# sourceMappingURL=CrossDeviceSync.d.ts.map