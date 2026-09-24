-- 20260923_20 公演の残り（出欠・出演料・作品の雛形・合言葉での参加・当日の進行）
-- 裁定141・143・147・148・152。8種類は koen.kind で既に持っている（opera/chorus/drama/orchestra/gala/chamber/band/dance/other）

-- ① 出欠（稽古・本番ごと）。★率（％）を出さない・色で警告しない（裁定90 と同じ考え）
create table if not exists public.koen_attendance (
  session_id uuid not null references public.koen_sessions(id) on delete cascade,
  member_id  uuid references public.koen_members(id) on delete cascade,
  kid_id     uuid references public.koen_kids(id) on delete set null,   -- 子どもの枠が消えても出欠は残す
  kid_name_at text,
  status     text not null check (status in ('present','absent','late','excused')),
  marked_at  timestamptz not null default now(),
  marked_by  uuid references auth.users(id) on delete set null,
  marked_name_at text,
  id         uuid primary key default gen_random_uuid(),
  check (num_nonnulls(member_id, kid_id) = 1)
);
create unique index if not exists koen_attendance_unique
  on public.koen_attendance (session_id, member_id, kid_id) nulls not distinct;

-- ② 出演料（払う側＝主催。1人ずつ。★金額は運営と本人だけ）
create table if not exists public.koen_fees (
  id         uuid primary key default gen_random_uuid(),
  koen_id    uuid references public.koen(id) on delete set null,
  koen_title_at text,
  member_id  uuid references public.koen_members(id) on delete set null,
  member_name_at text,
  amount_yen integer not null check (amount_yen >= 0),
  memo       text,
  paid_on    date,
  created_at timestamptz not null default now()
);

-- ③ 作品の雛形（場面 × 役）。学校・個人がそのまま呼び出して香盤表の下書きにする（裁定152 R2）
create table if not exists public.works (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  composer   text,
  kind       text not null check (kind in ('opera','chorus','drama','orchestra','gala','chamber','band','dance','other')),
  is_public  boolean not null default true,                 -- みんなが使える雛形
  owner_user_id uuid references auth.users(id) on delete set null,   -- 自分の雛形（is_public=false）
  created_at timestamptz not null default now()
);
create table if not exists public.work_roles (
  id        uuid primary key default gen_random_uuid(),
  work_id   uuid not null references public.works(id) on delete cascade,
  label     text not null,                                   -- 役・パート
  is_group  boolean not null default false,                  -- 合唱などのまとまり
  sort_order integer not null default 0
);
create table if not exists public.work_scenes (
  id        uuid primary key default gen_random_uuid(),
  work_id   uuid not null references public.works(id) on delete cascade,
  label     text not null,                                   -- 場面・曲
  group_label text,                                          -- 幕・部
  minutes   integer check (minutes is null or minutes between 0 and 600),
  sort_order integer not null default 0
);
create table if not exists public.work_scene_roles (
  scene_id uuid not null references public.work_scenes(id) on delete cascade,
  role_id  uuid not null references public.work_roles(id) on delete cascade,
  primary key (scene_id, role_id)
);

-- 雛形から公演の表を作る（行＝場面・枠＝役）
create or replace function public.koen_apply_work(p_koen uuid, p_work uuid)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  if exists (select 1 from public.koen_rows r where r.koen_id = p_koen) then raise exception 'ALREADY_HAS_ROWS'; end if;
  if not exists (select 1 from public.works w where w.id = p_work and (w.is_public or w.owner_user_id = auth.uid())) then
    raise exception 'NO_SUCH_WORK';
  end if;
  insert into public.koen_slots(koen_id, label, slot_kind, sort_order)
  select p_koen, r.label, case when r.is_group then 'many' else 'one' end, r.sort_order
    from public.work_roles r where r.work_id = p_work;
  insert into public.koen_rows(koen_id, label, group_label, minutes, sort_order)
  select p_koen, s.label, s.group_label, s.minutes, s.sort_order
    from public.work_scenes s where s.work_id = p_work;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.koen_apply_work(uuid, uuid) from public, anon;
grant execute on function public.koen_apply_work(uuid, uuid) to authenticated;

