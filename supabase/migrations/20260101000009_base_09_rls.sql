-- ★★★土台 ── 行の 決まり（RLS）と ポリシー
-- ★裁定175 ㋐。★2026-09-23 の 本番（xxjtplvpcneksrofkjmf）の 形を 機械で 書き出した もの。
-- ★★本番には 当てません。★「すでに 当たって いる」と 記録するだけ です。

-- ★行の 決まりを 入れる 表 …… 104／104
-- ★ポリシー …… 182

alter table public.account_deletions enable row level security;
alter table public.age_answer_changes enable row level security;
alter table public.app_secrets enable row level security;
alter table public.app_secrets force row level security;
alter table public.application_messages enable row level security;
alter table public.applications enable row level security;
alter table public.article_notes enable row level security;
alter table public.article_progress enable row level security;
alter table public.assignments enable row level security;
alter table public.calendar_tokens enable row level security;
alter table public.chapter_state enable row level security;
alter table public.character_inventory enable row level security;
alter table public.code_attempts enable row level security;
alter table public.code_attempts force row level security;
alter table public.cohort_changes enable row level security;
alter table public.consent_records enable row level security;
alter table public.contract_owner_log enable row level security;
alter table public.cycle_periods enable row level security;
alter table public.email_change_log enable row level security;
alter table public.enrollments enable row level security;
alter table public.entries enable row level security;
alter table public.evaluation_items enable row level security;
alter table public.evaluation_judge_done enable row level security;
alter table public.evaluation_reviews enable row level security;
alter table public.evaluation_scores enable row level security;
alter table public.events enable row level security;
alter table public.export_log enable row level security;
alter table public.feedback enable row level security;
alter table public.guardian_consents enable row level security;
alter table public.import_staging enable row level security;
alter table public.item_acquisitions enable row level security;
alter table public.item_acquisitions force row level security;
alter table public.koen enable row level security;
alter table public.koen_cells enable row level security;
alter table public.koen_kid_contact_reads enable row level security;
alter table public.koen_kid_contacts enable row level security;
alter table public.koen_kids enable row level security;
alter table public.koen_members enable row level security;
alter table public.koen_rows enable row level security;
alter table public.koen_session_changes enable row level security;
alter table public.koen_sessions enable row level security;
alter table public.koen_slots enable row level security;
alter table public.lesson_ng_dates enable row level security;
alter table public.lesson_prefs enable row level security;
alter table public.lesson_preset_targets enable row level security;
alter table public.lesson_preset_targets force row level security;
alter table public.lesson_presets enable row level security;
alter table public.lesson_presets force row level security;
alter table public.lesson_rounds enable row level security;
alter table public.lessons enable row level security;
alter table public.link_consents enable row level security;
alter table public.matching_cuts enable row level security;
alter table public.matching_reports enable row level security;
alter table public.memberships enable row level security;
alter table public.minor_billing_consents enable row level security;
alter table public.monka_read_log enable row level security;
alter table public.monka_read_log force row level security;
alter table public.my_periods enable row level security;
alter table public.my_timetable enable row level security;
alter table public.notes enable row level security;
alter table public.notice_batches enable row level security;
alter table public.notice_targets enable row level security;
alter table public.ops_alerts enable row level security;
alter table public.ops_audit_log enable row level security;
alter table public.org_billing enable row level security;
alter table public.org_billing force row level security;
alter table public.org_billing_log enable row level security;
alter table public.org_contracts enable row level security;
alter table public.org_divisions enable row level security;
alter table public.org_event_participants enable row level security;
alter table public.org_events enable row level security;
alter table public.org_invitations enable row level security;
alter table public.org_message_drafts enable row level security;
alter table public.org_message_reads enable row level security;
alter table public.org_messages enable row level security;
alter table public.org_periods enable row level security;
alter table public.org_places enable row level security;
alter table public.org_post_perm_log enable row level security;
alter table public.org_posts enable row level security;
alter table public.org_posts force row level security;
alter table public.organizations enable row level security;
alter table public.overlap_notices enable row level security;
alter table public.page_inquiries enable row level security;
alter table public.page_types_owned enable row level security;
alter table public.payment_records enable row level security;
alter table public.payment_records force row level security;
alter table public.performance_results enable row level security;
alter table public.performances enable row level security;
alter table public.period_markers enable row level security;
alter table public.portfolio_entries enable row level security;
alter table public.portfolio_recordings enable row level security;
alter table public.portfolios enable row level security;
alter table public.post_change_log enable row level security;
alter table public.post_change_log force row level security;
alter table public.postings enable row level security;
alter table public.profiles enable row level security;
alter table public.project_master enable row level security;
alter table public.purchases enable row level security;
alter table public.questionnaire_responses enable row level security;
alter table public.recovery_codes enable row level security;
alter table public.repertoire_tessitura enable row level security;
alter table public.role_master enable row level security;
alter table public.roster_drafts enable row level security;
alter table public.score_log enable row level security;
alter table public.stripe_events enable row level security;
alter table public.student_price_consents enable row level security;
alter table public.subscription_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.system_alerts enable row level security;
alter table public.teacher_invitations enable row level security;
alter table public.teacher_notes enable row level security;
alter table public.teacher_student_links enable row level security;
alter table public.timetable_nudges enable row level security;
alter table public.user_notices enable row level security;

drop policy if exists "Users can insert own age changes" on public.age_answer_changes;
create policy "Users can insert own age changes" on public.age_answer_changes as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "Users can view own age changes" on public.age_answer_changes;
create policy "Users can view own age changes" on public.age_answer_changes as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "application_messages_delete_own" on public.application_messages;
create policy "application_messages_delete_own" on public.application_messages as permissive for delete to public
  using ((auth.uid() = sender_user_id));

drop policy if exists "application_messages_insert_own" on public.application_messages;
create policy "application_messages_insert_own" on public.application_messages as permissive for insert to public
  with check (((auth.uid() = sender_user_id) AND (EXISTS ( SELECT 1
   FROM (applications a
     JOIN postings p ON ((p.id = a.posting_id)))
  WHERE ((a.id = application_messages.application_id) AND (p.owner_user_id = auth.uid()) AND (a.template_key = 'kyokumoku_kikitai'::text) AND (a.status <> 'withdrawn'::text) AND matching_visible(a.applicant_user_id, p.owner_user_id))))));

