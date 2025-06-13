-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#8B5CF6',
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- in seconds
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create user_video_progress table
CREATE TABLE IF NOT EXISTS user_video_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  liked BOOLEAN DEFAULT FALSE,
  bookmarked BOOLEAN DEFAULT FALSE,
  watch_time INTEGER DEFAULT 0, -- in seconds
  completed BOOLEAN DEFAULT FALSE,
  last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Insert predefined users
INSERT INTO users (name, avatar_color) VALUES 
  ('Yeswanth', '#8B5CF6'),
  ('Haridra', '#EC4899'),
  ('Monika', '#10B981')
ON CONFLICT (name) DO NOTHING;

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user stats when video progress changes
  UPDATE users SET
    videos_watched = (
      SELECT COUNT(DISTINCT video_id) 
      FROM user_video_progress 
      WHERE user_id = NEW.user_id AND (liked = TRUE OR watch_time > 30)
    ),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stats updates
DROP TRIGGER IF EXISTS trigger_update_user_stats ON user_video_progress;
CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT OR UPDATE ON user_video_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();
