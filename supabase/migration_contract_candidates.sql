-- ============================================================================
-- ★引き継げる 方を 返す 道（★裁定 その116・2026-09-20）
--
--   ★★★手元で 見つけました ── ★契約者の 画面が
--     ★「この学校に、引き継げる方が いません」と 出ました。
--     ★★台帳には 居ました（★`master` を 持つ 方が 1人）。
--   ★★★わけ ── ★`memberships` の 決まりは
--     ★`auth.uid() = user_id` **または** `has_can(org,'post')` です。
--     ★★契約者が `post`（役職を 直す）を 持って いなければ、
--       ★★ご自分の 1行 しか 読めません。★候補は 0人に 見えます。
--   ★★★「居ない」と「読めない」を 取り違えて いました。★きょう 3件目 です。
--
--   ★★決まりを 緩めません。★道を 1本 立てます。
--     ★★返すのは、★お名前と 番号 だけ です。★役職の 中身は 返しません。
--     ★★呼べるのは、★その 学校の **契約者 ご本人** だけ です。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create or replace function public.get_contract_candidates(p_org_id uuid)
returns table (user_id uuid, display_name text)
language sql stable security definer set search_path to 'public'
as $$
  select m.user_id,
         nullif(btrim(coalesce(p.display_name, '')), '') as display_name
    from memberships m
    left join profiles p on p.id = m.user_id
   where m.org_id = p_org_id
     and m.user_id <> auth.uid()
     and public.has_can_user(m.user_id, p_org_id, 'master')
     and exists (select 1 from organizations o
                 where o.id = p_org_id and o.contract_owner_user_id = auth.uid())
$$;

comment on function public.get_contract_candidates(uuid) is
  '契約を 引き継げる 方（master を 持つ 在籍者）を 返す。'
  '呼べるのは その 学校の 契約者 だけ。裁定その116・2026-09-20。';

revoke all on function public.get_contract_candidates(uuid) from public, anon;
grant execute on function public.get_contract_candidates(uuid) to authenticated;
