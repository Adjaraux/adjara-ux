-- FIX: Storage Policies (Inlined Admin Check)
-- This replaces the previous function-based policy with a direct RLS check to avoid permission issues.

-- 1. Drop potentially broken policies
DROP POLICY IF EXISTS "Admins can do everything on academy_content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can do everything on agency_deliverables" ON storage.objects;

-- 2. Policy for Academy Content (Direct Check)
CREATE POLICY "Admins can do everything on academy_content"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'academy_content' 
  AND auth.role() = 'authenticated'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  bucket_id = 'academy_content' 
  AND auth.role() = 'authenticated'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. Policy for Agency Deliverables (Direct Check)
CREATE POLICY "Admins can do everything on agency_deliverables"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'agency_deliverables' 
  AND auth.role() = 'authenticated'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  bucket_id = 'agency_deliverables' 
  AND auth.role() = 'authenticated'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Ensure Buckets Exist (Idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('academy_content', 'academy_content', false),
  ('agency_deliverables', 'agency_deliverables', false)
ON CONFLICT (id) DO NOTHING;