drop policy if exists "application_messages_select_own" on public.application_messages;
create policy "application_messages_select_own" on public.application_messages as permissive for select to public
  using ((auth.uid() = sender_user_id));

drop policy if exists "applications_delete_own" on public.applications;
create policy "applications_delete_own" on public.applications as permissive for delete to public
  using ((auth.uid() = applicant_user_id));

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications as permissive for insert to public
  with check (((auth.uid() = applicant_user_id) AND (EXISTS ( SELECT 1
   FROM postings p
  WHERE ((p.id = applications.posting_id) AND (p.org_id = applications.org_id) AND (p.status = 'open'::text)))) AND (EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.org_id = applications.org_id) AND (e.student_id = auth.uid()) AND (e.status = 'active'::text))))));

drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own" on public.applications as permissive for select to public
  using ((auth.uid() = applicant_user_id));

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own" on public.applications as permissive for update to public
  using ((auth.uid() = applicant_user_id))
  with check (((auth.uid() = applicant_user_id) AND (status = ANY (ARRAY['sent'::text, 'withdrawn'::text]))));

drop policy if exists "Users manage their own article notes" on public.article_notes;
create policy "Users manage their own article notes" on public.article_notes as permissive for all to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "Users can manage own article progress" on public.article_progress;
create policy "Users can manage own article progress" on public.article_progress as permissive for all to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "Users manage their own article progress" on public.article_progress;
create policy "Users manage their own article progress" on public.article_progress as permissive for all to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "assignments_all_owner_admin" on public.assignments;
create policy "assignments_all_owner_admin" on public.assignments as permissive for all to authenticated
  using (has_can(org_id, 'meibo'::text))
  with check ((has_can(org_id, 'meibo'::text) AND (COALESCE(( SELECT o.org_id
   FROM assignments_old_identity(assignments.id) o(org_id, teacher_id, student_id)), org_id) = org_id) AND (COALESCE(( SELECT o.teacher_id
   FROM assignments_old_identity(assignments.id) o(org_id, teacher_id, student_id)), teacher_id) = teacher_id) AND (COALESCE(( SELECT o.student_id
   FROM assignments_old_identity(assignments.id) o(org_id, teacher_id, student_id)), student_id) = student_id)));

drop policy if exists "assignments_select" on public.assignments;
create policy "assignments_select" on public.assignments as permissive for select to public
  using (((auth.uid() = teacher_id) OR (auth.uid() = student_id) OR has_can(org_id, 'meibo'::text)));

drop policy if exists "calendar_tokens_own" on public.calendar_tokens;
create policy "calendar_tokens_own" on public.calendar_tokens as permissive for select to authenticated
  using ((user_id = auth.uid()));

drop policy if exists "Users manage their own chapter state" on public.chapter_state;
create policy "Users manage their own chapter state" on public.chapter_state as permissive for all to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "Users can manage own inventory" on public.character_inventory;
create policy "Users can manage own inventory" on public.character_inventory as permissive for all to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "Users can view own cohort changes" on public.cohort_changes;
create policy "Users can view own cohort changes" on public.cohort_changes as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "Users can insert own consent records" on public.consent_records;
create policy "Users can insert own consent records" on public.consent_records as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "Users can view own consent records" on public.consent_records;
create policy "Users can view own consent records" on public.consent_records as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "contract_owner_log_select" on public.contract_owner_log;
create policy "contract_owner_log_select" on public.contract_owner_log as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM memberships m
  WHERE ((m.org_id = contract_owner_log.org_id) AND (m.user_id = auth.uid())))));

drop policy if exists "cycle_periods_delete_own" on public.cycle_periods;
create policy "cycle_periods_delete_own" on public.cycle_periods as permissive for delete to public
  using ((auth.uid() = user_id));

drop policy if exists "cycle_periods_insert_own_not_withdrawn" on public.cycle_periods;
create policy "cycle_periods_insert_own_not_withdrawn" on public.cycle_periods as permissive for insert to public
  with check (((auth.uid() = user_id) AND (NOT consent_withdrawn(auth.uid()))));

drop policy if exists "cycle_periods_select_own" on public.cycle_periods;
create policy "cycle_periods_select_own" on public.cycle_periods as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "cycle_periods_update_own_not_withdrawn" on public.cycle_periods;
create policy "cycle_periods_update_own_not_withdrawn" on public.cycle_periods as permissive for update to public
  using (((auth.uid() = user_id) AND (NOT consent_withdrawn(auth.uid()))))
  with check (((auth.uid() = user_id) AND (NOT consent_withdrawn(auth.uid()))));

drop policy if exists "email_change_log_own_select" on public.email_change_log;
create policy "email_change_log_own_select" on public.email_change_log as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "enrollments_all_owner_admin" on public.enrollments;
create policy "enrollments_all_owner_admin" on public.enrollments as permissive for all to public
  using (has_can(org_id, 'meibo'::text))
  with check (has_can(org_id, 'meibo'::text));

drop policy if exists "enrollments_select" on public.enrollments;
create policy "enrollments_select" on public.enrollments as permissive for select to public
  using (((auth.uid() = student_id) OR can_view_ops_perm(auth.uid(), org_id, student_id, 'meibo'::text)));

drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own" on public.entries as permissive for delete to public
  using ((auth.uid() = user_id));

drop policy if exists "entries_insert_own_not_withdrawn" on public.entries;
create policy "entries_insert_own_not_withdrawn" on public.entries as permissive for insert to public
  with check (((auth.uid() = user_id) AND (NOT consent_withdrawn(auth.uid()))));

drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own" on public.entries as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "entries_update_own_not_withdrawn" on public.entries;
create policy "entries_update_own_not_withdrawn" on public.entries as permissive for update to public
  using (((auth.uid() = user_id) AND (NOT consent_withdrawn(auth.uid()))))
  with check (((auth.uid() = user_id) AND (NOT consent_withdrawn(auth.uid()))));

drop policy if exists "evaluation_items_select" on public.evaluation_items;
create policy "evaluation_items_select" on public.evaluation_items as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM memberships m
  WHERE ((m.org_id = evaluation_items.org_id) AND (m.user_id = auth.uid())))));

