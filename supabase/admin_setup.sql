-- 👑 ADMIN DASHBOARD COMPLETION
-- 1. Agency Settings Table (Singleton)
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

-- Ensure only one row exists (Singleton Pattern via constraint or logic)
-- We'll just insert one row if not exists and rely on app logic to update ID 1 (or the only row)
INSERT INTO public.agency_settings (company_name)
SELECT 'Antygravity Agency'
WHERE NOT EXISTS (SELECT 1 FROM public.agency_settings);

-- RLS
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read (for invoices)
CREATE POLICY "Public read agency settings"
ON public.agency_settings FOR SELECT
USING (true);

-- Only Admin can update
CREATE POLICY "Admin update agency settings"
ON public.agency_settings FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only Admin can insert (though we only want one row)
CREATE POLICY "Admin insert agency settings"
ON public.agency_settings FOR INSERT
WITH CHECK (public.is_admin());
