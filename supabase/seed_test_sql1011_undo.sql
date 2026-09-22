delete from public.lesson_prefs where round_id in
  ('44444444-4444-4444-8444-444444444441','44444444-4444-4444-8444-444444444442');
delete from public.lesson_rounds where id in
  ('44444444-4444-4444-8444-444444444441','44444444-4444-4444-8444-444444444442');
delete from public.page_inquiries where owner_user_id in
  ('eafa63c2-4592-4996-8c7c-18ecbec5a34f','6fdc5121-adab-4962-a202-6d7c340ea994');
update public.portfolios set public_slug = null, visibility = 'self'
 where user_id in ('eafa63c2-4592-4996-8c7c-18ecbec5a34f','6fdc5121-adab-4962-a202-6d7c340ea994');
