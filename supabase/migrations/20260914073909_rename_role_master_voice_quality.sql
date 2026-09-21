-- ★本番の 台帳から 写しました（rename_role_master_voice_quality）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


alter table public.role_master
  rename column voice_quality to required_voice_character;

