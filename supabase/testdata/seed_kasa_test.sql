-- ============================================================================
-- ★重なりを 実機で 見る ための、★お試しの 記録（★2026-09-20）
--
--   ★★★入れる 先は「★実機テスト（消してよい）」だけ です。
--     ★★`57ca6d22-3f54-4b85-b0b6-466da875a12d`
--     ★★★ほかの 学校・ほかの 方の 記録に 触りません。
--
--   ★★★使う のは、★坂本さん ご自身の 試しの 口 だけ です。
--     ★本人　　　　99b695d8…（事務・課長／`sched_all` を 持ちます）
--     ★+forcode　　f7520dc1…（学長）
--     ★+teachertest adcab9c5…（★これから 非常勤の 先生に します）
--     ★+gate_test　 c66967ef…（★生徒 A）
--     ★+second_color 33481281…（★生徒 B）
--
--   ★日づけは **きょう** です。★書き換え不要 です。★何度 流しても 同じに なります。
--   ★消し方は、★いちばん 下に あります。
-- ============================================================================

-- ① 場所（★第1教室 ／ 第2教室）
insert into public.org_places (org_id, name, ord)
values ('57ca6d22-3f54-4b85-b0b6-466da875a12d', '第1教室', 1),
       ('57ca6d22-3f54-4b85-b0b6-466da875a12d', '第2教室', 2)
on conflict (org_id, name) do nothing;

-- ② 非常勤の 役職（★`sched_mine` だけ ── ★先生の 姿を 見る ため）
insert into public.org_posts (org_id, name, perms, sort_order)
select '57ca6d22-3f54-4b85-b0b6-466da875a12d', '★非常勤（お試し）',
       '{"sched_mine": true, "shukketsu": true}'::jsonb, 90
