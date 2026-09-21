-- ★段3a の 仕込み ── ★受け持ち だけ（★試しの 台帳・2026-09-21）
--
--   ★★★なぜ 別の 紙か ── ★`assignments` には 見張りが 付いて います
--     （`assert_student_is_adult`・`supabase/migration_block_minor_teacher_link.sql`）。
--     ★★`profiles.is_under_18 is false` の 人 だけ が 先生と つながれます。
--     ★★試しの 生徒は **未回答**（null）です。★そのままでは 入りません。
--
--   ★★★見張りを 外しません。★答えを 1つ 入れる だけ に します。
--     ★★これは 既に ある 行の **書き換え** です。★入れる だけ の 話 では
--       ありません。★坂本さんの お言葉を いただいてから 走らせます。
--
--   ★走らせ方 …… python3 tools/ask_ledger.py --test --write -f tools/seed/seed_stage3a_assignments.sql
--   ★戻し方 ……… tools/seed/undo_stage3a_test.sql と、
--                 update public.profiles set is_under_18 = null where id = 'dc8f0554-3aa1-496c-be26-d7c07ece8380';

update public.profiles set is_under_18 = false
 where id = 'dc8f0554-3aa1-496c-be26-d7c07ece8380';

-- ★① 受け持ち（★日程を組む の「先生を 選ぶ」段を 越える ため）
--     ★★あわせて、★くらべ用 たろう に 採点の 札が 出ます
--       （★VocalTracker.jsx:17287 ── ★門下を 持つ 先生は 審査員）。
insert into public.assignments (id, org_id, teacher_id, student_id, is_representative)
values
  ('aa000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'eafa63c2-4592-4996-8c7c-18ecbec5a34f',
   'dc8f0554-3aa1-496c-be26-d7c07ece8380', true),
  ('aa000000-0000-4000-8000-000000000002',
   '11111111-1111-4111-8111-111111111111',
   '4b027d0a-11de-4acc-ae63-f240300c78aa',
   'dc8f0554-3aa1-496c-be26-d7c07ece8380', false)
on conflict (id) do nothing;
