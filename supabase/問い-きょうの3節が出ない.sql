-- ===========================================================================
-- ★問い ── ★「きょう」の 3節が 1つも 出ない
--
--   ★★出す 決まりは、★こう なって います ──
--     ・読めた ＋ 1件 以上 … ★節が 出る
--     ・読めた ＋ 0件      … ★★節ごと 出ない（★空の 札を 出さない）
--     ・読めなかった        … ★「いま 読めませんでした」と 1行 出る
--   ★★つまり「何も 出ない」は、★**0件** という ことです。
--     ★★「読めなかった」なら、★1行 出て いる はずです。
--
--   ★★だから、★本当に 0件 なのかを 数えます。
--
--   ★★★読むだけ です。★1文字も 書きません。
--   ★★下の `ここに見ている方のuuid` を 置き換えて ください。
--     ★★いま 画面を 見て いる 方 の id です（★発行した 方 では ありません）。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★その方は、★生徒として どこに 居るか
-- ---------------------------------------------------------------------------
select e.org_id, o.name as 教室, e.status, e.enrolled_at
from public.enrollments e
left join public.organizations o on o.id = e.org_id
where e.student_id = 'ここに見ている方のuuid'
order by e.enrolled_at desc;

-- ---------------------------------------------------------------------------
-- 【二】★★次のレッスン ── ★その方が **生徒** の 予定
--
--   ★★2つの 道が あります。★どちらも 数えます。
--     ① 教室の レッスン … `lessons.student_id` に その方が 入る
--     ② 個人指導       … `teacher_student_links` を 通る
--   ★★「次の」は、★これから の もので、★出欠が まだ 空の もの だけ です。
-- ---------------------------------------------------------------------------
select '① 教室のレッスン' as 道,
       count(*) as ぜんぶ,
       count(*) filter (where scheduled_at >= now()) as これから,
       count(*) filter (where scheduled_at >= now() and attendance is null) as 次に出るもの
from public.lessons
where student_id = 'ここに見ている方のuuid'
union all
select '② 個人指導',
       count(*),
       count(*) filter (where l.scheduled_at >= now()),
       count(*) filter (where l.scheduled_at >= now() and l.attendance is null)
from public.lessons l
join public.teacher_student_links t on t.id = l.link_id
where t.student_id = 'ここに見ている方のuuid';

-- ★★「次に出るもの」が 0 なら、★節が 出ないのは **正しい** 動きです。

-- ---------------------------------------------------------------------------
-- 【三】★★先生からの 連絡
--
--   ★★決まり（`org_messages_select`）は `assignments`（ended_at is null）で 見ます。
--     ★★受け持ちが 無ければ、★1件も 届きません。★それも 数えます。
-- ---------------------------------------------------------------------------
select (select count(*) from public.assignments
         where student_id = 'ここに見ている方のuuid' and ended_at is null) as 開いている受け持ち,
       (select count(*) from public.org_messages m
         where m.withdrawn_at is null
           and exists (select 1 from public.assignments a
                        where a.org_id = m.org_id
                          and a.student_id = 'ここに見ている方のuuid'
                          and a.ended_at is null
                          and (m.teacher_id is null or a.teacher_id = m.teacher_id))) as 届く連絡;

-- ---------------------------------------------------------------------------
-- 【四】★★近い 行事
--
--   ★★決まり（`org_events_select_member`）は 在籍（status='active'）で 見ます。
-- ---------------------------------------------------------------------------
select count(*) as これからの行事
from public.org_events v
where v.withdrawn_at is null
  and v.event_date >= current_date
  and exists (select 1 from public.enrollments e
               where e.org_id = v.org_id
                 and e.student_id = 'ここに見ている方のuuid'
                 and e.status = 'active');

-- ---------------------------------------------------------------------------
-- 【五】★★その 教室に、★そもそも 何が 入って いるか
--
--   ★★入ったばかりの 教室は、★ふつう 空 です。
--     ★★レッスンも 行事も 連絡も、★先生が これから 作る もの です。
-- ---------------------------------------------------------------------------
select o.name as 教室,
       (select count(*) from public.lessons    where org_id = o.id) as レッスン,
       (select count(*) from public.org_events where org_id = o.id) as 行事,
       (select count(*) from public.org_messages where org_id = o.id) as 連絡,
       (select count(*) from public.assignments where org_id = o.id and ended_at is null) as 開いている受け持ち
from public.organizations o
where o.id in (select org_id from public.enrollments
                where student_id = 'ここに見ている方のuuid' and status = 'active');

-- ---------------------------------------------------------------------------
-- 【六】★★行事が 45件 あるのに 出ない ── ★いつの 行事か
--
--   ★★「近い 行事」は、★**きょうから 30日**の 中 だけ を 出します
--     （`EVENT_WINDOW_DAYS = 30`・`lib/classroomShell.js`）。
--     ★★さらに、★出すのは いちばん 近い **3件** まで（`EVENT_SHOW_LIMIT`）。
--   ★★45件 ぜんぶが 30日より 先 なら、★出ないのは **正しい** 動きです。
--
--   ★★下で、★いちばん 近い 5件と、★30日の 中に 何件 あるかを 数えます。
-- ---------------------------------------------------------------------------
select count(*) filter (where v.event_date between current_date
                              and current_date + 30) as きょうから30日の中,
       count(*) filter (where v.event_date > current_date + 30) as 30日より先,
       min(v.event_date) filter (where v.event_date >= current_date) as いちばん近い日
from public.org_events v
where v.withdrawn_at is null
  and exists (select 1 from public.enrollments e
               where e.org_id = v.org_id
                 and e.student_id = 'ここに見ている方のuuid'
                 and e.status = 'active');

select v.event_date as 日, v.title as 題, o.name as 教室
from public.org_events v
left join public.organizations o on o.id = v.org_id
where v.withdrawn_at is null
  and v.event_date >= current_date
  and exists (select 1 from public.enrollments e
               where e.org_id = v.org_id
                 and e.student_id = 'ここに見ている方のuuid'
                 and e.status = 'active')
order by v.event_date
limit 5;

-- ---------------------------------------------------------------------------
-- 【七】★★取り下げた 行事を 数から 外して いるか
--
--   ★★画面は `withdrawn_at` の ある 行を 出しません。
--     ★★45件の 中に 取り下げた ものが 混ざって いると、★数が 合いません。
-- ---------------------------------------------------------------------------
select count(*) as これからの行事ぜんぶ,
       count(*) filter (where v.withdrawn_at is not null) as 取り下げたもの
from public.org_events v
where v.event_date >= current_date
  and exists (select 1 from public.enrollments e
               where e.org_id = v.org_id
                 and e.student_id = 'ここに見ている方のuuid'
                 and e.status = 'active');