drop policy if exists "evaluation_items_write" on public.evaluation_items;
create policy "evaluation_items_write" on public.evaluation_items as permissive for all to public
  using (has_can(org_id, 'saiten'::text))
  with check (has_can(org_id, 'saiten'::text));

drop policy if exists "evaluation_judge_done_own" on public.evaluation_judge_done;
create policy "evaluation_judge_done_own" on public.evaluation_judge_done as permissive for all to public
  using ((judge_id = auth.uid()))
  with check ((judge_id = auth.uid()));

drop policy if exists "evaluation_reviews_select" on public.evaluation_reviews;
create policy "evaluation_reviews_select" on public.evaluation_reviews as permissive for select to public
  using ((has_can(org_id, 'saiten'::text) OR (judge_id = auth.uid()) OR ((EXISTS ( SELECT 1
   FROM evaluation_judge_done d
  WHERE ((d.event_id = evaluation_reviews.event_id) AND (d.judge_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.org_id = evaluation_reviews.org_id) AND (a.teacher_id = auth.uid()) AND (a.ended_at IS NULL))))) OR ((student_id = auth.uid()) AND (confirmed_at IS NOT NULL))));

drop policy if exists "evaluation_reviews_write" on public.evaluation_reviews;
create policy "evaluation_reviews_write" on public.evaluation_reviews as permissive for all to public
  using ((judge_id = auth.uid()))
  with check ((judge_id = auth.uid()));

drop policy if exists "evaluation_scores_select" on public.evaluation_scores;
create policy "evaluation_scores_select" on public.evaluation_scores as permissive for select to public
  using ((has_can(org_id, 'saiten'::text) OR (judge_id = auth.uid()) OR ((EXISTS ( SELECT 1
   FROM evaluation_judge_done d
  WHERE ((d.event_id = evaluation_scores.event_id) AND (d.judge_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.org_id = evaluation_scores.org_id) AND (a.teacher_id = auth.uid()) AND (a.ended_at IS NULL))))) OR ((student_id = auth.uid()) AND (confirmed_at IS NOT NULL))));

drop policy if exists "evaluation_scores_write" on public.evaluation_scores;
create policy "evaluation_scores_write" on public.evaluation_scores as permissive for all to public
  using ((judge_id = auth.uid()))
  with check ((judge_id = auth.uid()));

drop policy if exists "Users can insert their own events" on public.events;
create policy "Users can insert their own events" on public.events as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "Users can view their own events" on public.events;
create policy "Users can view their own events" on public.events as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "export_log_insert" on public.export_log;
create policy "export_log_insert" on public.export_log as permissive for insert to public
  with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM memberships m
  WHERE ((m.org_id = export_log.org_id) AND (m.user_id = auth.uid()))))));

drop policy if exists "export_log_select" on public.export_log;
create policy "export_log_select" on public.export_log as permissive for select to public
  using (((user_id = auth.uid()) OR has_can(org_id, 'master'::text)));

drop policy if exists "Users can submit feedback" on public.feedback;
create policy "Users can submit feedback" on public.feedback as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "guardian_consents_select_own" on public.guardian_consents;
create policy "guardian_consents_select_own" on public.guardian_consents as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "自分の台帳だけ読める" on public.item_acquisitions;
create policy "自分の台帳だけ読める" on public.item_acquisitions as permissive for select to authenticated
  using ((auth.uid() = user_id));

drop policy if exists "koen_insert" on public.koen;
create policy "koen_insert" on public.koen as permissive for insert to authenticated
  with check (((owner_user_id = auth.uid()) AND ((org_id IS NULL) OR has_can(org_id, 'gyoji'::text))));

drop policy if exists "koen_select" on public.koen;
create policy "koen_select" on public.koen as permissive for select to authenticated
  using (koen_can_see(id));

drop policy if exists "koen_update" on public.koen;
create policy "koen_update" on public.koen as permissive for update to authenticated
  using (koen_can_manage(id))
  with check (koen_can_manage(id));

drop policy if exists "koen_cells_select" on public.koen_cells;
create policy "koen_cells_select" on public.koen_cells as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM koen_rows r
  WHERE ((r.id = koen_cells.row_id) AND koen_can_see(r.koen_id)))));

drop policy if exists "koen_cells_write" on public.koen_cells;
create policy "koen_cells_write" on public.koen_cells as permissive for all to authenticated
  using ((EXISTS ( SELECT 1
   FROM koen_rows r
  WHERE ((r.id = koen_cells.row_id) AND koen_can_manage(r.koen_id)))))
  with check ((EXISTS ( SELECT 1
   FROM koen_rows r
  WHERE ((r.id = koen_cells.row_id) AND koen_can_manage(r.koen_id)))));

drop policy if exists "koen_kid_reads_select" on public.koen_kid_contact_reads;
create policy "koen_kid_reads_select" on public.koen_kid_contact_reads as permissive for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM koen_kids k
  WHERE ((k.id = koen_kid_contact_reads.kid_id) AND (k.guardian_user_id = auth.uid())))) OR (viewer_user_id = auth.uid())));

drop policy if exists "koen_kids_guardian" on public.koen_kids;
create policy "koen_kids_guardian" on public.koen_kids as permissive for all to authenticated
  using ((guardian_user_id = auth.uid()))
  with check (((guardian_user_id = auth.uid()) AND koen_can_see(koen_id)));

drop policy if exists "koen_kids_staff_select" on public.koen_kids;
create policy "koen_kids_staff_select" on public.koen_kids as permissive for select to authenticated
  using (koen_can_manage(koen_id));

drop policy if exists "koen_members_select" on public.koen_members;
create policy "koen_members_select" on public.koen_members as permissive for select to authenticated
  using (koen_can_see(koen_id));

drop policy if exists "koen_members_write" on public.koen_members;
create policy "koen_members_write" on public.koen_members as permissive for all to authenticated
  using (koen_can_manage(koen_id))
  with check (koen_can_manage(koen_id));

drop policy if exists "koen_rows_select" on public.koen_rows;
create policy "koen_rows_select" on public.koen_rows as permissive for select to authenticated
  using (koen_can_see(koen_id));

drop policy if exists "koen_rows_write" on public.koen_rows;
create policy "koen_rows_write" on public.koen_rows as permissive for all to authenticated
  using (koen_can_manage(koen_id))
  with check (koen_can_manage(koen_id));

