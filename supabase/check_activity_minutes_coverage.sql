-- ============================================================================
-- 発声時間が、実際にどれだけ入力されているかを数える（G2-10.5 の影響確認）
--
-- ★これは確認用の SELECT だけです。1行も書き換えません。
--   Supabase の SQL Editor に貼って実行してください。
--
-- なぜ要るか:
--   活動ブロックの「分」が空のとき、これまでは負荷0として扱われていました。
--   「レッスンに行った」日が、声を1分も使わなかった日と同じ扱いです。
--   直すと ACWR の値が変わるので、まず「どれだけ空だったか」を実データで
--   確かめてから、過去分をどう扱うか決めます。
-- ============================================================================

-- ① 活動ブロック全体の、入力あり／なしの割合
select
  count(*)                                                     as 活動ブロック総数,
  count(*) filter (where (a->>'minutes') ~ '^[0-9]+(\.[0-9]+)?$'
                     and (a->>'minutes')::numeric > 0)         as 分の入力あり,
  count(*) filter (where (a->>'minutes') is null
                      or (a->>'minutes') = ''
                      or (a->>'minutes') !~ '^[0-9]+(\.[0-9]+)?$'
                      or (a->>'minutes')::numeric = 0)         as 分が空,
  round(100.0 * count(*) filter (where (a->>'minutes') is null
                      or (a->>'minutes') = ''
                      or (a->>'minutes') !~ '^[0-9]+(\.[0-9]+)?$'
                      or (a->>'minutes')::numeric = 0) / nullif(count(*), 0), 1)
                                                               as 空の割合パーセント
from public.entries e
cross join lateral jsonb_array_elements(coalesce(e.activities, '[]'::jsonb)) as a
where jsonb_typeof(coalesce(e.activities, '[]'::jsonb)) = 'array';

-- ② 種別ごとの内訳（どの種別で入力が落ちているか）
select
  a->>'kind'                                                   as 種別,
  count(*)                                                     as 件数,
  count(*) filter (where (a->>'minutes') ~ '^[0-9]+(\.[0-9]+)?$'
                     and (a->>'minutes')::numeric > 0)         as 分の入力あり,
  round(avg((a->>'minutes')::numeric) filter (
          where (a->>'minutes') ~ '^[0-9]+(\.[0-9]+)?$'
            and (a->>'minutes')::numeric > 0), 1)              as 入力があるときの平均分
from public.entries e
cross join lateral jsonb_array_elements(coalesce(e.activities, '[]'::jsonb)) as a
where jsonb_typeof(coalesce(e.activities, '[]'::jsonb)) = 'array'
group by 1
order by 2 desc;

-- ③ 「活動を記録したのに、負荷が0だった日」が何日あるか
--    ここがそのまま、ACWR が壊れていた日数です。
select
  count(*) as 活動はあるのに負荷0だった日数
from public.entries e
where jsonb_typeof(coalesce(e.activities, '[]'::jsonb)) = 'array'
  and jsonb_array_length(coalesce(e.activities, '[]'::jsonb)) > 0
  and not exists (
    select 1
    from jsonb_array_elements(e.activities) as a
    where (a->>'minutes') ~ '^[0-9]+(\.[0-9]+)?$'
      and (a->>'minutes')::numeric > 0
  );
