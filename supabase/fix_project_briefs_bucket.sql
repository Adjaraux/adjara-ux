-- Create 'project-briefs' bucket for Client Uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-briefs', 'project-briefs', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Admins can do everything
CREATE POLICY "Admins can do everything on project-briefs"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'project-briefs' 
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'project-briefs' 
  AND public.is_admin()
);

-- Policy: Clients can upload to their own folder (or just upload in general for now)
-- For simplicity in this Wizard flow, we allow authenticated users to upload.
-- In a stricter system, we'd check project ownership, but for creation, the project doesn't exist yet.
-- So we allow authenticated uploads, but restricting updates/deletes.

CREATE POLICY "Auth users can upload to project-briefs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-briefs' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can view their own uploads? 
-- Actually, we use Signed URLs for everything now, so we don't need public select policies 
-- if we strictly use the admin-signed-url flow.
-- BUT, the Wizard Client side might need to show the file immediately after upload?
-- The Wizard uses `getPublicUrl` in line 180 of page.tsx:
-- const { data } = supabase.storage.from('project-briefs').getPublicUrl(fileName);
-- This implies the bucket SHOULD be public, OR we need signed URLs there too.

-- CRITICAL FIX: The Wizard expects Public URLs. 
-- If we want private, we must change Wizard to use Signed URLs or make bucket public.
-- The User asked for "Private Agency".
-- So we should really make the bucket private and fix the Wizard to use Signed URLs or just show the name.

-- However, to unblock the Admin 404 access, the bucket MUST exist.
-- Let's make it private (as per request) and fix the Admin access first.
