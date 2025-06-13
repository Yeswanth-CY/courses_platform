-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all necessary tables with proper UUID handling
-- This will drop and recreate all validation-related tables

-- 1. Create user_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  video_id UUID,
  quiz_id UUID,
  challenge_id UUID,
  module_id UUID,
  course_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create validation_failures table
DROP TABLE IF EXISTS validation_failures CASCADE;
CREATE TABLE validation_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- 3. Create user_likes table
DROP TABLE IF EXISTS user_likes CASCADE;
CREATE TABLE user_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- 4. Create user_video_progress table
DROP TABLE IF EXISTS user_video_progress CASCADE;
CREATE TABLE user_video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  watch_time INTEGER NOT NULL DEFAULT 0,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create user_quiz_completions table
DROP TABLE IF EXISTS user_quiz_completions CASCADE;
CREATE TABLE user_quiz_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create user_watch_bonuses table
DROP TABLE IF EXISTS user_watch_bonuses CASCADE;
CREATE TABLE user_watch_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  watch_time_minutes INTEGER NOT NULL,
  bonus_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id, watch_time_minutes)
);

-- 7. Create user_daily_action_counts table
DROP TABLE IF EXISTS user_daily_action_counts CASCADE;
CREATE TABLE user_daily_action_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, action_type, action_date)
);

-- 8. Create suspicious_users table
DROP TABLE IF EXISTS suspicious_users CASCADE;
CREATE TABLE suspicious_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  suspicion_level INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actions_taken JSONB,
  is_resolved BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_validation_failures_user_id ON validation_failures(user_id);
CREATE INDEX IF NOT EXISTS idx_validation_failures_created_at ON validation_failures(created_at);
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_video_id ON user_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_user_id ON user_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_video_id ON user_video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_completions_user_id ON user_quiz_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watch_bonuses_user_id ON user_watch_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_action_counts_user_date ON user_daily_action_counts(user_id, action_date);
CREATE INDEX IF NOT EXISTS idx_suspicious_users_user_id ON suspicious_users(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_ip_address ON user_actions(ip_address) WHERE ip_address IS NOT NULL;

-- Grant necessary permissions (without referencing sequences)
GRANT SELECT, INSERT, UPDATE ON user_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON validation_failures TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_video_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_quiz_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_watch_bonuses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_daily_action_counts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON suspicious_users TO authenticated;

-- Function to update daily action counts
CREATE OR REPLACE FUNCTION update_daily_action_count()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_daily_action_counts (user_id, action_type, action_date, count)
  VALUES (NEW.user_id, NEW.action_type, CURRENT_DATE, 1)
  ON CONFLICT (user_id, action_type, action_date)
  DO UPDATE SET 
    count = user_daily_action_counts.count + 1,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE NOTICE 'Error in update_daily_action_count: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update daily action counts
DROP TRIGGER IF EXISTS update_daily_action_count_trigger ON user_actions;
CREATE TRIGGER update_daily_action_count_trigger
AFTER INSERT ON user_actions
FOR EACH ROW
EXECUTE FUNCTION update_daily_action_count();
