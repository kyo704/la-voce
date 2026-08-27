-- ============================================================================
-- 学ぶ画面のメモが、いま何件あるか（Day 4 の前に）
--
-- ★確認用の SELECT だけです。1行も書き換えません。
--
-- §9-12「既存のメモを削除・移行漏れさせない」を守るため、
-- 触る前に、何がどれだけあるかを数えます。
-- 職業別項目を消す前にやったのと同じ手順です。
-- ============================================================================

-- ① 全体の件数
select
  count(*)                                          as 総数,
  count(*) filter (where deleted_at is null)        as 生きているメモ,
  count(*) filter (where deleted_at is not null)    as 削除済み,
  count(distinct user_id)                           as 書いた人数,
  count(distinct article_id)                        as メモのある記事数,
  min(created_at)                                   as いちばん古いメモ,
  max(created_at)                                   as いちばん新しいメモ
from public.article_notes;

-- ② kind ごとの内訳（役割を変えるとき、どの種類が影響を受けるか）
select kind as 種類, count(*) as 件数,
       count(*) filter (where deleted_at is null) as 生きている
from public.article_notes
group by kind
order by count(*) desc;

-- ③ 本文の長さ（言い換え欄に移すとき、入りきるか）
select
  min(length(body))   as 最短,
  round(avg(length(body)))  as 平均,
  max(length(body))   as 最長,
  count(*) filter (where length(body) > 500) as 五百字超
from public.article_notes
where deleted_at is null;

-- ④ ★記事IDが、いまの記事一覧と噛み合っているか
--    学ぶ記事を67本取り込んだのでIDの体系が増えています。
--    古いIDのメモが宙に浮いていないかを見ます。
select article_id as 記事ID, count(*) as メモ件数
from public.article_notes
where deleted_at is null
group by article_id
order by count(*) desc;
