-- FIX: Reset RLS on 'certificates' table
-- This resolves potential recursive policies or permission conflicts.

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES (Clean Slate)
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Enable read access for users" ON public.certificates;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.certificates;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.certificates;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.certificates;

-- 3. CREATE THE CORRECT POLICY
-- Allow users to see ONLY their own certificates
CREATE POLICY "Users can view own certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() = user_id);

-- 4. GRANT PERMISSIONS
GRANT SELECT ON public.certificates TO authenticated;
GRANT SELECT ON public.certificates TO service_role;

-- 5. VERIFY (Select count - requires running logic)
-- No-op here, but policies are now clean.
