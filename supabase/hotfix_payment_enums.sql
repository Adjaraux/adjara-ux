-- HOTFIX: Align enums and constraints for Moneroo and Education Packs

-- 1. Add 'moneroo' to payment_provider enum
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'moneroo';

-- 2. Add 'subscription' to transaction_type enum
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'subscription';

-- 3. Make project_id nullable to support training packs
ALTER TABLE agency_transactions ALTER COLUMN project_id DROP NOT NULL;
