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
import { logger } from '../utils/Logger';
/**
 * Progressive Learning State Manager
 *
 * Manages persistent storage of all learning state
 */
export class ProgressiveLearningState {
    indexedDB = null;
    DB_NAME = 'TriggerWarningsLearning';
    DB_VERSION = 1;
    // Object store names
    STORES = {
        thresholds: 'adaptiveThresholds',
        multiTask: 'multiTaskWeights',
        fewShot: 'fewShotExamples',
        feedback: 'feedbackHistory',
        snapshots: 'stateSnapshots'
    };
    // Configuration
    MAX_FEEDBACK_HISTORY = 10000; // Keep last 10k feedback events
    MAX_FEW_SHOT_EXAMPLES = 1000; // Keep best 1k examples per category
    AUTOSAVE_INTERVAL = 60000; // Autosave every minute
    // In-memory cache (for fast access)
    thresholdsCache = new Map();
    fewShotCache = new Map();
    feedbackCache = [];
    // Statistics
    stats = {
        totalThresholds: 0,
        totalFewShotExamples: 0,
        totalFeedback: 0,
        storageUsedBytes: 0,
        lastSaved: 0,
        lastLoaded: 0,
        saveCount: 0,
        loadCount: 0
    };
    // User context
    userId;
    algorithmVersion;
    // Autosave timer
    autosaveTimer = null;
    constructor(userId, algorithmVersion = '3.0-phase-7') {
        this.userId = userId;
        this.algorithmVersion = algorithmVersion;
        logger.info('[LearningState] 💾 Progressive Learning State Manager initialized');
        logger.info(`[LearningState] 👤 User: ${userId}, Version: ${algorithmVersion}`);
        // Initialize IndexedDB
        this.initializeIndexedDB();
        // Start autosave
        this.startAutosave();
    }
    // ========================================
    // INDEXEDDB INITIALIZATION
    // ========================================
    /**
     * Initialize IndexedDB with all object stores
     */
    async initializeIndexedDB() {
        if (typeof indexedDB === 'undefined') {
            logger.warn('[LearningState] ⚠️ IndexedDB not available - learning will not persist');
            return;
        }
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onerror = () => {
                logger.error('[LearningState] ❌ Failed to open IndexedDB');
                reject(request.error);
            };
            request.onsuccess = () => {
                this.indexedDB = request.result;
                logger.info('[LearningState] ✅ IndexedDB initialized successfully');
                // Load initial state
                this.loadAllState();
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create object stores
                if (!db.objectStoreNames.contains(this.STORES.thresholds)) {
                    const thresholdStore = db.createObjectStore(this.STORES.thresholds, { keyPath: 'category' });
                    thresholdStore.createIndex('lastAdjusted', 'lastAdjusted', { unique: false });
                    logger.info('[LearningState] 🔧 Created thresholds store');
                }
                if (!db.objectStoreNames.contains(this.STORES.multiTask)) {
                    db.createObjectStore(this.STORES.multiTask, { keyPath: 'userId' });
                    logger.info('[LearningState] 🔧 Created multiTask store');
                }
                if (!db.objectStoreNames.contains(this.STORES.fewShot)) {
                    const fewShotStore = db.createObjectStore(this.STORES.fewShot, { keyPath: 'id' });
                    fewShotStore.createIndex('category', 'category', { unique: false });
                    fewShotStore.createIndex('contributedAt', 'contributedAt', { unique: false });
                    logger.info('[LearningState] 🔧 Created fewShot store');
                }
                if (!db.objectStoreNames.contains(this.STORES.feedback)) {
                    const feedbackStore = db.createObjectStore(this.STORES.feedback, { keyPath: 'id' });
                    feedbackStore.createIndex('category', 'category', { unique: false });
                    feedbackStore.createIndex('timestamp', 'timestamp', { unique: false });
                    logger.info('[LearningState] 🔧 Created feedback store');
                }
                if (!db.objectStoreNames.contains(this.STORES.snapshots)) {
                    const snapshotStore = db.createObjectStore(this.STORES.snapshots, { keyPath: 'savedAt' });
                    snapshotStore.createIndex('userId', 'userId', { unique: false });
                    logger.info('[LearningState] 🔧 Created snapshots store');
                }
            };
        });
    }
    // ========================================
    // ADAPTIVE THRESHOLDS (Phase 4)
    // ========================================
    /**
     * Save adaptive thresholds for a category
     */
    async saveThresholds(thresholds) {
        if (!this.indexedDB)
            return false;
        try {
            const transaction = this.indexedDB.transaction([this.STORES.thresholds], 'readwrite');
            const store = transaction.objectStore(this.STORES.thresholds);
            // Save each threshold
            for (const threshold of thresholds) {
                store.put(threshold);
                this.thresholdsCache.set(threshold.category, threshold);
            }
            await this.waitForTransaction(transaction);
            this.stats.totalThresholds = thresholds.length;
            this.stats.lastSaved = Date.now();
            this.stats.saveCount++;
            logger.debug(`[LearningState] ✅ Saved ${thresholds.length} adaptive thresholds`);
            return true;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error saving thresholds:', error);
            return false;
        }
    }
    /**
     * Load adaptive thresholds for a category
     */
    async loadThresholds(category) {
        // Check cache first
        if (category && this.thresholdsCache.has(category)) {
            return [this.thresholdsCache.get(category)];
        }
        if (!this.indexedDB)
            return [];
        try {
            const transaction = this.indexedDB.transaction([this.STORES.thresholds], 'readonly');
            const store = transaction.objectStore(this.STORES.thresholds);
            let thresholds;
            if (category) {
                // Load specific category
                const request = store.get(category);
                await this.waitForRequest(request);
                thresholds = request.result ? [request.result] : [];
            }
            else {
                // Load all categories
                const request = store.getAll();
                await this.waitForRequest(request);
                thresholds = request.result || [];
            }
            // Update cache
            thresholds.forEach(t => this.thresholdsCache.set(t.category, t));
            this.stats.lastLoaded = Date.now();
            this.stats.loadCount++;
            logger.debug(`[LearningState] ✅ Loaded ${thresholds.length} adaptive thresholds`);
            return thresholds;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error loading thresholds:', error);
            return [];
        }
    }
    // ========================================
    // MULTI-TASK LEARNING WEIGHTS (Phase 5)
    // ========================================
    /**
     * Save multi-task learning weights
     */
    async saveMultiTaskWeights(weights) {
        if (!this.indexedDB)
            return false;
        try {
            const transaction = this.indexedDB.transaction([this.STORES.multiTask], 'readwrite');
            const store = transaction.objectStore(this.STORES.multiTask);
            // Save with userId as key
            store.put({
                userId: this.userId,
                ...weights
            });
            await this.waitForTransaction(transaction);
            this.stats.lastSaved = Date.now();
            this.stats.saveCount++;
            logger.debug('[LearningState] ✅ Saved multi-task weights');
            return true;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error saving multi-task weights:', error);
            return false;
        }
    }
    /**
     * Load multi-task learning weights
     */
    async loadMultiTaskWeights() {
        if (!this.indexedDB)
            return null;
        try {
            const transaction = this.indexedDB.transaction([this.STORES.multiTask], 'readonly');
            const store = transaction.objectStore(this.STORES.multiTask);
            const request = store.get(this.userId);
            await this.waitForRequest(request);
            if (request.result) {
                // Remove userId from result
                const { userId, ...weights } = request.result;
                this.stats.lastLoaded = Date.now();
                this.stats.loadCount++;
                logger.debug('[LearningState] ✅ Loaded multi-task weights');
                return weights;
            }
            return null;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error loading multi-task weights:', error);
            return null;
        }
    }
    // ========================================
    // FEW-SHOT EXAMPLES (Phase 5)
    // ========================================
    /**
     * Save few-shot examples
     */
    async saveFewShotExamples(examples) {
        if (!this.indexedDB)
            return false;
        try {
            const transaction = this.indexedDB.transaction([this.STORES.fewShot], 'readwrite');
            const store = transaction.objectStore(this.STORES.fewShot);
            // Save each example
            for (const example of examples) {
                store.put(example);
            }
            await this.waitForTransaction(transaction);
            // Update cache (group by category)
            for (const example of examples) {
                const categoryExamples = this.fewShotCache.get(example.category) || [];
                const existing = categoryExamples.findIndex(e => e.id === example.id);
                if (existing >= 0) {
                    categoryExamples[existing] = example;
                }
                else {
                    categoryExamples.push(example);
                }
                this.fewShotCache.set(example.category, categoryExamples);
            }
            this.stats.totalFewShotExamples = examples.length;
            this.stats.lastSaved = Date.now();
            this.stats.saveCount++;
            logger.debug(`[LearningState] ✅ Saved ${examples.length} few-shot examples`);
            return true;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error saving few-shot examples:', error);
            return false;
        }
    }
    /**
     * Load few-shot examples for a category
     */
    async loadFewShotExamples(category) {
        // Check cache first
        if (category && this.fewShotCache.has(category)) {
            return this.fewShotCache.get(category);
        }
        if (!this.indexedDB)
            return [];
        try {
            const transaction = this.indexedDB.transaction([this.STORES.fewShot], 'readonly');
            const store = transaction.objectStore(this.STORES.fewShot);
            let examples;
            if (category) {
                // Load specific category using index
                const index = store.index('category');
                const request = index.getAll(category);
                await this.waitForRequest(request);
                examples = request.result || [];
            }
            else {
                // Load all examples
                const request = store.getAll();
                await this.waitForRequest(request);
                examples = request.result || [];
            }
            // Update cache
            if (category) {
                this.fewShotCache.set(category, examples);
            }
            else {
                // Group by category
                const grouped = new Map();
                examples.forEach(ex => {
                    const catExamples = grouped.get(ex.category) || [];
                    catExamples.push(ex);
                    grouped.set(ex.category, catExamples);
                });
                this.fewShotCache = grouped;
            }
            this.stats.lastLoaded = Date.now();
            this.stats.loadCount++;
            logger.debug(`[LearningState] ✅ Loaded ${examples.length} few-shot examples`);
            return examples;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error loading few-shot examples:', error);
            return [];
        }
    }
    /**
     * Prune old few-shot examples (keep best N per category)
     */
    async pruneFewShotExamples(maxPerCategory = this.MAX_FEW_SHOT_EXAMPLES) {
        if (!this.indexedDB)
            return;
        try {
            // Load all examples
            const allExamples = await this.loadFewShotExamples();
            // Group by category
            const grouped = new Map();
            allExamples.forEach(ex => {
                const catExamples = grouped.get(ex.category) || [];
                catExamples.push(ex);
                grouped.set(ex.category, catExamples);
            });
            // For each category, keep only best N
            const toKeep = [];
            for (const [category, examples] of grouped) {
                // Sort by confidence (descending) and recency
                const sorted = examples.sort((a, b) => {
                    const confDiff = (b.confidence || 0) - (a.confidence || 0);
                    if (Math.abs(confDiff) > 0.01)
                        return confDiff;
                    return b.contributedAt - a.contributedAt;
                });
                toKeep.push(...sorted.slice(0, maxPerCategory));
            }
            // Clear and re-save
            const transaction = this.indexedDB.transaction([this.STORES.fewShot], 'readwrite');
            const store = transaction.objectStore(this.STORES.fewShot);
            store.clear();
            for (const example of toKeep) {
                store.put(example);
            }
            await this.waitForTransaction(transaction);
            logger.info(`[LearningState] 🧹 Pruned few-shot examples: ${allExamples.length} → ${toKeep.length}`);
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error pruning few-shot examples:', error);
        }
    }
    // ========================================
    // FEEDBACK HISTORY
    // ========================================
    /**
     * Save user feedback
     */
    async saveFeedback(feedback) {
        if (!this.indexedDB)
            return false;
        try {
            const transaction = this.indexedDB.transaction([this.STORES.feedback], 'readwrite');
            const store = transaction.objectStore(this.STORES.feedback);
            for (const item of feedback) {
                store.put(item);
            }
            await this.waitForTransaction(transaction);
            // Update cache (keep only recent)
            this.feedbackCache.push(...feedback);
            this.feedbackCache.sort((a, b) => b.timestamp - a.timestamp);
            this.feedbackCache = this.feedbackCache.slice(0, 100); // Keep last 100 in memory
            this.stats.totalFeedback += feedback.length;
            this.stats.lastSaved = Date.now();
            this.stats.saveCount++;
            logger.debug(`[LearningState] ✅ Saved ${feedback.length} feedback items`);
            return true;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error saving feedback:', error);
            return false;
        }
    }
    /**
     * Load feedback history
     */
    async loadFeedback(category, limit = 1000) {
        if (!this.indexedDB)
            return [];
        try {
            const transaction = this.indexedDB.transaction([this.STORES.feedback], 'readonly');
            const store = transaction.objectStore(this.STORES.feedback);
            let feedback;
            if (category) {
                const index = store.index('category');
                const request = index.getAll(category);
                await this.waitForRequest(request);
                feedback = request.result || [];
            }
            else {
                const request = store.getAll();
                await this.waitForRequest(request);
                feedback = request.result || [];
            }
            // Sort by timestamp (newest first) and limit
            feedback.sort((a, b) => b.timestamp - a.timestamp);
            feedback = feedback.slice(0, limit);
            this.stats.lastLoaded = Date.now();
            this.stats.loadCount++;
            logger.debug(`[LearningState] ✅ Loaded ${feedback.length} feedback items`);
            return feedback;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error loading feedback:', error);
            return [];
        }
    }
    // ========================================
    // STATE SNAPSHOTS (Backup/Restore)
    // ========================================
    /**
     * Create complete state snapshot
     */
    async createSnapshot() {
        if (!this.indexedDB)
            return false;
        try {
            // Collect all current state
            const [thresholds, multiTask, fewShot, feedback] = await Promise.all([
                this.loadThresholds(),
                this.loadMultiTaskWeights(),
                this.loadFewShotExamples(),
                this.loadFeedback(undefined, this.MAX_FEEDBACK_HISTORY)
            ]);
            const snapshot = {
                version: this.algorithmVersion,
                userId: this.userId,
                savedAt: Date.now(),
                thresholds,
                multiTaskWeights: multiTask,
                fewShotExamples: fewShot,
                feedbackHistory: feedback
            };
            // Save snapshot
            const transaction = this.indexedDB.transaction([this.STORES.snapshots], 'readwrite');
            const store = transaction.objectStore(this.STORES.snapshots);
            store.put(snapshot);
            await this.waitForTransaction(transaction);
            logger.info(`[LearningState] 📸 Created state snapshot at ${new Date(snapshot.savedAt).toISOString()}`);
            return true;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error creating snapshot:', error);
            return false;
        }
    }
    /**
     * Restore from snapshot
     */
    async restoreSnapshot(timestamp) {
        if (!this.indexedDB)
            return false;
        try {
            const transaction = this.indexedDB.transaction([this.STORES.snapshots], 'readonly');
            const store = transaction.objectStore(this.STORES.snapshots);
            const request = store.get(timestamp);
            await this.waitForRequest(request);
            if (!request.result) {
                logger.error('[LearningState] ❌ Snapshot not found');
                return false;
            }
            const snapshot = request.result;
            // Restore all state
            await Promise.all([
                this.saveThresholds(snapshot.thresholds),
                snapshot.multiTaskWeights ? this.saveMultiTaskWeights(snapshot.multiTaskWeights) : Promise.resolve(true),
                this.saveFewShotExamples(snapshot.fewShotExamples),
                this.saveFeedback(snapshot.feedbackHistory)
            ]);
            logger.info(`[LearningState] 📥 Restored snapshot from ${new Date(timestamp).toISOString()}`);
            return true;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error restoring snapshot:', error);
            return false;
        }
    }
    // ========================================
    // BULK OPERATIONS
    // ========================================
    /**
     * Load all state (on startup)
     */
    async loadAllState() {
        logger.info('[LearningState] 🔄 Loading all learning state...');
        try {
            await Promise.all([
                this.loadThresholds(),
                this.loadMultiTaskWeights(),
                this.loadFewShotExamples(),
                this.loadFeedback(undefined, 100) // Load recent 100 feedback items
            ]);
            logger.info('[LearningState] ✅ All learning state loaded successfully');
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error loading state:', error);
        }
    }
    /**
     * Save all state
     */
    async saveAllState(thresholds, multiTask, fewShot, feedback) {
        try {
            const results = await Promise.all([
                this.saveThresholds(thresholds),
                multiTask ? this.saveMultiTaskWeights(multiTask) : Promise.resolve(true),
                this.saveFewShotExamples(fewShot),
                this.saveFeedback(feedback)
            ]);
            const success = results.every(r => r);
            if (success) {
                logger.info('[LearningState] ✅ All state saved successfully');
            }
            return success;
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error saving all state:', error);
            return false;
        }
    }
    // ========================================
    // AUTOSAVE
    // ========================================
    /**
     * Start autosave timer
     */
    startAutosave() {
        this.autosaveTimer = setInterval(() => {
            // Create snapshot periodically (weekly)
            const now = Date.now();
            const weekInMs = 7 * 24 * 60 * 60 * 1000;
            if (now - this.stats.lastSaved > weekInMs) {
                this.createSnapshot();
            }
        }, this.AUTOSAVE_INTERVAL);
        logger.debug('[LearningState] ⏰ Autosave enabled');
    }
    // ========================================
    // UTILITIES
    // ========================================
    /**
     * Wait for IndexedDB transaction to complete
     */
    waitForTransaction(transaction) {
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
    /**
     * Wait for IndexedDB request to complete
     */
    waitForRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    /**
     * Get statistics
     */
    getStats() {
        // Estimate storage usage
        this.stats.storageUsedBytes =
            this.stats.totalThresholds * 200 + // ~200 bytes per threshold
                this.stats.totalFewShotExamples * 500 + // ~500 bytes per example
                this.stats.totalFeedback * 300; // ~300 bytes per feedback
        return { ...this.stats };
    }
    /**
     * Clear all learning state
     */
    async clearAll() {
        if (!this.indexedDB)
            return;
        try {
            const transaction = this.indexedDB.transaction(Object.values(this.STORES), 'readwrite');
            for (const storeName of Object.values(this.STORES)) {
                const store = transaction.objectStore(storeName);
                store.clear();
            }
            await this.waitForTransaction(transaction);
            // Clear caches
            this.thresholdsCache.clear();
            this.fewShotCache.clear();
            this.feedbackCache = [];
            // Reset stats
            this.stats = {
                totalThresholds: 0,
                totalFewShotExamples: 0,
                totalFeedback: 0,
                storageUsedBytes: 0,
                lastSaved: 0,
                lastLoaded: 0,
                saveCount: 0,
                loadCount: 0
            };
            logger.info('[LearningState] 🧹 Cleared all learning state');
        }
        catch (error) {
            logger.error('[LearningState] ❌ Error clearing state:', error);
        }
    }
    /**
     * Dispose (cleanup)
     */
    dispose() {
        if (this.autosaveTimer) {
            clearInterval(this.autosaveTimer);
            this.autosaveTimer = null;
        }
        if (this.indexedDB) {
            this.indexedDB.close();
            this.indexedDB = null;
        }
        logger.info('[LearningState] 🛑 Progressive Learning State Manager disposed');
    }
}
// Singleton factory
let learningStateInstance = null;
export function initializeProgressiveLearning(userId, version) {
    learningStateInstance = new ProgressiveLearningState(userId, version);
    return learningStateInstance;
}
export function getProgressiveLearning() {
    return learningStateInstance;
}
//# sourceMappingURL=ProgressiveLearningState.js.map