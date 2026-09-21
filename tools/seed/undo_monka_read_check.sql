-- STEP_0 の仕込みを戻す（試しの台帳だけ・2026-09-21）
delete from public.org_messages where id = 'aaaa0000-0000-4000-8000-000000000001';
update public.org_posts set perms = perms - 'monka_read'
 where id = '33333333-3333-4333-8333-333333333333';
