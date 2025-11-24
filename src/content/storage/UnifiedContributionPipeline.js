/**
 * ALGORITHM 3.0 - PHASE 7: INNOVATION #23
 * Unified Contribution & Validation Pipeline
 *
 * Merges 4 sources of truth:
 * 1. Algorithm detections
 * 2. User feedback on algorithm
 * 3. Community triggers (helper mode)
 * 4. User feedback on community triggers
 *
 * Creates feedback loops via Supabase for continuous improvement.
 *
 * Equal Treatment: All 28 categories benefit from same community learning and validation
 */
import { logger } from '../utils/Logger';
/**
 * Unified Contribution Pipeline
 *
 * Central system that manages all 4 sources and creates feedback loops
 */
export class UnifiedContributionPipeline {
    supabaseUrl;
    supabaseKey;
    supabase; // SupabaseClient (will be initialized)
    userId;
    sessionId;
    // Promotion criteria (gaming-resistant)
    PROMOTION_CRITERIA = {
        minVotes: 5, // At least 5 independent validations
        minValidationScore: 0.75, // At least 75% positive
        maxFalsePositiveRate: 0.10 // Less than 10% false positives
    };
    // Statistics
    stats = {
        detectionsLogged: 0,
        feedbackSubmitted: 0,
        triggersContributed: 0,
        triggersValidated: 0,
        triggersPromoted: 0,
        avgValidationScore: 0,
        avgConsensusScore: 0
    };
    // Local cache of approved triggers (loaded on startup)
    approvedTriggersCache = new Map();
    cacheLastUpdated = 0;
    CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    constructor(supabaseUrl, supabaseKey, userId) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.userId = userId;
        this.sessionId = this.generateSessionId();
        // Initialize Supabase client (lazy - only when first used)
        this.initializeSupabase();
        logger.info('[UnifiedPipeline] 🔄 Unified Contribution Pipeline initialized');
        logger.info('[UnifiedPipeline] 📊 Connected to Supabase for community learning');
        logger.info(`[UnifiedPipeline] 🎯 Promotion criteria: ${this.PROMOTION_CRITERIA.minVotes} votes, ${this.PROMOTION_CRITERIA.minValidationScore * 100}% score`);
    }
    /**
     * Initialize Supabase client (lazy loading)
     */
    async initializeSupabase() {
        try {
            // Dynamically import Supabase (only if available)
            const { createClient } = await import('@supabase/supabase-js');
            this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
            logger.info('[UnifiedPipeline] ✅ Supabase client initialized');
        }
        catch (error) {
            logger.warn('[UnifiedPipeline] ⚠️ Supabase not available - running in offline mode');
            this.supabase = null;
        }
    }
    // ========================================
    // 1. LOG ALGORITHM DETECTIONS
    // ========================================
    /**
     * Log an algorithm detection to Supabase
     * This creates the baseline that users will validate
     */
    async logDetection(detection) {
        if (!this.supabase) {
            logger.debug('[UnifiedPipeline] ⚠️ Offline mode - detection not logged');
            return null;
        }
        try {
            const { data, error } = await this.supabase
                .from('algorithm_detections')
                .insert({
                content_fingerprint: detection.contentFingerprint,
                content_type: detection.contentType,
                content_id: detection.contentId,
                timestamp_in_content: detection.timestampInContent,
                category: detection.category,
                confidence: detection.confidence,
                source: detection.source,
                algorithm_version: detection.algorithmVersion,
                user_id: this.userId,
                session_id: this.sessionId
            })
                .select('id')
                .single();
            if (error) {
                logger.error('[UnifiedPipeline] ❌ Failed to log detection:', error);
                return null;
            }
            this.stats.detectionsLogged++;
            logger.debug(`[UnifiedPipeline] ✅ Logged detection: ${detection.category} (${data.id})`);
            return data.id;
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error logging detection:', error);
            return null;
        }
    }
    /**
     * Batch log detections (more efficient)
     */
    async logDetectionBatch(detections) {
        if (!this.supabase || detections.length === 0)
            return 0;
        try {
            const records = detections.map(d => ({
                content_fingerprint: d.contentFingerprint,
                content_type: d.contentType,
                content_id: d.contentId,
                timestamp_in_content: d.timestampInContent,
                category: d.category,
                confidence: d.confidence,
                source: d.source,
                algorithm_version: d.algorithmVersion,
                user_id: this.userId,
                session_id: this.sessionId
            }));
            const { data, error } = await this.supabase
                .from('algorithm_detections')
                .insert(records)
                .select('id');
            if (error) {
                logger.error('[UnifiedPipeline] ❌ Failed to batch log detections:', error);
                return 0;
            }
            const count = data?.length || 0;
            this.stats.detectionsLogged += count;
            logger.debug(`[UnifiedPipeline] ✅ Batch logged ${count} detections`);
            return count;
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error batch logging:', error);
            return 0;
        }
    }
    // ========================================
    // 2. SUBMIT USER FEEDBACK ON ALGORITHM
    // ========================================
    /**
     * Submit user feedback on an algorithm detection
     * This trains the algorithm and adjusts thresholds
     */
    async submitDetectionFeedback(feedback) {
        if (!this.supabase) {
            logger.debug('[UnifiedPipeline] ⚠️ Offline mode - feedback not submitted');
            return false;
        }
        try {
            const { error } = await this.supabase
                .from('detection_feedback')
                .insert({
                detection_id: feedback.detectionId,
                content_fingerprint: feedback.contentFingerprint,
                feedback_type: feedback.feedbackType,
                user_id: this.userId,
                user_comment: feedback.userComment,
                severity_adjustment: feedback.severityAdjustment
            });
            if (error) {
                logger.error('[UnifiedPipeline] ❌ Failed to submit feedback:', error);
                return false;
            }
            this.stats.feedbackSubmitted++;
            logger.debug(`[UnifiedPipeline] ✅ Submitted feedback: ${feedback.feedbackType}`);
            return true;
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error submitting feedback:', error);
            return false;
        }
    }
    // ========================================
    // 3. SUBMIT COMMUNITY TRIGGER (Helper Mode)
    // ========================================
    /**
     * Submit a community trigger (Helper Mode contribution)
     */
    async submitCommunityTrigger(trigger) {
        if (!this.supabase) {
            logger.debug('[UnifiedPipeline] ⚠️ Offline mode - trigger not submitted');
            return null;
        }
        try {
            const { data, error } = await this.supabase
                .from('community_triggers')
                .insert({
                category: trigger.category,
                pattern_type: trigger.patternType,
                pattern_value: trigger.patternValue,
                description: trigger.description,
                content_fingerprint: trigger.contentFingerprint,
                content_type: trigger.contentType,
                content_id: trigger.contentId,
                timestamp_in_content: trigger.timestampInContent,
                contributor_id: this.userId
            })
                .select('id')
                .single();
            if (error) {
                logger.error('[UnifiedPipeline] ❌ Failed to submit trigger:', error);
                return null;
            }
            this.stats.triggersContributed++;
            logger.info(`[UnifiedPipeline] 🎉 Community trigger submitted: ${trigger.category} - "${trigger.patternValue}" (${data.id})`);
            return data.id;
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error submitting trigger:', error);
            return null;
        }
    }
    // ========================================
    // 4. VALIDATE COMMUNITY TRIGGERS
    // ========================================
    /**
     * Vote on a community trigger
     * This is how users validate each other's contributions
     */
    async validateCommunityTrigger(feedback) {
        if (!this.supabase) {
            logger.debug('[UnifiedPipeline] ⚠️ Offline mode - validation not submitted');
            return false;
        }
        try {
            // Submit vote
            const { error } = await this.supabase
                .from('community_trigger_feedback')
                .insert({
                trigger_id: feedback.triggerId,
                vote_type: feedback.voteType,
                content_fingerprint: feedback.contentFingerprint,
                matched_correctly: feedback.matchedCorrectly,
                user_id: this.userId,
                comment: feedback.comment
            });
            if (error) {
                // Might be duplicate vote (UNIQUE constraint)
                if (error.code === '23505') {
                    logger.debug('[UnifiedPipeline] ⚠️ User already voted on this trigger');
                    return false;
                }
                logger.error('[UnifiedPipeline] ❌ Failed to validate trigger:', error);
                return false;
            }
            this.stats.triggersValidated++;
            logger.debug(`[UnifiedPipeline] ✅ Validated trigger: ${feedback.voteType}`);
            // Update trigger stats (async - don't wait)
            this.updateTriggerStats(feedback.triggerId, feedback.voteType, feedback.matchedCorrectly);
            // Check if trigger should be promoted (async - don't wait)
            this.checkTriggerPromotion(feedback.triggerId);
            return true;
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error validating trigger:', error);
            return false;
        }
    }
    // ========================================
    // FEEDBACK LOOPS & PROMOTION
    // ========================================
    /**
     * Update community trigger statistics
     */
    async updateTriggerStats(triggerId, voteType, matchedCorrectly) {
        if (!this.supabase)
            return;
        try {
            // Get current trigger
            const { data: trigger, error: fetchError } = await this.supabase
                .from('community_triggers')
                .select('*')
                .eq('id', triggerId)
                .single();
            if (fetchError || !trigger)
                return;
            // Update counters
            const updates = {
                times_validated: (trigger.times_validated || 0) + 1
            };
            if (voteType === 'false_positive') {
                updates.false_positive_count = (trigger.false_positive_count || 0) + 1;
            }
            if (voteType === 'confirmed' && matchedCorrectly) {
                updates.times_matched = (trigger.times_matched || 0) + 1;
            }
            await this.supabase
                .from('community_triggers')
                .update(updates)
                .eq('id', triggerId);
            // Recalculate validation score
            await this.recalculateValidationScore(triggerId);
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error updating trigger stats:', error);
        }
    }
    /**
     * Recalculate validation score for a trigger
     */
    async recalculateValidationScore(triggerId) {
        if (!this.supabase)
            return;
        try {
            // Get all votes for this trigger
            const { data: votes, error } = await this.supabase
                .from('community_trigger_feedback')
                .select('vote_type, matched_correctly')
                .eq('trigger_id', triggerId);
            if (error || !votes || votes.length === 0)
                return;
            // Calculate score (0-1)
            const helpful = votes.filter((v) => v.vote_type === 'helpful').length;
            const confirmed = votes.filter((v) => v.vote_type === 'confirmed').length;
            const notHelpful = votes.filter((v) => v.vote_type === 'not_helpful').length;
            const falsePositive = votes.filter((v) => v.vote_type === 'false_positive').length;
            const total = votes.length;
            const positiveVotes = helpful + confirmed;
            const negativeVotes = notHelpful + falsePositive;
            // Validation score: (positive - negative) / total, normalized to 0-1
            const rawScore = total > 0 ? (positiveVotes - negativeVotes) / total : 0;
            const normalizedScore = (rawScore + 1) / 2; // Map from [-1, 1] to [0, 1]
            // Update trigger
            await this.supabase
                .from('community_triggers')
                .update({ validation_score: normalizedScore })
                .eq('id', triggerId);
            // Update stats
            this.stats.avgValidationScore = normalizedScore;
            logger.debug(`[UnifiedPipeline] 📊 Updated validation score: ${normalizedScore.toFixed(2)} (${total} votes)`);
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error recalculating score:', error);
        }
    }
    /**
     * Check if trigger should be promoted to main database
     */
    async checkTriggerPromotion(triggerId) {
        if (!this.supabase)
            return;
        try {
            // Get trigger with stats
            const { data: trigger, error } = await this.supabase
                .from('community_triggers')
                .select('*')
                .eq('id', triggerId)
                .single();
            if (error || !trigger)
                return;
            // Skip if already promoted/rejected
            if (trigger.status !== 'pending')
                return;
            const voteCount = trigger.times_validated || 0;
            const validationScore = trigger.validation_score || 0;
            const falsePositiveRate = trigger.times_matched > 0
                ? (trigger.false_positive_count || 0) / trigger.times_matched
                : 0;
            // Check promotion criteria
            if (voteCount >= this.PROMOTION_CRITERIA.minVotes &&
                validationScore >= this.PROMOTION_CRITERIA.minValidationScore &&
                falsePositiveRate <= this.PROMOTION_CRITERIA.maxFalsePositiveRate) {
                // PROMOTE!
                await this.promoteTrigger(trigger);
            }
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error checking promotion:', error);
        }
    }
    /**
     * Promote community trigger to main database
     */
    async promoteTrigger(trigger) {
        if (!this.supabase)
            return;
        try {
            const falsePositiveRate = trigger.timesMatched && trigger.timesMatched > 0
                ? (trigger.falsePositiveCount || 0) / trigger.timesMatched
                : 0;
            // 1. Add to promoted triggers table
            const { data, error } = await this.supabase
                .from('promoted_triggers')
                .insert({
                community_trigger_id: trigger.id,
                validation_score: trigger.validationScore,
                consensus_threshold: this.PROMOTION_CRITERIA.minValidationScore,
                vote_count: trigger.timesValidated,
                false_positive_rate: falsePositiveRate
            })
                .select('id')
                .single();
            if (error) {
                logger.error('[UnifiedPipeline] ❌ Failed to promote trigger:', error);
                return;
            }
            // 2. Update trigger status
            await this.supabase
                .from('community_triggers')
                .update({ status: 'promoted' })
                .eq('id', trigger.id);
            this.stats.triggersPromoted++;
            logger.info(`[UnifiedPipeline] 🎉 TRIGGER PROMOTED! ` +
                `${trigger.category}: "${trigger.patternValue}" ` +
                `(score: ${trigger.validationScore?.toFixed(2)}, votes: ${trigger.timesValidated})`);
            // 3. Invalidate cache so it's reloaded with new trigger
            this.invalidateCache();
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error promoting trigger:', error);
        }
    }
    // ========================================
    // QUERY & RETRIEVAL
    // ========================================
    /**
     * Get performance metrics for specific content
     */
    async getContentPerformance(contentFingerprint) {
        if (!this.supabase)
            return [];
        try {
            const { data, error } = await this.supabase
                .from('trigger_performance')
                .select('*')
                .eq('content_fingerprint', contentFingerprint);
            if (error) {
                logger.error('[UnifiedPipeline] ❌ Failed to get performance:', error);
                return [];
            }
            // Update consensus score stats
            if (data && data.length > 0) {
                const avgConsensus = data.reduce((sum, d) => sum + d.consensus_score, 0) / data.length;
                this.stats.avgConsensusScore = avgConsensus;
            }
            return data || [];
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error getting performance:', error);
            return [];
        }
    }
    /**
     * Get approved community triggers for a category (with caching)
     */
    async getApprovedTriggers(category) {
        // Check cache first
        if (category && this.isCacheValid()) {
            const cached = this.approvedTriggersCache.get(category);
            if (cached) {
                logger.debug(`[UnifiedPipeline] ✅ Cache hit for ${category} triggers`);
                return cached;
            }
        }
        if (!this.supabase)
            return [];
        try {
            let query = this.supabase
                .from('community_triggers')
                .select('*')
                .in('status', ['approved', 'promoted'])
                .order('validation_score', { ascending: false });
            if (category) {
                query = query.eq('category', category);
            }
            const { data, error } = await query;
            if (error) {
                logger.error('[UnifiedPipeline] ❌ Failed to get triggers:', error);
                return [];
            }
            const triggers = data || [];
            // Update cache
            if (category) {
                this.approvedTriggersCache.set(category, triggers);
                this.cacheLastUpdated = Date.now();
            }
            logger.debug(`[UnifiedPipeline] ✅ Loaded ${triggers.length} approved triggers for ${category || 'all categories'}`);
            return triggers;
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error getting triggers:', error);
            return [];
        }
    }
    /**
     * Get user's contribution history
     */
    async getUserContributions() {
        if (!this.supabase) {
            return { triggers: [], feedback: [], validations: [] };
        }
        try {
            const [triggersResult, feedbackResult, validationsResult] = await Promise.all([
                // Triggers submitted
                this.supabase
                    .from('community_triggers')
                    .select('*')
                    .eq('contributor_id', this.userId)
                    .order('contributed_at', { ascending: false }),
                // Feedback provided
                this.supabase
                    .from('detection_feedback')
                    .select('*')
                    .eq('user_id', this.userId)
                    .order('provided_at', { ascending: false }),
                // Trigger validations
                this.supabase
                    .from('community_trigger_feedback')
                    .select('*')
                    .eq('user_id', this.userId)
                    .order('voted_at', { ascending: false })
            ]);
            return {
                triggers: triggersResult.data || [],
                feedback: feedbackResult.data || [],
                validations: validationsResult.data || []
            };
        }
        catch (error) {
            logger.error('[UnifiedPipeline] ❌ Error getting contributions:', error);
            return { triggers: [], feedback: [], validations: [] };
        }
    }
    // ========================================
    // CACHE MANAGEMENT
    // ========================================
    /**
     * Check if cache is still valid
     */
    isCacheValid() {
        return Date.now() - this.cacheLastUpdated < this.CACHE_TTL;
    }
    /**
     * Invalidate cache (call after promotion or updates)
     */
    invalidateCache() {
        this.approvedTriggersCache.clear();
        this.cacheLastUpdated = 0;
        logger.debug('[UnifiedPipeline] 🧹 Cache invalidated');
    }
    /**
     * Preload approved triggers for all categories (on startup)
     */
    async preloadApprovedTriggers() {
        logger.info('[UnifiedPipeline] 🔄 Preloading approved triggers...');
        const categories = [
            'blood', 'gore', 'violence', 'murder', 'torture', 'child_abuse',
            'sex', 'sexual_assault', 'death_dying', 'suicide', 'self_harm', 'eating_disorders',
            'animal_cruelty', 'natural_disasters', 'medical_procedures', 'vomit',
            'claustrophobia_triggers', 'pregnancy_childbirth', 'slurs', 'hate_speech',
            'gunshots', 'explosions'
        ];
        // Load all in parallel
        await Promise.all(categories.map(category => this.getApprovedTriggers(category)));
        logger.info('[UnifiedPipeline] ✅ Preloaded approved triggers for all 28 categories');
    }
    // ========================================
    // UTILITIES
    // ========================================
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Clear local state (not Supabase data)
     */
    clear() {
        this.sessionId = this.generateSessionId();
        this.invalidateCache();
        this.stats = {
            detectionsLogged: 0,
            feedbackSubmitted: 0,
            triggersContributed: 0,
            triggersValidated: 0,
            triggersPromoted: 0,
            avgValidationScore: 0,
            avgConsensusScore: 0
        };
        logger.info('[UnifiedPipeline] 🧹 Cleared local pipeline state');
    }
}
// Singleton instance (will be initialized with config)
let pipelineInstance = null;
export function initializeUnifiedPipeline(supabaseUrl, supabaseKey, userId) {
    pipelineInstance = new UnifiedContributionPipeline(supabaseUrl, supabaseKey, userId);
    return pipelineInstance;
}
export function getUnifiedPipeline() {
    return pipelineInstance;
}
//# sourceMappingURL=UnifiedContributionPipeline.js.map