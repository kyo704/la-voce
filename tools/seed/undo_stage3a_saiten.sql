-- ★採点の 権を 戻す（★試しの 台帳 だけ・2026-09-21）
--   ★走らせ方 …… python3 tools/ask_ledger.py --test --write -f tools/seed/undo_stage3a_saiten.sql

update public.org_posts
   set perms = perms - 'saiten'
 where id = '33333333-3333-4333-8333-333333333333';
