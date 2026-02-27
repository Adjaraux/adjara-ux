-- Sprint 2.6: Agency Logic Repair
-- Add missing columns to agency_clients

-- 1. Add client_type
ALTER TABLE public.agency_clients 
ADD COLUMN IF NOT EXISTS client_type text CHECK (client_type IN ('individual', 'company'));

-- 2. Add contact_email (separate from auth email)
ALTER TABLE public.agency_clients 
ADD COLUMN IF NOT EXISTS contact_email text;

-- 3. Verify assigned_talent_id exists in projects (it should, but just in case)
-- DO NOTHING if it exists (it was seen in schema)

-- 4. Enable RLS for these new columns (implicit via table enablement)
