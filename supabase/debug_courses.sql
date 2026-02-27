-- DEBUG: Check Courses and Policies
SELECT count(*) as total_courses FROM courses;

-- List courses to see if any exist
SELECT id, title, category, thumbnail_url, unlock_at_month FROM courses;

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses';
