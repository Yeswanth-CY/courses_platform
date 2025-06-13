-- Drop existing tables and recreate with proper relationships
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.learning_content CASCADE;
DROP TABLE IF EXISTS public.videos CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create courses table
CREATE TABLE public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create modules table with proper foreign key
CREATE TABLE public.modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create videos table with proper foreign key
CREATE TABLE public.videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  summary TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_content table
CREATE TABLE public.learning_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  xp_earned INTEGER DEFAULT 0,
  quiz_score INTEGER,
  challenge_completed BOOLEAN DEFAULT FALSE,
  challenge_response TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_modules_order ON public.modules(order_index);
CREATE INDEX idx_videos_module_id ON public.videos(module_id);
CREATE INDEX idx_videos_order ON public.videos(order_index);
CREATE INDEX idx_learning_content_module_id ON public.learning_content(module_id);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_module_id ON public.user_progress(module_id);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Enable all access for courses" ON public.courses FOR ALL USING (true);
CREATE POLICY "Enable all access for modules" ON public.modules FOR ALL USING (true);
CREATE POLICY "Enable all access for videos" ON public.videos FOR ALL USING (true);
CREATE POLICY "Enable all access for learning_content" ON public.learning_content FOR ALL USING (true);
CREATE POLICY "Enable all access for user_progress" ON public.user_progress FOR ALL USING (true);

-- Insert sample data
INSERT INTO public.courses (id, title, description) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Python Programming', 'Complete Python course from basics to advanced'),
('550e8400-e29b-41d4-a716-446655440002', 'Web Development', 'Full-stack web development with modern technologies'),
('550e8400-e29b-41d4-a716-446655440003', 'Data Science', 'Data analysis and machine learning fundamentals');

INSERT INTO public.modules (id, course_id, title, description, order_index) VALUES 
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Python Basics', 'Introduction to Python programming', 1),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Data Structures', 'Lists, dictionaries, and more', 2),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'Object-Oriented Programming', 'Classes and objects in Python', 3);

-- Insert sample videos
INSERT INTO public.videos (module_id, title, topic, drive_url, summary, order_index) VALUES 
('550e8400-e29b-41d4-a716-446655440011', 'Variables and Data Types', 'Python Fundamentals', 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view', '🚀 Learn the building blocks of Python! Master variables, strings, numbers, and booleans. Perfect for beginners! 💡', 1),
('550e8400-e29b-41d4-a716-446655440011', 'Control Flow', 'Python Fundamentals', 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view', '🎯 Master if statements, loops, and decision making in Python! Learn to control program flow like a pro! ⚡', 2);
