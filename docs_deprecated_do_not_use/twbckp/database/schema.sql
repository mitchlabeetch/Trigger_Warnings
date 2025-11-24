-- =====================================================
-- TRIGGER WARNINGS DATABASE SCHEMA
-- Complete SQL schema for Supabase PostgreSQL database
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Trigger warning status
CREATE TYPE warning_status AS ENUM ('pending', 'approved', 'rejected');

-- Vote types
CREATE TYPE vote_type AS ENUM ('up', 'down');

-- Streaming platforms
CREATE TYPE streaming_platform AS ENUM (
  'netflix',
  'prime_video',
  'youtube',
  'hulu',
  'disney_plus',
  'max',
  'peacock'
);

-- Trigger categories (all 28)
CREATE TYPE trigger_category AS ENUM (
  'violence',
  'blood',
  'gore',
  'sexual_assault',
  'sex',
  'self_harm',
  'suicide',
  'eating_disorders',
  'drugs',
  'swear_words',
  'spiders_snakes',
  'animal_cruelty',
  'child_abuse',
  'children_screaming',
  'domestic_violence',
  'racial_violence',
  'lgbtq_phobia',
  'religious_trauma',
  'dead_body_body_horror',
  'torture',
  'murder',
  'detonations_bombs',
  'medical_procedures',
  'vomit',
  'flashing_lights',
  'jumpscares',
  'natural_disasters',
  'cannibalism'
);

-- =====================================================
-- MAIN TABLES
-- =====================================================

-- Trigger warnings table
CREATE TABLE triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Video identification
  video_id TEXT NOT NULL,
  platform streaming_platform NOT NULL,
  video_title TEXT,

  -- Warning details
  category_key trigger_category NOT NULL,
  start_time INTEGER NOT NULL CHECK (start_time >= 0),
  end_time INTEGER NOT NULL CHECK (end_time > start_time),
  description TEXT,

  -- Metadata
  confidence_level INTEGER NOT NULL DEFAULT 75 CHECK (confidence_level >= 0 AND confidence_level <= 100),
  status warning_status NOT NULL DEFAULT 'pending',
  score INTEGER NOT NULL DEFAULT 0,

  -- Tracking
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Moderation
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Trigger votes table
CREATE TABLE trigger_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  trigger_id UUID NOT NULL REFERENCES triggers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Prevent duplicate votes from same user
  CONSTRAINT unique_user_vote UNIQUE (trigger_id, user_id)
);

-- User profiles table (optional - for future features)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  display_name TEXT,
  is_moderator BOOLEAN NOT NULL DEFAULT FALSE,
  is_trusted BOOLEAN NOT NULL DEFAULT FALSE,

  -- Stats
  submissions_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Critical indexes for trigger lookups
CREATE INDEX idx_triggers_video_status ON triggers(video_id, platform, status);
CREATE INDEX idx_triggers_status ON triggers(status);
CREATE INDEX idx_triggers_created_at ON triggers(created_at DESC);
CREATE INDEX idx_triggers_score ON triggers(score DESC);
CREATE INDEX idx_triggers_platform ON triggers(platform);

-- Indexes for votes
CREATE INDEX idx_votes_trigger_id ON trigger_votes(trigger_id);
CREATE INDEX idx_votes_user_id ON trigger_votes(user_id);

-- Indexes for user profiles
CREATE INDEX idx_user_profiles_moderator ON user_profiles(is_moderator) WHERE is_moderator = TRUE;
CREATE INDEX idx_user_profiles_trusted ON user_profiles(is_trusted) WHERE is_trusted = TRUE;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate trigger score from votes
CREATE OR REPLACE FUNCTION recalculate_trigger_score(trigger_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  upvotes INTEGER;
  downvotes INTEGER;
  new_score INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'up'),
    COUNT(*) FILTER (WHERE vote_type = 'down')
  INTO upvotes, downvotes
  FROM trigger_votes
  WHERE trigger_id = trigger_uuid;

  new_score := upvotes - downvotes;

  UPDATE triggers
  SET score = new_score
  WHERE id = trigger_uuid;

  RETURN new_score;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-approve/reject based on score
CREATE OR REPLACE FUNCTION auto_moderate_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve if score >= 3 and still pending
  IF NEW.score >= 3 AND NEW.status = 'pending' THEN
    NEW.status := 'approved';
    NEW.moderated_at := NOW();
    NEW.moderated_by := NULL; -- Auto-moderated
  END IF;

  -- Auto-reject if score <= -5 and still pending
  IF NEW.score <= -5 AND NEW.status = 'pending' THEN
    NEW.status := 'rejected';
    NEW.moderated_at := NOW();
    NEW.moderated_by := NULL; -- Auto-moderated
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user profile stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE user_profiles
    SET approved_count = approved_count + 1
    WHERE id = NEW.submitted_by;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    UPDATE user_profiles
    SET rejected_count = rejected_count + 1
    WHERE id = NEW.submitted_by;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp on triggers
CREATE TRIGGER update_triggers_updated_at
  BEFORE UPDATE ON triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at timestamp on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-moderate triggers based on score
CREATE TRIGGER auto_moderate_trigger_on_score_change
  BEFORE UPDATE OF score ON triggers
  FOR EACH ROW
  WHEN (OLD.score IS DISTINCT FROM NEW.score)
  EXECUTE FUNCTION auto_moderate_trigger();

