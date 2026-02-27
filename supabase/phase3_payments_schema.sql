-- Phase 3: Hybrid Payments Schema (Stripe + CinetPay)

-- 1. Create Transaction Ledger
-- This table tracks Every Single Cent entering the agency.
create type payment_provider as enum ('stripe', 'cinetpay', 'manual');
create type transaction_type as enum ('deposit', 'full_payment', 'payout', 'refund');
create type transaction_status as enum ('pending', 'success', 'failed');

create table if not exists public.agency_transactions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) not null,
  user_id uuid references public.profiles(id) not null, -- Who paid (Client)
  amount integer not null, -- Stored in "centimes" (e.g. 500000 for 5000.00 or 5000 FCFA depending on currency, usually smallest unit)
  currency text default 'XOF',
  provider payment_provider not null,
  provider_ref text, -- Stripe Session ID or CinetPay Trans ID
  type transaction_type default 'full_payment',
  status transaction_status default 'pending',
  metadata jsonb default '{}'::jsonb, -- Store method details, etc.
  receipt_url text, -- Link to Stripe Invoice PDF or CinetPay Receipt
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.agency_transactions enable row level security;

-- 3. Policies
-- Admin sees all finance
create policy "Admins can view all transactions"
on public.agency_transactions for select
using ( public.is_admin() );

-- Clients see their own payments
create policy "Clients can view own transactions"
on public.agency_transactions for select
using ( auth.uid() = user_id );

-- 4. Update Projects Table (if not already handled)
-- Ensure 'payout_ready' is a status?
-- We use 'payment_status' enum existing: ('unpaid', 'paid', 'refunded')
-- We might add 'payout_ready' if we hold funds?
-- For now, 'paid' is sufficient for the Client -> Agency flow.
