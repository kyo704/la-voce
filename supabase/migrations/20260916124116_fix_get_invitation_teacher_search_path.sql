-- ★本番の 台帳から 写しました（fix_get_invitation_teacher_search_path）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


create or replace function public.get_invitation_teacher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_teacher uuid;
  v_result jsonb;
  v_code   text;
  v_hash   text;
  v_tries  integer;
  v_pepper text;
begin
  if auth.uid() is null then
    return null;
  end if;

  v_code := upper(trim(p_code));
  if v_code is null or v_code = '' then
    return null;
  end if;

  select value into v_pepper from public.app_secrets where name = 'code_pepper';

  if v_pepper is null or length(v_pepper) < 20 then
    raise warning '★code_pepper が ありません（または 短すぎます）。合言葉を 引けません。';
    return null;
  end if;

  v_hash := encode(digest(v_pepper || ' code ' || v_code, 'sha256'), 'hex');

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

