-- 20260923_12 公演の核（裁定141・143・144・148・152）。★子どもは 13 に分ける
-- 見本の作りに合わせる: 表は1つ（行 × 枠）。枠は「1人の枠」「交代の枠（オペラだけ）」「何人かの枠」
-- 主催は 学校（org_id）か 個人（owner_user_id）。段（人数）は prices.json の koen_tiers

create table if not exists public.koen (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references public.organizations(id) on delete cascade,     -- 学校の公演。個人主催なら null
  owner_user_id uuid references auth.users(id) on delete set null,              -- 作った人（個人主催のときの主催者）
  title         text not null,
  kind          text not null check (kind in ('opera','chorus','drama','orchestra','gala','chamber','band','dance','other')),
  venue         text,
  opens_on      date,
  status        text not null default 'draft' check (status in ('draft','open','done')),
  tier_people   integer not null default 15 check (tier_people in (15,40,120,300,600)),
  created_at    timestamptz not null default now(),
  check (org_id is not null or owner_user_id is not null)
);

create table if not exists public.koen_members (
  id            uuid primary key default gen_random_uuid(),
  koen_id       uuid not null references public.koen(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,   -- 抜けても表の名前は残る
  name_at       text not null,                                       -- 呼び名（そのとき）
  part          text not null default 'cast' check (part in ('cast','staff')),  -- 出演／運営
  can_manage    boolean not null default false,                      -- 運営（組む・変える）
  invited_at    timestamptz not null default now(),
  joined_at     timestamptz,
  left_at       timestamptz
);
create unique index if not exists koen_members_user_unique on public.koen_members(koen_id, user_id) where user_id is not null;

-- 表：行（人・まとまり）× 枠（役・パート）
create table if not exists public.koen_rows (
  id          uuid primary key default gen_random_uuid(),
  koen_id     uuid not null references public.koen(id) on delete cascade,
  label       text not null,                 -- 役名・パート名・曲名（ガラ）
  group_label text,                          -- 幕・部
  minutes     integer check (minutes is null or minutes between 0 and 600),
  memo        text,
  sort_order  integer not null default 0
);
create table if not exists public.koen_slots (
  id         uuid primary key default gen_random_uuid(),
  koen_id    uuid not null references public.koen(id) on delete cascade,
  label      text not null,                  -- 「A」「B」「ソプラノ」「第1」
  slot_kind  text not null check (slot_kind in ('one','alt','many')),   -- 1人／交代（オペラ）／何人か
  sort_order integer not null default 0
);
create table if not exists public.koen_cells (
  row_id    uuid not null references public.koen_rows(id)  on delete cascade,
  slot_id   uuid not null references public.koen_slots(id) on delete cascade,
  member_id uuid references public.koen_members(id) on delete set null,
  people    integer check (people is null or people >= 0),   -- 「何人かの枠」のときの人数
  primary key (row_id, slot_id)
);

-- 稽古・本番・変わったもの
create table if not exists public.koen_sessions (
  id          uuid primary key default gen_random_uuid(),
  koen_id     uuid not null references public.koen(id) on delete cascade,
  kind        text not null check (kind in ('rehearsal','call','show')),   -- 稽古／入り・集合／本番
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  place       text,
  note        text,
  canceled_at timestamptz,
  created_at  timestamptz not null default now()
);
create table if not exists public.koen_session_changes (          -- 「変わったもの」（消さずに残す）
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.koen_sessions(id) on delete cascade,
  what       text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

alter table public.koen                 enable row level security;
alter table public.koen_members         enable row level security;
alter table public.koen_rows            enable row level security;
alter table public.koen_slots           enable row level security;
alter table public.koen_cells           enable row level security;
alter table public.koen_sessions        enable row level security;
alter table public.koen_session_changes enable row level security;
revoke all on public.koen, public.koen_members, public.koen_rows, public.koen_slots, public.koen_cells,
              public.koen_sessions, public.koen_session_changes from anon, authenticated;
grant select on public.koen, public.koen_members, public.koen_rows, public.koen_slots, public.koen_cells,
                public.koen_sessions, public.koen_session_changes to authenticated;
grant insert, update, delete on public.koen, public.koen_members, public.koen_rows, public.koen_slots, public.koen_cells,
                public.koen_sessions, public.koen_session_changes to authenticated;

-- 見られる人・変えられる人（1か所にまとめる）
create or replace function public.koen_can_see(p_koen uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.koen k where k.id = p_koen and (
           k.owner_user_id = auth.uid()
           or (k.org_id is not null and public.has_can(k.org_id, 'gyoji'))
           or exists (select 1 from public.koen_members m where m.koen_id = k.id and m.user_id = auth.uid() and m.left_at is null)));
$$;
create or replace function public.koen_can_manage(p_koen uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.koen k where k.id = p_koen and (
           k.owner_user_id = auth.uid()
           or (k.org_id is not null and public.has_can(k.org_id, 'gyoji'))
           or exists (select 1 from public.koen_members m where m.koen_id = k.id and m.user_id = auth.uid()
                        and m.can_manage and m.left_at is null)));
$$;
revoke all on function public.koen_can_see(uuid), public.koen_can_manage(uuid) from public, anon;
grant execute on function public.koen_can_see(uuid), public.koen_can_manage(uuid) to authenticated;

drop policy if exists koen_select on public.koen;
create policy koen_select on public.koen for select to authenticated using (public.koen_can_see(id));
drop policy if exists koen_insert on public.koen;
create policy koen_insert on public.koen for insert to authenticated with check (
  owner_user_id = auth.uid() and (org_id is null or public.has_can(org_id,'gyoji')));
drop policy if exists koen_update on public.koen;
create policy koen_update on public.koen for update to authenticated
  using (public.koen_can_manage(id)) with check (public.koen_can_manage(id));

do $$
declare t text;
begin
  foreach t in array array['koen_members','koen_rows','koen_slots','koen_sessions'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.koen_can_see(koen_id))', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id))', t, t);
  end loop;
end $$;

drop policy if exists koen_cells_select on public.koen_cells;
create policy koen_cells_select on public.koen_cells for select to authenticated
  using (exists (select 1 from public.koen_rows r where r.id = koen_cells.row_id and public.koen_can_see(r.koen_id)));
drop policy if exists koen_cells_write on public.koen_cells;
create policy koen_cells_write on public.koen_cells for all to authenticated
  using (exists (select 1 from public.koen_rows r where r.id = koen_cells.row_id and public.koen_can_manage(r.koen_id)))
  with check (exists (select 1 from public.koen_rows r where r.id = koen_cells.row_id and public.koen_can_manage(r.koen_id)));
drop policy if exists koen_session_changes_select on public.koen_session_changes;
create policy koen_session_changes_select on public.koen_session_changes for select to authenticated
  using (exists (select 1 from public.koen_sessions s where s.id = koen_session_changes.session_id and public.koen_can_see(s.koen_id)));

-- 稽古を変えたら「変わったもの」が自動で1行（消さずに残す）
create or replace function public.log_koen_session_change()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_what text;
begin
  select string_agg(k, '・' order by k) into v_what from (values
    ('日時', old.starts_at is distinct from new.starts_at or old.ends_at is distinct from new.ends_at),
    ('場所', old.place is distinct from new.place),
    ('取り消し', old.canceled_at is null and new.canceled_at is not null),
    ('メモ', old.note is distinct from new.note)) t(k, changed) where changed;
  if v_what is null then return new; end if;
  insert into public.koen_session_changes(session_id, what, changed_by) values (new.id, v_what || ' を変えました', auth.uid());
  return new;
end $$;
revoke all on function public.log_koen_session_change() from public, anon, authenticated;
drop trigger if exists koen_sessions_log_change on public.koen_sessions;
create trigger koen_sessions_log_change after update on public.koen_sessions for each row execute function public.log_koen_session_change();

-- 確かめ（実在の試しの利用者で）
-- 出演者: 自分の公演だけ見える・変えられない／運営（can_manage）: 変えられる／学校の行事の札（gyoji）: その学校の公演を見て変えられる
-- 関係のない人: koen が0行・koen_rows も0行
-- 稽古の時間を変える → koen_session_changes に1行（誰が・何を）
-- 出演者が抜けた（left_at）→ 表の名前（name_at）は残る