drop policy if exists "koen_session_changes_select" on public.koen_session_changes;
create policy "koen_session_changes_select" on public.koen_session_changes as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM koen_sessions s
  WHERE ((s.id = koen_session_changes.session_id) AND koen_can_see(s.koen_id)))));

drop policy if exists "koen_sessions_select" on public.koen_sessions;
create policy "koen_sessions_select" on public.koen_sessions as permissive for select to authenticated
  using (koen_can_see(koen_id));

drop policy if exists "koen_sessions_write" on public.koen_sessions;
create policy "koen_sessions_write" on public.koen_sessions as permissive for all to authenticated
  using (koen_can_manage(koen_id))
  with check (koen_can_manage(koen_id));

drop policy if exists "koen_slots_select" on public.koen_slots;
create policy "koen_slots_select" on public.koen_slots as permissive for select to authenticated
  using (koen_can_see(koen_id));

drop policy if exists "koen_slots_write" on public.koen_slots;
create policy "koen_slots_write" on public.koen_slots as permissive for all to authenticated
  using (koen_can_manage(koen_id))
  with check (koen_can_manage(koen_id));

drop policy if exists "lesson_ng_own" on public.lesson_ng_dates;
create policy "lesson_ng_own" on public.lesson_ng_dates as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM lesson_rounds r
  WHERE ((r.id = lesson_ng_dates.round_id) AND (r.status = 'open'::text) AND ((r.due_on IS NULL) OR (((now() AT TIME ZONE 'Asia/Tokyo'::text))::date <= r.due_on)))))));

drop policy if exists "lesson_ng_read_staff" on public.lesson_ng_dates;
create policy "lesson_ng_read_staff" on public.lesson_ng_dates as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM lesson_rounds r
  WHERE ((r.id = lesson_ng_dates.round_id) AND (has_can(r.org_id, 'sched_all'::text) OR (EXISTS ( SELECT 1
           FROM assignments a
          WHERE ((a.org_id = r.org_id) AND (a.teacher_id = auth.uid()) AND (a.student_id = lesson_ng_dates.user_id) AND (a.ended_at IS NULL)))))))));

drop policy if exists "lesson_prefs_own" on public.lesson_prefs;
create policy "lesson_prefs_own" on public.lesson_prefs as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM lesson_rounds r
  WHERE ((r.id = lesson_prefs.round_id) AND (r.status = 'open'::text) AND ((r.due_on IS NULL) OR (((now() AT TIME ZONE 'Asia/Tokyo'::text))::date <= r.due_on)))))));

drop policy if exists "lesson_prefs_read_staff" on public.lesson_prefs;
create policy "lesson_prefs_read_staff" on public.lesson_prefs as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM lesson_rounds r
  WHERE ((r.id = lesson_prefs.round_id) AND (has_can(r.org_id, 'sched_all'::text) OR (EXISTS ( SELECT 1
           FROM assignments a
          WHERE ((a.org_id = r.org_id) AND (a.teacher_id = auth.uid()) AND (a.student_id = lesson_prefs.user_id) AND (a.ended_at IS NULL)))))))));

drop policy if exists "lesson_preset_targets_select" on public.lesson_preset_targets;
create policy "lesson_preset_targets_select" on public.lesson_preset_targets as permissive for select to authenticated
  using ((has_can(org_id, 'meibo'::text) OR has_can(org_id, 'monka_write'::text)));

drop policy if exists "lesson_preset_targets_write" on public.lesson_preset_targets;
create policy "lesson_preset_targets_write" on public.lesson_preset_targets as permissive for all to authenticated
  using (has_can(org_id, 'meibo'::text))
  with check (has_can(org_id, 'meibo'::text));

drop policy if exists "lesson_presets_select" on public.lesson_presets;
create policy "lesson_presets_select" on public.lesson_presets as permissive for select to authenticated
  using ((has_can(org_id, 'meibo'::text) OR has_can(org_id, 'monka_write'::text)));

drop policy if exists "lesson_presets_write" on public.lesson_presets;
create policy "lesson_presets_write" on public.lesson_presets as permissive for all to authenticated
  using (has_can(org_id, 'meibo'::text))
  with check (has_can(org_id, 'meibo'::text));

drop policy if exists "lesson_rounds_select" on public.lesson_rounds;
create policy "lesson_rounds_select" on public.lesson_rounds as permissive for select to authenticated
  using ((has_can(org_id, 'sched_all'::text) OR (teacher_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.org_id = lesson_rounds.org_id) AND (e.student_id = auth.uid()) AND (e.status = 'active'::text))))));

drop policy if exists "lesson_rounds_update" on public.lesson_rounds;
create policy "lesson_rounds_update" on public.lesson_rounds as permissive for update to authenticated
  using ((has_can(org_id, 'sched_all'::text) OR (has_can(org_id, 'sched_mine'::text) AND (teacher_id = auth.uid()))))
  with check ((has_can(org_id, 'sched_all'::text) OR (has_can(org_id, 'sched_mine'::text) AND (teacher_id = auth.uid()))));

drop policy if exists "lesson_rounds_write" on public.lesson_rounds;
create policy "lesson_rounds_write" on public.lesson_rounds as permissive for insert to authenticated
  with check (((created_by = auth.uid()) AND (has_can(org_id, 'sched_all'::text) OR (has_can(org_id, 'sched_mine'::text) AND (teacher_id = auth.uid())))));

drop policy if exists "Ops-visible lessons (org-based)" on public.lessons;
create policy "Ops-visible lessons (org-based)" on public.lessons as permissive for select to public
  using (((org_id IS NOT NULL) AND ((auth.uid() = student_id) OR can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_all'::text) OR ((teacher_id = auth.uid()) AND can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_mine'::text)))));

drop policy if exists "Teacher and student can view lessons" on public.lessons;
create policy "Teacher and student can view lessons" on public.lessons as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM teacher_student_links l
  WHERE ((l.id = lessons.link_id) AND ((l.teacher_id = auth.uid()) OR (l.student_id = auth.uid()))))));

