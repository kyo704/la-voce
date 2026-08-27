-- ============================================================================
-- 消す前に、実データが1件でもあるか数える
-- （職業別項目の再設計と学ぶ画面.md §3.1／坂本さんの指示）
--
-- ★これは確認用の SELECT だけです。1行も書き換えません。
--
-- 対象の3つは entries の専用の列ではなく、activity_detail / load_detail という
-- JSONB の中にあります。列を drop するのではなく、JSON のキーを消す話になります。
-- だから「列が空か」ではなく「キーを持つ行があるか」を数えます。
--
-- ★1件でもあれば、消さずに報告してください。
-- ============================================================================

-- ① activities[].detail の中にあるか（いまの保存先）
select
  count(*) filter (where d ? 'vocalRangeLowUsed')  as 音域_低,
  count(*) filter (where d ? 'vocalRangeHighUsed') as 音域_高,
  count(*) filter (where d ? 'dynamicsRange')      as ダイナミクス,
  count(*) filter (where d ? 'passaggioCrossings') as パッサッジョ通過数,
  count(*) filter (where d ? 'passaggioFeel')      as パッサッジョ通過感_参考,
  count(*)                                          as 活動ブロック総数
from public.entries e
cross join lateral jsonb_array_elements(coalesce(e.activities, '[]'::jsonb)) as a
cross join lateral (select coalesce(a->'detail', '{}'::jsonb) as d) x
where jsonb_typeof(coalesce(e.activities, '[]'::jsonb)) = 'array';

-- ② 旧 activity_detail 列の中にあるか（構造変更の前に書かれたぶん）
select
  count(*) filter (where activity_detail ? 'vocalRangeLowUsed')  as 音域_低,
  count(*) filter (where activity_detail ? 'vocalRangeHighUsed') as 音域_高,
  count(*) filter (where activity_detail ? 'dynamicsRange')      as ダイナミクス,
  count(*) filter (where activity_detail ? 'passaggioCrossings') as パッサッジョ通過数,
  count(*)                                                        as activity_detail_あり
from public.entries
where activity_detail is not null;

-- ③ load_detail の中にあるか（LoadTracker 用に用意されていた保存先）
select
  count(*) filter (where load_detail ? 'vocalRangeLowUsed')  as 音域_低,
  count(*) filter (where load_detail ? 'vocalRangeHighUsed') as 音域_高,
  count(*) filter (where load_detail ? 'dynamicsRange')      as ダイナミクス,
  count(*) filter (where load_detail ? 'passaggioCrossings') as パッサッジョ通過数,
  count(*)                                                    as load_detail_あり
from public.entries
where load_detail is not null;
