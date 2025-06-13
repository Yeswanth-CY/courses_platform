-- Create user_activities table for detailed activity tracking
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    xp_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    xp_awarded INTEGER DEFAULT 0,
    UNIQUE(user_id, achievement_id)
);

-- Create user_daily_activity table for streak tracking
CREATE TABLE IF NOT EXISTS user_daily_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activities_count INTEGER DEFAULT 0,
    total_xp_earned INTEGER DEFAULT 0,
    study_duration INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date)
);

-- Add new columns to users table for enhanced tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS likes_given INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS quizzes_completed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS challenges_completed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS early_bird_sessions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS night_owl_sessions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekend_sessions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unlocked_achievements TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_date ON user_daily_activity(user_id, activity_date);

-- Create function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Update best streak if current streak is higher
    UPDATE users 
    SET best_streak = GREATEST(best_streak, current_streak)
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for streak updates
DROP TRIGGER IF EXISTS trigger_update_user_streak ON user_daily_activity;
CREATE TRIGGER trigger_update_user_streak
    AFTER INSERT OR UPDATE ON user_daily_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();
