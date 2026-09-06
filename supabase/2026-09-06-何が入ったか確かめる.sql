-- 坂本さんの口座に、何が入ったかを確かめます（2026年9月6日）
--
--   ★読むだけです。★1行も書き換えません。
--
--   ★★鍵の形で、2つの仕組みをきれいに分けられます。
--     ★古い101点は、★ぜんぶ _ を含みます（hat_straw、wall_washi …）
--     ★新しい217点は、★1つも _ を含みません（coatSpringCardigan …）
--     ★これは数えて確かめました。取り違えは起きません。

-- ① 仕組みごとの点数
select
  case when item_key like '%\_%' then '古い仕組み（101点あるはず）'
       else '新しい着せかえ（217点あるはず）' end as 仕組み,
  count(*) as 入っている点数
from public.character_inventory
where user_id = '99b695d8-ae90-43a5-9767-a8d073a4003d'::uuid
group by 1
order by 1;

-- ② 古いほうの、分類ごとの点数
select
  split_part(item_key, '_', 1) as 分類,
  count(*)                     as 点数
from public.character_inventory
where user_id = '99b695d8-ae90-43a5-9767-a8d073a4003d'::uuid
  and item_key like '%\_%'
group by 1
order by 2 desc, 1;

-- ★正しく入っていれば、こうなります：
--     wall 17 ／ floor 15 ／ window 11 ／ outfit 10 ／ backdrop 10
--     ／ garden 8 ／ scenery 7 ／ hat 6 ／ accessory 6 ／ furniture 6
--     ／ wallhang 5     ＝ 101点

-- ③ 合計
select count(*) as 合計
from public.character_inventory
where user_id = '99b695d8-ae90-43a5-9767-a8d073a4003d'::uuid;

-- ★★102点だったとのことなので、★おそらく A の塊（新しい着せかえ217点）が
--   ★流れていません。★①で「新しい着せかえ」が 0 なら、そのとおりです。
--   ★その場合は、★入れる SQL の A の塊だけ、もう一度流してください。
