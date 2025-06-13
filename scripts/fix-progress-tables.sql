-- Ensure user_progress table has all required columns
ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id),
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id),
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create unique constraint to prevent duplicate progress records
ALTER TABLE user_progress 
DROP CONSTRAINT IF EXISTS user_progress_user_video_unique;

ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_user_video_unique UNIQUE (user_id, video_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_video_id ON user_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);

-- Create a function to calculate module progress
CREATE OR REPLACE FUNCTION calculate_module_progress(p_user_id UUID, p_module_id UUID)
RETURNS JSON AS $$
DECLARE
    total_videos INTEGER;
    completed_videos INTEGER;
    avg_progress NUMERIC;
    result JSON;
BEGIN
    -- Get total videos in module
    SELECT COUNT(*) INTO total_videos
    FROM videos 
    WHERE module_id = p_module_id;
    
    -- Get completed videos count
    SELECT COUNT(*) INTO completed_videos
    FROM user_progress up
    JOIN videos v ON up.video_id = v.id
    WHERE up.user_id = p_user_id 
    AND v.module_id = p_module_id 
    AND up.completed = true;
    
    -- Get average progress
    SELECT COALESCE(AVG(up.progress_percentage), 0) INTO avg_progress
    FROM user_progress up
    JOIN videos v ON up.video_id = v.id
    WHERE up.user_id = p_user_id 
    AND v.module_id = p_module_id;
    
    -- Build result JSON
    result := json_build_object(
        'totalVideos', total_videos,
        'completedVideos', completed_videos,
        'progressPercentage', ROUND(avg_progress),
        'completionRate', CASE WHEN total_videos > 0 THEN ROUND((completed_videos::NUMERIC / total_videos) * 100) ELSE 0 END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate course progress
CREATE OR REPLACE FUNCTION calculate_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS JSON AS $$
DECLARE
    total_videos INTEGER;
    completed_videos INTEGER;
    avg_progress NUMERIC;
    result JSON;
BEGIN
    -- Get total videos in course
    SELECT COUNT(*) INTO total_videos
    FROM videos v
    JOIN modules m ON v.module_id = m.id
    WHERE m.course_id = p_course_id;
    
    -- Get completed videos count
    SELECT COUNT(*) INTO completed_videos
    FROM user_progress up
    JOIN videos v ON up.video_id = v.id
    JOIN modules m ON v.module_id = m.id
    WHERE up.user_id = p_user_id 
    AND m.course_id = p_course_id 
    AND up.completed = true;
    
    -- Get average progress
    SELECT COALESCE(AVG(up.progress_percentage), 0) INTO avg_progress
    FROM user_progress up
    JOIN videos v ON up.video_id = v.id
    JOIN modules m ON v.module_id = m.id
    WHERE up.user_id = p_user_id 
    AND m.course_id = p_course_id;
    
    -- Build result JSON
    result := json_build_object(
        'totalVideos', total_videos,
        'completedVideos', completed_videos,
        'progressPercentage', ROUND(avg_progress),
        'completionRate', CASE WHEN total_videos > 0 THEN ROUND((completed_videos::NUMERIC / total_videos) * 100) ELSE 0 END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
