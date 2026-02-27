-- Migration: Fix Agency Identity & Certificates Policies
-- Description: Adds client_type/phone to agency_clients and fixes RLS for certificates to allow Students/Graduates to verify their status.

-- 1. ENHANCE AGENCY IDENTITY
-- Create Enum if not exists
do $$ begin
    create type client_type as enum ('business', 'individual');
exception
    when duplicate_object then null;
end $$;

-- Add columns to agency_clients
alter table public.agency_clients 
add column if not exists client_type client_type default 'business',
add column if not exists phone text,
add column if not exists logo_url text;

-- 2. FIX CERTIFICATES RLS (Critical for Job Board)
-- Enable RLS just in case
alter table public.certificates enable row level security;

-- Policy: Users can view their OWN certificates
-- This allows the "exists (select 1 from certificates...)" check to pass for graduates.
drop policy if exists "Users can view their own certificates" on public.certificates;
create policy "Users can view their own certificates" 
on public.certificates for select 
using (auth.uid() = user_id);

-- Policy: Admins/Service Role can view all (Implicit bypass, but good for SELECTs if using authenticated admin client)
-- No extra policy needed for Service Role as it bypasses RLS.

-- 3. FIX PROFILES (Optional but good for consistency)
-- Ensure Query "client:profiles!client_id" in Admin Dashboard gets the agency data.
-- (Already handled by relation, but ensuring RLS allows reading linked profiles if needed by strict policies)
-- "Public profiles are viewable by everyone" usually exists. If not:
create policy "Public profiles are viewable by everyone" 
on public.profiles for select 
using (true);
