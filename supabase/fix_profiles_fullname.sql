-- 🛠️ FIX PROFILES: Add Names and Avatars
-- Purpose: Add storage for user identity and sync it from Auth.

-- 1. ADD COLUMNS
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. UPDATE TRIGGER to Sync from Auth Metadata
-- This ensures future signups have their name/avatar immediately.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
  inscription_type text;
  meta_full_name text;
  meta_avatar_url text;
BEGIN
  -- Extract Metadata safely
  meta_full_name := new.raw_user_meta_data->>'full_name';
  meta_avatar_url := new.raw_user_meta_data->>'avatar_url';

  -- Check if email exists in 'inscriptions' table to determine role
  SELECT type_projet INTO inscription_type 
  FROM public.inscriptions 
  WHERE email = new.email 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Determine Role
  IF inscription_type = 'formation' THEN
    user_role := 'eleve';
  ELSIF inscription_type = 'prestation' THEN
    user_role := 'client';
  ELSE
    user_role := null; -- No role yet
  END IF;

  -- Insert into profiles with Metadata
  INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
  VALUES (new.id, new.email, user_role, meta_full_name, meta_avatar_url);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. OPTIONAL: Backfill for existing users?
-- We can't easily read auth.users.raw_user_meta_data from here without specific permissions or a loop.
-- However, we can update the rows to at least not be null if we have data elsewhere?
-- For now, the Frontend Fallback (Email) is the immediate fix for existing "Nameless" users.
-- But if we want to try a backfill from auth.users (requires superuser/postgres role usually):

-- UPDATE public.profiles p
-- SET 
--   full_name = a.raw_user_meta_data->>'full_name',
--   avatar_url = a.raw_user_meta_data->>'avatar_url'
-- FROM auth.users a
-- WHERE p.id = a.id
-- AND p.full_name IS NULL;

-- Since we are running as a user who might not have access to auth.users direct select in all environments,
-- we'll leave the backfill commented out or try it if we know we have permissions.
-- Given I am applying this, I will try to run the UPDATE. If it fails, it fails (safe).

DO $$
BEGIN
    BEGIN
        UPDATE public.profiles p
        SET 
            full_name = a.raw_user_meta_data->>'full_name',
            avatar_url = a.raw_user_meta_data->>'avatar_url'
        FROM auth.users a
        WHERE p.id = a.id
        AND (p.full_name IS NULL OR p.full_name = '');
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore permission errors
    END;
END $$;
