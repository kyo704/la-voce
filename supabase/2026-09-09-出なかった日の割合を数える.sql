-- ============================================================================
-- 「出なかった／出づらい」と書いた日の 割合を 数える
--
--   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §8
--     「★測るもの　テスターと、坂本さんの1年ぶんから
--       　　　　　　『出なかった／出づらい』と書いた日の 割合
--      ★誰が　　　Code（DBの集計）
--      ★いつまで　★9月15日まで（★大学営業の前に）」
--
--   ★★私（Code）は データベースに つながれません。★ですので、
--     ★このSQLを 書きます。★走らせるのは 坂本さんです。
--     ★結果を 貼っていただければ、★そこから 先は 私が 引き受けます。
--
--   ★★なぜ 要るのか
--     ★この割合で、★1文が出るまでの 日数が 決まります。
--     ★★5%なら 200日、★20%なら 50日。★桁が 違います（★§8）。
--     ★★この数字が 出るまで、★「あと◯日で 見えます」を
--       ★どこにも 書かないでください（★§8 の 但し書き）。
--
--   ★★読むだけです。★1行も 書きません。★消しません。
--     ★BEGIN も ROLLBACK も 使いません（★SQL Editor は 巻き戻しません）。
--
--   ★★お名前も メールも 出しません。★人ごとの 行には 番号だけを ふります。
-- ============================================================================


-- ---------------------------------------------------------------------------
-- ① 全体 ── いちばん大事な 1行
--
--   ★「出づらい」＝ throat_condition が 2 以下（★lib/recordV2.js の 3択と同じ切り方）
--   ★分母は「記録した日」。★throat_condition を 書いた日だけを 数えます。
--     ★★書いていない日を 分母に 入れると、★割合が 小さく 出ます。
-- ---------------------------------------------------------------------------
select
  count(*)                                             as "記録した日（のどの調子を書いた日）",
  count(*) filter (where throat_condition <= 2)        as "出づらいと書いた日",
  round(100.0 * count(*) filter (where throat_condition <= 2) / nullif(count(*), 0), 1)
                                                       as "割合（％）"
  from public.entries
 where throat_condition is not null;


-- ---------------------------------------------------------------------------
-- ② 人ごと ── ばらつきを 見ます
--
--   ★★1人の 極端な方に 引きずられていないかを 確かめます。
--   ★★お名前も メールも 出しません。★番号だけです。
--   ★30日に満たない方は、★割合が 揺れるので 分けて 見ます。
-- ---------------------------------------------------------------------------
with per_user as (
  select
    user_id,
    count(*)                                      as recorded_days,
    count(*) filter (where throat_condition <= 2) as hard_days
    from public.entries
   where throat_condition is not null
   group by user_id
)
select
  row_number() over (order by recorded_days desc)                   as "番号",
  recorded_days                                                     as "記録した日",
  hard_days                                                         as "出づらい日",
  round(100.0 * hard_days / nullif(recorded_days, 0), 1)            as "割合（％）",
  case when recorded_days < 30 then '★30日未満（参考）' else '' end as "注",
  case when recorded_days >= 300 then '★1年ぶんの方' else '' end    as "注2"
  from per_user
 order by recorded_days desc;


-- ---------------------------------------------------------------------------
-- ③ まんなかの値 ── ★平均では なく 中央値
--
--   ★★1人の 極端な方に 引きずられないためです。
--   ★30日以上 書いている方だけで 数えます。
-- ---------------------------------------------------------------------------
with per_user as (
  select
    user_id,
    count(*)                                      as recorded_days,
    count(*) filter (where throat_condition <= 2) as hard_days
    from public.entries
   where throat_condition is not null
   group by user_id
  having count(*) >= 30
)
select
  count(*)                                                                   as "30日以上 書いている方の数",
  round(percentile_cont(0.5) within group (
    order by 100.0 * hard_days / nullif(recorded_days, 0))::numeric, 1)       as "割合の まんなか（％）",
  round(percentile_cont(0.25) within group (
    order by 100.0 * hard_days / nullif(recorded_days, 0))::numeric, 1)       as "下から4分の1（％）",
  round(percentile_cont(0.75) within group (
    order by 100.0 * hard_days / nullif(recorded_days, 0))::numeric, 1)       as "上から4分の1（％）"
  from per_user;


-- ---------------------------------------------------------------------------
-- ④ 本番で「出なかった」と押した日
--
--   ★★②とは 別のものです。★1つに しないこと。
--     ★③まで　　　… ★その日の 記録が「出づらい」だった日
--     ★★こちら　　… ★本番のあと、★D+1 の一問に「出なかった」と 押した日
--   ★本番の日にしか ありません。★分母が ちがいます。
-- ---------------------------------------------------------------------------
select
  count(*)                                          as "答えた本番の数",
  count(*) filter (where result = 'not_out')        as "「出なかった」と押した数",
  round(100.0 * count(*) filter (where result = 'not_out') / nullif(count(*), 0), 1)
                                                    as "割合（％）"
  from public.performance_results;


-- ---------------------------------------------------------------------------
-- ⑤ つづいた日 ── ★「初日だけで くらべる」が どれだけ 効くか
--
--   ★出どころ §1「★初日だけにすると、n は 減ります」
--   ★★どれだけ 減るのかを、★実際の 記録から 数えます。
--   ★連続した「出づらい」の かたまりを 1つと 数え直したら いくつになるか。
-- ---------------------------------------------------------------------------
with hard as (
  select user_id, date,
         date - (row_number() over (partition by user_id order by date))::int as grp
    from public.entries
   where throat_condition is not null and throat_condition <= 2
)
select
  count(*)                                   as "出づらい日（そのまま）",
  count(distinct (user_id, grp))             as "★初日だけにしたときの 数",
  round(100.0 * count(distinct (user_id, grp)) / nullif(count(*), 0), 1)
                                             as "残る割合（％）"
  from hard;