-- ④ 合言葉で公演に入る（裁定152・招待コード方式。★総当たりを止める）
create table if not exists public.koen_join_codes (
  koen_id    uuid primary key references public.koen(id) on delete cascade,
  code       text not null unique check (length(code) between 6 and 12),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create or replace function public.join_koen_by_code(p_code text, p_name text)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_koen uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select c.koen_id into v_koen from public.koen_join_codes c
   where c.code = upper(btrim(p_code)) and (c.expires_at is null or c.expires_at > now());
  if v_koen is null then raise exception 'NO_MATCH'; end if;        -- ★理由は返さない（合っていないとだけ）
  insert into public.koen_members(koen_id, user_id, name_at, part, joined_at)
  values (v_koen, auth.uid(), left(btrim(p_name), 40), 'cast', now())
  on conflict (koen_id, user_id) where user_id is not null do update set left_at = null
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.join_koen_by_code(text, text) from public, anon;
grant execute on function public.join_koen_by_code(text, text) to authenticated;

-- ⑤ 当日の進行（時刻 × することの一覧。見本の「当日の 進行」）
create table if not exists public.koen_runsheet (
  id         uuid primary key default gen_random_uuid(),
  koen_id    uuid not null references public.koen(id) on delete cascade,
  at_time    time not null,
  what       text not null,
  who        text,                                            -- 「全員」「合唱」「子ども」など。個人の名前は入れない
  sort_order integer not null default 0
);

alter table public.koen_attendance enable row level security;
alter table public.koen_fees       enable row level security;
alter table public.works           enable row level security;
alter table public.work_roles      enable row level security;
alter table public.work_scenes     enable row level security;
alter table public.work_scene_roles enable row level security;
alter table public.koen_join_codes enable row level security;
alter table public.koen_runsheet   enable row level security;
revoke all on public.koen_attendance, public.koen_fees, public.works, public.work_roles, public.work_scenes,
              public.work_scene_roles, public.koen_join_codes, public.koen_runsheet from anon, authenticated;
grant select on public.koen_attendance, public.koen_fees, public.works, public.work_roles, public.work_scenes,
                public.work_scene_roles, public.koen_runsheet to authenticated;
grant insert, update, delete on public.koen_attendance, public.koen_runsheet to authenticated;
grant insert, update, delete on public.works, public.work_roles, public.work_scenes, public.work_scene_roles to authenticated;
-- ★koen_fees と koen_join_codes は 書くのを 運営だけに（下のポリシーで）
grant insert, update, delete on public.koen_fees, public.koen_join_codes to authenticated;

-- 出欠：見るのは その公演の人。付けるのは運営
drop policy if exists koen_attendance_select on public.koen_attendance;
create policy koen_attendance_select on public.koen_attendance for select to authenticated
  using (exists (select 1 from public.koen_sessions s where s.id = koen_attendance.session_id and public.koen_can_see(s.koen_id)));
drop policy if exists koen_attendance_write on public.koen_attendance;
create policy koen_attendance_write on public.koen_attendance for all to authenticated
  using (exists (select 1 from public.koen_sessions s where s.id = koen_attendance.session_id and public.koen_can_manage(s.koen_id)))
  with check (exists (select 1 from public.koen_sessions s where s.id = koen_attendance.session_id and public.koen_can_manage(s.koen_id)));

-- 出演料：★運営と、その本人だけ（ほかの出演者には見えない）
drop policy if exists koen_fees_select on public.koen_fees;
create policy koen_fees_select on public.koen_fees for select to authenticated using (
  (koen_id is not null and public.koen_can_manage(koen_id))
  or exists (select 1 from public.koen_members m where m.id = koen_fees.member_id and m.user_id = auth.uid())
);
drop policy if exists koen_fees_write on public.koen_fees;
create policy koen_fees_write on public.koen_fees for all to authenticated
  using (koen_id is not null and public.koen_can_manage(koen_id))
  with check (koen_id is not null and public.koen_can_manage(koen_id));

-- 雛形：みんなの雛形は誰でも読める。書けるのは自分の雛形だけ
drop policy if exists works_select on public.works;
create policy works_select on public.works for select to authenticated using (is_public or owner_user_id = auth.uid());
drop policy if exists works_write on public.works;
create policy works_write on public.works for all to authenticated
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid() and is_public = false);
do $$
declare t text;
begin
  foreach t in array array['work_roles','work_scenes'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format($f$create policy %I_select on public.%I for select to authenticated
      using (exists (select 1 from public.works w where w.id = %I.work_id and (w.is_public or w.owner_user_id = auth.uid())))$f$, t, t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format($f$create policy %I_write on public.%I for all to authenticated
      using (exists (select 1 from public.works w where w.id = %I.work_id and w.owner_user_id = auth.uid()))
      with check (exists (select 1 from public.works w where w.id = %I.work_id and w.owner_user_id = auth.uid()))$f$, t, t, t, t);
  end loop;
end $$;
drop policy if exists work_scene_roles_select on public.work_scene_roles;
create policy work_scene_roles_select on public.work_scene_roles for select to authenticated
  using (exists (select 1 from public.work_scenes s join public.works w on w.id = s.work_id
                  where s.id = work_scene_roles.scene_id and (w.is_public or w.owner_user_id = auth.uid())));
drop policy if exists work_scene_roles_write on public.work_scene_roles;
create policy work_scene_roles_write on public.work_scene_roles for all to authenticated
  using (exists (select 1 from public.work_scenes s join public.works w on w.id = s.work_id
                  where s.id = work_scene_roles.scene_id and w.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.work_scenes s join public.works w on w.id = s.work_id
                  where s.id = work_scene_roles.scene_id and w.owner_user_id = auth.uid()));

-- 合言葉：運営だけが作れる。読めるのも運営だけ（入るのは関数から）
drop policy if exists koen_join_codes_manage on public.koen_join_codes;
create policy koen_join_codes_manage on public.koen_join_codes for all to authenticated
  using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id));

