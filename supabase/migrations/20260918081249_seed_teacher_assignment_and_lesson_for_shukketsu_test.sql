-- ★本番の 台帳から 写しました（seed_teacher_assignment_and_lesson_for_shukketsu_test）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


-- 在籍を戻す
insert into public.enrollments (org_id, student_id, status)
values ('27d4ed3a-9b7c-4d2b-a924-92fe65fb6efd', 'c66967ef-6c37-4237-8709-1fed6939de22', 'active')
on conflict (org_id, student_id) do update set status = 'active', left_at = null;

-- 受け持ちを作る（坂本さん自身が先生）
insert into public.assignments (org_id, teacher_id, student_id)
values ('27d4ed3a-9b7c-4d2b-a924-92fe65fb6efd', '99b695d8-ae90-43a5-9767-a8d073a4003d', 'c66967ef-6c37-4237-8709-1fed6939de22');

-- 今日のレッスンを1件作る（未記録）
insert into public.lessons (org_id, teacher_id, student_id, scheduled_at, duration_minutes, created_by)
values ('27d4ed3a-9b7c-4d2b-a924-92fe65fb6efd', '99b695d8-ae90-43a5-9767-a8d073a4003d', 'c66967ef-6c37-4237-8709-1fed6939de22', (current_date + time '15:00') at time zone 'Asia/Tokyo', 45, '99b695d8-ae90-43a5-9767-a8d073a4003d');

