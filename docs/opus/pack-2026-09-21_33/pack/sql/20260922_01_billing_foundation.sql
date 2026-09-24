-- 20260922_01 課金の土台（裁定166・169 ★4 ★7・167 A2）
-- 作成 Opus（本番の構造を読み取りで見て書いた）／当てる Code（試し → 証明 → 承認 → apply_migration）
-- ★冪等（何度流しても同じ）。本番の subscriptions・purchases は既存の列を変えない（足すだけ）

-- ① 1人が複数の月払いの品を同時に持てるように（1人1つの Stripe の契約に品目を複数）
create table if not exists public.subscription_items (
  stripe_item_id          text primary key,                 -- Stripe の subscription item の ID（si_…）
  user_id                 uuid not null references auth.users(id) on delete cascade,   -- 本人の契約。退会で消えてよい（お金の記録は payment_records に残る）
  stripe_subscription_id  text not null,
  lookup_key              text not null check (lookup_key in (
                            'ind_zenbu_m','ind_gakusei_m','ind_shiraberu_m','ind_yosooi_m','kyo_m')),
  added_at                timestamptz not null default now(),
  removed_at              timestamptz
);
create index if not exists subscription_items_user_idx on public.subscription_items(user_id) where removed_at is null;
alter table public.subscription_items enable row level security;
revoke all on public.subscription_items from anon, authenticated;
grant select on public.subscription_items to authenticated;
drop policy if exists subscription_items_select_own on public.subscription_items;
create policy subscription_items_select_own on public.subscription_items for select to authenticated using (user_id = auth.uid());
-- 書くのはサーバ（service role・webhook）だけ

-- ② Stripe の通知の二重受けを止める
create table if not exists public.stripe_events (
  event_id      text primary key,          -- evt_…。2回目の insert は主キーで止まる
  type          text not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  error         text                       -- 処理に失敗したときの短い理由（見張りの通知の元）
);
alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from anon, authenticated;
-- ポリシーは作らない（サーバだけ）

-- ③ 年払い（purchases）に途中で終えた記録
alter table public.purchases add column if not exists lookup_key     text;
alter table public.purchases add column if not exists ended_early_at timestamptz;
alter table public.purchases add column if not exists refunded_yen   integer not null default 0 check (refunded_yen >= 0);
do $$ begin
  -- ★本番に同じ名前の制約が既にある（status in ('active','expired')。2026-09-22 Opus の事前確認）→ 作り直して 'ended_early' を足す
  alter table public.purchases drop constraint if exists purchases_status_check;
  alter table public.purchases add constraint purchases_status_check check (status in ('active','expired','ended_early'));
  if not exists (select 1 from pg_constraint where conname = 'purchases_refund_le_amount') then
    alter table public.purchases add constraint purchases_refund_le_amount check (amount_yen is null or refunded_yen <= amount_yen);
  end if;
end $$;
create unique index if not exists purchases_payment_intent_key on public.purchases(stripe_payment_intent) where stripe_payment_intent is not null;

-- ④ 使えるかの判定を1か所に（fail closed：期限が過ぎたら、通知が来なくても使えない）
--    機能の鍵: tsutaeru・shiraberu・yosooi（ぜんぶ・学生は3つとも）
create or replace function public.my_entitlements()
returns table(feature text, source text, until timestamptz)
language sql stable security definer set search_path to 'public' as $$
  with me as (select auth.uid() as uid),
  subs as (
    select i.lookup_key, coalesce(s.current_period_end, s.period_end) as until
    from public.subscription_items i
    join public.subscriptions s on s.user_id = i.user_id and s.stripe_subscription_id = i.stripe_subscription_id
    where i.user_id = (select uid from me) and i.removed_at is null
      and s.status in ('active','trialing')
      and coalesce(s.current_period_end, s.period_end) > now()
  ),
  yearly as (
    select p.lookup_key, p.ends_at as until
    from public.purchases p
    where p.user_id = (select uid from me) and p.status = 'active' and p.ends_at > now()
  ),
  keys as (select lookup_key, until, 'monthly' as source from subs union all select lookup_key, until, 'yearly' from yearly)
  select f.feature, k.source, max(k.until)
  from keys k
  cross join lateral (
    select unnest(case
      when k.lookup_key in ('ind_zenbu_m','ind_zenbu_y','ind_gakusei_m','ind_gakusei_y') then array['tsutaeru','shiraberu','yosooi']
      when k.lookup_key = 'ind_tsutaeru_y' then array['tsutaeru']
      when k.lookup_key in ('ind_shiraberu_m','ind_shiraberu_y') then array['shiraberu']
      when k.lookup_key in ('ind_yosooi_m','ind_yosooi_y') then array['yosooi']
      else array[]::text[] end) as feature
  ) f
  where (select uid from me) is not null
  group by f.feature, k.source;
$$;
revoke all on function public.my_entitlements() from public, anon;
grant execute on function public.my_entitlements() to authenticated;

-- 確かめ（台帳の形だけ。動きの証明は実在の試しの利用者で）
-- select relrowsecurity from pg_class where relname in ('subscription_items','stripe_events');                 → t, t
-- select grantee, privilege_type from information_schema.role_table_grants where table_name='stripe_events';    → anon・authenticated の行が無い
-- select has_function_privilege('anon','public.my_entitlements()','EXECUTE');                                   → f
