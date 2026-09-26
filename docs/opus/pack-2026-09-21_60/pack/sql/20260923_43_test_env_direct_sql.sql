-- 20260923_43 ★試しの環境に Opus が直接当てたもの（証明の土台を戻すためのファイル）
-- 経緯: 2026-09-23 夕方、Opus が 新しい試し環境（orutyqtfygvzcuhjgsch）で
--   「書いたものが本当に動くか」を確かめるため、★SQL を直接動かした。
--   ★その場で報告しなかったため、twin が 0件 → 36件 になった。落ち度は Opus にある。
-- ★このファイルは「戻すため」のもので、★当てる順番の本体ではない。
--   本体は sql/37・38・41。試しの環境を ★リセットしてから 37・38・41 を当てるのが正しい道。
--   リセットできない事情があるときだけ、このファイルを使って 本番と試しを揃える。

-- ────────── ① sql/38 のうち、試しに当てた分 ──────────
alter table public.koen_rows add column if not exists time_from time;
alter table public.koen_rows add column if not exists time_to   time;

alter table public.koen drop constraint if exists koen_kind_check;
alter table public.koen add constraint koen_kind_check check (kind in
  ('opera','chorus','drama','orchestra','gala','chamber','band','dance','recording','recital','other'));

alter table public.koen_slots drop constraint if exists koen_slots_group_kind_check;
alter table public.koen_slots add constraint koen_slots_group_kind_check check (group_kind in
  ('cast','orchestra','accompanist','staff'));

create or replace function public.koen_seed_simple(p_koen uuid, p_rows text[], p_slots text[])
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0; v_kind text;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  if exists (select 1 from public.koen_rows r where r.koen_id = p_koen) then raise exception 'ALREADY_HAS_ROWS'; end if;
  select k.kind into v_kind from public.koen k where k.id = p_koen;
  insert into public.koen_slots(koen_id, label, slot_kind, group_kind, sort_order)
  select p_koen, s, 'one', 'cast', i from unnest(coalesce(p_slots,'{}')) with ordinality as t(s,i);
  if v_kind in ('recital','recording') then
    insert into public.koen_slots(koen_id, label, slot_kind, group_kind, sort_order)
    values (p_koen, case when v_kind='recital' then 'ピアノ伴奏' else '音響（ミキサー）' end, 'many', 'accompanist', 900);
  end if;
  insert into public.koen_rows(koen_id, label, sort_order)
  select p_koen, r, i from unnest(coalesce(p_rows,'{}')) with ordinality as t(r,i);
  get diagnostics n = row_count;
  return n;
end $$;

-- ────────── ② sql/41 のうち、試しに当てた分 ──────────
create or replace function public.my_koen_schedule(p_koen uuid default null)
returns table(koen_id uuid, koen_title text, session_id uuid, kind text,
              starts_at timestamptz, call_at timestamptz, dismiss_at timestamptz,
              place text, rows_label text, canceled boolean)
language sql stable security definer set search_path to 'public' as $$
  select k.id, k.title, s.id, s.kind, s.starts_at, c.call_at, c.dismiss_at, s.place,
         (select string_agg(r.label, '／' order by r.sort_order)
            from public.koen_rows r where r.id = c.row_id),
         (s.canceled_at is not null)
    from public.koen_members m
    join public.koen k        on k.id = m.koen_id
    join public.koen_sessions s on s.koen_id = k.id
    left join public.koen_calls c on c.member_id = m.id
           and c.call_at >= s.starts_at - interval '6 hours'
           and c.call_at <= coalesce(s.ends_at, s.starts_at + interval '12 hours')
   where m.user_id = auth.uid() and m.left_at is null
     and (p_koen is null or k.id = p_koen)
     and s.starts_at >= (now() - interval '1 day')
   order by s.starts_at
   limit 200;
$$;

create or replace function public.koen_understudy_needed(p_session uuid)
returns table(slot_id uuid, slot_label text, absent_name text, understudy_id uuid, understudy_name text)
language sql stable security definer set search_path to 'public' as $$
  select sl.id, sl.label, m.name_at, u.id, u.name_at
    from public.koen_attendance a
    join public.koen_members m on m.id = a.member_id
    join public.koen_sessions s on s.id = a.session_id
    join public.koen_cells  c  on c.member_id = m.id
    join public.koen_slots  sl on sl.id = c.slot_id and sl.koen_id = s.koen_id
    left join public.koen_members u on u.koen_id = s.koen_id and u.is_understudy
                                   and u.covers_slot_id = sl.id and u.left_at is null
   where a.session_id = p_session
     and a.status in ('absent','excused')
     and public.koen_can_manage(s.koen_id)
   group by sl.id, sl.label, m.name_at, u.id, u.name_at;
$$;

create or replace function public.koen_sheet_export(p_koen uuid)
returns table(row_sort integer, row_label text, group_label text, minutes integer,
              slot_sort integer, slot_label text, group_kind text, person text)
