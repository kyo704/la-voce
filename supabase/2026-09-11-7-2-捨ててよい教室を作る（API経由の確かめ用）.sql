-- ============================================================================
-- §7-2　★API 経由の 確かめの ための 下ごしらえ
--
--   ★坂本さんの お許し（★2026-09-11）
--     「API経由の確かめを、進めてください。捨ててよい教室を1つ作ることも、許可します。」
--
--   ★★これは 下ごしらえ だけ です。★確かめは、★私が API に 投げます。
--   ★★終わったら、★★後片づけの 台本を 必ず 流して ください。
--     supabase/URGENT_2026-09-11-7-2の後片づけと切り分け.sql
--
--   ★★★最後に 出る「教室の id」を、★そのまま お知らせ ください。
--     ★その id で、★私が API に 投げます。
-- ============================================================================

-- ① 教室を 1つ
insert into public.organizations (name, created_by)
select '★テスト用（消してよい）2026-09-11', 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
where not exists (select 1 from public.organizations
                   where name = '★テスト用（消してよい）2026-09-11');

-- ② 役職を 2つ（★職員 と 学長）
insert into public.org_posts (org_id, name, perms)
select o.id, '★テスト職員', '{"sched_all":true,"shukketsu":true,"koma":true}'::jsonb
from public.organizations o
where o.name = '★テスト用（消してよい）2026-09-11'
  and not exists (select 1 from public.org_posts p
                   where p.org_id = o.id and p.name = '★テスト職員');

insert into public.org_posts (org_id, name, perms)
select o.id, '★テスト学長',
       '{"bill":true,"bill_pay":true,"meibo":true,"sched_all":true,"gyoji":true,
         "renraku_all":true,"shukketsu":true,"koma":true,"master":true,"post":true}'::jsonb
from public.organizations o
where o.name = '★テスト用（消してよい）2026-09-11'
  and not exists (select 1 from public.org_posts p
                   where p.org_id = o.id and p.name = '★テスト学長');

-- ③ 使い捨ての アカウントを「職員」に する
--    ★★role は staff。★役職は ★テスト職員（★post を 持って いません）。
insert into public.memberships (org_id, user_id, role, post_id)
select o.id, 'f7520dc1-9154-4524-a350-ba0bcddbf0b2', 'staff', p.id
from public.organizations o
join public.org_posts p on p.org_id = o.id and p.name = '★テスト職員'
where o.name = '★テスト用（消してよい）2026-09-11'
  and not exists (select 1 from public.memberships m
                   where m.org_id = o.id
                     and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2');

-- ④ ★★お知らせ ください ── ★この 3つの id
select
  o.id as "★教室の id（★これを お知らせ ください）",
  (select p.id from public.org_posts p
    where p.org_id = o.id and p.name = '★テスト職員') as "★職員の 役職の id",
  (select p.id from public.org_posts p
    where p.org_id = o.id and p.name = '★テスト学長') as "★学長の 役職の id"
from public.organizations o
where o.name = '★テスト用（消してよい）2026-09-11';

-- ⑤ ★いまの 立ち位置の 確かめ
select m.role as "役割", p.name as "役職", p.perms as "できること"
from public.memberships m
join public.organizations o on o.id = m.org_id
left join public.org_posts p on p.id = m.post_id
where o.name = '★テスト用（消してよい）2026-09-11';
