-- Table to track validation failures
CREATE TABLE IF NOT EXISTS validation_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Table to track suspicious users
CREATE TABLE IF NOT EXISTS suspicious_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suspicion_level INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actions_taken JSONB,
  is_resolved BOOLEAN DEFAULT FALSE
);

-- Function to automatically flag suspicious users
CREATE OR REPLACE FUNCTION flag_suspicious_user()
RETURNS TRIGGER AS $$
DECLARE
  failure_count INTEGER;
BEGIN
  -- Count recent failures for this user
  SELECT COUNT(*) INTO failure_count
  FROM validation_failures
  WHERE user_id = NEW.user_id
  AND created_at > NOW() - INTERVAL '1 hour';
  
  -- If more than 5 failures in an hour, flag the user
  IF failure_count >= 5 THEN
    INSERT INTO suspicious_users (user_id, suspicion_level, reason)
    VALUES (
      NEW.user_id, 
      LEAST(failure_count / 5, 10), -- Scale suspicion level 1-10
      'Multiple validation failures: ' || failure_count || ' in the last hour'
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      suspicion_level = LEAST(suspicious_users.suspicion_level + 1, 10),
      reason = suspicious_users.reason || ', ' || 'New failures: ' || failure_count,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically flag suspicious users
CREATE TRIGGER flag_suspicious_user_trigger
AFTER INSERT ON validation_failures
FOR EACH ROW
EXECUTE FUNCTION flag_suspicious_user();

-- Create a view for easy monitoring of suspicious activity
CREATE OR REPLACE VIEW suspicious_activity_view AS
SELECT 
  u.id as user_id,
  u.username,
  u.email,
  COUNT(DISTINCT vf.id) as validation_failures,
  MAX(su.suspicion_level) as suspicion_level,
  MAX(su.updated_at) as last_suspicious_activity,
  STRING_AGG(DISTINCT vf.reason, ', ') as failure_reasons
FROM 
  users u
LEFT JOIN 
  validation_failures vf ON u.id = vf.user_id
LEFT JOIN 
  suspicious_users su ON u.id = su.user_id
WHERE 
  vf.created_at > NOW() - INTERVAL '7 days'
  OR su.updated_at > NOW() - INTERVAL '7 days'
GROUP BY 
  u.id, u.username, u.email
HAVING 
  COUNT(DISTINCT vf.id) > 3
ORDER BY 
  MAX(su.suspicion_level) DESC NULLS LAST,
  COUNT(DISTINCT vf.id) DESC;
