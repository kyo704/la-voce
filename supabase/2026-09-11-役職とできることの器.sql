-- ============================================================================
-- 役職と「できること」の 器（★権限の 作り直し・★1段目）
--
--   ★出どころ docs/design/pack-final/裁定-9月10日夜の7点（役職への一本化ほか）.md §7
--            docs/opus/引き継ぎ-最終稿として作るときの注意（9月10日）.md §3
--              「★見本の とおりに 作ってほしい もの
--                ★① 役職と できることの 表（PERM × POSTS）
--                ★②「学校ぜんぶに かかることは、自分が 持っていないと 渡せません」」
--            見本 00-動く見本（さわれる・全画面）.html の var PERM / var POSTS
--
--   ★★これは 3段の うちの 1段目です（★坂本さんの お決め・2026-09-11）。
--       ★1段目　★見えないものを 先に 作る　← ★★いま ここ
--       ★2段目　★入口を 増やす（★役職の 一覧・中身の 画面）
--       ★3段目　★権限を 最後に（★門を 締める）
--     ★★3段 ぜんぶを 続けて やります。★1段目で 止めません。
--       ★読むだけで 誰も 書かない 列を 置き去りに しない ため
--       （★slotCounts と 同じ 形に しない ため）。
--
--   ★★いまの 4つの 役割（owner／admin／teacher／staff）は、★消しません。
--     ★★3段目で 切り替えるまで、★いまの 画面は これまでどおり 動きます。
--     ★誰も 締め出されません。
--
--   ★★何度 流しても 安全です。
-- ============================================================================


-- ----------------------------------------------------------------------------
-- §0 いまの ようす（★読むだけ）
-- ----------------------------------------------------------------------------
select
  '実行前' as いつ,
  (select count(*) from information_schema.tables
     where table_schema='public' and table_name='org_posts') as 役職の表,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='memberships' and column_name='post_id') as 名簿の役職欄,
  (select count(*) from public.organizations) as 学校,
  (select count(*) from public.memberships) as 名簿の行;


-- ----------------------------------------------------------------------------
-- §1 役職の 表
--
--   ★★役職は 学校ごとです。★学校の 中でだけ 通じる 呼び名です。
--     ★見本の 10（学長・副学長・事務長・学部長・学科長・教授・准教授・講師・
--     　課長・職員）は「はじめの ひな型」であって、決まりでは ありません。
--
--   ★★できることは jsonb に しまいます。
--     ★列に しません。★見本の 14 が 増えたり 減ったり します。
--     ★列に すると、★増えるたびに 移行が 要ります。
--     ★★中身の 正は lib/opsPerms.js です（★2段目で 置きます）。
-- ----------------------------------------------------------------------------
create table if not exists public.org_posts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,

  -- ★画面に 出る 呼び名（★「学長」「主任」など）
  name        text not null check (char_length(name) between 1 and 40),

  -- ★★できること。★{"meibo": true, "bill": true} の 形です。
  --   ★★true の ものだけ 入れます。★false を 並べません。
  --     ★「持っていない」と「false と 書いた」を 2つの 形に しない ため。
  perms       jsonb not null default '{}'::jsonb,

  -- ★並び順（★画面に 出す 順）
  sort_order  integer not null default 0,

  created_at  timestamptz not null default now(),

  -- ★1つの 学校の 中で、★同じ 呼び名は 1つだけ
  unique (org_id, name)
);

comment on table public.org_posts is
  '学校ごとの役職と、その役職ができること。役割（owner/admin/…）を置き換える。裁定 9月10日夜 §7。';


-- ----------------------------------------------------------------------------
-- §2 名簿の 行に、役職を 付ける 欄
--
--   ★★いまの role は 消しません。★3段目まで 使います。
--   ★★埋め戻しません。★ぜんぶ null の ままです。
--     ★「役職を 決めていない」と「学長です」は 別の ことです。
-- ----------------------------------------------------------------------------
alter table public.memberships
  add column if not exists post_id uuid references public.org_posts(id) on delete set null;

comment on column public.memberships.post_id is
  '役職。null は「まだ決めていない」。決まるまでは role が効く（3段目で切り替え）。';

-- ★★役職が 消えたら、★その方の 行は 残し、役職だけ 外れます（on delete set null）。
--   ★★人を 消しません。★これが「1件も 取り上げない」の 形です。


-- ----------------------------------------------------------------------------
-- §3 引きやすく する
-- ----------------------------------------------------------------------------
create index if not exists org_posts_org_idx
  on public.org_posts (org_id, sort_order, name);

create index if not exists memberships_post_idx
  on public.memberships (post_id)
  where post_id is not null;


-- ----------------------------------------------------------------------------
-- §4 ★★ひな型を 入れません
--
--   ★見本には 10の 役職が ありますが、★ここでは 1行も 作りません。
--   ★★学校ごとに ちがう ものだからです。
--     ★音大に「課長」が 要るとは 限りません。
--     ★養成所に「学部長」は いません。
--   ★★画面（2段目）で、その学校の 方が 押したときに 作ります。
--     ★そのほうが、★誰が いつ 作ったかが 残ります。
--     ★★こちらで 勝手に 作ると、★消していいのか 分からなく なります。
-- ----------------------------------------------------------------------------
-- （ここには 何も 書きません。それが 決めです。）


-- ----------------------------------------------------------------------------
-- §5 権限 ── ★★いまは 読むだけ
--
--   ★★坂本さんの お決め（2026-09-11）
--     「見えないものを 先に 作る → 入口を 増やす → 権限を 最後に」
--   ★★だから ここでは 書く 権限を 渡しません。
--     ★2段目で 画面を 作り、★3段目で 書けるように します。
--
--   ★先に 取り上げてから、必要な ぶんだけ 渡します。
-- ----------------------------------------------------------------------------
revoke all on public.org_posts from anon;
revoke all on public.org_posts from authenticated;

grant select on public.org_posts to authenticated;
-- ★insert・update・delete は 渡しません（★3段目まで）。

alter table public.org_posts enable row level security;
alter table public.org_posts force row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname='public' and tablename='org_posts'
       and policyname='同じ学校の人だけ役職を読める'
  ) then
    -- ★★その学校に 名簿の 行が ある 方だけ 読めます。
    --   ★★役職の 名前は、★健康の ことでは ありません。
    --     ★けれど、よその 学校の 形を 見られる 必要も ありません。
    create policy "同じ学校の人だけ役職を読める"
      on public.org_posts
      for select
      to authenticated
      using (exists (
        select 1 from public.memberships m
         where m.org_id = org_posts.org_id
           and m.user_id = auth.uid()
      ));
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- §6 確かめ（★読むだけ）
-- ----------------------------------------------------------------------------
select
  '実行後' as いつ,
  (select count(*) from public.org_posts) as 役職の行,
  (select count(*) from public.memberships where post_id is not null) as 役職が入った行,
  (select count(*) from pg_policies
     where schemaname='public' and tablename='org_posts') as 面の数,
  (select string_agg(privilege_type, '・' order by privilege_type)
     from information_schema.role_table_grants
    where table_schema='public' and table_name='org_posts' and grantee='authenticated') as 画面に渡した権限;

-- ★★期待する 答え
--   役職の行　　　　 … 0   ← ★ひな型を 入れていない こと
--   役職が入った行　 … 0   ← ★埋め戻していない こと
--   面の数　　　　　 … 1
--   画面に渡した権限 … SELECT   ← ★これ 1つだけ（★3段目で 増やします）
