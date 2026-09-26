-- ============================================================================
-- ★試しの 台帳 だけ ── ★「希望が まだの方」の 見比べ 用の 種（★2026-09-26）
--
--   ★★見本（運営）`P_wariMada` は 6人 並べて います ──
--     ★お名前 と 学年（★「ミュージカル3年」── ★空きを 入れません。★見本を 数えました）。
--   ★★試しの 口座の 在籍 2人 には お名前も 学年も ありません でした。
--     ★★見本と 同じ 字に します（★Opus の ご指示「fixed test data」）。
--
--   ★★★体調の 列には 1つも 触りません。★名と 学年 だけ です。
--   ★★本番に 入れません。★`la-voce-test2` だけ です。
-- ============================================================================

update public.profiles
   set display_name = '松本 はる'
 where id = 'de94a80a-39cb-492c-8903-9c4e2d1e5a8f';

update public.profiles
   set display_name = '小林 ゆづき'
 where id = 'f5569bb1-3dc4-4d70-9803-5c789c34f59b';

update public.enrollments
   set grade_label = 'ミュージカル3年'
 where org_id = 'aaaa0001-0000-4000-8000-000000000001'
   and student_id = 'de94a80a-39cb-492c-8903-9c4e2d1e5a8f';

update public.enrollments
   set grade_label = '作曲1年'
 where org_id = 'aaaa0001-0000-4000-8000-000000000001'
   and student_id = 'f5569bb1-3dc4-4d70-9803-5c789c34f59b';

-- ★★回の 名も 見本に 合わせます（★見本 ── 「2026年度 前期」）。
update public.lesson_rounds
   set name = '2026年度 前期'
 where id = 'bbbb0001-0000-4000-8000-000000000001';
