-- 20260923_37 学校の連絡先（障害の通知の宛先）
-- 背景: 障害時の通知（12時間・1日1回・10営業日）を契約書に書いたが、★宛先が台帳に無い
--   organizations に連絡先の列が無く、org_billing.atesaki_email は NULL（請求の宛先であって、障害の宛先ではない）
-- 決めたこと:
--   ・★用途ごとに分ける（障害・請求・ふだんの連絡）。1つの列に兼ねさせない
--   ・★1学校につき複数持てる（担当者が1人だと、異動・退職・長期休暇で届かなくなる）
--   ・★障害の宛先は必ず1件以上。0件にはできない（契約の約束が守れなくなるため）
--   ・変えられるのは master の札を持つ人だけ（学校ぜんぶにかかることなので）
--   ・★届くかどうかを確かめた日を持つ（未確認の宛先を「通知済み」と数えない）

create table if not exists public.org_contacts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  kind        text not null check (kind in ('incident','billing','general')),
  -- incident=障害の通知 ／ billing=請求 ／ general=ふだんの連絡
  email       text not null check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  name_at     text,                                  -- 担当者の呼び名（役職でもよい。個人名でなくてよい）
  note        text,
  verified_at timestamptz,                           -- ★届くことを確かめた日
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);
create unique index if not exists org_contacts_unique on public.org_contacts(org_id, kind, lower(email));
create index if not exists org_contacts_org_idx on public.org_contacts(org_id, kind);

alter table public.org_contacts enable row level security;
revoke all on public.org_contacts from anon, authenticated;
grant select, insert, update, delete on public.org_contacts to authenticated;

-- ★読む: master か bill（請求の宛先は 請求の担当者にも見えてよい）
drop policy if exists org_contacts_select on public.org_contacts;
create policy org_contacts_select on public.org_contacts for select to authenticated
  using (public.has_can(org_id,'master') or (kind = 'billing' and public.has_can(org_id,'bill')));
-- ★変える: master だけ
drop policy if exists org_contacts_write on public.org_contacts;
create policy org_contacts_write on public.org_contacts for all to authenticated
  using (public.has_can(org_id,'master')) with check (public.has_can(org_id,'master'));

-- ★障害の宛先を 0件にさせない（最後の1件は消せない・用途を変えられない）
create or replace function public.org_contacts_keep_incident()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_org uuid; v_left integer;
begin
  v_org := case when tg_op = 'DELETE' then old.org_id else new.org_id end;
  -- ★★★2026-09-23（Code）── ★学校ごと 閉じる ときは 見ません。
  --   ★★試しの 台帳で 確かめました ── ★この 1行が 無いと
  --     ★`delete from public.organizations` が NEED_ONE_INCIDENT_CONTACT で 止まります。
  --     ★★連鎖で 最後の 1件が 消える とき、★引き金が「0件に なる」と 読む ため です。
  --   ★★★sql/14 が 本番で 起こした 事故と **同じ 形** です（2026-09-23・戻しました）。
  --     ★直し方は Opus ご自身の 字 です（sql/24 ④ `audit_row`）──
  --       「if tg_op = 'DELETE' and … not exists (select 1 from public.organizations …) then return old」
  --   ★★引き金の 中から 親が 見えるか も 確かめました …… ★連鎖の 最中は 0件 でした。
  if tg_op = 'DELETE'
     and not exists (select 1 from public.organizations o where o.id = v_org) then
    return old;
  end if;
  if tg_op = 'DELETE' and old.kind <> 'incident' then return old; end if;
  if tg_op = 'UPDATE' and old.kind <> 'incident' then return new; end if;
  select count(*) into v_left from public.org_contacts c          -- ★security definer の中で数える
   where c.org_id = v_org and c.kind = 'incident'
     and c.id <> case when tg_op='DELETE' then old.id else new.id end;
  if tg_op = 'UPDATE' and new.kind = 'incident' then v_left := v_left + 1; end if;
  if v_left = 0 then
    raise exception 'NEED_ONE_INCIDENT_CONTACT: 障害のお知らせの宛先は、1つ以上 必要です';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.org_contacts_keep_incident() from public, anon, authenticated;
drop trigger if exists org_contacts_keep_incident_trg on public.org_contacts;
create trigger org_contacts_keep_incident_trg before update or delete on public.org_contacts
  for each row execute function public.org_contacts_keep_incident();

-- 通知の宛先を取る（★運営＝サーバだけ。画面からは呼べない）
create or replace function public.incident_recipients(p_org uuid default null)
returns table(org_id uuid, org_name text, email text, verified boolean)
language sql stable security definer set search_path to 'public' as $$
  select c.org_id, o.name, c.email, (c.verified_at is not null)
    from public.org_contacts c join public.organizations o on o.id = c.org_id
   where c.kind = 'incident' and (p_org is null or c.org_id = p_org)
   order by o.name, c.email;
$$;
revoke all on function public.incident_recipients(uuid) from public, anon, authenticated;

-- ★宛先の無い学校を見つける（出発の朝の確認に足す。契約の約束が守れない学校を出す）
create or replace function public.orgs_without_incident_contact()
returns table(org_id uuid, org_name text)
language sql stable security definer set search_path to 'public' as $$
  select o.id, o.name from public.organizations o
   where not exists (select 1 from public.org_contacts c
                      where c.org_id = o.id and c.kind = 'incident')
   order by o.name;
$$;
revoke all on function public.orgs_without_incident_contact() from public, anon, authenticated;

-- 既にある請求の宛先を移す（空でなければ billing として取り込む。★障害の宛先にはしない）
insert into public.org_contacts(org_id, kind, email, name_at, note)
select b.org_id, 'billing', btrim(b.atesaki_email), nullif(btrim(coalesce(b.atesaki_name,'')),''), '請求の宛先から移しました'
  from public.org_billing b
 where coalesce(btrim(b.atesaki_email),'') <> ''
on conflict do nothing;

-- 確かめ（試しの環境で）
-- master の札を持つ人: 3つの用途を足せる／請求の札だけの人: billing だけ見える・変えられない
-- 障害の宛先が1件のとき、それを消す → NEED_ONE_INCIDENT_CONTACT（用途を general に変えるのも同じく止まる）
-- ★退会した人・学校の外の人: 0行（ポリシーは has_can。security definer の中で数えるので、見え方に左右されない）
-- orgs_without_incident_contact(): 宛先の無い学校が並ぶ（★いまの本番は7学校とも並ぶはず）
-- incident_recipients(): 画面から呼ぶと権限エラー
