-- ★本番の 台帳から 写しました（no018_step2_extend_get_invitation_teacher）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


create or replace function public.get_invitation_teacher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.teacher_invitations%rowtype;
  v_teacher_name text;
  v_school text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  select * into v_row
  from public.teacher_invitations
  where code = upper(trim(p_code))
  limit 1;

  if v_row.code is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_row.used_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_row.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  select nullif(trim(coalesce(p.display_name, '')), ''),
         nullif(trim(coalesce(p.school, '')), '')
    into v_teacher_name, v_school
  from public.profiles p
  where p.id = v_row.teacher_id;

  return jsonb_build_object(
    'ok', true,
    'teacher', jsonb_build_object(
      'display_name', v_teacher_name,
      'school', v_school
    )
  );
end;
$function$;

revoke all on function public.get_invitation_teacher(text) from public;
revoke all on function public.get_invitation_teacher(text) from anon;
grant execute on function public.get_invitation_teacher(text) to authenticated;

