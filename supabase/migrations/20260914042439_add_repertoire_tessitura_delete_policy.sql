-- ★本番の 台帳から 写しました（add_repertoire_tessitura_delete_policy）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


create policy "repertoire_tessitura_delete_own"
  on public.repertoire_tessitura
  for delete
  using (auth.uid() = user_id);

