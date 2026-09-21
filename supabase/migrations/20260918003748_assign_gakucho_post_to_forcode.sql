-- ★本番の 台帳から 写しました（assign_gakucho_post_to_forcode）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


update public.memberships m
   set post_id = (select p.id from public.org_posts p
                   where p.org_id = m.org_id and p.name = '学長' limit 1)
 where m.user_id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com')
   and m.org_id in (select o.id from public.organizations o where o.name like '%消してよい%')
   and m.post_id is null;

