-- INJECT IMAGE DATA
-- "test1" has no image. We copy the known good path from the other course to prove the display works.

UPDATE public.courses
SET thumbnail_url = 'courses/fondamenteaux-en-graphisme/1769874839182-thumbnail.jpg'
WHERE title = 'test1';

-- Also ensure 'test1' is unlocked so it's clearly visible
UPDATE public.courses
SET unlock_at_month = 0
WHERE title = 'test1';
