-- 早くから使ってくださった方へ、よそおいをお渡しする ── ★まず、確かめるだけ（2026年9月8日）
--
--   ★★これは読むだけの SQL です。★1行も書き替えません。
--   ★配る SQL は、★この結果を見てから、★別に作ります。
--
--   ★BEGIN / ROLLBACK は使っていません（2026-09-05 の事故のため）。

-- ===========================================================================
-- ① character_inventory の形（★reason_snapshot はあるか）
-- ===========================================================================
select column_name as 列, data_type as 型, is_nullable as 空を許すか
from information_schema.columns
where table_schema = 'public' and table_name = 'character_inventory'
order by ordinal_position;

-- ★「reason_snapshot」が出なければ、★列がありません。★足すところから始めます。

-- ===========================================================================
-- ② 何人に、何行 書くことになるか
-- ===========================================================================
select
  count(*)                                  as 対象の人数,
  count(*) * 219                            as 書く行の数,
  min(created_at)::date                     as いちばん古い登録,
  max(created_at)::date                     as いちばん新しい登録
from auth.users
where created_at < '2026-09-08';

-- ===========================================================================
-- ③ いま、すでに持っている行（★二重に書かないため）
-- ===========================================================================
select count(*) as いまの持ち物の行数 from public.character_inventory;

select ci.item_key as 品物, count(*) as 人数
from public.character_inventory ci
group by ci.item_key
order by count(*) desc
limit 20;

-- ===========================================================================
-- ④ ★記念のものを、何人が「条件を満たして」持っているか
-- ===========================================================================
--   ★★ここが、いちばん大事なところです。
--     ★箱1（記念）は「条件を満たした方だけ」「買えない・交換もできない」ものです。
--     ★いっせいに配ると、★歌っていない方の棚に、★夜の女王の冠が並びます。
--     ★「おうちを見れば、その人が何を歌ってきたか分かる」が、★嘘になります。
--     ★Opus ご自身が「ここが売り物です」と書かれた部分です。

select ci.item_key as 記念の品, count(*) as いま持っている人数
from public.character_inventory ci
where ci.item_key in (
  'propBouquet', 'tailcoat', 'propBaton', 'propMetronome', 'hatCamellia'
)
group by ci.item_key
order by ci.item_key;

-- ===========================================================================
-- ⑤ 本番の記録は、いくつ入っているか
-- ===========================================================================
--   ★★performances に、★書き込む道が、アプリにありません（2026-09-07 に確認）。
--     ★読む場所（VocalTracker :5724）はありますが、★insert が0か所です。
--   ★だから、★0行のはずです。★0でなければ、別の道から入っています。

select count(*) as 本番の行数 from public.performances;
select count(*) as 本番の答えの行数 from public.performance_results;
