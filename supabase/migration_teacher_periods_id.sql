-- ============================================================================
-- ★先生の コマ に 番号を 足します（★2026-09-20）
--
--   ★★★見つけた こと ── ★画面の 約束が、★一度も はたらいて いません でした。
--     ★★見本の 字 ──「あなたの 予定が 入って いる 枠は 出しません」。
--     ★★★`openSlots` は `${曜日}-${コマの番号}` で 見比べます。
--       ★★`get_my_busy_slots` は `period_id`（`my_periods.id`）を 返します。
--       ★★★`get_teacher_periods` が **番号を 返して いません** でした。
--         ★★だから 片方が いつも `undefined` で、★1度も 一致しません。
--       ★★ご自分の 予定が 入って いる 枠が、★空きとして 出て いました。
--
--   ★★直しは 1つ ── ★`id` を 返りに 足します。
--     ★★返す ものは 増やしません。★時間の 割り方 だけ です。
--     ★★何の 授業か は、★きょうも 返しません（`my_timetable` に 触りません）。
--
--   ★★★返りの 形が 変わるので、★一度 落としてから 作り直します。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

drop function if exists public.get_teacher_periods(uuid, uuid);

create or replace function public.get_teacher_periods(
  p_org_id uuid,
  p_teacher_id uuid
) returns table (id uuid, ord smallint, name text, start_min smallint, end_min smallint)
language sql stable security definer set search_path to 'public'
as $$
  select p.id, p.ord, p.name, p.start_min, p.end_min
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
  '先生の コマ（番号と 時間の 割り方）だけ を 返す。何の 授業かは 返さない。'
  '門は sched_all か ご本人。裁定その99 F1・2026-09-19／番号を足した 2026-09-20。';

revoke all on function public.get_teacher_periods(uuid, uuid) from public, anon;
grant execute on function public.get_teacher_periods(uuid, uuid) to authenticated;
