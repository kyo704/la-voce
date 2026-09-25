-- 20260923_22 ★本番に当たっている 12・13 の直し（2026-09-23 に Opus が見つけた4件のうち、本番に関わる分）
-- 本番の状態（2026-09-23 Opus 確認）: koen ほか 12・13 の表は当たっている。下の3つが 直っていない

-- ① 保護者が退会すると、子どもの枠ごと消える（公演の香盤表から子どもが消える）
alter table public.koen_kids alter column guardian_user_id drop not null;
alter table public.koen_kids drop constraint if exists koen_kids_guardian_user_id_fkey;
alter table public.koen_kids add  constraint koen_kids_guardian_user_id_fkey
  foreign key (guardian_user_id) references auth.users(id) on delete set null;
-- 保護者が居なくなったら、緊急の連絡先は消す
create or replace function public.drop_kid_contact_when_orphan()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.guardian_user_id is null and old.guardian_user_id is not null then
    delete from public.koen_kid_contacts where kid_id = new.id;
  end if;
  return new;
end $$;
revoke all on function public.drop_kid_contact_when_orphan() from public, anon, authenticated;
drop trigger if exists koen_kids_orphan on public.koen_kids;
create trigger koen_kids_orphan after update of guardian_user_id on public.koen_kids
  for each row execute function public.drop_kid_contact_when_orphan();

-- ② 子どもの枠・公演を消すと「緊急の連絡先を見た記録」も消える（★「消せません」の約束に反する）
alter table public.koen_kid_contact_reads add column if not exists kid_name_at   text;
alter table public.koen_kid_contact_reads add column if not exists koen_title_at text;
update public.koen_kid_contact_reads r set kid_name_at = k.nickname from public.koen_kids k where k.id = r.kid_id and r.kid_name_at is null;
update public.koen_kid_contact_reads r set koen_title_at = c.title from public.koen c where c.id = r.koen_id and r.koen_title_at is null;
alter table public.koen_kid_contact_reads alter column kid_id  drop not null;
alter table public.koen_kid_contact_reads alter column koen_id drop not null;
alter table public.koen_kid_contact_reads drop constraint if exists koen_kid_contact_reads_kid_id_fkey;
alter table public.koen_kid_contact_reads add  constraint koen_kid_contact_reads_kid_id_fkey
  foreign key (kid_id) references public.koen_kids(id) on delete set null;
alter table public.koen_kid_contact_reads drop constraint if exists koen_kid_contact_reads_koen_id_fkey;
alter table public.koen_kid_contact_reads add  constraint koen_kid_contact_reads_koen_id_fkey
  foreign key (koen_id) references public.koen(id) on delete set null;
-- 読む関数も、名前と題を写す形に
create or replace function public.read_kid_contact(p_kid uuid, p_reason_kind text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare v_koen uuid; v_role text; v_contact text; v_show date;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_reason_kind is null or p_reason_kind not in ('todays_call','emergency','guardian_request') then
    raise exception 'REASON_REQUIRED';
  end if;
  select k.koen_id into v_koen from public.koen_kids k where k.id = p_kid and k.left_at is null;
  if v_koen is null then raise exception 'NO_SUCH_KID'; end if;
  if not public.koen_can_manage(v_koen) then raise exception 'NOT_STAFF'; end if;
  if p_reason_kind = 'todays_call' then
    select min(s.starts_at::date) into v_show from public.koen_sessions s
     where s.koen_id = v_koen and s.kind in ('call','show') and s.canceled_at is null
       and s.starts_at::date = (now() at time zone 'Asia/Tokyo')::date;
    if v_show is null then raise exception 'NOT_TODAY'; end if;
  end if;
  select case when k.org_id is not null then '運営' else '主催' end into v_role from public.koen k where k.id = v_koen;
  insert into public.koen_kid_contact_reads(kid_id, kid_name_at, koen_id, koen_title_at, viewer_user_id, viewer_role_at, reason_kind)
  values (p_kid,
          (select k.nickname from public.koen_kids k where k.id = p_kid),
          v_koen,
          (select k.title from public.koen k where k.id = v_koen),
          auth.uid(), v_role, p_reason_kind);
  select c.contact into v_contact from public.koen_kid_contacts c where c.kid_id = p_kid;
  return v_contact;
end $$;
revoke all on function public.read_kid_contact(uuid, text) from public, anon;
grant execute on function public.read_kid_contact(uuid, text) to authenticated;

-- ③ 稽古を消すと「変わったもの」の履歴ごと消える／運営が履歴を書き換えられる
drop policy if exists koen_sessions_write on public.koen_sessions;
drop policy if exists koen_sessions_insert on public.koen_sessions;
create policy koen_sessions_insert on public.koen_sessions for insert to authenticated with check (public.koen_can_manage(koen_id));
drop policy if exists koen_sessions_update on public.koen_sessions;
create policy koen_sessions_update on public.koen_sessions for update to authenticated
  using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id));
revoke delete on public.koen_sessions from authenticated;                       -- 取り消しは canceled_at
revoke insert, update, delete on public.koen_session_changes from authenticated; -- 履歴は引き金だけが書く

-- 確かめ（実在の試しの利用者で）
-- 保護者が退会 → 子どもの枠は残る（呼び名も残る）／緊急の連絡先は消える
-- 子どもの枠を消す・公演を消す → 見た記録は残る（id が null・呼び名と題が残る）
-- 運営が稽古を消そうとする → できない（取り消しは canceled_at）
-- 運営が koen_session_changes を書き換えようとする → 権限エラー
