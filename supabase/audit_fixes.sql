-- 🔒 AUDIT FIXES: System Hardening (Pre-Stripe)

-- 1. MESSAGING: Allow Assigned Talents to Chat
-- Problem: Students could not see/send messages for projects they are assigned to.
drop policy if exists "Talents can view messages for assigned projects" on public.messages;
create policy "Talents can view messages for assigned projects"
on public.messages for select
using (
  auth.uid() in (
    select assigned_talent_id from public.projects where id = messages.project_id
  )
);

drop policy if exists "Talents can insert messages for assigned projects" on public.messages;
create policy "Talents can insert messages for assigned projects"
on public.messages for insert
with check (
  auth.uid() in (
    select assigned_talent_id from public.projects where id = project_id
  )
);

-- 2. AGENCY CLIENTS: Restrict Visibility
-- Problem: "Everyone can view client profiles" was too permissive (exposed billing info).
drop policy if exists "Everyone can view client profiles" on public.agency_clients;

-- Allow Admins to view everything
drop policy if exists "Admins can view all agency clients" on public.agency_clients;
create policy "Admins can view all agency clients"
on public.agency_clients for select
using ( public.is_admin() );

-- Allow Clients to view their own
-- (Already covered by "Clients can manage their own profile" usually, but let's be explicit for SELECT)
create policy "Clients can view own agency profile"
on public.agency_clients for select
using (auth.uid() = id);

-- Allow Assigned Talents to view SPECIFIC columns? 
-- RLS filters rows, not columns. 
-- We must rely on the API/Server Action (`getStudentMissionDetails`) to sanitize data.
-- So we DO NOT allow generic select for Talents on this table.
-- `getStudentMissionDetails` uses `getAdminClient()` (Service Role) to fetch safe data (Industry), so no RLS needed for Talents here.

-- 3. STORAGE: Enable Agency Deliverables for Students
-- Problem: Bucket was Admin-only. Students need to upload work.
-- We allow any authenticated user to INSERT (Upload). 
-- Security is enforced by folder structure (Project ID) & read access (Signed URLs only).

drop policy if exists "Authenticated can upload deliverables" on storage.objects;
create policy "Authenticated can upload deliverables"
on storage.objects for insert
with check (
  bucket_id = 'agency_deliverables' 
  and auth.role() = 'authenticated'
);

-- Read Access: Admins + Owner + Assigned Talent?
-- Simplest is: Owners (Uploader) and Admins.
-- Students don't need to read *other* files in the bucket, only their own?
-- Or generally, we use Signed URLs for everything, so we don't need broad SELECT policies for non-admins.
-- `getSignedUrlAction` uses Service Role or Admin Client, so it bypasses RLS to generate token. 
-- Users accessing the link don't hit RLS, they hit Storage Server with token.
-- So NO `select` policy needed for Students/Clients if we strictly use Signed URLs.

-- 4. CLEANUP: Ensure `agency_deliverables` bucket exists
insert into storage.buckets (id, name, public)
values ('agency_deliverables', 'agency_deliverables', false)
on conflict (id) do nothing;
