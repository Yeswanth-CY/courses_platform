-- Create a table to track user likes with unique constraints
CREATE TABLE IF NOT EXISTS user_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only like each item once
  CONSTRAINT unique_video_like UNIQUE (user_id, video_id),
  CONSTRAINT unique_module_like UNIQUE (user_id, module_id),
  CONSTRAINT unique_course_like UNIQUE (user_id, course_id),
  
  -- Ensure at least one target is specified
  CONSTRAINT check_like_target CHECK (
    (video_id IS NOT NULL)::integer + 
    (module_id IS NOT NULL)::integer + 
    (course_id IS NOT NULL)::integer = 1
  )
);

-- Create a table to track quiz completions with scores
CREATE TABLE IF NOT EXISTS user_quiz_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  time_spent INTEGER NOT NULL, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table to track video progress
CREATE TABLE IF NOT EXISTS user_video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  watch_time INTEGER NOT NULL, -- in seconds
  completion_percentage INTEGER NOT NULL CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for faster lookups
  UNIQUE (user_id, video_id, created_at)
);

-- Create a daily action counter table
CREATE TABLE IF NOT EXISTS user_daily_action_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  
  -- Ensure one record per user per action per day
  UNIQUE (user_id, action_type, date)
);

-- Create a function to increment daily action counts
CREATE OR REPLACE FUNCTION increment_daily_action_count()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_daily_action_counts (user_id, action_type, count, date)
  VALUES (NEW.user_id, NEW.action_type, 1, CURRENT_DATE)
  ON CONFLICT (user_id, action_type, date)
  DO UPDATE SET count = user_daily_action_counts.count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update daily counts
CREATE TRIGGER update_daily_action_count
AFTER INSERT ON user_actions
FOR EACH ROW
EXECUTE FUNCTION increment_daily_action_count();
