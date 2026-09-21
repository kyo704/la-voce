-- ★本番の 台帳から 写しました（fix_org_messages_select_self_branches）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


drop policy "org_messages_select" on public.org_messages;

create policy "org_messages_select" on public.org_messages
  as permissive
  for select
  to public
  using (
    (auth.uid() = teacher_id)
    OR (EXISTS (
      SELECT 1 FROM assignments a
      WHERE ((a.org_id = org_messages.org_id)
        AND (a.student_id = auth.uid())
        AND (a.ended_at IS NULL)
        AND ((org_messages.teacher_id IS NULL) OR (a.teacher_id = org_messages.teacher_id)))
    ))
    OR has_can(org_id, 'renraku_all'::text)
  );

