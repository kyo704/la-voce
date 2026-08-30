-- ============================================================================
-- テスターの印（profiles.is_tester）
--
--   ★★★ これは課金の実装ではありません ★★★
--     docs/lavoce-権利と課金の線引き.md の凍結（G3 完了まで着手しない）は
--     破っていません。売っていません。値段も支払いも期限もありません。
--     ★仕上がっている機能を、テスターにだけ先に見せるための印です。
--     それ以外の人には「開発中」と出ます。
--     判定の正は lib/entitlements.js です。
--
--   ★is_admin と同じ扱いです。アプリの中に切り替えは作りません。
--     坂本さんが Supabase の Table Editor で手で立てます。
--     （アプリから配れるようにすると、配る画面と権限の設計が要ります）
--
--   ★既定は false。null も false と同じ扱いです（フェイルクローズ）。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 列を足す
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_tester boolean not null default false;

comment on column public.profiles.is_tester is
  'テスターの印。★課金ではない。仕上がった機能を先に見せるための印で、それ以外の人には「開発中」と出る。正は lib/entitlements.js。is_admin と同じく手で立てる。';

-- ---------------------------------------------------------------------------
-- ② 実際に立てる（★メールアドレスを確かめてから実行してください）
--
--    ★下の1行は、コメントを外してから実行してください。
--      間違ったアドレスのまま実行すると、別の人に先行公開されます。
-- ---------------------------------------------------------------------------

-- まず、その人が居ることを確かめる（1行返ること）
select id, email
  from auth.users
 where email = 'ayane.sop1300@gmail.com';

-- 確かめてから、次の1行のコメントを外して実行する
-- update public.profiles set is_tester = true
--  where id = (select id from auth.users where email = 'ayane.sop1300@gmail.com');

-- ---------------------------------------------------------------------------
-- ②-2 2人目（2026-08-30 追加）
--     ★同じ手順です。まず居ることを確かめ、そのあとで立ててください。
-- ---------------------------------------------------------------------------
select id, email
  from auth.users
 where email = 'topniel929@gmail.com';

-- update public.profiles set is_tester = true
--  where id = (select id from auth.users where email = 'topniel929@gmail.com');

-- ---------------------------------------------------------------------------
-- ③ 確かめる
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型", is_nullable as "null可",
       coalesce(column_default, '(既定値なし)') as "既定値"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name = 'is_tester';

select count(*) filter (where is_tester) as "テスター",
       count(*) filter (where not is_tester) as "それ以外"
  from public.profiles;
