-- Check if user_progress table exists, if not create it
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  module_id UUID NOT NULL,
  course_id UUID NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  progress_percentage INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_progress_unique UNIQUE (user_id, video_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_video_id ON user_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON user_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to calculate module progress
CREATE OR REPLACE FUNCTION calculate_module_progress(p_user_id UUID, p_module_id UUID)
RETURNS TABLE (
  total_videos INTEGER,
  completed_videos INTEGER,
  progress_percentage INTEGER
) AS $$
DECLARE
  v_total_videos INTEGER;
  v_completed_videos INTEGER;
  v_progress_percentage INTEGER;
BEGIN
  -- Get total videos in module
  SELECT COUNT(*) INTO v_total_videos
  FROM videos
  WHERE module_id = p_module_id;
  
  -- Get completed videos
  SELECT COUNT(*) INTO v_completed_videos
  FROM user_progress
  WHERE user_id = p_user_id
    AND module_id = p_module_id
    AND completed = TRUE;
  
  -- Calculate percentage
  IF v_total_videos > 0 THEN
    v_progress_percentage := (v_completed_videos * 100) / v_total_videos;
  ELSE
    v_progress_percentage := 0;
  END IF;
  
  RETURN QUERY SELECT 
    v_total_videos AS total_videos,
    v_completed_videos AS completed_videos,
    v_progress_percentage AS progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate course progress
CREATE OR REPLACE FUNCTION calculate_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS TABLE (
  total_videos INTEGER,
  completed_videos INTEGER,
  progress_percentage INTEGER,
  total_modules INTEGER,
  completed_modules INTEGER
) AS $$
DECLARE
  v_total_videos INTEGER;
  v_completed_videos INTEGER;
  v_progress_percentage INTEGER;
  v_total_modules INTEGER;
  v_completed_modules INTEGER;
BEGIN
  -- Get total videos in course
  SELECT COUNT(*) INTO v_total_videos
  FROM videos v
  JOIN modules m ON v.module_id = m.id
  WHERE m.course_id = p_course_id;
  
  -- Get completed videos
  SELECT COUNT(*) INTO v_completed_videos
  FROM user_progress
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND completed = TRUE;
  
  -- Get total modules
  SELECT COUNT(*) INTO v_total_modules
  FROM modules
  WHERE course_id = p_course_id;
  
  -- Calculate completed modules (a module is complete if all its videos are complete)
  SELECT COUNT(*) INTO v_completed_modules
  FROM (
    SELECT m.id
    FROM modules m
    JOIN videos v ON v.module_id = m.id
    LEFT JOIN user_progress up ON up.video_id = v.id AND up.user_id = p_user_id
    WHERE m.course_id = p_course_id
    GROUP BY m.id
    HAVING COUNT(v.id) > 0 AND COUNT(v.id) = COUNT(CASE WHEN up.completed = TRUE THEN 1 ELSE NULL END)
  ) AS completed_modules;
  
  -- Calculate percentage
  IF v_total_videos > 0 THEN
    v_progress_percentage := (v_completed_videos * 100) / v_total_videos;
  ELSE
    v_progress_percentage := 0;
  END IF;
  
  RETURN QUERY SELECT 
    v_total_videos AS total_videos,
    v_completed_videos AS completed_videos,
    v_progress_percentage AS progress_percentage,
    v_total_modules AS total_modules,
    v_completed_modules AS completed_modules;
END;
$$ LANGUAGE plpgsql;
