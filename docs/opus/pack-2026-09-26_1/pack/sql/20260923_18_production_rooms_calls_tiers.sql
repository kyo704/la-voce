-- 20260923_18 公演の続き：楽屋・入り（呼び出し）・段（人数）の課金（裁定143・148・152 R3・155）
-- 見本の作りに合わせる: 楽屋は「部屋の名前 × そこに入る人（役・まとまり）」。入りは「時刻 × 呼ばれる人」
-- 段は prices.json の koen_tiers（15/40/120/300/600）。段を超える人を招こうとしたら 1度 たずねる → 差額を払う

-- ① 楽屋
create table if not exists public.koen_rooms (
  id         uuid primary key default gen_random_uuid(),
  koen_id    uuid not null references public.koen(id) on delete cascade,
  name       text not null,                       -- 「楽屋 1」「大楽屋」「控室（保護者の 方も）」
  for_kids   boolean not null default false,      -- 子どもと保護者の控室（裁定147）
  note       text,
  sort_order integer not null default 0
);
create table if not exists public.koen_room_members (
  id        uuid primary key default gen_random_uuid(),   -- ★主キーは id。下の3列は 2つが null になるので、主キーに使えない（null は主キーに入れられない）
  room_id   uuid not null references public.koen_rooms(id) on delete cascade,
  member_id uuid references public.koen_members(id) on delete cascade,
  kid_id    uuid references public.koen_kids(id) on delete cascade,
  row_id    uuid references public.koen_rows(id) on delete cascade,   -- 「合唱」のような まとまりごと入れるとき
  check (num_nonnulls(member_id, kid_id, row_id) = 1)
);
-- 同じ人・同じ子ども・同じまとまりを、同じ部屋に2回入れない（PostgreSQL 15 以降の nulls not distinct。本番は 17.6）
create unique index if not exists koen_room_members_unique
  on public.koen_room_members (room_id, member_id, kid_id, row_id) nulls not distinct;

-- ② 入り（呼び出し）。見本は「時刻 × 呼ばれる人」。子どもは 集合と解散を 必ず出す（裁定147）
create table if not exists public.koen_calls (
  id          uuid primary key default gen_random_uuid(),
  koen_id     uuid not null references public.koen(id) on delete cascade,
  call_at     timestamptz not null,
  member_id   uuid references public.koen_members(id) on delete cascade,
  kid_id      uuid references public.koen_kids(id) on delete cascade,
  row_id      uuid references public.koen_rows(id) on delete cascade,
  dismiss_at  timestamptz,                         -- 解散（子どもは必須。下の引き金で確かめる）
  note        text,
  check (num_nonnulls(member_id, kid_id, row_id) = 1)
);
create index if not exists koen_calls_koen_idx on public.koen_calls(koen_id, call_at);

-- 子どもの呼び出しには、必ず解散の時刻を入れる（裁定147）
create or replace function public.require_dismiss_for_kid()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.kid_id is not null and new.dismiss_at is null then
    raise exception 'KID_DISMISS_REQUIRED: 子どもの 呼び出しには 解散の 時刻が 要ります';
  end if;
  return new;
end $$;
drop trigger if exists koen_calls_kid_dismiss on public.koen_calls;
create trigger koen_calls_kid_dismiss before insert or update on public.koen_calls
  for each row execute function public.require_dismiss_for_kid();

alter table public.koen_rooms        enable row level security;
alter table public.koen_room_members enable row level security;
alter table public.koen_calls        enable row level security;
revoke all on public.koen_rooms, public.koen_room_members, public.koen_calls from anon, authenticated;
grant select on public.koen_rooms, public.koen_room_members, public.koen_calls to authenticated;
grant insert, update, delete on public.koen_rooms, public.koen_room_members, public.koen_calls to authenticated;

drop policy if exists koen_rooms_select on public.koen_rooms;
create policy koen_rooms_select on public.koen_rooms for select to authenticated using (public.koen_can_see(koen_id));
drop policy if exists koen_rooms_write on public.koen_rooms;
create policy koen_rooms_write on public.koen_rooms for all to authenticated
  using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id));
drop policy if exists koen_calls_select on public.koen_calls;
create policy koen_calls_select on public.koen_calls for select to authenticated using (public.koen_can_see(koen_id));
drop policy if exists koen_calls_write on public.koen_calls;
create policy koen_calls_write on public.koen_calls for all to authenticated
  using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id));
