-- 試していただいている方へ、おうちの道具5点をお渡しします（2026年9月8日）
--
--   ★★着せかえの12点は、★今回いっしょに配りません（坂本さんの決め・案い）。
--     ★門（NEXT_PUBLIC_WARDROBE_USER_IDS）に入っているのは、いま★1人だけです。
--     ★本番の /api/version が "counts":{"wardrobeIds":1} と返しています。
--     ★★配っても、★持ち物に入るだけで、★画面には出ません。
--     ★門を開けるとき（値段が決まってから）に、★一緒にお渡しします。
--
--   ★BEGIN / ROLLBACK は使っていません（2026-09-05 の事故のため）。
--   ★何度流しても、同じ結果になります（★二重に入りません）。
--
--   ★★お渡ししたものは、★取り上げません。
--     ★だから、★①を見てから③を流してください。
--     ★★入れたあとに「やっぱり」は、★できない決めになっています。

-- ===========================================================================
-- ① 誰に、何行 書くことになるか（★読むだけ）
-- ===========================================================================
select
  count(*)                as 試していただいている方の人数,
  count(*) * 5            as これから書く行の数
from public.profiles
where is_tester = true;

-- ★人数が0なら、★ここで止めてください。★is_tester が誰にも立っていません。

-- ★★すでに持っている方がいないか（★二重に配らないため）
select p.id as 利用者, count(ci.item_key) as すでに持っている数
from public.profiles p
left join public.character_inventory ci
       on ci.user_id = p.id
      and ci.item_key in ('garden_bench', 'backdrop_mountains_near',
                          'wall_wood', 'floor_carpet', 'window_wood')
where p.is_tester = true
group by p.id
order by count(ci.item_key) desc;

-- ===========================================================================
-- ② 配る5点（★読むだけ・★名前の打ち間違いを見つけます）
-- ===========================================================================
with 配るもの(鍵, 中身) as (values
    ('garden_bench',            '置物：ベンチ'),
    ('backdrop_mountains_near', '背景：山を近くに大きく'),
    ('wall_wood',               '壁紙：木目パネル壁'),
    ('floor_carpet',            '床：カーペット床'),
    ('window_wood',             '窓枠：木製フレーム')
)
select 鍵, 中身 from 配るもの order by 鍵;

-- ★5行 出れば、正しい一覧です。
--   ★名前の正は lib/character.js の SHOP_ITEMS です。

-- ===========================================================================
-- ③ お渡しします
-- ===========================================================================
--   ★★on conflict を使っていません。
--     ★character_inventory に、★重なりを止める決まりが在るか分からないためです。
--     ★代わりに「まだ持っていない人にだけ」入れます。★何度流しても同じです。

insert into public.character_inventory (user_id, item_key)
select p.id, k.item_key
from public.profiles p
cross join (values
    ('garden_bench'),
    ('backdrop_mountains_near'),
    ('wall_wood'),
    ('floor_carpet'),
    ('window_wood')
) as k(item_key)
where p.is_tester = true
  and not exists (
    select 1 from public.character_inventory ci
    where ci.user_id = p.id and ci.item_key = k.item_key
  );

-- ===========================================================================
-- ④ 確かめます（★読むだけ）
-- ===========================================================================
select
  ci.item_key as 品物,
  count(*)    as 持っている人数
from public.character_inventory ci
join public.profiles p on p.id = ci.user_id and p.is_tester = true
where ci.item_key in ('garden_bench', 'backdrop_mountains_near',
                      'wall_wood', 'floor_carpet', 'window_wood')
group by ci.item_key
order by ci.item_key;

-- ★5行 出て、★どの行も人数が①の人数と同じなら、成功です。

-- ★★もう一度流しても、★行は増えません。★③で「まだ持っていない人にだけ」
--   と書いてあるためです。★確かめたいときは、そのまま流し直してください。

-- ===========================================================================
-- ★★お伝えいただきたいこと
-- ===========================================================================
--   ★お渡ししたものは、★「持ち物」に入ります。
--   ★★部屋には、★すぐには出ません。
--     ★どれを置くかは、★ご本人が選ぶものだからです。
--     ★こちらで置いてしまうと、★その方が選んだ部屋を、★書き替えることになります。
--   ★おうちの画面の「お店」で、★受け取ったものを選んでいただきます。
--
--   ★ポイントは、★1点も引いていません。★お渡ししたものです。
--     ★5点ぶんの値段は 295pt ですが、★残高は そのままです。
