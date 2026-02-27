-- Sprint 2.4: Private Agency Columns & Security

-- 1. Add Deadline & Admin Notes
alter table public.projects 
add column if not exists deadline timestamptz,
add column if not exists admin_notes text;

-- 2. Indexes
create index if not exists idx_projects_assigned_talent on public.projects(assigned_talent_id);
create index if not exists idx_projects_deadline on public.projects(deadline);

-- 3. SECURITY: SEAL THE AGENCY CLIENTS (Private Agency Mode)
-- Previously, "Everyone can view client profiles" was true.
-- We must REVOKE this. Only Admins (Service Role) and the Client themselves should see their data.

drop policy if exists "Everyone can view client profiles" on public.agency_clients;

-- New Policy: Only the owner can view (and Admin via bypass)
create policy "Clients can view own profile" 
on public.agency_clients for select 
using (auth.uid() = id);

-- Note: Admin uses Service Role which bypasses RLS, so no specific Admin policy needed.
-- Students attempting 'select * from agency_clients' will now get EMPTY rows.
