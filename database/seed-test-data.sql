-- =====================================================
-- SEED TEST DATA FOR YOUTUBE VIDEO
-- Video: https://www.youtube.com/watch?v=ZKCmFcMR2tU
-- =====================================================
-- This seed data is for testing the Trigger Warnings extension
-- with various trigger categories and time ranges.
-- =====================================================

-- Clear existing test data for this video (if any)
DELETE FROM trigger_votes WHERE trigger_id IN (
  SELECT id FROM triggers WHERE video_id = 'ZKCmFcMR2tU' AND platform = 'youtube'
);
DELETE FROM triggers WHERE video_id = 'ZKCmFcMR2tU' AND platform = 'youtube';

-- =====================================================
-- NOTE: No need to disable triggers anymore!
-- The increment_user_submissions() function now handles NULL values gracefully
-- =====================================================

-- =====================================================
-- SEED TRIGGERS FOR TEST VIDEO
-- =====================================================

-- Violence (multiple instances)
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'violence',
  45,
  67,
  'Physical altercation with punching',
  85,
  'approved',
  12,
  NULL,
  NOW() - INTERVAL '7 days'
),
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'violence',
  180,
  210,
  'Intense fight scene',
  90,
  'approved',
  8,
  NULL,
  NOW() - INTERVAL '6 days'
);

-- Blood and Gore
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'blood',
  72,
  95,
  'Visible blood from injury',
  80,
  'approved',
  15,
  NULL,
  NOW() - INTERVAL '5 days'
),
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'gore',
  320,
  345,
  'Graphic injury detail',
  75,
  'approved',
  6,
  NULL,
  NOW() - INTERVAL '5 days'
);

-- Flashing Lights (Photosensitivity)
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'flashing_lights',
  120,
  135,
  'Rapid strobe effects during party scene',
  95,
  'approved',
  20,
  NULL,
  NOW() - INTERVAL '4 days'
);

-- Jumpscares
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'jumpscares',
  240,
  242,
  'Sudden loud sound with quick cut',
  88,
  'approved',
  18,
  NULL,
  NOW() - INTERVAL '3 days'
),
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'jumpscares',
  380,
  383,
  'Unexpected appearance with scream',
  92,
  'approved',
  14,
  NULL,
  NOW() - INTERVAL '3 days'
);

-- Drugs and Alcohol
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'drugs',
  155,
  190,
  'Drug use depicted on screen',
  82,
  'approved',
  9,
  NULL,
  NOW() - INTERVAL '2 days'
);

-- Swearing
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'swear_words',
  28,
  32,
  'Strong language',
  90,
  'approved',
  5,
  NULL,
  NOW() - INTERVAL '2 days'
),
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'swear_words',
  98,
  102,
  'Multiple expletives',
  88,
  'approved',
  7,
  NULL,
  NOW() - INTERVAL '1 day'
);

-- Detonations/Bombs
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'detonations_bombs',
  265,
  285,
  'Explosion with loud sound',
  91,
  'approved',
  16,
  NULL,
  NOW() - INTERVAL '1 day'
);

-- Vomit
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'vomit',
  420,
  428,
  'Character vomiting on screen',
  79,
  'approved',
  4,
  NULL,
  NOW() - INTERVAL '12 hours'
);

-- Spiders/Snakes
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'spiders_snakes',
  305,
  315,
  'Close-up of spider',
  86,
  'approved',
  11,
  NULL,
  NOW() - INTERVAL '6 hours'
);

-- Medical Procedures
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'medical_procedures',
  450,
  475,
  'Needle injection shown',
  83,
  'approved',
  10,
  NULL,
  NOW() - INTERVAL '3 hours'
);

-- Pending trigger (for testing moderation)
INSERT INTO triggers (
  video_id,
  platform,
  video_title,
  category_key,
  start_time,
  end_time,
  description,
  confidence_level,
  status,
  score,
  submitted_by,
  created_at
) VALUES
(
  'ZKCmFcMR2tU',
  'youtube',
  'Test Video - ZKCmFcMR2tU',
  'torture',
  500,
  530,
  'Intense interrogation scene',
  70,
  'pending',
  0,
  NULL,
  NOW() - INTERVAL '1 hour'
);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Check that data was inserted correctly
SELECT
  category_key,
  start_time,
  end_time,
  description,
  score,
  status,
  created_at
FROM triggers
WHERE video_id = 'ZKCmFcMR2tU' AND platform = 'youtube'
ORDER BY start_time;

-- Display summary
SELECT
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) as total_count
FROM triggers
WHERE video_id = 'ZKCmFcMR2tU' AND platform = 'youtube';
