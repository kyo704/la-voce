-- ============================================================================
-- ★試しの 台帳に、★くらべる ための 学校を 1つ（★D115・2026-09-20）
--
--   ★★★流す 先は **試しの 台帳** だけ です（`--test`）。
--     ★★本番には 1文字も 触れません。
--   ★★入る 方は `kyo0703opera+localtest@gmail.com`（★坂本さんが お作りに なりました）。
--   ★★中身は 本番の お試しと 同じ 形 ── ★先生2人・生徒2人・コマ4つ・重なり3つ。
--
--   ★日づけは **きょう** です。★何度 流しても 同じに なります。
-- ============================================================================

-- ① 学校
insert into public.organizations (id, name, kind, created_by)
select '11111111-1111-4111-8111-111111111111',
       '★くらべ用（消してよい）', 'school',
       (select id from auth.users where email = 'kyo0703opera+localtest@gmail.com')
where not exists (select 1 from public.organizations
                  where id = '11111111-1111-4111-8111-111111111111');

-- ② 役職（★ぜんぶ できる 学長 と、★自分の 日程だけ の 非常勤）
insert into public.org_posts (id, org_id, name, perms, sort_order)
select '22222222-2222-4222-8222-222222222222',
       '11111111-1111-4111-8111-111111111111', '学長',
       '{"bill": true, "koma": true, "post": true, "gyoji": true, "meibo": true,
         "master": true, "bill_pay": true, "sched_all": true, "shukketsu": true,
         "renraku_all": true, "monka_write": true, "saiten": true}'::jsonb, 1
where not exists (select 1 from public.org_posts
                  where id = '22222222-2222-4222-8222-222222222222');

insert into public.org_posts (id, org_id, name, perms, sort_order)
select '33333333-3333-4333-8333-333333333333',
       '11111111-1111-4111-8111-111111111111', '★非常勤（お試し）',
       '{"sched_mine": true, "shukketsu": true}'::jsonb, 90
where not exists (select 1 from public.org_posts
                  where id = '33333333-3333-4333-8333-333333333333');

-- ③ 入る 方を 学長に
insert into public.memberships (org_id, user_id, role, post_id)
select '11111111-1111-4111-8111-111111111111',
       (select id from auth.users where email = 'kyo0703opera+localtest@gmail.com'),
       'owner', '22222222-2222-4222-8222-222222222222'
where not exists (
  select 1 from public.memberships
  where org_id = '11111111-1111-4111-8111-111111111111'
    and user_id = (select id from auth.users
                   where email = 'kyo0703opera+localtest@gmail.com'));

-- ④ もう 1人を 非常勤の 先生に（★居れば）
insert into public.memberships (org_id, user_id, role, post_id)
select '11111111-1111-4111-8111-111111111111',
       (select id from auth.users where email = 'kyo0703opera+unconfirmed@gmail.com'),
       'teacher', '33333333-3333-4333-8333-333333333333'
where exists (select 1 from auth.users where email = 'kyo0703opera+unconfirmed@gmail.com')
  and not exists (
    select 1 from public.memberships
    where org_id = '11111111-1111-4111-8111-111111111111'
      and user_id = (select id from auth.users
                     where email = 'kyo0703opera+unconfirmed@gmail.com'));

-- ⑤ 学校の 形・場所・コマ
insert into public.org_divisions (id, org_id, kind, name, sort_order)
select '44444444-4444-4444-8444-444444444444',
       '11111111-1111-4111-8111-111111111111', 'department', '声楽', 1
where not exists (select 1 from public.org_divisions
                  where id = '44444444-4444-4444-8444-444444444444');

insert into public.org_places (org_id, name, ord)
values ('11111111-1111-4111-8111-111111111111', '第1教室', 1),
       ('11111111-1111-4111-8111-111111111111', '第2教室', 2)
on conflict (org_id, name) do nothing;

insert into public.org_periods (org_id, ord, name, start_min, end_min)
values ('11111111-1111-4111-8111-111111111111', 1, '1限', 540, 630),
       ('11111111-1111-4111-8111-111111111111', 2, '2限', 640, 730),
       ('11111111-1111-4111-8111-111111111111', 3, '3限', 780, 870),
       ('11111111-1111-4111-8111-111111111111', 4, '4限', 880, 970)
on conflict (org_id, ord) do nothing;

-- ⑥ 生徒（★いる 方を そのまま 生徒にも します。★試しの 台帳です）
insert into public.enrollments (org_id, student_id, status, grade_label, student_number)
select '11111111-1111-4111-8111-111111111111', u.id, 'active', v.g, v.n
from (values ('kyo0703opera+unconfirmed@gmail.com', '1年', 'S-001')) as v(em, g, n)
join auth.users u on u.email = v.em
where not exists (
  select 1 from public.enrollments e
  where e.org_id = '11111111-1111-4111-8111-111111111111' and e.student_id = u.id);

-- ⑦ きょうの レッスン（★同じ 場所・同じ 時刻 → 重なり）
insert into public.lessons
  (org_id, teacher_id, student_id, scheduled_at, duration_minutes, place_id, created_by, note)
select '11111111-1111-4111-8111-111111111111',
       (select id from auth.users where email = v.t),
       (select id from auth.users where email = v.s),
       (current_date + v.hm) at time zone 'Asia/Tokyo', 90,
       (select id from public.org_places
        where org_id = '11111111-1111-4111-8111-111111111111' and name = v.pl),
       (select id from auth.users where email = 'kyo0703opera+localtest@gmail.com'),
       v.note
from (values
  ('kyo0703opera+localtest@gmail.com', 'kyo0703opera+unconfirmed@gmail.com',
   time '10:00', '第1教室', '★くらべ用 L1'),
  ('kyo0703opera+unconfirmed@gmail.com', 'kyo0703opera+unconfirmed@gmail.com',
   time '10:00', '第1教室', '★くらべ用 L2'),
  ('kyo0703opera+localtest@gmail.com', 'kyo0703opera+unconfirmed@gmail.com',
   time '13:00', '第2教室', '★くらべ用 L3')
) as v(t, s, hm, pl, note)
where exists (select 1 from auth.users where email = v.t)
  and exists (select 1 from auth.users where email = v.s)
  and not exists (
    select 1 from public.lessons l
    where l.org_id = '11111111-1111-4111-8111-111111111111' and l.note = v.note);
