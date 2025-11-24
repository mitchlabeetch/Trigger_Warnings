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
import type { TriggerCategory } from '../types/triggers';
/**
 * Detection sources
 */
export type DetectionSource = 'algorithm' | 'database' | 'community' | 'helper_mode';
/**
 * Feedback types for algorithm detections
 */
export type DetectionFeedbackType = 'dismissed' | 'reported_missed' | 'severity_too_high' | 'severity_too_low' | 'confirmed_accurate' | 'false_positive';
/**
 * Feedback types for community triggers
 */
export type CommunityTriggerVote = 'helpful' | 'not_helpful' | 'false_positive' | 'confirmed';
/**
 * Algorithm detection record
 */
export interface AlgorithmDetection {
    id?: string;
    contentFingerprint: string;
    contentType: string;
    contentId?: string;
    timestampInContent?: number;
    category: TriggerCategory;
    confidence: number;
    source: DetectionSource;
    algorithmVersion: string;
    userId?: string;
    sessionId?: string;
    detectedAt?: Date;
}
/**
 * User feedback on detection
 */
export interface DetectionFeedback {
    id?: string;
    detectionId?: string;
    contentFingerprint: string;
    feedbackType: DetectionFeedbackType;
    userId: string;
    userComment?: string;
    severityAdjustment?: number;
    providedAt?: Date;
}
/**
 * Community trigger
 */
export interface CommunityTrigger {
    id?: string;
    category: TriggerCategory;
    patternType: 'keyword' | 'phrase' | 'regex' | 'visual' | 'audio';
    patternValue: string;
    description?: string;
    contentFingerprint?: string;
    contentType?: string;
    contentId?: string;
    timestampInContent?: number;
    contributorId: string;
    contributedAt?: Date;
    status?: 'pending' | 'approved' | 'rejected' | 'promoted';
    validationScore?: number;
    timesMatched?: number;
    timesValidated?: number;
    falsePositiveCount?: number;
}
/**
 * Feedback on community trigger
 */
export interface CommunityTriggerFeedback {
    id?: string;
    triggerId: string;
    voteType: CommunityTriggerVote;
    contentFingerprint?: string;
    matchedCorrectly?: boolean;
    userId: string;
    comment?: string;
    votedAt?: Date;
}
/**
 * Aggregated performance metrics
 */
export interface TriggerPerformance {
    contentFingerprint: string;
    category: TriggerCategory;
    algorithmDetections: number;
    avgAlgorithmConfidence: number;
    communityDetections: number;
    confirmedCount: number;
    falsePositiveCount: number;
    missedCount: number;
    consensusScore: number;
}
/**
 * Pipeline statistics
 */
interface PipelineStats {
    detectionsLogged: number;
    feedbackSubmitted: number;
    triggersContributed: number;
    triggersValidated: number;
    triggersPromoted: number;
    avgValidationScore: number;
    avgConsensusScore: number;
}
/**
 * Unified Contribution Pipeline
 *
 * Central system that manages all 4 sources and creates feedback loops
 */
export declare class UnifiedContributionPipeline {
    private supabaseUrl;
    private supabaseKey;
    private supabase;
    private userId;
    private sessionId;
    private readonly PROMOTION_CRITERIA;
    private stats;
    private approvedTriggersCache;
    private cacheLastUpdated;
    private readonly CACHE_TTL;
    constructor(supabaseUrl: string, supabaseKey: string, userId: string);
    /**
     * Initialize Supabase client (lazy loading)
     */
    private initializeSupabase;
    /**
     * Log an algorithm detection to Supabase
     * This creates the baseline that users will validate
     */
    logDetection(detection: AlgorithmDetection): Promise<string | null>;
    /**
     * Batch log detections (more efficient)
     */
    logDetectionBatch(detections: AlgorithmDetection[]): Promise<number>;
    /**
     * Submit user feedback on an algorithm detection
     * This trains the algorithm and adjusts thresholds
     */
    submitDetectionFeedback(feedback: DetectionFeedback): Promise<boolean>;
    /**
     * Submit a community trigger (Helper Mode contribution)
     */
    submitCommunityTrigger(trigger: CommunityTrigger): Promise<string | null>;
    /**
     * Vote on a community trigger
     * This is how users validate each other's contributions
     */
    validateCommunityTrigger(feedback: CommunityTriggerFeedback): Promise<boolean>;
    /**
     * Update community trigger statistics
     */
    private updateTriggerStats;
    /**
     * Recalculate validation score for a trigger
     */
    private recalculateValidationScore;
    /**
     * Check if trigger should be promoted to main database
     */
    private checkTriggerPromotion;
    /**
     * Promote community trigger to main database
     */
    private promoteTrigger;
    /**
     * Get performance metrics for specific content
     */
    getContentPerformance(contentFingerprint: string): Promise<TriggerPerformance[]>;
    /**
     * Get approved community triggers for a category (with caching)
     */
    getApprovedTriggers(category?: TriggerCategory): Promise<CommunityTrigger[]>;
    /**
     * Get user's contribution history
     */
    getUserContributions(): Promise<{
        triggers: CommunityTrigger[];
        feedback: DetectionFeedback[];
        validations: CommunityTriggerFeedback[];
    }>;
    /**
     * Check if cache is still valid
     */
    private isCacheValid;
    /**
     * Invalidate cache (call after promotion or updates)
     */
    private invalidateCache;
    /**
     * Preload approved triggers for all categories (on startup)
     */
    preloadApprovedTriggers(): Promise<void>;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Get statistics
     */
    getStats(): PipelineStats;
    /**
     * Clear local state (not Supabase data)
     */
    clear(): void;
}
export declare function initializeUnifiedPipeline(supabaseUrl: string, supabaseKey: string, userId: string): UnifiedContributionPipeline;
export declare function getUnifiedPipeline(): UnifiedContributionPipeline | null;
export {};
//# sourceMappingURL=UnifiedContributionPipeline.d.ts.map