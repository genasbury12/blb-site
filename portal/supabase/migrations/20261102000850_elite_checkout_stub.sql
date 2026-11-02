-- Placeholder until the Elite application migration replaces it: no one may check out for Elite yet.
create or replace function public.my_elite_checkout_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select false; $$;
revoke execute on function public.my_elite_checkout_allowed() from public, anon;
grant execute on function public.my_elite_checkout_allowed() to authenticated, service_role;
