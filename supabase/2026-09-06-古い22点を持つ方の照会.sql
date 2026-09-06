-- 古い22点を、持っている方がいらっしゃるか（2026年9月6日）
--
--   ★読むだけです。★1行も書き換えません。
--   ★着せかえ217点にまとめる前に、★取り上げになる方がいないか確かめます。
--
--   ★3つ出ます。順に見てください。

-- ① 持っている方の人数と、点数
select
  count(distinct user_id) as 持っている人数,
  count(*)                as のべ点数
from public.character_inventory
where item_key in (
    'hat_straw',
    'hat_knit',
    'hat_ribbon',
    'hat_western',
    'hat_crown_king',
    'hat_tiara_princess',
    'outfit_scarf',
    'outfit_overall',
    'outfit_sweater',
    'outfit_western',
    'outfit_kimono_male',
    'outfit_kimono_female',
    'outfit_tuxedo',
    'outfit_tailcoat',
    'outfit_dress',
    'outfit_king_robe',
    'accessory_staff',
    'accessory_sword',
    'accessory_chopsticks',
    'accessory_fork',
    'accessory_bottle',
    'accessory_pet_bottle'
  );

-- ② どの品を、何人が持っているか（多い順）
select
  item_key                as 品,
  count(distinct user_id) as 人数
from public.character_inventory
where item_key in (
    'hat_straw',
    'hat_knit',
    'hat_ribbon',
    'hat_western',
    'hat_crown_king',
    'hat_tiara_princess',
    'outfit_scarf',
    'outfit_overall',
    'outfit_sweater',
    'outfit_western',
    'outfit_kimono_male',
    'outfit_kimono_female',
    'outfit_tuxedo',
    'outfit_tailcoat',
    'outfit_dress',
    'outfit_king_robe',
    'accessory_staff',
    'accessory_sword',
    'accessory_chopsticks',
    'accessory_fork',
    'accessory_bottle',
    'accessory_pet_bottle'
  )
group by item_key
order by 人数 desc, 品;

-- ③ いま身につけている方（買っただけでなく、着ている方）
select
  count(*) filter (where character_equipped->>'hat'       is not null) as 帽子,
  count(*) filter (where character_equipped->>'outfit'    is not null) as 服,
  count(*) filter (where character_equipped->>'accessory' is not null) as 持ち物
from public.profiles;

-- ★①が 0 なら、まとめるのは簡単です。取り上げになる方はいません。
-- ★1以上なら、その方の持ち物として残す手当てを入れます。
