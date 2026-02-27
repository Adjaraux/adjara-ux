-- Ajout de la colonne sort_order à la table portfolio_projects
ALTER TABLE public.portfolio_projects ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Index pour optimiser le tri
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_sort_order ON public.portfolio_projects(sort_order);
