-- ============================================================================
-- §7-2　★残り 1本の 道を 確かめる ── mayTouchPosts の 3行目
--
--   ★★前回 分かった こと
--     ☐1／1-b／1-c は、★API で **403** でした。★通りません でした。
--     ★★けれど、★通った のは 2行目 です ──
--
--       function mayTouchPosts(member, perms) {
--         if (!member) return false;
--         if (perms) return perms.has("post");   ★← ★ここで 断られました
--         return member.role === "owner";        ★← ★ここは 通って いません
--       }
--
--   ★★3行目が 効くのは、★**役職（post）を 1つも 持って いない** ときだけ です。
--     ★★前回の 使い捨ての アカウントは 役職を 持って いたので、
--       ★2行目で 判じが つきました。
--
--   ★★ここが、★§7 の 言う「役職名で 分岐」の **残り** です。
--     ★★role が 'owner' なら、★できことを 見ずに 通ります。
--
--   ★★確かめ方
--     ★役職を 外し（post_id = null）、★role を 'owner' に します。
--     ★★そのうえで、★私が API に 投げます。
--     ★★通れば、★3行目が 効いて いる、と 分かります。
--
--   ★★これは「穴」では ないかも しれません。
--     ★★学校を 作った 方が、★はじめの 役職を 作る ための 道だからです。
--     ★★けれど、★**できことを 見て いない**ことは 確かです。
--       ★そこを 記録に 残します。
--
--   ★★捨てて よい 教室の 中だけです。★終わったら 後片づけを 流して ください。
-- ============================================================================

-- ① 教室が 無ければ 作り直す（★前回 片づけて いても 動きます）
insert into public.organizations (name, created_by)
select '★テスト用（消してよい）2026-09-11', 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
where not exists (select 1 from public.organizations
                   where name = '★テスト用（消してよい）2026-09-11');

insert into public.org_posts (org_id, name, perms)
select o.id, '★テスト学長',
       '{"bill":true,"bill_pay":true,"meibo":true,"sched_all":true,"gyoji":true,
         "renraku_all":true,"shukketsu":true,"koma":true,"master":true,"post":true}'::jsonb
from public.organizations o
where o.name = '★テスト用（消してよい）2026-09-11'
  and not exists (select 1 from public.org_posts p
                   where p.org_id = o.id and p.name = '★テスト学長');

-- ② ★★役職を 持たない owner に する（★ここが 今回の 肝）
insert into public.memberships (org_id, user_id, role, post_id)
select o.id, 'f7520dc1-9154-4524-a350-ba0bcddbf0b2', 'owner', null
from public.organizations o
where o.name = '★テスト用（消してよい）2026-09-11'
  and not exists (select 1 from public.memberships m
                   where m.org_id = o.id
                     and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2');

update public.memberships m
   set role = 'owner', post_id = null
  from public.organizations o
 where o.id = m.org_id
   and o.name = '★テスト用（消してよい）2026-09-11'
   and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';

-- ③ ★★いまの 立ち位置（★役職が null で ある こと）
select
  m.role   as "役割",
  m.post_id as "役職（★null で ある こと）",
  o.id     as "★教室の id（★お知らせ ください）",
  (select p.id from public.org_posts p
    where p.org_id = o.id and p.name = '★テスト学長') as "★学長の 役職の id（★同じく）"
from public.memberships m
join public.organizations o on o.id = m.org_id
where o.name = '★テスト用（消してよい）2026-09-11'
  and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';
