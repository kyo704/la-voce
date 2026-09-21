-- ★本番の 台帳から 写しました（seed_visual_demo_3sections）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


insert into public.org_events (org_id, event_date, start_time, end_time, kind, title, created_by)
select t.org_id,
       current_date + 3,
       time '14:00',
       time '16:00',
       '合わせ',
       '★見本-2026-09-16 伴奏合わせ',
       t.teacher_id
from (
  select a.org_id, a.teacher_id
  from public.assignments a
  join public.enrollments e
    on e.org_id = a.org_id and e.student_id = a.student_id and e.status = 'active'
  where a.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
    and a.ended_at is null
  order by a.org_id
  limit 1
) t
where not exists (
  select 1 from public.org_events x
   where x.org_id = t.org_id and x.title = '★見本-2026-09-16 伴奏合わせ'
);

insert into public.lessons (org_id, teacher_id, student_id, scheduled_at, duration_minutes, note, created_by)
select t.org_id,
       t.teacher_id,
       'f7520dc1-9154-4524-a350-ba0bcddbf0b2',
       (current_date + 2) + time '15:00',
       45,
       '★見本-2026-09-16 レッスン',
       t.teacher_id
from (
  select a.org_id, a.teacher_id
  from public.assignments a
  join public.enrollments e
    on e.org_id = a.org_id and e.student_id = a.student_id and e.status = 'active'
  where a.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
    and a.ended_at is null
  order by a.org_id
  limit 1
) t
where not exists (
  select 1 from public.lessons x
   where x.org_id = t.org_id
     and x.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
     and x.note = '★見本-2026-09-16 レッスン'
);

insert into public.org_messages (org_id, teacher_id, author_id, body)
select t.org_id,
       t.teacher_id,
       t.teacher_id,
       '★見本-2026-09-16　来週の 合わせは 14時からです。楽譜を お持ちください。'
from (
  select a.org_id, a.teacher_id
  from public.assignments a
  join public.enrollments e
    on e.org_id = a.org_id and e.student_id = a.student_id and e.status = 'active'
  where a.student_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
    and a.ended_at is null
  order by a.org_id
  limit 1
) t
where not exists (
  select 1 from public.org_messages x
   where x.org_id = t.org_id and x.body like '★見本-2026-09-16%'
);

