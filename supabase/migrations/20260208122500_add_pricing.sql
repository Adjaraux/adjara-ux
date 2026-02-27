-- Migration: Add Pricing & Currency to Projects
-- Run this in your Supabase SQL Editor

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS final_price numeric, -- Set by Admin later
ADD COLUMN IF NOT EXISTS currency text default 'XOF'; -- FCFA default

-- Optional: Update existing rows if any
UPDATE public.projects 
SET currency = 'XOF' 
WHERE currency IS NULL;
