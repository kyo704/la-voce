-- 20260923_13 公演に出る子ども（裁定147・167 C）。★画面は出発の後。台帳だけ先に正しく作る
-- 決まり: 子どもは アカウントを 持たない。持ち主は 保護者。運営に見えるのは 呼び名・配役・出欠・集合と解散だけ
--        緊急の連絡先は 表を 直接 読ませない。RPC が 記録を 書いてから 返す（fail closed。裁定159 の型）

create table if not exists public.koen_kids (
  id                uuid primary key default gen_random_uuid(),
  koen_id           uuid not null references public.koen(id) on delete cascade,
  guardian_user_id  uuid not null references auth.users(id) on delete cascade,   -- 持ち主は保護者
  nickname          text not null check (length(nickname) between 1 and 20),     -- 呼び名だけ。年齢・学校・写真は持たない
  dismiss_at        timestamptz,                                                 -- 解散の時刻（当日の運びに使う）
  created_at        timestamptz not null default now(),
  left_at           timestamptz
);
create index if not exists koen_kids_koen_idx on public.koen_kids(koen_id) where left_at is null;

-- 緊急の連絡先は別の表。★select のポリシーを作らない（誰も直接は読めない）
create table if not exists public.koen_kid_contacts (
  kid_id     uuid primary key references public.koen_kids(id) on delete cascade,
  contact    text not null check (length(contact) between 1 and 120),
  updated_at timestamptz not null default now()
);

-- 見た記録（消せない）。保護者には「いつ・どの役割が見たか」だけ見せる（名前は出さない）
create table if not exists public.koen_kid_contact_reads (
  id           uuid primary key default gen_random_uuid(),
  kid_id       uuid not null references public.koen_kids(id) on delete cascade,
  koen_id      uuid not null references public.koen(id) on delete cascade,
  viewer_user_id uuid references auth.users(id) on delete set null,   -- 退会しても記録は残す
  viewer_role_at text not null,                                       -- 「運営」「主催」など。名前は残さない
  reason_kind  text not null check (reason_kind in ('todays_call','emergency','guardian_request')),
  viewed_at    timestamptz not null default now()
);

alter table public.koen_kids               enable row level security;
alter table public.koen_kid_contacts       enable row level security;
alter table public.koen_kid_contact_reads  enable row level security;
revoke all on public.koen_kids, public.koen_kid_contacts, public.koen_kid_contact_reads from anon, authenticated;
grant select, insert, update on public.koen_kids to authenticated;
grant select on public.koen_kid_contact_reads to authenticated;
-- koen_kid_contacts には 権限を 渡さない（RPC だけ）

-- 保護者は自分の子どもを出せる。運営は呼び名と解散の時刻だけ見える
drop policy if exists koen_kids_guardian on public.koen_kids;
create policy koen_kids_guardian on public.koen_kids for all to authenticated
  using (guardian_user_id = auth.uid())
  with check (guardian_user_id = auth.uid() and public.koen_can_see(koen_id));
drop policy if exists koen_kids_staff_select on public.koen_kids;
create policy koen_kids_staff_select on public.koen_kids for select to authenticated
  using (public.koen_can_manage(koen_id));

-- 保護者は「いつ・どの役割が見たか」だけ。運営は自分が見た記録だけ
drop policy if exists koen_kid_reads_select on public.koen_kid_contact_reads;
create policy koen_kid_reads_select on public.koen_kid_contact_reads for select to authenticated using (
  exists (select 1 from public.koen_kids k where k.id = koen_kid_contact_reads.kid_id and k.guardian_user_id = auth.uid())
  or viewer_user_id = auth.uid()
);

-- 緊急の連絡先を書く（保護者だけ）
create or replace function public.set_kid_contact(p_kid uuid, p_contact text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from public.koen_kids k where k.id = p_kid and k.guardian_user_id = auth.uid()) then
    raise exception 'NOT_GUARDIAN';
  end if;
  insert into public.koen_kid_contacts(kid_id, contact) values (p_kid, btrim(p_contact))
    on conflict (kid_id) do update set contact = excluded.contact, updated_at = now();
end $$;
revoke all on function public.set_kid_contact(uuid, text) from public, anon;
grant execute on function public.set_kid_contact(uuid, text) to authenticated;

-- ★読むのは この関数だけ。記録を 先に 書き、書けたら 返す（書けなければ 返さない）
create or replace function public.read_kid_contact(p_kid uuid, p_reason_kind text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare v_koen uuid; v_role text; v_contact text; v_show_on date;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_reason_kind is null or p_reason_kind not in ('todays_call','emergency','guardian_request') then
    raise exception 'REASON_REQUIRED';
  end if;
  select k.koen_id into v_koen from public.koen_kids k where k.id = p_kid and k.left_at is null;
  if v_koen is null then raise exception 'NO_SUCH_KID'; end if;
  if not public.koen_can_manage(v_koen) then raise exception 'NOT_STAFF'; end if;

  -- 当日だけ（本番・集合の日）。緊急と 保護者からの求め は いつでも
  if p_reason_kind = 'todays_call' then
    select min(s.starts_at::date) into v_show_on from public.koen_sessions s
     where s.koen_id = v_koen and s.kind in ('call','show') and s.canceled_at is null
       and s.starts_at::date = (now() at time zone 'Asia/Tokyo')::date;
    if v_show_on is null then raise exception 'NOT_TODAY'; end if;
  end if;

  select case when k.org_id is not null then '運営' else '主催' end into v_role from public.koen k where k.id = v_koen;

  insert into public.koen_kid_contact_reads(kid_id, koen_id, viewer_user_id, viewer_role_at, reason_kind)
  values (p_kid, v_koen, auth.uid(), v_role, p_reason_kind);       -- ★先に記録。失敗したらここで止まり、下は返らない

  select c.contact into v_contact from public.koen_kid_contacts c where c.kid_id = p_kid;
  return v_contact;
end $$;
revoke all on function public.read_kid_contact(uuid, text) from public, anon;
grant execute on function public.read_kid_contact(uuid, text) to authenticated;

-- 確かめ（実在の試しの利用者で）
-- 保護者: 自分の子どもを出せる・呼び名を直せる／ほかの保護者の子どもは0行
-- 運営: 呼び名と解散の時刻は見える／koen_kid_contacts を直接 select → 権限エラー（0行ではなく、そもそも読めない）
-- 運営: read_kid_contact（当日でない・todays_call）→ NOT_TODAY／当日 → 返る・記録が1行増える
-- 関係のない人: read_kid_contact → NOT_STAFF
-- 保護者: koen_kid_contact_reads に「いつ・どの役割」だけ見える（名前の列が無い）
-- 記録の update・delete のポリシーが無いこと／退会しても記録が残る（viewer_user_id が null に）
