-- 1. Create PROFILES table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  role text check (role in ('eleve', 'client', 'admin', 'onboarding')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 3. Create the Trigger Function
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
  inscription_type text;
begin
  -- Check if email exists in 'inscriptions' table
  -- distinct on email in case of duplicates, though your app should check that
  select type_projet into inscription_type 
  from public.inscriptions 
  where email = new.email 
  order by created_at desc 
  limit 1;

  -- Determine Role based on Inscription Type
  if inscription_type = 'formation' then
    user_role := 'eleve';
  elsif inscription_type = 'prestation' then
    user_role := 'client';
  else
    user_role := null; -- No role yet, will trigger Onboarding flow
  end if;

  -- Insert into profiles
  insert into public.profiles (id, email, role)
  values (new.id, new.email, user_role);

  return new;
end;
$$ language plpgsql security definer;

-- 4. Create the Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Verification Query (Run this after signing up a user to check)
-- select * from public.profiles;