where not exists (
  select 1 from public.org_posts
  where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d' and name = '★非常勤（お試し）');

-- ③ その 役職で、★+teachertest を 先生に します
insert into public.memberships (org_id, user_id, role, post_id)
select '57ca6d22-3f54-4b85-b0b6-466da875a12d',
       'adcab9c5-c35c-423a-a71f-cb6c12b2efe0', 'teacher',
       (select id from public.org_posts
        where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d' and name = '★非常勤（お試し）')
where not exists (
  select 1 from public.memberships
  where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d'
    and user_id = 'adcab9c5-c35c-423a-a71f-cb6c12b2efe0');

-- ④ 生徒 2人を 在籍に します
insert into public.enrollments (org_id, student_id, status, grade_label)
select '57ca6d22-3f54-4b85-b0b6-466da875a12d', v.uid, 'active', v.grade
from (values ('c66967ef-6c37-4237-8709-1fed6939de22'::uuid, '1年'),
             ('33481281-0608-4118-aada-8af97b8ab754'::uuid, '2年')) as v(uid, grade)
where not exists (
  select 1 from public.enrollments e
  where e.org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d' and e.student_id = v.uid);

-- ⑤ 受け持ち（★`sched_mine` の 先生が 読める ように）
insert into public.assignments (org_id, teacher_id, student_id)
select '57ca6d22-3f54-4b85-b0b6-466da875a12d',
       'adcab9c5-c35c-423a-a71f-cb6c12b2efe0', v.uid
from (values ('c66967ef-6c37-4237-8709-1fed6939de22'::uuid),
             ('33481281-0608-4118-aada-8af97b8ab754'::uuid)) as v(uid)
where not exists (
  select 1 from public.assignments a
  where a.org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d'
    and a.teacher_id = 'adcab9c5-c35c-423a-a71f-cb6c12b2efe0'
    and a.student_id = v.uid and a.ended_at is null);

-- ⑥ コマ（★動かす 先の 候補に 要ります。★先生と 生徒の 両方に 要ります）
insert into public.my_periods (user_id, ord, name, start_min, end_min)
select v.uid, k.ord, k.name, k.s, k.e
from (values ('adcab9c5-c35c-423a-a71f-cb6c12b2efe0'::uuid),
             ('c66967ef-6c37-4237-8709-1fed6939de22'::uuid),
             ('33481281-0608-4118-aada-8af97b8ab754'::uuid),
             ('f7520dc1-9154-4524-a350-ba0bcddbf0b2'::uuid)) as v(uid),
     (values (1::smallint, '1限', 540::smallint, 630::smallint),
             (2::smallint, '2限', 640::smallint, 730::smallint),
             (3::smallint, '3限', 780::smallint, 870::smallint),
             (4::smallint, '4限', 880::smallint, 970::smallint)) as k(ord, name, s, e)
where not exists (
  select 1 from public.my_periods p where p.user_id = v.uid and p.ord = k.ord);

-- ⑦ きょうの レッスン 4つ
--     L1・L2 …… 同じ 時刻・同じ 場所・ちがう 先生 → ★場所の 重なり
--     L3・L4 …… 同じ 時刻・同じ 先生　　　　　　 → ★先生の 重なり
insert into public.lessons
  (org_id, teacher_id, student_id, scheduled_at, duration_minutes, place_id, created_by, note)
select '57ca6d22-3f54-4b85-b0b6-466da875a12d', v.t, v.s,
       (current_date + v.hm) at time zone 'Asia/Tokyo', 90,
       (select id from public.org_places
        where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d' and name = v.place),
       '99b695d8-ae90-43a5-9767-a8d073a4003d', v.note
from (values
  ('adcab9c5-c35c-423a-a71f-cb6c12b2efe0'::uuid, 'c66967ef-6c37-4237-8709-1fed6939de22'::uuid,
   time '10:00', '第1教室', '★お試し L1'),
  ('f7520dc1-9154-4524-a350-ba0bcddbf0b2'::uuid, '33481281-0608-4118-aada-8af97b8ab754'::uuid,
   time '10:00', '第1教室', '★お試し L2'),
  ('adcab9c5-c35c-423a-a71f-cb6c12b2efe0'::uuid, 'c66967ef-6c37-4237-8709-1fed6939de22'::uuid,
   time '13:00', '第2教室', '★お試し L3'),
  ('adcab9c5-c35c-423a-a71f-cb6c12b2efe0'::uuid, '33481281-0608-4118-aada-8af97b8ab754'::uuid,
   time '13:00', '第2教室', '★お試し L4')
) as v(t, s, hm, place, note)
where not exists (
  select 1 from public.lessons l
  where l.org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d' and l.note = v.note);

-- ============================================================================
-- ★消す とき（★この 行だけ を 流して ください）
-- ============================================================================
-- delete from public.overlap_notices where lesson_id in (
--   select id from public.lessons
--   where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d' and note like '★お試し L%');
-- delete from public.lessons
--   where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d' and note like '★お試し L%';
-- delete from public.assignments
--   where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d'
--     and teacher_id = 'adcab9c5-c35c-423a-a71f-cb6c12b2efe0';
-- delete from public.enrollments
--   where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d'
--     and student_id in ('c66967ef-6c37-4237-8709-1fed6939de22',
--                        '33481281-0608-4118-aada-8af97b8ab754');
-- delete from public.memberships
--   where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d'
--     and user_id = 'adcab9c5-c35c-423a-a71f-cb6c12b2efe0';
-- delete from public.org_posts
--   where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d' and name = '★非常勤（お試し）';
-- delete from public.org_places
--   where org_id = '57ca6d22-3f54-4b85-b0b6-466da875a12d' and name in ('第1教室', '第2教室');
-- delete from public.my_periods
--   where user_id in ('adcab9c5-c35c-423a-a71f-cb6c12b2efe0',
--                     'c66967ef-6c37-4237-8709-1fed6939de22',
--                     '33481281-0608-4118-aada-8af97b8ab754',
--                     'f7520dc1-9154-4524-a350-ba0bcddbf0b2');
