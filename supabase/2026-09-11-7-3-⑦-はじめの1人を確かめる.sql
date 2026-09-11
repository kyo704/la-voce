-- ============================================================================
-- §7-3 ⑦　★新しい 教室の「はじめの 1人」が、★これまでどおり 作れるか
--
--   ★★なぜ 確かめるか
--     ★can_grant_post は、★役職を 持って いない 方に false を 返します。
--     ★★わざと です。★それが「自分を 学長に する」道 だからです。
--     ★★では、★新しい 教室の はじめの 1人は どう するか。
--       ★★app/api/org/posts の action:"template" が 作ります。
--       ★★あちらは 裏口（service role）で 動き、★決まりを 飛び越えます。
--     ★★つまり、★かかりません。★けれど、★**確かめて いません**。
--
--   ★★この 台本は 下ごしらえ だけ です。★確かめは、★私が API に 投げます。
--   ★★終わったら、★⑤で 名指しに 消します。
--
--   ★★捨てて よい 教室 1つの 中だけ です。★本物には 触れません。
-- ============================================================================

-- ① ★役職の 無い 教室を 1つ（★新しく 作った ばかりの 姿）
insert into public.organizations (name, created_by)
select '★はじめの1人テスト（消してよい）', 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
where not exists (select 1 from public.organizations
                   where name = '★はじめの1人テスト（消してよい）');

-- ② ★その方を owner に。★役職は 付けません（★null の まま）。
insert into public.memberships (org_id, user_id, role, post_id)
select o.id, 'f7520dc1-9154-4524-a350-ba0bcddbf0b2', 'owner', null
from public.organizations o
where o.name = '★はじめの1人テスト（消してよい）'
  and not exists (select 1 from public.memberships m
                   where m.org_id = o.id
                     and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2');

-- ③ ★いまの 姿（★役職が 0件・post_id が null で ある こと）
select
  o.id      as "★教室の id（★お知らせ ください）",
  m.role    as "役割",
  m.post_id as "役職（★null）",
  (select count(*) from public.org_posts p where p.org_id = o.id) as "役職の 数（★0）"
from public.memberships m
join public.organizations o on o.id = m.org_id
where o.name = '★はじめの1人テスト（消してよい）';


-- ===========================================================================
-- ④ ★★ここで 止めて、★教室の id を お知らせ ください。
--    ★★私が API に action:"template" を 投げます。
--    ★★通れば、★はじめの 1人は これまでどおり 作れる、と 分かります。
-- ===========================================================================


-- ===========================================================================
-- ⑤ ★確かめが 済んだら、★名指しで 消す
-- ===========================================================================
-- delete from public.memberships
--  where org_id in (select id from public.organizations
--                    where name = '★はじめの1人テスト（消してよい）');
-- delete from public.org_posts
--  where org_id in (select id from public.organizations
--                    where name = '★はじめの1人テスト（消してよい）');
-- delete from public.organizations
--  where name = '★はじめの1人テスト（消してよい）';
--
-- select
--   (select count(*) from public.organizations
--     where name = '★はじめの1人テスト（消してよい）') as "教室（0）",
--   (select count(*) from public.memberships
--     where user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2') as "使い捨ての 在籍";
