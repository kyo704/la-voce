-- 20260923_50 契約者が退会できない（2026-09-23 に削除の連鎖185本を洗って発見）
-- 見つけたもの:
--   organizations.contract_owner_user_id → auth.users は ★NO ACTION
--   → ★契約者になっている人は 退会できない（データベースが止める）
--   本番: 7学校すべてに契約者が入っている＝★7人が いま退会できない
--   sql/17 で直したのは「NOT NULL × SET NULL」。★これは別の型（NO ACTION）で、17では直っていない
-- 決めたこと:
--   ★契約者が退会するときは、まず 契約者を空にする（学校は残る・裁定172）
--   ★ただし 黙って空にしない。退会の処理が ①引き継ぎを促す ②それでも退会するなら空にする
--   → 台帳は「空にできる」形にし（SET NULL）、誰が契約者だったかは ★記録に残す（org_billing_log）
-- ★17 のあと
-- ★本番で確かめた（2026-09-23）: 7学校すべてに契約者が入っている＝★7人がいま退会できない／
--   外部キーの名前は organizations_contract_owner_user_id_fkey／actor_id() は本番にある

-- ① 連鎖の形を SET NULL にする（列はもともと空を許している）
alter table public.organizations
  drop constraint if exists organizations_contract_owner_user_id_fkey;
alter table public.organizations
  add constraint organizations_contract_owner_user_id_fkey
  foreign key (contract_owner_user_id) references auth.users(id) on delete set null;

-- ② 契約者が外れたことを 記録に残す（★誰が契約者だったかが消えないように）
create or replace function public.log_contract_owner_cleared()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if old.contract_owner_user_id is not null and new.contract_owner_user_id is null then
    -- ★本番で確かめた列: id・org_id・actor_id・what・created_at・org_name_at（note は無い）
    insert into public.org_billing_log(org_id, actor_id, what, org_name_at)
    values (new.id, public.actor_id(), 'contract_owner_cleared', new.name);
  end if;
  return new;
end $$;
revoke all on function public.log_contract_owner_cleared() from public, anon, authenticated;
drop trigger if exists organizations_log_owner_cleared on public.organizations;
create trigger organizations_log_owner_cleared after update on public.organizations
  for each row execute function public.log_contract_owner_cleared();

-- ③ 契約者がいない学校を 運営が見つけられるようにする（★請求の宛先が消えた状態）
create or replace function public.orgs_without_contract_owner()
returns table(org_id uuid, org_name text, members integer)
language sql stable security definer set search_path to 'public' as $$
  select o.id, o.name, (select count(*)::int from public.memberships m where m.org_id = o.id)
    from public.organizations o
   where o.contract_owner_user_id is null
   order by o.name;
$$;
revoke all on function public.orgs_without_contract_owner() from public, anon, authenticated;

-- 確かめ（試しの環境で）
-- ★契約者になっている人が退会する → 通る（学校は残り、契約者が空になる）
-- 記録: org_billing_log に contract_owner_cleared が1行（★誰が だったかは 残さない）
-- orgs_without_contract_owner() → その学校が並ぶ（★運営が引き継ぎを促す材料）
-- 契約者を 引き継ぐ（transfer_contract_owner）→ いままでどおり
-- ★学校を消す → いままでどおり（この直しで変わらない）

-- ═══════ ★Code に確かめてほしいこと ═══════
-- 退会の処理（画面・サーバ）が、契約者のとき ★引き継ぎを促しているか。
--   促していないなら、★黙って学校が「契約者なし」になる。
--   台帳は通るようになったが、★人に知らせるのは画面の仕事
