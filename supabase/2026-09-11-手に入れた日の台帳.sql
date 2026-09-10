-- ============================================================================
-- J05「台帳（もっているもの）」── いつ 手に入ったかと、そのときの 数
--
--   ★出どころ docs/design/pack-final/screens/J05-台帳.txt
--     「いつ 手に入ったかと、そのときの 数が 残ります。」
--     「記録を 消しても、手に入れたものは なくなりません。」
--     「数え直して 減ることは ありません。」
--     「いちど あなたのものに なったものは、あなたのものです。」
--
--   ★★なぜ 急ぐか。
--     いまは、手に入れた 日を どこにも 残していません。
--     きょう 手に入った ものの 日は、きょうしか 分かりません。
--     あとから 埋められない 種類の ものです。
--     ★★だから、この 表だけを 先に 作ります。画面は あとで 追いつきます。
--
--   ★★なぜ character_inventory に 列を 足さないか。
--     ① 手に入る 道は 3つ あります。
--        ・買う（/api/character/buy）      → character_inventory に 行が 立つ
--        ・贈られる（/api/character/gift）  → character_inventory に 行が 立つ
--        ・開く（computeUnlocked）          → ★行が 立ちません。その場で 計算しています
--        見本の J05 には「燕尾服　8月24日　本番 3回」が 並びます。
--        燕尾服は ★開く 側の ものです。列を 足すだけでは、載せられません。
--     ② では 開いた ものを character_inventory に 入れれば よいか。
--        ★★贈りものの 数え方は、★壊れません。確かめました。
--          box2ReceivedCount() は 行数では なく BOX2_KEYS(62) との
--          一致を 数えており、開く 品の 鍵 5つ
--          （propBouquet・tailcoat・propBaton・propMetronome・hatCamellia）
--          とは、★重なりが 0 です。
--        ★★それでも 入れないのは、別の 理由です。
--          いま「何を 持っているか」は、
--            ・買った/贈られた … character_inventory の 行
--            ・開いた       … computeUnlocked() の その場の 計算
--          の 2つで 決まります。★開いた ものを 行にも すると、
--          同じ ことを 2か所が 言う ことに なります。
--          ★片方だけ 直る、という このリポジトリで 何度も 起きた 形です。
--     ③ もう1つ。★この 表は「足すだけ」に したい ものです。
--        そのためには update と delete の 権限を 取り上げます。
--        ★38人が 現に 使っている character_inventory の 権限を、
--          いま 触るのは、避けたい ところです。
--     ★★だから、持ち物とは 別の 表に します。
--       「何を 持っているか」は これまでどおり character_inventory と
--       computeUnlocked が 決めます。この 表は 決めません。
--       この 表が 持つ 決めは、★「いつ・どの 道で・そのときの 数」だけです。
--
--   ★★安全のために、この表は ★足すだけの 表に します。
--     ・書き換える 道を 作りません（update の 権限も、ポリシーも 作りません）
--     ・消す 道を 作りません（delete の 権限も、ポリシーも 作りません）
--     ・(user_id, item_key) に 一意の 縛りを 掛けます
--       → 2度目の 書き込みは on conflict do nothing で 落ちます。
--         ★「数え直して 減ることは ありません」が、文章では なく 形に なります。
--     ・画面（ブラウザ）に 与えるのは ★select だけです。
--       書くのは サーバの 道（service role）だけです。
--
--   ★★何度 流しても 安全です。
--
--   ★実行前に、いまの ようすを 見ます（下の §0）。
-- ============================================================================


-- ----------------------------------------------------------------------------
-- §0 いまの ようす（★読むだけ。何も 変わりません）
-- ----------------------------------------------------------------------------
select
  '実行前' as いつ,
  (select count(*) from information_schema.tables
     where table_schema = 'public' and table_name = 'item_acquisitions') as 台帳の表,
  (select count(*) from public.character_inventory) as 持ち物の行,
  (select count(distinct user_id) from public.character_inventory) as 持っている方;


