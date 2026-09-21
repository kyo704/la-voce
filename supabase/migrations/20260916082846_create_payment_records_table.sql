-- ★本番の 台帳から 写しました（create_payment_records_table）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  stripe_customer_id     text,
  stripe_subscription_id text,
  stripe_session_id      text,
  stripe_payment_intent  text,
  stripe_price_id        text,
  plan   text,
  status text,
  amount_yen integer,
  started_at         timestamptz,
  ends_at            timestamptz,
  current_period_end timestamptz,
  cancelled_at       timestamptz,
  severed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists payment_records_sub_uniq
  on public.payment_records (stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists payment_records_session_uniq
  on public.payment_records (stripe_session_id)
  where stripe_session_id is not null;

revoke all on public.payment_records from anon, authenticated;

alter table public.payment_records enable row level security;
alter table public.payment_records force row level security;

grant insert, select on public.payment_records to service_role;

comment on table public.payment_records is
  '退会後も法律で7年保存する取引の記録。user_id の列を持たない（切り離し済み）。';