drop policy if exists koen_room_members_select on public.koen_room_members;
create policy koen_room_members_select on public.koen_room_members for select to authenticated
  using (exists (select 1 from public.koen_rooms r where r.id = koen_room_members.room_id and public.koen_can_see(r.koen_id)));
drop policy if exists koen_room_members_write on public.koen_room_members;
create policy koen_room_members_write on public.koen_room_members for all to authenticated
  using (exists (select 1 from public.koen_rooms r where r.id = koen_room_members.room_id and public.koen_can_manage(r.koen_id)))
  with check (exists (select 1 from public.koen_rooms r where r.id = koen_room_members.room_id and public.koen_can_manage(r.koen_id)));

-- ③ 段（人数）と 差額（裁定155・166 R1-4）
create table if not exists public.koen_payments (
  id            uuid primary key default gen_random_uuid(),
  koen_id       uuid references public.koen(id) on delete set null,          -- ★not null にしない（空にできないと、公演を消すときに詰まる。2026-09-23 の事故と同じ型）
  koen_title_at text,
  tier_people   integer not null check (tier_people in (15,40,120,300,600)),
  amount_yen    integer not null check (amount_yen >= 0),
  paid_at       timestamptz not null default now(),
  stripe_payment_intent text unique
);
alter table public.koen_payments enable row level security;
revoke all on public.koen_payments from anon, authenticated;
grant select on public.koen_payments to authenticated;
drop policy if exists koen_payments_select on public.koen_payments;
create policy koen_payments_select on public.koen_payments for select to authenticated using (public.koen_can_manage(koen_id));
-- 書くのはサーバ（支払いの後）だけ

-- 段の値段（prices.json と同じ。変えるときは両方）
create or replace function public.koen_tier_price(p_people integer)
returns table(tier_people integer, amount_yen integer)
language plpgsql immutable set search_path to 'public' as $$
begin
  if p_people > 600 then
    raise exception 'KOEN_TOO_MANY: 600人を 超える 公演は、いまは 扱っていません';   -- ★見本の文言と同じ
  end if;
  return query
    select t.tier, t.yen from (values (15,0),(40,20000),(120,50000),(300,100000),(600,150000)) t(tier, yen)
     where t.tier >= greatest(p_people, 1) order by t.tier limit 1;
end $$;

-- いま払うべき差額（すでに払った段より上に上がるときだけ）
create or replace function public.koen_due_amount(p_koen uuid, p_people integer)
returns table(tier_people integer, due_yen integer)
language sql stable security definer set search_path to 'public' as $$
  with need as (select * from public.koen_tier_price(p_people)),
       paid as (select coalesce(max(p.amount_yen), 0) as yen from public.koen_payments p where p.koen_id = p_koen)
  select need.tier_people, greatest(need.amount_yen - paid.yen, 0) from need, paid
   where public.koen_can_manage(p_koen);
$$;
revoke all on function public.koen_due_amount(uuid, integer) from public, anon;
grant execute on function public.koen_due_amount(uuid, integer) to authenticated;

-- 段を超える人を招けないようにする（払ってから招く。裁定155 C3 と同じ形）
create or replace function public.check_koen_tier()
returns trigger language plpgsql set search_path to 'public' as $$
declare v_n integer; v_tier integer;
begin
  select count(*) into v_n from public.koen_members m where m.koen_id = new.koen_id and m.left_at is null;
  select k.tier_people into v_tier from public.koen k where k.id = new.koen_id;
  if v_n + 1 > v_tier then
    raise exception 'KOEN_TIER_EXCEEDED: いまの 段（%人）を 超えます。差額を お支払いください', v_tier;
  end if;
  return new;
end $$;
drop trigger if exists koen_members_tier_check on public.koen_members;
create trigger koen_members_tier_check before insert on public.koen_members
  for each row execute function public.check_koen_tier();

-- 確かめ（実在の試しの利用者で）
-- 楽屋: 運営が部屋を作り、役とまとまりを入れられる／出演者は見るだけ／関係のない人は0行
-- 入り: 子どもの呼び出しに解散の時刻を入れないと KID_DISMISS_REQUIRED
-- 段: 15人の公演に16人目を招く → KOEN_TIER_EXCEEDED／koen_due_amount(公演,16) → 40人の段・差額 20000
--     40人ぶんを払った記録を入れてから 120人の段へ → 差額 30000（50000−20000）
-- koen_payments: 公演を消しても記録が残る（koen_id が null・題が残る）
-- 楽屋: 同じ人を同じ部屋に2回入れられない／別の部屋には入れられる（unique の確かめ）
