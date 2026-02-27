-- Phase 2: The Agency - Database Schema
-- Version: 1.2.0 (Specs & Storage Fix)

-- ⚠️ WARNING: This drops existing Agency tables.
drop table if exists public.project_deliverables cascade;
drop table if exists public.project_applications cascade;
drop table if exists public.projects cascade;
drop table if exists public.agency_clients cascade;

-- Clean up rogue/legacy tables
drop table if exists public.project_milestones cascade;
drop table if exists public.project_documents cascade;

drop type if exists project_status;
drop type if exists payment_status;
drop type if exists application_status;
drop type if exists deliverable_type;

-- 1. Agency Clients (Profile Extension)
create table if not exists public.agency_clients (
  id uuid references public.profiles(id) on delete cascade primary key,
  company_name text not null,
  industry text,
  website_url text,
  billing_address jsonb,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Projects (Missions)
create type project_status as enum ('draft', 'pending_approval', 'open', 'in_progress', 'review', 'completed', 'cancelled');
create type payment_status as enum ('unpaid', 'paid', 'refunded');

create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) not null,
  title text not null,
  description text not null,
  budget_range text,
  final_price numeric, -- Set by Admin later
  currency text default 'XOF', -- FCFA
  status project_status default 'pending_approval',
  payment_status payment_status default 'unpaid',
  
  -- Files & Assets (Option B: JSONB Array)
  attachments jsonb default '[]'::jsonb,
  
  -- Dynamic Specifications (The "Meat" of the project)
  -- Stores all category-specific data: { "width": 50, "material": "Bois", "type": "T-Shirt" }
  specs jsonb default '{}'::jsonb,
  
  -- The Graduate Logic
  required_specialty text, 
  assigned_talent_id uuid references public.profiles(id),
  
  deadline timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Applications
create type application_status as enum ('pending', 'shortlisted', 'rejected', 'accepted');

create table if not exists public.project_applications (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  talent_id uuid references public.profiles(id) not null,
  cover_letter text,
  portfolio_link text,
  status application_status default 'pending',
  created_at timestamptz default now(),
  unique(project_id, talent_id)
);

-- 4. Deliverables
create type deliverable_type as enum ('contract', 'wireframe', 'design', 'code', 'invoice', 'other');

create table if not exists public.project_deliverables (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  uploader_id uuid references public.profiles(id) not null,
  file_url text not null,
  file_name text not null,
  file_type deliverable_type default 'other',
  created_at timestamptz default now()
);

-- ENABLE RLS
alter table public.agency_clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_applications enable row level security;
alter table public.project_deliverables enable row level security;

-- POLICIES

-- A. Agency Clients
create policy "Clients can manage their own profile" on public.agency_clients for all using (auth.uid() = id);
create policy "Everyone can view client profiles" on public.agency_clients for select using (true);

-- B. Projects
create policy "Clients can manage their own projects" on public.projects for all using (auth.uid() = client_id);

create policy "Graduates can view open projects" on public.projects for select 
using (
  status = 'open' AND 
  exists (select 1 from public.certificates where user_id = auth.uid())
);

create policy "Assigned talent can view their project" on public.projects for select using (auth.uid() = assigned_talent_id);

-- C. Applications
create policy "Talents can manage their own applications" on public.project_applications for all using (auth.uid() = talent_id);

create policy "Clients can view applications for their projects" on public.project_applications for select 
using (exists (select 1 from public.projects where id = project_applications.project_id and client_id = auth.uid()));

-- D. Deliverables
create policy "Uploader can manage deliverables" on public.project_deliverables for all using (auth.uid() = uploader_id);

create policy "Clients can view deliverables" on public.project_deliverables for select
using (exists (select 1 from public.projects where id = project_deliverables.project_id and client_id = auth.uid()));

create policy "Assigned Talent can view deliverables" on public.project_deliverables for select
using (exists (select 1 from public.projects where id = project_deliverables.project_id and assigned_talent_id = auth.uid()));

-- 5. Storage Buckets (Project Briefs)
insert into storage.buckets (id, name, public) values ('project-briefs', 'project-briefs', false) on conflict (id) do nothing;

-- Storage Policy Clean-up (Prevent "Already Exists" error)
drop policy if exists "Clients can upload briefs" on storage.objects;
drop policy if exists "Clients can view own briefs" on storage.objects;

-- Storage Policy Creation
create policy "Clients can upload briefs" on storage.objects for insert with check (bucket_id = 'project-briefs' AND auth.role() = 'authenticated');
create policy "Clients can view own briefs" on storage.objects for select using (bucket_id = 'project-briefs' AND auth.uid() = owner);
