/**
 * PERSONALIZED DETECTOR - Algorithm 3.0 Innovation #30
 *
 * Applies user sensitivity profiles to detections, deciding whether to warn
 * based on each user's individual preferences for ALL 28 categories.
 *
 * Features:
 * - Per-category threshold application
 * - Context-aware decisions
 * - Time-based adjustments (nighttime, stress mode)
 * - Adaptive learning from user feedback
 * - Progressive desensitization tracking
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */
import type { TriggerCategory } from '@shared/types/Warning.types';
import type { Detection } from '../routing/DetectionRouter';
import type { ContentContext, UserSensitivityProfile } from './UserSensitivityProfile';
/**
 * User feedback on a detection
 */
export interface UserFeedback {
    detectionId: string;
    category: TriggerCategory;
    action: 'dismissed' | 'confirmed-helpful' | 'reported-miss' | 'blocked-category';
    timestamp: number;
    confidence: number;
}
/**
 * Personalized detection decision
 */
export interface PersonalizedDecision {
    shouldWarn: boolean;
    threshold: number;
    confidence: number;
    reasonsForDecision: string[];
    adjustmentsApplied: {
        contextAdjustment?: string;
        timeAdjustment?: string;
        stressAdjustment?: string;
        adaptiveAdjustment?: string;
    };
}
/**
 * User Profile Interface
 * Exported for use in other modules
 */
export interface UserProfile extends UserSensitivityProfile {
}
/**
 * Personalized Detector
 *
 * Decides whether to warn users based on their personal sensitivity profiles
 */
export declare class PersonalizedDetector {
    private feedbackHistory;
    private stats;
    /**
     * Decide whether to warn user about a detection
     */
    shouldWarn(detection: Detection, context?: ContentContext): PersonalizedDecision;
    /**
     * Default decision when no profile loaded
     */
    private defaultDecision;
    /**
     * Calculate adaptive adjustment based on user feedback history
     *
     * If user frequently dismisses warnings for a category → increase threshold (less sensitive)
     * If user reports misses for a category → decrease threshold (more sensitive)
     */
    private calculateAdaptiveAdjustment;
    /**
     * Process user feedback
     *
     * Learns from user actions to improve future warnings
     */
    processFeedback(feedback: UserFeedback): void;
    /**
     * Block entire category (set to 'off')
     */
    private blockCategory;
    /**
     * Check if nighttime
     */
    private isNighttime;
    /**
     * Get feedback history for a category
     */
    getFeedbackHistory(category: TriggerCategory): UserFeedback[];
    /**
     * Clear feedback history
     */
    clearFeedbackHistory(category?: TriggerCategory): void;
    /**
     * Get statistics
     */
    getStats(): {
        suppressionRate: number;
        totalDecisions: number;
        warned: number;
        suppressed: number;
        adaptiveAdjustments: number;
        contextAdjustments: number;
        timeAdjustments: number;
    };
    /**
     * Generate personalized insights
     */
    generateInsights(): {
        mostSensitiveCategories: TriggerCategory[];
        mostDismissedCategories: TriggerCategory[];
        adaptiveLearningProgress: Record<TriggerCategory, {
            dismissalRate: number;
            adjustments: number;
        }>;
    };
}
/**
 * Export singleton instance
 */
export declare const personalizedDetector: PersonalizedDetector;
/**
 * PERSONALIZATION IN ACTION
 *
 * This detector ensures:
 * ✅ ALL 28 categories respect user sensitivity settings
 * ✅ Adaptive learning from user feedback (dismissals, confirmations, misses)
 * ✅ Context-aware decisions (educational vs fictional vs news)
 * ✅ Time-based adjustments (nighttime +10%, stress mode +20%)
 * ✅ Progressive desensitization support
 * ✅ Transparent decisions with clear reasoning
 *
 * EXAMPLE SCENARIOS:
 * - User dismisses vomit warnings 3 times → Threshold increases from 40% to 45%
 * - User reports miss for eating disorders → Threshold decreases from 60% to 55%
 * - User enables stress mode → All thresholds reduced by 20%
 * - Nighttime (11pm) → All thresholds reduced by 10%
 *
 * **LEARNING SYSTEM THAT RESPECTS EACH USER'S UNIQUE UNIQUE**
 */
//# sourceMappingURL=PersonalizedDetector.d.ts.map