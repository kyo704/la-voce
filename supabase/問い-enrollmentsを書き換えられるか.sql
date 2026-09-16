-- ★生徒は、★自分の 在籍を「やめる」に できますか（★読むだけ）
--
--   ★出どころ　坂本さんの 実機の ご報告（★2026-09-16）──
--     「やめるを 押した あと、★一覧に その 教室が まだ 出て いる」
--
--   ★見立て ── ★書き換えの 決まり（UPDATE の policy）が 無いのでは。
--     ★★決まりが 無い と、★0行に 当たります。
--     ★★PostgREST は 誤りを 返しません。★「0行 直した」と 返します。
--     ★★だから 画面は 黙って 戻り、★やめた つもりに なります。
--
--   ★★紙では 結びません。★台帳に 聞きます。
--   ★BEGIN / ROLLBACK は 使って いません。

-- ══════════ ① enrollments の 決まりを ぜんぶ ══════════
select
  p.polname                                as 決まりの名,
  case p.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
                when 'w' then 'UPDATE' when 'd' then 'DELETE'
                when '*' then 'ALL' else p.polcmd::text end as どの操作,
  pg_get_expr(p.polqual, p.polrelid)       as 読む条件,
  pg_get_expr(p.polwithcheck, p.polrelid)  as 書く条件
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'enrollments'
order by p.polname;

-- ══════════ ② 表ごとの 許し ══════════
select grantee as だれに, privilege_type as なにが
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'enrollments'
  and grantee in ('anon', 'authenticated', 'service_role')
order by grantee, privilege_type;

-- ══════════ ③ 列ごとの 許し（★status を 書けるか）══════════
select grantee as だれに, column_name as どの列, privilege_type as なにが
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'enrollments'
  and grantee in ('anon', 'authenticated')
order by grantee, column_name;

-- ══════════ ④ いまの 中身（★やめた 行が あるか）══════════
select status as 状態, count(*) as 件 from public.enrollments group by status;
