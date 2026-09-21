-- ★本番の 台帳から 写しました（no020_accept_teacher_invitation_claim_first）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。

-- No.020 ② 招待コードを「先に取りに行く」形にする
-- 2026-09-14 裁定（Opus・坂本さん承認）
-- 変更点はひとつ。読んでから使用済みにするのではなく、
-- UPDATE ... WHERE used_at IS NULL で取り合い、勝った人だけが進む。
-- 例外の名前・順番・「無い／使用済み／期限切れ」を分けない決めは変えていない。
-- あわせて expires_at の条件が使用済みにする側にも入る（以前は code のみ）。
create or replace function public.accept_teacher_invitation(p_code text)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_teacher uuid;
  v_link_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- 先に取りに行く。行錠はこの UPDATE 自身が取る。
  -- 負けた側は 0 行になり、v_teacher が null のままになる。
  update public.teacher_invitations
     set used_at = now(), used_by_student_id = auth.uid()
   where code = p_code
     and used_at is null
     and expires_at > now()
  returning teacher_id into v_teacher;

  if v_teacher is null then
    raise exception 'INVITATION_NOT_USABLE';
  end if;

  if v_teacher = auth.uid() then
    raise exception 'CANNOT_LINK_TO_SELF';
  end if;

  begin
    insert into public.teacher_student_links
      (teacher_id, student_id, status, accepted_at)
    values (v_teacher, auth.uid(), 'active', now())
    returning id into v_link_id;
  exception
    when others then
      if sqlerrm like '%MINOR_TEACHER_LINK_BLOCKED%' then
        raise exception 'MINOR_NOT_ALLOWED';
      elsif sqlstate = '23505' then
        raise exception 'ALREADY_LINKED';
      else
        raise;
      end if;
  end;

  begin
    insert into public.link_consents
      (teacher_id, student_id, agreement_version, linked_at)
    values (v_teacher, auth.uid(), 'link-2026-09-03', now());
  exception
    when others then
      raise warning 'LINK_CONSENT_NOT_RECORDED: %', sqlerrm;
  end;

  return v_link_id;
end;
$function$;
