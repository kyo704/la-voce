-- 20260923_52 採点の返却が「既定オフ」になっていない（2026-09-23 に採点の束を洗って発見）
-- 裁定その50（2026-09-14）:
--   「採点：★返却は事務が選ぶ・★既定オフ ／ 順位は返さない ／ 講評90日 ／ 審査員相互は既定オン・締切前は不可」
-- 本番の姿:
--   evaluation_scores_select の枝に ★(student_id = auth.uid() AND confirmed_at is not null)
--   → ★審査員が確定した瞬間に、生徒が自分の点を読める＝★事務が選んでいない・既定オンと同じ
--   返却を決める列・表は ★どこにも無い（returned_at も released_at も無い）
--   講評（evaluation_reviews）も 同じ形
-- ★165（evaluation_judges）のあと

-- ① 行事ごとに「返す・返さない」を持つ（★既定は オフ）
create table if not exists public.evaluation_release (
  event_id    uuid primary key references public.org_events(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  scores      boolean not null default false,   -- ★点を返すか（既定オフ）
  reviews     boolean not null default false,   -- ★講評を返すか（既定オフ）
  released_at timestamptz,
  released_by uuid,
  note        text
);
alter table public.evaluation_release enable row level security;
revoke all on public.evaluation_release from anon, authenticated;
grant select, insert, update on public.evaluation_release to authenticated;
-- ★決められるのは 採点の札（saiten）を持つ人だけ ＝「事務が選ぶ」
drop policy if exists evaluation_release_write on public.evaluation_release;
create policy evaluation_release_write on public.evaluation_release for all to authenticated
  using (public.has_can(org_id,'saiten')) with check (public.has_can(org_id,'saiten'));
-- 生徒は「返っているか」だけ読めてよい（中身は点の表のポリシーが決める）
drop policy if exists evaluation_release_read on public.evaluation_release;
create policy evaluation_release_read on public.evaluation_release for select to authenticated
  using (true);
-- ★消すポリシーは置かない（返した記録を消さない）

-- ② 点の読み取りを ★返したときだけにする
drop policy if exists evaluation_scores_select on public.evaluation_scores;
create policy evaluation_scores_select on public.evaluation_scores for select to authenticated
  using (
    public.has_can(org_id,'saiten')
    or judge_id = auth.uid()
    or (   -- 審査員相互（自分が終えてから・門下の先生）
      exists (select 1 from public.evaluation_judge_done d
               where d.event_id = evaluation_scores.event_id and d.judge_id = auth.uid())
      and exists (select 1 from public.assignments a
                   where a.org_id = evaluation_scores.org_id and a.teacher_id = auth.uid() and a.ended_at is null)
    )
    or (   -- ★生徒: 確定 かつ ★事務が「返す」と決めたときだけ
      student_id = auth.uid() and confirmed_at is not null
      and exists (select 1 from public.evaluation_release r
                   where r.event_id = evaluation_scores.event_id and r.scores)
    )
  );

-- ③ 講評も同じ
drop policy if exists evaluation_reviews_select on public.evaluation_reviews;
create policy evaluation_reviews_select on public.evaluation_reviews for select to authenticated
  using (
    public.has_can(org_id,'saiten')
    or judge_id = auth.uid()
    or (
      exists (select 1 from public.evaluation_judge_done d
               where d.event_id = evaluation_reviews.event_id and d.judge_id = auth.uid())
      and exists (select 1 from public.assignments a
                   where a.org_id = evaluation_reviews.org_id and a.teacher_id = auth.uid() and a.ended_at is null)
    )
    or (
      student_id = auth.uid() and confirmed_at is not null
      and exists (select 1 from public.evaluation_release r
                   where r.event_id = evaluation_reviews.event_id and r.reviews)
    )
  );

-- ④ 返したことを記録に残す（★いつ・誰が）
create or replace function public.stamp_evaluation_release()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if (new.scores and not coalesce(old.scores,false)) or (new.reviews and not coalesce(old.reviews,false)) then
    new.released_at := now(); new.released_by := public.actor_id();
  end if;
  return new;
end $$;
revoke all on function public.stamp_evaluation_release() from public, anon, authenticated;
drop trigger if exists evaluation_release_stamp on public.evaluation_release;
create trigger evaluation_release_stamp before insert or update on public.evaluation_release
  for each row execute function public.stamp_evaluation_release();

-- 確かめ（試しの環境で）
-- 確定したばかり（返す設定が無い）→ ★生徒は0行（いままでは見えていた）
-- 事務（saiten）が scores=true にする → 生徒は自分の点だけ見える（★他人の点は見えない）
-- reviews=false のまま → ★講評は見えない（点だけ返すことができる）
-- 事務でない人が返そうとする → 止まる
-- ★順位は どこにも無い（返す・返さないに関わらず）
-- 審査員相互: 自分が終えるまで 0行／終えたら見える（裁定その50 のとおり）
