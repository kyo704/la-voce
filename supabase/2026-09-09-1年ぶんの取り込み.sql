-- ============================================================================
-- ★★この SQL は、★使いません（★2026-09-09・坂本さんの ご確認）。
--
--   ★★前提が 誤っていました。★「坂本さんの1年ぶん」は 存在しません。
--     ★あるのは、★このアプリを 作りはじめてからの 21日ぶんだけで、
--     ★それは すでに entries に 入っています。
--
--   ★★私の 落ち度です。★査読 §8 に そう書いてあったので、
--     ★在るものとして 読み、★確かめませんでした。
--
--   ★★消さずに 残します。★2つ 理由が あります。
--     ① ★これから 別の 取り込みが 要るとき、★この形が そのまま 使えます。
--        ★上書きしない（do nothing）作りと、★source='import' の 入れ方です。
--     ② ★★誤った前提で 作ったことを、★記録として 残すためです。
--        ★消すと、★同じ思い込みを もう一度 します。
--
--   ★★import_staging の 表は、★空のまま 残っています。
--     ★消してよいときは、★このファイルの いちばん下の 1行を 使ってください。
-- ============================================================================

-- ============================================================================
-- 1年ぶんの記録を 取り込む（2026-09-09）
--
--   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §7
--     「★坂本さんの1年ぶんは ★試すために 入れるもので、
--       ★判定に使う分とは 分けられるようにします。」
--
--   ★★Supabase の SQL Editor に 貼って 実行してください。
--   ★★何度 実行しても 安全です。★BEGIN も ROLLBACK も 使いません。
--
-- ----------------------------------------------------------------------------
-- ★★いちばん大事な 決めごと（★2つ）
--
--   ① ★すでに ある日は、★1行も 触りません（on conflict do nothing）。
--      ★★アプリで 書いた日を、★取り込みが 上書きしては いけません。
--      ★「受け取ったもの・書いたものを 黙って 消さない」という 決めです。
--      ★★do nothing です。★do update では ありません。★書き換えません。
--
--   ② ★取り込んだ行は、★すべて source = 'import' です。
--      ★★引き金は、★入っているものを 上書きしません（★§7 の SQL の ③）。
--      ★だから、★ここで 入れた 'import' が そのまま 残ります。
--      ★★判定からは、★いつでも 外れます（★「含める」を 選んでも）。
--      ★並べて 見ることは できます。★数えることも できます。
--
-- ----------------------------------------------------------------------------
-- ★★入れる前に、★1つ お尋ねしたいことが あります
--
--   ★1年ぶんの記録が、★いま どんな形で お手元に ありますか。
--     ★A　CSV（★列名つき）　　→ ★下の【方法A】
--     ★B　1行ずつ 書き出す　　→ ★下の【方法B】
--     ★C　ほかのアプリの 書き出し（JSON など）
--        → ★★形を 見せていただければ、★読み替えの SQL を 書きます。
--
--   ★★どの形でも、★下の「置き場（staging）」に いったん 入れてから、
--     ★同じ1つの 差し込みで entries へ 移します。
--     ★★こうすると、★入れ方が 変わっても、★entries への 入り口は 1つです。
-- ============================================================================


-- ---------------------------------------------------------------------------
-- ⓪【誰の記録か】★ここだけを、★ご自分で 確かめてください
--
--   ★★取り違えると、★他の方の 記録に 入ります。★必ず 目で 確かめてください。
-- ---------------------------------------------------------------------------
select id as "この id で 合っていますか", email as "メール"
  from auth.users
 where email = 'kyo0703opera@gmail.com';
-- ★★上の id を 控えてから、★下の :owner を すべて その id に 置き換えてください。
--   ★★置き換え忘れが 1か所でも あると、★そこだけ 入りません（★入り間違いません）。


-- ---------------------------------------------------------------------------
-- ①【置き場を 作る】★entries とは 別の 表です。★本番に 影響しません。
-- ---------------------------------------------------------------------------
create table if not exists public.import_staging (
  user_id uuid not null,
  date date not null,
  throat_condition int,
  voice_quality int,
  sleep_hours numeric,
  non_performance_speech_minutes numeric,
  throat_symptoms text[],
  notes text,
  voice_memo text,
  dinner_time text,
  bedtime text,
  meal_notes text,
  weight_kg numeric,
  primary key (user_id, date)
);

-- ★置き場は、★誰にも 見せません。★取り込みが 済んだら 消します（★⑥）。
alter table public.import_staging enable row level security;
revoke all on public.import_staging from anon;
revoke all on public.import_staging from authenticated;


