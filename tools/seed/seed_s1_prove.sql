-- S1 の ①②②b を確かめるための仕込み（試しの台帳だけ・2026-09-21・裁定112 の形）
--
--   なぜ実在の利用者を作るか
--     なりすまし（set local role ＋ set_config）は BEGIN/ROLLBACK が要ります。
--     この品では BEGIN/ROLLBACK を使いません（2026-09-15 の一件・ask_ledger 決まり3）。
--     ロールバックが効かなかったことが一度あり、権限がそのまま残りました。
--     だから、確かめ用の利用者を本当に作り、本当に入って引きます。
--
--   作るのは試しの台帳だけです。本番には1行も入れません。
--   何度流しても同じです。
--
--   先生役 …… 3edb38a1（★合言葉を持っている確かめ用。先生として門下を持ちます）
--   学生1 …… 6fdc5121（先生役の門下）
--   別の門下 …… eafa63c2（たろう）が先生の組。学生1 から見えないことを見ます
--   ★はなこ（4b027d0a）は使いません。合言葉を持っていないためです。

-- ① 合言葉で入れるようにします（作ったばかりで未確認のため）
update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now())
 where email in ('kyo0703opera+s1check@gmail.com', 'kyo0703opera+s2check@gmail.com');

-- ② 年齢の答え（assignments の見張りが未回答を弾きます）
update public.profiles set is_under_18 = false
 where id in ('6fdc5121-adab-4962-a202-6d7c340ea994',
              '3edb38a1-9428-4656-a4f0-0b5f845e1408');

-- ③ 在籍
insert into public.enrollments (id, org_id, student_id, status)
values
  ('e1000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111',
   '6fdc5121-adab-4962-a202-6d7c340ea994', 'active'),
  ('e1000000-0000-4000-8000-000000000002',
   '11111111-1111-4111-8111-111111111111',
   '3edb38a1-9428-4656-a4f0-0b5f845e1408', 'active')
on conflict (id) do nothing;

-- ④ 門下（学生1 は はなこ、学生2 は たろう）
insert into public.assignments (id, org_id, teacher_id, student_id)
values
  ('a1000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111',
   '3edb38a1-9428-4656-a4f0-0b5f845e1408',
   '6fdc5121-adab-4962-a202-6d7c340ea994')
on conflict (id) do nothing;

-- ⑤ 先生役の門下のやりとり 3件
insert into public.org_messages (id, org_id, teacher_id, author_id, title, body)
values
  ('b1000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111',
   '3edb38a1-9428-4656-a4f0-0b5f845e1408',
   '3edb38a1-9428-4656-a4f0-0b5f845e1408', '★門下1', '★門下のやりとり 1'),
  ('b1000000-0000-4000-8000-000000000002',
   '11111111-1111-4111-8111-111111111111',
   '3edb38a1-9428-4656-a4f0-0b5f845e1408',
   '3edb38a1-9428-4656-a4f0-0b5f845e1408', '★門下2', '★門下のやりとり 2'),
  ('b1000000-0000-4000-8000-000000000003',
   '11111111-1111-4111-8111-111111111111',
   '3edb38a1-9428-4656-a4f0-0b5f845e1408',
   '3edb38a1-9428-4656-a4f0-0b5f845e1408', '★門下3', '★門下のやりとり 3')
on conflict (id) do nothing;

-- ⑥ 別の門下（たろうが先生）のやりとり 1件。★学生1 から見えないことを見ます。
insert into public.org_messages (id, org_id, teacher_id, author_id, title, body)
values ('b1000000-0000-4000-8000-000000000009',
        '11111111-1111-4111-8111-111111111111',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f',
        'eafa63c2-4592-4996-8c7c-18ecbec5a34f', '★別の門下', '★別の門下のやりとり')
on conflict (id) do nothing;
