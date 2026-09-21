-- STEP_0 を確かめるための仕込み（試しの台帳だけ・2026-09-21）
--   たろうの役職に monka_read を足し、はなこの門下宛てのお知らせを1件入れます。
--   閉じたあと、たろうから 0行 に見えることを確かめます。
update public.org_posts
   set perms = perms || '{"monka_read": true}'::jsonb
 where id = '33333333-3333-4333-8333-333333333333';

insert into public.org_messages (id, org_id, teacher_id, author_id, title, body)
values ('aaaa0000-0000-4000-8000-000000000001',
        '11111111-1111-4111-8111-111111111111',
        '4b027d0a-11de-4acc-ae63-f240300c78aa',
        '4b027d0a-11de-4acc-ae63-f240300c78aa',
        '★はなこ門下のやりとり', '★これは門下の中身です。運営から見えてはいけません。')
on conflict (id) do nothing;
