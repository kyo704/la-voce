-- ★契約者の 知らせ の 仕込みを 戻す（★試しの 台帳 だけ・2026-09-21）

update public.memberships set role = 'staff'
 where org_id = '11111111-1111-4111-8111-111111111111'
   and user_id = '4b027d0a-11de-4acc-ae63-f240300c78aa';

update public.organizations
   set contract_owner_user_id = '4b027d0a-11de-4acc-ae63-f240300c78aa'
 where id = '11111111-1111-4111-8111-111111111111';
