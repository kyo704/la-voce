-- 20260926_105 見本に 書いた 上限が ★台帳に ありません
-- ★★2026-09-26 に 見つけました（★見落としを 探していて）
--   ★見本:「★経歴 400字まで」「★出演歴 12件まで」
--   ★★台帳: ★制約 なし ── ★★書き放題 です
-- ★★これは ★sql/91 と 同じ 形:
--   ★★見本に 書いてあるのに ★台帳が 守って いません
-- ★104 のあと

-- ★① ★経歴（bio）── ★★800字（★2026-09-26・★坂本さんの お決め）
--   ★★★もとは 400字 でした。★当てる 前に 本番を 数えて、★変えました ──
--     ★400字を 超える 行が **1つ** ありました（★坂本さん ご自身・★676字）。
--     ★★`check` を 足すと、★その 行が 違反して `23514` で 止まります。
--     ★★★書いた ものを 切る ことは しません（★この 家の 決まり）。
--   ★★坂本さんの お決め（2026-09-26）── ★上限を **800字** に する。
--     ★★676 < 800 なので、★いま 入って いる 行は そのまま 通ります。
--   ★★★見本の「経歴 400字まで」も 直る ことに なります ── ★Opus へ 差し戻し 済み。
--   ★★実装の `BIO_MAX` も 同じ 日に 800 に しました（★`lib/portfolio.js`）。
--     ★★台帳と 画面で ちがう 数を 持たない ため です。
alter table public.portfolios drop constraint if exists portfolios_bio_len;
alter table public.portfolios add constraint portfolios_bio_len
  check (bio is null or char_length(bio) <= 800);
-- ★★char_length（★文字の 数）。★★octet_length では ありません
--   ★理由: ★日本語は ★1文字 3バイト。★byte で 数えると ★133字で 止まります

-- ★② ★お名前 ── ★60字
--   ★★見本は 約束して いません
--   ★理由: ★際限なく 長いと ★画面が 壊れます（★公開ページの 見出し）
--   ★★ほかの 126列には ★付けません:
--     ★★利用者が 自由に 書く 欄を ★止めるべきでは ありません
--     ★「600字まで」と 書いたのは ★節の 中身だけ です
alter table public.portfolios drop constraint if exists portfolios_name_len;
alter table public.portfolios add constraint portfolios_name_len
  check (display_name is null or char_length(display_name) <= 60);

-- ★③ ★出演歴 12件（★kind ごと）
--   ★★見本:「終わった 本番（12件まで）」
--   ★★これは ★出す ときの 上限 です（★持てる 数では ありません）
--   → ★★台帳では 止めません。★★関数で 数えます
create or replace function public.page_entries_capped(p_user uuid, p_kind text, p_max int default 12)
returns setof public.portfolio_entries
language sql stable security definer set search_path to 'public' as $$
  select * from public.portfolio_entries e
   where e.user_id = p_user and e.kind = p_kind
   order by e.sort_order, e.created_at desc
   limit greatest(p_max, 1);
$$;
revoke all on function public.page_entries_capped(uuid, text, int) from public;
grant execute on function public.page_entries_capped(uuid, text, int) to anon, authenticated;
-- ★★anon にも（★公開ページが 読みます）
-- ★★書ける 数は 止めません:
--   ★理由: ★★書いた ものを 消させる ことに なります
--         ★「出すのは 12件」で 足ります

-- ★④ ★1つの 節の 中身 ── ★600字（★見本の「文章 600字まで」）
alter table public.portfolio_entries drop constraint if exists portfolio_entries_detail_len;
alter table public.portfolio_entries add constraint portfolio_entries_detail_len
  check (detail is null or char_length(detail) <= 600);
alter table public.portfolio_entries drop constraint if exists portfolio_entries_title_len;
alter table public.portfolio_entries add constraint portfolio_entries_title_len
  check (title is null or char_length(title) <= 120);

-- ★★画面へ:
--   ★★入力の 欄でも 止めて ください（★台帳だけだと ★書いたあとに 怒られます）
--   ★「あと ◯字」を 出す。★★赤く しない（★裁定: 色を 使わない）

-- 確かめ（試しの環境で）
-- ★400字 ちょうど → 通る／★401字 → 止まる
-- ★★日本語 400字 → ★通る（★byte では ない）
-- ★page_entries_capped → ★12件で 止まる
