-- 裁定151 の仕込みを戻す（試しの台帳だけ・2026-09-21）
delete from public.my_periods where id in (
  '88880000-0000-4000-8000-000000000001',
  '88880000-0000-4000-8000-000000000002',
  '88880000-0000-4000-8000-000000000003');
delete from public.memberships where id = '77777777-7777-4777-8777-777777777777';
delete from public.org_posts where id = '66666666-6666-4666-8666-666666666666';
delete from public.organizations where id = '55555555-5555-4555-8555-555555555555';
update public.org_posts set perms = perms - 'koma_mine'
 where id = '33333333-3333-4333-8333-333333333333';
