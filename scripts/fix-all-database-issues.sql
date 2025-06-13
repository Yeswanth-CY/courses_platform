-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix users table - add missing columns
DO $$ 
BEGIN
    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username TEXT;
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email TEXT;
    END IF;
    
    -- Add engagement-related columns to users table if they don't exist
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

-- Drop and recreate user_daily_action_counts table with correct structure
DROP TABLE IF EXISTS user_daily_action_counts CASCADE;

CREATE TABLE user_daily_action_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, action_type, action_date)
);

-- Create all missing tables with proper UUID handling
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

CREATE TABLE IF NOT EXISTS user_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

CREATE TABLE IF NOT EXISTS user_video_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    watch_time INTEGER NOT NULL DEFAULT 0,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_quiz_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    time_spent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_watch_bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    watch_time_minutes INTEGER NOT NULL,
    bonus_xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id, watch_time_minutes)
);

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

-- Engagement tracking tables
CREATE TABLE IF NOT EXISTS user_engagement_bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    watch_time_minutes INTEGER NOT NULL,
    engagement_score DECIMAL(5,2) NOT NULL,
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id, watch_time_minutes)
);

CREATE TABLE IF NOT EXISTS user_video_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS user_engagement_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    video_current_time DECIMAL(10,2),
    video_progress DECIMAL(5,2),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_validation_failures_user_id ON validation_failures(user_id);
CREATE INDEX IF NOT EXISTS idx_validation_failures_created_at ON validation_failures(created_at);
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_video_id ON user_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_user_id ON user_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_video_id ON user_video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_completions_user_id ON user_quiz_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watch_bonuses_user_id ON user_watch_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_action_counts_user_date ON user_daily_action_counts(user_id, action_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_action_counts_action_type ON user_daily_action_counts(action_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_users_user_id ON suspicious_users(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_bonuses_user_video ON user_engagement_bonuses(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_engagement_bonuses_created ON user_engagement_bonuses(created_at);
CREATE INDEX IF NOT EXISTS idx_video_completions_user ON user_video_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_completions_video ON user_video_completions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_completions_completed ON user_video_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_engagement_events_user_video ON user_engagement_events(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_type ON user_engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engagement_events_created ON user_engagement_events(created_at);

-- Update user_actions table to allow null IP addresses if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_actions') THEN
        ALTER TABLE user_actions 
        ALTER COLUMN ip_address TYPE INET USING ip_address::INET,
        ALTER COLUMN ip_address DROP NOT NULL;
        
        CREATE INDEX IF NOT EXISTS idx_user_actions_ip_address ON user_actions(ip_address) WHERE ip_address IS NOT NULL;
    END IF;
END $$;

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
            LEAST(failure_count / 5, 10),
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

-- Create triggers (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS flag_suspicious_user_trigger ON validation_failures;
CREATE TRIGGER flag_suspicious_user_trigger
    AFTER INSERT ON validation_failures
    FOR EACH ROW
    EXECUTE FUNCTION flag_suspicious_user();

DROP TRIGGER IF EXISTS update_daily_action_count_trigger ON user_actions;
-- Only create this trigger if user_actions table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_actions') THEN
        EXECUTE 'CREATE TRIGGER update_daily_action_count_trigger
            AFTER INSERT ON user_actions
            FOR EACH ROW
            EXECUTE FUNCTION update_daily_action_count()';
    END IF;
END $$;

DROP TRIGGER IF EXISTS trigger_update_engagement_stats ON user_video_completions;
CREATE TRIGGER trigger_update_engagement_stats
    AFTER INSERT ON user_video_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_engagement_stats();

-- Create a view for easy monitoring of suspicious activity (fix the username issue)
CREATE OR REPLACE VIEW suspicious_activity_view AS
SELECT 
    u.id as user_id,
    COALESCE(u.username, 'Unknown') as username,
    COALESCE(u.email, 'No email') as email,
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

-- Grant necessary permissions (no sequences to worry about with UUIDs)
GRANT ALL ON validation_failures TO postgres, anon, authenticated;
GRANT ALL ON user_likes TO postgres, anon, authenticated;
GRANT ALL ON user_video_progress TO postgres, anon, authenticated;
GRANT ALL ON user_quiz_completions TO postgres, anon, authenticated;
GRANT ALL ON user_watch_bonuses TO postgres, anon, authenticated;
GRANT ALL ON user_daily_action_counts TO postgres, anon, authenticated;
GRANT ALL ON suspicious_users TO postgres, anon, authenticated;
GRANT ALL ON user_engagement_bonuses TO postgres, anon, authenticated;
GRANT ALL ON user_video_completions TO postgres, anon, authenticated;
GRANT ALL ON user_engagement_events TO postgres, anon, authenticated;
GRANT SELECT ON suspicious_activity_view TO postgres, anon, authenticated;
