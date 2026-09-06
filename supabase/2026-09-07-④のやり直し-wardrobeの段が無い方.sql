-- ④のやり直し ── wardrobe が無い方に、届いていませんでした（2026年9月7日）
--
--   ★★何が起きたか
--     ★④で jsonb_set(…, '{wardrobe,hat}', …, true) と書いていました。
--     ★jsonb_set は、★path の途中の段が無いと、★何もせず、そのまま返します。
--       （PostgreSQL の仕様。★create_if_missing は「最後の1段」にしか効きません）
--     ★★character_equipped に wardrobe の段が無い方には、
--       ★★1件も当たらず、★しかも失敗もしませんでした。★黙って素通りです。
--     ★⑤-2 で1件残ったのは、★そのためです。
--
--   ★★直し方
--     ★jsonb_set をやめ、★|| で混ぜます。
--     ★|| なら、★段が無くても作れます。
--
--   ★読むだけの照会を先に置きます。★形を確かめてから流してください。
--   ★何度流しても大丈夫です。★1行も消しません。

-- ===========================================================================
-- ① まず、その方の character_equipped の形を見ます（★読むだけ）
-- ===========================================================================
select
  left(id::text, 8) || '…'                          as "方",
  character_equipped ? 'wardrobe'                    as "wardrobe の段があるか",
  jsonb_typeof(character_equipped->'wardrobe')       as "wardrobe の型",
  character_equipped->>'hat'                         as "古い帽子",
  character_equipped->'wardrobe'->>'hat'             as "新しい帽子",
  jsonb_pretty(character_equipped)                   as "中身ぜんぶ"
from public.profiles
where character_equipped->>'hat' is not null
   or character_equipped->>'outfit' is not null
   or character_equipped->>'accessory' is not null;

-- ★★「wardrobe の段があるか」が false なら、★原因はこれで確定です。

-- ===========================================================================
-- ② 直したやり方で、もう一度移します
-- ===========================================================================
--   ★★jsonb_set ではなく || で混ぜます。★段が無くても作れます。
--   ★すでに新しいほうで着ておられたら、★上書きしません（★前と同じ）。
--   ★古いほうは、★消しません（★前と同じ）。

-- ②-1 かぶりもの
with 対応(古い, 新しい, 種別) as (values
    ('hat_straw', 'hatStraw', 'same'),
    ('hat_knit', 'hatKnit', 'same'),
    ('hat_ribbon', 'hatCamellia', 'near'),
    ('hat_western', 'hatUSACowboy', 'same'),
    ('hat_crown_king', 'hatTurandotCrown', 'near'),
    ('hat_tiara_princess', 'hatFlowerCrown', 'near'),
    ('outfit_scarf', 'scarfWine', 'near'),
    ('outfit_overall', 'wearGermanyLederhosen', 'near'),
    ('outfit_sweater', 'coatWinterDuffle', 'near'),
    ('outfit_western', 'wearUSAWestern', 'same'),
    ('outfit_kimono_male', 'kimonoManNavyHaori', 'same'),
    ('outfit_kimono_female', 'kimonoRedSakura', 'same'),
    ('outfit_tuxedo', 'tuxedo', 'same'),
    ('outfit_tailcoat', 'tailcoat', 'same'),
    ('outfit_dress', 'gownWineMermaid', 'near'),
    ('outfit_king_robe', 'wearItalyCarnival', 'near'),
    ('accessory_staff', 'propMeijiStick', 'near'),
    ('accessory_sword', 'propTachi', 'same'),
    ('accessory_chopsticks', 'propChopsticks', 'same'),
    ('accessory_fork', 'propFork', 'same'),
    ('accessory_bottle', 'propBottle', 'same'),
    ('accessory_pet_bottle', 'propTeacup', 'near')
)
update public.profiles p
set character_equipped =
      coalesce(p.character_equipped, '{}'::jsonb)
      || jsonb_build_object(
           'wardrobe',
           coalesce(p.character_equipped->'wardrobe', '{}'::jsonb)
             || jsonb_build_object('hat', 対応.新しい)
         )
from 対応
where 対応.古い = p.character_equipped->>'hat'
  and p.character_equipped->'wardrobe'->>'hat' is null;

