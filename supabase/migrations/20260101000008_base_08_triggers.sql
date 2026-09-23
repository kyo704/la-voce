-- ★★★土台 ── 引き金
-- ★裁定175 ㋐。★2026-09-23 の 本番（xxjtplvpcneksrofkjmf）の 形を 機械で 書き出した もの。
-- ★★本番には 当てません。★「すでに 当たって いる」と 記録するだけ です。

-- ★25 本（★うち public の 外 …… 1 本）
-- ★★public の 外に 置く 引き金 ── ★中身は `public` の 関数 です。★私たちの もの です。
--   ★★`auth` や `storage` の **中身**（行）は 入れません。★引き金 だけ です。

drop trigger if exists on_auth_user_created on auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

drop trigger if exists trg_assignment_identity_immutable on public.assignments;
CREATE TRIGGER trg_assignment_identity_immutable BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION assert_assignment_identity_unchanged();

drop trigger if exists trg_block_minor_assignment on public.assignments;
CREATE TRIGGER trg_block_minor_assignment BEFORE INSERT OR UPDATE OF student_id ON public.assignments FOR EACH ROW EXECUTE FUNCTION assert_student_is_adult();

drop trigger if exists enrollments_audit on public.enrollments;
CREATE TRIGGER enrollments_audit AFTER INSERT OR DELETE OR UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION audit_row();

drop trigger if exists guard_enrollment_grade_label on public.enrollments;
CREATE TRIGGER guard_enrollment_grade_label BEFORE INSERT OR UPDATE OF grade_label ON public.enrollments FOR EACH ROW EXECUTE FUNCTION guard_enrollment_grade_label();

drop trigger if exists entries_set_source on public.entries;
CREATE TRIGGER entries_set_source BEFORE INSERT ON public.entries FOR EACH ROW EXECUTE FUNCTION entries_set_source();

drop trigger if exists evaluation_scores_guard_trg on public.evaluation_scores;
CREATE TRIGGER evaluation_scores_guard_trg BEFORE UPDATE ON public.evaluation_scores FOR EACH ROW EXECUTE FUNCTION evaluation_scores_guard();

drop trigger if exists koen_sessions_log_change on public.koen_sessions;
CREATE TRIGGER koen_sessions_log_change AFTER UPDATE ON public.koen_sessions FOR EACH ROW EXECUTE FUNCTION log_koen_session_change();

drop trigger if exists lesson_rounds_audit on public.lesson_rounds;
CREATE TRIGGER lesson_rounds_audit AFTER INSERT OR DELETE OR UPDATE ON public.lesson_rounds FOR EACH ROW EXECUTE FUNCTION audit_row();

drop trigger if exists trg_lesson_identity_immutable on public.lessons;
CREATE TRIGGER trg_lesson_identity_immutable BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION assert_lesson_identity_unchanged();

drop trigger if exists matching_report_cut on public.matching_reports;
CREATE TRIGGER matching_report_cut AFTER INSERT ON public.matching_reports FOR EACH ROW EXECUTE FUNCTION matching_report_makes_cut();

drop trigger if exists guard_grade_label on public.memberships;
CREATE TRIGGER guard_grade_label BEFORE INSERT OR UPDATE OF grade_label ON public.memberships FOR EACH ROW EXECUTE FUNCTION guard_grade_label();

drop trigger if exists memberships_audit on public.memberships;
CREATE TRIGGER memberships_audit AFTER INSERT OR DELETE OR UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION audit_row();

drop trigger if exists trg_my_periods_org_stable on public.my_periods;
CREATE TRIGGER trg_my_periods_org_stable BEFORE UPDATE ON public.my_periods FOR EACH ROW EXECUTE FUNCTION assert_my_periods_org_stable();

drop trigger if exists org_billing_audit on public.org_billing;
CREATE TRIGGER org_billing_audit AFTER INSERT OR DELETE OR UPDATE ON public.org_billing FOR EACH ROW EXECUTE FUNCTION audit_row();

drop trigger if exists org_events_audit on public.org_events;
CREATE TRIGGER org_events_audit AFTER INSERT OR DELETE OR UPDATE ON public.org_events FOR EACH ROW EXECUTE FUNCTION audit_row();

drop trigger if exists trg_org_event_identity_immutable on public.org_events;
CREATE TRIGGER trg_org_event_identity_immutable BEFORE UPDATE ON public.org_events FOR EACH ROW EXECUTE FUNCTION assert_org_event_identity_unchanged();

drop trigger if exists trg_org_events_bookkeeping on public.org_events;
CREATE TRIGGER trg_org_events_bookkeeping BEFORE UPDATE ON public.org_events FOR EACH ROW EXECUTE FUNCTION org_events_set_bookkeeping();

drop trigger if exists org_invitations_audit on public.org_invitations;
CREATE TRIGGER org_invitations_audit AFTER INSERT OR DELETE OR UPDATE ON public.org_invitations FOR EACH ROW EXECUTE FUNCTION audit_row();

drop trigger if exists org_places_audit on public.org_places;
CREATE TRIGGER org_places_audit AFTER INSERT OR DELETE OR UPDATE ON public.org_places FOR EACH ROW EXECUTE FUNCTION audit_row();

drop trigger if exists org_posts_audit on public.org_posts;
CREATE TRIGGER org_posts_audit AFTER INSERT OR DELETE OR UPDATE ON public.org_posts FOR EACH ROW EXECUTE FUNCTION audit_row();

drop trigger if exists trg_log_org_post_perm on public.org_posts;
CREATE TRIGGER trg_log_org_post_perm AFTER INSERT OR DELETE OR UPDATE ON public.org_posts FOR EACH ROW EXECUTE FUNCTION log_org_post_perm();

drop trigger if exists profiles_guard_server_only_columns on public.profiles;
CREATE TRIGGER profiles_guard_server_only_columns BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION profiles_guard_server_only_columns();

drop trigger if exists trg_block_minor_teacher_link on public.teacher_student_links;
CREATE TRIGGER trg_block_minor_teacher_link BEFORE INSERT OR UPDATE OF student_id ON public.teacher_student_links FOR EACH ROW EXECUTE FUNCTION assert_student_is_adult();

drop trigger if exists trg_link_identity_immutable on public.teacher_student_links;
CREATE TRIGGER trg_link_identity_immutable BEFORE UPDATE ON public.teacher_student_links FOR EACH ROW EXECUTE FUNCTION assert_link_identity_unchanged();

