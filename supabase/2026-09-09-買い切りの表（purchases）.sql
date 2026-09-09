-- ============================================================================
-- 買い切り（1回払い）の 表 ── purchases（2026年9月9日）
--
--   ★★2026-09-09 の 方向転換
--     ★年払いは「1年間 有効な 利用権の 買い切り」に なりました。
--     ★★subscription（自動更新）では ありません。
--     ★途中で やめる 仕組みは 作りません。★期間中は いつでも 使えます。
--
--   ★★subscriptions とは 別の 表に します。
--     ★★あちらは「毎月 更新される 契約」の 表です。
--     ★こちらは「1度 払って、1年 使える」ものです。
--     ★同じ表に 混ぜると、★status の 意味が 2つに なります。
--
--   ★★行を 消しません。★終わっても 残します。
--     ★「いつ 買って、いつまで 使えたか」は、★あとで 問われます。
--
--   ★★何度 実行しても 安全です。★BEGIN / ROLLBACK で 包みません。
--     ★2026-09-08、★SQL エディタが ROLLBACK を 効かせませんでした。
--   ★★剥がすほうを 先に 書きます（★2026-09-09 の ご報告のとおり）。
--     ★途中の どの姿も、★最後の姿より ゆるく しないこと。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 表
-- ---------------------------------------------------------------------------
create table if not exists public.purchases (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  -- ★何を 買ったか。★lib/plans.js の 名前です（annual など）。
  plan                  text not null,
  -- ★★段（tier）。★lib/tiers.js の free / basic / full。
  --   ★★null は「まだ 決めていない」です。★埋めません。
  tier                  text,
  -- ★Stripe の 控え。★同じ支払いを 2度 数えないために 使います。
  stripe_session_id     text unique,
  stripe_payment_intent text,
  stripe_price_id       text,
  -- ★★そのとき いくらだったか。★あとで 値上げしても、★これは 変わりません。
  amount_yen            integer,
  -- ★★いつから いつまで。★お申し込みの日から 1年です。
  --   ★★1月1日では ありません。★あれは「よそおいの 年のテーマ」が 変わる日で、
  --     ★お金の日では ありません（★2026-09-08 の決め）。
  started_at            timestamptz not null default now(),
  ends_at               timestamptz not null,
  -- ★active ／ expired。★消しません。★終わっても 残します。
  status                text not null default 'active',
  created_at            timestamptz not null default now()
);

comment on table public.purchases is
  '1回払いの 買い切り（★1年間 有効な 利用権）。★subscriptions とは 別。'
  '★行を 消さない。★終わっても 残す（いつ買って いつまで使えたか を 残すため）。';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'purchases_status_check' and conrelid = 'public.purchases'::regclass
  ) then
    alter table public.purchases
      add constraint purchases_status_check check (status in ('active', 'expired'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'purchases_tier_check' and conrelid = 'public.purchases'::regclass
  ) then
    alter table public.purchases
      add constraint purchases_tier_check
      check (tier is null or tier in ('free', 'basic', 'full'));
  end if;
end $$;

create index if not exists purchases_user_idx on public.purchases (user_id);
create index if not exists purchases_active_idx on public.purchases (user_id, ends_at);

-- ---------------------------------------------------------------------------
-- ★② 2枚目 ── 権限（★先に 剥がします）
--
--   ★★ここに 書き込むのは、★webhook（service_role）だけです。
--     ★★お客さまが 自分で 行を 作れては いけません。
--     ★作れると、★払わずに「買った」と 言えます。
--   ★読むのは 本人だけです。
-- ---------------------------------------------------------------------------
revoke all on public.purchases from anon;
revoke insert, update, delete, truncate, trigger, references
  on public.purchases from authenticated;
grant select on public.purchases to authenticated;

-- ---------------------------------------------------------------------------
-- ★③ 行ごとの 見え方
--
--   ★★読むだけです。★書く ポリシーを 作りません。
--     ★★ポリシーが 無ければ、★誰も 書けません（★service_role を 除く）。
--     ★これが「★書けない」を いちばん 確かに します。
-- ---------------------------------------------------------------------------
alter table public.purchases enable row level security;

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ★④ 確かめ（★読むだけ）
-- ---------------------------------------------------------------------------

-- ④-1 ★列（★11行）
select column_name as "列", data_type as "型", is_nullable as "nullを許すか"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'purchases'
 order by ordinal_position;

-- ④-2 ★ポリシーは SELECT の 1枚だけ（★1行）
select policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename = 'purchases'
 order by cmd;

-- ④-3 ★★書く ポリシーが 無いこと（★0行で あること）
select policyname as "★書けるポリシーがあります"
  from pg_policies
 where schemaname = 'public' and tablename = 'purchases'
   and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL');

-- ④-4 ★権限（★anon は 0行。★authenticated は SELECT だけ）
select grantee as "相手", privilege_type as "権限"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'purchases'
   and grantee in ('anon', 'authenticated')
 order by 1, 2;

-- ============================================================================
-- ★このあと
--   ★webhook（app/api/stripe/webhook）が、★checkout.session.completed で
--     ★1行 入れます。★service_role なので、★RLS を 通り抜けます。
--   ★★同じ session を 2度 入れないよう、★stripe_session_id を unique に
--     してあります。★Stripe は 同じ知らせを 2度 送ることが あります。
-- ============================================================================
