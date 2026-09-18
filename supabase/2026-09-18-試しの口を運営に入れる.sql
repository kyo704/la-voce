-- ===========================================================================
-- ★試しの 口（+forcode）を、★運営に 入れる（★2026-09-18）
--
--   ★★なぜ 要るか ── ★設定の 画面を **撮る** ため です。
--     ★★坂本さんから「見た目が 見本と ちがう」と ご指摘を いただきました。
--     ★★見本は 撮れました。★実装の ほうが 撮れません ──
--       ★★試しの 口に 役職が 無く、★運営に 入れない から です。
--     ★★坂本さんの 口は 使えません（★本番の 合言葉は 扱わない、という 決め）。
--
--   ★★★入れ先は「はじめの1人テスト（消してよい）」です。
--     ★★名に「消してよい」と 書かれた、★試しの ための 教室 です。
--     ★★本当の お客さまの 教室には 触れません。
--
--   ★★できことは「学長」と 同じ 10個 に します。
--     ★★設定の 11の 節が **ぜんぶ 出る** 形で 撮る ため です。
--     ★★狭いと、★出て いない だけ なのか、★作って いないのかが 分かりません。
--
--   ★何度 走らせても 同じに なります。
--   ★★片づけの SQL を、★いちばん 下に 付けて います。
-- ===========================================================================

-- 【一】★入れる 前（★読むだけ）
select o.id as org_id, o.name as 教室, m.role as もとの役割,
       m.post_id is not null as 役職あり
from public.memberships m
left join public.organizations o on o.id = m.org_id
where m.user_id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com')
order by o.name;

-- 【二】★役職を 作る（★その 教室に 「学長」が 無ければ）
insert into public.org_posts (org_id, name, perms)
select m.org_id, '学長',
       jsonb_build_object('bill', true, 'bill_pay', true, 'meibo', true,
         'sched_all', true, 'gyoji', true, 'renraku_all', true,
         'shukketsu', true, 'koma', true, 'master', true, 'post', true)
  from public.memberships m
  join public.organizations o on o.id = m.org_id
 where m.user_id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com')
   and o.name like '%消してよい%'
   and not exists (select 1 from public.org_posts p
                    where p.org_id = m.org_id and p.name = '学長');

-- 【三】★その 役職を 付ける
update public.memberships m
   set post_id = (select p.id from public.org_posts p
                   where p.org_id = m.org_id and p.name = '学長' limit 1)
 where m.user_id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com')
   and m.org_id in (select o.id from public.organizations o where o.name like '%消してよい%')
   and m.post_id is null;

-- 【四】★入った ことの 確かめ（★読むだけ）
select o.name as 教室, p.name as 役職,
       (p.perms ?| array['meibo','sched_all','bill','gyoji','renraku_all',
                         'koma','master','post']) as 運営に入れるか
from public.memberships m
left join public.organizations o on o.id = m.org_id
left join public.org_posts p on p.id = m.post_id
where m.user_id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com')
order by o.name;

-- ===========================================================================
-- ★★片づけ（★撮り終えたら・★注記を 外して）
-- ===========================================================================
-- update public.memberships m set post_id = null
--  where m.user_id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com')
--    and m.org_id in (select o.id from public.organizations o where o.name like '%消してよい%');
