-- ★本番の 台帳から 写しました（cleanup_test_enrollments_final）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


delete from public.assignments
where org_id = '27d4ed3a-9b7c-4d2b-a924-92fe65fb6efd'
  and student_id in (
    '99b695d8-ae90-43a5-9767-a8d073a4003d',
    'c66967ef-6c37-4237-8709-1fed6939de22',
    '33481281-0608-4118-aada-8af97b8ab754',
    '63003c36-9591-4cbb-b802-501caf5c075e',
    '4282937d-9561-4bdf-946b-c47bfda9018f',
    '8ba56d4c-295c-4b74-9e74-ed06eb6aecf0'
  );

delete from public.enrollments
where org_id = '27d4ed3a-9b7c-4d2b-a924-92fe65fb6efd'
  and student_id in (
    '99b695d8-ae90-43a5-9767-a8d073a4003d',
    'c66967ef-6c37-4237-8709-1fed6939de22',
    '33481281-0608-4118-aada-8af97b8ab754',
    '63003c36-9591-4cbb-b802-501caf5c075e',
    '4282937d-9561-4bdf-946b-c47bfda9018f',
    '8ba56d4c-295c-4b74-9e74-ed06eb6aecf0'
  );

