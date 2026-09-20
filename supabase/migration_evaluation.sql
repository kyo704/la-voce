-- ============================================================================
-- ★採点（★裁定 その105・2026-09-20）── ★型と 点と 直した 記録
--
--   ★★★3つの 表 です。
--     ①`evaluation_items` …… ★評価の 型（★項目・満点・きざみ）
--     ②`evaluation_scores` …… ★点（★審査員ごと）
--     ③`score_log` …… ★確定の あとの 直しの 記録（★消せません）
--
--   ★★★見える 範囲（★裁定 §Q1）
--     ★審査員 …… ★ご自分の 点。★ほかの 審査員の 点は、★つけ終わるまで 見えません
--     ★事務・学長（`saiten`）…… ★ぜんぶ 見えます
--     ★学生 …… ★**確定の あと** の、★ご自分の 点 だけ（★裁定 §Q2）
--
--   ★★★出さない もの（★裁定 §Q1）
--     ★順位 ／ 平均との 差 ／ 偏差値 ／ 分布の 中の 位置
--     ★★合計・平均は 出して よい。★ただし くらべる 表に しません。
--     ★★★既定の 並びは 学籍番号順。★点の 順に 並べ替えません。
--
--   ★★★型を 決めるのは 学校 です（★裁定 §Q3・裁定その70 の まま）。
--     ★先生は 見るだけ。★点が 入った あとは 型を 変えられません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 評価の 型
-- ---------------------------------------------------------------------------
create table if not exists public.evaluation_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- ★★どの 行事の ものか（★`null` なら 学校ぜんぶ の 型）。
  event_id uuid references public.org_events(id) on delete cascade,
  name text not null,
  max_points numeric(5,2) not null,
  -- ★★きざみ …… 1 ／ 0.5（★「整数のみ」は 1 と 同じ です）。
  step numeric(3,2) not null default 1,
  -- ★★審査員への 説明（★任意）。
  note text,
  -- ★★「使わない に する」── ★点は 残ります。★集計に 入りません。
  in_use boolean not null default true,
  ord integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evaluation_items_max_check check (max_points > 0 and max_points <= 1000),
  constraint evaluation_items_step_check check (step in (0.5, 1))
);

