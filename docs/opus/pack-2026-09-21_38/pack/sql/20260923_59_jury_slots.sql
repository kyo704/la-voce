-- 20260923_59 実技試験の割り当て（P5・裁定183）
-- ★レッスン割（139）の部品を使う。固有なのは4点だけ:
--   ①10〜15分の枠 ②審査員が自分の門下なら「門下」と出す（★自動で外さない）
--   ③伴奏者が別の枠 ④確定した順に 採点の画面が並ぶ
-- ★165（evaluation_judges）・10 のあと
-- ★本番で確かめた列（2026-09-23 夜・Code の指摘を受けて）:
--   evaluation_judges は org_id・event_id・judge_id・added_by・added_at の ★5列だけ
--   ★judge_name_at は evaluation_scores／evaluation_reviews の列。★ここには無い
--   → 審査員の名前は ★profiles（display_name／name）から取る

create table if not exists public.jury_slots (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  event_id    uuid not null references public.org_events(id) on delete cascade,
  student_id  uuid references auth.users(id) on delete set null,
  student_name_at text,                       -- ★退会しても 紙が残るように
  place_id    uuid references public.org_places(id) on delete set null,
  accompanist_id uuid references auth.users(id) on delete set null,
  accompanist_name_at text,
  starts_at   timestamptz not null,
  minutes     integer not null default 12 check (minutes between 5 and 60),
  ord         integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists jury_slots_event_idx on public.jury_slots(event_id, starts_at);
create index if not exists jury_slots_student_idx on public.jury_slots(student_id);
alter table public.jury_slots enable row level security;
revoke all on public.jury_slots from anon, authenticated;
grant select, insert, update, delete on public.jury_slots to authenticated;

-- 組むのは 採点の札。★学生は 自分の枠だけ読める（他人の枠は見えない）
drop policy if exists jury_slots_staff on public.jury_slots;
create policy jury_slots_staff on public.jury_slots for all to authenticated
  using (public.has_can(org_id,'saiten')) with check (public.has_can(org_id,'saiten'));
drop policy if exists jury_slots_mine on public.jury_slots;
create policy jury_slots_mine on public.jury_slots for select to authenticated
  using (student_id = auth.uid() or accompanist_id = auth.uid());

-- ★門下かどうかを「教える」（★自動で外さない）
create or replace function public.jury_monka_flags(p_event uuid)
returns table(slot_id uuid, student_name text, judge_name text, is_monka boolean)
language sql stable security definer set search_path to 'public' as $$
  -- ★審査員の名前は profiles から取る（evaluation_judges に名前の列は無い。2026-09-23 の誤り）
  select s.id, coalesce(s.student_name_at,'—'), coalesce(p.display_name, p.name, '—'),
         exists (select 1 from public.assignments a
                  where a.org_id = s.org_id and a.student_id = s.student_id
                    and a.teacher_id = j.judge_id and a.ended_at is null)
    from public.jury_slots s
    join public.evaluation_judges j on j.event_id = s.event_id
    left join public.profiles p on p.id = j.judge_id
   where s.event_id = p_event and public.has_can(s.org_id,'saiten');
$$;
revoke all on function public.jury_monka_flags(uuid) from public, anon;
grant execute on function public.jury_monka_flags(uuid) to authenticated;

-- 確かめ（試しの環境で）
-- 採点の札を持つ人が枠を作る → 通る／持たない人 → 止まる
-- ★学生が読む → 自分の枠だけ（他人の枠は0行）／伴奏者も 自分の枠だけ
-- ★審査員が自分の門下の学生の枠 → is_monka=true が返る。★枠は消えない（外さない）
-- 学生が退会 → ★枠は残る（student_id が空になり、名前は残る）
-- ★順位・成績の列が 1つも無いこと
