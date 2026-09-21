-- ★束1 を 戻す（2026-09-22）。★当てる 前の 本番の 形に 戻します。
--   ★★`_a13_policy_backup` は **戻りません**。★中身は
--     docs/records/2026-09-22-_a13_policy_backup-の控え.json に あります。
begin;

revoke all on table public.org_post_perm_log from public, anon, authenticated;
grant select, truncate, trigger, references on table public.org_post_perm_log to authenticated;

revoke all on table public.org_message_drafts from public, anon, authenticated;
grant select, insert, update, delete, truncate, trigger, references
  on table public.org_message_drafts to authenticated;

grant execute on function public.are_connected(uuid, uuid) to anon;
grant execute on function public.is_org_member(uuid, uuid) to anon;
grant execute on function public.can_view_organization(uuid, uuid) to anon;

create or replace function public.can_view_organization(viewer_id uuid, p_org_id uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $function$
  select
    exists (select 1 from memberships where org_id = p_org_id and user_id = viewer_id)
    or exists (select 1 from enrollments
                where org_id = p_org_id and student_id = viewer_id and status = 'active')
    or exists (select 1 from org_invitations
                where org_id = p_org_id and used_at is null and expires_at > now())
$function$;
grant execute on function public.can_view_organization(uuid, uuid) to anon, authenticated;

commit;