-- ---------------------------------------------------------------------------
-- ★② 点
-- ---------------------------------------------------------------------------
create table if not exists public.evaluation_scores (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.org_events(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.evaluation_items(id) on delete cascade,
  -- ★★審査員（★つけた 方）。
  judge_id uuid not null references auth.users(id) on delete cascade,
  points numeric(5,2),
  -- ★★★確定（★学校が 押します）。★null なら 学生に 見えません。
  confirmed_at timestamptz,
  entered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ★★1人の 審査員が、★1つの 項目に 1つ だけ。
  unique (event_id, student_id, item_id, judge_id)
);

-- ★★審査員が「つけ終わった」と 押した しるし（★裁定 §Q1）。
--   ★★これが 無いと、★ほかの 審査員の 点が 見えません。
create table if not exists public.evaluation_judge_done (
  org_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.org_events(id) on delete cascade,
  judge_id uuid not null references auth.users(id) on delete cascade,
  done_at timestamptz not null default now(),
  primary key (event_id, judge_id)
);

-- ---------------------------------------------------------------------------
-- ★③ 直した 記録（★裁定 §Q4）
-- ---------------------------------------------------------------------------
--   ★★確定の **あと** の 直し だけ を 残します。★確定の 前は 下書き です。
--   ★★★消せません・直せません。★入るのは 読み道 からだけ です。
create table if not exists public.score_log (
  id uuid primary key default gen_random_uuid(),
  score_id uuid not null,
  org_id uuid not null references public.organizations(id) on delete cascade,
  editor_user_id uuid not null references auth.users(id) on delete cascade,
  before_value numeric(5,2),
  after_value numeric(5,2),
  reason text,
  edited_at timestamptz not null default now()
);

alter table public.evaluation_items enable row level security;
alter table public.evaluation_scores enable row level security;
alter table public.evaluation_judge_done enable row level security;
alter table public.score_log enable row level security;

-- ---------------------------------------------------------------------------
-- ★④ 決まり
-- ---------------------------------------------------------------------------
do $$
begin
  -- ★★型 …… ★`saiten` を 持つ 方が 直せます。★学校の 方は 読めます。
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='evaluation_items' and p.polname='evaluation_items_select') then
    create policy evaluation_items_select on public.evaluation_items
      for select using (
        exists (select 1 from public.memberships m
                where m.org_id = evaluation_items.org_id and m.user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='evaluation_items' and p.polname='evaluation_items_write') then
    create policy evaluation_items_write on public.evaluation_items
      for all using (public.has_can(org_id, 'saiten'))
      with check (public.has_can(org_id, 'saiten'));
  end if;

  -- ★★点 …… ★3つの 道で 読めます。
  --   ★①`saiten` を 持つ 方（★事務・学長）…… ★ぜんぶ
  --   ★②審査員 ご本人 …… ★ご自分の 点
  --   ★③ほかの 審査員の 点 …… ★ご自分が つけ終わった あと だけ
  --   ★④学生 ご本人 …… ★確定の あと だけ
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='evaluation_scores' and p.polname='evaluation_scores_select') then
    create policy evaluation_scores_select on public.evaluation_scores
      for select using (
        public.has_can(org_id, 'saiten')
        or judge_id = auth.uid()
        or (
          exists (select 1 from public.evaluation_judge_done d
                  where d.event_id = evaluation_scores.event_id and d.judge_id = auth.uid())
          and exists (select 1 from public.assignments a
                      where a.org_id = evaluation_scores.org_id
                        and a.teacher_id = auth.uid() and a.ended_at is null)
        )
        or (student_id = auth.uid() and confirmed_at is not null)
      );
  end if;
  -- ★★書けるのは 審査員 ご本人 だけ（★ご自分の 点 だけ）。
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='evaluation_scores' and p.polname='evaluation_scores_write') then
    create policy evaluation_scores_write on public.evaluation_scores
      for all using (judge_id = auth.uid())
      with check (judge_id = auth.uid());
  end if;

  -- ★★つけ終わった しるし …… ★ご本人 だけ。
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='evaluation_judge_done' and p.polname='evaluation_judge_done_own') then
    create policy evaluation_judge_done_own on public.evaluation_judge_done
      for all using (judge_id = auth.uid()) with check (judge_id = auth.uid());
  end if;

  -- ★★直した 記録 …… ★読むのは `saiten` だけ。★書くのは 読み道 からだけ。
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='score_log' and p.polname='score_log_select') then
    create policy score_log_select on public.score_log
      for select using (public.has_can(org_id, 'saiten'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ★⑤ 誰が 何を できるか
-- ---------------------------------------------------------------------------
revoke all on table public.evaluation_items from public, anon, authenticated;
revoke all on table public.evaluation_scores from public, anon, authenticated;
revoke all on table public.evaluation_judge_done from public, anon, authenticated;
revoke all on table public.score_log from public, anon, authenticated;

grant select, insert, update, delete on table public.evaluation_items to authenticated;
grant select, insert, update on table public.evaluation_scores to authenticated;
grant select, insert, delete on table public.evaluation_judge_done to authenticated;
-- ★★★記録は 読む だけ です。★直せません・消せません（★裁定 §Q4）。
grant select on table public.score_log to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   select c.relname, c.relrowsecurity,
--          (select count(*) from pg_policy p where p.polrelid = c.oid)
--   from pg_class c
--   where c.relname in ('evaluation_items','evaluation_scores',
--                       'evaluation_judge_done','score_log');
--
--   ★★`score_log` に update / delete の 決まりが **無い** こと。
