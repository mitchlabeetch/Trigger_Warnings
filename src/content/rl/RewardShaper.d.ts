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
import type { TriggerCategory } from '../types/triggers';
/**
 * User feedback type
 */
export type FeedbackType = 'confirm' | 'dismiss' | 'report' | 'helpful' | 'not-helpful';
/**
 * Feedback event
 */
export interface FeedbackEvent {
    type: FeedbackType;
    category: TriggerCategory;
    confidence: number;
    timestamp: number;
    severity?: 'low' | 'medium' | 'high';
    userSensitivity?: 'low' | 'medium' | 'high';
    detectionCorrect?: boolean;
}
/**
 * Shaped reward
 */
export interface ShapedReward {
    immediateReward: number;
    delayedReward: number;
    intrinsicReward: number;
    totalReward: number;
    rewardBreakdown: {
        base: number;
        confidence: number;
        temporal: number;
        exploration: number;
    };
}
/**
 * Reward statistics
 */
interface RewardStats {
    totalFeedback: number;
    confirmCount: number;
    dismissCount: number;
    reportCount: number;
    avgImmediateReward: number;
    avgDelayedReward: number;
    avgIntrinsicReward: number;
    avgTotalReward: number;
    rewardVariance: number;
}
/**
 * Reward Shaper
 *
 * Converts user feedback into structured rewards for RL
 */
export declare class RewardShaper {
    private readonly REWARD_CORRECT_DETECTION;
    private readonly REWARD_FALSE_POSITIVE;
    private readonly REWARD_FALSE_NEGATIVE;
    private readonly REWARD_HELPFUL;
    private readonly REWARD_NOT_HELPFUL;
    private readonly CONFIDENCE_BONUS_SCALE;
    private readonly TEMPORAL_DECAY;
    private readonly EXPLORATION_BONUS_SCALE;
    private rewardHistory;
    private stats;
    constructor();
    /**
     * Shape reward from user feedback
     */
    shapeReward(feedback: FeedbackEvent): ShapedReward;
    /**
     * Compute immediate reward from feedback
     */
    private computeImmediateReward;
    /**
     * Compute confidence-based bonus
     */
    private computeConfidenceBonus;
    /**
     * Compute delayed reward (long-term user satisfaction)
     */
    private computeDelayedReward;
    /**
     * Compute temporal bonus (recent feedback more important)
     */
    private computeTemporalBonus;
    /**
     * Compute intrinsic reward (exploration bonus)
     */
    private computeIntrinsicReward;
    /**
     * Normalize reward to [-1, 1]
     */
    normalizeReward(reward: number): number;
    /**
     * Apply reward discount (for temporal credit assignment)
     */
    discountReward(reward: number, steps: number, gamma?: number): number;
    /**
     * Store reward in history
     */
    private storeReward;
    /**
     * Get reward history for category
     */
    getRewardHistory(category: TriggerCategory): number[];
    /**
     * Get average reward for category
     */
    getAverageReward(category: TriggerCategory): number;
    /**
     * Analyze feedback patterns
     */
    analyzeFeedback(category: TriggerCategory): {
        avgReward: number;
        rewardTrend: 'improving' | 'stable' | 'degrading';
        feedbackCount: number;
    };
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Update reward variance
     */
    private updateRewardVariance;
    /**
     * Get statistics
     */
    getStats(): RewardStats;
    /**
     * Clear state
     */
    clear(): void;
}
export declare const rewardShaper: RewardShaper;
export {};
//# sourceMappingURL=RewardShaper.d.ts.map