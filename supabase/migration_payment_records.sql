-- ===========================================================================
-- ★お支払いの 記録を、★人と 切り離して 残す 表
--
--   ★出どころ　坂本さん（★2026-09-16・第3段）
--     「★subscriptions の行を 全部 消しては いけません。
--       ★法人税法・所得税法 ── 取引の帳簿は 7年 保存。
--       ★GDPR 17条3項(b)・個情法 ── 法令に基づく保存は 削除の例外。
--       ★★個人が 分からない形で（user_id を 切り離す）」
--
--   ★この表は **user_id の列を 持ちません**。
--     ★持たない ことが、★切り離しの 中身 です。
--     ★★「入れない ように 気を つける」では ありません。★入れられません。
--
--   ★何度 走らせても 同じに なります（if not exists）。
-- ===========================================================================

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),

  -- ★どちらの 取引か。"subscription"（毎月）／"purchase"（買い切り）
  kind text not null,

  -- ★お支払いの 会社の 番号。★人の 名前では ありません。
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

  -- ★いつ 切り離したか。★7年の 起点では ありません。
  --   ★★7年は「取引の 日」から 数えます（★税の 帳簿の 決め）。
  severed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ★同じ 契約を 2度 入れません。★退会のやり直しで 二重に ならない ため。
create unique index if not exists payment_records_sub_uniq
  on public.payment_records (stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists payment_records_session_uniq
  on public.payment_records (stripe_session_id)
  where stripe_session_id is not null;

-- ===========================================================================
-- ★権限 ── ★誰にも 見せません
--
--   ★この表は 帳簿です。★画面に 出す ものでは ありません。
--   ★★revoke を 先に します（★2026-09-15 の 決め）。
--     ★あとに すると、★古い 許しが policy 無しで 残る 隙が できます。
-- ===========================================================================

revoke all on public.payment_records from anon, authenticated;

alter table public.payment_records enable row level security;
alter table public.payment_records force row level security;

-- ★policy を 1つも 作りません。
--   ★★RLS が 立ち、policy が 無ければ、★誰も 読めません。
--   ★service_role だけが 素通りします（★退会の 道）。
--   ★★「読める 道を 作って おいて 気を つける」より、
--     ★「道が 無い」ほうが 確かです（★cycle_periods と 同じ 考え）。

grant insert, select on public.payment_records to service_role;

comment on table public.payment_records is
  '退会後も法律で7年保存する取引の記録。user_id の列を持たない（切り離し済み）。';
