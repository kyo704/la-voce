-- ============================================================================
-- ★空いて いる ところ を まとめて 返す ── ★裁定 その98 BLOCKER_2（★2026-09-19）
--
--   ★★★決まり（RLS）は 緩めません。★`my_timetable` は ご本人 だけ の ままです。
--     ★★読み道（`security definer`）を 1本 立てて、★そこから だけ 渡します。
--     ★★裁定 その57（層を またぐ 結合の 禁止）を 守った まま 解けます。
--
--   ★★★返すのは **2値 だけ** です ── ★空いて いるか、いないか。
--     ★★授業の 名・場所・備考・「来られない 理由」は 1つも 返しません。
--     ★★見本の 注 ──「あきではない、としか 伝わりません」。
--
--   ★★★門（★裁定 その98）
--     ★① `has_can(p_org_id, 'sched_all')` …… ★学校 全部の 日程を 組む 方
--     ★② 担当の 先生 ご本人 …… ★`assignments`（`ended_at is null`）
--     ★★どちらも 無い 方には、★0行 返ります。
--
--   ★★★古い 1人ぶんの 読み道を 落とします。
--     ★★同じ 名で 引数が ちがう ものを 足すと、★**重なり**（overload）に なります。
--     ★★この 蔵で 2度 やって、★2度 とも 古い ほうが 残りました。
--     ★★古い ほうは、★画面から 1度も 呼ばれて いません（★2026-09-19 に 数えました）。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 古い 1人ぶんを 落とす
-- ---------------------------------------------------------------------------
--   ★★`supabase/migration_preset_need_and_free_slots.sql` を もう一度 流すと、
--     ★★古い ものが 戻ります。★そのときは この ファイルを 流し直して ください。
drop function if exists public.get_student_free_slots(uuid);

-- ---------------------------------------------------------------------------
-- ★② まとめて 返す
-- ---------------------------------------------------------------------------
--   ★★`slot_key` は「曜日-時限」です（れい：`1-3`）。
--     ★★時限の 名（「2限」など）は 返しません。★学校ごとに ちがう 言い方 です。
create or replace function public.get_student_free_slots(
  p_org_id uuid,
  p_user_ids uuid[]
) returns table (user_id uuid, slot_key text, is_free boolean)
language sql stable security definer set search_path to 'public'
as $$
  select s.user_id,
         (d.weekday::text || '-' || p.ord::text) as slot_key,
         not exists (
           select 1 from my_timetable t
           where t.user_id = s.user_id
             and t.weekday = d.weekday
             and t.period_id = p.id
         ) as is_free
  from unnest(coalesce(p_user_ids, '{}'::uuid[])) as s(user_id)
  join my_periods p on p.user_id = s.user_id
  cross join (select generate_series(0, 6) as weekday) d
  where
    -- ★★その 学校に いま 在る 方 だけ（★やめた 方の 時間割は 出しません）
    exists (
      select 1 from enrollments e
      where e.org_id = p_org_id
        and e.student_id = s.user_id
        and e.status = 'active'
    )
    and (
      -- ★① 学校 全部の 日程を 組む できこと
      has_can(p_org_id, 'sched_all')
      -- ★② 担当の 先生 ご本人
      or exists (
        select 1 from assignments a
        where a.org_id = p_org_id
          and a.student_id = s.user_id
          and a.teacher_id = auth.uid()
          and a.ended_at is null
      )
    )
  order by s.user_id, d.weekday, p.ord
$$;

comment on function public.get_student_free_slots(uuid, uuid[]) is
  '空いているかどうかの2値だけを、まとめて返す。中身は返さない。'
  '門は sched_all か 担当の先生本人。裁定その98・2026-09-19。';

revoke all on function public.get_student_free_slots(uuid, uuid[]) from public, anon;
grant execute on function public.get_student_free_slots(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- ★③ 確かめ
-- ---------------------------------------------------------------------------
--   select p.proname, pg_get_function_identity_arguments(p.oid),
--          pg_get_function_result(p.oid)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname = 'get_student_free_slots';
--
--   ★1本 だけ の はず です（★`p_org_id uuid, p_user_ids uuid[]`）。
--   ★返りは `user_id` `slot_key` `is_free` の 3つ だけ です。
