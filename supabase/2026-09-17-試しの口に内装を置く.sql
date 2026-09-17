-- ===========================================================================
-- ★試しの 口に、★**内装（新しい 120点の 側）**を 3つ 置く（★2026-09-17）
--
--   ★★★前の SQL（家具5件）では 描かれません。★わけが 分かりました。
--     ★★`lib/oldHouseVisibility.js:30` ──
--       `HIDDEN_WHEN_NEW_INTERIOR = ['wall','floor','window','scenery',
--        'furniture','garden','wallhang']`
--     ★★門の 中の 方（`wardrobeOn`）には、★この 7分類を **1つも 描きません**。
--       `oldHouseList(equipped,'furniture',true)` は **空の 並び**を 返します。
--     ★★つまり `character_equipped.furniture` は、★門の 中では 使われません。
--     ★★`owned` を 足しても 変わりません。★描く 前に 落ちて います。
--
--   ★★門の 中で 描かれるのは `InteriorLayer` です ──
--     ★置く もの … `character_equipped.interior`（★入れ物。分類ごと）
--     ★置き場　 … `character_equipped.interiorPositions`（★鍵ごとに {left, top}）
--
--   ★★だから、★そちらに 置きます。
--     ★★鍵は `docs/assets/sheep-interior-index.json` の もの です（★249点）。
--       furniture_01 … ナチュラル／木のベンチ＋布
--       furniture_04 … アメリカン／革の大きなソファ
--       furniture_02 … ナチュラル／丸い木のテーブル
--
--   ★★置き場の 数は、★坂本さんの 家具の 数を そのまま 借ります ──
--     ★左に 寄せた もの・まんなか・右に 寄せた もの の 3つに します。
--     ★★端に 寄せた ものほど、★ずれが 目に 見えます。
--
--   ★何度 走らせても 同じに なります。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★いまの 中身（★読むだけ）
-- ---------------------------------------------------------------------------
select character_equipped -> 'interior'          as 内装,
       character_equipped -> 'interiorPositions' as 置き場
from public.profiles
where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

-- ---------------------------------------------------------------------------
-- 【二】★内装を 3つ 置く
--
--   ★★`interior` は **入れ物** です。★並びでは ありません。
--     ★★`furniture` の ように いくつでも 置ける 分類は、★中が 並び です。
-- ---------------------------------------------------------------------------
update public.profiles
   set character_equipped = coalesce(character_equipped, '{}'::jsonb)
     || jsonb_build_object(
          'interior', coalesce(character_equipped -> 'interior', '{}'::jsonb)
            || jsonb_build_object(
                 'furniture', jsonb_build_array('furniture_01', 'furniture_04', 'furniture_02')
               ),
          'interiorPositions',
            coalesce(character_equipped -> 'interiorPositions', '{}'::jsonb)
            || jsonb_build_object(
                 'furniture_01', jsonb_build_object('left', 20.8, 'top', 75.2),
                 'furniture_04', jsonb_build_object('left', 54.2, 'top', 82.0),
                 'furniture_02', jsonb_build_object('left', 87.5, 'top', 75.0)
               )
        )
 where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

-- ---------------------------------------------------------------------------
-- 【三】★入った ことの 確かめ（★読むだけ）
-- ---------------------------------------------------------------------------
select character_equipped -> 'interior' -> 'furniture' as 置いたもの,
       character_equipped -> 'interiorPositions'       as 置き場
from public.profiles
where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

-- ★★並びに 3つ、★置き場に 3つ 返れば、★測れます。

-- ---------------------------------------------------------------------------
-- 【四】★★前の SQL で 入れた 古い 家具を 片づける（★任意）
--
--   ★★門の 中では 使われません。★残って いても 害は ありません。
--   ★★紛らわしければ、★注記を 外して 走らせて ください。
-- ---------------------------------------------------------------------------
-- update public.profiles
--    set character_equipped = (character_equipped - 'furniturePositions') - 'furniture'
--  where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

-- ---------------------------------------------------------------------------
-- 【五】★★片づけ（★測り終えたら・★注記を 外して）
-- ---------------------------------------------------------------------------
-- update public.profiles
--    set character_equipped = (character_equipped - 'interiorPositions') - 'interior'
--  where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');