-- ②-2 服（★マフラーは置き場所が違うので、ここでは扱いません）
with 対応(古い, 新しい, 種別) as (values
    ('hat_straw', 'hatStraw', 'same'),
    ('hat_knit', 'hatKnit', 'same'),
    ('hat_ribbon', 'hatCamellia', 'near'),
    ('hat_western', 'hatUSACowboy', 'same'),
    ('hat_crown_king', 'hatTurandotCrown', 'near'),
    ('hat_tiara_princess', 'hatFlowerCrown', 'near'),
    ('outfit_scarf', 'scarfWine', 'near'),
    ('outfit_overall', 'wearGermanyLederhosen', 'near'),
    ('outfit_sweater', 'coatWinterDuffle', 'near'),
    ('outfit_western', 'wearUSAWestern', 'same'),
    ('outfit_kimono_male', 'kimonoManNavyHaori', 'same'),
    ('outfit_kimono_female', 'kimonoRedSakura', 'same'),
    ('outfit_tuxedo', 'tuxedo', 'same'),
    ('outfit_tailcoat', 'tailcoat', 'same'),
    ('outfit_dress', 'gownWineMermaid', 'near'),
    ('outfit_king_robe', 'wearItalyCarnival', 'near'),
    ('accessory_staff', 'propMeijiStick', 'near'),
    ('accessory_sword', 'propTachi', 'same'),
    ('accessory_chopsticks', 'propChopsticks', 'same'),
    ('accessory_fork', 'propFork', 'same'),
    ('accessory_bottle', 'propBottle', 'same'),
    ('accessory_pet_bottle', 'propTeacup', 'near')
)
update public.profiles p
set character_equipped =
      coalesce(p.character_equipped, '{}'::jsonb)
      || jsonb_build_object(
           'wardrobe',
           coalesce(p.character_equipped->'wardrobe', '{}'::jsonb)
             || jsonb_build_object('garment', 対応.新しい)
         )
from 対応
where 対応.古い = p.character_equipped->>'outfit'
  and 対応.古い <> 'outfit_scarf'
  and p.character_equipped->'wardrobe'->>'garment' is null;

-- ②-3 持ちもの
with 対応(古い, 新しい, 種別) as (values
    ('hat_straw', 'hatStraw', 'same'),
    ('hat_knit', 'hatKnit', 'same'),
    ('hat_ribbon', 'hatCamellia', 'near'),
    ('hat_western', 'hatUSACowboy', 'same'),
    ('hat_crown_king', 'hatTurandotCrown', 'near'),
    ('hat_tiara_princess', 'hatFlowerCrown', 'near'),
    ('outfit_scarf', 'scarfWine', 'near'),
    ('outfit_overall', 'wearGermanyLederhosen', 'near'),
    ('outfit_sweater', 'coatWinterDuffle', 'near'),
    ('outfit_western', 'wearUSAWestern', 'same'),
    ('outfit_kimono_male', 'kimonoManNavyHaori', 'same'),
    ('outfit_kimono_female', 'kimonoRedSakura', 'same'),
    ('outfit_tuxedo', 'tuxedo', 'same'),
    ('outfit_tailcoat', 'tailcoat', 'same'),
    ('outfit_dress', 'gownWineMermaid', 'near'),
    ('outfit_king_robe', 'wearItalyCarnival', 'near'),
    ('accessory_staff', 'propMeijiStick', 'near'),
    ('accessory_sword', 'propTachi', 'same'),
    ('accessory_chopsticks', 'propChopsticks', 'same'),
    ('accessory_fork', 'propFork', 'same'),
    ('accessory_bottle', 'propBottle', 'same'),
    ('accessory_pet_bottle', 'propTeacup', 'near')
)
update public.profiles p
set character_equipped =
      coalesce(p.character_equipped, '{}'::jsonb)
      || jsonb_build_object(
           'wardrobe',
           coalesce(p.character_equipped->'wardrobe', '{}'::jsonb)
             || jsonb_build_object('prop', 対応.新しい)
         )
from 対応
where 対応.古い = p.character_equipped->>'accessory'
  and p.character_equipped->'wardrobe'->>'prop' is null;

-- ②-4 マフラーだけ、置き場所が「襟まき」です
update public.profiles p
set character_equipped =
      coalesce(p.character_equipped, '{}'::jsonb)
      || jsonb_build_object(
           'wardrobe',
           coalesce(p.character_equipped->'wardrobe', '{}'::jsonb)
             || jsonb_build_object('neck', 'scarfWine')
         )
where p.character_equipped->>'outfit' = 'outfit_scarf'
  and p.character_equipped->'wardrobe'->>'neck' is null;

-- ===========================================================================
-- ③ 確かめ（★読むだけ）
-- ===========================================================================
--   ★★空になれば、済んでいます。

select
  left(id::text, 8) || '…'                as "方",
  character_equipped->>'hat'               as "古い帽子",
  character_equipped->'wardrobe'->>'hat'   as "新しい帽子"
from public.profiles
where character_equipped->>'hat' is not null
  and character_equipped->'wardrobe'->>'hat' is null;

-- ★服・持ちもの・襟まきも、同じように見ます。
select count(*) as "まだ移っていない服"
from public.profiles
where character_equipped->>'outfit' is not null
  and character_equipped->>'outfit' <> 'outfit_scarf'
  and character_equipped->'wardrobe'->>'garment' is null;

select count(*) as "まだ移っていない持ちもの"
from public.profiles
where character_equipped->>'accessory' is not null
  and character_equipped->'wardrobe'->>'prop' is null;

-- ===========================================================================
-- ④ 古いほうが、消えていないこと（★読むだけ）
-- ===========================================================================
select
  left(id::text, 8) || '…'                as "方",
  character_equipped->>'hat'               as "古い帽子（残っているはず）",
  character_equipped->'wardrobe'->>'hat'   as "新しい帽子"
from public.profiles
where character_equipped ? 'hat';
