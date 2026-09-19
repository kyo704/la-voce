-- ============================================================================
-- ★ご請求の 宛名・宛先 ── ★見本 `P_seikyuNa` ／ `P_atesaki`（★2026-09-19）
--
--   ★★★裁定 その74 ／ その74B。★裁定 その97 で「機能まで」と 決まりました。
--
--   ★★★直す ところ 3つ
--     ★① 列を 足す（請求書の 部署・ご担当）
--     ★② 変えた 記録を しまう 表（★消せません）
--     ★③ **書く 門を 直す** ── ★いまは `bill`（見る）で 書けます
--       ★★見本は はっきり 言って います ──
--         ★「変えられるのは bill_pay だけです。見るだけの 方には、この 画面が 出ません」
--       ★★★見る できこと で 書けて いました。★分けて ある ものを 1つに して いました。
--
--   ★★カード番号・口座番号は、★1つも 置きません。★列が ありません。
--     ★★入れる ところが 無ければ、★入りません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 列（★請求書の 宛名まわり）
-- ---------------------------------------------------------------------------
alter table public.org_billing add column if not exists bill_dept text;
alter table public.org_billing add column if not exists bill_contact text;

comment on column public.org_billing.bill_dept    is '請求書の 部署（れい：総務課）';
comment on column public.org_billing.bill_contact is '請求書の ご担当の お名前';

-- ---------------------------------------------------------------------------
-- ★② 変えた 記録（★消せません）
-- ---------------------------------------------------------------------------
--   ★★誰が・いつ・何を。★`update` も `delete` も 渡しません。
--   ★★★役職の 記録（`post_change_log`）と 同じ 形 です。
create table if not exists public.org_billing_log (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  actor_id   uuid references auth.users(id) on delete set null,
  what       text not null,
  created_at timestamptz not null default now()
);
create index if not exists org_billing_log_org_idx
  on public.org_billing_log (org_id, created_at desc);

alter table public.org_billing_log enable row level security;

revoke all on public.org_billing_log from anon, authenticated;
-- ★★★読むのは `bill`（見る）で 足ります。★書けるのは `bill_pay` だけ です。
--   ★★消す・直すは 誰にも 渡しません。★記録は 消せません。
grant select, insert on public.org_billing_log to authenticated;

drop policy if exists org_billing_log_select on public.org_billing_log;
create policy org_billing_log_select on public.org_billing_log
  for select to authenticated
  using (has_can(org_id, 'bill'));

drop policy if exists org_billing_log_insert on public.org_billing_log;
create policy org_billing_log_insert on public.org_billing_log
  for insert to authenticated
  with check (has_can(org_id, 'bill_pay') and actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ★③ 書く 門を 直す ── ★`bill` → `bill_pay`
-- ---------------------------------------------------------------------------
--   ★★読むのは これまで どおり `bill` です。★変えません。
drop policy if exists org_billing_update_bill on public.org_billing;
create policy org_billing_update_bill on public.org_billing
  for update to authenticated
  using (has_can(org_id, 'bill_pay'))
  with check (has_can(org_id, 'bill_pay'));

drop policy if exists org_billing_insert_bill on public.org_billing;
create policy org_billing_insert_bill on public.org_billing
  for insert to authenticated
  with check (has_can(org_id, 'bill_pay'));

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select polname, polcmd, pg_get_expr(polqual, polrelid),
--          pg_get_expr(polwithcheck, polrelid)
--   from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname in ('org_billing', 'org_billing_log');
--
--   ★`org_billing` …… 読む `bill` ／ 書く `bill_pay`
--   ★`org_billing_log` …… 読む `bill` ／ 足す `bill_pay`。★直す・消すは 無し
