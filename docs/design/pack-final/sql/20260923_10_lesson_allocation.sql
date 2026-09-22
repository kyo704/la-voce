-- 20260923_10 レッスン割（裁定139・152 R4）
-- 作成 Opus（本番の構造を読み取りで確かめて書いた）。★事前確認済み：札の名（sched_all・sched_mine・koma）は本番の org_posts に実在
-- 既存を使う: lessons（置いた結果）・my_timetable（授業のコマ）・assignments（担当）・org_periods（時限）

create table if not exists public.lesson_rounds (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  teacher_id   uuid references auth.users(id) on delete set null,      -- null＝学校ぜんぶ
  name         text not null,
  period_from  date not null,
  period_to    date not null,
  due_on       date,
  status       text not null default 'open' check (status in ('open','confirmed')),
  confirmed_at timestamptz,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  check (period_to >= period_from)
);
create index if not exists lesson_rounds_org_idx on public.lesson_rounds(org_id, status);

create table if not exists public.lesson_prefs (
  round_id   uuid not null references public.lesson_rounds(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,   -- 本人の希望。退会で消えてよい
  slot_key   text not null,                                               -- 曜日（0〜6）と時限（org_periods.id）を '-' でつないだもの。例 '1-<uuid>'
  level      smallint not null check (level in (0,1,2)),                  -- 2=◎ 1=△ 0=×
  updated_at timestamptz not null default now(),
  primary key (round_id, user_id, slot_key)
);
create table if not exists public.lesson_ng_dates (
  round_id uuid not null references public.lesson_rounds(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  ng_on    date not null,
  primary key (round_id, user_id, ng_on)
);

-- 1人1つのカレンダーの住所（裁定139 ics・152 R1）。漏れたら作り直せる
create table if not exists public.calendar_tokens (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);

alter table public.lesson_rounds   enable row level security;
alter table public.lesson_prefs    enable row level security;
alter table public.lesson_ng_dates enable row level security;
alter table public.calendar_tokens enable row level security;
revoke all on public.lesson_rounds, public.lesson_prefs, public.lesson_ng_dates, public.calendar_tokens from anon, authenticated;
grant select                         on public.lesson_rounds   to authenticated;
grant select, insert, update, delete on public.lesson_prefs    to authenticated;
grant select, insert, delete         on public.lesson_ng_dates to authenticated;
grant select                         on public.calendar_tokens to authenticated;
grant insert, update                 on public.lesson_rounds   to authenticated;

-- 回（round）: 対象の学生・その学校の先生・日程の札 が見られる。作れるのは sched_all と、自分の門下だけの先生
drop policy if exists lesson_rounds_select on public.lesson_rounds;
create policy lesson_rounds_select on public.lesson_rounds for select to authenticated using (
  has_can(org_id,'sched_all')
  or teacher_id = auth.uid()
  or exists (select 1 from public.enrollments e where e.org_id = lesson_rounds.org_id and e.student_id = auth.uid() and e.status = 'active')
);
drop policy if exists lesson_rounds_write on public.lesson_rounds;
create policy lesson_rounds_write on public.lesson_rounds for insert to authenticated with check (
  created_by = auth.uid()
  and (has_can(org_id,'sched_all') or (has_can(org_id,'sched_mine') and teacher_id = auth.uid()))
);
drop policy if exists lesson_rounds_update on public.lesson_rounds;
create policy lesson_rounds_update on public.lesson_rounds for update to authenticated
  using (has_can(org_id,'sched_all') or (has_can(org_id,'sched_mine') and teacher_id = auth.uid()))
  with check (has_can(org_id,'sched_all') or (has_can(org_id,'sched_mine') and teacher_id = auth.uid()));

-- 希望: 学生は自分のだけ（しめきりまで・回が open のあいだ）。担当の先生と日程の札は読むだけ
drop policy if exists lesson_prefs_own on public.lesson_prefs;
create policy lesson_prefs_own on public.lesson_prefs for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.lesson_rounds r where r.id = lesson_prefs.round_id and r.status = 'open'
                 and (r.due_on is null or (now() at time zone 'Asia/Tokyo')::date <= r.due_on))
  );
