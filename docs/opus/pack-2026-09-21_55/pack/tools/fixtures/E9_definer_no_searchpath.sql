create or replace function public.leaky(p uuid) returns int language sql security definer as $$ select 1 $$;
grant execute on function public.leaky(uuid) to anon;
