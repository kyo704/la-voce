-- ============================================================================
-- ★経歴（ポートフォリオ）の 台帳 ── ★裁定 その94 §10 ①（★2026-09-19）
--
--   ★★★順番の 決め（★坂本さんの お決め）──
--     ★① 見えない 構え（表）　★② 入口　★③ 許し
--   ★★これは ① です。★入口は まだ 作りません。
--     ★★許しは、★**いちばん 狭い ところ** から 始めます ── ★ご本人 だけ。
--     ★★学校の 中に 見せる 枝は、★画面が できて から 足します。
--
--   ★★★置かない 列（★裁定 その94 §7）
--     ★住所 ／ 電話 ／ 生年月日 ／ 年齢 ／ 学年 ／ 入学年
--     ★通って いる 教室 ／ 時間割
--     ★★★「若いと 分かる もの」を 置きません。
--       ★★狙う 側は、★実在の ご本人 です。★本人確認でも 年齢制限でも 止まりません。
--
--   ★★住む ところ を 置きません。★「よく 演奏する ところ」を 置きます。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 経歴の 1枚（★お一人 1行）
-- ---------------------------------------------------------------------------
create table if not exists public.portfolios (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  -- ★芸名で かまいません（★裁定 その94 §7 ── `name(芸名可)`）。
  display_name text,
  -- ★声種・楽器（★見本 ──「テノール」）。
  instrument   text,
  -- ★じぶんの ことば（★400字まで。★画面で 見ます。★台帳では 切りません）。
  bio          text,
  -- ★よく 演奏する ところ（★住む 県では ありません）。
  regions      text[] not null default '{}',
  -- ★公開の 範囲 ── ★はじめは「自分だけ」。
  visibility   text not null default 'self'
    check (visibility in ('self', 'school', 'link')),
  -- ★URL の 鍵。★`link` の ときに 使います。★いまは 出口が ありません。
  public_slug  text unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ★② 経歴の 箇条（★学んだところ ／ 賞 ／ 師事）
-- ---------------------------------------------------------------------------
--   ★★★賞の 有無で 並べ替えません。★`sort_order` は ご本人の 並べ方 です。
create table if not exists public.portfolio_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('school', 'award', 'teacher')),
  title      text not null,
  detail     text,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists portfolio_entries_user_idx
  on public.portfolio_entries (user_id, kind, sort_order);

-- ---------------------------------------------------------------------------
-- ★③ 許し ── ★いちばん 狭い ところ から
-- ---------------------------------------------------------------------------
--   ★★取り上げが 先、★渡すのが あと（★蔵の 決め）。
--     ★★列の `grant` は 表の `grant` を 狭めません。★広い ほうが 勝ちます。
--   ★★`truncate` を 渡しません（★2026-09-18 の 取り上げと 同じ 形）。
alter table public.portfolios        enable row level security;
alter table public.portfolio_entries enable row level security;

revoke all on public.portfolios        from anon, authenticated;
revoke all on public.portfolio_entries from anon, authenticated;
grant select, insert, update, delete on public.portfolios        to authenticated;
grant select, insert, update, delete on public.portfolio_entries to authenticated;

drop policy if exists portfolios_own on public.portfolios;
create policy portfolios_own on public.portfolios
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists portfolio_entries_own on public.portfolio_entries;
create policy portfolio_entries_own on public.portfolio_entries
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ★④ 確かめ
-- ---------------------------------------------------------------------------
--   select c.relname, p.polname, pg_get_expr(p.polqual, p.polrelid)
--   from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname in ('portfolios', 'portfolio_entries');
--
--   ★どちらも `user_id = auth.uid()` の 1本 だけ の はず です。
--
--   select table_name, privilege_type from information_schema.role_table_grants
--   where table_schema='public' and grantee='authenticated'
--     and table_name in ('portfolios','portfolio_entries');
--
--   ★`TRUNCATE` が 無い ことを ご覧ください。
