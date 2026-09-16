-- ★端末（セッション）の 一覧は 取れるか ── ★調べる ためだけ の 問い
--
--   ★出どころ　坂本さん（★2026-09-16・台帳 ㉚ の 引き金）
--
--   ★★これは **読むだけ** です。★1行も 書きません。★1つも 変えません。
--     ★BEGIN / ROLLBACK を 使って いません（★2026-09-15 の 決め）。
--     ★あの とき、★SQL Editor が ROLLBACK を 効かせず、
--     ★坂本さんの お手元に 権限が 残りました。★二度と しません。
--
--   ★Supabase の SQL Editor に そのまま 貼って、★結果を お知らせ ください。

-- ══════════ ① auth.sessions は 在るか。★何を 持って いるか ══════════
select
  c.relname                          as 表の名,
  a.attname                          as 列の名,
  format_type(a.atttypid, a.atttypmod) as かた
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
where n.nspname = 'auth'
  and c.relname in ('sessions', 'refresh_tokens')
order by c.relname, a.attnum;

-- ══════════ ② いま 何行 あるか（★中身は 見ません。★数だけ）══════════
select 'auth.sessions' as 表, count(*) as 行 from auth.sessions
union all
select 'auth.refresh_tokens', count(*) from auth.refresh_tokens;

-- ══════════ ③ PostgREST から 見えて いるか（★見えては いけません）══════════
select
  grantee as だれに,
  table_schema || '.' || table_name as なにを,
  privilege_type as なにが
from information_schema.role_table_grants
where table_schema = 'auth'
  and table_name in ('sessions', 'refresh_tokens')
  and grantee in ('anon', 'authenticated', 'service_role', 'public')
order by grantee, table_name;

-- ══════════ ④ いま この 家に、auth を 読む 関数が あるか ══════════
select
  p.proname as 関数,
  p.prosecdef as 持ち主の力で動くか,
  pg_get_function_identity_arguments(p.oid) as ひきすう
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and pg_get_functiondef(p.oid) ilike '%auth.sessions%'
order by p.proname;
