-- ★本番の 台帳から 写しました（no017_tighten_org_invitations_policies）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。

-- No.017 招待の決まりを締める
-- 2026-09-14 Opus
-- 1) roles を public から authenticated へ（匿名の鍵を締め出す）
-- 2) SELECT の右枝（org_id の縛りが無い枝）を落とす
-- 3) UPDATE に has_can(org_id,'meibo') を付ける（乗っ取り・妨害を塞ぐ）
-- 参加の処理は service role で RLS を越えるため影響を受けない

drop policy if exists org_invitations_select on public.org_invitations;
create policy org_invitations_select on public.org_invitations
  for select to authenticated
  using ( has_can(org_id, 'meibo') );

drop policy if exists org_invitations_update on public.org_invitations;
create policy org_invitations_update on public.org_invitations
  for update to authenticated
  using      ( has_can(org_id, 'meibo') )
  with check ( has_can(org_id, 'meibo') );

drop policy if exists org_invitations_insert on public.org_invitations;
create policy org_invitations_insert on public.org_invitations
  for insert to authenticated
  with check ( has_can(org_id, 'meibo') );
