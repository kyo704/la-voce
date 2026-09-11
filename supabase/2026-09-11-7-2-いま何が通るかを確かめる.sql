-- ============================================================================
-- §7-2　★いま、★何が 通って しまうか ── ★★直す 前に 確かめる
--
--   ★出どころ docs/opus/作業指示-権限の事故を直し、記録を残す（9月11日）.md §7-2
--     「★★まず 確かめてください。★直す前に です。」
--     「★★★直してからでは、★元が 穴だったのか 分かりません。」
--
--   ★★確かめる のは 4つ です。
--     ☐ 職員の 資格で、★役職を 変える 要求が 通るか
--     ☐ 職員の 資格で、★行事を 書き換えられるか
--     ☐ 学科長の 資格で、★学校の 形（master）を 直せるか
--     ☐ 教授の 資格で、★ほかの 先生の 日程を 直せるか
--
-- ============================================================================
-- ★★★★ この 台本は **書きます**。★読むだけでは ありません。
--
--   ★★けれど、★書くのは **捨てて よい 教室 1つ**の 中だけです。
--     ★名前　「★テスト用（消してよい）2026-09-11」
--     ★★本物の 教室にも、★本物の 方にも、★1度も 触れません。
--
--   ★★★BEGIN／ROLLBACK を **使いません**。
--     ★★2026-09-11 より 前に、★1度 事故が ありました ──
--       ★★ROLLBACK を 書いた のに、★SQL Editor が 戻さず、
--       ★★坂本さん ご自身の 権限が 上がった まま 残りました。
--     ★★だから、★戻すのを 台帳に 任せません。
--       ★★⑧で、★作った ものを **1つずつ 名指しで 消します**。
--       ★★⑨で、★消えた ことを **数えて** 確かめます。
--
--   ★★上げる のは、★使い捨ての アカウントだけです。
--     ★kyo0703opera+forcode@gmail.com（★f7520dc1-9154-4524-a350-ba0bcddbf0b2）
--     ★★坂本さん ご自身の アカウントには 1度も 触れません。
--
--   ★★★上から 下まで、★一度に 流して ください。
--     ★★途中で 止めると、★捨てる はずの ものが 残ります。
--     ★★止まって しまったら、★⑧だけを もう一度 流して ください。
-- ============================================================================


-- ===========================================================================
-- ① ★触る 相手を、★はっきり させる
-- ===========================================================================
select
  u.id    as "使い捨ての アカウント",
  u.email as "メール"
from auth.users u
where u.id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';
-- ★★↑ここが kyo0703opera+forcode@gmail.com で ある ことを、★目で 確かめて ください。
--    ★ちがったら、★ここで 止めて ください。


-- ===========================================================================
-- ② ★捨ててよい 教室を 1つ 作る
-- ===========================================================================
insert into public.organizations (name, created_by)
select '★テスト用（消してよい）2026-09-11', 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
where not exists (
  select 1 from public.organizations
   where name = '★テスト用（消してよい）2026-09-11'
);

select id as "捨ててよい 教室", name as "名前"
from public.organizations
where name = '★テスト用（消してよい）2026-09-11';


-- ===========================================================================
-- ③ ★その 教室に、★役職を 2つ 作る（★職員 と 学長）
--
--   ★★できることは lib/opsPerms.js の はじめの ひな型と 同じです。
-- ===========================================================================
-- ★★perms は jsonb です（★{"meibo": true} の 形）。★配列では ありません。
--   ★出どころ supabase/2026-09-11-役職とできることの器.sql:62
insert into public.org_posts (org_id, name, perms)
select o.id, '★テスト職員',
       '{"sched_all":true,"shukketsu":true,"koma":true}'::jsonb
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

select p.name as "役職", p.perms as "できること"
from public.org_posts p
join public.organizations o on o.id = p.org_id
where o.name = '★テスト用（消してよい）2026-09-11'
order by p.name;


