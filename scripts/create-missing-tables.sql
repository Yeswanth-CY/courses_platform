-- Create validation_failures table
CREATE TABLE IF NOT EXISTS validation_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create user_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Create user_video_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL,
  watch_time INTEGER NOT NULL DEFAULT 0,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_quiz_completions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_quiz_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_watch_bonuses table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_watch_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL,
  watch_time_minutes INTEGER NOT NULL,
  bonus_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id, watch_time_minutes)
);

-- Create user_daily_action_counts table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_daily_action_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, action_type, action_date)
);

-- Update user_actions table to allow null IP addresses
ALTER TABLE user_actions 
ALTER COLUMN ip_address TYPE INET USING ip_address::INET,
ALTER COLUMN ip_address DROP NOT NULL;

-- Create suspicious_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS suspicious_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suspicion_level INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actions_taken JSONB,
  is_resolved BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

-- Create indexes for better performance
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

-- Function to automatically flag suspicious users
CREATE OR REPLACE FUNCTION flag_suspicious_user()
RETURNS TRIGGER AS $$
DECLARE
  failure_count INTEGER;
BEGIN
  -- Count recent failures for this user
  SELECT COUNT(*) INTO failure_count
  FROM validation_failures
  WHERE user_id = NEW.user_id
  AND created_at > NOW() - INTERVAL '1 hour';
  
  -- If more than 5 failures in an hour, flag the user
  IF failure_count >= 5 THEN
    INSERT INTO suspicious_users (user_id, suspicion_level, reason)
    VALUES (
      NEW.user_id, 
      LEAST(failure_count / 5, 10), -- Scale suspicion level 1-10
      'Multiple validation failures: ' || failure_count || ' in the last hour'
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      suspicion_level = LEAST(suspicious_users.suspicion_level + 1, 10),
      reason = suspicious_users.reason || ', ' || 'New failures: ' || failure_count,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically flag suspicious users
DROP TRIGGER IF EXISTS flag_suspicious_user_trigger ON validation_failures;
CREATE TRIGGER flag_suspicious_user_trigger
AFTER INSERT ON validation_failures
FOR EACH ROW
EXECUTE FUNCTION flag_suspicious_user();

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
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update daily action counts
DROP TRIGGER IF EXISTS update_daily_action_count_trigger ON user_actions;
CREATE TRIGGER update_daily_action_count_trigger
AFTER INSERT ON user_actions
FOR EACH ROW
EXECUTE FUNCTION update_daily_action_count();

-- Create a view for easy monitoring of suspicious activity
CREATE OR REPLACE VIEW suspicious_activity_view AS
SELECT 
  u.id as user_id,
  u.username,
  u.email,
  COUNT(DISTINCT vf.id) as validation_failures,
  MAX(su.suspicion_level) as suspicion_level,
  MAX(su.updated_at) as last_suspicious_activity,
  STRING_AGG(DISTINCT vf.reason, ', ') as failure_reasons
FROM 
  users u
LEFT JOIN 
  validation_failures vf ON u.id = vf.user_id
LEFT JOIN 
  suspicious_users su ON u.id = su.user_id
WHERE 
  vf.created_at > NOW() - INTERVAL '7 days'
  OR su.updated_at > NOW() - INTERVAL '7 days'
GROUP BY 
  u.id, u.username, u.email
HAVING 
  COUNT(DISTINCT vf.id) > 3
ORDER BY 
  MAX(su.suspicion_level) DESC NULLS LAST,
  COUNT(DISTINCT vf.id) DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON validation_failures TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_video_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_quiz_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_watch_bonuses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_daily_action_counts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON suspicious_users TO authenticated;
GRANT SELECT ON suspicious_activity_view TO authenticated;
