-- 🛠️ FIX: RLS Policies for Inscriptions Table
-- Purpose: Ensure Admins can read/delete messages and users can submit them.

-- 1. Enable RLS (if not already enabled)
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can insert inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Admins can view inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Admins can delete inscriptions" ON public.inscriptions;

-- 3. Create Policy: Public/Anon can INSERT (needed for the contact form)
CREATE POLICY "Public can insert inscriptions"
ON public.inscriptions
FOR INSERT
WITH CHECK (true);

-- 4. Create Policy: Admins can SELECT everything
-- We check for the 'admin' role in the profiles table for the current user
CREATE POLICY "Admins can view inscriptions"
ON public.inscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. Create Policy: Admins can DELETE
CREATE POLICY "Admins can delete inscriptions"
ON public.inscriptions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 💡 NOTE: If you are testing as an Admin, make sure your profile has role='admin'
-- Verification:
-- SELECT role FROM public.profiles WHERE id = auth.uid();
