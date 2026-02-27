-- FIX: Visibility & Permissions (Profiles + Courses)
-- Ensures users can read their own profile (critical for logic) and read all courses.

-- 1. PROFILES: Allow Users to read their own data
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT USING (
  auth.uid() = id
);

-- 2. COURSES: Allow Authenticated users to read ALL courses
-- (We filter in the UI based on pack/specialty, but the API should return everything needed)
DROP POLICY IF EXISTS "Enable read access for eligible students" ON public.courses;
DROP POLICY IF EXISTS "Authenticated can view courses" ON public.courses;

CREATE POLICY "Authenticated can view courses" ON public.courses
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- 3. Verify Grants (Just in case)
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.courses TO authenticated;