drop policy if exists "Teacher can create lessons" on public.lessons;
create policy "Teacher can create lessons" on public.lessons as permissive for insert to public
  with check ((EXISTS ( SELECT 1
   FROM teacher_student_links l
  WHERE ((l.id = lessons.link_id) AND (l.teacher_id = auth.uid())))));

drop policy if exists "Teacher can delete lessons" on public.lessons;
create policy "Teacher can delete lessons" on public.lessons as permissive for delete to public
  using ((EXISTS ( SELECT 1
   FROM teacher_student_links l
  WHERE ((l.id = lessons.link_id) AND (l.teacher_id = auth.uid())))));

drop policy if exists "Teacher can update or delete lessons" on public.lessons;
create policy "Teacher can update or delete lessons" on public.lessons as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM teacher_student_links l
  WHERE ((l.id = lessons.link_id) AND (l.teacher_id = auth.uid())))))
  with check ((EXISTS ( SELECT 1
   FROM teacher_student_links l
  WHERE ((l.id = lessons.link_id) AND (l.teacher_id = auth.uid())))));

drop policy if exists "Teachers can create org lessons" on public.lessons;
create policy "Teachers can create org lessons" on public.lessons as permissive for insert to public
  with check (((org_id IS NOT NULL) AND (can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_all'::text) OR ((teacher_id = auth.uid()) AND can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_mine'::text)))));

drop policy if exists "Teachers can delete org lessons" on public.lessons;
create policy "Teachers can delete org lessons" on public.lessons as permissive for delete to public
  using (((org_id IS NOT NULL) AND (can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_all'::text) OR ((teacher_id = auth.uid()) AND can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_mine'::text)))));

drop policy if exists "Teachers can update or delete org lessons" on public.lessons;
create policy "Teachers can update or delete org lessons" on public.lessons as permissive for update to public
  using (((org_id IS NOT NULL) AND (can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_all'::text) OR ((teacher_id = auth.uid()) AND can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_mine'::text)))))
  with check (((org_id IS NOT NULL) AND (can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_all'::text) OR ((teacher_id = auth.uid()) AND can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_mine'::text)))));

drop policy if exists "lessons_student_notice" on public.lessons;
create policy "lessons_student_notice" on public.lessons as permissive for update to public
  using ((auth.uid() = student_id))
  with check ((auth.uid() = student_id));

drop policy if exists "link_consents_insert_own" on public.link_consents;
create policy "link_consents_insert_own" on public.link_consents as permissive for insert to public
  with check ((auth.uid() = student_id));

drop policy if exists "link_consents_select_own" on public.link_consents;
create policy "link_consents_select_own" on public.link_consents as permissive for select to public
  using ((auth.uid() = student_id));

drop policy if exists "link_consents_update_own" on public.link_consents;
create policy "link_consents_update_own" on public.link_consents as permissive for update to public
  using ((auth.uid() = student_id))
  with check ((auth.uid() = student_id));

drop policy if exists "matching_cuts_delete_own" on public.matching_cuts;
create policy "matching_cuts_delete_own" on public.matching_cuts as permissive for delete to public
  using ((auth.uid() = user_id));

drop policy if exists "matching_cuts_insert_own" on public.matching_cuts;
create policy "matching_cuts_insert_own" on public.matching_cuts as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "matching_cuts_select_own" on public.matching_cuts;
create policy "matching_cuts_select_own" on public.matching_cuts as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "matching_reports_insert_own" on public.matching_reports;
create policy "matching_reports_insert_own" on public.matching_reports as permissive for insert to public
  with check ((auth.uid() = reporter_user_id));

drop policy if exists "matching_reports_select_own" on public.matching_reports;
create policy "matching_reports_select_own" on public.matching_reports as permissive for select to public
  using ((auth.uid() = reporter_user_id));

drop policy if exists "memberships_delete_admin" on public.memberships;
create policy "memberships_delete_admin" on public.memberships as permissive for delete to public
  using ((has_can(org_id, 'post'::text) AND (role <> 'owner'::text)));

drop policy if exists "memberships_insert_bootstrap_owner" on public.memberships;
create policy "memberships_insert_bootstrap_owner" on public.memberships as permissive for insert to authenticated
  with check (((user_id = auth.uid()) AND (role = 'owner'::text) AND (EXISTS ( SELECT 1
   FROM organizations o
  WHERE ((o.id = memberships.org_id) AND (o.created_by = auth.uid())))) AND (NOT (EXISTS ( SELECT 1
   FROM memberships m
  WHERE (m.org_id = memberships.org_id))))));

drop policy if exists "memberships_select" on public.memberships;
create policy "memberships_select" on public.memberships as permissive for select to public
  using (((auth.uid() = user_id) OR has_can(org_id, 'post'::text)));

drop policy if exists "memberships_update_needs_can_post" on public.memberships;
create policy "memberships_update_needs_can_post" on public.memberships as restrictive for update to authenticated
  using (((auth.uid() = user_id) OR has_can(org_id, 'post'::text)))
  with check ((((auth.uid() = user_id) OR has_can(org_id, 'post'::text)) AND can_grant_post(org_id, post_id)));

drop policy if exists "memberships_update_role_management" on public.memberships;
create policy "memberships_update_role_management" on public.memberships as permissive for update to public
  using (((auth.uid() = user_id) OR (has_can(org_id, 'post'::text) AND (role <> 'owner'::text))))
  with check (
CASE
    WHEN (auth.uid() = user_id) THEN (role_rank(role) <= role_rank(( SELECT m.role
       FROM memberships m
      WHERE (m.id = memberships.id))))
    ELSE (role <> 'owner'::text)
END);

drop policy if exists "minor_billing_consents_own_insert" on public.minor_billing_consents;
create policy "minor_billing_consents_own_insert" on public.minor_billing_consents as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "minor_billing_consents_own_select" on public.minor_billing_consents;
create policy "minor_billing_consents_own_select" on public.minor_billing_consents as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "monka_read_log_select_master_or_self" on public.monka_read_log;
create policy "monka_read_log_select_master_or_self" on public.monka_read_log as permissive for select to authenticated
  using (((viewer_user_id = auth.uid()) OR has_can(org_id, 'master'::text)));

drop policy if exists "my_periods_delete_own" on public.my_periods;
create policy "my_periods_delete_own" on public.my_periods as permissive for delete to public
  using (((auth.uid() = user_id) AND ((org_id IS NULL) OR has_can(org_id, 'koma_mine'::text))));

