-- 1. Ensure is_admin() helper exists
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 2. Create Agency Settings Table
CREATE TABLE IF NOT EXISTS public.agency_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'Antygravity Agency',
    address TEXT,
    siret TEXT,
    email_contact TEXT,
    logo_url TEXT,
    vat_rate NUMERIC DEFAULT 20.0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ensure Singleton (Only one row)
INSERT INTO public.agency_settings (company_name)
SELECT 'Antygravity Agency'
WHERE NOT EXISTS (SELECT 1 FROM public.agency_settings);

-- 4. RLS
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read agency settings" ON public.agency_settings;
CREATE POLICY "Public read agency settings"
ON public.agency_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin update agency settings" ON public.agency_settings;
CREATE POLICY "Admin update agency settings"
ON public.agency_settings FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin insert agency settings" ON public.agency_settings;
CREATE POLICY "Admin insert agency settings"
ON public.agency_settings FOR INSERT
WITH CHECK (public.is_admin());
