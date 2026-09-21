-- ★束2 を 戻す（2026-09-22）。★当てる 前の 本番の 形に 戻します。
begin;

-- W2 を 戻す
revoke all on table public.org_messages from public, anon, authenticated;
grant select, insert, update on table public.org_messages to authenticated;
drop policy if exists org_messages_withdraw on public.org_messages;
create policy org_messages_withdraw on public.org_messages
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- W1 を 戻す
drop policy if exists applications_update_own on public.applications;
create policy applications_update_own on public.applications
  for update using (auth.uid() = applicant_user_id) with check (auth.uid() = applicant_user_id);

-- A1 を 戻す
grant select, insert, update, delete on table public.character_inventory to authenticated;

-- FX2 を 戻す
grant insert on table public.monka_read_log to authenticated;
create policy monka_read_log_insert_self_monka_read on public.monka_read_log
  for insert
  with check (viewer_user_id = auth.uid() and has_can(org_id, 'monka_read'::text));

commit;
