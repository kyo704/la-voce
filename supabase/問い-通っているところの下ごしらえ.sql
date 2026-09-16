-- ===========================================================================
-- ★「通っているところ」を 作る 前に、★台帳に 聞く こと
--
--   ★出どころ　坂本さん（★2026-09-16・裁定その68 の PREWORK）
--     「★着手前に enrollments / org_invitations を 台帳に 照会する こと」
--
--   ★なぜ ── ★2026-09-15、★私は `org_invitations` を「生徒の 招待」と
--     取りちがえました。★中身は **講師**の 招待 でした。
--     ★★紙（コード）では そう 読めます。★けれど 紙は 証拠に なりません。
--
--   ★★これは **読むだけ** です。★1行も 書きません。★1つも 変えません。
--     ★`BEGIN` / `ROLLBACK` を 使って いません（★2026-09-15 の 決め ──
--      ★SQL Editor が ROLLBACK を 効かせず、権限が 残った ことが あります）。
--
--   ★Supabase の SQL Editor に そのまま 貼って、★結果を お知らせ ください。
-- ===========================================================================

-- ══════════ ① どんな 列を 持って いるか ══════════
select
  c.relname                            as 表の名,
  a.attname                            as 列の名,
  format_type(a.atttypid, a.atttypmod) as かた,
  a.attnotnull                         as 必須か
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
where n.nspname = 'public'
  and c.relname in ('enrollments', 'org_invitations', 'teacher_invitations',
                    'memberships', 'organizations')
order by c.relname, a.attnum;

-- ══════════ ② 誰あての 招待か（★取りちがえの 元） ══════════
--   ★`org_invitations.role` に 何が 入って いるか。
--   ★中身を 見ます。★名前では 分かりません。
select 'org_invitations' as 表, role as 役, count(*) as 件
from public.org_invitations group by role
union all
select 'memberships', role, count(*)
from public.memberships group by role
order by 1, 2;

-- ══════════ ③ 生徒の 在籍は どう 入って いるか ══════════
select status as 状態, count(*) as 件 from public.enrollments group by status;

-- ══════════ ④ 決まり（RLS）── ★生徒が 自分の 行を 読めるか ══════════
select
  c.relname                       as 表の名,
  c.relrowsecurity                as RLSが立っているか,
  c.relforcerowsecurity           as 持ち主にもかかるか,
  p.polname                       as 決まりの名,
  p.polcmd                        as どの操作,
  pg_get_expr(p.polqual, p.polrelid)      as 読む条件,
  pg_get_expr(p.polwithcheck, p.polrelid) as 書く条件
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in ('enrollments', 'org_invitations', 'teacher_invitations',
                    'memberships', 'organizations')
order by c.relname, p.polname;

-- ══════════ ⑤ 誰に 何が 許されて いるか ══════════
select
  table_name as 表の名, grantee as だれに, privilege_type as なにが
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('enrollments', 'org_invitations', 'teacher_invitations',
                     'memberships', 'organizations')
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;

-- ══════════ ⑥ 合言葉は どの 表に あるか ══════════
--   ★見本の「合言葉で 入る」は **6文字**です。
--   ★`org_invitations.code` と `teacher_invitations.code` の どちらか、
--     ★あるいは 両方か。★長さも 見ます。
select 'org_invitations' as 表, length(code) as 文字数, count(*) as 件
from public.org_invitations where code is not null group by length(code)
union all
select 'teacher_invitations', length(code), count(*)
from public.teacher_invitations where code is not null group by length(code)
order by 1, 2;
