-- ===========================================================================
-- ★試しの 口に、★家具を 5つ 置く（★2026-09-17）
--
--   ★★羊の 部屋の ずれを **測る** ため です。
--     ★★いま 試しの 口（`+forcode`）には、★家具が 1つも 置かれて いません。
--     ★★家具が 無いと、★「配置換えの ときに 狂う」を 測れません。
--
--   ★★★坂本さんの 口（`kyo0703opera@gmail.com`）では 測りません。
--     ★★本番の 合言葉を、★私は 扱いません（★決め）。
--     ★★同じ 中身を **試しの 口**に 写して、★そちらで 測ります。
--
--   ★★写すのは **置き場の 数だけ** です。★お持ち物は 触りません。
--     ★★数は Sonnet が 読み出した もの（★2026-09-17）──
--       furniture_bed   top=99   left=29.2
--       furniture_rug   top=82   left=54.2
--       furniture_chair top=75   left=87.5
--       furniture_plant top=75.2 left=20.8
--       furniture_shelf top=70.1 left=91.7
--     ★★装備は rug / chair / plant の 3つ。
--
--   ★★★上書きするのは `furniture` と `furniturePositions` の 2つ だけ です。
--     ★★`||` で 足します。★ほかの 鍵（着るもの・壁・床）は そのまま 残ります。
--   ★何度 走らせても 同じに なります。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★いまの 中身（★読むだけ・★入れる 前）
-- ---------------------------------------------------------------------------
select coalesce(character_equipped, '{}'::jsonb) as いまの中身
from public.profiles
where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

-- ---------------------------------------------------------------------------
-- 【二】★家具を 置く
-- ---------------------------------------------------------------------------
update public.profiles
   set character_equipped = coalesce(character_equipped, '{}'::jsonb)
     || jsonb_build_object(
          'furniture', jsonb_build_array('furniture_rug', 'furniture_chair', 'furniture_plant'),
          'furniturePositions', jsonb_build_object(
            'furniture_bed',   jsonb_build_object('top', 99,   'left', 29.2),
            'furniture_rug',   jsonb_build_object('top', 82,   'left', 54.2),
            'furniture_chair', jsonb_build_object('top', 75,   'left', 87.5),
            'furniture_plant', jsonb_build_object('top', 75.2, 'left', 20.8),
            'furniture_shelf', jsonb_build_object('top', 70.1, 'left', 91.7)
          )
        )
 where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

-- ---------------------------------------------------------------------------
-- 【三】★入った ことの 確かめ（★読むだけ）
-- ---------------------------------------------------------------------------
select character_equipped -> 'furniture'          as 装備,
       character_equipped -> 'furniturePositions' as 置き場
from public.profiles
where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

-- ★★装備 3つ と 置き場 5つ が 返れば、★測れます。
-- ★★お持ち物（owned）が 足りなくて 描かれない ことが あります。
--   ★★そのときは、★下の 1行で 見て ください（★読むだけ）。
select character_equipped -> 'owned' as お持ち物
from public.profiles
where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

-- ---------------------------------------------------------------------------
-- 【四】★★片づけ（★測り終えたら・★注記を 外して）
--
--   ★★置き場だけ 消します。★ほかの 鍵は 残ります。
-- ---------------------------------------------------------------------------
-- update public.profiles
--    set character_equipped = (character_equipped - 'furniturePositions') - 'furniture'
--  where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');
