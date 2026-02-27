-- Add 'delivered' to the project_status enum
-- Run this statement ALONE.
-- If it says "unsafe use", it means you are trying to use it in the same transaction.
-- Just running this solitary line is the safest way.

ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'delivered' AFTER 'review';
