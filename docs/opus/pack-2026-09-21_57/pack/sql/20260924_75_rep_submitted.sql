-- 20260924_75 代表が「まだの人」を 見る（裁定190・★㋒）
-- ★Code の指摘（2026-09-24）:
--   get_timetable_submitted は ★学校ぜんぶを 返す。monka_representative は ★門下の印
--   → ★そのまま 開くと よその門下まで 見える
-- ★決定（裁定190）: ★新しい関数を 1本。★既存の関数は 変えない（先生・事務に 影響しない）
--   ★同じ門下だけ／★返すのは student_id と 真偽だけ（★名前も 中身も 返さない）
-- ★10・139 のあと

create or replace function public.rep_timetable_submitted(p_org uuid)
returns table(student_id uuid, submitted boolean)
language sql stable security definer set search_path to 'public' as $$
  -- ★呼ぶ人が その門下の 代表であること
  with me as (
    select a.teacher_id
      from public.assignments a
     where a.org_id = p_org and a.student_id = auth.uid()
       and a.is_representative and a.ended_at is null
     limit 1                      -- ★1人が 2つの門下の 代表には ならない（門下は 1つ）
  )
  select a2.student_id,
         exists (select 1 from public.my_timetable t where t.user_id = a2.student_id)
    from public.assignments a2, me
   where a2.org_id = p_org
     and a2.teacher_id = me.teacher_id      -- ★同じ門下だけ
     and a2.ended_at is null;
  -- ★名前は 返さない（画面が 持っている 門下の 一覧と 突き合わせる）
  -- ★中身（何曜の 何コマか）は 返さない
$$;
revoke all on function public.rep_timetable_submitted(uuid) from public, anon;
grant execute on function public.rep_timetable_submitted(uuid) to authenticated;

-- 確かめ（試しの環境で）
-- 代表が 呼ぶ → ★同じ門下の 学生だけ／★よその門下は 0件
-- 代表でない 学生 → ★0行（me が 空なので 何も 返らない）
-- 先生が 呼ぶ → ★0行（★先生は 既存の get_timetable_submitted を 使う）
-- 返る列は ★student_id と submitted だけ（★名前も 時間割の中身も 無い）
-- 代表を 外したら（is_representative=false）→ ★0行
