-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User engagement bonuses table
CREATE TABLE IF NOT EXISTS user_engagement_bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    video_id TEXT NOT NULL,
    watch_time_minutes INTEGER NOT NULL,
    engagement_score DECIMAL(5,2) NOT NULL,
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id, watch_time_minutes)
);

-- User video completions table
CREATE TABLE IF NOT EXISTS user_video_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    video_id TEXT NOT NULL,
    completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    actual_watch_time DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_time_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
    tab_switches INTEGER NOT NULL DEFAULT 0,
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    metrics JSONB,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- User engagement events table (for detailed tracking)
CREATE TABLE IF NOT EXISTS user_engagement_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    video_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'play', 'pause', 'seek', 'tab_switch', 'tab_return', 'video_progress'
    video_current_time DECIMAL(10,2),
    video_progress DECIMAL(5,2),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_engagement_bonuses_user_video ON user_engagement_bonuses(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_engagement_bonuses_created ON user_engagement_bonuses(created_at);

CREATE INDEX IF NOT EXISTS idx_video_completions_user ON user_video_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_completions_video ON user_video_completions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_completions_completed ON user_video_completions(completed_at);

CREATE INDEX IF NOT EXISTS idx_engagement_events_user_video ON user_engagement_events(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_type ON user_engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engagement_events_created ON user_engagement_events(created_at);

-- Add engagement tracking columns to existing users table if they don't exist
DO $$ 
BEGIN
    -- Add engagement-related columns to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_engagement_score') THEN
        ALTER TABLE users ADD COLUMN total_engagement_score DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'average_engagement_score') THEN
        ALTER TABLE users ADD COLUMN average_engagement_score DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_watch_time') THEN
        ALTER TABLE users ADD COLUMN total_watch_time DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_tab_switches') THEN
        ALTER TABLE users ADD COLUMN total_tab_switches INTEGER DEFAULT 0;
    END IF;
END $$;

-- Function to update user engagement stats
CREATE OR REPLACE FUNCTION update_user_engagement_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's total engagement metrics when a video is completed
    IF TG_TABLE_NAME = 'user_video_completions' THEN
        UPDATE users 
        SET 
            total_engagement_score = COALESCE(total_engagement_score, 0) + NEW.engagement_score,
            total_watch_time = COALESCE(total_watch_time, 0) + NEW.actual_watch_time,
            total_tab_switches = COALESCE(total_tab_switches, 0) + NEW.tab_switches,
            average_engagement_score = (
                SELECT AVG(engagement_score) 
                FROM user_video_completions 
                WHERE user_id = NEW.user_id
            )
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_engagement_stats ON user_video_completions;
CREATE TRIGGER trigger_update_engagement_stats
    AFTER INSERT ON user_video_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_engagement_stats();

-- Grant permissions
GRANT ALL ON user_engagement_bonuses TO postgres;
GRANT ALL ON user_video_completions TO postgres;
GRANT ALL ON user_engagement_events TO postgres;

GRANT ALL ON user_engagement_bonuses TO anon;
GRANT ALL ON user_video_completions TO anon;
GRANT ALL ON user_engagement_events TO anon;

GRANT ALL ON user_engagement_bonuses TO authenticated;
GRANT ALL ON user_video_completions TO authenticated;
GRANT ALL ON user_engagement_events TO authenticated;
