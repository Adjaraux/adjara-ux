-- Add score tracking to user_progress
ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 0;

-- Add weight/coefficient to lessons for weighted averages
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;

-- Update the get_lesson_quiz RPC if necessary (usually selects * from questions, so might not need update unless we want lesson weight)
-- But we might want to fetch lesson weight in the UI.

-- Security: Update view or policies if needed (usually standard RLS covers new columns if 'select *' is used)
