-- ★★★土台 ── 拡張と 既定の 権限
-- ★裁定175 ㋐。★2026-09-23 の 本番（xxjtplvpcneksrofkjmf）の 形を 機械で 書き出した もの。
-- ★★本番には 当てません。★「すでに 当たって いる」と 記録するだけ です。

-- ★★★1 拡張
create extension if not exists "pg_stat_statements" with schema extensions;
create extension if not exists "pg_trgm" with schema public;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "supabase_vault" with schema vault;
create extension if not exists "uuid-ossp" with schema extensions;

-- ★★★2 スキーマの 権限
grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant create on schema public to pg_database_owner;
grant usage on schema public to pg_database_owner;
grant usage on schema public to postgres;
grant usage on schema public to public;
grant usage on schema public to service_role;

-- ★★★3 これから 作る ものの 既定の 権限
--   ★★anon が 入って いません。★本番で 外されて います。
--   ★★新しい 入れ物の 出来たては anon が **入って います**。★ここで 外します。
--   ★★supabase_admin の ぶんは 書きません。★postgres からは 変えられません（★元から 同じ）。
--   ★★★ここが 抜けると、★あとの 47本が 作る 表に anon が 付いて しまいます。
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public grant all on sequences to authenticated;
alter default privileges for role postgres in schema public grant all on sequences to postgres;
alter default privileges for role postgres in schema public grant all on sequences to service_role;
alter default privileges for role postgres in schema public revoke all on functions from anon;
alter default privileges for role postgres in schema public grant all on functions to authenticated;
alter default privileges for role postgres in schema public grant all on functions to postgres;
alter default privileges for role postgres in schema public grant all on functions to service_role;
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public grant all on tables to authenticated;
alter default privileges for role postgres in schema public grant all on tables to postgres;
alter default privileges for role postgres in schema public grant all on tables to service_role;
