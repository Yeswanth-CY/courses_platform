-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  topic TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_content table for AI-generated content
CREATE TABLE IF NOT EXISTS public.learning_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Using TEXT for demo, in production use UUID with auth
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  xp_earned INTEGER DEFAULT 0,
  quiz_score INTEGER,
  challenge_completed BOOLEAN DEFAULT FALSE,
  challenge_response TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_course ON public.videos(course);
CREATE INDEX IF NOT EXISTS idx_videos_topic ON public.videos(topic);
CREATE INDEX IF NOT EXISTS idx_learning_content_video_id ON public.learning_content(video_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_video_id ON public.user_progress(video_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In production, you'd want more restrictive policies
CREATE POLICY "Enable read access for all users" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.videos FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.videos FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.learning_content FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.learning_content FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.user_progress FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.user_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.user_progress FOR UPDATE USING (true);
