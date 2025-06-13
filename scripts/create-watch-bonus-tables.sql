-- Create table for tracking user watch bonuses
CREATE TABLE IF NOT EXISTS user_watch_bonuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL,
    watch_time_minutes INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    bonuses JSONB DEFAULT '[]',
    encouragement_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_watch_bonuses_user_id ON user_watch_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watch_bonuses_video_id ON user_watch_bonuses(video_id);
CREATE INDEX IF NOT EXISTS idx_user_watch_bonuses_created_at ON user_watch_bonuses(created_at);

-- Create table for tracking user likes
CREATE TABLE IF NOT EXISTS user_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id) -- Ensure a user can only like a video once
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_video_id ON user_likes(video_id);

-- Create table for tracking user video progress
CREATE TABLE IF NOT EXISTS user_video_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL,
    watch_time INTEGER NOT NULL DEFAULT 0, -- in seconds
    completion_percentage INTEGER NOT NULL DEFAULT 0, -- 0-100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_video_progress_user_id ON user_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_video_id ON user_video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_updated_at ON user_video_progress(updated_at);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_video_progress_updated_at
BEFORE UPDATE ON user_video_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create table for tracking user daily activity
CREATE TABLE IF NOT EXISTS user_daily_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    videos_watched INTEGER NOT NULL DEFAULT 0,
    videos_liked INTEGER NOT NULL DEFAULT 0,
    quizzes_completed INTEGER NOT NULL DEFAULT 0,
    challenges_completed INTEGER NOT NULL DEFAULT 0,
    time_spent INTEGER NOT NULL DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date) -- One record per user per day
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_id ON user_daily_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_activity_date ON user_daily_activity(activity_date);

-- Create function to update or insert daily activity
CREATE OR REPLACE FUNCTION update_daily_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update the daily activity record
    INSERT INTO user_daily_activity (user_id, activity_date, xp_earned, videos_watched)
    VALUES (NEW.user_id, CURRENT_DATE, NEW.xp_earned, 1)
    ON CONFLICT (user_id, activity_date)
    DO UPDATE SET
        xp_earned = user_daily_activity.xp_earned + NEW.xp_earned,
        videos_watched = user_daily_activity.videos_watched + 1,
        time_spent = user_daily_activity.time_spent + COALESCE((NEW.metadata->>'watchTime')::INTEGER, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update daily activity when a video is watched
CREATE TRIGGER update_daily_activity_on_video_watch
AFTER INSERT ON user_actions
FOR EACH ROW
WHEN (NEW.activity_type = 'video_watch')
EXECUTE FUNCTION update_daily_activity();

-- Create function to update daily activity for likes
CREATE OR REPLACE FUNCTION update_daily_activity_likes()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the daily activity record for likes
    UPDATE user_daily_activity
    SET videos_liked = videos_liked + 1
    WHERE user_id = NEW.user_id AND activity_date = CURRENT_DATE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update daily activity when a video is liked
CREATE TRIGGER update_daily_activity_on_video_like
AFTER INSERT ON user_likes
FOR EACH ROW
EXECUTE FUNCTION update_daily_activity_likes();
