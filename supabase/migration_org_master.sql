-- ============================================================================
-- ★学校の 基本（★見本 `stKoma` ／ `stPlace`・2026-09-20）
--
--   ★★★2つ 作ります。
--     ①`org_periods` …… ★学校の コマ（★全員の 画面の もとに なります）
--     ②`org_places` …… ★場所（★れい：第4練習室）
--
--   ★★★`my_periods` は ご本人 だけ の 表 です。★別の もの です。
--     ★★見本の 字 ──「先生は、この 中で **自分の コマ**を 決められます」。
--     ★★だから 学校の ぶんを 別に 持ちます。★上書きしません。
--
--   ★★★門 ── ★`koma` を 持つ 方 だけ が 直せます。
--     ★★学校の 方は 読めます（★全員の 画面の もと だから です）。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create table if not exists public.org_periods (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  ord smallint not null,
  name text not null,
  start_min smallint not null,
  end_min smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, ord),
  constraint org_periods_time_check check (start_min >= 0 and end_min > start_min and end_min <= 1440)
);

create table if not exists public.org_places (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  ord smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

alter table public.org_periods enable row level security;
alter table public.org_places enable row level security;

do $$
begin
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='org_periods' and p.polname='org_periods_select') then
    create policy org_periods_select on public.org_periods
      for select using (
        exists (select 1 from public.memberships m
                where m.org_id = org_periods.org_id and m.user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='org_periods' and p.polname='org_periods_write') then
    create policy org_periods_write on public.org_periods
      for all using (public.has_can(org_id, 'koma'))
      with check (public.has_can(org_id, 'koma'));
  end if;

  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='org_places' and p.polname='org_places_select') then
    create policy org_places_select on public.org_places
      for select using (
        exists (select 1 from public.memberships m
                where m.org_id = org_places.org_id and m.user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='org_places' and p.polname='org_places_write') then
    create policy org_places_write on public.org_places
      for all using (public.has_can(org_id, 'koma'))
      with check (public.has_can(org_id, 'koma'));
  end if;
end $$;

revoke all on table public.org_periods from public, anon, authenticated;
revoke all on table public.org_places from public, anon, authenticated;
grant select, insert, update, delete on table public.org_periods to authenticated;
grant select, insert, update, delete on table public.org_places to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select c.relname, c.relrowsecurity,
--          (select count(*) from pg_policy p where p.polrelid = c.oid)
--   from pg_class c where c.relname in ('org_periods','org_places');
--   ★★どちらも 決まりは 2つ（読む・直す）で ある こと。
