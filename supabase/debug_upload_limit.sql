-- 1. Check current limit
SELECT name, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'academy_content';

-- 2. Force Update to 5GB (5368709120 bytes)
UPDATE storage.buckets
SET file_size_limit = 5368709120
WHERE name = 'academy_content';

-- 3. Check result again to confirm
SELECT name, file_size_limit 
FROM storage.buckets 
WHERE name = 'academy_content';
