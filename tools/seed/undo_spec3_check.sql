-- 仕様シート③の仕込みを戻す（試しの台帳だけ・2026-09-21）
update public.org_posts set perms = perms - 'post'
 where id = '33333333-3333-4333-8333-333333333333';
update public.memberships set post_id = null
 where org_id = '11111111-1111-4111-8111-111111111111'
   and user_id = 'dc8f0554-3aa1-496c-be26-d7c07ece8380';
