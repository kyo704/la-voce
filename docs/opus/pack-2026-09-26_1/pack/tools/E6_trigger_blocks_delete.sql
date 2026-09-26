create or replace function public.blocker() returns trigger language plpgsql as $$
begin
  if old.confirmed_at is not null then raise exception 'NO_DELETE'; end if;
  return old;
end $$;
create trigger t_block before delete on public.evaluation_reviews for each row execute function public.blocker();
