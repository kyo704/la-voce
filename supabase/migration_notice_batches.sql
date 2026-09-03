-- ============================================================================
-- お知らせの束と、その宛先（TASK A・2026-09-03）
--
--   ★なぜ、宛先を凍らせるのか
--     いまの仕組みは cohort をその場で読んで宛先を決めます。
--     ★送ったあとに cohort が変わると、「誰に送ったか」が後から変わります。
--       ・先行公開が終わって tester → general に移した
--       ・あとから is_internal を立てた
--     ★届かなかった方を探すときに、その人が一覧から消えていたら、
--       永久に見つかりません。
--     だから、決めた時点の id をそのまま保存し、cohort は二度と読み直しません。
--
--   ★3つの条件（Opus の裁定）
--     ① 束は type を持ちます。この同意のお知らせは、その1例にすぎません。
--        ★「A-2の再同意」専用の列を作りません。次で作り直しになります。
--     ② 宛先の状態を★上書きしません。時刻の列を並べ、それぞれ一度だけ。
--        ★「送った」を「開いた」で上書きすると、送った事実が消えます。
--     ③ 退会された方の宛先の行は★消えます（その方のことだからです）。
--        束は frozen_count だけを持ち、★個々の削除に影響されません。
--
--   ★読む側（共通ゲート E）
--     lib/noticeBatches.js の targetStage / canResend / freezeTargets /
--     batchSummary が読みます。★表と同じ日に書きました。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 束
-- ---------------------------------------------------------------------------
create table if not exists public.notice_batches (
  id           uuid primary key default gen_random_uuid(),
  -- ★型。専用の表にしないための列です。
  type         text not null,
  -- 運営が見分けるための短い名前。★利用者には見せません。
  label        text,
  -- ★決めた時点の人数。動かしません。
  --   いま残っている宛先を数えると、退会のたびに★過去が変わります。
  frozen_count integer not null default 0,
  frozen_at    timestamptz,
  created_at   timestamptz not null default now()
);

comment on table public.notice_batches is
  'お知らせの束。宛先を決めた時点で凍らせ、以後 cohort を読み直さない。frozen_count は決めた時点の人数で、個々の退会では動かさない。';
comment on column public.notice_batches.type is
  'お知らせの種類（consent_renewal / policy_update / feature / maintenance / research）。★この束専用の列を作らないための列。';

-- ---------------------------------------------------------------------------
-- ② 宛先
--
--   ★状態の列を持ちません。時刻の列を並べます。
--     それぞれ一度だけ入り、★二度と消しません。
-- ---------------------------------------------------------------------------
create table if not exists public.notice_targets (
  id            uuid primary key default gen_random_uuid(),
  batch_id      uuid not null references public.notice_batches(id) on delete cascade,
  -- ★退会されたら、この行は消えます。その方のことだからです。
  user_id       uuid not null references auth.users(id) on delete cascade,
  sent_at       timestamptz,
  opened_at     timestamptz,
  progressed_at timestamptz,
  created_at    timestamptz not null default now(),
  -- ★同じ束に同じ人が二度入らないように。
  unique (batch_id, user_id)
);

comment on table public.notice_targets is
  'お知らせの宛先。★決めた時点の id をそのまま保存する。退会で行ごと消える。';
comment on column public.notice_targets.sent_at is
  '送った時刻。★一度だけ入れ、二度と消さない。opened_at で上書きしないこと（送った事実が消えます）。';

create index if not exists notice_targets_batch_idx on public.notice_targets(batch_id);
create index if not exists notice_targets_user_idx  on public.notice_targets(user_id);

-- ---------------------------------------------------------------------------
-- ③ RLS
--
--   ★束は、利用者に見せません。運営だけのものです。
--     ポリシーを1本も作らず、RLS を有効にします。
--     ★これで、匿名キーでも通常のログインでも1行も読めません。
--     service_role（サーバ側）だけが触れます。
--     ★account_deletions と同じ考え方です。
--
--   ★宛先は、本人だけが自分の行を読めます。
--     「あなたに届いているお知らせ」を画面に出すためです。
--     ★書けません（select だけ）。開いた・応じたはサーバ側で入れます。
--       画面から書けると、押していないのに「開いた」ことにできます。
-- ---------------------------------------------------------------------------
alter table public.notice_batches enable row level security;
alter table public.notice_targets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'notice_targets'
       and policyname = 'Users can view own notice targets'
  ) then
    create policy "Users can view own notice targets"
      on public.notice_targets for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ④ 確かめる
-- ---------------------------------------------------------------------------
select table_name as "表" from information_schema.tables
 where table_schema = 'public' and table_name in ('notice_batches','notice_targets')
 order by 1;
-- ★2行返ること。

select tablename as "表", policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename in ('notice_batches','notice_targets')
 order by 1, 2;
-- ★notice_targets の select が1本だけ。notice_batches は★0本であること。

select c.relname as "表", c.relrowsecurity as "RLS が有効か"
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname in ('notice_batches','notice_targets');
-- ★両方 true であること。

-- ★退会したときに宛先が消えることの確認（なりすまし・rollback します）
-- begin;
--   insert into public.notice_batches (type, label) values ('consent_renewal','試し')
--     returning id;
--   -- 上の id と、試しに使ってよい利用者の id で1行入れてから
--   -- その利用者を消し、notice_targets の行が消えることを確かめてください。
-- rollback;
