-- ============================================================================
-- ★実機の 確かめ用 ── ★坂本さんの 学校に、★生徒を 1人 置く
--
--   ★なぜ　★名簿の 画面は enrollments を 読みます（★2026-09-13・裁定 その21）。
--     ★★坂本さんが owner の 学校（d865bf90…）は enrollments が 0件です。
--     ★★直って いても、★名簿は 空の ままに 見えます。
--
--   ★置く もの　★生徒 1人（★使い捨ての アカウント）と、★その 担当（★坂本さん）。
--   ★★本物の 方の 行は 1つも 作りません。
--   ★★消す 手（⑥）を 下に 付けて あります。
--
--   ★1つずつ 流して ください。①②は 読むだけ。
-- ============================================================================

-- ① 学校を 確かめる（読むだけ）
select o.id, o.name, o.kind, o.created_by,
       (select count(*) from public.enrollments e where e.org_id = o.id) as "在籍",
       (select count(*) from public.memberships m where m.org_id = o.id) as "職員"
from public.organizations o
join auth.users u on u.id = o.created_by
where u.email = 'kyo0703opera@gmail.com'
order by o.created_at;
-- ★★どの 学校に 置くかを 決めて ください。★id を 控えます（★以下 <ORG>）。

-- ② 坂本さんご自身が その 学校の 名簿に 居るか（読むだけ）
select m.role, m.post_id
from public.memberships m
join auth.users u on u.id = m.user_id
where m.org_id = '<ORG>' and u.email = 'kyo0703opera@gmail.com';
-- ★★0行なら、★運営モードに 入れません。★お知らせ ください。

-- ③ 生徒を 1人 置く（★使い捨ての アカウント）
insert into public.enrollments (org_id, student_id, status)
values ('<ORG>', 'f7520dc1-9154-4524-a350-ba0bcddbf0b2', 'active')
on conflict (org_id, student_id) do update set status = 'active';

-- ④ 担当を 付ける（★先生＝坂本さん、★生徒＝使い捨て）
--    ★★A4 の「名簿と 担当を、一つの 場所に 持てます」を 見る ため。
insert into public.assignments (org_id, teacher_id, student_id)
select '<ORG>', u.id, 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
from auth.users u
where u.email = 'kyo0703opera@gmail.com'
  and not exists (
    select 1 from public.assignments a
    where a.org_id = '<ORG>'
      and a.teacher_id = u.id
      and a.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
      and a.ended_at is null
  );

-- ⑤ 確かめ（読むだけ）
select e.status as "ようす", e.grade_label as "学年の 札",
       (select count(*) from public.assignments a
         where a.org_id = e.org_id and a.student_id = e.student_id
           and a.ended_at is null) as "担当の 数"
from public.enrollments e
where e.org_id = '<ORG>';
-- ★★期待 ── 1行。active ／ 空 ／ 1。

-- ════════════════════════════════════════════════════════════
--   ★実機で 見る もの
--     ① もっと →「◯◯の運営」→「名簿」
--        ★★在籍 1人。★行が 1つ 出る。
--     ② その 行に「担当」が 出る（★坂本さんの お名前）
--     ③ 学年の 札を 入れて みる（★meibo を 持つ 方だけ 直せます）
--     ④「日程」の タブ
--   ★★役職の 行は 出ません。★生徒は 役職を 持ちません（★10月19日に 別画面）。
-- ════════════════════════════════════════════════════════════

-- ⑥ お片づけ（★確かめが 済んでから）
-- delete from public.assignments
--   where org_id = '<ORG>' and student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';
-- delete from public.enrollments
--   where org_id = '<ORG>' and student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';