-- ----------------------------------------------------------------------------
-- §1 表を 作る
-- ----------------------------------------------------------------------------
create table if not exists public.item_acquisitions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_key    text not null,

  -- ★手に入れた 日。★日本の 日付です。
  --   ★★current_date を 既定に しません。
  --     Supabase の いまは UTC です。夜に 買うと、前の日に なります。
  --     ★日は アプリの 側（JST）で 決めて、ここへ 渡します。
  acquired_on date not null,

  -- ★どの 道で 手に入ったか
  --   shop   … 点で 買った
  --   gift   … 贈りもの（箱②）
  --   unlock … 条件が 開いた
  acquired_by text not null
    check (acquired_by in ('shop', 'gift', 'unlock')),

  -- ★そのときの 数。★見本の「記録 60日」「本番 3回」の ところです。
  --   ★★ここに 入った 数は、★二度と 計算し直しません。
  --     記録を 消されても、この 数は 動きません。
  --     それが「数え直して 減ることは ありません」の 意味です。
  count_kind  text
    check (count_kind in ('record_days', 'performances')),
  count_value integer
    check (count_value >= 0),

  created_at  timestamptz not null default now(),

  -- ★1つの 品は、1人に つき 1度だけ。
  --   ★★2度目の 書き込みを、on conflict do nothing で 静かに 落とすための 縛りです。
  --     ★これが 無いと、押し直しで 日が 上書きされます。
  unique (user_id, item_key)
);

comment on table public.item_acquisitions is
  'J05 台帳。いつ・どの道で・そのときの数。足すだけ。持ち物の正は character_inventory。';


-- ----------------------------------------------------------------------------
-- §2 引きやすく する
--    ★台帳は「新しい順」に 並べます。
-- ----------------------------------------------------------------------------
create index if not exists item_acquisitions_user_date_idx
  on public.item_acquisitions (user_id, acquired_on desc, created_at desc);


-- ----------------------------------------------------------------------------
-- §3 権限 ── ★先に 取り上げてから、必要な ぶんだけ 渡します
--
--   ★★順番に 意味が あります。
--     あとから revoke すると、その あいだ 広い 権限が 立ったままに なります。
--   ★★update と delete は、★渡しません。
--     渡さない ものは、ポリシーの 書き間違いで 開くことも ありません。
-- ----------------------------------------------------------------------------
revoke all on public.item_acquisitions from anon;
revoke all on public.item_acquisitions from authenticated;

grant select on public.item_acquisitions to authenticated;
-- ★insert は 渡しません。書くのは サーバの 道（service role）だけです。
-- ★update・delete も 渡しません。


-- ----------------------------------------------------------------------------
-- §4 行の 面（RLS）
--
--   ★自分の 行だけ。★1つだけ。
--   ★先生の ための 面を 作りません。運営の ための 面も 作りません。
--     ★★「見えない」を、経路が 無い ことで 保ちます。
-- ----------------------------------------------------------------------------
alter table public.item_acquisitions enable row level security;
alter table public.item_acquisitions force row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename  = 'item_acquisitions'
       and policyname = '自分の台帳だけ読める'
  ) then
    create policy "自分の台帳だけ読める"
      on public.item_acquisitions
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

-- ★★insert・update・delete の ポリシーは、★1つも 作りません。
--   ★force row level security を 掛けたので、
--     表の 持ち主から の 読み書きにも 面が かかります。
--     service role は これを 越えます（それが 唯一の 書き口です）。


-- ----------------------------------------------------------------------------
-- §5 いま 持っている ものは、どう するか
--
--   ★★1行も 入れません。
--     いま character_inventory に ある 行の「手に入れた 日」は、
--     どこにも 残っていません。★分からない ものを、
--     きょうの 日で 埋めると、★嘘の 台帳に なります。
--   ★★画面の 側で「いつ 手に入ったかは、残っていません」と 出します。
--     「日が 無い」と「きょう もらった」は、別の ことです。
--   ★これは、坂本さんの お決め（★埋め戻さない／読むときに 決める）どおりです。
-- ----------------------------------------------------------------------------
-- （ここには 何も 書きません。それが 決めです。）


-- ----------------------------------------------------------------------------
-- §6 確かめ（★読むだけ）
-- ----------------------------------------------------------------------------
select
  '実行後' as いつ,
  (select count(*) from public.item_acquisitions) as 台帳の行,
  (select count(*) from pg_policies
     where schemaname = 'public' and tablename = 'item_acquisitions') as 面の数,
  (select string_agg(privilege_type, '・' order by privilege_type)
     from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name   = 'item_acquisitions'
      and grantee      = 'authenticated') as 画面に渡した権限;

-- ★★期待する 答え
--   台帳の行        … 0
--   面の数          … 1
--   画面に渡した権限 … SELECT   ← ★これ 1つだけで あること。
--                      INSERT や UPDATE が 混じっていたら、お知らせください。
