-- ★連絡が 0件 の 学校（★実行ルート 5-3 の Playwright の ため）★試しの 台帳だけ
--   ★★見る こと …… 一覧が 空でも「＋ おしらせを 書く」が 出るか（★裁定120）。
--   ★★だから 連絡も 門下も 0件 の 学校が 要ります。

insert into public.organizations (id, name, kind, created_by)
values ('22222222-2222-4222-8222-222222222222', '★からっぽの 学校（5-3の ため）', 'studio',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f')
on conflict (id) do nothing;

-- ★役職 …… ★書ける 人（renraku_all）
insert into public.org_posts (id, org_id, name, perms)
values ('33333333-3333-4333-8333-333333333331',
        '22222222-2222-4222-8222-222222222222', '事務長',
        '{"renraku_all": true, "meibo": true}'::jsonb)
on conflict (id) do nothing;

-- ★役職 …… ★書けない 人（較正の ため）
insert into public.org_posts (id, org_id, name, perms)
values ('33333333-3333-4333-8333-333333333332',
        '22222222-2222-4222-8222-222222222222', '職員',
        '{"meibo": true}'::jsonb)
on conflict (id) do nothing;

insert into public.memberships (org_id, user_id, role, post_id)
values ('22222222-2222-4222-8222-222222222222',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f', 'admin',
        '33333333-3333-4333-8333-333333333331')
on conflict (org_id, user_id) do update set post_id = excluded.post_id;
