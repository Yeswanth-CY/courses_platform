-- Drop existing tables to recreate with new structure
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.learning_content CASCADE;
DROP TABLE IF EXISTS public.videos CASCADE;

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create videos table (now belongs to modules)
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  summary TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_content table (now for modules, not individual videos)
CREATE TABLE IF NOT EXISTS public.learning_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules(order_index);
CREATE INDEX IF NOT EXISTS idx_videos_module_id ON public.videos(module_id);
CREATE INDEX IF NOT EXISTS idx_videos_order ON public.videos(order_index);
CREATE INDEX IF NOT EXISTS idx_learning_content_module_id ON public.learning_content(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON public.user_progress(module_id);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all access for courses" ON public.courses FOR ALL USING (true);
CREATE POLICY "Enable all access for modules" ON public.modules FOR ALL USING (true);
CREATE POLICY "Enable all access for videos" ON public.videos FOR ALL USING (true);
CREATE POLICY "Enable all access for learning_content" ON public.learning_content FOR ALL USING (true);
CREATE POLICY "Enable all access for user_progress" ON public.user_progress FOR ALL USING (true);

-- Insert sample data
INSERT INTO public.courses (title, description) VALUES 
('Python Programming', 'Complete Python course from basics to advanced'),
('Web Development', 'Full-stack web development with modern technologies'),
('Data Science', 'Data analysis and machine learning fundamentals');

INSERT INTO public.modules (course_id, title, description, order_index) VALUES 
((SELECT id FROM public.courses WHERE title = 'Python Programming'), 'Python Basics', 'Introduction to Python programming', 1),
((SELECT id FROM public.courses WHERE title = 'Python Programming'), 'Data Structures', 'Lists, dictionaries, and more', 2),
((SELECT id FROM public.courses WHERE title = 'Python Programming'), 'Object-Oriented Programming', 'Classes and objects in Python', 3);