-- Update user stats when trigger status changes
CREATE TRIGGER update_user_stats_on_status_change
  AFTER UPDATE OF status ON triggers
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_user_stats();

-- Recalculate score when vote is added
CREATE OR REPLACE FUNCTION trigger_vote_score_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_trigger_score(NEW.trigger_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_score_on_vote_insert
  AFTER INSERT ON trigger_votes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_vote_score_update();

-- Recalculate score when vote is deleted
CREATE OR REPLACE FUNCTION trigger_vote_delete_score_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_trigger_score(OLD.trigger_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_score_on_vote_delete
  AFTER DELETE ON trigger_votes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_vote_delete_score_update();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Triggers policies
-- Anyone can read approved triggers
CREATE POLICY "Anyone can read approved triggers"
  ON triggers FOR SELECT
  USING (status = 'approved');

-- Authenticated users can read their own pending/rejected triggers
CREATE POLICY "Users can read their own triggers"
  ON triggers FOR SELECT
  USING (auth.uid() = submitted_by);

-- Moderators can read all triggers
CREATE POLICY "Moderators can read all triggers"
  ON triggers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_moderator = TRUE
    )
  );

-- Authenticated users can insert triggers
CREATE POLICY "Authenticated users can submit triggers"
  ON triggers FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- Moderators can update triggers
CREATE POLICY "Moderators can update triggers"
  ON triggers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_moderator = TRUE
    )
  );

-- Trigger votes policies
-- Users can read all votes
CREATE POLICY "Anyone can read votes"
  ON trigger_votes FOR SELECT
  USING (TRUE);

-- Users can insert their own votes
CREATE POLICY "Users can vote on triggers"
  ON trigger_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
  ON trigger_votes FOR DELETE
  USING (auth.uid() = user_id);

-- User profiles policies
-- Anyone can read public profile info
CREATE POLICY "Anyone can read user profiles"
  ON user_profiles FOR SELECT
  USING (TRUE);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View for triggers with vote counts
CREATE VIEW triggers_with_votes AS
SELECT
  t.*,
  COUNT(v.id) FILTER (WHERE v.vote_type = 'up') as upvotes,
  COUNT(v.id) FILTER (WHERE v.vote_type = 'down') as downvotes,
  COUNT(v.id) as total_votes
FROM triggers t
LEFT JOIN trigger_votes v ON t.id = v.trigger_id
GROUP BY t.id;

-- View for pending triggers (for moderation queue)
CREATE VIEW pending_triggers AS
SELECT * FROM triggers_with_votes
WHERE status = 'pending'
ORDER BY created_at DESC;

-- View for top contributors
CREATE VIEW top_contributors AS
SELECT
  up.*,
  u.email
FROM user_profiles up
JOIN auth.users u ON up.id = u.id
WHERE up.approved_count > 0
ORDER BY up.approved_count DESC;

-- View for recently approved triggers
CREATE VIEW recent_approved_triggers AS
SELECT * FROM triggers
WHERE status = 'approved'
ORDER BY created_at DESC
LIMIT 100;

-- =====================================================
-- FEEDBACK TABLE
-- =====================================================

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Feedback content
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,

  -- Tracking
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved'))
);

-- Index for feedback queries
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_status ON feedback(status);

-- Enable RLS on feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Feedback policies
-- Note: If running this multiple times, you may need to DROP POLICY IF EXISTS first
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
-- ADDITIONAL TRIGGERS
-- =====================================================

-- Increment user submission count when trigger is created
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

CREATE TRIGGER increment_submissions_on_trigger_insert
  AFTER INSERT ON triggers
  FOR EACH ROW
  EXECUTE FUNCTION increment_user_submissions();

-- =====================================================
-- OPTIMIZED FUNCTION FOR VIDEO TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION get_video_triggers(
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
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Create a test moderator user profile (after you have a user in auth.users)
-- INSERT INTO user_profiles (id, display_name, is_moderator, is_trusted)
-- VALUES ('YOUR-USER-UUID-HERE', 'Test Moderator', TRUE, TRUE);

-- =====================================================
-- USEFUL QUERIES (Documentation)
-- =====================================================

-- Get all approved triggers for a specific video
-- SELECT * FROM triggers
-- WHERE video_id = 'VIDEO_ID' AND platform = 'netflix' AND status = 'approved';

-- Get moderation queue
-- SELECT * FROM pending_triggers WHERE score < 3 AND score > -5;

-- Get user's vote history
-- SELECT t.*, v.vote_type
-- FROM triggers t
-- JOIN trigger_votes v ON t.id = v.trigger_id
-- WHERE v.user_id = 'USER_UUID';

-- =====================================================
-- NOTES FOR SUPABASE SETUP
-- =====================================================

-- 1. Run this entire SQL file in Supabase SQL Editor
-- 2. Enable anonymous authentication in Supabase Auth settings
-- 3. Set up email authentication if you want user accounts
-- 4. Create API keys in Supabase settings
-- 5. Update extension's SupabaseClient with new credentials
-- 6. Consider setting up Supabase Realtime for live updates

-- For production, also consider:
-- - Setting up database backups
-- - Configuring connection pooling
-- - Setting up monitoring and alerts
-- - Adding rate limiting on API endpoints
