-- ★束3 を 戻す（2026-09-22）。★当てる 前の 本番の 形に 戻します。
begin;

-- 五 を 戻す（★表ごとの GRANT へ）
revoke all on table public.evaluation_scores  from public, anon, authenticated;
revoke all on table public.evaluation_reviews from public, anon, authenticated;
grant select, insert, update on table public.evaluation_scores  to authenticated;
grant select, insert, update on table public.evaluation_reviews to authenticated;

-- 二・三・四 を 戻す
drop policy if exists evaluation_scores_write on public.evaluation_scores;
create policy evaluation_scores_write on public.evaluation_scores
  for all using (judge_id = auth.uid()) with check (judge_id = auth.uid());

drop policy if exists evaluation_reviews_write on public.evaluation_reviews;
create policy evaluation_reviews_write on public.evaluation_reviews
  for all using (judge_id = auth.uid()) with check (judge_id = auth.uid());

drop policy if exists evaluation_judge_done_own on public.evaluation_judge_done;
create policy evaluation_judge_done_own on public.evaluation_judge_done
  for all using (judge_id = auth.uid()) with check (judge_id = auth.uid());

-- 一 を 戻す（★行が 入って いたら 消えます。★当てた 日に 戻す 前提 です）
drop table if exists public.evaluation_judges;

commit;
