-- ============================================================================
-- あの14行に、実際は何が入っているのか
--
-- ★確認用の SELECT だけです。1行も書き換えません。
--
-- 前回の①は entries.activities[] を見ましたが、そこには3ブロックしか
-- ありませんでした。対して activity_detail / load_detail は14行あります。
-- 記録の多くが、構造変更より前の「古い形」のまま残っているためです。
-- 古い行は、読むときに activities[] へ組み立て直しますが、保存し直すまで
-- activities 列は空のままです。つまり①は、ほぼ空の場所を数えていました。
--
-- ★対照（passaggioFeel）も、今回は3か所すべてで数えます。
--   前回は①でしか見ておらず、②③に無いことを確かめていませんでした。
-- ============================================================================

-- ① まず全体像。記録は何行あって、どの形で入っているのか。
select
  count(*)                                                              as 記録の総行数,
  count(*) filter (where activities is not null
                     and jsonb_array_length(coalesce(activities,'[]'::jsonb)) > 0) as 新しい形_activities,
  count(*) filter (where activity_detail is not null
                     and activity_detail <> '{}'::jsonb)                as 古い形_activity_detail,
  count(*) filter (where load_detail is not null
                     and load_detail <> '{}'::jsonb)                    as 古い形_load_detail
from public.entries;

-- ② ★activity_detail に、実際どんなキーが入っているか（多い順）
select k as キー, count(*) as 件数
from public.entries e, lateral jsonb_object_keys(e.activity_detail) as k
where e.activity_detail is not null and e.activity_detail <> '{}'::jsonb
group by k
order by count(*) desc, k;

-- ③ ★load_detail に、実際どんなキーが入っているか（多い順）
select k as キー, count(*) as 件数
from public.entries e, lateral jsonb_object_keys(e.load_detail) as k
where e.load_detail is not null and e.load_detail <> '{}'::jsonb
group by k
order by count(*) desc, k;

-- ④ ★対照を3か所すべてで数える。ここが全部0なら、
--    「使われていない」ではなく「探し方が違う」ということです。
select
  (select count(*) from public.entries e
    cross join lateral jsonb_array_elements(coalesce(e.activities,'[]'::jsonb)) a
    where coalesce(a->'detail','{}'::jsonb) ? 'passaggioFeel')          as 通過感_activities,
  (select count(*) from public.entries where activity_detail ? 'passaggioFeel') as 通過感_activity_detail,
  (select count(*) from public.entries where load_detail ? 'passaggioFeel')     as 通過感_load_detail;

-- ⑤ 消す候補の4つを、3か所すべてで数え直す（②③の結果と突き合わせる用）
select
  (select count(*) from public.entries where activity_detail ? 'vocalRangeLowUsed'
      or load_detail ? 'vocalRangeLowUsed')  as 音域_低,
  (select count(*) from public.entries where activity_detail ? 'vocalRangeHighUsed'
      or load_detail ? 'vocalRangeHighUsed') as 音域_高,
  (select count(*) from public.entries where activity_detail ? 'dynamicsRange'
      or load_detail ? 'dynamicsRange')      as ダイナミクス,
  (select count(*) from public.entries where activity_detail ? 'passaggioCrossings'
      or load_detail ? 'passaggioCrossings') as パッサッジョ通過数;
