-- 1. Table des projets de portfolio
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    pohl TEXT NOT NULL, -- 'textile-perso', 'design-dev', 'engraving'
    category TEXT NOT NULL, -- Sub-category ID
    image_url TEXT NOT NULL,
    video_url TEXT,
    tags TEXT[] DEFAULT '{}',
    client TEXT,
    year TEXT NOT NULL,
    wizard_path TEXT NOT NULL,
    tech_specs TEXT,
    links JSONB DEFAULT '{}'::jsonb, -- { web: '', appStore: '', playStore: '' }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bucket de stockage pour les assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio-assets', 'portfolio-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Politiques de sécurité (RLS)
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tout le monde
DROP POLICY IF EXISTS "Allow public read access" ON public.portfolio_projects;
CREATE POLICY "Allow public read access" ON public.portfolio_projects
    FOR SELECT USING (true);

-- Modification réservée aux admins
DROP POLICY IF EXISTS "Allow admin full access" ON public.portfolio_projects;
CREATE POLICY "Allow admin full access" ON public.portfolio_projects
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' 
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Politiques Storage pour le bucket portfolio-assets
-- Lecture publique
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio-assets');

-- Upload/Delete réservé aux admins
DROP POLICY IF EXISTS "Admin CRUD" ON storage.objects;
CREATE POLICY "Admin CRUD" ON storage.objects FOR ALL USING (
    bucket_id = 'portfolio-assets' AND (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

-- 5. Trigger pour l'update auto du updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolio_projects_updated_at
    BEFORE UPDATE ON public.portfolio_projects
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
