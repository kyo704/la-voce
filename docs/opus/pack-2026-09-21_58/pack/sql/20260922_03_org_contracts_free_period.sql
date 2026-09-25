-- 20260922_03 学校の契約と導入期間（裁定156・166 R4）
-- ★free_until・paid_from は契約のときに計算して保存（あとで式を変えても、結んだ契約は変わらない）

-- 計算（純粋な関数。試験しやすいように分ける）
create or replace function public.org_free_period(p_start date, p_is_pilot boolean)
returns table(free_until date, paid_from date)
language sql immutable set search_path to 'public' as $$
  with a as (
    select case when p_is_pilot then date '2027-09-30'
      else least(
        -- 契約の月を1か月目に数えて、3か月目の月末
        (date_trunc('month', p_start::timestamp) + interval '3 months' - interval '1 day')::date,   -- ★::timestamp（date のままだと timestamptz になり、immutable でなくなる。事前確認）
        -- 契約日より後の最初の4月1日の前日（=3月31日）
        (make_date(extract(year from p_start)::int + case when p_start >= make_date(extract(year from p_start)::int, 4, 1) then 1 else 0 end, 4, 1) - 1)
      ) end as fu
  )
  select fu, fu + 1 from a;
$$;

create table if not exists public.org_contracts (
  org_id          uuid primary key references public.organizations(id) on delete cascade,
  contract_start  date not null,
  is_pilot        boolean not null default false,
  free_until      date not null,
  paid_from       date not null,
  cycle           text not null check (cycle in ('monthly','annual')),
  created_at      timestamptz not null default now(),
  check (paid_from = free_until + 1)
);
alter table public.org_contracts enable row level security;
revoke all on public.org_contracts from anon, authenticated;
grant select on public.org_contracts to authenticated;
drop policy if exists org_contracts_select on public.org_contracts;
create policy org_contracts_select on public.org_contracts for select to authenticated
  using (has_can(org_id, 'bill') or has_can(org_id, 'bill_pay'));
-- 書くのは運営（Woolsong。service role）だけ。学校の側からは変えられない

-- 試験（試しの台帳で流す。1つでも違えば止まる）
-- do $$ declare r record; begin
--   select * into r from public.org_free_period(date '2027-04-01', false); assert r.free_until = date '2027-06-30' and r.paid_from = date '2027-07-01';
--   select * into r from public.org_free_period(date '2027-11-10', false); assert r.free_until = date '2028-01-31' and r.paid_from = date '2028-02-01';
--   select * into r from public.org_free_period(date '2028-02-15', false); assert r.free_until = date '2028-03-31' and r.paid_from = date '2028-04-01';
--   select * into r from public.org_free_period(date '2027-02-10', true);  assert r.free_until = date '2027-09-30' and r.paid_from = date '2027-10-01';
--   select * into r from public.org_free_period(date '2027-03-31', false); assert r.free_until = date '2027-03-31';   -- 3月31日の契約：その日で0円が終わる（4月1日から請求）
-- end $$;
-- ★36通り（12か月 × 1日・15日・末日）は Code がこの形で足す
