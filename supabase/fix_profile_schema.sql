-- Fix Profile Schema
-- Purpose: Add missing updated_at column to profiles table.

-- 1. Add column if not exists
alter table public.profiles 
add column if not exists updated_at timestamptz default now();

-- 2. Force Schema Cache Reload (by touching the table)
comment on table public.profiles is 'User profiles with contact info and avatar.';

-- 3. Verify
select column_name, data_type 
from information_schema.columns 
where table_schema = 'public' 
and table_name = 'profiles'
and column_name = 'updated_at';
