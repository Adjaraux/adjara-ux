-- FIX: Courses Table Permissions
-- Grants Admins full control (INSERT, UPDATE, DELETE) over the courses table.

-- 1. Create Policy for Admins
CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Note: The existing "Authenticated can view courses" policy handles the read access for students.
-- This new policy ADDS write capabilities specifically for admins.
