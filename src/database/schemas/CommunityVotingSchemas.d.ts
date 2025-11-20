/**
 * COMMUNITY VOTING SCHEMAS - Algorithm 3.0 Innovation #37
 *
 * Database schemas for Bayesian community voting system that enables
 * community-driven pattern evolution while preventing gaming and spam.
 *
 * **THE VISION:**
 * - Community submits new trigger patterns
 * - Other users vote on pattern quality
 * - Bayesian weighting prevents gaming (new users have less weight)
 * - Expert users (high accuracy) have more voting power
 * - Patterns automatically accepted/rejected based on weighted votes
 *
 * Tables:
 * 1. pattern_submissions - User-submitted trigger patterns
 * 2. votes - User votes on pattern submissions
 * 3. user_expertise - Per-category expertise tracking
 * 4. pattern_performance - Track pattern accuracy over time
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */
import type { TriggerCategory } from '@shared/types/Warning.types';
/**
 * Pattern submission from community
 */
export interface PatternSubmission {
    id: string;
    submittedBy: string;
    category: TriggerCategory;
    patternType: 'keyword' | 'phrase' | 'regex' | 'audio-signature' | 'visual-signature';
    patternData: string;
    description: string;
    examples: string[];
    modality: 'text' | 'audio' | 'visual' | 'multi-modal';
    status: 'pending' | 'under-review' | 'accepted' | 'rejected' | 'flagged';
    totalVotes: number;
    weightedHelpfulScore: number;
    weightedNotHelpfulScore: number;
    createdAt: Date;
    updatedAt: Date;
    reviewedAt?: Date;
    timesMatched?: number;
    falsePositiveRate?: number;
    truePositiveRate?: number;
}
/**
 * Vote on a pattern submission
 */
export interface Vote {
    id: string;
    userId: string;
    patternId: string;
    helpful: boolean;
    voteWeight: number;
    comment?: string;
    reportedIssue?: 'too-broad' | 'too-narrow' | 'offensive' | 'spam' | 'duplicate';
    createdAt: Date;
}
/**
 * User expertise per category
 *
 * Tracks user expertise to weight their votes appropriately
 */
export interface UserExpertise {
    userId: string;
    categoryExpertise: Record<TriggerCategory, number>;
    totalContributions: number;
    acceptedContributions: number;
    rejectedContributions: number;
    totalVotes: number;
    consensusAgreementRate: number;
    reputationScore: number;
    level: 'novice' | 'contributor' | 'expert' | 'guardian';
    accountAge: number;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Pattern performance tracking
 *
 * After a pattern is accepted, track how well it performs
 */
export interface PatternPerformance {
    patternId: string;
    category: TriggerCategory;
    totalMatches: number;
    uniqueVideos: number;
    avgConfidence: number;
    userConfirmedMatches: number;
    userDismissedMatches: number;
    precision: number;
    falsePositiveRate: number;
    weeklyPerformance: Array<{
        week: string;
        matches: number;
        precision: number;
    }>;
    firstMatchedAt?: Date;
    lastMatchedAt?: Date;
    updatedAt: Date;
}
/**
 * User feedback on a matched pattern
 *
 * When a pattern matches and user sees the warning, they can provide feedback
 */
export interface PatternFeedback {
    id: string;
    patternId: string;
    userId: string;
    videoId: string;
    timestamp: number;
    feedback: 'correct' | 'false-positive' | 'should-be-different-category';
    suggestedCategory?: TriggerCategory;
    comment?: string;
    createdAt: Date;
}
/**
 * SQL schema definitions (for PostgreSQL/Supabase)
 */
export declare const SQL_SCHEMAS: {
    /**
     * Pattern submissions table
     */
    pattern_submissions: string;
    /**
     * Votes table
     */
    votes: string;
    /**
     * User expertise table
     */
    user_expertise: string;
    /**
     * Pattern performance table
     */
    pattern_performance: string;
    /**
     * Pattern feedback table
     */
    pattern_feedback: string;
};
/**
 * TypeScript type guards
 */
export declare function isValidPatternType(type: string): type is PatternSubmission['patternType'];
export declare function isValidStatus(status: string): status is PatternSubmission['status'];
export declare function isValidModality(modality: string): modality is PatternSubmission['modality'];
/**
 * COMMUNITY VOTING FOUNDATION
 *
 * These schemas enable:
 * ✅ User-submitted trigger patterns for ALL 28 categories
 * ✅ Bayesian vote weighting (prevents gaming)
 * ✅ Expertise tracking per category
 * ✅ Pattern performance monitoring (precision, false positive rate)
 * ✅ Reputation system (novice → contributor → expert → guardian)
 * ✅ Automatic acceptance/rejection based on weighted votes
 * ✅ User feedback on matched patterns
 *
 * EXAMPLE WORKFLOW:
 * 1. User submits new "vomit" pattern: "feeling queasy"
 * 2. Pattern enters "pending" status
 * 3. Community votes (experts have 1.5x weight, novices 0.5x)
 * 4. Weighted votes: 75% helpful → Auto-accept
 * 5. Pattern added to detection system
 * 6. Track performance: 85% precision → Keep
 * 7. If precision drops below 60% → Flag for review
 *
 * Equal treatment: ALL 28 categories get community contributions
 */
//# sourceMappingURL=CommunityVotingSchemas.d.ts.map