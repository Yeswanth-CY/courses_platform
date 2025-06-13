-- Fix user_video_progress table structure
ALTER TABLE user_video_progress 
ADD COLUMN IF NOT EXISTS liked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bookmarked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create user_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Create user_bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Create user_actions table for XP tracking if it doesn't exist
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    video_id TEXT,
    module_id TEXT,
    course_id TEXT,
    xp_awarded INTEGER DEFAULT 0,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_likes_user_video ON user_likes(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_video ON user_bookmarks(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_type ON user_actions(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_created ON user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_user_video ON user_video_progress(user_id, video_id);

-- Grant permissions
GRANT ALL ON user_likes TO postgres, anon, authenticated;
GRANT ALL ON user_bookmarks TO postgres, anon, authenticated;
GRANT ALL ON user_actions TO postgres, anon, authenticated;
