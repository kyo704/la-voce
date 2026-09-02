-- ============================================================================
-- ★全体の棚卸し（2026-09-02・調べるだけ。書き込みは1つもありません）
--
--   今日3つの失敗の形が出ました。同じ形が★ほかの表にも無いかを、
--   表を絞らずに全部見ます。
--     ① 「(列 IS NULL) OR …」で素通りするポリシー（lessons で実在）
--     ② RLS が有効なのに、ポリシーが0本の表
--     ③ auth.users を指す外部キーで、退会の一覧に入っていないもの
--
--   ★service_role（SQL Editor の既定）で構いません。ここは事実を数えるだけです。
--     「見えるか」を試すときだけ、なりすましが要ります（このファイルには
--     入っていません。check_owner_role_protection.sql をお使いください）。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① ★「(列 IS NULL) OR …」の形（lessons で実在した素通り）
--
--   ★PERMISSIVE は OR で足されます。左が真になると、右は一度も見られません。
--     lessons では「org_id が null の行は誰でも見られる」になっていました。
-- ---------------------------------------------------------------------------
select tablename as "表", policyname as "ポリシー", cmd as "操作",
       permissive as "種別", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public'
   and (coalesce(qual::text, '')       ~* '\( *\w+ +IS +NULL *\) +OR'
     or coalesce(with_check::text, '') ~* '\( *\w+ +IS +NULL *\) +OR')
 order by 1, 2;
-- ★0行であること。

-- ①-2 もう少し広く：IS NULL が OR の左側に出てくるもの全部
select tablename as "表", policyname as "ポリシー", cmd as "操作",
       qual as "USING"
  from pg_policies
 where schemaname = 'public'
   and (coalesce(qual::text, '') ~* 'IS +NULL[^)]*\) *OR'
     or coalesce(qual::text, '') ~* 'OR[^)]*IS +NULL')
 order by 1, 2;
-- ★出た行は、1つずつ意味を確かめてください（自動では判定できません）。

-- ---------------------------------------------------------------------------
-- ② RLS が有効なのに、ポリシーが0本の表
--     ★account_deletions は、そう作ってあります（時刻しか持たない表）。
--       それ以外が出たら、確かめてください。
-- ---------------------------------------------------------------------------
select c.relname as "表",
       case when c.relforcerowsecurity then 'FORCE' else '有効' end as "RLS"
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
   and not exists (select 1 from pg_policies p
                    where p.schemaname = 'public' and p.tablename = c.relname)
 order by 1;

-- ②-2 ★逆も見ます：RLS が★無効な表（ポリシーがあっても効きません）
select c.relname as "★RLS が無効な表"
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
 order by 1;

-- ---------------------------------------------------------------------------
-- ③ auth.users を指す外部キーの★全部（規則つき）
--
--   confdeltype:  a=NO ACTION  r=RESTRICT  c=CASCADE  n=SET NULL  d=SET DEFAULT
--
--   ★2026-09-01 の棚卸しは「NO ACTION の一覧に出るか」しか見ていません。
--     出てこなかった列を「CASCADE だろう」と書き、実際は確かめていませんでした
--     （assignments.teacher_id）。今回は★全部の規則を出します。
-- ---------------------------------------------------------------------------
select c.conrelid::regclass::text as "表",
       a.attname                  as "列",
       c.confdeltype              as "削除時",
       case c.confdeltype
         when 'a' then '★NO ACTION（退会を止めます）'
         when 'r' then '★RESTRICT（退会を止めます）'
         when 'c' then 'CASCADE'
         when 'n' then 'SET NULL'
         when 'd' then 'SET DEFAULT' end as "意味",
       col.is_nullable            as "null にできるか"
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  join unnest(c.conkey) with ordinality as k(attnum, ord) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
  left join information_schema.columns col
         on col.table_schema = n.nspname and col.table_name = t.relname
        and col.column_name = a.attname
 where c.contype = 'f' and c.confrelid = 'auth.users'::regclass
   and n.nspname = 'public'
 order by 1, 2;

-- ③-2 ★退会を止める側だけ（この一覧が、コードの3つの表と一致すること）
--
--   コード側（lib/accountDeletion.js）
--     USER_OWNED_TABLES  … user_id で消す
--     SPECIAL_DELETES    … 別の列で消す
--     NULLED_REFERENCES  … 行は残し、列を null にする（★null 可の列だけ）
select c.conrelid::regclass::text as "表", a.attname as "列",
       case c.confdeltype when 'a' then 'NO ACTION' else 'RESTRICT' end as "規則",
       col.is_nullable as "★null にできるか"
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  join unnest(c.conkey) with ordinality as k(attnum, ord) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
  left join information_schema.columns col
         on col.table_schema = n.nspname and col.table_name = t.relname
        and col.column_name = a.attname
 where c.contype = 'f' and c.confrelid = 'auth.users'::regclass
   and n.nspname = 'public' and c.confdeltype in ('a','r')
 order by 1, 2;
-- ★ここに出た列は、すべてコードの3つの一覧のどれかに入っていなければなりません。
-- ★null 可でない列を NULLED_REFERENCES に入れてはいけません
--   （更新が失敗し、退会がその手前で止まります。2026-09-02 に1度やりました）。

-- ---------------------------------------------------------------------------
-- ④ ★今日作った表を、名指しで
-- ---------------------------------------------------------------------------
select tablename as "表", policyname as "ポリシー", cmd as "操作",
       permissive as "種別", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public'
   and tablename in ('org_events','org_event_participants','link_consents',
                     'memberships','organizations','enrollments','assignments',
                     'org_invitations','teacher_notes')
 order by 1, cmd, 2;

-- ---------------------------------------------------------------------------
-- ⑤ ★SECURITY DEFINER の関数（RLS を素通りします）
-- ---------------------------------------------------------------------------
select p.proname as "関数", pg_get_function_identity_arguments(p.oid) as "引数",
       case when p.proconfig is null then '★search_path の指定なし' else 'search_path あり' end as "注意"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosecdef
 order by 1;
-- ★search_path の指定が無い SECURITY DEFINER は、乗っ取りの余地があります。

-- ---------------------------------------------------------------------------
-- ⑥ ★anon に開いているテーブル権限
-- ---------------------------------------------------------------------------
select table_name as "表", grantee as "誰に", string_agg(privilege_type, ', ') as "権限"
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee in ('anon')
 group by 1, 2 order by 1;
-- ★anon に SELECT 以上が付いている表は、1つずつ理由を確かめてください。

-- ---------------------------------------------------------------------------
-- ⑦ organizations.created_by（★今日の積み残し）
-- ---------------------------------------------------------------------------
select column_name, is_nullable, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'organizations'
   and column_name = 'created_by';
-- ★is_nullable = NO なら、教室を作った人は★いまも退会できません
--   （NULLED_REFERENCES に入っているため、null 更新が失敗します）。
--   supabase/migration_org_owner_departure.sql を実行してください。
