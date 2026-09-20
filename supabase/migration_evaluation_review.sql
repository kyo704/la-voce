-- ============================================================================
-- ★講評（★裁定 その105 §Q2・2026-09-20）
--
--   ★★★見本 `P_tenIreru` に「講評」の 欄が あります。
--     ★★裁定 §Q2 ──「学生に 見える もの …… 自分の 点（項目ごと・合計）／**講評**」。
--   ★★★点は 項目ごと です。★講評は **その方 1人に 1つ** です。
--     ★★だから 別の 表に します。★点の 表に 混ぜません。
--
--   ★★★見える 範囲は 点と 同じ です ──
--     ★`saiten` …… ぜんぶ ／ ★書いた 審査員 …… ご自分の もの
--     ★ほかの 審査員 …… つけ終わった あと ／ ★学生 …… 確定の あと だけ
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create table if not exists public.evaluation_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.org_events(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  judge_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, student_id, judge_id)
);

alter table public.evaluation_reviews enable row level security;

do $$
begin
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='evaluation_reviews' and p.polname='evaluation_reviews_select') then
    create policy evaluation_reviews_select on public.evaluation_reviews
      for select using (
        public.has_can(org_id, 'saiten')
        or judge_id = auth.uid()
        or (
          exists (select 1 from public.evaluation_judge_done d
                  where d.event_id = evaluation_reviews.event_id and d.judge_id = auth.uid())
          and exists (select 1 from public.assignments a
                      where a.org_id = evaluation_reviews.org_id
                        and a.teacher_id = auth.uid() and a.ended_at is null)
        )
        or (student_id = auth.uid() and confirmed_at is not null)
      );
  end if;
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='evaluation_reviews' and p.polname='evaluation_reviews_write') then
    create policy evaluation_reviews_write on public.evaluation_reviews
      for all using (judge_id = auth.uid()) with check (judge_id = auth.uid());
  end if;
end $$;

revoke all on table public.evaluation_reviews from public, anon, authenticated;
grant select, insert, update on table public.evaluation_reviews to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select relrowsecurity from pg_class where relname = 'evaluation_reviews';
--   ★★決まりは 2つ（読む・書く）で ある こと。
