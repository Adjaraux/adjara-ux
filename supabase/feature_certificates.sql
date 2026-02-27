-- 1. Add certification threshold to courses
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS min_score_to_certify INTEGER DEFAULT 80; -- Using 80 as consistent percentage default, or 10 if out of 20? User said "default 10", implying x/20. But our system calculates percentages internally (score/max_score). Let's stick to percentage (80%) for system consistency, or convert.
-- User said "default 10" which usually means 10/20 in French system.
-- Our grading is "score / max_score" (integer points).
-- If we store a threshold, is it a Percentage (0-100) or a raw score? Percentage is safer across different quiz sizes.
-- "par défaut 10". If it's x/20, that's 50%.
-- Let's check existing logic: `const passed = scorePercentage >= 80;` in submitQuiz. This is hardcoded.
-- If I add `min_score_to_certify` to courses, I should probably use it.
-- Let's set it to integers representing "Minimum Global Average Percentage" (e.g. 50, 70, 80).
-- "Default 10" might be specific to user's mental model. I will add comment to clarify usage (e.g. 50%).
-- Actually, strict instruction "par défaut 10". I will assume this is 10/20 (50%).
-- But wait, if I put 10, and my system compares percentage (which is 0-100), 10% is very low.
-- I'll use 50 (percent) as default in SQL for now, but name it `min_passing_grade` percent for clarity?
-- User request: "min_score_to_certify (par défaut 10)". I will use `min_score_to_certify` but treat it as a scale of 20? or 100?
-- Standard for modern apps is %.
-- Let's assume standard French notation /20.
-- I will create the column as INT DEFAULT 10. And I will document that it corresponds to a grade out of 20 in the RPC logic.

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS min_score_to_certify INTEGER DEFAULT 10; -- Scale of 20

-- 2. Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    final_grade DECIMAL(5,2) NOT NULL, -- Stored as x/20 or percentage? Let's use x/20 to match threshold.
    storage_path TEXT, -- Path to PDF in Storage
    metadata JSONB, -- Extra info (instructor name at time of signing, etc)
    UNIQUE(user_id, course_id)
);

-- RLS for Certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Public read access (for verification page) - actually usually verification is done via specific RPC or public ID lookup.
-- We can allow public select if they know the ID.
CREATE POLICY "Certificates are viewable by everyone" ON certificates
  FOR SELECT USING (true);

-- 3. RPC: Calculate Student Grade
-- Returns standard grade /20 based on weighted average.
create or replace function get_student_grade(
  p_course_id uuid,
  p_user_id uuid
) returns jsonb
language plpgsql security definer
as $$
declare
  total_weighted_score decimal := 0;
  total_weighted_max decimal := 0;
  v_weight int;
  v_score int;
  v_max_score int;
  v_lesson record;
  v_final_grade_20 decimal;
begin
  -- Loop through all PUBLISHED lessons of the course (video/quiz)
  -- We join chapters to ensure course linkage
  for v_lesson in 
    select l.id, l.weight, up.score, up.max_score
    from lessons l
    join chapters c on l.chapter_id = c.id
    left join user_progress up on l.id = up.lesson_id and up.user_id = p_user_id
    where c.course_id = p_course_id
    and l.status = 'published'
    and (l.type = 'quiz' or l.type = 'video') -- Only graded types? Videos might have embedded quiz.
  loop
    v_weight := coalesce(v_lesson.weight, 1);
    v_score := coalesce(v_lesson.score, 0);
    v_max_score := coalesce(v_lesson.max_score, 0);
    
    -- Only count if max_score > 0 (meaning there was something to grade)
    if v_max_score > 0 then
      total_weighted_score := total_weighted_score + (v_score * v_weight);
      total_weighted_max := total_weighted_max + (v_max_score * v_weight);
    end if;
  end loop;

  if total_weighted_max = 0 then
    v_final_grade_20 := 0;
  else
    -- Calculate percentage then convert to /20
    v_final_grade_20 := (total_weighted_score / total_weighted_max) * 20;
  end if;

  return jsonb_build_object(
    'grade_20', round(v_final_grade_20, 2),
    'grade_100', round((total_weighted_score / nullif(total_weighted_max, 0)) * 100, 2),
    'total_points', total_weighted_score,
    'max_points', total_weighted_max
  );
end;
$$;
