-- ★本番の 台帳から 写しました（no018_drop_open_invitation_lookup_policy）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。

-- No.018 第3段
-- 「誰でも未使用の招待コードを引ける」決まりを落とす
-- 読みは get_invitation_teacher（SECURITY DEFINER）へ移行済み
drop policy if exists "Anyone can look up an unused invitation by code"
  on public.teacher_invitations;