drop policy if exists "my_periods_insert_own" on public.my_periods;
create policy "my_periods_insert_own" on public.my_periods as permissive for insert to public
  with check (((auth.uid() = user_id) AND ((org_id IS NULL) OR has_can(org_id, 'koma_mine'::text))));

drop policy if exists "my_periods_select_own" on public.my_periods;
create policy "my_periods_select_own" on public.my_periods as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "my_periods_update_own" on public.my_periods;
create policy "my_periods_update_own" on public.my_periods as permissive for update to public
  using (((auth.uid() = user_id) AND ((org_id IS NULL) OR has_can(org_id, 'koma_mine'::text))))
  with check (((auth.uid() = user_id) AND ((org_id IS NULL) OR has_can(org_id, 'koma_mine'::text))));

drop policy if exists "my_timetable_own" on public.my_timetable;
create policy "my_timetable_own" on public.my_timetable as permissive for all to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes as permissive for delete to public
  using ((auth.uid() = user_id));

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes as permissive for update to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "Users can view own notice targets" on public.notice_targets;
create policy "Users can view own notice targets" on public.notice_targets as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "ops_audit_select" on public.ops_audit_log;
create policy "ops_audit_select" on public.ops_audit_log as permissive for select to authenticated
  using (((org_id IS NOT NULL) AND (has_can(org_id, 'master'::text) OR has_can(org_id, 'post'::text))));

drop policy if exists "org_billing_insert_bill" on public.org_billing;
create policy "org_billing_insert_bill" on public.org_billing as permissive for insert to authenticated
  with check (has_can(org_id, 'bill_pay'::text));

drop policy if exists "org_billing_select_bill" on public.org_billing;
create policy "org_billing_select_bill" on public.org_billing as permissive for select to authenticated
  using (has_can(org_id, 'bill'::text));

drop policy if exists "org_billing_update_bill" on public.org_billing;
create policy "org_billing_update_bill" on public.org_billing as permissive for update to authenticated
  using (has_can(org_id, 'bill_pay'::text))
  with check (has_can(org_id, 'bill_pay'::text));

drop policy if exists "org_billing_log_insert" on public.org_billing_log;
create policy "org_billing_log_insert" on public.org_billing_log as permissive for insert to authenticated
  with check ((has_can(org_id, 'bill_pay'::text) AND (actor_id = auth.uid())));

drop policy if exists "org_billing_log_select" on public.org_billing_log;
create policy "org_billing_log_select" on public.org_billing_log as permissive for select to authenticated
  using (has_can(org_id, 'bill'::text));

drop policy if exists "org_contracts_select" on public.org_contracts;
create policy "org_contracts_select" on public.org_contracts as permissive for select to authenticated
  using ((has_can(org_id, 'bill'::text) OR has_can(org_id, 'bill_pay'::text)));

drop policy if exists "org_divisions_select" on public.org_divisions;
create policy "org_divisions_select" on public.org_divisions as permissive for select to authenticated
  using ((has_can(org_id, 'meibo'::text) OR (EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.org_id = org_divisions.org_id) AND (e.student_id = auth.uid()) AND (e.status = 'active'::text))))));

drop policy if exists "org_divisions_write" on public.org_divisions;
create policy "org_divisions_write" on public.org_divisions as permissive for all to authenticated
  using (has_can(org_id, 'meibo'::text))
  with check (has_can(org_id, 'meibo'::text));

drop policy if exists "org_event_participants_own" on public.org_event_participants;
create policy "org_event_participants_own" on public.org_event_participants as permissive for all to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "org_events_delete_needs_can_gyoji" on public.org_events;
create policy "org_events_delete_needs_can_gyoji" on public.org_events as restrictive for delete to authenticated
  using (has_can(org_id, 'gyoji'::text));

drop policy if exists "org_events_insert_needs_can_gyoji" on public.org_events;
create policy "org_events_insert_needs_can_gyoji" on public.org_events as restrictive for insert to authenticated
  with check (has_can(org_id, 'gyoji'::text));

drop policy if exists "org_events_select_member" on public.org_events;
create policy "org_events_select_member" on public.org_events as permissive for select to public
  using (((EXISTS ( SELECT 1
   FROM memberships m
  WHERE ((m.org_id = org_events.org_id) AND (m.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.org_id = org_events.org_id) AND (e.student_id = auth.uid()) AND (e.status = 'active'::text))))));

drop policy if exists "org_events_update_needs_can_gyoji" on public.org_events;
create policy "org_events_update_needs_can_gyoji" on public.org_events as restrictive for update to authenticated
  using (has_can(org_id, 'gyoji'::text))
  with check (has_can(org_id, 'gyoji'::text));

drop policy if exists "org_events_write_admin" on public.org_events;
create policy "org_events_write_admin" on public.org_events as permissive for all to public
  using (has_can(org_id, 'gyoji'::text))
  with check (has_can(org_id, 'gyoji'::text));

drop policy if exists "org_invitations_insert" on public.org_invitations;
create policy "org_invitations_insert" on public.org_invitations as permissive for insert to authenticated
  with check (has_can(org_id, 'meibo'::text));

drop policy if exists "org_invitations_select" on public.org_invitations;
create policy "org_invitations_select" on public.org_invitations as permissive for select to authenticated
  using (has_can(org_id, 'meibo'::text));

drop policy if exists "org_invitations_update" on public.org_invitations;
create policy "org_invitations_update" on public.org_invitations as permissive for update to authenticated
  using (has_can(org_id, 'meibo'::text))
  with check (has_can(org_id, 'meibo'::text));

drop policy if exists "org_message_drafts_own" on public.org_message_drafts;
create policy "org_message_drafts_own" on public.org_message_drafts as permissive for all to public
  using ((auth.uid() = author_id))
  with check ((auth.uid() = author_id));

drop policy if exists "org_message_reads_insert" on public.org_message_reads;
create policy "org_message_reads_insert" on public.org_message_reads as permissive for insert to public
  with check ((auth.uid() = reader_id));

