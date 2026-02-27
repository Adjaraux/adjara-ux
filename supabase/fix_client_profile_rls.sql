-- Fix Client Profile RLS & Permissions
-- Purpose: Ensure Clients can UPSERT their own agency_clients profile data.

-- 1. Ensure columns exist (Idempotent)
alter table public.agency_clients add column if not exists client_type text check (client_type in ('individual', 'company')) default 'company';
alter table public.agency_clients add column if not exists contact_email text;

-- 2. Reset RLS Policies for agency_clients
alter table public.agency_clients enable row level security;

-- Drop existing potential conflicting policies
drop policy if exists "Clients can manage their own profile" on public.agency_clients;
drop policy if exists "Everyone can view client profiles" on public.agency_clients;
drop policy if exists "Clients can insert their own profile" on public.agency_clients;
drop policy if exists "Clients can update their own profile" on public.agency_clients;

-- Re-create explicit policies

-- ENABLE INSERT: User can insert a row if the ID matches their Auth ID
create policy "Clients can insert their own profile"
on public.agency_clients
for insert
with check (auth.uid() = id);

-- ENABLE UPDATE: User can update their own row
create policy "Clients can update their own profile"
on public.agency_clients
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- ENABLE SELECT: User can see their own, and potentially others if needed (e.g. admins or talents viewing client info)
-- For now, open visibility for transparency as per original design, or restrict?
-- Original was: "Everyone can view client profiles"
create policy "Everyone can view client profiles"
on public.agency_clients
for select
using (true);

-- 3. Grant Permissions to Authenticated Users
grant select, insert, update on public.agency_clients to authenticated;
grant usage on schema public to authenticated;

