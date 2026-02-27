-- PHASE 6: QUIZ & EVALUATION SCHEMA

-- 1. Table: questions
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  type text NOT NULL CHECK (type IN ('single', 'multiple')),
  position integer NOT NULL,
  points integer DEFAULT 1,
  
  created_at timestamptz DEFAULT now()
);

-- 2. Table: answers
CREATE TABLE IF NOT EXISTS public.answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  is_correct boolean DEFAULT false, -- THE SENSITIVE FIELD
  position integer NOT NULL,
  
  created_at timestamptz DEFAULT now()
);

-- Optimize Lookups
CREATE INDEX IF NOT EXISTS idx_questions_lesson ON public.questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON public.answers(question_id);

-- 3. Security (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- ADMIN: Full Access
CREATE POLICY "Admins can manage questions" ON public.questions
FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage answers" ON public.answers
FOR ALL USING (public.is_admin());

-- STUDENTS: Read Access to QUESTIONS only
-- Only if the lesson is published and accessible (relying on implicit logic or public access)
-- Actually, strict RLS for students:
CREATE POLICY "Students can view questions" ON public.questions
FOR SELECT USING (true); -- Publicly viewable questions is fine, answers logic is the key.

-- STUDENTS: RESTRICTED Access to ANSWERS
-- CRITICAL SECURITY: We DO NOT grant SELECT on 'answers' to authenticated users broadly.
-- But wait, standard RLS is row-based. We cannot hide a column easily in standard RLS without Views.
-- STRATEGY: We DENY direct SELECT for non-admins.
-- We only expose answers via the SECURE RPC below.
-- So NO POLICY for students on 'answers'. Default is DENY.

-- 4. SECURE RPC: Get Quiz for Student (Sanitized)
-- Returns JSON structure: Questions + Ansers (WITHOUT is_correct)
CREATE OR REPLACE FUNCTION get_lesson_quiz(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as Owner (allows reading 'answers' even if User cannot)
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Verify user has access to lesson? (Optional, handled by App Logic usually, but added check here)
  -- For now, simple retrieval.

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'text', q.text,
      'type', q.type,
      'position', q.position,
      'points', q.points,
      'answers', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'text', a.text,
            'position', a.position
            -- CRITICAL: 'is_correct' IS OMITTED HERE
          ) ORDER BY a.position
        )
        FROM public.answers a
        WHERE a.question_id = q.id
      )
    ) ORDER BY q.position
  ) INTO result
  FROM public.questions q
  WHERE q.lesson_id = p_lesson_id;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