-- 当日の進行：その公演の人が見る。書くのは運営
drop policy if exists koen_runsheet_select on public.koen_runsheet;
create policy koen_runsheet_select on public.koen_runsheet for select to authenticated using (public.koen_can_see(koen_id));
drop policy if exists koen_runsheet_write on public.koen_runsheet;
create policy koen_runsheet_write on public.koen_runsheet for all to authenticated
  using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id));

-- 名前を写す（人・子ども・公演が消えても読めるように）
create or replace function public.stamp_koen_names()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_table_name = 'koen_attendance' then
    if new.kid_name_at is null and new.kid_id is not null then
      select k.nickname into new.kid_name_at from public.koen_kids k where k.id = new.kid_id; end if;
    if new.marked_name_at is null and new.marked_by is not null then
      select p.display_name into new.marked_name_at from public.profiles p where p.id = new.marked_by; end if;
  elsif tg_table_name = 'koen_fees' then
    if new.koen_title_at is null and new.koen_id is not null then
      select k.title into new.koen_title_at from public.koen k where k.id = new.koen_id; end if;
    if new.member_name_at is null and new.member_id is not null then
      select m.name_at into new.member_name_at from public.koen_members m where m.id = new.member_id; end if;
  end if;
  return new;
end $$;
revoke all on function public.stamp_koen_names() from public, anon, authenticated;
drop trigger if exists koen_attendance_stamp on public.koen_attendance;
create trigger koen_attendance_stamp before insert on public.koen_attendance for each row execute function public.stamp_koen_names();
drop trigger if exists koen_fees_stamp on public.koen_fees;
create trigger koen_fees_stamp before insert on public.koen_fees for each row execute function public.stamp_koen_names();

-- 確かめ（実在の試しの利用者で）
-- 出欠: 運営が付けられる／出演者は見るだけ／子どもの枠を消しても出欠は残る（呼び名が残る）
-- 出演料: 運営と本人だけに見える。ほかの出演者は0行。公演を消しても記録は残る
-- 雛形: みんなの雛形は読めるが書けない（is_public=true を自分では作れない）／自分の雛形は作れる
-- koen_apply_work: 行が1つでもある公演に当てると ALREADY_HAS_ROWS
-- 合言葉: 合っていないと NO_MATCH（理由を返さない）／期限切れも NO_MATCH／2回入ると1行のまま（left_at が消える）
-- 当日の進行: 個人の名前を入れない（who は「全員」「合唱」など）
