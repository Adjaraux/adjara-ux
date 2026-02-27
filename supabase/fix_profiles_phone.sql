-- 🛠️ FIX PROFILES: Add Phone Column
-- Purpose: Support storing phone number in the main profile table.

-- 1. ADD COLUMN
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Force Schema Cache Reload
COMMENT ON COLUMN public.profiles.phone IS 'User contact number';
