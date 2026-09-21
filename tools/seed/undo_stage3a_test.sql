-- ★段3a の 仕込みを 戻す（★試しの 台帳 だけ・2026-09-21）
--   ★★`tools/seed/seed_stage3a_test.sql` で 入れた 行 だけ を 名指しで 消します。
--   ★★走らせ方 …… python3 tools/ask_ledger.py --test --write --ok -f tools/seed/undo_stage3a_test.sql

-- ============================================================================
delete from public.evaluation_items   where id in ('ff000000-0000-4000-8000-000000000001','ff000000-0000-4000-8000-000000000002','ff000000-0000-4000-8000-000000000003');
delete from public.lesson_presets     where id in ('ee000000-0000-4000-8000-000000000001','ee000000-0000-4000-8000-000000000002','ee000000-0000-4000-8000-000000000003');
delete from public.org_message_drafts where id in ('dd000000-0000-4000-8000-000000000001','dd000000-0000-4000-8000-000000000002');
delete from public.org_messages       where id in ('cc000000-0000-4000-8000-000000000001','cc000000-0000-4000-8000-000000000002');
delete from public.org_events         where id in ('bbbbbbbb-0000-4000-8000-000000000002','bbbbbbbb-0000-4000-8000-000000000003');
delete from public.assignments        where id in ('aa000000-0000-4000-8000-000000000001','aa000000-0000-4000-8000-000000000002');
