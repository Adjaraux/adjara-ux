-- Create a secure RPC function to check if an email exists and return the provider
-- Runs with "security definer" to allow access to auth system tables safely.

create or replace function public.check_email_status(email_input text)
returns json as $$
declare
  target_user_id uuid;
  has_password boolean;
  has_google boolean;
  user_exists boolean;
begin
  -- 1. Find User ID
  select id into target_user_id from auth.users where email = email_input limit 1;
  
  if target_user_id is null then
    return json_build_object('exists', false);
  end if;

  -- 2. Check for Password (encrypted_password is not null)
  select (encrypted_password is not null) into has_password 
  from auth.users 
  where id = target_user_id;

  -- 3. Check for Google Identity
  select count(*) > 0 into has_google 
  from auth.identities 
  where user_id = target_user_id and provider = 'google';

  return json_build_object(
    'exists', true,
    'has_password', has_password,
    'has_google', has_google
  );
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function public.check_email_status(text) to public;
grant execute on function public.check_email_status(text) to anon;
grant execute on function public.check_email_status(text) to authenticated;