drop policy if exists lesson_prefs_read_staff on public.lesson_prefs;
create policy lesson_prefs_read_staff on public.lesson_prefs for select to authenticated using (
  exists (select 1 from public.lesson_rounds r where r.id = lesson_prefs.round_id and (
      has_can(r.org_id,'sched_all')
      or exists (select 1 from public.assignments a where a.org_id = r.org_id and a.teacher_id = auth.uid()
                   and a.student_id = lesson_prefs.user_id and a.ended_at is null)))
);
drop policy if exists lesson_ng_own on public.lesson_ng_dates;
create policy lesson_ng_own on public.lesson_ng_dates for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid()
    and exists (select 1 from public.lesson_rounds r where r.id = lesson_ng_dates.round_id and r.status = 'open'
                 and (r.due_on is null or (now() at time zone 'Asia/Tokyo')::date <= r.due_on)));
drop policy if exists lesson_ng_read_staff on public.lesson_ng_dates;
create policy lesson_ng_read_staff on public.lesson_ng_dates for select to authenticated using (
  exists (select 1 from public.lesson_rounds r where r.id = lesson_ng_dates.round_id and (
      has_can(r.org_id,'sched_all')
      or exists (select 1 from public.assignments a where a.org_id = r.org_id and a.teacher_id = auth.uid()
                   and a.student_id = lesson_ng_dates.user_id and a.ended_at is null)))
);
drop policy if exists calendar_tokens_own on public.calendar_tokens;
create policy calendar_tokens_own on public.calendar_tokens for select to authenticated using (user_id = auth.uid());

-- 授業のコマを × で埋める（授業名は入れない。裁定139 auto_x）
create or replace function public.seed_prefs_from_timetable(p_round_id uuid)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare v_n integer;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from public.lesson_rounds r
                  join public.enrollments e on e.org_id = r.org_id and e.student_id = auth.uid() and e.status = 'active'
                 where r.id = p_round_id and r.status = 'open') then
    raise exception 'NOT_TARGET_OR_CLOSED';
  end if;
  insert into public.lesson_prefs(round_id, user_id, slot_key, level)
  select p_round_id, auth.uid(), t.weekday::text || '-' || t.period_id::text, 0   -- weekday は smallint・period_id は uuid（本番で確認）
    from public.my_timetable t
   where t.user_id = auth.uid() and coalesce(t.unavailable, true)
  on conflict (round_id, user_id, slot_key) do nothing;     -- 学生が自分で直した希望は上書きしない
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function public.seed_prefs_from_timetable(uuid) from public, anon;
grant execute on function public.seed_prefs_from_timetable(uuid) to authenticated;

-- 地図（コマごとの人数）。名前は出さない
create or replace function public.pref_map(p_round_id uuid)
returns table(slot_key text, maru integer, sankaku integer)
language sql stable security definer set search_path to 'public' as $$
  select p.slot_key,
         count(*) filter (where p.level = 2)::int,
         count(*) filter (where p.level = 1)::int
    from public.lesson_prefs p
    join public.lesson_rounds r on r.id = p.round_id
   where p.round_id = p_round_id
     and (has_can(r.org_id,'sched_all')
          or exists (select 1 from public.assignments a where a.org_id = r.org_id and a.teacher_id = auth.uid()
                       and a.student_id = p.user_id and a.ended_at is null))
   group by p.slot_key;
$$;
revoke all on function public.pref_map(uuid) from public, anon;
grant execute on function public.pref_map(uuid) to authenticated;

-- 住所の作り直し（漏れたとき）
create or replace function public.rotate_calendar_token()
returns text language plpgsql security definer set search_path to 'public' as $$
declare v_token text;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.calendar_tokens(user_id, token) values (auth.uid(), v_token)
    on conflict (user_id) do update set token = excluded.token, rotated_at = now();
  return v_token;
end $$;
revoke all on function public.rotate_calendar_token() from public, anon;
grant execute on function public.rotate_calendar_token() to authenticated;

-- 確かめ（実在の試しの利用者で）
-- 学生: 自分の希望を入れられる／しめきりの翌日は入れられない／回が confirmed なら入れられない
-- 学生: ほかの学生の希望が0行／担当の先生: 自分の門下の希望だけ／sched_all: その学校の全部
-- 学長（札なし）: 希望が0行
-- pref_map: 名前が1つも返らない（列は slot_key・maru・sankaku だけ）
-- seed_prefs_from_timetable: 授業のコマが × で入る。学生が ◎ に直した行は上書きされない
-- rotate_calendar_token: 2回呼ぶと住所が変わる。ほかの人の calendar_tokens は0行
