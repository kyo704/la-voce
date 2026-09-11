-- ============================================================================
-- §3 ★50通り ── ★在籍（enrollments）と 受け持ち（assignments）の 種まき
--
--   ★なぜ ★lessons の 決まりは `can_view_ops(auth.uid(), org_id, student_id)` を
--     ★見ます。★その 関数は こう 尋ねます ──
--       ★① 在籍（enrollments）が active か
--       ★② 見る 方が owner／admin か、★または
--          ★受け持ち（assignments）の 生きて いる 行を 持つ 先生か
--     ★★使い捨ての 10校には、★その どちらも 置いて いません。
--     ★★だから 学長でも 落ちました ── ★役職の 話では ありません でした。
--
--   ★列の 名前は、★画面の コードから 写しました（★当てずっぽうで ありません）。
--     ★enrollments … org_id／student_id／status　（★app/api/enrollment/accept/route.js:115）
--     ★assignments … org_id／teacher_id／student_id／ended_at　（★VocalTracker.jsx:9773）
--
--   ★★生徒も 先生も、★同じ 使い捨ての アカウントです。
--     ★★本物の 方の 行を 作りません。
--
--   ★★触るのは、★名前が「★50通り」で 始まる 学校だけです。
--   ★★1つずつ 流して ください。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ① ★在籍を 1つずつ 置く（★10校）
-- ────────────────────────────────────────────────────────────────
insert into public.enrollments (org_id, student_id, status)
select o.id, 'f7520dc1-9154-4524-a350-ba0bcddbf0b2', 'active'
from public.organizations o
where o.name like '★50通り-%'
on conflict (org_id, student_id) do update set status = 'active';


-- ────────────────────────────────────────────────────────────────
-- ② ★受け持ちを 1つずつ 置く（★10校）
--    ★★ended_at は 空の まま です（★生きて いる 受け持ち）。
-- ────────────────────────────────────────────────────────────────
insert into public.assignments (org_id, teacher_id, student_id)
select o.id,
       'f7520dc1-9154-4524-a350-ba0bcddbf0b2',
       'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
from public.organizations o
where o.name like '★50通り-%'
  and not exists (
    select 1 from public.assignments a
    where a.org_id = o.id
      and a.teacher_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
      and a.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
      and a.ended_at is null
  );


-- ────────────────────────────────────────────────────────────────
-- ③ ★確かめ ── ★10校 それぞれに 1つずつ あるか
-- ────────────────────────────────────────────────────────────────
select o.name as "学校",
       (select count(*) from public.enrollments e
         where e.org_id = o.id and e.status = 'active')      as "在籍",
       (select count(*) from public.assignments a
         where a.org_id = o.id and a.ended_at is null)       as "受け持ち"
from public.organizations o
where o.name like '★50通り-%'
order by o.name;

-- ★★期待 ── 10行。★在籍 1・受け持ち 1 が 10回。


-- ────────────────────────────────────────────────────────────────
-- ④ ★お片づけ（★50通りが すっかり 終わってから）
--    ★★下ごしらえの ⑥ より 先に、★こちらを 流して ください。
--      ★★学校を 先に 消すと、★つながり先が 無くなります。
-- ────────────────────────────────────────────────────────────────
-- delete from public.assignments
--   where org_id in (select id from public.organizations where name like '★50通り-%');
-- delete from public.enrollments
--   where org_id in (select id from public.organizations where name like '★50通り-%');
