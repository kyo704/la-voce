-- clear_my_busy_slots の仕込みを戻す（試しの台帳だけ・2026-09-21）
delete from public.my_timetable where id in (
  '99991111-0000-4000-8000-000000000001',
  '99991111-0000-4000-8000-000000000002');
delete from public.my_periods where id in (
  '99990000-0000-4000-8000-000000000001',
  '99990000-0000-4000-8000-000000000002');