drop policy if exists "org_message_reads_select" on public.org_message_reads;
create policy "org_message_reads_select" on public.org_message_reads as permissive for select to public
  using (((auth.uid() = reader_id) OR (auth.uid() = teacher_id) OR (EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.org_id = org_message_reads.org_id) AND (a.student_id = auth.uid()) AND (a.ended_at IS NULL) AND ((org_message_reads.teacher_id IS NULL) OR (a.teacher_id = org_message_reads.teacher_id)))))));

drop policy if exists "org_messages_insert" on public.org_messages;
create policy "org_messages_insert" on public.org_messages as permissive for insert to public
  with check (((auth.uid() = author_id) AND (((teacher_id IS NOT NULL) AND ((auth.uid() = teacher_id) OR (EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.org_id = org_messages.org_id) AND (a.student_id = auth.uid()) AND (a.teacher_id = org_messages.teacher_id) AND (a.ended_at IS NULL)))))) OR ((teacher_id IS NULL) AND has_can(org_id, 'renraku_all'::text)))));

drop policy if exists "org_messages_select" on public.org_messages;
create policy "org_messages_select" on public.org_messages as permissive for select to public
  using (((auth.uid() = teacher_id) OR ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.org_id = org_messages.org_id) AND (a.student_id = auth.uid()) AND (a.ended_at IS NULL) AND ((org_messages.teacher_id IS NULL) OR (a.teacher_id = org_messages.teacher_id))))) AND (((cardinality(target_division_ids) = 0) AND (cardinality(target_grade_years) = 0) AND (cardinality(target_user_ids) = 0)) OR (auth.uid() = ANY (target_user_ids)) OR (EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.org_id = org_messages.org_id) AND (e.student_id = auth.uid()) AND (e.status = 'active'::text) AND (e.division_id = ANY (org_messages.target_division_ids))))) OR (EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.org_id = org_messages.org_id) AND (e.student_id = auth.uid()) AND (e.status = 'active'::text) AND (e.grade_year = ANY (org_messages.target_grade_years))))))) OR ((teacher_id IS NULL) AND has_can(org_id, 'renraku_all'::text))));

drop policy if exists "org_messages_withdraw" on public.org_messages;
create policy "org_messages_withdraw" on public.org_messages as permissive for update to public
  using ((auth.uid() = author_id))
  with check (((auth.uid() = author_id) AND (withdrawn_at IS NOT NULL)));

drop policy if exists "org_periods_select" on public.org_periods;
create policy "org_periods_select" on public.org_periods as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM memberships m
  WHERE ((m.org_id = org_periods.org_id) AND (m.user_id = auth.uid())))));

drop policy if exists "org_periods_write" on public.org_periods;
create policy "org_periods_write" on public.org_periods as permissive for all to public
  using (has_can(org_id, 'koma'::text))
  with check (has_can(org_id, 'koma'::text));

drop policy if exists "org_places_select" on public.org_places;
create policy "org_places_select" on public.org_places as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM memberships m
  WHERE ((m.org_id = org_places.org_id) AND (m.user_id = auth.uid())))));

drop policy if exists "org_places_write" on public.org_places;
create policy "org_places_write" on public.org_places as permissive for all to public
  using (has_can(org_id, 'koma'::text))
  with check (has_can(org_id, 'koma'::text));

drop policy if exists "org_post_perm_log_select" on public.org_post_perm_log;
create policy "org_post_perm_log_select" on public.org_post_perm_log as permissive for select to public
  using ((has_can(org_id, 'post'::text) OR has_can(org_id, 'master'::text)));

drop policy if exists "同じ学校の人だけ役職を読める" on public.org_posts;
create policy "同じ学校の人だけ役職を読める" on public.org_posts as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM memberships m
  WHERE ((m.org_id = org_posts.org_id) AND (m.user_id = auth.uid())))));

drop policy if exists "organizations_insert_own" on public.organizations;
create policy "organizations_insert_own" on public.organizations as permissive for insert to authenticated
  with check ((auth.uid() = created_by));

drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select" on public.organizations as permissive for select to public
  using (can_view_organization(auth.uid(), id));

drop policy if exists "organizations_select_own_created" on public.organizations;
create policy "organizations_select_own_created" on public.organizations as permissive for select to authenticated
  using ((created_by = auth.uid()));

drop policy if exists "overlap_notices_select" on public.overlap_notices;
create policy "overlap_notices_select" on public.overlap_notices as permissive for select to public
  using ((EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = overlap_notices.lesson_id) AND ((l.teacher_id = auth.uid()) OR has_can(l.org_id, 'sched_all'::text))))));

drop policy if exists "overlap_notices_write" on public.overlap_notices;
create policy "overlap_notices_write" on public.overlap_notices as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = overlap_notices.lesson_id) AND ((l.teacher_id = auth.uid()) OR has_can(l.org_id, 'sched_all'::text))))))
  with check ((EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = overlap_notices.lesson_id) AND ((l.teacher_id = auth.uid()) OR has_can(l.org_id, 'sched_all'::text))))));

drop policy if exists "page_inquiries_owner_select" on public.page_inquiries;
create policy "page_inquiries_owner_select" on public.page_inquiries as permissive for select to authenticated
  using ((owner_user_id = auth.uid()));

drop policy if exists "page_types_owned_select_own" on public.page_types_owned;
create policy "page_types_owned_select_own" on public.page_types_owned as permissive for select to authenticated
  using ((user_id = auth.uid()));

drop policy if exists "performance_results_own" on public.performance_results;
create policy "performance_results_own" on public.performance_results as permissive for all to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "performances_own" on public.performances;
create policy "performances_own" on public.performances as permissive for all to authenticated
  using ((auth.uid() = user_id))
  with check (((auth.uid() = user_id) AND ((org_event_id IS NULL) OR (EXISTS ( SELECT 1
   FROM (org_events e
     JOIN enrollments en ON ((en.org_id = e.org_id)))
  WHERE ((e.id = performances.org_event_id) AND (en.student_id = auth.uid()) AND (en.status = 'active'::text)))))));

drop policy if exists "period_markers_own" on public.period_markers;
create policy "period_markers_own" on public.period_markers as permissive for all to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "portfolio_entries_own" on public.portfolio_entries;
create policy "portfolio_entries_own" on public.portfolio_entries as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

drop policy if exists "portfolio_recordings_own" on public.portfolio_recordings;
create policy "portfolio_recordings_own" on public.portfolio_recordings as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