-- ===========================================================================
-- ④ ★使い捨ての アカウントを、★その 教室の「職員」に する
--
--   ★★role は staff、★役職は ★テスト職員。
--   ★★これが、★§7-2 の 表で いう「職員」です。
-- ===========================================================================
insert into public.memberships (org_id, user_id, role, post_id)
select o.id, 'f7520dc1-9154-4524-a350-ba0bcddbf0b2', 'staff', p.id
from public.organizations o
join public.org_posts p on p.org_id = o.id and p.name = '★テスト職員'
where o.name = '★テスト用（消してよい）2026-09-11'
  and not exists (select 1 from public.memberships m
                   where m.org_id = o.id
                     and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2');

select m.role as "役割", p.name as "役職"
from public.memberships m
join public.organizations o on o.id = m.org_id
left join public.org_posts p on p.id = m.post_id
where o.name = '★テスト用（消してよい）2026-09-11';


-- ===========================================================================
-- ⑤ ★★ここから、★職員の 資格に なりきります
--
--   ★★set role で、★台帳から 見た「誰か」を 変えます。
--   ★★reset role を ⑦で 必ず 行います。
-- ===========================================================================
set role authenticated;
set request.jwt.claims = '{"sub":"f7520dc1-9154-4524-a350-ba0bcddbf0b2","role":"authenticated"}';

-- ★念のため、★いま 誰に なって いるかを 見ます。
select auth.uid() as "いま 誰か（★使い捨ての id で ある こと）";


-- ── ☐1 ★職員の 資格で、★役職を 変える 要求が 通るか
--
--    ★★自分の 役職を「★テスト学長」に 変えようと します。
--    ★★通ったら、★**職員が 自分を 学長に できる** という ことです。
--      ★★名簿の 書き出しより 重い 穴です。
--    ★★結果は「更新した 行の 数」で 分かります。
--      ★0 … ★通りません でした（★正しい 姿）
--      ★1 … ★★通って しまいました（★穴）
with 学長 as (
  select p.id from public.org_posts p
  join public.organizations o on o.id = p.org_id
  where o.name = '★テスト用（消してよい）2026-09-11' and p.name = '★テスト学長'
)
update public.memberships m
   set post_id = (select id from 学長)
  from public.organizations o
 where o.id = m.org_id
   and o.name = '★テスト用（消してよい）2026-09-11'
   and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
returning '☐1 役職を 変える' as "確かめ", m.post_id as "変わった 先";


-- ── ☐2 ★職員の 資格で、★行事を 書き換えられるか
--
--    ★★まず 1つ 作って みます。★作れたら、★それが 答えです。
-- ★★列は event_date です（★starts_on では ありません）。
--   ★出どころ supabase/migration_org_events.sql:33
insert into public.org_events (org_id, title, event_date)
select o.id, '★テスト行事（消してよい）', current_date
from public.organizations o
where o.name = '★テスト用（消してよい）2026-09-11'
returning '☐2 行事を 作る' as "確かめ", id as "作れた 行事";


-- ===========================================================================
-- ⑥ ★学科長・教授の ぶん
--
--   ★★役職を 付け替えて、★同じ ことを します。
--   ★★⑤で 上がって しまって いたら、★ここは 意味を 失います。
--     ★★だから、★役職を いちど 職員に 戻してから 進めます。
-- ===========================================================================
reset role;
reset request.jwt.claims;

-- ★役職を「★テスト職員」に 戻す（★持ち主の 資格で）
update public.memberships m
   set post_id = (select p.id from public.org_posts p
                  join public.organizations o on o.id = p.org_id
                  where o.name = '★テスト用（消してよい）2026-09-11'
                    and p.name = '★テスト職員')
  from public.organizations o
 where o.id = m.org_id
   and o.name = '★テスト用（消してよい）2026-09-11'
   and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';

-- ★役割（role）を admin に する ── ★これが「学科長」の 立ち位置です。
--   ★★§7-2 の 表　admin の 中に、★学部長（master あり）と 学科長（master なし）が 居ます。
update public.memberships m
   set role = 'admin'
  from public.organizations o
 where o.id = m.org_id
   and o.name = '★テスト用（消してよい）2026-09-11'
   and m.user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';

set role authenticated;
set request.jwt.claims = '{"sub":"f7520dc1-9154-4524-a350-ba0bcddbf0b2","role":"authenticated"}';

-- ── ☐3 ★学科長の 資格で、★学校の 形（master）を 直せるか
--    ★★教室の 名前を 変えて みます。★通ったら、★形を 直せる という ことです。
update public.organizations o
   set name = '★テスト用（消してよい）2026-09-11'
 where o.name = '★テスト用（消してよい）2026-09-11'
returning '☐3 学校の 形を 直す' as "確かめ", o.id as "直せた 教室";


-- ── ☐4 ★教授の 資格で、★ほかの 先生の 日程を 直せるか
--
--    ★★lessons は、★先生と 生徒の つながり（teacher_student_links）に
--      ★ぶら下がって います。★教室の 表では ありません。
--    ★★だから、★捨ててよい 教室の 中で 試せません。
--      ★★本物の つながりに 触る ことに なります。★それは しません。
--    ★★代わりに、★**決まりの 中身を 読んで** お出しします。
--      ★★動かして 確かめる のは、★つながりを 1つ 作ってからです。
--      ★★そこは 坂本さんの お許しを いただいてから に します。
select
  policyname as "決まり",
  cmd        as "いつ",
  qual       as "読むときの 条件",
  with_check as "書くときの 条件"
from pg_policies
where schemaname='public' and tablename='lessons'
order by cmd, policyname;


-- ===========================================================================
-- ⑦ ★★なりきりを 必ず やめる
-- ===========================================================================
reset role;
reset request.jwt.claims;

select current_user as "いま 誰か（★持ち主に 戻って いる こと）";


-- ===========================================================================
-- ⑧ ★★作った ものを、★1つずつ 名指しで 消す
--
--   ★★ROLLBACK に 任せません。★名指しで 消します。
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
-- ⑨ ★★消えた ことを 数えて 確かめる（★★4つ とも 0 で ある こと）
-- ===========================================================================
select
  (select count(*) from public.organizations
    where name = '★テスト用（消してよい）2026-09-11')            as "教室（0で あること）",
  (select count(*) from public.org_posts p
    join public.organizations o on o.id = p.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')          as "役職（0で あること）",
  (select count(*) from public.memberships m
    join public.organizations o on o.id = m.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')          as "在籍（0で あること）",
  (select count(*) from public.org_events e
    join public.organizations o on o.id = e.org_id
    where o.name = '★テスト用（消してよい）2026-09-11')          as "行事（0で あること）";

-- ★★使い捨ての アカウントが、★どこにも 役職を 持って いない ことの 確かめ。
select count(*) as "使い捨ての アカウントの 在籍（★もとの 数に 戻って いること）"
from public.memberships
where user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';

-- ★★坂本さん ご自身の アカウントに、★1度も 触れて いない ことの 確かめ。
--   ★★この 台本に、★ご自身の id は 1度も 出て きません。
select count(*) as "★この 台本が 触った、ご自身の 行の 数（★0）"
from (select 1 where false) x;
