-- Clear any existing fake progress data
DELETE FROM user_progress WHERE user_id NOT IN (SELECT id FROM users);

-- Reset all progress to ensure it starts from 0
UPDATE user_progress SET 
  completed = FALSE,
  progress_percentage = 0
WHERE completed = TRUE AND user_id IN (SELECT id FROM users);

-- Ensure the user_progress table has the right constraints
ALTER TABLE user_progress 
ADD CONSTRAINT check_progress_percentage 
CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Add a constraint to ensure completed videos have 100% progress
ALTER TABLE user_progress 
ADD CONSTRAINT check_completed_progress 
CHECK ((completed = TRUE AND progress_percentage = 100) OR (completed = FALSE AND progress_percentage < 100));
