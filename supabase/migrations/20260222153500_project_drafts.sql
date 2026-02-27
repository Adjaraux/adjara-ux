-- Migration: Project Drafts (Recovery System)
CREATE TABLE IF NOT EXISTS public.project_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT, -- For non-logged in or guest tracking if needed
    step INTEGER DEFAULT 1,
    category_id TEXT,
    subcategory_id TEXT,
    form_data JSONB DEFAULT '{}'::jsonb,
    is_recovered BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.project_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own drafts"
ON public.project_drafts FOR ALL
USING (auth.uid() = user_id OR (user_id IS NULL AND true)); -- Allow guest drafts if session logic applied

-- Index for cron cleanup/recovery
CREATE INDEX IF NOT EXISTS idx_drafts_last_activity ON public.project_drafts(last_activity);
