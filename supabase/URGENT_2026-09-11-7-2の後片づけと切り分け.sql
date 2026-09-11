-- ============================================================================
-- §7-2 の あと片づけ と、★エラーの 切り分け
--
--   ★起きた こと（★2026-09-11）
--     ERROR: 42501: permission denied for table memberships
--     HINT: GRANT UPDATE ON public.memberships TO authenticated;
--     ★☐1 の ところで 止まりました。
--
--   ★★だから、★⑧（消す）と ⑨（数える）まで 届いて いません。
--     ★捨てて よい 教室が、★まだ 残って いる はずです。
--
--   ★★★この 台本を、★先に 流して ください。
--     ★① なりきりを やめる（★これを 先に しないと、★消すのも 拒まれます）
--     ★② 残って いる ものを 数える
--     ★③ 名指しで 消す
--     ★④ 消えた ことを 数える
--     ★⑤ エラーの 切り分け（★読むだけ）
-- ============================================================================


-- ===========================================================================
-- ① ★★まず、★なりきりを やめる
--
--   ★★止まった とき、★authenticated の ままに なって いる ことが あります。
--     ★★その ままだと、★消すのも 同じ 拒否で 失敗します。
--   ★★すでに 戻って いても、★害は ありません。
-- ===========================================================================
reset role;
reset request.jwt.claims;

select current_user as "いま 誰か（★持ち主に 戻って いる こと）";


-- ===========================================================================
-- ② ★残って いる ものを 数える（★消す 前の 記録）
-- ===========================================================================
select
  (select count(*) from public.organizations
    where name = '★テスト用（消してよい）2026-09-11')                  as "教室",
  (select count(*) from public.org_posts p
    join public.organizations o on o.id = p.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')                as "役職",
  (select count(*) from public.memberships m
    join public.organizations o on o.id = m.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')                as "在籍",
  (select count(*) from public.org_events e
    join public.organizations o on o.id = e.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')                as "行事";

-- ★★使い捨ての アカウントが、★どんな 立場に なって いるか。
--   ★★☐1 が 通って いたら、★ここが「★テスト学長」に なって います。
select
  o.name  as "教室",
  m.role  as "役割",
  p.name  as "役職"
from public.memberships m
join public.organizations o on o.id = m.org_id
left join public.org_posts p on p.id = m.post_id
where m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
order by o.name;


-- ===========================================================================
-- ③ ★名指しで 消す
--
--   ★★ROLLBACK に 任せません。★1つずつ 消します。
--   ★★捨てて よい 教室の ものだけです。★ほかには 触れません。
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
-- ④ ★消えた ことを 数える（★★4つ とも 0 で ある こと）
-- ===========================================================================
select
  (select count(*) from public.organizations
    where name = '★テスト用（消してよい）2026-09-11')                  as "教室（0）",
  (select count(*) from public.org_posts p
    join public.organizations o on o.id = p.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')                as "役職（0）",
  (select count(*) from public.memberships m
    join public.organizations o on o.id = m.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')                as "在籍（0）",
  (select count(*) from public.org_events e
    join public.organizations o on o.id = e.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')                as "行事（0）";

-- ★★使い捨ての アカウントが、★どこにも 残って いない ことの 確かめ。
select count(*) as "使い捨ての アカウントの 在籍（★もとの 数）"
from public.memberships
where user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';


-- ===========================================================================
-- ⑤ ★★エラーの 切り分け（★読むだけ）
--
--   ★★42501 は「権限（GRANT）が 無い」という 拒否です。
--     ★★「決まり（RLS）に はじかれた」とは **ちがいます**。
--     ★★決まりに はじかれた ときは、★エラーに ならず「0 rows」に なります。
--   ★★つまり ☐1 は、★**決まりの 手前で 止まりました**。
--     ★★決まりが 正しいか どうかは、★まだ 分かって いません。
--
--   ★★ここで 数えるのは 2つ です。
--     ㋐ authenticated は memberships に 何を 持って いるか
--     ㋑ memberships の 決まりは、★いま どう 書いて あるか
-- ===========================================================================

-- ㋐ ★authenticated の 権限
--    ★★UPDATE が 無ければ、★画面からは そもそも 触れません。
--      ★★けれど、★HINT の とおり 1行 足せば 触れる ように なります。
--      ★★そのとき、★決まりが 正しく なければ 穴が 開きます。
select
  privilege_type as "できること",
  count(*)       as "列の 数"
from information_schema.column_privileges
where table_schema='public' and table_name='memberships' and grantee='authenticated'
group by privilege_type
order by privilege_type;

select privilege_type as "表ごと の できること"
from information_schema.table_privileges
where table_schema='public' and table_name='memberships' and grantee='authenticated'
order by privilege_type;

-- ㋑ ★memberships の 決まり
--    ★★「役職の 名前」や role が 出て くるかを、★目で 見て ください。
select
  policyname as "決まり",
  cmd        as "いつ",
  roles      as "だれに",
  qual       as "読むときの 条件",
  with_check as "書くときの 条件"
from pg_policies
where schemaname='public' and tablename='memberships'
order by cmd, policyname;

-- ㋒ ★ほかの 表も、★同じ 形に なって いないか。
--    ★★「決まりは あるが、★権限が 無い」表は、★機能が 止まって います。
--    ★★「権限は あるが、★決まりが 古い」表は、★穴に なり得ます。
select
  c.relname as "表",
  (select count(*) from pg_policies p
    where p.schemaname='public' and p.tablename=c.relname)          as "決まりの 数",
  (select count(*) from information_schema.table_privileges t
    where t.table_schema='public' and t.table_name=c.relname
      and t.grantee='authenticated' and t.privilege_type='UPDATE')  as "authenticated の UPDATE"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
  and c.relname in ('memberships','organizations','org_posts','org_events',
                    'lessons','enrollments','assignments','entries','profiles')
order by c.relname;
