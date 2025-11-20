/**
 * ALGORITHM 3.0 - PHASE 10: INNOVATION #36
 * Reward Shaping & Feedback
 *
 * Converts user feedback (confirmations, dismissals, reports) into structured
 * rewards that guide the RL agent toward better detection policies. Implements
 * immediate, delayed, and intrinsic rewards with normalization.
 *
 * Research: Ng et al. (1999) - Policy Invariance Under Reward Shaping
 *           Proper reward shaping accelerates learning without changing optimal policy
 *
 * Equal Treatment: All 28 categories benefit from same reward structure
 */
import { logger } from '../utils/Logger';
/**
 * Reward Shaper
 *
 * Converts user feedback into structured rewards for RL
 */
export class RewardShaper {
    // Reward parameters
    REWARD_CORRECT_DETECTION = 1.0;
    REWARD_FALSE_POSITIVE = -0.5;
    REWARD_FALSE_NEGATIVE = -0.8;
    REWARD_HELPFUL = 0.3;
    REWARD_NOT_HELPFUL = -0.2;
    // Reward shaping parameters
    CONFIDENCE_BONUS_SCALE = 0.2;
    TEMPORAL_DECAY = 0.95;
    EXPLORATION_BONUS_SCALE = 0.1;
    // Reward history (for delayed rewards)
    rewardHistory = new Map();
    // Statistics
    stats = {
        totalFeedback: 0,
        confirmCount: 0,
        dismissCount: 0,
        reportCount: 0,
        avgImmediateReward: 0,
        avgDelayedReward: 0,
        avgIntrinsicReward: 0,
        avgTotalReward: 0,
        rewardVariance: 0
    };
    constructor() {
        logger.info('[RewardShaper] 🎁 Reward Shaper initialized');
        logger.info('[RewardShaper] 🔄 Converting user feedback to RL rewards');
    }
    // ========================================
    // REWARD SHAPING
    // ========================================
    /**
     * Shape reward from user feedback
     */
    shapeReward(feedback) {
        this.stats.totalFeedback++;
        // Step 1: Compute immediate reward (base feedback)
        const immediateReward = this.computeImmediateReward(feedback);
        // Step 2: Compute delayed reward (long-term satisfaction)
        const delayedReward = this.computeDelayedReward(feedback);
        // Step 3: Compute intrinsic reward (exploration bonus)
        const intrinsicReward = this.computeIntrinsicReward(feedback);
        // Step 4: Breakdown components
        const rewardBreakdown = {
            base: immediateReward,
            confidence: this.computeConfidenceBonus(feedback),
            temporal: this.computeTemporalBonus(feedback),
            exploration: intrinsicReward
        };
        // Step 5: Total reward
        const totalReward = immediateReward + delayedReward + intrinsicReward;
        // Store in history
        this.storeReward(feedback.category, totalReward);
        // Update statistics
        this.updateStats(immediateReward, delayedReward, intrinsicReward, totalReward);
        logger.debug(`[RewardShaper] ${feedback.type} → R=${totalReward.toFixed(2)} ` +
            `(immediate=${immediateReward.toFixed(2)}, delayed=${delayedReward.toFixed(2)}, intrinsic=${intrinsicReward.toFixed(2)})`);
        return {
            immediateReward,
            delayedReward,
            intrinsicReward,
            totalReward,
            rewardBreakdown
        };
    }
    // ========================================
    // IMMEDIATE REWARDS
    // ========================================
    /**
     * Compute immediate reward from feedback
     */
    computeImmediateReward(feedback) {
        let baseReward = 0;
        switch (feedback.type) {
            case 'confirm':
                baseReward = this.REWARD_CORRECT_DETECTION;
                this.stats.confirmCount++;
                break;
            case 'dismiss':
                baseReward = this.REWARD_FALSE_POSITIVE;
                this.stats.dismissCount++;
                break;
            case 'report':
                baseReward = this.REWARD_FALSE_NEGATIVE;
                this.stats.reportCount++;
                break;
            case 'helpful':
                baseReward = this.REWARD_HELPFUL;
                break;
            case 'not-helpful':
                baseReward = this.REWARD_NOT_HELPFUL;
                break;
        }
        // Apply confidence bonus/penalty
        const confidenceBonus = this.computeConfidenceBonus(feedback);
        return baseReward + confidenceBonus;
    }
    /**
     * Compute confidence-based bonus
     */
    computeConfidenceBonus(feedback) {
        // Reward high confidence correct detections more
        // Penalize high confidence false positives more
        const confidenceScore = feedback.confidence;
        if (feedback.type === 'confirm') {
            // Correct detection: reward high confidence
            return this.CONFIDENCE_BONUS_SCALE * confidenceScore;
        }
        else if (feedback.type === 'dismiss') {
            // False positive: penalize high confidence
            return -this.CONFIDENCE_BONUS_SCALE * confidenceScore;
        }
        else if (feedback.type === 'report') {
            // False negative: penalize low confidence (should have been higher)
            return -this.CONFIDENCE_BONUS_SCALE * (1 - confidenceScore);
        }
        return 0;
    }
    // ========================================
    // DELAYED REWARDS
    // ========================================
    /**
     * Compute delayed reward (long-term user satisfaction)
     */
    computeDelayedReward(feedback) {
        // Get recent reward history for this category
        const history = this.rewardHistory.get(feedback.category) || [];
        if (history.length === 0) {
            return 0;
        }
        // Compute moving average of recent rewards
        const recentRewards = history.slice(-10); // Last 10 rewards
        const avgRecentReward = recentRewards.reduce((sum, r) => sum + r, 0) / recentRewards.length;
        // Delayed reward = bonus if improving, penalty if degrading
        return avgRecentReward * 0.1; // Small delayed component
    }
    /**
     * Compute temporal bonus (recent feedback more important)
     */
    computeTemporalBonus(feedback) {
        // Get time since last feedback for this category
        const history = this.rewardHistory.get(feedback.category) || [];
        if (history.length === 0) {
            return 0;
        }
        // Temporal decay: recent feedback weighted more
        const timeSinceLastFeedback = Date.now() - feedback.timestamp;
        const hours = timeSinceLastFeedback / (1000 * 60 * 60);
        const temporalWeight = Math.pow(this.TEMPORAL_DECAY, hours);
        return 0.05 * temporalWeight; // Small temporal bonus
    }
    // ========================================
    // INTRINSIC REWARDS
    // ========================================
    /**
     * Compute intrinsic reward (exploration bonus)
     */
    computeIntrinsicReward(feedback) {
        // Encourage exploration of under-explored state-action pairs
        // Bonus for novel feedback patterns
        const history = this.rewardHistory.get(feedback.category) || [];
        // Novelty bonus: higher for categories with less feedback
        const noveltyBonus = this.EXPLORATION_BONUS_SCALE / (1 + history.length);
        // Uncertainty bonus: higher for uncertain detections (confidence near 0.5)
        const uncertainty = 1 - Math.abs(feedback.confidence - 0.5) * 2;
        const uncertaintyBonus = this.EXPLORATION_BONUS_SCALE * uncertainty * 0.5;
        return noveltyBonus + uncertaintyBonus;
    }
    // ========================================
    // REWARD NORMALIZATION
    // ========================================
    /**
     * Normalize reward to [-1, 1]
     */
    normalizeReward(reward) {
        // Clip to reasonable range
        return Math.max(-1, Math.min(1, reward));
    }
    /**
     * Apply reward discount (for temporal credit assignment)
     */
    discountReward(reward, steps, gamma = 0.95) {
        return reward * Math.pow(gamma, steps);
    }
    // ========================================
    // REWARD HISTORY
    // ========================================
    /**
     * Store reward in history
     */
    storeReward(category, reward) {
        let history = this.rewardHistory.get(category);
        if (!history) {
            history = [];
            this.rewardHistory.set(category, history);
        }
        history.push(reward);
        // Limit history size
        if (history.length > 100) {
            history.shift();
        }
    }
    /**
     * Get reward history for category
     */
    getRewardHistory(category) {
        return [...(this.rewardHistory.get(category) || [])];
    }
    /**
     * Get average reward for category
     */
    getAverageReward(category) {
        const history = this.rewardHistory.get(category) || [];
        if (history.length === 0)
            return 0;
        return history.reduce((sum, r) => sum + r, 0) / history.length;
    }
    // ========================================
    // FEEDBACK ANALYSIS
    // ========================================
    /**
     * Analyze feedback patterns
     */
    analyzeFeedback(category) {
        const history = this.rewardHistory.get(category) || [];
        if (history.length === 0) {
            return {
                avgReward: 0,
                rewardTrend: 'stable',
                feedbackCount: 0
            };
        }
        const avgReward = history.reduce((sum, r) => sum + r, 0) / history.length;
        // Compute trend (recent vs old)
        const recentSize = Math.min(10, Math.floor(history.length / 2));
        const recent = history.slice(-recentSize);
        const old = history.slice(0, recentSize);
        const avgRecent = recent.reduce((sum, r) => sum + r, 0) / recent.length;
        const avgOld = old.reduce((sum, r) => sum + r, 0) / old.length;
        let rewardTrend;
        if (avgRecent > avgOld + 0.1) {
            rewardTrend = 'improving';
        }
        else if (avgRecent < avgOld - 0.1) {
            rewardTrend = 'degrading';
        }
        else {
            rewardTrend = 'stable';
        }
        return {
            avgReward,
            rewardTrend,
            feedbackCount: history.length
        };
    }
    // ========================================
    // STATISTICS
    // ========================================
    /**
     * Update statistics
     */
    updateStats(immediate, delayed, intrinsic, total) {
        const n = this.stats.totalFeedback;
        this.stats.avgImmediateReward =
            (this.stats.avgImmediateReward * (n - 1) + immediate) / n;
        this.stats.avgDelayedReward =
            (this.stats.avgDelayedReward * (n - 1) + delayed) / n;
        this.stats.avgIntrinsicReward =
            (this.stats.avgIntrinsicReward * (n - 1) + intrinsic) / n;
        this.stats.avgTotalReward =
            (this.stats.avgTotalReward * (n - 1) + total) / n;
        // Compute variance
        this.updateRewardVariance(total);
    }
    /**
     * Update reward variance
     */
    updateRewardVariance(reward) {
        // Running variance calculation
        const oldMean = this.stats.avgTotalReward;
        const n = this.stats.totalFeedback;
        const delta = reward - oldMean;
        const newVariance = ((n - 1) * this.stats.rewardVariance + delta * delta) / n;
        this.stats.rewardVariance = newVariance;
    }
    /**
     * Get statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Clear state
     */
    clear() {
        this.rewardHistory.clear();
        this.stats = {
            totalFeedback: 0,
            confirmCount: 0,
            dismissCount: 0,
            reportCount: 0,
            avgImmediateReward: 0,
            avgDelayedReward: 0,
            avgIntrinsicReward: 0,
            avgTotalReward: 0,
            rewardVariance: 0
        };
        logger.info('[RewardShaper] 🧹 Cleared reward shaper state');
    }
}
// Singleton instance
export const rewardShaper = new RewardShaper();
//# sourceMappingURL=RewardShaper.js.map