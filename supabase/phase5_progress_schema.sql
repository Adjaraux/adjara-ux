-- PHASE 5: PROGRESSION & ENGAGEMENT SCHEMA

-- 1. Table: user_progress
-- Stores both completion status and video resume position
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  
  -- Completion Status
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  
  -- Video Resume (Netflix-style)
  last_played_second integer DEFAULT 0,
  last_updated_at timestamptz DEFAULT now(),

  PRIMARY KEY (user_id, lesson_id)
);

-- Optimize for lookups by user and lesson (critical for CoursePlayer)
CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON public.user_progress(user_id, lesson_id);

-- 2. Security (RLS)
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Users can VIEW their own progress
CREATE POLICY "Users can view their own progress" ON public.user_progress
FOR SELECT USING (auth.uid() = user_id);

-- Users can INSERT their own progress
CREATE POLICY "Users can insert their own progress" ON public.user_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE their own progress
CREATE POLICY "Users can update their own progress" ON public.user_progress
FOR UPDATE USING (auth.uid() = user_id);


-- 3. RPC: Get Course Progress (Optimized for Dashboard)
-- Calculates the percentage completion for a set of courses in one go.
-- Returns: course_id, total_lessons, completed_lessons, progress_percent
CREATE OR REPLACE FUNCTION get_user_course_progress(course_ids uuid[])
RETURNS TABLE (
  course_id uuid,
  total_lessons bigint,
  completed_lessons bigint,
  progress_percent integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.course_id,
    COUNT(l.id) as total_lessons,
    COUNT(up.lesson_id) filter (where up.is_completed = true) as completed_lessons,
    CASE 
      WHEN COUNT(l.id) = 0 THEN 0
      ELSE (COUNT(up.lesson_id) filter (where up.is_completed = true) * 100 / COUNT(l.id))::integer
    END as progress_percent
  FROM public.chapters c
  JOIN public.lessons l ON l.chapter_id = c.id
  LEFT JOIN public.user_progress up ON l.id = up.lesson_id AND up.user_id = auth.uid()
  WHERE c.course_id = ANY(course_ids)
  AND l.status = 'published' -- Only count published lessons
  GROUP BY c.course_id;
END;
$$;
