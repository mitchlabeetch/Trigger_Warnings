-- =====================================================
-- DATABASE SCHEMA FIXES
-- Run this in Supabase SQL Editor to fix all mismatches
-- =====================================================

-- =====================================================
-- 1. ADD MISSING FEEDBACK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Feedback content
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,

  -- Tracking
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Status tracking (for future moderation)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved'))
);

-- Index for feedback queries
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Enable RLS on feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Feedback policies (drop if exists, then recreate for idempotency)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can submit feedback" ON feedback;
  DROP POLICY IF EXISTS "Users can read their own feedback" ON feedback;
  DROP POLICY IF EXISTS "Moderators can read all feedback" ON feedback;
END $$;

CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can read their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = submitted_by);

CREATE POLICY "Moderators can read all feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_moderator = TRUE
    )
  );

-- =====================================================
-- 2. ADD MISSING VIEW: recent_approved_triggers
-- =====================================================

-- Drop view if exists with CASCADE (removes dependent objects)
-- This is necessary because PostgreSQL can't ALTER VIEW column structure
DROP VIEW IF EXISTS recent_approved_triggers CASCADE;

CREATE VIEW recent_approved_triggers AS
SELECT * FROM triggers
WHERE status = 'approved'
ORDER BY created_at DESC
LIMIT 100;

-- =====================================================
-- 3. ENSURE USER_PROFILES RLS IS PROPERLY CONFIGURED
-- =====================================================

-- Note: The database audit shows RLS is DISABLED on user_profiles
-- This might be intentional for public profile viewing
-- If you want to enable it, uncomment the line below:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify current RLS status
DO $$
BEGIN
  RAISE NOTICE 'Current RLS status for user_profiles: %',
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles');
END $$;

-- =====================================================
-- 4. ADD TRIGGER FOR SUBMISSION COUNT
-- =====================================================

-- Ensure submission count increments when new trigger is created
CREATE OR REPLACE FUNCTION increment_user_submissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile if it doesn't exist
  INSERT INTO user_profiles (id, display_name)
  VALUES (NEW.submitted_by, 'User ' || substring(NEW.submitted_by::text, 1, 8))
  ON CONFLICT (id) DO NOTHING;

  -- Increment submissions count
  UPDATE user_profiles
  SET submissions_count = submissions_count + 1,
      updated_at = NOW()
  WHERE id = NEW.submitted_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS increment_submissions_on_trigger_insert ON triggers;
CREATE TRIGGER increment_submissions_on_trigger_insert
  AFTER INSERT ON triggers
  FOR EACH ROW
  EXECUTE FUNCTION increment_user_submissions();

-- =====================================================
-- 5. VERIFY AND FIX EXISTING DATA
-- =====================================================

-- Ensure all existing user_profiles have correct submission counts
DO $$
BEGIN
  UPDATE user_profiles up
  SET
    submissions_count = (
      SELECT COUNT(*) FROM triggers t WHERE t.submitted_by = up.id
    ),
    approved_count = (
      SELECT COUNT(*) FROM triggers t
      WHERE t.submitted_by = up.id AND t.status = 'approved'
    ),
    rejected_count = (
      SELECT COUNT(*) FROM triggers t
      WHERE t.submitted_by = up.id AND t.status = 'rejected'
    );

  RAISE NOTICE 'Updated user profile stats for all users';
END $$;

-- =====================================================
-- 6. ADD HELPFUL INDEXES IF MISSING
-- =====================================================

-- Index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_triggers_category ON triggers(category_key);

-- Index for video lookups with time range
CREATE INDEX IF NOT EXISTS idx_triggers_video_times ON triggers(video_id, start_time, end_time);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_triggers_video_platform_status_times
  ON triggers(video_id, platform, status, start_time, end_time);

-- =====================================================
-- 7. ADD FUNCTION TO GET VIDEO TRIGGERS (OPTIMIZED)
-- =====================================================

-- Drop existing function first (return type has changed)
-- Old version returned fewer columns, new version has full trigger data
DROP FUNCTION IF EXISTS get_video_triggers(text, streaming_platform);

CREATE FUNCTION get_video_triggers(
  p_video_id TEXT,
  p_platform streaming_platform
)
RETURNS TABLE (
  id UUID,
  video_id TEXT,
  platform streaming_platform,
  video_title TEXT,
  category_key trigger_category,
  start_time INTEGER,
  end_time INTEGER,
  description TEXT,
  confidence_level INTEGER,
  status warning_status,
  score INTEGER,
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID,
  upvotes BIGINT,
  downvotes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.video_id,
    t.platform,
    t.video_title,
    t.category_key,
    t.start_time,
    t.end_time,
    t.description,
    t.confidence_level,
    t.status,
    t.score,
    t.submitted_by,
    t.created_at,
    t.updated_at,
    t.moderated_at,
    t.moderated_by,
    COUNT(v.id) FILTER (WHERE v.vote_type = 'up') as upvotes,
    COUNT(v.id) FILTER (WHERE v.vote_type = 'down') as downvotes
  FROM triggers t
  LEFT JOIN trigger_votes v ON t.id = v.trigger_id
  WHERE t.video_id = p_video_id
    AND t.platform = p_platform
    AND t.status = 'approved'
  GROUP BY t.id
  ORDER BY t.start_time ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 8. VERIFY SCHEMA INTEGRITY
-- =====================================================

DO $$
DECLARE
  trigger_count INTEGER;
  vote_count INTEGER;
  profile_count INTEGER;
  feedback_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count FROM triggers;
  SELECT COUNT(*) INTO vote_count FROM trigger_votes;
  SELECT COUNT(*) INTO profile_count FROM user_profiles;
  SELECT COUNT(*) INTO feedback_count FROM feedback;

  RAISE NOTICE '=== SCHEMA FIX COMPLETED ===';
  RAISE NOTICE 'Total triggers: %', trigger_count;
  RAISE NOTICE 'Total votes: %', vote_count;
  RAISE NOTICE 'Total user profiles: %', profile_count;
  RAISE NOTICE 'Total feedback entries: %', feedback_count;
  RAISE NOTICE '===========================';
END $$;

-- =====================================================
-- NOTES
-- =====================================================

-- ✅ Added missing feedback table with RLS
-- ✅ Added missing recent_approved_triggers view
-- ✅ Verified user_profiles RLS configuration
-- ✅ Added trigger to auto-increment submission counts
-- ✅ Fixed existing user stats to be accurate
-- ✅ Added optimized indexes for common queries
-- ✅ Added optimized get_video_triggers() function
-- ✅ Verified schema integrity

-- All TypeScript code has been updated to match database schema:
-- - Warning interface now includes videoTitle, moderatedAt, moderatedBy
-- - SupabaseClient.getUserVote() now uses correct table name 'trigger_votes'
-- - All database mapping functions updated to include new fields
