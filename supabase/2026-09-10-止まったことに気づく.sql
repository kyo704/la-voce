-- ============================================================================
-- 止まったことに 気づく ── 知らせの 控え（2026-09-10）
--
--   ★出どころ 坂本さんの お決め（2026-09-10）
--     「★keep-alive 失敗時に 運営宛メールを 1通、★1日1通を 上限として」
--
--   ★★Supabase の SQL Editor に、この全文を 貼って 実行してください。
--   ★★何度 実行しても 安全です。
--
-- ----------------------------------------------------------------------------
-- ★★なぜ 表が 要るのか
--   ★「1日1通」を 数えるには、★きょう もう 送ったかを 覚える 場所が 要ります。
--   ★★覚える 場所が 無いと、★落ちつづける あいだ、★毎回 届きます。
--     ★1分ごとに 届く メールは、★誰も 読まなく なります。
--     ★★読まれない 知らせは、★無いのと 同じです。
--
-- ★★1日1通は、★一意の 決まりで 守ります。★数を 数えません。
--   ★（kind, sent_on）を 一意に します。★2通目は、★入りません。
--   ★★if で 数えると、★同時に 2つ 走った ときに 2通 出ます。
--
-- ★★誰の ものでも ありません。★人に ひもづきません。
--   ★だから RLS は「誰にも 開けない」で 十分です。
--   ★書くのは、★service role（定期処理）だけです。
-- ============================================================================

create table if not exists public.system_alerts (
  id uuid primary key default gen_random_uuid(),
  -- ★どの 知らせか（★"keep-alive" など）。
  kind text not null,
  -- ★送った日（★日本時間の 日付）。
  sent_on date not null,
  -- ★何が あったか。★短く。★中身に 個人のことを 入れません。
  detail text,
  created_at timestamptz not null default now(),
  -- ★★1日1通。★数えずに、★決まりで 守ります。
  constraint system_alerts_once_a_day unique (kind, sent_on)
);

comment on table public.system_alerts is
  '止まったことの知らせの控え。★1日1通を（kind, sent_on）の一意で守ります。'
  '★人にひもづきません。★書くのは定期処理（service role）だけです。';

-- ---------------------------------------------------------------------------
-- ★権限。★剥奪が 先です。
--   ★★誰にも 開けません。★service role だけが 触ります。
-- ---------------------------------------------------------------------------
revoke all on public.system_alerts from anon;
revoke all on public.system_alerts from authenticated;

alter table public.system_alerts enable row level security;

-- ★★ポリシーを 1つも 作りません。
--   ★RLS が 有効で、★ポリシーが 無ければ、★誰にも 見えません。
--   ★service role は RLS を 通り抜けます。★定期処理だけが 書けます。
--   ★★これが「板を 2枚」の 形です。★権限も 落とし、★ポリシーも 置きません。

-- ---------------------------------------------------------------------------
-- ★確かめ。★読むだけです。
-- ---------------------------------------------------------------------------
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'system_alerts')   as "表 (1が正しい)",
  (select count(*) from pg_policies where tablename = 'system_alerts') as "ポリシー (0が正しい)",
  (select count(*) from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'system_alerts'
      and grantee in ('anon','authenticated'))                        as "anon/authenticated の権限 (0が正しい)",
  (select count(*) from pg_constraint where conname = 'system_alerts_once_a_day')
                                                                      as "1日1通の決まり (1が正しい)";
