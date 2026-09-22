-- 台帳の目録（読み取りだけ）。Opus が Supabase に直接つないで、本番・試しの両方で流す
-- 出力の JSON を tools/ledger_snapshots/<日付>_<prod|test>.json に保存し、ledger_inventory.py で比べる
select json_build_object(
 'functions',(select json_object_agg(p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',
     json_build_object('h',left(md5(pg_get_functiondef(p.oid)),10),'sd',p.prosecdef,'anon',has_function_privilege('anon',p.oid,'EXECUTE'),'auth',has_function_privilege('authenticated',p.oid,'EXECUTE'),'e',(pg_get_functiondef(p.oid) ~* '\mentries\M')))
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prokind='f' and not exists(select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')),
 'policies',(select json_object_agg(tablename||'.'||policyname, cmd||'|'||roles::text||'|'||left(md5(coalesce(qual,'')||'#'||coalesce(with_check,'')),10)) from pg_policies where schemaname='public'),
 'grants',(select json_object_agg(t,g) from (select table_name t, string_agg(left(grantee,1)||':'||privilege_type,',' order by grantee,privilege_type) g
   from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated') group by table_name) x),
 'table_level_writes',(select json_object_agg(table_name, g) from (select table_name, string_agg(privilege_type,',' order by privilege_type) g
   from information_schema.role_table_grants where table_schema='public' and grantee='authenticated' and privilege_type in ('INSERT','UPDATE') group by table_name) y),
 'log_fks',(select json_object_agg(conname, pg_get_constraintdef(oid)) from pg_constraint
   where contype='f' and connamespace='public'::regnamespace and conrelid::regclass::text like '%\_log'),
 'triggers',(select json_object_agg(tgname, tgrelid::regclass::text) from pg_trigger where not tgisinternal and tgrelid::regclass::text not like '%.%'),
 'migrations',(select json_agg(version||'_'||name order by version) from supabase_migrations.schema_migrations)
) as inv;
