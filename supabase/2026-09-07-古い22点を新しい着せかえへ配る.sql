-- 古い22点を、新しい着せかえへ引き上げます（2026年9月7日）
--
--   ★★先に配って、あとで消します（★判断1）。
--     ★これは「配る」ほうです。★何も消しません。
--
--   ★★消さないもの（★判断2）
--     ・character_inventory の古い24行 …… ★1行も消しません
--     ・character_equipped の hat / outfit / accessory …… ★そのまま残します
--     ★戻す必要が出たときに、★元が残っていないと戻せません。
--
--   ★対応表の正は lib/legacyWearables.js です。★この SQL は、そこから作りました。
--   ★何度流しても大丈夫です（★すでにお持ちのものは、増やしません）。

-- ===========================================================================
-- ① 対応表（★読むだけ。★中身の確かめ）
-- ===========================================================================
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
select 古い, 新しい,
       case 種別 when 'same' then '同じ品（絵を描き直したもの）'
                 else '近い品（見た目が変わります）' end as 種別
from 対応 order by 種別, 古い;

-- ===========================================================================
-- ② 誰に、何が配られるか（★読むだけ。★流す前に、必ず見てください）
-- ===========================================================================
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
select
  left(ci.user_id::text, 8) || '…' as "方",
  ci.item_key                       as "お持ちの古い品",
  対応.新しい                        as "配る新しい品",
  case when 済.item_key is not null then '★すでにお持ちです（配りません）'
       else '配ります' end          as "どうなるか"
from public.character_inventory ci
join 対応 on 対応.古い = ci.item_key
left join public.character_inventory 済
  on 済.user_id = ci.user_id and 済.item_key = 対応.新しい
order by 1, 2;

-- ===========================================================================
-- ③ 配ります（★増やすだけ。★1行も消しません）
-- ===========================================================================
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
insert into public.character_inventory (user_id, item_key)
select distinct ci.user_id, 対応.新しい
from public.character_inventory ci
join 対応 on 対応.古い = ci.item_key
where not exists (
  select 1 from public.character_inventory c2
  where c2.user_id = ci.user_id and c2.item_key = 対応.新しい
)
on conflict do nothing;

-- ===========================================================================
-- ④ 身につけたままの方を、新しい鍵へ移します
-- ===========================================================================
--   ★★2026-09-07 に直しました。★はじめ jsonb_set を使っていました。
--     ★jsonb_set は、★path の途中の段が無いと、★何もせず、そのまま返します。
--       ★create_if_missing は「最後の1段」にしか効きません。
--     ★★character_equipped に wardrobe の段が無い方には、★黙って素通りでした。
--       ★失敗もせず、★1件も当たりませんでした。
--     ★|| で混ぜる形に直しました。★段が無くても作れます。
--   ★★古いほうは消しません。★新しいほうに、同じ品を足すだけです。
--     ★すでに新しいほうで何か着ておられたら、★上書きしません。
--       ★ご本人が選ばれたものが、優先です。

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

-- ★服と持ちものも、同じように移します。
--   ★★置き場所が変わる品があります（★マフラーは「服」→「襟まき」）。
--   ★いまお召しなのは帽子だけと分かっているので、
--     ★下の2つは、★念のためのものです。

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

-- ★マフラーだけ、置き場所が「襟まき」です。
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
-- ⑤ 確かめ（★読むだけ）
-- ===========================================================================
--   ★★2つとも空になれば、済んでいます。

-- ⑤-1 古い品をお持ちなのに、新しい品が配られていない方
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
select left(ci.user_id::text, 8) || '…' as "方", ci.item_key as "配り漏れ"
from public.character_inventory ci
join 対応 on 対応.古い = ci.item_key
where not exists (
  select 1 from public.character_inventory c2
  where c2.user_id = ci.user_id and c2.item_key = 対応.新しい
);

-- ⑤-2 古い品を身につけたままなのに、新しいほうが空の方
select left(id::text, 8) || '…' as "方",
       character_equipped->>'hat'    as "古い帽子",
       character_equipped->'wardrobe'->>'hat' as "新しい帽子"
from public.profiles
where character_equipped->>'hat' is not null
  and character_equipped->'wardrobe'->>'hat' is null;

-- ⑤-3 古い記録が、消えていないこと（★24行のままのはず）
select count(*) as "古い品の記録（消えていないこと）"
from public.character_inventory
where item_key like 'hat!_%' escape '!'
   or item_key like 'outfit!_%' escape '!'
   or item_key like 'accessory!_%' escape '!';