language sql stable security definer set search_path to 'public' as $$
  select r.sort_order, r.label, r.group_label, r.minutes,
         sl.sort_order, sl.label, sl.group_kind,
         coalesce(m.name_at, case when c.people is not null then c.people::text||'人' else null end)
    from public.koen_rows r
    cross join public.koen_slots sl
    left join public.koen_cells c on c.row_id = r.id and c.slot_id = sl.id
    left join public.koen_members m on m.id = c.member_id
   where r.koen_id = p_koen and sl.koen_id = p_koen and public.koen_can_see(p_koen)
   order by r.sort_order, sl.sort_order;
$$;

create or replace function public.koen_copy_frame(p_from uuid, p_to uuid)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0;
begin
  if not public.koen_can_manage(p_from) then raise exception 'NOT_STAFF_SOURCE'; end if;
  if not public.koen_can_manage(p_to)   then raise exception 'NOT_STAFF_TARGET'; end if;
  if p_from = p_to then raise exception 'SAME_KOEN'; end if;
  if exists (select 1 from public.koen_rows r where r.koen_id = p_to) then raise exception 'TARGET_HAS_ROWS'; end if;
  insert into public.koen_slots(koen_id, label, slot_kind, group_kind, sort_order)
  select p_to, sl.label, sl.slot_kind, sl.group_kind, sl.sort_order
    from public.koen_slots sl where sl.koen_id = p_from;
  insert into public.koen_rows(koen_id, label, group_label, minutes, sort_order, time_from, time_to)
  select p_to, r.label, r.group_label, r.minutes, r.sort_order, r.time_from, r.time_to
    from public.koen_rows r where r.koen_id = p_from;
  get diagnostics n = row_count;
  return n;
end $$;

-- ────────── ③ sql/37 のうち、試しに当てた分 ──────────
-- ★Code の報告に org_contacts の表が挙がっていない。試しの環境には ★作ってある。
--   差分に出ていないなら、比べ方（表の追加を見ているか）を確かめること
create table if not exists public.org_contacts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  kind        text not null check (kind in ('incident','billing','general')),
  email       text not null check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  name_at     text,
  note        text,
  verified_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);
create unique index if not exists org_contacts_unique on public.org_contacts(org_id, kind, lower(email));
alter table public.org_contacts enable row level security;

create or replace function public.mark_closing_org()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  perform set_config('app.closing_org', old.id::text, true);
  return old;
end $$;
drop trigger if exists organizations_mark_closing on public.organizations;
create trigger organizations_mark_closing before delete on public.organizations
  for each row execute function public.mark_closing_org();

create or replace function public.org_contacts_keep_incident()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_org uuid; v_left integer;
begin
  v_org := case when tg_op = 'DELETE' then old.org_id else new.org_id end;
  if coalesce(current_setting('app.closing_org', true),'') = v_org::text then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'DELETE' and old.kind <> 'incident' then return old; end if;
  if tg_op = 'UPDATE' and old.kind <> 'incident' then return new; end if;
  select count(*) into v_left from public.org_contacts c
   where c.org_id = v_org and c.kind = 'incident'
     and c.id <> case when tg_op='DELETE' then old.id else new.id end;
  if tg_op = 'UPDATE' and new.kind = 'incident' then v_left := v_left + 1; end if;
  if v_left = 0 then raise exception 'NEED_ONE_INCIDENT_CONTACT: 障害のお知らせの宛先は、1つ以上 必要です'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
drop trigger if exists org_contacts_keep_incident_trg on public.org_contacts;
create trigger org_contacts_keep_incident_trg before update or delete on public.org_contacts
  for each row execute function public.org_contacts_keep_incident();

-- ────────── ★試しの環境に「残っていない」もの ──────────
-- 権限（revoke／grant）と ポリシーは、試しでは当てていない。
-- ★だから このファイルを当てただけでは 37・38・41 の守りは揃わない。
--   本番へ入れるときは ★必ず 37・38・41 の本体を使うこと。

-- ────────── 戻し方（試しの環境を 本番の形に戻すとき） ──────────
-- drop trigger if exists org_contacts_keep_incident_trg on public.org_contacts;
-- drop trigger if exists organizations_mark_closing on public.organizations;
-- drop table if exists public.org_contacts;
-- drop function if exists public.org_contacts_keep_incident();
-- drop function if exists public.mark_closing_org();
-- drop function if exists public.koen_copy_frame(uuid, uuid);
-- drop function if exists public.koen_sheet_export(uuid);
-- drop function if exists public.koen_understudy_needed(uuid);
-- drop function if exists public.my_koen_schedule(uuid);
-- drop function if exists public.koen_seed_simple(uuid, text[], text[]);
-- alter table public.koen_rows drop column if exists time_from;
-- alter table public.koen_rows drop column if exists time_to;
-- alter table public.koen drop constraint if exists koen_kind_check;
-- alter table public.koen add constraint koen_kind_check check (kind in
--   ('opera','chorus','drama','orchestra','gala','chamber','band','dance','other'));
-- alter table public.koen_slots drop constraint if exists koen_slots_group_kind_check;
-- alter table public.koen_slots add constraint koen_slots_group_kind_check check (group_kind in
--   ('cast','orchestra','staff'));
