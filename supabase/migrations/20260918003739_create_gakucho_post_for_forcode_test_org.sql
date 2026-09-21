-- ★本番の 台帳から 写しました（create_gakucho_post_for_forcode_test_org）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


insert into public.org_posts (org_id, name, perms)
select m.org_id, '学長',
       jsonb_build_object('bill', true, 'bill_pay', true, 'meibo', true,
         'sched_all', true, 'gyoji', true, 'renraku_all', true,
         'shukketsu', true, 'koma', true, 'master', true, 'post', true)
  from public.memberships m
  join public.organizations o on o.id = m.org_id
 where m.user_id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com')
   and o.name like '%消してよい%'
   and not exists (select 1 from public.org_posts p
                    where p.org_id = m.org_id and p.name = '学長');

