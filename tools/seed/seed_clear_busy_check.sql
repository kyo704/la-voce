-- clear_my_busy_slots を確かめるための仕込み（試しの台帳だけ・2026-09-21）
--   たろう と はなこ に、コマ1つと「来られない」印を1つずつ入れます。
--   たろうが外したとき、はなこの印が残ることを見ます。
insert into public.my_periods (id, user_id, org_id, ord, name, start_min, end_min)
values
  ('99990000-0000-4000-8000-000000000001',
   'eafa63c2-4592-4996-8c7c-18ecbec5a34f', null, 1, 'たろう1限', 540, 600),
  ('99990000-0000-4000-8000-000000000002',
   '4b027d0a-11de-4acc-ae63-f240300c78aa', null, 1, 'はなこ1限', 540, 600)
on conflict (id) do nothing;

insert into public.my_timetable (id, user_id, weekday, period_id, unavailable)
values
  ('99991111-0000-4000-8000-000000000001',
   'eafa63c2-4592-4996-8c7c-18ecbec5a34f', 1,
   '99990000-0000-4000-8000-000000000001', true),
  ('99991111-0000-4000-8000-000000000002',
   '4b027d0a-11de-4acc-ae63-f240300c78aa', 1,
   '99990000-0000-4000-8000-000000000002', true)
on conflict (id) do nothing;