-- ---------------------------------------------------------------------------
-- ②【方法A｜CSV から 入れる】★おすすめ
--
--   ★Supabase の 左メニュー → Table Editor → import_staging を 開く
--   ★→ Insert → Import data from CSV
--   ★★CSV の 1行目は、★上の 列名と 同じに してください。
--     ★user_id 列が 無ければ、★入れたあとに 下の1行で 埋められます。
-- ---------------------------------------------------------------------------
-- update public.import_staging set user_id = ':owner' where user_id is null;
--   ★★↑ user_id を 空で 入れた ときだけ、★コメントを 外して 使ってください。


-- ---------------------------------------------------------------------------
-- ③【方法B｜1行ずつ 書く】★数が 少ないとき
--
--   ★★下を ひな型に して、★行を 足してください。
--   ★同じ日を 2回 書いても、★1つに なります（on conflict do nothing）。
-- ---------------------------------------------------------------------------
-- insert into public.import_staging
--   (user_id, date, throat_condition, voice_quality, sleep_hours,
--    non_performance_speech_minutes, notes)
-- values
--   (':owner', '2025-09-10', 4, 4, 7.0, 60, 'ひとこと'),
--   (':owner', '2025-09-11', 3, 3, 6.5, 30, null)
-- on conflict (user_id, date) do nothing;


-- ---------------------------------------------------------------------------
-- ④【入れる前に 確かめる】★読むだけです。★何も 書きません。
--
--   ★★「ぶつかる日」を、★先に 数えます。
--     ★ぶつかる日は、★入りません。★アプリで 書いたほうが 残ります。
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.import_staging where user_id = ':owner')
                                                      as "置き場の 行数",
  (select count(*) from public.entries where user_id = ':owner')
                                                      as "いまの entries の 行数",
  (select count(*) from public.import_staging s
     join public.entries e on e.user_id = s.user_id and e.date = s.date
    where s.user_id = ':owner')
                                                      as "★ぶつかる日（★入りません）",
  (select min(date) from public.import_staging where user_id = ':owner') as "いちばん古い日",
  (select max(date) from public.import_staging where user_id = ':owner') as "いちばん新しい日";

-- ★★ぶつかる日が どれかを、★目で 見たいとき
select s.date as "ぶつかる日", e.throat_condition as "アプリで書いた のどの調子"
  from public.import_staging s
  join public.entries e on e.user_id = s.user_id and e.date = s.date
 where s.user_id = ':owner'
 order by s.date
 limit 50;


-- ---------------------------------------------------------------------------
-- ⑤【entries へ 移す】★ここが 本番です
--
--   ★★source = 'import' を、★はっきり 入れます。
--     ★引き金は、★入っているものを 上書きしません。★そのまま 残ります。
--   ★★on conflict do nothing。★すでに ある日は、★1行も 触りません。
-- ---------------------------------------------------------------------------
insert into public.entries (
  user_id, date, source,
  throat_condition, voice_quality, sleep_hours,
  non_performance_speech_minutes, throat_symptoms,
  notes, voice_memo, dinner_time, bedtime, meal_notes, weight_kg
)
select
  s.user_id, s.date, 'import',
  s.throat_condition, s.voice_quality, s.sleep_hours,
  s.non_performance_speech_minutes, coalesce(s.throat_symptoms, '{}'),
  s.notes, s.voice_memo, s.dinner_time, s.bedtime, s.meal_notes, s.weight_kg
  from public.import_staging s
 where s.user_id = ':owner'
on conflict (user_id, date) do nothing;


-- ---------------------------------------------------------------------------
-- ⑥【確かめ】★読むだけです
-- ---------------------------------------------------------------------------

-- ⑥-1 印ごとの 数。★取り込んだ分が 'import' に なっているか。
select coalesce(source, '（この列より前の記録）') as "印", count(*) as "行数"
  from public.entries
 where user_id = ':owner'
 group by source
 order by count(*) desc;

-- ⑥-2 ★アプリで 書いた日が、★書き換えられていないこと。
--      ★★'live' と NULL の 行数が、★取り込みの 前と 同じであること。
select count(*) as "★取り込み以外の 行数（★前と 同じはず）"
  from public.entries
 where user_id = ':owner' and (source is null or source <> 'import');

-- ⑥-3 ★これで 30日以上 書いている方が 立ったか（★査読 §8 の 宿題）。
select count(*) as "★のどの調子を 書いた日"
  from public.entries
 where user_id = ':owner' and throat_condition is not null;

-- ⑥-4 ★置き場を 消す。★取り込みが 済んでからで かまいません。
--      ★★entries には 触りません。★置き場の 表を 消すだけです。
-- drop table if exists public.import_staging;


-- ---------------------------------------------------------------------------
-- ★【置き場を 消す】★空のまま 残っている import_staging を 片づけます
--
--   ★★entries には 触りません。★置き場の 表を 消すだけです。
--   ★急ぎません。★残っていても、★誰にも 見えません
--     （★anon にも authenticated にも 権限を 渡していません）。
-- ---------------------------------------------------------------------------
-- drop table if exists public.import_staging;
