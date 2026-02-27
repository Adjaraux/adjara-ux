-- 1. Update PROFILES table with Academy Logic
-- Adding immutable subscription date and academic status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_start timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS pack_type text CHECK (pack_type IN ('essentiel', 'expert', 'master')),
ADD COLUMN IF NOT EXISTS specialty text CHECK (specialty IN ('textile', 'gravure', 'digital', 'none')) DEFAULT 'none';

-- 2. Create COURSES table (The Knowledge Base)
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text CHECK (category IN ('tronc_commun', 'specialite', 'incubation', 'lab')),
  related_specialty text CHECK (related_specialty IN ('textile', 'gravure', 'digital')), -- NULL allows for Tronc Commun
  unlock_at_month integer DEFAULT 0, -- 0 = Immediate, 3 = Specialty unlock
  description text,
  thumbnail_url text, -- URL to course image
  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS on Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Courses (The "Time-Lock" Logic)
-- Everyone can read courses IF:
-- 1. It's Tronc Commun (unlock_month <= current_month)
-- 2. OR It's their Specialty AND time is right
-- 3. OR It's Master pack

CREATE POLICY "Enable read access for eligible students" ON public.courses
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE
    -- Logic will be refined here or handled in Application Layer for complex dates,
    -- but for now allow read if authenticated. 
    -- We often handle precise "Time-Lock" filtering in the App/Middleware for UX (showing locked items)
    -- vs Database (hiding them completely). 
    -- For now, let's allow authenticated users to read table to display the "Locked" state UI.
    auth.role() = 'authenticated'
  )
);

-- 5. Insert Mock Data (Test Course)
INSERT INTO public.courses (title, slug, category, related_specialty, unlock_at_month, description)
VALUES 
('Fondamentaux du Graphisme', 'fondamentaux-graphisme', 'tronc_commun', NULL, 0, 'Le module essentiel pour débuter votre voyage créatif.'),
('Atelier Textile Avancé', 'atelier-textile', 'specialite', 'textile', 3, 'Techniques professionnelles de tissage et motifs.')
ON CONFLICT (slug) DO NOTHING;
