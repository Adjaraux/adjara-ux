-- Augmenter la limite d'upload pour le bucket 'academy_content'
-- Supabase calcule la limite en Bytes.
-- 5 GB = 5 * 1024 * 1024 * 1024 = 5368709120 bytes

UPDATE storage.buckets
SET file_size_limit = 5368709120
WHERE name = 'academy_content';

-- Vérification (Optionnel)
select name, file_size_limit from storage.buckets where name = 'academy_content';
