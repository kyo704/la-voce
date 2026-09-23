-- ★束3 ── 裁定165（審査員の表）＋ 裁定163 §1 ＋ 裁定164 W3（2026-09-22）
--
--   ★★★もとの 話 …… 採点の 決まりが 見て いるのは `judge_id = auth.uid()` だけ です。
--     ★★「その回の 審査員として 組まれて いるか」を どこも 見て いません。
--     ★★だから、★入って いる 人なら 誰でも、★よその 学校の 行事に 点と 講評を 入れられます。
--   ★★★直せなかった わけ …… 「組まれて いる」を 表す 表が **ありません** でした。
--     ★★裁定165 で 作る ことに なりました。★ここで 作ります。
--
--   ★★何度 流しても 同じに なります。

begin;

-- ────────────────────────────────────────────────
-- 一 ── 審査員の 表（裁定165 §1）
-- ────────────────────────────────────────────────
create table if not exists public.evaluation_judges (
  org_id    uuid not null references public.organizations(id) on delete cascade,
  event_id  uuid not null references public.org_events(id)    on delete cascade,
  judge_id  uuid not null references auth.users(id)           on delete cascade,
  added_by  uuid references auth.users(id) on delete set null,
  added_at  timestamptz not null default now(),
  primary key (event_id, judge_id)
);

alter table public.evaluation_judges enable row level security;

-- ★REVOKE を 先に 書きます（★列の GRANT は 表の GRANT を 狭められません）。
revoke all on table public.evaluation_judges from public, anon, authenticated;
-- ★`update` は ありません。★組み直しは 消して 足します（★裁定165 §1）。
grant select, insert, delete on table public.evaluation_judges to authenticated;

drop policy if exists evaluation_judges_select on public.evaluation_judges;
create policy evaluation_judges_select on public.evaluation_judges
  for select to authenticated
  using (has_can(org_id, 'saiten') or judge_id = auth.uid());

drop policy if exists evaluation_judges_insert on public.evaluation_judges;
create policy evaluation_judges_insert on public.evaluation_judges
  for insert to authenticated
  with check (
    has_can(org_id, 'saiten')
    and added_by = auth.uid()
    -- ★組む 相手は、その 学校の 人 です。
    and exists (select 1 from public.memberships m
                 where m.org_id = evaluation_judges.org_id
                   and m.user_id = evaluation_judges.judge_id)
    -- ★行事も、その 学校の 行事 です。
    and exists (select 1 from public.org_events e
                 where e.id = evaluation_judges.event_id
                   and e.org_id = evaluation_judges.org_id)
  );

drop policy if exists evaluation_judges_delete on public.evaluation_judges;
create policy evaluation_judges_delete on public.evaluation_judges
  for delete to authenticated
  using (has_can(org_id, 'saiten'));

comment on table public.evaluation_judges is
  '★その回の 審査員として 組まれて いる 人（裁定165）。'
  '★`evaluation_judge_done` は 終えた 印 です。★証しに 使いません（自分で 押せます）';

-- ────────────────────────────────────────────────
-- 二 ── 点（裁定163 §1 ／ 裁定165 §2）
-- ────────────────────────────────────────────────
drop policy if exists evaluation_scores_write on public.evaluation_scores;
create policy evaluation_scores_write on public.evaluation_scores
  -- ★役は もとの まま（PUBLIC）です。★渡す 先は GRANT が 決めます。
  --   ★★ここで `to authenticated` に 変えると、★この 束の 話では ない 差が 混じります。
  for all
  using (judge_id = auth.uid())
  with check (
    judge_id = auth.uid()
    -- ★この回の 審査員として 組まれて いる 自分（★3つの 表で 同じ 条件）
    and exists (select 1 from public.evaluation_judges j
                 where j.event_id = evaluation_scores.event_id
                   and j.org_id  = evaluation_scores.org_id
                   and j.judge_id = auth.uid())
    -- ★項目も、その 行事の 項目 です。
    and exists (select 1 from public.evaluation_items i
                 where i.id = evaluation_scores.item_id
                   and i.event_id = evaluation_scores.event_id)
    -- ★学生も、その 学校に 居る 人 です。
    and exists (select 1 from public.enrollments s
                 where s.org_id = evaluation_scores.org_id
                   and s.student_id = evaluation_scores.student_id)
  );

