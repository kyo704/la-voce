-- ★束2 の 試しの 行を 消す（★試しの 台帳だけ）
delete from public.org_messages where id = 'cc000000-0000-4000-8000-000000000003';
delete from public.applications  where id = 'cccccccc-0000-4000-8000-000000000003';
delete from public.character_inventory
 where user_id = 'eafa63c2-4592-4996-8c7c-18ecbec5a34f' and item_key = 'hat_straw';

-- ★試験で 動いた ぶんを 戻します
update public.postings set status = 'open'
 where id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.applications set status = 'sent'
 where id in ('cccccccc-0000-4000-8000-000000000001',
              'cccccccc-0000-4000-8000-000000000002');
update public.org_messages set withdrawn_at = null
 where id in ('cc000000-0000-4000-8000-000000000001',
              'cc000000-0000-4000-8000-000000000002');
delete from public.monka_read_log
 where viewer_user_id = 'eafa63c2-4592-4996-8c7c-18ecbec5a34f';
update public.org_posts
   set perms = perms - 'monka_read'
 where org_id = '11111111-1111-4111-8111-111111111111'
   and name = '学部長';
