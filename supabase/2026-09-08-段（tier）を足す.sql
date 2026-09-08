-- ============================================================================
-- 段（tier）を、subscriptions に 足します（2026年9月8日）
--
--   ★★いま subscriptions は status（trialing／active／…）だけで、
--     ★「無料／¥580／¥1,280」の どれかを 見分けられません。
--   ★★2色目を 選べる方の 判定が、★門の名簿での 暫定に なっています。
--     ★段が 入れば、★lib 1か所を 差し替えて 正式な判定に できます。
--
--   ★★何度 実行しても 安全です（if not exists ／ do $$ で 包んでいます）。
--   ★★いまある行を、★1件も 書き換えません。
--     ★★埋めません（backfill しません）。★null のままにします。
--       ★「選んでいない」と「無料を選んだ」を、★見分けられなくなるためです。
--       ★読むときに 決めます（★null は 無料として 扱います）。
-- ============================================================================

-- ★① 段の 列を 足します。
alter table public.subscriptions
  add column if not exists tier text;

-- ★② 入ってよい値を、3つに 限ります。
--    ★null も 許します（★まだ 決まっていない、を 表します）。
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_tier_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_tier_check
      check (tier is null or tier in ('free', 'basic', 'full'));
  end if;
end $$;

-- ★③ どの段かを、★Stripe の値段の鍵からも 引けるようにします。
--    ★★webhook が 書きます。★人の手では 触りません。
alter table public.subscriptions
  add column if not exists stripe_price_id text;

-- ★④ 年払いの 終わりの日。
--    ★★お支払いは「申し込みの日から 1年」です（★2026-09-08 の決め）。
--      ★1月1日は「よそおいの 年のテーマ」が 変わる日であって、
--      ★★お金の日では ありません。★だから 個別に 持ちます。
alter table public.subscriptions
  add column if not exists period_end timestamptz;

-- ★⑤ 引くときに 速いように。
create index if not exists subscriptions_tier_idx
  on public.subscriptions (tier);

-- ============================================================================
-- ★確かめ ── 下を 実行すると、いまの形が 見えます。
--   ★1件も 書き換えません。★読むだけです。
-- ============================================================================
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'subscriptions'
 order by ordinal_position;

select coalesce(tier, '(まだ決めていない)') as tier, count(*) as 件数
  from public.subscriptions
 group by 1
 order by 2 desc;
