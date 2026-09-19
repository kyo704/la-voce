-- ============================================================================
-- ★学校の 形（学部・学科・分野）── ★裁定 その98 BLOCKER_1（★2026-09-19）
--
--   ★★★「学部・学科・分野」という 日本の 音大の 形を、★構えに 埋め込みません。
--     ★★`parent_id` で つなぎます。★深さは 学校が 決めます。
--     ★★★別の 国・別の 学校が、★別の 形を 作れます。
--
--   ★★選べる ものは、★学校ごとに ちがいます。★だから 別の 表に します。
--     ★★`memberships.division_id` が、★その方の いま を 指します。
--
--   ★★★決まり（RLS）
--     ★読む …… ★その 学校に いま 在る 方（`enrollments` の `active`）
--       ★★★＋ 名簿の できこと（`meibo`）を 持つ 方
--         ★★裁定の 文は「在籍者」だけ でした。
--         ★★けれど 事務の 方は、★在籍者では ありません（★働く 方 です）。
--         ★★★読めないと、★ご自分が 直した ものを 見られません。
--           ★★書けるのに 読めない 表に なります。★それは 使えません。
--     ★書く …… ★`meibo` だけ。★`using` と `with check` の 両方に 置きます
--       ★★`with check` が 無いと、★よその 学校の `org_id` で 作れます。
--       ★★`using (true)` は 書きません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create table if not exists public.org_divisions (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  -- ★'faculty'（学部・研究科）／'department'（学科・コース）／'field'（事務の 分野）
  kind       text not null check (kind in ('faculty', 'department', 'field')),
  name       text not null,
  -- ★上の もの（★学部 → 学科）。★null なら いちばん 上 です。
  parent_id  uuid references public.org_divisions(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists org_divisions_org_idx
  on public.org_divisions (org_id, kind, sort_order);
create index if not exists org_divisions_parent_idx
  on public.org_divisions (parent_id);

-- ★★その方の いま（★名簿・役職の 画面が 使います）。
alter table public.memberships
  add column if not exists division_id uuid references public.org_divisions(id);

alter table public.org_divisions enable row level security;

revoke all on public.org_divisions from anon, authenticated;
grant select, insert, update, delete on public.org_divisions to authenticated;

drop policy if exists org_divisions_select on public.org_divisions;
create policy org_divisions_select on public.org_divisions
  for select to authenticated
  using (
    has_can(org_id, 'meibo')
    or exists (
      select 1 from public.enrollments e
      where e.org_id = org_divisions.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
  );

drop policy if exists org_divisions_write on public.org_divisions;
create policy org_divisions_write on public.org_divisions
  for all to authenticated
  using (has_can(org_id, 'meibo'))
  with check (has_can(org_id, 'meibo'));

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select polname, polcmd, pg_get_expr(polqual, polrelid),
--          pg_get_expr(polwithcheck, polrelid)
--   from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname = 'org_divisions';
--
--   ★読む …… `meibo` か、いま 在る 在籍者
--   ★書く …… `meibo`。★`using` と `with check` の 両方に あります
