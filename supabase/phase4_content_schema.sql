-- PHASE 4.3: CONTENT SCHEMA (Chapters & Lessons)

-- 1. Create ENUMS
CREATE TYPE public.lesson_type AS ENUM ('video', 'text', 'pdf', 'quiz');
CREATE TYPE public.lesson_status AS ENUM ('draft', 'published', 'scheduled');

-- 2. Create CHAPTERS Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    position integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 3. Create LESSONS Table
CREATE TABLE IF NOT EXISTS public.lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    position integer NOT NULL DEFAULT 0,
    type public.lesson_type NOT NULL DEFAULT 'video',
    status public.lesson_status NOT NULL DEFAULT 'draft',
    
    -- Content Fields
    video_url text,      -- Path in Storage (for video)
    content_text text,   -- Markdown (for text)
    asset_url text,      -- Path in Storage (for pdf)
    
    duration integer DEFAULT 0, -- Seconds
    is_free_preview boolean DEFAULT false,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- CHAPTERS
-- Admins: Full Access
CREATE POLICY "Admins can manage chapters" ON public.chapters
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
-- Authenticated: Read Only
CREATE POLICY "Authenticated can view chapters" ON public.chapters
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- LESSONS
-- Admins: Full Access
CREATE POLICY "Admins can manage lessons" ON public.lessons
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
-- Authenticated: Read Only (We will refine this later based on Course Access logic)
CREATE POLICY "Authenticated can view published lessons" ON public.lessons
FOR SELECT USING (
  auth.role() = 'authenticated' AND status = 'published'
);
-- Allow Admin to see drafts via the ALL policy above, but ensure SELECT doesn't block them if they fall into generic auth bucket? 
-- The Admin ALL policy covers SELECT, so it overrides only if RLS is permissive or multiple policies apply (OR logic). 
-- Since policies are OR, Admins trigger the first one and get access. Students trigger the second one and see only published.

-- 6. RPC Functions for Reordering (Atomic Updates)

-- Reorder Chapters
CREATE OR REPLACE FUNCTION reorder_chapters(item_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_id uuid;
  idx integer;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  idx := 0;
  FOREACH item_id IN ARRAY item_ids
  LOOP
    idx := idx + 1;
    UPDATE public.chapters
    SET position = idx
    WHERE id = item_id;
  END LOOP;
END;
$$;

-- Reorder Lessons
CREATE OR REPLACE FUNCTION reorder_lessons(item_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_id uuid;
  idx integer;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  idx := 0;
  FOREACH item_id IN ARRAY item_ids
  LOOP
    idx := idx + 1;
    UPDATE public.lessons
    SET position = idx
    WHERE id = item_id;
  END LOOP;
END;
$$;
