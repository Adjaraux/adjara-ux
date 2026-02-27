-- Phase 7: In-Video Quiz Support

-- 1. Add 'trigger_at' column to questions (nullable)
-- Value = seconds from start. If NULL, it's an end-of-lesson quiz.
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS trigger_at integer DEFAULT NULL;

-- 2. Update RPC 'get_lesson_quiz' to include 'trigger_at'
CREATE OR REPLACE FUNCTION get_lesson_quiz(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'text', q.text,
      'type', q.type,
      'position', q.position,
      'points', q.points,
      'trigger_at', q.trigger_at, -- NEW FIELD
      'answers', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'text', a.text,
            'position', a.position
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
