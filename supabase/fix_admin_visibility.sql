-- 🛠️ FIX ADMIN DASHBOARD VISIBILITY (V2)
-- Summary: Unlocks full visibility for Admins on Profiles, Projects, and Certificates.

-- 1. PROFILES (Critical for User List & Joins)
-- Currently only "Users can view own profile". Admin needs to see all.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING ( public.is_admin() );

-- 2. PROJECTS (Critical for Admin Messages Inbox)
-- Admin needs to see projects to see nested messages.
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT
USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update all projects" ON public.projects;
CREATE POLICY "Admins can update all projects"
ON public.projects FOR UPDATE
USING ( public.is_admin() );

-- 3. CERTIFICATES (Critical for Certifications Page)
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all certificates" ON public.certificates;
CREATE POLICY "Admins can view all certificates"
ON public.certificates FOR SELECT
USING ( public.is_admin() );

-- 4. FOREIGN KEY FIX (For PostgREST Joins)
-- Ensure certificates.user_id points to public.profiles, not auth.users directly.
-- This allows: .select('*, profile:user_id(...)')

DO $$
BEGIN
    -- Only proceed if the constraint doesn't point to profiles yet or we want to force it.
    -- We'll try to drop the old one and add the new one safely.
    
    -- Check if we can modify the table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
        
        -- Attempt to drop generic constraint if it exists
        BEGIN
            ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_user_id_fkey;
        EXCEPTION WHEN OTHERS THEN NULL; END;

        -- Attempt to drop specific profiles constraint if it exists (to recreate)
        BEGIN
            ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_user_id_fkey_profiles;
        EXCEPTION WHEN OTHERS THEN NULL; END;

        -- Add the correct constraint
        ALTER TABLE public.certificates
        ADD CONSTRAINT certificates_user_id_fkey_profiles
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;

    END IF;
END $$;
