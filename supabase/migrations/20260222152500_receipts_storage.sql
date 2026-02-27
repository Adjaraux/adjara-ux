-- Migration: Create Receipts Bucket
insert into storage.buckets (id, name, public) 
values ('receipts', 'receipts', false) 
on conflict (id) do nothing;

-- RLS Policies for Receipts
-- Admins can do everything
create policy "Admins have full access to receipts"
on storage.objects for all
using (bucket_id = 'receipts' AND (select role from profiles where id = auth.uid()) = 'admin');

-- Users can only read their own receipts
create policy "Users can view own receipts"
on storage.objects for select
using (bucket_id = 'receipts' AND auth.uid() = owner);
