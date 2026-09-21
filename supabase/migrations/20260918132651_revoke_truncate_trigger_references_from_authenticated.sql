-- ★本番の 台帳から 写しました（revoke_truncate_trigger_references_from_authenticated）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


do $$
declare
  r record;
  n int := 0;
begin
  for r in
    select distinct table_name
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'authenticated'
      and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
  loop
    execute format(
      'revoke truncate, trigger, references on table public.%I from authenticated', r.table_name);
    n := n + 1;
  end loop;
  raise notice '% の表から取り上げました', n;
end $$;

