-- PHASE 1: MONETIZATION & PACKS
-- Description: Adds subscription management fields to profiles table.

-- 1. Create Enum for Packs
-- We use English terms for code, but mapped to "Essentiel", "Expert", "Master" in UI.
DO $$ BEGIN
    CREATE TYPE public.pack_type AS ENUM ('essentiel', 'expert', 'master');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add Columns to Profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pack_type public.pack_type DEFAULT null,
ADD COLUMN IF NOT EXISTS subscription_end timestamptz DEFAULT null;

-- 3. RLS Policies (Update)
-- Users can view their own subscription status (already covered by "view own profile")
-- Only Admins or Webhooks (Service Role) can update these fields.
-- The existing "Users can update own profile" policy might be too permissive if it allows updating all columns.
-- LET'S CHECK: 'feature_certificates.sql' or 'schema.sql' usually has "Users can update own profile".
-- If it uses `check (auth.uid() = id)`, it allows updating EVERYTHING. This is a risk!
-- A user could technically send an update to set their own pack_type if RLS allows it.

-- FIX: Restrict `pack_type` and `subscription_end` updates.
-- Since Supabase RLS for UPDATE is row-based, not column-based, we can't easily block specific columns for the owner *unless* we use a Trigger or split the table.
-- BETTE APPROACH: Access Control is server-side (Server Actions / Webhooks).
-- Client updates should go through an RPC or limited API.
-- For now, we assume the dashboard uses `supabase.auth.updateUser()` or `profiles` update for metadata like name/bio.
-- We will add a trigger to prevent user from changing these sensitive fields if they try.

CREATE OR REPLACE FUNCTION public.protect_subscription_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is NOT a service_role (superuser) trying to update sensitive fields
  -- We assume simple check: if current_user is 'authenticated' (web user)
  IF (auth.role() = 'authenticated') THEN
     -- Check if sensitive fields are being changed
     IF (NEW.pack_type IS DISTINCT FROM OLD.pack_type) OR 
        (NEW.subscription_end IS DISTINCT FROM OLD.subscription_end) THEN
        RAISE EXCEPTION 'You are not allowed to update subscription fields directly.';
     END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_subscription_trigger ON public.profiles;
CREATE TRIGGER protect_subscription_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.protect_subscription_fields();
