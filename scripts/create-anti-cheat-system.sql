-- Create user_actions table for tracking all user interactions
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('video_like', 'video_watch', 'quiz_complete', 'challenge_complete')),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create user_achievements table for tracking unlocked achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create user_stats table for caching computed statistics
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  videos_watched INTEGER DEFAULT 0,
  videos_liked INTEGER DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0,
  quiz_completions INTEGER DEFAULT 0,
  challenge_completions INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_action_time ON user_actions(user_id, action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, videos_watched, videos_liked, total_watch_time, quiz_completions, challenge_completions, last_activity, computed_at)
  VALUES (
    NEW.user_id,
    CASE WHEN NEW.action_type = 'video_watch' THEN 1 ELSE 0 END,
    CASE WHEN NEW.action_type = 'video_like' THEN 1 ELSE 0 END,
    CASE WHEN NEW.action_type = 'video_watch' THEN COALESCE((NEW.metadata->>'watchTime')::INTEGER, 0) ELSE 0 END,
    CASE WHEN NEW.action_type = 'quiz_complete' THEN 1 ELSE 0 END,
    CASE WHEN NEW.action_type = 'challenge_complete' THEN 1 ELSE 0 END,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    videos_watched = user_stats.videos_watched + CASE WHEN NEW.action_type = 'video_watch' THEN 1 ELSE 0 END,
    videos_liked = user_stats.videos_liked + CASE WHEN NEW.action_type = 'video_like' THEN 1 ELSE 0 END,
    total_watch_time = user_stats.total_watch_time + CASE WHEN NEW.action_type = 'video_watch' THEN COALESCE((NEW.metadata->>'watchTime')::INTEGER, 0) ELSE 0 END,
    quiz_completions = user_stats.quiz_completions + CASE WHEN NEW.action_type = 'quiz_complete' THEN 1 ELSE 0 END,
    challenge_completions = user_stats.challenge_completions + CASE WHEN NEW.action_type = 'challenge_complete' THEN 1 ELSE 0 END,
    last_activity = NEW.created_at,
    computed_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stats
CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT ON user_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Create function to prevent action spam
CREATE OR REPLACE FUNCTION check_action_spam()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
  last_action_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check for rapid actions (more than 10 in last minute)
  SELECT COUNT(*) INTO recent_count
  FROM user_actions
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 minute';
  
  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Too many actions in short time period';
  END IF;
  
  -- Check minimum time between same actions
  SELECT created_at INTO last_action_time
  FROM user_actions
  WHERE user_id = NEW.user_id
    AND action_type = NEW.action_type
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF last_action_time IS NOT NULL THEN
    CASE NEW.action_type
      WHEN 'video_like' THEN
        IF last_action_time > NOW() - INTERVAL '2 seconds' THEN
          RAISE EXCEPTION 'Video likes too frequent';
        END IF;
      WHEN 'video_watch' THEN
        IF last_action_time > NOW() - INTERVAL '30 seconds' THEN
          RAISE EXCEPTION 'Video completions too frequent';
        END IF;
      WHEN 'quiz_complete' THEN
        IF last_action_time > NOW() - INTERVAL '1 minute' THEN
          RAISE EXCEPTION 'Quiz completions too frequent';
        END IF;
      WHEN 'challenge_complete' THEN
        IF last_action_time > NOW() - INTERVAL '2 minutes' THEN
          RAISE EXCEPTION 'Challenge completions too frequent';
        END IF;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check for spam
CREATE TRIGGER trigger_check_action_spam
  BEFORE INSERT ON user_actions
  FOR EACH ROW
  EXECUTE FUNCTION check_action_spam();

-- Enable Row Level Security
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own actions" ON user_actions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own actions" ON user_actions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own stats" ON user_stats FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "System can update stats" ON user_stats FOR ALL WITH CHECK (true);
