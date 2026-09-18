-- ===========================================================================
-- ★問い ── ★坂本さんは、★マイ教室で 役職（できこと）を お持ちですか
--
--   ★★A2（★2026-09-18）で、★`owner` という **名前**では 何も 開かなく なりました。
--     ★★運営に 入れるかは、★役職（`org_posts.perms`）だけ で 決まります。
--   ★★入口が 出ない わけは、★2つの どちらか です ──
--       ㋐ 配備が まだ 届いて いない
--       ㋑ ★役職を お持ちで ない
--   ★★★これは ㋑ かどうかを 見る 問い です。
--
--   ★★★読むだけ です。★1文字も 書きません。
--   ★★下の 【三】だけ、★役職を 入れます。★㋑ だった ときに 走らせて ください。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★坂本さんの 教室と、★役職の あるなし
-- ---------------------------------------------------------------------------
select o.id as org_id, o.name as 教室, m.role as もとの役割,
       m.post_id is not null as 役職あり,
       p.name as 役職,
       p.perms,
       (p.perms ?| array['meibo','sched_all','sched_mine','bill','monka_write',
                         'gyoji','renraku_all','monka_read','koma','master','post'])
         as 運営に入れるか
from public.memberships m
left join public.organizations o on o.id = m.org_id
left join public.org_posts p on p.id = m.post_id
where m.user_id = (select id from auth.users where email = 'kyo0703opera@gmail.com')
order by o.name;

-- ★★「運営に入れるか」が false／null なら、★㋑ です。★入口は 出ません。

-- ---------------------------------------------------------------------------
-- 【二】★その 教室に、★どんな 役職が 用意されて いますか
-- ---------------------------------------------------------------------------
select p.id, o.name as 教室, p.name as 役職, p.perms
from public.org_posts p
left join public.organizations o on o.id = p.org_id
where p.org_id in (
  select m.org_id from public.memberships m
  where m.user_id = (select id from auth.users where email = 'kyo0703opera@gmail.com')
)
order by o.name, p.name;

-- ---------------------------------------------------------------------------
-- 【三】★★㋑ だった ときだけ ── ★「学長」の 役職を 作り、★お付けします
--
--   ★★できことは `lib/opsPerms.js` の `TEMPLATE_POSTS` の「学長」と 同じ 10個 です。
--     ★★学校を 持つ 方 です。★お金も 役職も、★ぜんぶ 触れる 必要が あります。
--   ★★名が すでに ある ときは 作りません。★二重に しません。
--   ★何度 走らせても 同じに なります。
--
--   ★★★上の 2行の `--` を 外して から 走らせて ください。
-- ---------------------------------------------------------------------------
-- insert into public.org_posts (org_id, name, perms)
-- select m.org_id, '学長',
--        jsonb_build_object('bill', true, 'bill_pay', true, 'meibo', true,
--          'sched_all', true, 'gyoji', true, 'renraku_all', true,
--          'shukketsu', true, 'koma', true, 'master', true, 'post', true)
--   from public.memberships m
--  where m.user_id = (select id from auth.users where email = 'kyo0703opera@gmail.com')
--    and not exists (select 1 from public.org_posts p
--                     where p.org_id = m.org_id and p.name = '学長');
--
-- update public.memberships m
--    set post_id = (select p.id from public.org_posts p
--                    where p.org_id = m.org_id and p.name = '学長' limit 1)
--  where m.user_id = (select id from auth.users where email = 'kyo0703opera@gmail.com')
--    and m.post_id is null;

-- ---------------------------------------------------------------------------
-- 【四】★入った ことの 確かめ（★読むだけ・★【三】の あと）
-- ---------------------------------------------------------------------------
select o.name as 教室, p.name as 役職,
       (p.perms ?| array['meibo','sched_all','sched_mine','bill','monka_write',
                         'gyoji','renraku_all','monka_read','koma','master','post'])
         as 運営に入れるか
from public.memberships m
left join public.organizations o on o.id = m.org_id
left join public.org_posts p on p.id = m.post_id
where m.user_id = (select id from auth.users where email = 'kyo0703opera@gmail.com')
order by o.name;
