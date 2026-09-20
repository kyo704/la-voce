-- ============================================================================
-- ★出欠の 守りを、★台帳にも 置きます（★裁定 その115 Q1・2026-09-20）
--
--   ★★★いま どう なって いるか（★2026-09-20 に 数えました）──
--     ★`lessons` の 書き換えの 決まりは 3つ あり、★どれも **許す** 向き です。
--       ①`lessons_student_notice` …… `auth.uid() = student_id`
--       ②`Teachers can update or delete org lessons` …… sched_all ／ 自分の コマ
--       ③`Teacher can update or delete lessons` …… 1対1の つながり
--     ★★列の 渡しは `attendance` `attendance_at` `attendance_by`
--       `student_notice` `student_notice_at` の 5つ です。
--     ★★★つまり ── ★**生徒 ご本人が、★ご自分の 出欠を 書けます**。
--       ★★`shukketsu`（出欠を つける）を 持って いなくても 書けます。
--       ★★画面では 止めて います。★台帳では 止めて いません でした。
--
--   ★★★決まり（RLS）で 止められません。★行は 見えますが、★**どの 列を
--     ★★書き換えようと して いるか** は 見えないからです。
--     ★★止めると、★生徒の「お知らせを 読んだ」まで 一緒に 止まります。
--
--   ★★★だから ── ★列の 渡しを 取り上げ、★道を 1本 立てます。
--     ★`mark_attendance(コマ, 印)` …… ★門は `has_can(学校, 'shukketsu')`。
--     ★★`move_lesson`（2026-09-20）と 同じ 形 です。
--
--   ★★画面の 守りは 残します（★裁定 その115 ── ★二重に します）。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create or replace function public.mark_attendance(
  p_lesson_id uuid,
  p_status text default null
) returns table (id uuid, attendance text, attendance_at timestamptz, attendance_by uuid)
language plpgsql volatile security definer set search_path to 'public'
as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    return;
  end if;
  -- ★★印は 3つ と 空 だけ です。★知らない 字を 入れません。
  if p_status is not null and p_status not in ('came', 'absent', 'canceled') then
    return;
  end if;

  select l.org_id into v_org from lessons l where l.id = p_lesson_id;
  if v_org is null then
    return;
  end if;

  -- ★★★門は できこと です。★役割の 名では ありません。
  if not public.has_can(v_org, 'shukketsu') then
    return;
  end if;

  return query
    update lessons l set
      attendance = p_status,
      attendance_at = case when p_status is null then null else now() end,
      attendance_by = case when p_status is null then null else auth.uid() end
    where l.id = p_lesson_id
    returning l.id, l.attendance, l.attendance_at, l.attendance_by;
end;
$$;

comment on function public.mark_attendance(uuid, text) is
  '出欠を つける 道。門は has_can(org, shukketsu)。裁定その115 Q1・2026-09-20。';

revoke all on function public.mark_attendance(uuid, text) from public, anon;
grant execute on function public.mark_attendance(uuid, text) to authenticated;

-- ★★★列の 渡しを 取り上げます。★これで 直には 書けません。
--   ★★`student_notice` は そのまま です（★生徒 ご本人の もの）。
revoke update (attendance, attendance_at, attendance_by) on table public.lessons
  from authenticated;
