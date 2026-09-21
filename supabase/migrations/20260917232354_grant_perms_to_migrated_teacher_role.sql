-- ★本番の 台帳から 写しました（grant_perms_to_migrated_teacher_role）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


update public.org_posts p
   set perms = jsonb_build_object(
         'sched_mine',  true,
         'monka_write', true,
         'shukketsu',   true,
         'koma_mine',   true
       )
 where p.name = '（移行）先生'
   and (p.perms is null or p.perms = '{}'::jsonb);

