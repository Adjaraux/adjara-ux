-- INSTRUCTIONS:
-- 1. Replace 'votre-email@exemple.com' with the email address you used to sign up.
-- 2. Run this entire script in the Supabase SQL Editor.

WITH client_lookup AS (
  SELECT id FROM auth.users WHERE email = 'amasouguiti@gmail.com' LIMIT 1
),
new_project AS (
  INSERT INTO public.projects (client_id, title, status, service_type)
  SELECT id, 'Refonte Identité Visuelle 2026', 'in_progress', 'design'
  FROM client_lookup
  RETURNING id
)
INSERT INTO public.project_milestones (project_id, title, status, order_index, due_date, completed_at)
SELECT id, 'Brief & Cahier des Charges', 'completed', 1, now() - interval '10 days', now() - interval '8 days'
FROM new_project
UNION ALL
SELECT id, 'Propositions de Logo (V1)', 'completed', 2, now() - interval '5 days', now() - interval '1 day'
FROM new_project
UNION ALL
SELECT id, 'Déclinaison Charte Graphique', 'pending', 3, now() + interval '5 days', NULL
FROM new_project
UNION ALL
SELECT id, 'Livraison Finale (Fichiers HD)', 'pending', 4, now() + interval '12 days', NULL
FROM new_project;
