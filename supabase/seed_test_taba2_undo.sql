-- ★束2 の 試しの 行を 消す（★試しの 台帳だけ）
delete from public.org_messages where id = 'cc000000-0000-4000-8000-000000000003';
delete from public.applications  where id = 'cccccccc-0000-4000-8000-000000000003';
delete from public.character_inventory
 where user_id = 'eafa63c2-4592-4996-8c7c-18ecbec5a34f' and item_key = 'hat_straw';
