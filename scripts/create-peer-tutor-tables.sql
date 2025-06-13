-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create achievement_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievement_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(10) NOT NULL DEFAULT '🏆',
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for peer tutor interactions
CREATE TABLE IF NOT EXISTS peer_tutor_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  question TEXT NOT NULL,
  response JSONB NOT NULL,
  response_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  helpful BOOLEAN,
  feedback TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS peer_tutor_user_id_idx ON peer_tutor_interactions(user_id);
CREATE INDEX IF NOT EXISTS peer_tutor_created_at_idx ON peer_tutor_interactions(created_at);

-- Create table for frequently asked questions
CREATE TABLE IF NOT EXISTS peer_tutor_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  response JSONB NOT NULL,
  response_type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster category searches
CREATE INDEX IF NOT EXISTS peer_tutor_faqs_category_idx ON peer_tutor_faqs(category);

-- Create table for peer tutor user stats
CREATE TABLE IF NOT EXISTS peer_tutor_user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) UNIQUE,
  questions_asked INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  favorite_topics TEXT[],
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user stats
CREATE INDEX IF NOT EXISTS peer_tutor_user_stats_user_id_idx ON peer_tutor_user_stats(user_id);

-- Add XP rewards for peer tutor usage
INSERT INTO achievement_types (name, description, xp_reward, icon, category)
VALUES 
  ('curious_learner', 'Ask 10 questions to the Peer Tutor', 100, '🧠', 'engagement'),
  ('deep_thinker', 'Ask 50 questions to the Peer Tutor', 250, '🔍', 'engagement'),
  ('knowledge_seeker', 'Ask 100 questions to the Peer Tutor', 500, '📚', 'engagement'),
  ('tutor_enthusiast', 'Use Peer Tutor for 7 consecutive days', 300, '🎓', 'consistency'),
  ('question_master', 'Ask questions in 5 different categories', 200, '❓', 'exploration')
ON CONFLICT (name) DO NOTHING;

-- Insert some sample FAQs to get started
INSERT INTO peer_tutor_faqs (question, response, response_type, category)
VALUES 
  (
    'What is a variable in programming?',
    '{"title": "Variables: Named Storage Locations", "content": "Variables are like labeled containers in memory that hold data. They allow us to refer to data using meaningful names, making our code more readable and manageable.", "examples": ["age = 30", "name = \"John\"", "is_student = True"], "analogy": "Think of variables as labeled boxes where you can store different types of items."}',
    'notes',
    'programming_basics'
  ),
  (
    'How do I create a function in Python?',
    '{"term": "Python Function", "definition": "A reusable block of code that performs a specific task", "example": "def greet(name):\\n    return f\"Hello, {name}!\"", "usage": "greet(\"Alice\") # Returns: Hello, Alice!"}',
    'flashcard',
    'python_functions'
  ),
  (
    'What is the difference between a list and a tuple?',
    '{"scenario": "Storing student grades", "problem": "Need to store multiple grades but unsure whether to use list or tuple", "solution": "Use a list for grades that might change: grades = [85, 90, 78]. Use a tuple for fixed data: student_info = (\"John\", 20, \"Computer Science\")", "outcome": "Lists are mutable (changeable), tuples are immutable (unchangeable)"}',
    'practical_example',
    'data_structures'
  )
ON CONFLICT DO NOTHING;

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_peer_tutor_stats(p_user_id UUID, p_category TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  INSERT INTO peer_tutor_user_stats (user_id, questions_asked, total_xp_earned, last_interaction)
  VALUES (p_user_id, 1, 15, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    questions_asked = peer_tutor_user_stats.questions_asked + 1,
    total_xp_earned = peer_tutor_user_stats.total_xp_earned + 15,
    favorite_topics = CASE 
      WHEN p_category IS NOT NULL AND NOT (p_category = ANY(peer_tutor_user_stats.favorite_topics))
      THEN array_append(peer_tutor_user_stats.favorite_topics, p_category)
      ELSE peer_tutor_user_stats.favorite_topics
    END,
    last_interaction = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON peer_tutor_interactions TO authenticated;
GRANT ALL ON peer_tutor_faqs TO authenticated;
GRANT ALL ON peer_tutor_user_stats TO authenticated;
GRANT ALL ON achievement_types TO authenticated;
