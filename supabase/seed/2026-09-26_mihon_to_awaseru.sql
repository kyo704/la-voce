-- ============================================================================
-- ★試しの 台帳 だけ ── ★種を **見本と 同じ 字** に 合わせます（★2026-09-26）
--
--   ★★★なぜ ──
--     ★見比べの 道具は 数と 英字を `#` `@` に 置き替えますが、
--       ★お名前・教室の 名は そのまま くらべます。
--     ★★だから 種の 名が 見本と 違う だけ で、★毎回 差として 出ます。
--     ★★★Opus の ご指示（★2026-09-26）── 「fixed test data を 使う」。
--
--   ★★合わせる もの（★見本 `SC['教室の運営']`）──
--     ★教室の 名 …… ★「○○音楽大学」
--     ★お名前 …… ★「坂本 響」（★見本の 見せかけの 名 そのまま）
--     ★役職 …… ★「学長」（★もう 付いて います）
--     ★生徒を 招く の 行 …… ★`teacher_beta_access` が 要ります
--
--   ★★本番に 入れません。★`la-voce-test2` だけ です。
-- ============================================================================

update public.organizations
   set name = '○○音楽大学'
 where id = 'aaaa0001-0000-4000-8000-000000000001';

update public.profiles
   set display_name = '坂本 響',
       teacher_beta_access = true
 where id = 'e45e50eb-ed09-402f-9dc7-73bda4852380';

-- ★戻す とき
--   update public.organizations set name = '★たしかめ学園（大）'
--    where id = 'aaaa0001-0000-4000-8000-000000000001';
--   update public.profiles set display_name = null, teacher_beta_access = false
--    where id = 'e45e50eb-ed09-402f-9dc7-73bda4852380';
