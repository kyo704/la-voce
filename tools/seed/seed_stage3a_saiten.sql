-- ★段3a の 仕込み ── ★採点の 権（★試しの 台帳・2026-09-21）
--
--   ★★★なぜ 要るか ── ★測って 分かった こと です。
--     ★★見本は「採点 ›」と「なおす」を 出して います。
--     ★★実機は 出しません。★**作って いない から では ありません**。
--       ★★`lib/evaluation.js` …… `mayEditItems(perms) = can(perms, "saiten")`
--       ★★`VocalTracker.jsx:17287` …… 採点の 札も `saiten` か 審査員
--     ★★試しの 学校の 役職「学部長」に `saiten` が **ありません**。
--       ★★いま 持って いる 8つ ── bill / gyoji / koma / master /
--         meibo / renraku_all / sched_all / shukketsu
--
--   ★★★見本の 画面を 見て いる 人は、★採点の 権を 持って います。
--     ★★権の 無い 人で 測る 限り、★この 2つは 永遠に 「無い」と 出ます。
--
--   ★★★これは 既に ある 行の **書き換え** です。★お言葉を いただいてから。
--   ★走らせ方 …… python3 tools/ask_ledger.py --test --write -f tools/seed/seed_stage3a_saiten.sql
--   ★戻し方 ……… tools/seed/undo_stage3a_saiten.sql

update public.org_posts
   set perms = perms || '{"saiten": true}'::jsonb
 where id = '33333333-3333-4333-8333-333333333333';
