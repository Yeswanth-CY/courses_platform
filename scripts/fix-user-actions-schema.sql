-- Add missing columns to user_actions table
ALTER TABLE user_actions 
ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id),
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS user_actions_xp_awarded_idx ON user_actions(xp_awarded);
CREATE INDEX IF NOT EXISTS user_actions_module_id_idx ON user_actions(module_id);
CREATE INDEX IF NOT EXISTS user_actions_course_id_idx ON user_actions(course_id);

-- Update existing records to have default XP values
UPDATE user_actions 
SET xp_awarded = CASE 
  WHEN action_type = 'video_like' THEN 15
  WHEN action_type = 'video_watch' THEN 50
  WHEN action_type = 'quiz_complete' THEN 100
  WHEN action_type = 'challenge_complete' THEN 200
  WHEN action_type = 'peer_tutor_question' THEN 15
  ELSE 10
END
WHERE xp_awarded = 0 OR xp_awarded IS NULL;