-- ────────────────────────────────────────────────
-- 三 ── 講評（裁定165 §2）
-- ────────────────────────────────────────────────
drop policy if exists evaluation_reviews_write on public.evaluation_reviews;
create policy evaluation_reviews_write on public.evaluation_reviews
  -- ★役は もとの まま（PUBLIC）です。★渡す 先は GRANT が 決めます。
  --   ★★ここで `to authenticated` に 変えると、★この 束の 話では ない 差が 混じります。
  for all
  using (judge_id = auth.uid())
  with check (
    judge_id = auth.uid()
    and exists (select 1 from public.evaluation_judges j
                 where j.event_id = evaluation_reviews.event_id
                   and j.org_id  = evaluation_reviews.org_id
                   and j.judge_id = auth.uid())
    and exists (select 1 from public.enrollments s
                 where s.org_id = evaluation_reviews.org_id
                   and s.student_id = evaluation_reviews.student_id)
  );

-- ────────────────────────────────────────────────
-- 四 ── 終えた 印（裁定164 W3 ／ 裁定165 §2）
-- ────────────────────────────────────────────────
--   ★★★一意の 決まりは **もう あります**。
--     ★`evaluation_judge_done_pkey PRIMARY KEY (event_id, judge_id)`。
--     ★★2026-09-22 に 本番の `pg_constraint` で 見ました。
--     ★★裁定165 §2 は「いま 一意の 制約が 無い」と 書いて いますが、★有ります。
--     ★★だから ここでは 足しません。★足すと 落ちます。
drop policy if exists evaluation_judge_done_own on public.evaluation_judge_done;
create policy evaluation_judge_done_own on public.evaluation_judge_done
  -- ★役は もとの まま（PUBLIC）です。★渡す 先は GRANT が 決めます。
  --   ★★ここで `to authenticated` に 変えると、★この 束の 話では ない 差が 混じります。
  for all
  using (judge_id = auth.uid())
  with check (
    judge_id = auth.uid()
    and exists (select 1 from public.evaluation_judges j
                 where j.event_id = evaluation_judge_done.event_id
                   and j.org_id  = evaluation_judge_done.org_id
                   and j.judge_id = auth.uid())
  );

-- ────────────────────────────────────────────────
-- 五 ── 確定の 列（裁定165 §3）
-- ────────────────────────────────────────────────
--   ★★★いま …… `confirmed_at` に INSERT と UPDATE が あります。
--     ★★審査員が 入れる ときに 自分で 入れれば、★確定の 手順を 飛ばせます。
--   ★★入れるのは `confirm_event_scores`（SECURITY DEFINER）だけ です。
--   ★★★表ごとの GRANT を 先に 外します。★外さないと 列の 絞りが きません。
revoke all on table public.evaluation_scores  from public, anon, authenticated;
revoke all on table public.evaluation_reviews from public, anon, authenticated;

grant select on table public.evaluation_scores  to authenticated;
grant select on table public.evaluation_reviews to authenticated;

-- ★`confirmed_at` を 抜いた 列 だけ 渡します。
-- ★`judge_name_at` …… ★そのときの 審査員の 名前（★束0・裁定168 ★2）。
--   ★入れる のは 審査員 ご自身 です。★あとから 書き換えられます（★名前を 直す ため）。
grant insert (id, org_id, event_id, student_id, item_id, judge_id, points,
              judge_name_at, entered_at, updated_at),
      update (points, judge_name_at, entered_at, updated_at)
  on table public.evaluation_scores to authenticated;
grant insert (id, org_id, event_id, student_id, judge_id, body,
              judge_name_at, created_at, updated_at),
      update (body, judge_name_at, updated_at)
  on table public.evaluation_reviews to authenticated;

commit;

-- ★★★確かめ（当てた あとに 流して ください）
--   select polname, pg_get_expr(polwithcheck,polrelid) from pg_policy p
--     join pg_class c on c.oid=p.polrelid
--    where c.relname in ('evaluation_scores','evaluation_reviews','evaluation_judge_done','evaluation_judges');
--   select table_name, privilege_type, column_name from information_schema.column_privileges
--    where table_schema='public' and grantee='authenticated'
--      and table_name in ('evaluation_scores','evaluation_reviews') and column_name='confirmed_at';
