-- ============================================================================
-- §7-2 の 続き ── ☐2・☐3 と、★決まりの 読み取り
--
--   ★★前回 分かった こと
--     ☐1 は ERROR 42501（permission denied）で 止まりました。
--     ★★これは「権限（GRANT）が 無い」拒否です。
--     ★★「決まり（RLS）に はじかれた」とは **ちがいます**。
--       ★決まりに はじかれる ときは、★エラーに ならず 0 rows に なります。
--     ★★つまり、★**決まりの 手前で 止まりました**。
--       ★★決まりが 正しいかは、★まだ 分かって いません。
--
--   ★★★ここで、★わざと 権限を 足して 試す ことは しません。
--     ★★HINT は「GRANT UPDATE …」と 勧めて きます。★従いません。
--     ★★理由 ── ★前回、★台本は 途中で 止まりました。
--       ★★足してから 止まれば、★足した ままに なります。
--       ★★それは、★穴を 自分で 開けて 放置する ことです。
--     ★★代わりに、★決まりの 式を **読んで** 判じます（★④）。
--
--   ★★この 台本は 書きます。★捨てて よい 教室 1つの 中だけです。
--   ★★BEGIN／ROLLBACK を 使いません。★⑤で 名指しで 消します。
--   ★★止まったら、★URGENT_2026-09-11-7-2の後片づけと切り分け.sql を 流して ください。
-- ============================================================================


-- ===========================================================================
-- ① ★下ごしらえ（★前回と 同じ）
-- ===========================================================================
insert into public.organizations (name, created_by)
select '★テスト用（消してよい）2026-09-11', 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
where not exists (select 1 from public.organizations
                   where name = '★テスト用（消してよい）2026-09-11');

insert into public.org_posts (org_id, name, perms)
select o.id, '★テスト職員', '{"sched_all":true,"shukketsu":true,"koma":true}'::jsonb
from public.organizations o
where o.name = '★テスト用（消してよい）2026-09-11'
  and not exists (select 1 from public.org_posts p
                   where p.org_id = o.id and p.name = '★テスト職員');

insert into public.memberships (org_id, user_id, role, post_id)
select o.id, 'f7520dc1-9154-4524-a350-ba0bcddbf0b2', 'staff', p.id
from public.organizations o
join public.org_posts p on p.org_id = o.id and p.name = '★テスト職員'
where o.name = '★テスト用（消してよい）2026-09-11'
  and not exists (select 1 from public.memberships m
                   where m.org_id = o.id
                     and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2');


-- ===========================================================================
-- ② ☐2 ★職員の 資格で、★行事を 書き換えられるか
--
--   ★★答えの 読み方
--     ★行が 返る　　　　… ★★通って しまいました（★穴）
--     ★0 rows　　　　　 … ★決まりに はじかれました（★正しい 姿）
--     ★ERROR 42501　　 … ★権限が 無くて 止まりました（★決まりは 未確認）
-- ===========================================================================
set role authenticated;
set request.jwt.claims = '{"sub":"f7520dc1-9154-4524-a350-ba0bcddbf0b2","role":"authenticated"}';

insert into public.org_events (org_id, title, event_date)
select o.id, '★テスト行事（消してよい）', current_date
from public.organizations o
where o.name = '★テスト用（消してよい）2026-09-11'
returning '☐2 行事を 作る' as "確かめ", id as "作れた 行事";


-- ===========================================================================
-- ③ ☐3 ★学科長（role=admin）の 資格で、★学校の 形を 直せるか
-- ===========================================================================
reset role;
reset request.jwt.claims;

update public.memberships m
   set role = 'admin'
  from public.organizations o
 where o.id = m.org_id
   and o.name = '★テスト用（消してよい）2026-09-11'
   and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';

set role authenticated;
set request.jwt.claims = '{"sub":"f7520dc1-9154-4524-a350-ba0bcddbf0b2","role":"authenticated"}';

update public.organizations o
   set name = '★テスト用（消してよい）2026-09-11'
 where o.name = '★テスト用（消してよい）2026-09-11'
returning '☐3 学校の 形を 直す' as "確かめ", o.id as "直せた 教室";

reset role;
reset request.jwt.claims;


-- ===========================================================================
-- ④ ★☐1 の 決まりを、★読んで 判じる（★読むだけ）
--
--   ★★権限を 足さずに、★決まりの 式だけを 見ます。
--   ★★見る ところは 3つ です。
--     ㋐ 式に role が 出て くるか　★＝ 古い 軸を 見て いる
--     ㋑ 式に post_id や perms が 出て くるか　★＝ できこと を 見て いる
--     ㋒ 「自分が 持って いる ものしか 渡せない」が 入って いるか（★7-4）
-- ===========================================================================
select
  policyname as "決まり",
  cmd        as "いつ",
  qual       as "読むときの 条件",
  with_check as "書くときの 条件",
  (coalesce(qual,'') || coalesce(with_check,'')) like '%role%'    as "★role を 見て いるか",
  (coalesce(qual,'') || coalesce(with_check,'')) like '%post_id%' as "★役職を 見て いるか",
  (coalesce(qual,'') || coalesce(with_check,'')) like '%perms%'   as "★できこと を 見て いるか"
from pg_policies
where schemaname='public' and tablename='memberships'
order by cmd, policyname;

-- ★★行事の 決まりも 同じく。
select
  policyname as "決まり",
  cmd        as "いつ",
  qual       as "読むときの 条件",
  with_check as "書くときの 条件",
  (coalesce(qual,'') || coalesce(with_check,'')) like '%role%'  as "★role を 見て いるか",
  (coalesce(qual,'') || coalesce(with_check,'')) like '%perms%' as "★できこと を 見て いるか"
from pg_policies
where schemaname='public' and tablename in ('org_events','organizations','lessons')
order by tablename, cmd, policyname;


-- ===========================================================================
-- ⑤ ★名指しで 消す（★ROLLBACK に 任せません）
-- ===========================================================================
delete from public.org_events
 where org_id in (select id from public.organizations
                   where name = '★テスト用（消してよい）2026-09-11');
delete from public.memberships
 where org_id in (select id from public.organizations
                   where name = '★テスト用（消してよい）2026-09-11');
delete from public.org_posts
 where org_id in (select id from public.organizations
                   where name = '★テスト用（消してよい）2026-09-11');
delete from public.organizations
 where name = '★テスト用（消してよい）2026-09-11';


-- ===========================================================================
-- ⑥ ★消えた ことを 数える（★4つ とも 0）
-- ===========================================================================
select
  (select count(*) from public.organizations
    where name = '★テスト用（消してよい）2026-09-11')     as "教室（0）",
  (select count(*) from public.org_posts p
    join public.organizations o on o.id=p.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')   as "役職（0）",
  (select count(*) from public.memberships m
    join public.organizations o on o.id=m.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')   as "在籍（0）",
  (select count(*) from public.org_events e
    join public.organizations o on o.id=e.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')   as "行事（0）";

select count(*) as "使い捨ての アカウントの 在籍（★0）"
from public.memberships
where user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';
