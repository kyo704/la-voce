-- ============================================================================
-- ★先生の コマ を 読む 道 ── ★裁定 その99 F1（★2026-09-19）
--
--   ★★★学長（`sched_all`）が、★先生を 選んで 日程を 組めるように します。
--     ★★組む 画面の 行は「その 先生の コマ」です。
--     ★★★`my_periods` は ご本人 だけ の 表 です。★学長は 読めません。
--       ★★決まりは 緩めません。★読み道を 1本 立てます（★裁定 その98 と 同じ 形）。
--
--   ★★★返すのは 時間の 割り方 だけ です ── ★名・はじまり・おわり。
--     ★★何の 授業か は 返しません。★`my_timetable` に 触りません。
--
--   ★★門 ── ★`sched_all` を 持つ 方 か、★ご本人。
--     ★★その 先生が その 学校に 居る ことも 見ます。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create or replace function public.get_teacher_periods(
  p_org_id uuid,
  p_teacher_id uuid
) returns table (ord smallint, name text, start_min smallint, end_min smallint)
language sql stable security definer set search_path to 'public'
as $$
  select p.ord, p.name, p.start_min, p.end_min
  from my_periods p
  where p.user_id = p_teacher_id
    and (
      p_teacher_id = auth.uid()
      or has_can(p_org_id, 'sched_all')
    )
    and exists (
      select 1 from memberships m
      where m.org_id = p_org_id and m.user_id = p_teacher_id
    )
  order by p.ord
$$;

comment on function public.get_teacher_periods(uuid, uuid) is
  '先生の コマ（時間の 割り方）だけ を 返す。何の 授業かは 返さない。'
  '門は sched_all か ご本人。裁定その99 F1・2026-09-19。';

revoke all on function public.get_teacher_periods(uuid, uuid) from public, anon;
grant execute on function public.get_teacher_periods(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select proname, prosecdef, pg_get_function_result(oid)
--   from pg_proc where proname = 'get_teacher_periods';
--
--   ★返りは `TABLE(ord smallint, name text, start_min smallint, end_min smallint)`。
--   ★`title` `room` `memo` は 1つも ありません。
