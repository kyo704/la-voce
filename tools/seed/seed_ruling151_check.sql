-- 裁定151 を確かめるための仕込み（試しの台帳だけ・2026-09-21）
--
--   いま確かめられないわけ
--     my_periods が 0行。学校が 1つ。B校が無いと Q2（A校の札でB校を書けない）
--     を見られません。
--
--   入れるもの
--     ① B校（★くらべ用B学科）と、koma_mine を持たない役職
--     ② たろうを B校にも在籍させる（2校在籍・裁定140 の形）
--     ③ A校の学部長に koma_mine を足す（A校では持つ／B校では持たない）
--     ④ たろうと はなこ の my_periods を A校の行として入れる
--        （はなこの行は Q5 ── 事務が同じ学校の先生のコマを読めるか に使います）
--
--   戻し方は tools/seed/undo_ruling151_check.sql にあります。

insert into public.organizations (id, name, kind, created_by, contract_owner_user_id)
values ('55555555-5555-4555-8555-555555555555', '★くらべ用B学科', 'studio',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f', 'eafa63c2-4592-4996-8c7c-18ecbec5a34f')
on conflict (id) do nothing;

insert into public.org_posts (id, org_id, name, perms)
values ('66666666-6666-4666-8666-666666666666',
        '55555555-5555-4555-8555-555555555555', 'B校の係',
        '{"meibo": true, "sched_all": true}'::jsonb)
on conflict (id) do nothing;

insert into public.memberships (id, org_id, user_id, role, post_id)
values ('77777777-7777-4777-8777-777777777777',
        '55555555-5555-4555-8555-555555555555',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f', 'owner',
        '66666666-6666-4666-8666-666666666666')
on conflict (id) do nothing;

-- A校の学部長に koma_mine を足します（B校の係には足しません）
update public.org_posts
   set perms = perms || '{"koma_mine": true}'::jsonb
 where id = '33333333-3333-4333-8333-333333333333';

-- A校のコマ（たろう＝事務でもあり先生でもある／はなこ＝別の先生）
insert into public.my_periods (id, user_id, org_id, ord, name, start_min, end_min)
values
  ('88880000-0000-4000-8000-000000000001',
   'eafa63c2-4592-4996-8c7c-18ecbec5a34f',
   '11111111-1111-4111-8111-111111111111', 1, '1限', 540, 600),
  ('88880000-0000-4000-8000-000000000002',
   '4b027d0a-11de-4acc-ae63-f240300c78aa',
   '11111111-1111-4111-8111-111111111111', 1, 'はなこ1限', 545, 605),
  ('88880000-0000-4000-8000-000000000003',
   '4b027d0a-11de-4acc-ae63-f240300c78aa',
   null, 1, 'はなこ個人', 400, 440)
on conflict (id) do nothing;
