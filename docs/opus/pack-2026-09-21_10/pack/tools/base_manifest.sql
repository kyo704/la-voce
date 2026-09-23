-- 台帳の姿の「目録」（読み取りだけ）。本番と、作り直した環境の両方で流し、tools/base_manifest_check.py で比べる
-- 数だけでなく、名前の一覧の md5 も出す（1つでも違えば md5 が変わる）
with t as (select relname from pg_class where relnamespace='public'::regnamespace and relkind='r'),
c as (select table_name||'.'||column_name||':'||data_type||':'||is_nullable||':'||coalesce(column_default,'') x
        from information_schema.columns where table_schema='public'),
k as (select conname||':'||pg_get_constraintdef(oid) x from pg_constraint where connamespace='public'::regnamespace),
i as (select indexname||':'||indexdef x from pg_indexes where schemaname='public'),
p as (select tablename||'.'||policyname||':'||cmd||':'||roles::text||':'||coalesce(qual,'')||'#'||coalesce(with_check,'') x
        from pg_policies where schemaname='public'),
f as (select p.proname||'('||pg_get_function_identity_arguments(p.oid)||'):'||md5(pg_get_functiondef(p.oid)) x
        from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.prokind='f' and not exists(select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')),
g as (select table_name||':'||grantee||':'||privilege_type x from information_schema.role_table_grants
       where table_schema='public' and grantee in ('anon','authenticated','service_role')),
cg as (select table_name||':'||column_name||':'||grantee||':'||privilege_type x from information_schema.column_privileges
        where table_schema='public' and grantee in ('anon','authenticated')),
tg as (select tgname||':'||pg_get_triggerdef(oid) x from pg_trigger
        where not tgisinternal and tgrelid in (select oid from pg_class where relnamespace='public'::regnamespace)),
e as (select extname||'@'||n.nspname x from pg_extension ex join pg_namespace n on n.oid=ex.extnamespace),
r as (select relname||':'||relrowsecurity::text||':'||relforcerowsecurity::text x
        from pg_class where relnamespace='public'::regnamespace and relkind='r')
select json_build_object(
 'tables',      json_build_object('n',(select count(*) from t), 'md5',(select md5(string_agg(relname,',' order by relname)) from t)),
 'columns',     json_build_object('n',(select count(*) from c), 'md5',(select md5(string_agg(x,',' order by x)) from c)),
 'constraints', json_build_object('n',(select count(*) from k), 'md5',(select md5(string_agg(x,',' order by x)) from k)),
 'indexes',     json_build_object('n',(select count(*) from i), 'md5',(select md5(string_agg(x,',' order by x)) from i)),
 'policies',    json_build_object('n',(select count(*) from p), 'md5',(select md5(string_agg(x,',' order by x)) from p)),
 'functions',   json_build_object('n',(select count(*) from f), 'md5',(select md5(string_agg(x,',' order by x)) from f)),
 'grants',      json_build_object('n',(select count(*) from g), 'md5',(select md5(string_agg(x,',' order by x)) from g)),
 'column_grants',json_build_object('n',(select count(*) from cg),'md5',(select md5(string_agg(x,',' order by x)) from cg)),
 'triggers',    json_build_object('n',(select count(*) from tg),'md5',(select md5(string_agg(x,',' order by x)) from tg)),
 'extensions',  json_build_object('n',(select count(*) from e), 'md5',(select md5(string_agg(x,',' order by x)) from e)),
 'rls',         json_build_object('n',(select count(*) from r), 'md5',(select md5(string_agg(x,',' order by x)) from r)),
 'table_names', (select json_agg(relname order by relname) from t)
) as manifest;
