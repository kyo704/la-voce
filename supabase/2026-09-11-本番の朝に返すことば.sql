-- ============================================================================
-- 本番の 朝に、★ご本人が 前に 書いた ことばを そのまま 返す
--
--   ★出どころ Opus の 裁定（★2026-09-11・その15）
--     「②ことばのカード（本番の朝だけ）：入れてください。10月19日までに
--       必要な、優先度の高い機能です。動く見本の577〜582行を、そのまま、
--       移してください。アプリは、1文字も足さず、要約もせず、知らせも出さず、
--       書くよう誘わない、という決まりを、厳守してください。」
--
--   ★見本　00-動く見本（さわれる・全画面）.html
--     ★574行　var HONBAN={d,n,pl,kot}
--     ★577〜582行　本番の 朝だけ「きょう」の いちばん上に 出す
--     ★1051〜1062行　SC['本番の予定']　★書く 場所
--
--   ★★何を するか
--     ★performances に、★1つ 欄を 足すだけです。
--     ★★表も 権限も 作りません。★すでに ある 表に 足します。
--
--   ★★アプリは この 字を 読みません。★そのまま 出すだけです。
--     ★要約しません。★数えません。★分析に 使いません。
--     ★★だから「自由記述を 作らない」の 決まりに 触れません。
--       ★label と 同じ 扱いです（★2026-09-07 の 覚え書き §1.2）。
--
--   ★★長さ　500字まで。
--     ★★label は 40字です。★こちらは 文章なので、★もっと 要ります。
--     ★★上限を 置くのは、★1画面に 入らない 量を 防ぐ ためです。
--       ★★入り切らない ものを 切り詰めると、★書いた ものが 消えます。
--         ★だから、★入れる ときに 止めます。★あとで 切りません。
--
--   ★実行　Supabase の SQL Editor に、★このまま 貼って ください。
--   ★★BEGIN／ROLLBACK を 使って いません。
--     ★SQL Editor が ROLLBACK を 効かせない ことが あるためです。
--   ★★何度 流しても 同じ です（if not exists）。
-- ============================================================================

-- ── ① いまの 形を 見る
select
  column_name   as "列の 名前",
  data_type     as "型",
  is_nullable   as "空でも よいか"
from information_schema.columns
where table_schema = 'public' and table_name = 'performances'
order by ordinal_position;


-- ── ② 欄を 足す
--    ★★空で かまいません。★書かない 方には 何も 起きません。
alter table public.performances
  add column if not exists morning_words text;

comment on column public.performances.morning_words is
  '本番の朝に、そのまま返す、ご本人のことば。アプリは読まない・要約しない・分析に使わない。書かなくてよい。';


-- ── ③ 長さの 上限（★500字）
--    ★★入れる ときに 止めます。★あとで 切りません。
--      ★切ると、★書いた ものが 黙って 消えます。
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'performances_morning_words_len'
  ) then
    alter table public.performances
      add constraint performances_morning_words_len
      check (morning_words is null or char_length(morning_words) <= 500);
  end if;
end $$;


-- ── ④ 権限
--    ★★performances は、★すでに ご本人だけが 読み書きできます（★RLS）。
--      ★列を 足しても、★行の 決まりは 変わりません。
--    ★★ただし、★新しい 列には これまでの 列の 権限が 付きません。
--      ★★2026-09-09 に 同じ ことが 起きました（★source の 列）。
--      ★だから、★ここで はっきり 与えます。
grant select (morning_words), insert (morning_words), update (morning_words)
  on public.performances to authenticated;


-- ── ⑤ 確かめ
select
  column_name as "列の 名前",
  data_type   as "型"
from information_schema.columns
where table_schema = 'public'
  and table_name = 'performances'
  and column_name = 'morning_words';

select
  conname as "決まりの 名前",
  pg_get_constraintdef(oid) as "中身"
from pg_constraint
where conname = 'performances_morning_words_len';

-- ★★先生には 渡しません。
--   ★lib/shareScope.js は entries の 列の 表です。★performances は 別の 表で、
--   ★先生に 渡す 道が そもそも ありません（★get_student_entries は entries だけ）。
