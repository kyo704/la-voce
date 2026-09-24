-- 20260923_62 実技試験の枠を 採点の画面に渡す（P5 の4点目・裁定183）
-- 目的: ★確定した枠の順に 採点の画面が並ぶ。二重入力をなくす
-- ★59・61・165 のあと。★本番で確かめた列: evaluation_judges(org_id,event_id,judge_id,added_by,added_at)

-- ① 審査員の画面の並び（★自分が審査する回の・枠の順）
create or replace function public.scoring_queue(p_event uuid)
returns table(slot_id uuid, ord integer, starts_at timestamptz, minutes integer,
              student_id uuid, student_name text, place_name text,
              done boolean, is_monka boolean)
language sql stable security definer set search_path to 'public' as $$
  select s.id, s.ord, s.starts_at, s.minutes, s.student_id,
         coalesce(s.student_name_at,'（名前なし）'), pl.name,
         -- ★その学生の点を 自分が 全部の項目に入れ終えたか
         (select count(*) from public.evaluation_scores sc
           where sc.event_id = p_event and sc.student_id = s.student_id
             and sc.judge_id = auth.uid())
         >= (select count(*) from public.evaluation_items it
              where it.event_id = p_event and it.in_use),
         -- ★門下かどうか（外さない。出すだけ）
         exists (select 1 from public.assignments a
                  where a.org_id = s.org_id and a.student_id = s.student_id
                    and a.teacher_id = auth.uid() and a.ended_at is null)
    from public.jury_slots s
    left join public.org_places pl on pl.id = s.place_id
   where s.event_id = p_event
     and exists (select 1 from public.evaluation_judges j     -- ★その回の審査員だけ
                  where j.event_id = p_event and j.judge_id = auth.uid())
   order by s.ord;
$$;
revoke all on function public.scoring_queue(uuid) from public, anon;
grant execute on function public.scoring_queue(uuid) to authenticated;

-- ② つぎに入れる人（★「終えていない いちばん早い枠」を1つ返す）
create or replace function public.scoring_next(p_event uuid)
returns table(slot_id uuid, student_id uuid, student_name text, starts_at timestamptz)
language sql stable security definer set search_path to 'public' as $$
  select q.slot_id, q.student_id, q.student_name, q.starts_at
    from public.scoring_queue(p_event) q
   where not q.done
   order by q.ord limit 1;
$$;
revoke all on function public.scoring_next(uuid) from public, anon;
grant execute on function public.scoring_next(uuid) to authenticated;

-- ③ 枠を消したら 点も消えるか → ★消さない（点は 枠より重い）
--    jury_slots を消しても evaluation_scores は残る（別の表・外部キーで結んでいない）
--    ★意図的です: 並べ直しで 点が消えては困る

-- 確かめ（試しの環境で）
-- その回の審査員が呼ぶ → 枠の順に並ぶ／★審査員でない人 → 0行
-- 全部の項目に点を入れた学生 → done=true／1つでも残っていれば false
-- 自分の門下の学生 → is_monka=true（★枠は消えない・並びも変わらない）
-- scoring_next → ★終えていない いちばん早い枠を1つ
-- ★順位・合計点は 返さない（列が無い）
-- 枠を並べ直す → ★点は消えない
