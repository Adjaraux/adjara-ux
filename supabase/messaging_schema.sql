-- 💬 MIGRATION: MESSAGING SYSTEM (SPRINT 2.5)

-- 1. Create Messages Table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  attachments jsonb default '[]'::jsonb, -- Array of {name, url, type}
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- 2. RLS Policies (IRON DOME)

-- Helper to check if user is admin (if not already exists)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Policy: Admin Access (ALL)
create policy "Admins can view all messages"
on public.messages for select
using ( public.is_admin() );

create policy "Admins can insert messages"
on public.messages for insert
with check ( public.is_admin() );

create policy "Admins can update messages"
on public.messages for update
using ( public.is_admin() );

-- Policy: Client Access (Own Projects ONLY)
create policy "Clients can view messages for own projects"
on public.messages for select
using (
  auth.uid() in (
    select client_id from public.projects where id = messages.project_id
  )
);

create policy "Clients can insert messages for own projects"
on public.messages for insert
with check (
  auth.uid() in (
    select client_id from public.projects where id = project_id
  )
);

-- Policy: Explicit DENY for Students (Implicitly handled by not having a policy, but good to be aware)
-- Students are NOT Admins and are NOT Clients of the project (usually).
-- If a Student IS a Client (edge case), they follow Client rules.

-- 3. Realtime Enablement
-- We need to enable realtime for this table specifically
alter publication supabase_realtime add table public.messages;

-- 4. Notifications Trigger
-- When a message is sent:
-- IF sender is Client -> Notify Admins
-- IF sender is Admin -> Notify Client

create or replace function public.handle_new_message_notification()
returns trigger as $$
declare
  v_project_title text;
  v_client_id uuid;
begin
  -- Get Project Info
  select title, client_id into v_project_title, v_client_id
  from public.projects
  where id = new.project_id;

  -- 1. If Sender is Client -> Notify Admins
  if new.sender_id = v_client_id then
    insert into public.notifications (user_id, title, message, type, link)
    select 
      id, 
      'Nouveau message client', 
      'Message reçu sur le projet ' || v_project_title, 
      'info', 
      '/dashboard/admin/projects' -- Link to admin project view
    from public.profiles 
    where role = 'admin';
  
  -- 2. If Sender is Admin -> Notify Client
  else
    -- Assuming sender is Admin (or system), notify Client
    insert into public.notifications (user_id, title, message, type, link)
    values (
      v_client_id,
      'Nouveau message de l''agence',
      'Vous avez reçu un message concernant ' || v_project_title,
      'info',
      '/dashboard/client/projects/' || new.project_id
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Attach Trigger (After Insert)
drop trigger if exists on_new_message on public.messages;
create trigger on_new_message
after insert on public.messages
for each row execute function public.handle_new_message_notification();
