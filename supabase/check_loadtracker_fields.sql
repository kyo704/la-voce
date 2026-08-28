-- ============================================================================
-- LoadTracker の9項目に、実データがあるか数える
--   （職業を声の型で切り直す.md Day 1 の分類表のため）
--
--   ★これは確認だけです。1行も変更しません。
--   ★消す前に必ず数えること。声楽家の4項目を消したときと同じ手順です。
--
-- 【背景】LoadTracker は関数の定義があるだけで、呼び出しが0件です。
--   つまり、いまはどの職業でも画面に出ていません。ただし「いま出ていない」と
--   「一度も記録されたことがない」は別です。過去に出ていた時期の記録が
--   残っている可能性があります。speakingLevel で、その取り違えを一度しました。
--
-- 【値の入りうる場所は3つ】どれも jsonb です。
--   entries.load_detail                    … LoadTracker が書く先
--   entries.activity_detail                … 活動ブロックの detail（旧構造）
--   entries.activities[].detail            … 活動ブロックの detail（新構造）
-- ============================================================================

with fields(profession, key) as (
  values
    ('announcer',   'onAirMinutes'),
    ('announcer',   'isLive'),
    ('announcer',   'consecutiveSegments'),
    ('voice_actor', 'sessionMinutes'),
    ('voice_actor', 'characterCount'),
    ('voice_actor', 'hasExtremeVocalization'),
    ('pop_musical', 'venueVolume'),
    ('pop_musical', 'monitorVolume'),
    ('pop_musical', 'consecutivePerformanceDay')
),
hits as (
  select
    f.profession,
    f.key,
    -- load_detail に入っている行
    (select count(*) from public.entries e
      where e.load_detail ? f.key
        and e.load_detail -> f.key is not null
        and e.load_detail ->> f.key <> ''
    ) as in_load_detail,
    -- activity_detail に入っている行
    (select count(*) from public.entries e
      where e.activity_detail ? f.key
        and e.activity_detail ->> f.key <> ''
    ) as in_activity_detail,
    -- activities[].detail に入っている行
    (select count(*) from public.entries e
      where exists (
        select 1 from jsonb_array_elements(coalesce(e.activities, '[]'::jsonb)) a
         where a -> 'detail' ? f.key
           and a -> 'detail' ->> f.key <> ''
      )
    ) as in_activities
  from fields f
)
select
  profession                                   as "職業",
  key                                          as "項目",
  in_load_detail                               as "load_detail",
  in_activity_detail                           as "activity_detail",
  in_activities                                as "activities[].detail",
  (in_load_detail + in_activity_detail + in_activities) as "合計",
  case when (in_load_detail + in_activity_detail + in_activities) = 0
       then '② 0件 → 消してよい'
       else '★1件以上 → ③か④の判断が要る'
  end                                          as "分類"
  from hits
 order by (in_load_detail + in_activity_detail + in_activities) desc, profession, key;

-- ---------------------------------------------------------------------------
-- 対照: 生きている項目でも同じ数え方が効くことを確かめる
--   ★0件ばかり並んだとき、「本当に0なのか、数え方が悪いのか」を切り分けます。
--   声楽家の4項目を消したときも、この対照で数え方の誤りを1度見つけました。
-- ---------------------------------------------------------------------------
select 'passaggioFeel（生きている項目）' as "対照",
       (select count(*) from public.entries e
         where exists (
           select 1 from jsonb_array_elements(coalesce(e.activities, '[]'::jsonb)) a
            where a -> 'detail' ? 'passaggioFeel'
         )) as "activities[].detail";

-- entries に、そもそも何行あるか
select count(*) as "entries の全行", count(distinct user_id) as "人数" from public.entries;
