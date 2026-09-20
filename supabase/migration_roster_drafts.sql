-- ============================================================================
-- ★名簿の 下書き（★裁定 その109・2026-09-20）
--
--   ★★★校務システムから 読み込んだ、★まだ 口（アカウント）の 無い 方 です。
--     ★★うちの 名簿（`enrollments`）は、★必ず 口に つながって います。
--     ★★だから、★口の 無い 方は ここに 置きます。
--
--   ★★★紐付けは「学籍番号」では しません（★裁定 その109）。
--     ★★番号を 知って いる だけ で 紐付いては いけません。
--     ★★★招待に `draft_id` を 持たせ、★**その 招待を 受け取った 方** で 決めます。
--     ★★番号は、★目で 見て 突き合わせる ため だけ に 使います。
--
--   ★★★消しません。★1年 経った ものは、★画面で 畳むだけ です。
--     ★★入学が 遅れる・休学する ── ★あとから 来る 方が います。
--     ★★消すのは、★事務が 押した とき だけ です。
--
--   ★★★学生は 1行も 引けません。★決まりは `meibo` だけ です。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create table if not exists public.roster_drafts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  student_number text not null,
  name text not null,
  grade_year int,
  division_id uuid references public.org_divisions(id),
  email text,
  imported_at timestamptz not null default now(),
  imported_by uuid not null references auth.users(id),
  invited_at timestamptz,
  linked_user_id uuid references auth.users(id),
  linked_at timestamptz,
  unique (org_id, student_number)
);

create index if not exists roster_drafts_org_idx
  on public.roster_drafts (org_id, imported_at desc);

alter table public.roster_drafts enable row level security;

do $$
begin
  -- ★★★4つ とも 同じ 門 です ── ★名簿の できこと（`meibo`）。
  --   ★★`using` と `with check` の 両方に 置きます。
  --   ★★★片方だけ だと、★読めない 行に 書き込めたり、★書いた 行が
  --     ★★自分では 読めない、という ねじれが 起きます。
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='roster_drafts' and p.polname='roster_drafts_all') then
    create policy roster_drafts_all on public.roster_drafts
      for all using (public.has_can(org_id, 'meibo'))
      with check (public.has_can(org_id, 'meibo'));
  end if;
end $$;

-- ★★★先に 取り上げます。★学生には 何も 渡りません。
revoke all on table public.roster_drafts from public, anon, authenticated;
grant select, insert, update, delete on table public.roster_drafts to authenticated;

-- ---------------------------------------------------------------------------
-- ★招待に、★どの 下書きの ぶんか を 持たせます
-- ---------------------------------------------------------------------------
--   ★★★これが 紐付けの 根拠 です。★番号では ありません。
--     ★★その 招待を 受け取った 方 だけ が、★その 下書きに つながります。

alter table public.teacher_invitations
  add column if not exists draft_id uuid references public.roster_drafts(id) on delete set null;
