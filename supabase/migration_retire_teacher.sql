-- ============================================================================
-- ★先生が 退く とき（★裁定 その104 Q2・2026-09-19）
--
--   ★★★坂本さんの お決め ──
--     「その 先生の `monka_teacher_id` を 持つ `teacher_invitations` を
--      ★すべて 閉じる。★引き金（trigger）では なく、★退職の 手順の 中で
--      ★はっきり 呼ぶ。★理由：引き金は 見えない。何が 起きたか 追えなく なる。」
--     「既に 入って いる 学生は そのまま。★`enrollments` は 閉じない。
--      ★`assignments` だけ `ended_at` を 閉じる。」
--
--   ★★★お決めの 字は `status='closed'` ですが、★この 蔵の
--     `teacher_invitations` に `status` の 列は ありません（★2026-09-19 に 数えました）。
--     ★★列を 足さずに 閉じます ── ★`expires_at` を いまに します。
--     ★★合言葉を 引く 道（`get_invitation_teacher`）は
--       ★`used_at is null and expires_at > now()` で 見て います。
--       ★★だから これで 引けなく なります。
--     ★★★入ろうと した 方には「入れませんでした」とだけ 出ます（★裁定 その77）。
--       ★★「無い」と「閉じた」を 分けません。★総当たりで 中が 分かる ため です。
--
--   ★★★`memberships` は 触りません。★学校に 居る か どうかは 別の 話 です
--     （★台帳 08-19「運営側の 退き方」。★まだ 決まって いません）。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create or replace function public.retire_teacher(
  p_org_id uuid,
  p_teacher_id uuid
) returns table (
  closed_invitations integer,
  closed_assignments integer,
  students_without_teacher integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv integer := 0;
  v_asg integer := 0;
  v_std integer := 0;
begin
  -- ★① 門 ── ★できこと で 見ます。
  if not public.has_can(p_org_id, 'meibo') then
    raise exception 'その 学校の 名簿を 直せません';
  end if;

  -- ★② 合言葉を 閉じます（★出した 方・門下の 先生、★どちらの 形でも）。
  with 閉 as (
    update public.teacher_invitations i
    set expires_at = now()
    where i.org_id = p_org_id
      and (i.monka_teacher_id = p_teacher_id or i.teacher_id = p_teacher_id)
      and i.used_at is null
      and i.expires_at > now()
    returning 1
  )
  select count(*) into v_inv from 閉;

  -- ★③ 担当を 閉じます（★消しません）。
  with 閉2 as (
    update public.assignments a
    set ended_at = now()
    where a.org_id = p_org_id
      and a.teacher_id = p_teacher_id
      and a.ended_at is null
    returning a.student_id
  )
  select count(*) into v_asg from 閉2;

  -- ★④ 門下が 未定に なった 方の 数（★事務が Q1 の 手順で 決め直します）。
  select count(*) into v_std
  from public.enrollments e
  where e.org_id = p_org_id
    and e.status = 'active'
    and not exists (
      select 1 from public.assignments a
      where a.org_id = p_org_id and a.student_id = e.student_id and a.ended_at is null
    );

  return query select v_inv, v_asg, v_std;
end;
$$;

-- ---------------------------------------------------------------------------
-- ★誰が 呼べるか ── ★取り上げてから 渡します
-- ---------------------------------------------------------------------------
revoke all on function public.retire_teacher(uuid, uuid) from public;
revoke all on function public.retire_teacher(uuid, uuid) from anon;
grant execute on function public.retire_teacher(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   select p.proname, p.prosecdef,
--          pg_get_function_identity_arguments(p.oid)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname = 'retire_teacher';
--
--   ★★引き金（trigger）を 作って いません。★わざと です ──
--     ★★「引き金は 見えない。★何が 起きたか 追えなく なる」（★お決め）。
