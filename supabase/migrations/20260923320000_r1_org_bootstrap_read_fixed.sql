-- ★★★sql/31 R1 の 直し（★2026-09-23・Code）。
--
--   ★★★Opus の 字（★当てて いません）──
--       create policy organizations_select_bootstrap … using (
--         created_by = auth.uid()
--         and not exists (select 1 from public.memberships m where m.org_id = organizations.id))
--
--   ★★★試しの 台帳で 動かして、★穴が **閉じない** ことを 確かめました ──
--       postgres から 見た memberships …… 2
--       抜けた 人から 見た memberships …… 0
--       立ち上げの 枝 ……………………… ★true
--       学校が 見えるか ………………… ★1（★0 の はず）
--
--     ★わけ …… ★決まりの 中の `select … from public.memberships` にも
--       ★**行の 決まり（RLS）が かかります**。
--       ★★抜けた 人には その 学校の 名簿が 1行も 見えません。
--       ★★★だから `not exists` は いつでも true。★決まりは 通って しまいます。
--
--   ★★★直し …… ★数えるのを `security definer` の 関数の 中に 移します。
--     ★これは この 家の いつもの 形 です（★`can_view_organization` と 同じ）。
--     ★Opus も sql/37 で 同じ ことを 書いて います ──
--       「全てのカウント処理を SECURITY DEFINER 関数内で実施」。

-- ① 誰か 名簿に いるか（★呼ぶ 人の 見え方に 左右されない）
create or replace function public.org_has_any_member(p_org_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.memberships m where m.org_id = p_org_id);
$$;
revoke all on function public.org_has_any_member(uuid) from public, anon, authenticated;
grant execute on function public.org_has_any_member(uuid) to authenticated;

-- ② 学校を 作った 直後の 一瞬 だけ、★作った 人に 見せます
--   ★★名簿が 1行でも できたら、★`can_view_organization`（在籍か 名簿）だけ に なります。
drop policy if exists organizations_select_own_created on public.organizations;
drop policy if exists organizations_select_bootstrap on public.organizations;
create policy organizations_select_bootstrap on public.organizations for select to authenticated
  using (created_by = auth.uid() and not public.org_has_any_member(organizations.id));
