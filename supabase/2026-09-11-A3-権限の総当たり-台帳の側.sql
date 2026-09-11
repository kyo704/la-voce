-- ============================================================================
-- A3　権限の 総当たり ── ★台帳の 側（★残り半分）
--
--   ★出どころ Woolsong 総合評価（Opus・9月10日）§2
--     「職員が 名簿を 書き出せた 事故は、★これが あれば 当日に 出ていた」
--   ★台帳-保留していること A3
--
--   ★★画面の 側は、★機械で 回して います
--     （components/tests/ops-matrix.test.js ／ docs/reports/_ops-matrix.md）。
--   ★★けれど、★あの 事故は **台帳の 側**の 穴でした。
--     ★★画面を 隠しても、★台帳が 許して いれば 書き出せます。
--     ★★私に 台帳を 読む 手が ありません。★だから、★ここに 書きます。
--
--   ★★この SQL は **読むだけ**です。★1行も 書き換えません。
--     ★★結果を そのまま お送りください。★画面の 表と 突き合わせます。
--
--   ★実行　Supabase の SQL Editor に、★このまま 貼って ください。
-- ============================================================================

-- ── ① 運営の 表に、★anon／authenticated が 何を 持って いるか
--    ★★anon（★ログインして いない 人）に 1つでも あれば、★それは 穴です。
select
  table_name    as "表",
  grantee       as "だれに",
  privilege_type as "できること",
  case when column_name is null then '（表 ぜんぶ）' else column_name end as "列"
from information_schema.column_privileges
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'organizations', 'memberships', 'org_posts', 'lessons', 'enrollments',
    'assignments', 'org_invitations', 'teacher_student_links', 'teacher_notes',
    'events', 'org_events', 'profiles', 'entries'
  )
order by table_name, grantee, privilege_type, column_name

union all

select
  table_name, grantee, privilege_type, '（表 ぜんぶ）'
from information_schema.table_privileges
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'organizations', 'memberships', 'org_posts', 'lessons', 'enrollments',
    'assignments', 'org_invitations', 'teacher_student_links', 'teacher_notes',
    'events', 'org_events', 'profiles', 'entries'
  )
order by 1, 2, 3, 4;


-- ── ② 行の 決まり（RLS）が 付いて いるか
--    ★★rls が false の 表が あれば、★そこは 誰でも 読めます。
select
  c.relname                              as "表",
  c.relrowsecurity                       as "行の 決まりが 効いて いるか",
  c.relforcerowsecurity                  as "持ち主にも 効かせて いるか",
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as "決まりの 数"
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and c.relname in (
    'organizations', 'memberships', 'org_posts', 'lessons', 'enrollments',
    'assignments', 'org_invitations', 'teacher_student_links', 'teacher_notes',
    'events', 'org_events', 'profiles', 'entries'
  )
order by c.relname;


-- ── ③ 決まりの 中身
--    ★★「役職の 名前」で 書いて ある ものが あれば、★それは 誤りです。
--      ★引き継ぎ「画面の 出し分けは 権限から 導いてください。
--      　　　　　　役職名で 分岐しないでください」── ★台帳も 同じです。
select
  tablename  as "表",
  policyname as "決まりの 名前",
  cmd        as "いつ",
  roles      as "だれに",
  qual       as "読むときの 条件",
  with_check as "書くときの 条件"
from pg_policies
where schemaname = 'public'
  and tablename in (
    'organizations', 'memberships', 'org_posts', 'lessons', 'enrollments',
    'assignments', 'org_invitations', 'teacher_student_links', 'teacher_notes',
    'events', 'org_events'
  )
order by tablename, cmd, policyname;


-- ── ④ ★いちばん 大事な 1つ ── 名簿を 書き出せるか
--    ★★事故の 形　「職員が 名簿を 書き出せた」
--    ★★memberships と profiles を、★どの 決まりが 許して いるか。
select
  tablename  as "表",
  policyname as "決まりの 名前",
  cmd        as "いつ",
  qual       as "読むときの 条件"
from pg_policies
where schemaname = 'public'
  and tablename in ('memberships', 'profiles')
  and cmd in ('SELECT', 'ALL')
order by tablename, policyname;


-- ── ⑤ SECURITY DEFINER の 関数（★決まりを 飛び越えます）
--    ★★1つ ずつ、★何を 許して いるか 確かめる 要が あります。
select
  p.proname                        as "関数",
  pg_get_function_identity_arguments(p.oid) as "引数",
  p.prosecdef                      as "決まりを 飛び越えるか"
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by p.proname;
