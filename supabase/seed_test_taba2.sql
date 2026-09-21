-- ★束2 を 確かめる ために、★**試しの 台帳だけ** に 入れる 行（2026-09-22）
--   ★★本番には 入れません。★`--test` を 付けて 流します。
--   ★★要る わけ …… いまの 試しの 台帳では 較正が 2つ 足りません。
--        ・よその 人が 書いた 連絡が 0件（★③が 確かめられない）
--        ・local2 の 応募が 0件（★⑤⑥が 確かめられない）

-- ① よその 人（s1check）が 書いた 連絡
insert into public.org_messages (id, org_id, teacher_id, author_id, body, title)
values ('cc000000-0000-4000-8000-000000000003',
        '11111111-1111-4111-8111-111111111111',
        null,
        '6fdc5121-adab-4962-a202-6d7c340ea994',
        '★試し ── よその 人が 書いた 連絡（束2 の 較正 用）', null)
on conflict (id) do nothing;

-- ② local2 の 応募
insert into public.applications
  (id, posting_id, applicant_user_id, org_id, available_days, template_key, status)
-- ★よその 方の 募集に 応募します（★自分の 募集には 応募しません）。
values ('cccccccc-0000-4000-8000-000000000003',
        'aaaaaaaa-0000-4000-8000-000000000002',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f',
        (select org_id from public.postings where id = 'aaaaaaaa-0000-4000-8000-000000000002'),
        array[current_date + 7], 'ukeraremasu', 'sent')
on conflict (id) do nothing;

-- ③ local2 の 持ち物（★A1 の 較正 用。★⑩⑪が 確かめられません）
insert into public.character_inventory (user_id, item_key)
values ('eafa63c2-4592-4996-8c7c-18ecbec5a34f', 'hat_straw')
on conflict do nothing;

-- ④ 試しの 学校で、門下を 読める できことを 1つ 足します（★較正 ⑧ の ため）
--   ★★試しの 台帳の どの 役職にも `monka_read` が ありません（2026-09-22 に 見ました）。
--   ★★これが 無いと「正しい 道なら 通る」を 確かめられません。
--   ★★★裁定160 の 引き金が `org_post_perm_log` に 1行 残します。★わざと です。
update public.org_posts
   set perms = perms || '{"monka_read": true}'::jsonb
 where org_id = '11111111-1111-4111-8111-111111111111'
   and name = '学部長';
