-- スキーマの写し（tools/sql_schema_check.py が読む形）
-- 使い方: psql "$DB" -At -F'|' -f tools/sql_schema_dump.sql > tools/schema_snapshot.txt
select c.table_name || '|' || string_agg(c.column_name, '|' order by c.ordinal_position)
  from information_schema.columns c
 where c.table_schema = 'public'
 group by c.table_name
union all
-- ★CHECK に列挙された値（status = ANY (ARRAY['a','b'])）を 取り出す
select t.relname || '|@' || a.attname || '|' ||
       -- ★regexp_matches は ★text[] を返すので、★m.x[1] を取る
       --   （2026-09-23 差し戻し: string_agg(text[]) は 動きません）
       (select string_agg(m.x[1], ',') from regexp_matches(pg_get_constraintdef(co.oid), '''([^'']+)''', 'g') as m(x))
  from pg_constraint co
  join pg_class t on t.oid = co.conrelid
  join unnest(co.conkey) k(attnum) on true
  join pg_attribute a on a.attrelid = co.conrelid and a.attnum = k.attnum
 where co.contype = 'c' and co.connamespace = 'public'::regnamespace
   and pg_get_constraintdef(co.oid) like '%ANY (ARRAY%';
