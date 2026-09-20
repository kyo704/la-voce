-- ============================================================================
-- ★コマを 動かす 道（★見本 `P_kasaFix`・2026-09-20）
--
--   ★★★列ごとの 渡し（grant）で 動かす ことは できません。
--     ★★`scheduled_at` を 誰でも 書ける ように すると、
--       ★★**生徒 ご本人** も ご自分の レッスンの 時刻を 変えられます。
--       ★★（★`lessons_student_notice` が「自分の 行」を 許して います。
--         ★★止めて いるのは、★いま 列の 渡しが 無い こと だけ です。）
--     ★★★だから 列を 渡しません。★道を 1本 立てます。
--
--   ★★門は、★書き換えの 決まり と 同じ もの を 見ます ──
--     ★`sched_all` を 持つ 方、★または ご自分の コマ を 持つ `sched_mine` の 先生。
--
--   ★★★通らない ときは、★黙って 0行 返します。★わけを 返しません。
--     ★★「その コマが 在る か どうか」も 教えません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create or replace function public.move_lesson(
  p_lesson_id uuid,
  p_scheduled_at timestamptz default null,
  p_place_id uuid default null
) returns table (id uuid, scheduled_at timestamptz, place_id uuid)
language plpgsql volatile security definer set search_path to 'public'
as $$
declare
  v_org uuid;
  v_teacher uuid;
  v_student uuid;
begin
  select l.org_id, l.teacher_id, l.student_id
    into v_org, v_teacher, v_student
    from lessons l where l.id = p_lesson_id;
  if v_org is null then
    return;
  end if;

  if not (
    can_view_ops_perm(auth.uid(), v_org, v_student, 'sched_all')
    or (v_teacher = auth.uid()
        and can_view_ops_perm(auth.uid(), v_org, v_student, 'sched_mine'))
  ) then
    return;
  end if;

  return query
    update lessons l set
      scheduled_at = coalesce(p_scheduled_at, l.scheduled_at),
      place_id     = coalesce(p_place_id, l.place_id)
    where l.id = p_lesson_id
    returning l.id, l.scheduled_at, l.place_id;
end;
$$;

comment on function public.move_lesson(uuid, timestamptz, uuid) is
  'コマの 時刻と 場所 だけ を 動かす。門は sched_all か、ご自分の コマの sched_mine。'
  '通らない ときは 0行。2026-09-20・裁定 その108 ③。';

revoke all on function public.move_lesson(uuid, timestamptz, uuid) from public, anon;
grant execute on function public.move_lesson(uuid, timestamptz, uuid) to authenticated;
