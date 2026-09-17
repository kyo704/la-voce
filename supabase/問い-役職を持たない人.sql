-- ===========================================================================
-- ★問い ── ★役職（post）を 持たない 方が、★何人 いますか
--
--   ★★A2（★`BY_ROLE` を 外し、★できこと 1本に する）の 前に 要ります。
--     ★★いま、★役職を 持つ 方は **できこと**で 判じて います（★食い違い 0）。
--     ★★役職を 持たない 方は、★名前の ちから（owner / admin / …）に 落ちます。
--       ★★その 落ち道が `BY_ROLE` です。★33通りの 食い違いは ここ から 出ます。
--   ★★★外す 前に、★「落ちて いる 方が 何人 いるか」を 知る 必要が あります。
--     ★★0人 なら、★その まま 外せます。
--     ★★1人でも いれば、★外した 瞬間に ★その方の 運営画面が 空に なります。
--
--   ★★★読むだけ です。★1文字も 書きません。
-- ===========================================================================

-- 【一】★教室ごと・役職の あるなし
select o.name as 教室,
       count(*) as 人数,
       count(m.post_id) as 役職あり,
       count(*) - count(m.post_id) as ★役職なし,
       count(*) filter (where m.role = 'owner') as owner,
       count(*) filter (where m.role = 'admin') as admin,
       count(*) filter (where m.role = 'teacher') as teacher,
       count(*) filter (where m.role = 'staff') as staff
from public.memberships m
left join public.organizations o on o.id = m.org_id
group by o.name
order by 3 desc;

-- 【二】★★役職を 持たない 方の、★役割の 内わけ（★全体）
select coalesce(m.role, '（無し）') as 役割,
       count(*) as 人数
from public.memberships m
where m.post_id is null
group by m.role
order by 2 desc;

-- 【三】★役職の 行が あるのに、★その 役職が 消えて いる 人
--   ★★`permsOfMember` は、★役職が 見つからない と null を 返します。
--   ★★つまり この 方も 名前の ちからに 落ちます。
select count(*) as 役職の行き先が無い人
from public.memberships m
where m.post_id is not null
  and not exists (select 1 from public.org_posts p where p.id = m.post_id);

-- 【四】★役職（org_posts）に、★できことが 入って いるか
select p.name as 役職, p.perms
from public.org_posts p
order by p.name
limit 30;
