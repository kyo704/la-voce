-- ポイントが引かれないまま品物を受け取った方が、どれだけいるか（2026年9月7日）
--
--   ★読むだけです。★1行も書き替えません。
--   ★BEGIN / ROLLBACK は使っていません（2026-09-05 の事故のため）。
--
--   ★★なぜ調べるのか
--     ★9月7日に、character_points_spent をサーバ側だけの列にしました。
--     ★★ところが本番のコードは、まだブラウザから直に書く古い版です。
--     ★品物は character_inventory に入りますが、★点が引かれません。
--     ★★つまり、いま本番では、品物が ただで手に入っています。
--
--   ★受け取ったものは、取り上げません。★これは数えるだけの照会です。

-- ① 持ち物の合計と、引かれている点の、食い違い
select
  p.id                                            as 利用者,
  coalesce(p.character_points_spent, 0)           as 引かれている点,
  count(ci.item_key)                              as 持っている品数
from public.profiles p
left join public.character_inventory ci on ci.user_id = p.id
group by p.id, p.character_points_spent
having count(ci.item_key) > 0
order by count(ci.item_key) desc
limit 50;

-- ② 9月7日以降に受け取られた品（★この日から、点が引かれていません）
select
  ci.user_id  as 利用者,
  ci.item_key as 品物,
  ci.created_at as 受け取った日時
from public.character_inventory ci
where ci.created_at >= '2026-09-07'
order by ci.created_at desc
limit 100;

-- ★②が空なら、まだ誰も受け取っていません。★急ぎではありません。
-- ★②に行があれば、その数だけ、点が引かれずに渡っています。
