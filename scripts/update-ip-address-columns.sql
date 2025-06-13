-- Update user_actions table to allow null IP addresses
ALTER TABLE IF EXISTS user_actions 
ALTER COLUMN ip_address DROP NOT NULL;

-- Update validation_failures table to allow null IP addresses
ALTER TABLE IF EXISTS validation_failures 
ALTER COLUMN ip_address DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN user_actions.ip_address IS 'IP address of the user (can be null in development/preview environments)';
COMMENT ON COLUMN validation_failures.ip_address IS 'IP address of the user (can be null in development/preview environments)';
