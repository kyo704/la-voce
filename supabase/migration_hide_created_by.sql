-- ============================================================================
-- ★裁定 その93 の 横断 ── ★`created_by` を 渡さない（★2026-09-19）
--
--   ★★★決まり（RLS）は **行** を 守ります。★**列** は 守りません。
--     ★★生徒 ご本人は `lessons` の ご自分の 行を 読めます。
--       ★★その 行の `created_by`（★誰が 作ったか）も 一緒に 渡って いました。
--     ★★在籍の 方は `org_events` の 行を 読めます。★同じく `created_by` も。
--
--   ★★★画面は 1度も 頼んで いません（★2026-09-19 に 数えました）。
--     ★★`LESSON_COLUMNS` にも `EVENT_COLUMNS` にも ありません。
--     ★★★けれど「頼まない」は「渡らない」では ありません。
--       ★★開発者の 道具で 頼めば、★渡ります。
--
--   ★★★ここでは 読み道（関数）を 作りません。★列の 権を 取り上げます。
--     ★★わけ ── ★**誰も 読んで いない** 列 だから です。
--       ★★型（`lesson_presets`）は、★事務は 読み、★学生は 読まない 列 でした。
--         ★★1つの 役 で 分ける 必要が あり、★列の 権では 分けられません。
--         ★★★だから あちらは 関数に しました。
--       ★★こちらは 誰も 読みません。★取り上げる だけ で 足ります。
--     ★★★あとで 運営が 要る と なった 日 ── ★そのときに 読み道を 作ります。
--       ★★列の 権を 戻すと、★生徒にも 戻ります。★戻さないで ください。
--
--   ★★★取り上げが 先、★渡すのが あと（★蔵の 決め）。
--     ★★列の `grant` は、★表の `grant` を 狭めません。★広い ほうが 勝ちます。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① ★レッスン
-- ---------------------------------------------------------------------------
--   ★★`insert` と `update` の 権は 触りません。★読む 権 だけ です。
revoke select on public.lessons from authenticated;
grant select (
  id, link_id, scheduled_at, duration_minutes, note, created_at,
  org_id, teacher_id, student_id,
  attendance, attendance_at, attendance_by,
  student_notice, student_notice_at
) on public.lessons to authenticated;

-- ---------------------------------------------------------------------------
-- ★② ★行事
-- ---------------------------------------------------------------------------
revoke select on public.org_events from authenticated;
grant select (
  id, org_id, event_date, start_time, end_time, kind, title,
  previous_date, withdrawn_at, created_at, updated_at,
  place, target_grades, target_courses
) on public.org_events to authenticated;

-- ---------------------------------------------------------------------------
-- ★③ ★確かめ
-- ---------------------------------------------------------------------------
--   select table_name, column_name
--   from information_schema.column_privileges
--   where table_schema='public' and grantee='authenticated'
--     and privilege_type='SELECT' and column_name='created_by'
--     and table_name in ('lessons','org_events');
--
--   ★0件 に なる はず です。
