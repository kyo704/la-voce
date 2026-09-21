-- ★本番の 台帳から 写しました（no018_step1_drop_dead_update_policy）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


drop policy "Students can mark invitation as used" on public.teacher_invitations;

