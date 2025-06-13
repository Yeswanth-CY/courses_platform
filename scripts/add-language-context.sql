-- Add language context to videos table to help with content generation
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS programming_language TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'beginner';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_programming_language ON public.videos(programming_language);
CREATE INDEX IF NOT EXISTS idx_videos_content_type ON public.videos(content_type);

-- Add language context to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS primary_language TEXT,
ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'general';

-- Add indexes for courses
CREATE INDEX IF NOT EXISTS idx_courses_primary_language ON public.courses(primary_language);
CREATE INDEX IF NOT EXISTS idx_courses_course_type ON public.courses(course_type);

-- Update learning_content table to store context information
ALTER TABLE public.learning_content
ADD COLUMN IF NOT EXISTS detected_language TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS generation_context JSONB;
