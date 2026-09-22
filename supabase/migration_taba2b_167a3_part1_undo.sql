-- ★束2b ① を 戻す（2026-09-22）。★足した 5列を 守らない 形に 戻します。
begin;

create or replace function public.profiles_guard_server_only_columns()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  guarded text;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  guarded := null;

  if new.is_admin is distinct from old.is_admin then guarded := 'is_admin';
  elsif new.is_tester is distinct from old.is_tester then guarded := 'is_tester';
  elsif new.cohort is distinct from old.cohort then guarded := 'cohort';
  elsif new.teacher_beta_access is distinct from old.teacher_beta_access
    then guarded := 'teacher_beta_access';
  elsif new.deleted_at is distinct from old.deleted_at then guarded := 'deleted_at';
  elsif new.reauth_at is distinct from old.reauth_at then guarded := 'reauth_at';
  elsif new.is_internal is distinct from old.is_internal then guarded := 'is_internal';
  elsif new.character_points_spent is distinct from old.character_points_spent
    then guarded := 'character_points_spent';
  end if;

  if guarded is not null then
    raise exception 'SERVER_ONLY_COLUMN: %', guarded
      using hint = 'この列は、サーバの側からだけ変えられます。';
  end if;

  return new;
end;
$function$;

commit;
