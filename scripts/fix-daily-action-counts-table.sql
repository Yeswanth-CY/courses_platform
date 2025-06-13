-- First, let's check if the table exists and what columns it has
-- Then recreate it with the correct structure

-- Drop the existing table if it has wrong structure
DROP TABLE IF EXISTS user_daily_action_counts CASCADE;

-- Create the correct user_daily_action_counts table
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

-- Create index for better performance
CREATE INDEX idx_user_daily_action_counts_user_date ON user_daily_action_counts(user_id, action_date);
CREATE INDEX idx_user_daily_action_counts_action_type ON user_daily_action_counts(action_type);

-- Update the function to use correct column names
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_daily_action_count_trigger ON user_actions;
CREATE TRIGGER update_daily_action_count_trigger
AFTER INSERT ON user_actions
FOR EACH ROW
EXECUTE FUNCTION update_daily_action_count();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_daily_action_counts TO authenticated;
GRANT USAGE ON SEQUENCE user_daily_action_counts_id_seq TO authenticated;
