-- 20260923_69 同じ先生に「開いている回」は 1つだけ（★台帳で 止める）
-- Code の判断（2026-09-23）に 同意:
--   ★画面だけの守りは「静かに 破れる」── 今日 何度も 見た型です
--   （呼ぶ道が 複数／同時に押される／画面を 経ずに 叩かれる）
-- ★本番で確かめた（2026-09-23）: lesson_rounds は 0行・重複なし・索引3本
--   → ★いま当てるのが いちばん安全（行が増えてからだと 索引づくりで 表に鍵がかかる）
-- ★10・185 のあと

-- ① 同じ学校・同じ先生に、status='open' の回は 1つだけ
--    ★部分一意索引（confirmed は いくつあっても よい）
create unique index if not exists lesson_rounds_one_open
  on public.lesson_rounds(org_id, teacher_id)
  where status = 'open';

-- ② 画面に 分かることばで 返す（★索引の違反は 読みにくいので 包む）
create or replace function public.start_lesson_round(
  p_org uuid, p_teacher uuid, p_name text, p_from date, p_to date, p_due date, p_need integer)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid;
begin
  if not (public.has_can(p_org,'sched_all') or p_teacher = auth.uid()) then
    raise exception 'NOT_ALLOWED';                      -- ★先生本人か 日程の札
  end if;
  if p_due is null or p_from is null or p_due >= p_from then
    raise exception 'DUE_AFTER_START: 締切は、期間の はじまりより 前に してください';
  end if;
  if p_to is null or p_to <= p_from then
    raise exception 'BAD_PERIOD: 期間の 終わりが、はじまりより 前です';
  end if;
  if p_need is null or p_need < 1 or p_need > 60 then
    raise exception 'BAD_COUNT: 回数は 1〜60 の あいだで';
  end if;

  insert into public.lesson_rounds(org_id, teacher_id, name, period_from, period_to,
                                   due_on, status, created_by, created_at)
  values (p_org, p_teacher, left(btrim(coalesce(p_name,'')),60), p_from, p_to, p_due,
          'open', public.actor_id(), now())
  returning id into v_id;
  return v_id;
exception when unique_violation then
  -- ★索引が 止めたとき（★同時に2つ 押された場合も ここに 来ます）
  raise exception 'ALREADY_OPEN: この先生には、開いている 回が あります。先に 確定してください';
end $$;
revoke all on function public.start_lesson_round(uuid, uuid, text, date, date, date, integer) from public, anon;
grant execute on function public.start_lesson_round(uuid, uuid, text, date, date, date, integer) to authenticated;

-- ★まとめて始める（裁定186 の「先生を いくつでも 選べる」）
--   ★1人ずつ 例外を拾い、★止まった人だけ 返す（★ほかの先生は 始まる）
create or replace function public.start_lesson_rounds(
  p_org uuid, p_teachers uuid[], p_name text, p_from date, p_to date, p_due date, p_need integer)
returns table(teacher_id uuid, round_id uuid, skipped text)
language plpgsql security definer set search_path to 'public' as $$
declare t uuid; v_id uuid;
begin
  foreach t in array coalesce(p_teachers, array[]::uuid[]) loop
    begin
      v_id := public.start_lesson_round(p_org, t, p_name, p_from, p_to, p_due, p_need);
      teacher_id := t; round_id := v_id; skipped := null; return next;
    exception when others then
      teacher_id := t; round_id := null; skipped := sqlerrm; return next;
    end;
  end loop;
end $$;
revoke all on function public.start_lesson_rounds(uuid, uuid[], text, date, date, date, integer) from public, anon;
grant execute on function public.start_lesson_rounds(uuid, uuid[], text, date, date, date, integer) to authenticated;

-- 確かめ（試しの環境で）
-- 1人目 → 通る／★同じ先生の2つ目 → ALREADY_OPEN（★索引が 止める）
-- 1つ目を confirmed にする → 2つ目が 通る（★確定した回は いくつでも）
-- 締切が 期間の はじまり以降 → DUE_AFTER_START
-- 期間の 終わりが 前 → BAD_PERIOD／回数 0 や 61 → BAD_COUNT
-- ★まとめて: 5人のうち 1人だけ 開いている回が あるとき
--   → ★4人は 始まり、★1人だけ skipped に 理由が入る（★全部 止めない）
-- 先生本人でも 日程の札でもない人 → NOT_ALLOWED
