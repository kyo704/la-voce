-- ★束0 を 戻す（2026-09-22）。★当てる 前の 本番の 形に 戻します。
--   ★★足した 列は 残します（★消すと 写した 名前が 消えます）。
begin;

alter table public.lessons drop constraint if exists lessons_student_id_fkey;
alter table public.lessons add constraint lessons_student_id_fkey
  foreign key (student_id) references auth.users(id);
alter table public.lessons drop constraint if exists lessons_teacher_id_fkey;
alter table public.lessons add constraint lessons_teacher_id_fkey
  foreign key (teacher_id) references auth.users(id);
alter table public.lessons drop constraint if exists lessons_created_by_fkey;
alter table public.lessons add constraint lessons_created_by_fkey
  foreign key (created_by) references auth.users(id);
alter table public.lessons drop constraint if exists lessons_attendance_by_fkey;
alter table public.lessons add constraint lessons_attendance_by_fkey
  foreign key (attendance_by) references auth.users(id);

alter table public.organizations drop constraint if exists organizations_created_by_fkey;
alter table public.organizations add constraint organizations_created_by_fkey
  foreign key (created_by) references auth.users(id);

alter table public.org_invitations drop constraint if exists org_invitations_used_by_fkey;
alter table public.org_invitations add constraint org_invitations_used_by_fkey
  foreign key (used_by) references auth.users(id);
alter table public.org_invitations drop constraint if exists org_invitations_invited_by_fkey;
alter table public.org_invitations add constraint org_invitations_invited_by_fkey
  foreign key (invited_by) references auth.users(id);

alter table public.roster_drafts drop constraint if exists roster_drafts_linked_user_id_fkey;
alter table public.roster_drafts add constraint roster_drafts_linked_user_id_fkey
  foreign key (linked_user_id) references auth.users(id);
alter table public.roster_drafts drop constraint if exists roster_drafts_imported_by_fkey;
alter table public.roster_drafts add constraint roster_drafts_imported_by_fkey
  foreign key (imported_by) references auth.users(id);

alter table public.lesson_presets drop constraint if exists lesson_presets_created_by_fkey;
alter table public.lesson_presets add constraint lesson_presets_created_by_fkey
  foreign key (created_by) references auth.users(id);

alter table public.teacher_invitations drop constraint if exists teacher_invitations_used_by_student_id_fkey;
alter table public.teacher_invitations add constraint teacher_invitations_used_by_student_id_fkey
  foreign key (used_by_student_id) references auth.users(id);

alter table public.evaluation_scores drop constraint if exists evaluation_scores_judge_id_fkey;
alter table public.evaluation_scores add constraint evaluation_scores_judge_id_fkey
  foreign key (judge_id) references auth.users(id) on delete cascade;
alter table public.evaluation_reviews drop constraint if exists evaluation_reviews_judge_id_fkey;
alter table public.evaluation_reviews add constraint evaluation_reviews_judge_id_fkey
  foreign key (judge_id) references auth.users(id) on delete cascade;

alter table public.org_messages drop constraint if exists org_messages_author_id_fkey;
alter table public.org_messages add constraint org_messages_author_id_fkey
  foreign key (author_id) references auth.users(id) on delete cascade;
alter table public.org_messages drop constraint if exists org_messages_teacher_id_fkey;
alter table public.org_messages add constraint org_messages_teacher_id_fkey
  foreign key (teacher_id) references auth.users(id) on delete cascade;

alter table public.monka_read_log drop constraint if exists monka_read_log_viewer_user_id_fkey;
alter table public.monka_read_log add constraint monka_read_log_viewer_user_id_fkey
  foreign key (viewer_user_id) references auth.users(id) on delete cascade;
alter table public.monka_read_log drop constraint if exists monka_read_log_target_monka_id_fkey;
alter table public.monka_read_log add constraint monka_read_log_target_monka_id_fkey
  foreign key (target_monka_id) references auth.users(id) on delete cascade;

alter table public.post_change_log drop constraint if exists post_change_log_target_user_id_fkey;
alter table public.post_change_log add constraint post_change_log_target_user_id_fkey
  foreign key (target_user_id) references auth.users(id) on delete cascade;

alter table public.score_log drop constraint if exists score_log_editor_user_id_fkey;
alter table public.score_log add constraint score_log_editor_user_id_fkey
  foreign key (editor_user_id) references auth.users(id) on delete cascade;

commit;