drop policy if exists "portfolios_own" on public.portfolios;
create policy "portfolios_own" on public.portfolios as permissive for all to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

drop policy if exists "post_change_log_insert" on public.post_change_log;
create policy "post_change_log_insert" on public.post_change_log as permissive for insert to authenticated
  with check (((changed_by = auth.uid()) AND has_can(org_id, 'post'::text)));

drop policy if exists "post_change_log_select" on public.post_change_log;
create policy "post_change_log_select" on public.post_change_log as permissive for select to authenticated
  using (((target_user_id = auth.uid()) OR has_can(org_id, 'post'::text)));

drop policy if exists "postings_delete_own" on public.postings;
create policy "postings_delete_own" on public.postings as permissive for delete to public
  using ((auth.uid() = owner_user_id));

drop policy if exists "postings_insert_own" on public.postings;
create policy "postings_insert_own" on public.postings as permissive for insert to public
  with check (((auth.uid() = owner_user_id) AND (EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.org_id = postings.org_id) AND (e.student_id = auth.uid()) AND (e.status = 'active'::text))))));

drop policy if exists "postings_select_own" on public.postings;
create policy "postings_select_own" on public.postings as permissive for select to public
  using ((auth.uid() = owner_user_id));

drop policy if exists "postings_update_own" on public.postings;
create policy "postings_update_own" on public.postings as permissive for update to public
  using ((auth.uid() = owner_user_id))
  with check (((auth.uid() = owner_user_id) AND (EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.org_id = postings.org_id) AND (e.student_id = auth.uid()) AND (e.status = 'active'::text))))));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles as permissive for update to public
  using ((auth.uid() = id))
  with check ((auth.uid() = id));

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles as permissive for select to public
  using ((auth.uid() = id));

drop policy if exists "Users manage their own projects" on public.project_master;
create policy "Users manage their own projects" on public.project_master as permissive for all to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own" on public.purchases as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "Users can insert their own questionnaire responses" on public.questionnaire_responses;
create policy "Users can insert their own questionnaire responses" on public.questionnaire_responses as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "Users can view their own questionnaire responses" on public.questionnaire_responses;
create policy "Users can view their own questionnaire responses" on public.questionnaire_responses as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "Users can insert their own repertoire tessitura" on public.repertoire_tessitura;
create policy "Users can insert their own repertoire tessitura" on public.repertoire_tessitura as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "Users can update their own repertoire tessitura" on public.repertoire_tessitura;
create policy "Users can update their own repertoire tessitura" on public.repertoire_tessitura as permissive for update to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "Users can view their own repertoire tessitura" on public.repertoire_tessitura;
create policy "Users can view their own repertoire tessitura" on public.repertoire_tessitura as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "repertoire_tessitura_delete_own" on public.repertoire_tessitura;
create policy "repertoire_tessitura_delete_own" on public.repertoire_tessitura as permissive for delete to public
  using ((auth.uid() = user_id));

drop policy if exists "Users manage their own roles" on public.role_master;
create policy "Users manage their own roles" on public.role_master as permissive for all to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

drop policy if exists "roster_drafts_all" on public.roster_drafts;
create policy "roster_drafts_all" on public.roster_drafts as permissive for all to public
  using (has_can(org_id, 'meibo'::text))
  with check (has_can(org_id, 'meibo'::text));

drop policy if exists "score_log_select" on public.score_log;
create policy "score_log_select" on public.score_log as permissive for select to public
  using (has_can(org_id, 'saiten'::text));

drop policy if exists "spc_select_own" on public.student_price_consents;
create policy "spc_select_own" on public.student_price_consents as permissive for select to authenticated
  using ((user_id = auth.uid()));

drop policy if exists "subscription_items_select_own" on public.subscription_items;
create policy "subscription_items_select_own" on public.subscription_items as permissive for select to authenticated
  using ((user_id = auth.uid()));

drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription" on public.subscriptions as permissive for select to public
  using ((auth.uid() = user_id));

drop policy if exists "Teachers can create invitations" on public.teacher_invitations;
create policy "Teachers can create invitations" on public.teacher_invitations as permissive for insert to public
  with check ((auth.uid() = teacher_id));

drop policy if exists "Teachers can view their own invitations" on public.teacher_invitations;
create policy "Teachers can view their own invitations" on public.teacher_invitations as permissive for select to public
  using ((auth.uid() = teacher_id));

drop policy if exists "Only the teacher can access their notes" on public.teacher_notes;
create policy "Only the teacher can access their notes" on public.teacher_notes as permissive for all to public
  using ((EXISTS ( SELECT 1
   FROM teacher_student_links l
  WHERE ((l.id = teacher_notes.link_id) AND (l.teacher_id = auth.uid())))))
  with check ((EXISTS ( SELECT 1
   FROM teacher_student_links l
  WHERE ((l.id = teacher_notes.link_id) AND (l.teacher_id = auth.uid())))));

drop policy if exists "Students can update share scope" on public.teacher_student_links;
create policy "Students can update share scope" on public.teacher_student_links as permissive for update to public
  using (((auth.uid() = teacher_id) OR (auth.uid() = student_id)))
  with check (((teacher_id = ( SELECT l.teacher_id
   FROM teacher_student_links l
  WHERE (l.id = teacher_student_links.id))) AND (student_id = ( SELECT l.student_id
   FROM teacher_student_links l
  WHERE (l.id = teacher_student_links.id)))));

drop policy if exists "Users can view their own links" on public.teacher_student_links;
create policy "Users can view their own links" on public.teacher_student_links as permissive for select to public
  using (((auth.uid() = teacher_id) OR (auth.uid() = student_id)));

drop policy if exists "timetable_nudges_select" on public.timetable_nudges;
create policy "timetable_nudges_select" on public.timetable_nudges as permissive for select to public
  using (has_can(org_id, 'meibo'::text));

drop policy if exists "Users can insert own notices" on public.user_notices;
create policy "Users can insert own notices" on public.user_notices as permissive for insert to public
  with check ((auth.uid() = user_id));

drop policy if exists "Users can view own notices" on public.user_notices;
create policy "Users can view own notices" on public.user_notices as permissive for select to public
  using ((auth.uid() = user_id));

