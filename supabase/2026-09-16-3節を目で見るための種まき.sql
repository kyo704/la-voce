-- ===========================================================================
-- ★「きょう」の 3節を、★目で 見る ための 種まき（★2026-09-16）
--
--   ★★お求め ── ★次のレッスン・先生からの 連絡・近い 行事 の 3つが
--     ★★中身の ある 姿で 出る ところを、★坂本さんが ご覧に なりたい。
--
--   ★★★これは **見せかけの データ** です。★本番の 台帳に 入ります。
--     ★★ふだんは しません（★台帳㊶）。★きょうは お求めが あった ため です。
--     ★★あとで 消せる ように、★題に `★見本-2026-09-16` を 付けます。
--       ★★いちばん 下に、★消す SQL を 付けて います（★注記を 外して 走らせます）。
--
--   ★★★決め打ちを しません。★台帳に 尋ねて から 入れます ──
--     ★★入れ先の 教室は、★f7520dc1 が **いま 在籍して いて**（active）、
--       ★かつ **受け持ちが 開いて いる**（`assignments.ended_at is null`）教室。
--     ★★連絡（`org_messages`）は、★受け持ちの 先生でないと 届きません
--       （`org_messages_select` が `assignments` を 見ます）。
--       ★★だから 先生も 台帳から 引きます。★書き写しません。
--
--   ★何度 走らせても 増えません（★同じ 題の 行が あれば 入れません）。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【〇】★先に、★入れ先を 見ます（★読むだけ）
--
--   ★★1行も 返らなければ、★下は 何も 入れません。
--     ★★その ときは、★受け持ちが 開いて いる 教室が 無い という ことです。
-- ---------------------------------------------------------------------------
select a.org_id, o.name as 教室, a.teacher_id, p.display_name as 先生
from public.assignments a
join public.enrollments e
  on e.org_id = a.org_id
 and e.student_id = a.student_id
 and e.status = 'active'
left join public.organizations o on o.id = a.org_id
left join public.profiles p on p.id = a.teacher_id
where a.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
  and a.ended_at is null
order by o.name
limit 5;

-- ---------------------------------------------------------------------------
-- 【一】★近い 行事 ── ★3日後
--
--   ★★「近い 行事」は きょうから 30日の 中、★いちばん 近い 3件 まで です。
--     ★★2030年の ものが 45件 あっても、★1件も 出ません。★だから 近い 日に します。
-- ---------------------------------------------------------------------------
insert into public.org_events (org_id, event_date, start_time, end_time, kind, title, created_by)
select t.org_id,
       current_date + 3,
       time '14:00',
       time '16:00',
       '合わせ',
       '★見本-2026-09-16 伴奏合わせ',
       t.teacher_id
from (
  select a.org_id, a.teacher_id
  from public.assignments a
  join public.enrollments e
    on e.org_id = a.org_id and e.student_id = a.student_id and e.status = 'active'
  where a.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
    and a.ended_at is null
  order by a.org_id
  limit 1
) t
where not exists (
  select 1 from public.org_events x
   where x.org_id = t.org_id and x.title = '★見本-2026-09-16 伴奏合わせ'
);

-- ---------------------------------------------------------------------------
-- 【二】★次の レッスン ── ★あさっての 15時
--
--   ★★`attendance` は **空の まま**に します。
--     ★★「次の」は、★まだ 答えの 無い もの だけ を 出します
--       （`nextLesson` … `attendanceOf(r) === null`）。
--     ★★`held` という 列は **ありません**（★2026-09-16 に 確かめました）。
--   ★★`org_id` を 入れます。★入れないと、★教室の 決まりの 外に 出ます。
-- ---------------------------------------------------------------------------
insert into public.lessons (org_id, teacher_id, student_id, scheduled_at, duration_minutes, note, created_by)
select t.org_id,
       t.teacher_id,
       'f7520dc1-9154-4524-a350-ba0bcddbf0b2',
       -- ★★★日本時間で 入れます（★2026-09-16）。
       --   ★★はじめ `(current_date + 2) + time '15:00'` と 書いて いました。
       --     ★★これは **時計の 付かない** 時刻 です。
       --     ★★`timestamptz` の 列に 入れる と、★その つなぎの 時計で 読まれます。
       --       ★SQL エディタは 世界時 です。★だから 15:00(UTC) に なりました。
       --     ★★日本では 翌日の 0:00 です。★実機で そう 出ました。
       --   ★★`at time zone 'Asia/Tokyo'` を 付けて、★日本の 15時に します。
       ((current_date + 2) + time '15:00') at time zone 'Asia/Tokyo',
       45,
       '★見本-2026-09-16 レッスン',
       t.teacher_id
from (
  select a.org_id, a.teacher_id
  from public.assignments a
  join public.enrollments e
    on e.org_id = a.org_id and e.student_id = a.student_id and e.status = 'active'
  where a.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
    and a.ended_at is null
  order by a.org_id
  limit 1
) t
where not exists (
  select 1 from public.lessons x
   where x.org_id = t.org_id
     and x.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
     and x.note = '★見本-2026-09-16 レッスン'
);

-- ---------------------------------------------------------------------------
-- 【三】★先生からの 連絡
--
--   ★★`teacher_id` は、★**受け持ちの 先生**に します。
--     ★★ここが ずれると、★決まりに 弾かれて 届きません
--       （`org_messages_select` … `a.teacher_id = org_messages.teacher_id`）。
--   ★★`author_id` も 同じ 先生 です（★先生が 書いた もの、という 形）。
-- ---------------------------------------------------------------------------
insert into public.org_messages (org_id, teacher_id, author_id, body)
select t.org_id,
       t.teacher_id,
       t.teacher_id,
       '★見本-2026-09-16　来週の 合わせは 14時からです。楽譜を お持ちください。'
from (
  select a.org_id, a.teacher_id
  from public.assignments a
  join public.enrollments e
    on e.org_id = a.org_id and e.student_id = a.student_id and e.status = 'active'
  where a.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
    and a.ended_at is null
  order by a.org_id
  limit 1
) t
where not exists (
  select 1 from public.org_messages x
   where x.org_id = t.org_id and x.body like '★見本-2026-09-16%'
);

-- ---------------------------------------------------------------------------
-- 【四】★入った ことの 確かめ（★読むだけ）
-- ---------------------------------------------------------------------------
select '行事' as もの, count(*) as 数 from public.org_events
 where title like '★見本-2026-09-16%'
union all
select 'レッスン', count(*) from public.lessons
 where note like '★見本-2026-09-16%'
union all
select '連絡', count(*) from public.org_messages
 where body like '★見本-2026-09-16%';

-- ★★3つとも 1 なら、★画面に 出る はずです。
--   ★★出ない ときは、★`f7520dc1` で 入り直して（★読み込み直して）ください。

-- ===========================================================================
-- ★★片づけ ── ★見終えたら、★下の 3行の `--` を 外して 走らせて ください。
--
--   ★★題で 引いて 消します。★ほかの 行には 当たりません。
--   ★★お客さまが 書いた ものは 1つも 含まれて いません。
-- ===========================================================================
-- delete from public.org_events   where title like '★見本-2026-09-16%';
-- delete from public.lessons      where note  like '★見本-2026-09-16%';
-- delete from public.org_messages where body  like '★見本-2026-09-16%';
