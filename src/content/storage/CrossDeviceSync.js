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
import { logger } from '../utils/Logger';
/**
 * Cross-Device Sync Manager
 *
 * Handles synchronization of learning state across devices
 */
export class CrossDeviceSync {
    supabaseUrl;
    supabaseKey;
    supabase = null;
    userId;
    deviceId;
    // Configuration
    config = {
        enabled: true,
        autoSync: true,
        syncInterval: 5 * 60 * 1000, // 5 minutes
        syncThresholds: true,
        syncFewShot: true,
        syncFeedback: true,
        uploadAnalytics: false // Opt-in
    };
    // Status
    status = {
        lastSyncAttempt: 0,
        lastSuccessfulSync: 0,
        itemsSynced: 0,
        itemsFailed: 0,
        isSyncing: false
    };
    // Statistics
    stats = {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        dataUploaded: 0,
        dataDownloaded: 0,
        avgSyncDuration: 0,
        lastSyncDuration: 0
    };
    // Sync timer
    syncTimer = null;
    // Analytics buffer
    analyticsBuffer = null;
    constructor(supabaseUrl, supabaseKey, userId, config) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.userId = userId;
        this.deviceId = this.generateDeviceId();
        if (config) {
            this.config = { ...this.config, ...config };
        }
        logger.info('[CrossDeviceSync] 🔄 Cross-Device Sync initialized');
        logger.info(`[CrossDeviceSync] 📱 Device: ${this.deviceId}`);
        logger.info(`[CrossDeviceSync] ⚙️ Auto-sync: ${this.config.autoSync ? 'ON' : 'OFF'}`);
        // Initialize Supabase
        this.initializeSupabase();
        // Start auto-sync if enabled
        if (this.config.enabled && this.config.autoSync) {
            this.startAutoSync();
        }
    }
    // ========================================
    // INITIALIZATION
    // ========================================
    /**
     * Initialize Supabase client
     */
    async initializeSupabase() {
        try {
            const { createClient } = await import('@supabase/supabase-js');
            this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
            logger.info('[CrossDeviceSync] ✅ Supabase client initialized');
        }
        catch (error) {
            logger.warn('[CrossDeviceSync] ⚠️ Supabase not available - sync disabled');
            this.config.enabled = false;
        }
    }
    // ========================================
    // SYNC OPERATIONS
    // ========================================
    /**
     * Sync learning state to backend
     */
    async syncToBackend(snapshot) {
        if (!this.config.enabled || !this.supabase) {
            logger.debug('[CrossDeviceSync] ⚠️ Sync disabled');
            return false;
        }
        if (this.status.isSyncing) {
            logger.debug('[CrossDeviceSync] ⚠️ Sync already in progress');
            return false;
        }
        this.status.isSyncing = true;
        this.status.lastSyncAttempt = Date.now();
        const startTime = Date.now();
        try {
            logger.info('[CrossDeviceSync] 🔄 Starting sync to backend...');
            let itemsSynced = 0;
            // 1. Sync adaptive thresholds
            if (this.config.syncThresholds && snapshot.thresholds.length > 0) {
                const success = await this.syncThresholds(snapshot.thresholds);
                if (success)
                    itemsSynced += snapshot.thresholds.length;
            }
            // 2. Sync few-shot examples
            if (this.config.syncFewShot && snapshot.fewShotExamples.length > 0) {
                const success = await this.syncFewShotExamples(snapshot.fewShotExamples);
                if (success)
                    itemsSynced += snapshot.fewShotExamples.length;
            }
            // 3. Sync feedback (summary only, not full history)
            if (this.config.syncFeedback && snapshot.feedbackHistory.length > 0) {
                const success = await this.syncFeedbackSummary(snapshot.feedbackHistory);
                if (success)
                    itemsSynced++;
            }
            // 4. Upload analytics (if enabled)
            if (this.config.uploadAnalytics && this.analyticsBuffer) {
                await this.uploadAnalytics(this.analyticsBuffer);
                this.analyticsBuffer = null; // Clear buffer after upload
            }
            // Update status
            this.status.lastSuccessfulSync = Date.now();
            this.status.itemsSynced = itemsSynced;
            this.status.isSyncing = false;
            // Update stats
            const duration = Date.now() - startTime;
            this.stats.totalSyncs++;
            this.stats.successfulSyncs++;
            this.stats.lastSyncDuration = duration;
            this.stats.avgSyncDuration =
                (this.stats.avgSyncDuration * (this.stats.totalSyncs - 1) + duration) / this.stats.totalSyncs;
            logger.info(`[CrossDeviceSync] ✅ Sync completed: ${itemsSynced} items in ${duration}ms`);
            return true;
        }
        catch (error) {
            this.status.isSyncing = false;
            this.status.lastSyncError = error instanceof Error ? error.message : String(error);
            this.status.itemsFailed++;
            this.stats.failedSyncs++;
            logger.error('[CrossDeviceSync] ❌ Sync failed:', error);
            return false;
        }
    }
    /**
     * Sync from backend (pull latest state)
     */
    async syncFromBackend() {
        if (!this.config.enabled || !this.supabase) {
            return null;
        }
        try {
            logger.info('[CrossDeviceSync] 🔄 Pulling state from backend...');
            // Pull latest state for this user
            const { data, error } = await this.supabase
                .from('user_learning_state')
                .select('*')
                .eq('user_id', this.userId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();
            if (error || !data) {
                logger.debug('[CrossDeviceSync] ℹ️ No remote state found');
                return null;
            }
            const snapshot = {
                version: data.version,
                userId: data.user_id,
                savedAt: new Date(data.updated_at).getTime(),
                thresholds: data.thresholds || [],
                multiTaskWeights: data.multi_task_weights || null,
                fewShotExamples: data.few_shot_examples || [],
                feedbackHistory: [] // Don't sync full history, just summary
            };
            logger.info('[CrossDeviceSync] ✅ Pulled state from backend');
            return snapshot;
        }
        catch (error) {
            logger.error('[CrossDeviceSync] ❌ Failed to pull state:', error);
            return null;
        }
    }
    /**
     * Bidirectional sync (merge local and remote)
     */
    async bidirectionalSync(localSnapshot) {
        // Pull remote state
        const remoteSnapshot = await this.syncFromBackend();
        if (!remoteSnapshot) {
            // No remote state - push local
            await this.syncToBackend(localSnapshot);
            return localSnapshot;
        }
        // Merge local and remote (prefer newer)
        const merged = this.mergeSnapshots(localSnapshot, remoteSnapshot);
        // Push merged state
        await this.syncToBackend(merged);
        return merged;
    }
    // ========================================
    // COMPONENT SYNC OPERATIONS
    // ========================================
    /**
     * Sync adaptive thresholds
     */
    async syncThresholds(thresholds) {
        if (!this.supabase)
            return false;
        try {
            // Upsert thresholds
            const records = thresholds.map(t => ({
                user_id: this.userId,
                device_id: this.deviceId,
                category: t.category,
                threshold: t.threshold,
                default_threshold: t.defaultThreshold,
                adjustment_count: t.adjustmentCount,
                last_adjusted: new Date(t.lastAdjusted).toISOString(),
                updated_at: new Date().toISOString()
            }));
            const { error } = await this.supabase
                .from('user_thresholds')
                .upsert(records, { onConflict: 'user_id,category' });
            if (error) {
                logger.error('[CrossDeviceSync] ❌ Failed to sync thresholds:', error);
                return false;
            }
            const dataSize = JSON.stringify(records).length;
            this.stats.dataUploaded += dataSize;
            logger.debug(`[CrossDeviceSync] ✅ Synced ${thresholds.length} thresholds`);
            return true;
        }
        catch (error) {
            logger.error('[CrossDeviceSync] ❌ Error syncing thresholds:', error);
            return false;
        }
    }
    /**
     * Sync few-shot examples
     */
    async syncFewShotExamples(examples) {
        if (!this.supabase)
            return false;
        try {
            // Only sync user-contributed examples (not community)
            const userExamples = examples.filter(e => e.source === 'user');
            if (userExamples.length === 0) {
                return true; // Nothing to sync
            }
            const records = userExamples.map(e => ({
                id: e.id,
                user_id: this.userId,
                device_id: this.deviceId,
                category: e.category,
                features: e.features,
                label: e.label,
                confidence: e.confidence,
                contributed_at: new Date(e.contributedAt).toISOString()
            }));
            const { error } = await this.supabase
                .from('user_few_shot_examples')
                .upsert(records, { onConflict: 'id' });
            if (error) {
                logger.error('[CrossDeviceSync] ❌ Failed to sync few-shot examples:', error);
                return false;
            }
            const dataSize = JSON.stringify(records).length;
            this.stats.dataUploaded += dataSize;
            logger.debug(`[CrossDeviceSync] ✅ Synced ${userExamples.length} few-shot examples`);
            return true;
        }
        catch (error) {
            logger.error('[CrossDeviceSync] ❌ Error syncing few-shot examples:', error);
            return false;
        }
    }
    /**
     * Sync feedback summary (aggregated, not full history)
     */
    async syncFeedbackSummary(feedback) {
        if (!this.supabase || feedback.length === 0)
            return false;
        try {
            // Aggregate feedback by category
            const summary = {};
            for (const item of feedback) {
                const key = item.category;
                if (!summary[key]) {
                    summary[key] = {
                        total: 0,
                        dismissed: 0,
                        confirmed: 0,
                        false_positive: 0,
                        reported_missed: 0
                    };
                }
                summary[key].total++;
                if (item.feedbackType) {
                    summary[key][item.feedbackType] = (summary[key][item.feedbackType] || 0) + 1;
                }
            }
            // Save summary
            const { error } = await this.supabase
                .from('user_feedback_summary')
                .upsert({
                user_id: this.userId,
                device_id: this.deviceId,
                summary,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            if (error) {
                logger.error('[CrossDeviceSync] ❌ Failed to sync feedback summary:', error);
                return false;
            }
            logger.debug('[CrossDeviceSync] ✅ Synced feedback summary');
            return true;
        }
        catch (error) {
            logger.error('[CrossDeviceSync] ❌ Error syncing feedback summary:', error);
            return false;
        }
    }
    // ========================================
    // ANALYTICS
    // ========================================
    /**
     * Collect analytics data (anonymized)
     */
    collectAnalytics(data) {
        if (!this.config.uploadAnalytics) {
            return; // Analytics disabled
        }
        // Initialize buffer if needed
        if (!this.analyticsBuffer) {
            this.analyticsBuffer = {
                userId: this.anonymizeUserId(this.userId),
                periodStart: Date.now(),
                periodEnd: Date.now(),
                totalDetections: 0,
                detectionsByCategory: {},
                avgConfidenceByCategory: {},
                totalFeedback: 0,
                feedbackByType: {},
                dismissRateByCategory: {},
                falsePositiveRate: 0,
                falseNegativeRate: 0,
                userSatisfactionScore: 0,
                thresholdsAdjusted: 0,
                fewShotExamplesAdded: 0,
                avgThresholdChange: 0,
                triggersSubmitted: 0,
                triggersApproved: 0,
                validationsProvided: 0
            };
        }
        // Merge new data
        Object.assign(this.analyticsBuffer, data);
        this.analyticsBuffer.periodEnd = Date.now();
        logger.debug('[CrossDeviceSync] 📊 Analytics data collected');
    }
    /**
     * Upload analytics to backend
     */
    async uploadAnalytics(data) {
        if (!this.supabase)
            return false;
        try {
            const { error } = await this.supabase
                .from('analytics')
                .insert({
                user_id_hash: data.userId, // Anonymous hash
                period_start: new Date(data.periodStart).toISOString(),
                period_end: new Date(data.periodEnd).toISOString(),
                data: data,
                created_at: new Date().toISOString()
            });
            if (error) {
                logger.error('[CrossDeviceSync] ❌ Failed to upload analytics:', error);
                return false;
            }
            logger.debug('[CrossDeviceSync] 📊 Analytics uploaded');
            return true;
        }
        catch (error) {
            logger.error('[CrossDeviceSync] ❌ Error uploading analytics:', error);
            return false;
        }
    }
    /**
     * Anonymize user ID (one-way hash)
     */
    anonymizeUserId(userId) {
        // Simple hash (in production, use crypto.subtle.digest)
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
            hash = hash & hash;
        }
        return `anon_${Math.abs(hash).toString(16)}`;
    }
    // ========================================
    // MERGE LOGIC
    // ========================================
    /**
     * Merge local and remote snapshots
     */
    mergeSnapshots(local, remote) {
        // Use most recent version
        const version = local.savedAt > remote.savedAt ? local.version : remote.version;
        // Merge thresholds (prefer newer adjustments)
        const thresholdMap = new Map();
        for (const t of [...local.thresholds, ...remote.thresholds]) {
            const existing = thresholdMap.get(t.category);
            if (!existing || t.lastAdjusted > existing.lastAdjusted) {
                thresholdMap.set(t.category, t);
            }
        }
        const thresholds = Array.from(thresholdMap.values());
        // Merge few-shot examples (combine unique, prefer higher confidence)
        const exampleMap = new Map();
        for (const ex of [...local.fewShotExamples, ...remote.fewShotExamples]) {
            const existing = exampleMap.get(ex.id);
            if (!existing || (ex.confidence || 0) > (existing.confidence || 0)) {
                exampleMap.set(ex.id, ex);
            }
        }
        const fewShotExamples = Array.from(exampleMap.values());
        // Merge multi-task weights (prefer newer)
        const multiTaskWeights = local.multiTaskWeights && remote.multiTaskWeights
            ? (local.multiTaskWeights.lastUpdated > remote.multiTaskWeights.lastUpdated
                ? local.multiTaskWeights
                : remote.multiTaskWeights)
            : (local.multiTaskWeights || remote.multiTaskWeights);
        // Merge feedback history (combine and deduplicate)
        const feedbackMap = new Map();
        for (const f of [...local.feedbackHistory, ...remote.feedbackHistory]) {
            feedbackMap.set(f.id, f);
        }
        const feedbackHistory = Array.from(feedbackMap.values());
        return {
            version,
            userId: local.userId,
            savedAt: Math.max(local.savedAt, remote.savedAt),
            thresholds,
            multiTaskWeights,
            fewShotExamples,
            feedbackHistory
        };
    }
    // ========================================
    // AUTO-SYNC
    // ========================================
    /**
     * Start automatic sync
     */
    startAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        this.syncTimer = setInterval(() => {
            // Trigger sync event (integrator will handle)
            logger.debug('[CrossDeviceSync] ⏰ Auto-sync triggered');
            this.status.nextScheduledSync = Date.now() + this.config.syncInterval;
        }, this.config.syncInterval);
        this.status.nextScheduledSync = Date.now() + this.config.syncInterval;
        logger.info(`[CrossDeviceSync] ⏰ Auto-sync enabled (interval: ${this.config.syncInterval / 1000}s)`);
    }
    /**
     * Stop automatic sync
     */
    stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
        logger.info('[CrossDeviceSync] ⏰ Auto-sync disabled');
    }
    // ========================================
    // CONFIGURATION
    // ========================================
    /**
     * Update sync configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        // Restart auto-sync if needed
        if (this.config.enabled && this.config.autoSync) {
            this.startAutoSync();
        }
        else {
            this.stopAutoSync();
        }
        logger.info('[CrossDeviceSync] ⚙️ Configuration updated');
    }
    /**
     * Get sync configuration
     */
    getConfig() {
        return { ...this.config };
    }
    // ========================================
    // STATUS & STATS
    // ========================================
    /**
     * Get sync status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Get sync statistics
     */
    getStats() {
        return { ...this.stats };
    }
    // ========================================
    // UTILITIES
    // ========================================
    /**
     * Generate device ID
     */
    generateDeviceId() {
        // Try to get persistent device ID from localStorage
        if (typeof localStorage !== 'undefined') {
            let deviceId = localStorage.getItem('triggerwarnings_device_id');
            if (!deviceId) {
                deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('triggerwarnings_device_id', deviceId);
            }
            return deviceId;
        }
        // Fallback to session-based ID
        return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Clear sync data
     */
    clear() {
        this.status = {
            lastSyncAttempt: 0,
            lastSuccessfulSync: 0,
            itemsSynced: 0,
            itemsFailed: 0,
            isSyncing: false
        };
        this.analyticsBuffer = null;
        logger.info('[CrossDeviceSync] 🧹 Cleared sync state');
    }
    /**
     * Dispose
     */
    dispose() {
        this.stopAutoSync();
        this.clear();
        logger.info('[CrossDeviceSync] 🛑 Cross-Device Sync disposed');
    }
}
// Singleton factory
let syncInstance = null;
export function initializeCrossDeviceSync(supabaseUrl, supabaseKey, userId, config) {
    syncInstance = new CrossDeviceSync(supabaseUrl, supabaseKey, userId, config);
    return syncInstance;
}
export function getCrossDeviceSync() {
    return syncInstance;
}
//# sourceMappingURL=CrossDeviceSync.js.map