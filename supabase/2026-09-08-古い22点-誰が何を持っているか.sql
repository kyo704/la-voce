-- 古い22点を、どなたが何をお持ちか（2026年9月8日）
--
--   ★読むだけです。★1行も書き換えません。
--   ★★お名前もメールアドレスも出しません。★user_id の頭だけにします。
--     ★誰かを特定して扱う照会ではありません。★人数と内訳を見るためです。

-- ① どなたが、何点お持ちか
select
  left(user_id::text, 8) || '…'                as "方",
  count(*)                                      as "持っている点数",
  string_agg(item_key, ', ' order by item_key)  as "品"
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
group by user_id
order by 2 desc;

-- ★★ここで分かること
--   ・22点ぜんぶお持ちの方がいらっしゃるか
--   ・ほかの方は何をお持ちか（★麦わら帽子だけなら、話は小さくなります）

-- ② 試験にご協力の方かどうか
select
  left(p.id::text, 8) || '…'  as "方",
  p.is_tester                  as "試験の方か",
  p.is_internal                as "こちら側の口座か",
  count(ci.item_key)           as "古い品の数"
from public.profiles p
join public.character_inventory ci on ci.user_id = p.id
where ci.item_key in (
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
group by p.id, p.is_tester, p.is_internal
order by 4 desc;

-- ★★ここで分かること
--   ・お持ちの方がぜんぶ試験の方なら、★お知らせは要りません
--   ・ふつうのお客さまがいらっしゃるなら、★お知らせが要ります

-- ③ いま身につけておられる方
select
  left(id::text, 8) || '…'         as "方",
  character_equipped->>'hat'        as "帽子",
  character_equipped->>'outfit'     as "服",
  character_equipped->>'accessory'  as "持ちもの"
from public.profiles
where character_equipped->>'hat' is not null
   or character_equipped->>'outfit' is not null
   or character_equipped->>'accessory' is not null;

-- ★★身につけたまま絵を消すと、★その方の羊から、その品が消えます。
--   ★代わりを配るときに、★身につけている状態も一緒に移します。
