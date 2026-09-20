-- ============================================================================
-- ★契約者（★裁定 その116・2026-09-20）
--
--   ★★★「できこと」と「契約上の 立場」は 別の もの です（★裁定 その115 Q2）。
--     ★できこと … ★学校が 決めます。★誰にでも 渡せます。
--     ★契約者 …… ★学校が 決める ものでは ありません。★契約が 決めます。
--   ★★★だから `has_can(org,'owner')` の 形に しません。
--     ★★できことの 一覧に `owner` が 並ぶと、★渡せる ように 見えます。
--
--   ★★★1つの 学校に 1人 です。★列を 1つ 置きます。
--     ★★`org_billing.atesaki`（ご請求の 宛先）とは **別** です。
--
--   ★★★移した 記録は 消せません（★`org_billing_log` と 同じ 形）。
--     ★★`update` も `delete` も 渡しません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

alter table public.organizations
  add column if not exists contract_owner_user_id uuid references auth.users(id);

-- ★★はじめの 契約者 ── ★作った 方（`created_by`）です。
--   ★★★上書きしません。★空の ときだけ 入れます。
update public.organizations
   set contract_owner_user_id = created_by
 where contract_owner_user_id is null
   and created_by is not null;

-- ---------------------------------------------------------------------------
-- ★移した 記録（★消せません）
-- ---------------------------------------------------------------------------
create table if not exists public.contract_owner_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  from_user_id uuid,
  to_user_id uuid not null,
  changed_at timestamptz not null default now(),
  changed_by uuid not null
);

create index if not exists contract_owner_log_org_idx
  on public.contract_owner_log (org_id, changed_at desc);

alter table public.contract_owner_log enable row level security;

do $$
begin
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='contract_owner_log' and p.polname='contract_owner_log_select') then
    create policy contract_owner_log_select on public.contract_owner_log
      for select using (
        exists (select 1 from public.memberships m
                where m.org_id = contract_owner_log.org_id and m.user_id = auth.uid())
      );
  end if;
end $$;

-- ★★★先に 取り上げてから、★読む ことだけ を 渡します。
--   ★★書くのは 道（`transfer_contract_owner`）だけ です。
revoke all on table public.contract_owner_log from public, anon, authenticated;
grant select on table public.contract_owner_log to authenticated;

-- ---------------------------------------------------------------------------
-- ★引き継ぐ 道（★裁定 その74B と 同じ 形 ── ★承諾を 待ちません）
-- ---------------------------------------------------------------------------
create or replace function public.transfer_contract_owner(
  p_org_id uuid,
  p_to_user_id uuid
) returns table (ok boolean, reason text)
language plpgsql volatile security definer set search_path to 'public'
as $$
declare
  v_now uuid;
begin
  if auth.uid() is null then
    return query select false, 'NOT_AUTHENTICATED';
    return;
  end if;

  select o.contract_owner_user_id into v_now
    from organizations o where o.id = p_org_id;

  -- ★★指名できるのは、★いまの 契約者 だけ です。
  if v_now is null or v_now <> auth.uid() then
    return query select false, 'NOT_CONTRACT_OWNER';
    return;
  end if;

  -- ★★相手は、★その 学校に 居て、★`master` を 持つ 方 だけ です。
  --   ★★契約を 引き継ぐ 以上、★学校 ぜんぶを 扱える 必要が あります。
  if not exists (select 1 from memberships m
                 where m.org_id = p_org_id and m.user_id = p_to_user_id) then
    return query select false, 'NOT_A_MEMBER';
    return;
  end if;
  if not public.has_can_user(p_to_user_id, p_org_id, 'master') then
    return query select false, 'NO_MASTER';
    return;
  end if;

  update organizations
     set contract_owner_user_id = p_to_user_id
   where id = p_org_id;

  insert into contract_owner_log (org_id, from_user_id, to_user_id, changed_by)
  values (p_org_id, v_now, p_to_user_id, auth.uid());

  -- ★★移された 方に 1行 お伝えします（★閉じられません・1度だけ）。
  --   ★★`user_notices` は `notice_key` と `shown_at` の 表 です。
  --     ★★字は 画面が 持ちます（★`lib/orgContract.js`）。★ここでは 鍵 だけ。
  --   ★★★鍵に 学校の 番号を 入れます。★学校ごとに 1度 です。
  begin
    insert into user_notices (user_id, notice_key)
    values (p_to_user_id, 'contract_owner:' || p_org_id::text);
  exception
    when others then
      raise warning 'CONTRACT_OWNER_NOTICE_NOT_SENT: %', sqlerrm;
  end;

  return query select true, ''::text;
end;
$$;

revoke all on function public.transfer_contract_owner(uuid, uuid) from public, anon;
grant execute on function public.transfer_contract_owner(uuid, uuid) to authenticated;
