-- ★本番の 台帳から 写しました（create_code_attempts_and_rate_limit）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


create table if not exists public.code_attempts (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null,
  ip_hash   text,
  at        timestamptz not null default now()
);

create index if not exists code_attempts_code_at on public.code_attempts (code_hash, at desc);
create index if not exists code_attempts_ip_at   on public.code_attempts (ip_hash, at desc);
create index if not exists code_attempts_at      on public.code_attempts (at);

revoke all on public.code_attempts from anon, authenticated;

alter table public.code_attempts enable row level security;
alter table public.code_attempts force row level security;

grant insert, select, delete on public.code_attempts to service_role;

comment on table public.code_attempts is
  '合言葉の試行回数。合言葉そのものは持たない（塩つきハッシュ）。24時間で消す。';

create or replace function public.purge_code_attempts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.code_attempts where at < now() - interval '24 hours';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.purge_code_attempts() from public, anon, authenticated;
grant execute on function public.purge_code_attempts() to service_role;

create or replace function public.get_invitation_teacher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher uuid;
  v_result jsonb;
  v_code   text;
  v_hash   text;
  v_tries  integer;
begin
  if auth.uid() is null then
    return null;
  end if;

  v_code := upper(trim(p_code));
  if v_code is null or v_code = '' then
    return null;
  end if;

  v_hash := md5('code ' || v_code);

  select count(*) into v_tries
  from public.code_attempts
  where code_hash = v_hash
    and at > now() - interval '24 hours';

  if v_tries >= 10 then
    insert into public.code_attempts (code_hash) values (v_hash);
    return null;
  end if;

  insert into public.code_attempts (code_hash) values (v_hash);

  select i.teacher_id into v_teacher
  from public.teacher_invitations i
  where i.code = v_code
    and i.used_at is null
    and i.expires_at > now()
  limit 1;

  if v_teacher is null then
    return null;
  end if;

  select jsonb_build_object(
           'teacher_id', p.id,
           'display_name', nullif(trim(coalesce(p.display_name, '')), ''),
           'school', nullif(trim(coalesce(p.school, '')), '')
         )
    into v_result
  from public.profiles p
  where p.id = v_teacher;

  return v_result;
end;
$$;

revoke all on function public.get_invitation_teacher(text) from public, anon;
grant execute on function public.get_invitation_teacher(text) to authenticated;

