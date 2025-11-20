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
/**
 * SQL schema definitions (for PostgreSQL/Supabase)
 */
export const SQL_SCHEMAS = {
    /**
     * Pattern submissions table
     */
    pattern_submissions: `
    CREATE TABLE pattern_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      submitted_by UUID NOT NULL,
      category VARCHAR(50) NOT NULL,
      pattern_type VARCHAR(20) NOT NULL,
      pattern_data TEXT NOT NULL,
      description TEXT NOT NULL,
      examples JSONB DEFAULT '[]'::jsonb,
      modality VARCHAR(20) NOT NULL,

      status VARCHAR(20) DEFAULT 'pending',
      total_votes INTEGER DEFAULT 0,
      weighted_helpful_score FLOAT DEFAULT 0,
      weighted_not_helpful_score FLOAT DEFAULT 0,

      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      reviewed_at TIMESTAMP,

      times_matched INTEGER DEFAULT 0,
      false_positive_rate FLOAT,
      true_positive_rate FLOAT,

      CONSTRAINT valid_status CHECK (status IN ('pending', 'under-review', 'accepted', 'rejected', 'flagged')),
      CONSTRAINT valid_pattern_type CHECK (pattern_type IN ('keyword', 'phrase', 'regex', 'audio-signature', 'visual-signature')),
      CONSTRAINT valid_modality CHECK (modality IN ('text', 'audio', 'visual', 'multi-modal'))
    );

    CREATE INDEX idx_pattern_submissions_status ON pattern_submissions(status);
    CREATE INDEX idx_pattern_submissions_category ON pattern_submissions(category);
    CREATE INDEX idx_pattern_submissions_submitted_by ON pattern_submissions(submitted_by);
  `,
    /**
     * Votes table
     */
    votes: `
    CREATE TABLE votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      pattern_id UUID NOT NULL REFERENCES pattern_submissions(id) ON DELETE CASCADE,
      helpful BOOLEAN NOT NULL,
      vote_weight FLOAT DEFAULT 1.0,

      comment TEXT,
      reported_issue VARCHAR(20),

      created_at TIMESTAMP DEFAULT NOW(),

      UNIQUE(user_id, pattern_id),  -- One vote per user per pattern
      CONSTRAINT valid_vote_weight CHECK (vote_weight >= 0.5 AND vote_weight <= 2.0),
      CONSTRAINT valid_issue CHECK (reported_issue IN ('too-broad', 'too-narrow', 'offensive', 'spam', 'duplicate') OR reported_issue IS NULL)
    );

    CREATE INDEX idx_votes_pattern_id ON votes(pattern_id);
    CREATE INDEX idx_votes_user_id ON votes(user_id);
  `,
    /**
     * User expertise table
     */
    user_expertise: `
    CREATE TABLE user_expertise (
      user_id UUID PRIMARY KEY,

      category_expertise JSONB NOT NULL DEFAULT '{}'::jsonb,

      total_contributions INTEGER DEFAULT 0,
      accepted_contributions INTEGER DEFAULT 0,
      rejected_contributions INTEGER DEFAULT 0,

      total_votes INTEGER DEFAULT 0,
      consensus_agreement_rate FLOAT DEFAULT 0.5,

      reputation_score INTEGER DEFAULT 0,
      level VARCHAR(20) DEFAULT 'novice',

      account_age INTEGER DEFAULT 0,
      last_active TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),

      CONSTRAINT valid_level CHECK (level IN ('novice', 'contributor', 'expert', 'guardian')),
      CONSTRAINT valid_reputation CHECK (reputation_score >= 0 AND reputation_score <= 100),
      CONSTRAINT valid_agreement CHECK (consensus_agreement_rate >= 0 AND consensus_agreement_rate <= 1)
    );

    CREATE INDEX idx_user_expertise_reputation ON user_expertise(reputation_score DESC);
    CREATE INDEX idx_user_expertise_level ON user_expertise(level);
  `,
    /**
     * Pattern performance table
     */
    pattern_performance: `
    CREATE TABLE pattern_performance (
      pattern_id UUID PRIMARY KEY REFERENCES pattern_submissions(id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,

      total_matches INTEGER DEFAULT 0,
      unique_videos INTEGER DEFAULT 0,
      avg_confidence FLOAT DEFAULT 0,

      user_confirmed_matches INTEGER DEFAULT 0,
      user_dismissed_matches INTEGER DEFAULT 0,

      precision FLOAT DEFAULT 0,
      false_positive_rate FLOAT DEFAULT 0,

      weekly_performance JSONB DEFAULT '[]'::jsonb,

      first_matched_at TIMESTAMP,
      last_matched_at TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX idx_pattern_performance_category ON pattern_performance(category);
    CREATE INDEX idx_pattern_performance_precision ON pattern_performance(precision DESC);
  `,
    /**
     * Pattern feedback table
     */
    pattern_feedback: `
    CREATE TABLE pattern_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pattern_id UUID NOT NULL REFERENCES pattern_submissions(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      video_id VARCHAR(255) NOT NULL,
      timestamp FLOAT NOT NULL,

      feedback VARCHAR(30) NOT NULL,
      suggested_category VARCHAR(50),
      comment TEXT,

      created_at TIMESTAMP DEFAULT NOW(),

      CONSTRAINT valid_feedback CHECK (feedback IN ('correct', 'false-positive', 'should-be-different-category'))
    );

    CREATE INDEX idx_pattern_feedback_pattern_id ON pattern_feedback(pattern_id);
    CREATE INDEX idx_pattern_feedback_user_id ON pattern_feedback(user_id);
  `
};
/**
 * TypeScript type guards
 */
export function isValidPatternType(type) {
    return ['keyword', 'phrase', 'regex', 'audio-signature', 'visual-signature'].includes(type);
}
export function isValidStatus(status) {
    return ['pending', 'under-review', 'accepted', 'rejected', 'flagged'].includes(status);
}
export function isValidModality(modality) {
    return ['text', 'audio', 'visual', 'multi-modal'].includes(modality);
}
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
//# sourceMappingURL=CommunityVotingSchemas.js.map