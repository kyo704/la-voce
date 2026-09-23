-- 20260923_51 外部キーに索引が無い（2026-09-23 に索引216本を洗って発見）
-- なぜ効くか:
--   ① ★退会が遅くなる。人を消すと 69の表に連鎖するが、索引が無い列は ★表を全部読む
--      いまは行が少ないので速いが、★利用者が増えると 退会が時間切れになる
--   ② 名簿500人・香盤表300場面での読みが遅くなる（結合のたびに全部読む）
-- 入れないもの: 行が増えない表・ほとんど絞り込みに使わない列（索引は ★書き込みを重くする）
-- ★いつ当ててもよい（行が少ないいまのうちが安全）
-- ★本番で確かめた（2026-09-23）: 索引は いま255本／対象の列は すべて実在
--   （koen_payments.koen_id・work_scene_roles.role_id・monka_read_log.viewer_user_id・
--     feedback.user_id・questionnaire_responses.user_id）
-- ★索引を54本足すと 約309本になる。書き込みが重くなるので、これ以上は 足さない方針

-- ════════ ① 退会の速さ（auth.users をたどる列） ════════
create index if not exists article_notes_user_idx        on public.article_notes(user_id);
create index if not exists email_change_log_user_idx     on public.email_change_log(user_id);
create index if not exists export_log_user_idx           on public.export_log(user_id);
create index if not exists feature_flag_testers_user_idx on public.feature_flag_testers(user_id);
create index if not exists feedback_user_idx             on public.feedback(user_id);
create index if not exists questionnaire_responses_user_idx on public.questionnaire_responses(user_id);
create index if not exists memberships_user_idx          on public.memberships(user_id);
create index if not exists enrollments_student_idx       on public.enrollments(student_id);
create index if not exists assignments_student_idx       on public.assignments(student_id);
create index if not exists assignments_teacher_idx       on public.assignments(teacher_id);
create index if not exists teacher_student_links_student_idx on public.teacher_student_links(student_id);
create index if not exists link_consents_student_idx     on public.link_consents(student_id);
create index if not exists link_consents_teacher_idx     on public.link_consents(teacher_id);
create index if not exists lesson_prefs_user_idx         on public.lesson_prefs(user_id);
create index if not exists lesson_ng_dates_user_idx      on public.lesson_ng_dates(user_id);
create index if not exists koen_members_user_idx         on public.koen_members(user_id);
create index if not exists koen_kids_guardian_idx        on public.koen_kids(guardian_user_id);
create index if not exists koen_change_seen_user_idx     on public.koen_change_seen(user_id);
create index if not exists org_message_reads_reader_idx  on public.org_message_reads(reader_id);
create index if not exists timetable_nudges_student_idx  on public.timetable_nudges(student_id);
create index if not exists works_owner_idx               on public.works(owner_user_id);

-- ════════ ② 記録の表（人が消えても残る。★誰がで絞ることがある） ════════
create index if not exists ops_audit_log_actor_idx       on public.ops_audit_log(actor_id);
create index if not exists org_billing_log_actor_idx     on public.org_billing_log(actor_id);
create index if not exists post_change_log_changed_by_idx on public.post_change_log(changed_by);
create index if not exists score_log_org_idx             on public.score_log(org_id);
create index if not exists monka_read_log_viewer_idx     on public.monka_read_log(viewer_user_id);

-- ════════ ③ 公演（★香盤表は 1つの公演で何百行も読む） ════════
create index if not exists koen_org_idx        on public.koen(org_id);
create index if not exists koen_owner_idx      on public.koen(owner_user_id);
create index if not exists koen_rows_koen_idx  on public.koen_rows(koen_id);
create index if not exists koen_slots_koen_idx on public.koen_slots(koen_id);
create index if not exists koen_cells_slot_idx on public.koen_cells(slot_id);
create index if not exists koen_cells_member_idx on public.koen_cells(member_id);
create index if not exists koen_sessions_koen_idx on public.koen_sessions(koen_id);
create index if not exists koen_calls_member_idx on public.koen_calls(member_id);
create index if not exists koen_calls_row_idx   on public.koen_calls(row_id);
create index if not exists koen_attendance_member_idx on public.koen_attendance(member_id);
create index if not exists koen_rooms_koen_idx  on public.koen_rooms(koen_id);
create index if not exists koen_runsheet_koen_idx on public.koen_runsheet(koen_id);
create index if not exists koen_fees_koen_idx   on public.koen_fees(koen_id);
create index if not exists koen_dues_koen_idx   on public.koen_dues(koen_id);
create index if not exists koen_payments_koen_idx on public.koen_payments(koen_id);

-- ════════ ④ 作品（★559作品・2,995場面。選ぶ画面で毎回たどる） ════════
create index if not exists work_scenes_work_idx on public.work_scenes(work_id);
create index if not exists work_roles_work_idx  on public.work_roles(work_id);
create index if not exists work_scene_roles_role_idx on public.work_scene_roles(role_id);

-- ════════ ⑤ レッスン・授業（★名簿500人で効く） ════════
create index if not exists lessons_org_idx     on public.lessons(org_id);
create index if not exists lessons_student_idx on public.lessons(student_id);
create index if not exists lessons_teacher_idx on public.lessons(teacher_id);
create index if not exists lessons_link_idx    on public.lessons(link_id);
create index if not exists lesson_rounds_teacher_idx on public.lesson_rounds(teacher_id);

-- ════════ ⑥ 採点（★1つの行事で 何百行） ════════
create index if not exists evaluation_scores_event_idx   on public.evaluation_scores(event_id, student_id);
create index if not exists evaluation_scores_judge_idx   on public.evaluation_scores(judge_id);
create index if not exists evaluation_reviews_event_idx  on public.evaluation_reviews(event_id, student_id);
create index if not exists evaluation_items_event_idx    on public.evaluation_items(event_id);
create index if not exists evaluation_judges_event_idx   on public.evaluation_judges(event_id);

-- ════════ 入れなかったもの（理由） ════════
-- 「誰が作った・誰が直した」だけの列（created_by・added_by ほか）:
--   ★絞り込みに使わない。退会のときだけたどるが、行が少ない表なので 索引の重さに見合わない
-- 学科（division_id）: ★NO ACTION なので 連鎖しない。行も少ない

-- 確かめ（試しの環境で）
-- 索引を当てたあと: 退会が通る／香盤表が出る／名簿が出る（★結果が変わらないこと）
-- ★行が少ないいまは 速さの違いは出ない。効くのは 利用者が増えてから
-- 書き込みが重くなっていないか: 記録を1件入れる・香盤表のマスを1つ変える → 体感で変わらないこと
