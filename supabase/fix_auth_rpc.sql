-- FIX: Robust Email Check Function
-- Handles case-sensitivity and ensures permissions are correct.

CREATE OR REPLACE FUNCTION public.check_email_status(email_input text)
RETURNS json AS $$
DECLARE
  target_user_id uuid;
  has_password boolean;
  has_google boolean;
BEGIN
  -- 1. Search for user (Case Insensitive)
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = lower(email_input)
  LIMIT 1;

  -- 2. If not found, return false
  IF target_user_id IS NULL THEN
    RETURN json_build_object('exists', false);
  END IF;

  -- 3. Check for Password
  SELECT (encrypted_password IS NOT NULL) INTO has_password 
  FROM auth.users 
  WHERE id = target_user_id;

  -- 4. Check for Google Identity
  SELECT count(*) > 0 INTO has_google 
  FROM auth.identities 
  WHERE user_id = target_user_id AND provider = 'google';

  -- 5. Return Status
  RETURN json_build_object(
    'exists', true,
    'has_password', has_password,
    'has_google', has_google
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to everyone (including unauthenticated guests on login page)
GRANT EXECUTE ON FUNCTION public.check_email_status(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_status(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_status(text) TO service_role;
