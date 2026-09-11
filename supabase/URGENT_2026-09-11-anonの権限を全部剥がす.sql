-- ============================================================================
-- ★★至急　anon（★ログインして いない 人）の 権限を、★public から 剥がす
--
--   ★見つかった こと（★2026-09-11・坂本さん）
--     ★次の 表に、★anon へ **全部**（DELETE・INSERT・REFERENCES・SELECT・
--     ★TRIGGER・TRUNCATE・UPDATE）が 付いて いました。
--       enrollments（在籍）／ events（行事）／ org_invitations（招待）／
--       organizations（組織）／ teacher_notes（先生の メモ）
--
--   ★★いちばん 重いのは teacher_notes と organizations です。
--     ★teacher_notes　★先生が 生徒に ついて 書いた もの
--     ★organizations　★学校そのもの（★TRUNCATE が 付いて います）
--
--   ★★「権限が 付いて いる」ことと「実際に 読める」ことは 別です。
--     ★行の 決まり（RLS）が 効いて いて、★決まりが auth.uid() を 見て いれば、
--       ★anon は auth.uid() が 空なので 1行も 当たりません。
--     ★★RLS が 切れて いれば、★丸ごと 読めます。★消せます。
--   ★★だから ②で 5つ とも 確かめます。★そこが 重さを 決めます。
--     ★どちらでも、★anon の 権限は 要りません。★①で 剥がします。
--
--   ★★なぜ 付いて いたか
--     ★① この 帳面の どの SQL にも、★anon へ 与える 1行は ありません（★0件）。
--     ★② Supabase は はじめから こう 設定されて います ──
--          alter default privileges in schema public
--            grant all on tables to anon, authenticated;
--        ★★SQL Editor で 手で 作った 表に、★作った 瞬間に 付きます。
--     ★③ 5つ とも、★この 帳面に create table が 無い 表です。
--        ★★手で 作られた もの、と 合います。
--   ★★意図した ものでは なく、★既定の まま だった、と 見ます。
--
--   ★★アプリが 壊れないか（★調べた こと）
--     ★★ログインする 前に public の 表を 読む 道は、★1本も ありません。
--       ★公開の ページ（app/page.js ／ signup ／ login）は、
--         ★public の 表を 1つも 読みません。
--       ★api の 入口は、★どれも 先に 人を 確かめます（★getUser）。
--         ★招待の 照会（app/api/org/invitation/lookup）も、★先に 確かめます。
--       ★入会・ログインは auth の 表です。★public では ありません。
--     ★★画面は、★ログイン済み（authenticated）として 動きます。
--       ★★anon を 剥がしても、★1つも 壊れません。
--
--   ★実行　Supabase の SQL Editor に、★このまま 貼って ください。
--   ★★①を 先に 流して ください。★②以降は 確かめです。
-- ============================================================================


-- ===========================================================================
-- ① ★まず 剥がす（★public の 表 ぜんぶ）
--
--   ★★5つだけ 剥がしません。★同じ 既定が 効いて いるなら、
--     ★これから 見つかる 表にも 付いて います。
--   ★★anon は public に 何も 要りません（★上の 調べ）。★だから 全部 剥がします。
--   ★★列ごとの 権限も 剥がします。★表ごとの revoke だけでは 残ります。
-- ===========================================================================
do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p', 'f')
  loop
    execute format('revoke all privileges on public.%I from anon', r.relname);
  end loop;
end $$;

-- ★★列ごとの ぶんも、★名指しで 剥がします。
do $$
declare c record;
begin
  for c in
    select table_name, column_name
    from information_schema.column_privileges
    where table_schema = 'public' and grantee = 'anon'
  loop
    execute format('revoke all (%I) on public.%I from anon',
      c.column_name, c.table_name);
  end loop;
end $$;

-- ★★続き番号（sequence）と 関数も、★ついでに 剥がします。
do $$
declare r record;
begin
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='S'
  loop
    execute format('revoke all on sequence public.%I from anon', r.relname);
  end loop;
end $$;


-- ===========================================================================
-- ② ★これから 作る 表に、★また 付かない ように する（★根の 直し）
--
--   ★★①だけだと、★次に 表を 作った 瞬間に また 付きます。
--     ★★ここを 直さないと、★同じ ことが 何度でも 起きます。
--   ★★すでに ある 表には 効きません。★それは ①で 済ませて います。
-- ===========================================================================
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;

-- ★★作った 人が ちがうと、★既定も 人ごとに 立って います。
--   ★postgres と supabase_admin の ぶんも 消します。
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;
alter default privileges for role postgres in schema public
  revoke all on functions from anon;


-- ===========================================================================
-- ③ ★剥がせたかの 確かめ（★0行で あること）
-- ===========================================================================
select table_name as "表", privilege_type as "できること", count(*) as "列の 数"
from information_schema.column_privileges
where table_schema='public' and grantee='anon'
group by table_name, privilege_type
order by table_name;

select table_name as "表", privilege_type as "できること"
from information_schema.table_privileges
where table_schema='public' and grantee='anon'
order by table_name;


-- ===========================================================================
-- ④ ★どれだけ 危なかったか ── 5つの 表の 行の 決まり（RLS）
--
--   ★★t（効いて いる）… ★決まりが auth.uid() を 見て いれば、
--     ★anon は 1行も 当たりません。★権限は 余計でしたが、★漏れては いません。
--   ★★f（切れて いる）… ★丸ごと 読めて いました。★消せて いました。
--   ★★結果を そのまま お送りください。★重さを ここで 判じます。
-- ===========================================================================
select
  c.relname             as "表",
  c.relrowsecurity      as "行の 決まりが 効いて いるか",
  c.relforcerowsecurity as "持ち主にも 効かせて いるか",
  (select count(*) from pg_policies p
    where p.schemaname='public' and p.tablename=c.relname) as "決まりの 数"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
order by c.relrowsecurity, c.relname;


-- ===========================================================================
-- ⑤ ★決まりの 中身（★5つの 表）
--
--   ★★決まりが あっても、★中身が「true」だけなら 意味が ありません。
--     ★★auth.uid() を 見て いるかを、★目で 確かめて ください。
-- ===========================================================================
select
  tablename  as "表",
  policyname as "決まりの 名前",
  cmd        as "いつ",
  roles      as "だれに",
  qual       as "読むときの 条件",
  with_check as "書くときの 条件"
from pg_policies
where schemaname='public'
  and tablename in ('enrollments','events','org_invitations','organizations','teacher_notes')
order by tablename, cmd, policyname;


-- ===========================================================================
-- ⑥ ★authenticated の ぶんは、★まだ 触りません
--
--   ★★ログイン済みの 方には、★必要な ものが あります。
--     ★れい　enrollments を 画面が 読み書きして います
--       （components/VocalTracker.jsx:11525 ／ 11567 ／ 11803）。
--   ★★だから、★anon と 同じに 扱いません。★別に 数えてから 決めます。
--   ★★下は 読むだけです。★結果を お送りください。
-- ===========================================================================
select table_name as "表", privilege_type as "できること", count(*) as "列の 数"
from information_schema.column_privileges
where table_schema='public' and grantee='authenticated'
  and table_name in ('enrollments','events','org_invitations','organizations','teacher_notes')
group by table_name, privilege_type
order by table_name, privilege_type;
