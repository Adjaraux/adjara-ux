-- Création de la table de configuration globale du site
CREATE TABLE IF NOT EXISTS public.site_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertion des valeurs par défaut pour les vidéos YouTube
INSERT INTO public.site_configs (key, value, description)
VALUES 
    ('youtube_id_academy', 'dQw4w9WgXcQ', 'ID de la vidéo YouTube principale pour la page Académie'),
    ('youtube_id_prestations', 'dQw4w9WgXcQ', 'ID de la vidéo YouTube principale pour la page Prestations')
ON CONFLICT (key) DO NOTHING;

-- Configuration de la sécurité RLS
ALTER TABLE public.site_configs ENABLE ROW LEVEL SECURITY;

-- Lecture publique autorisée
CREATE POLICY "Public Read Access" 
ON public.site_configs FOR SELECT 
USING (true);

-- Écriture réservée aux administrateurs (nécessite le rôle admin dans profiles)
CREATE POLICY "Admin Write Access" 
ON public.site_configs FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
