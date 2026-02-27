-- Create 'quiz_attempts' table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    questions_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of Question IDs in order
    answers JSONB DEFAULT '{}'::jsonb, -- Map of QuestionID -> AnswerID
    score INTEGER DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Columns to 'lessons'
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 20, -- Duration in minutes
ADD COLUMN IF NOT EXISTS pool_size INTEGER DEFAULT 10; -- Number of questions to draw

-- Enable RLS on quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_attempts
CREATE POLICY "Users can view own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" 
ON public.quiz_attempts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts" 
ON public.quiz_attempts FOR UPDATE 
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_lesson ON public.quiz_attempts(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_lesson ON public.quiz_attempts(lesson_id);
