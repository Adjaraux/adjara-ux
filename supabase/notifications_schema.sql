-- Phase 2.9: Notifications System
-- Purpose: Alerts for Status Changes and Assignments

create type notification_type as enum ('info', 'success', 'warning', 'action_required');

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type notification_type default 'info',
  link text, -- link to dashboard page
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table public.notifications enable row level security;

create policy "Users can view their own notifications" 
on public.notifications for select 
using (auth.uid() = user_id);

create policy "Users can update (mark read) their own notifications" 
on public.notifications for update 
using (auth.uid() = user_id);

-- Admins (Service Role) can insert notifications for anyone
-- Triggers/Functions will use Service Role or Security Definer
