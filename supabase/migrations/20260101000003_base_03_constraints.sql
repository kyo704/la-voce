-- ★★★土台 ── しばり（主キー・一意・検査・外部キー）
-- ★裁定175 ㋐。★2026-09-23 の 本番（xxjtplvpcneksrofkjmf）の 形を 機械で 書き出した もの。
-- ★★本番には 当てません。★「すでに 当たって いる」と 記録するだけ です。

-- ★★★順は p → u → c → f。★外部キーは 相手の 主キーが 要ります。

-- ★主キー（104）
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'account_deletions_pkey' and conrelid = 'public.account_deletions'::regclass) then
    alter table public.account_deletions add constraint account_deletions_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'age_answer_changes_pkey' and conrelid = 'public.age_answer_changes'::regclass) then
    alter table public.age_answer_changes add constraint age_answer_changes_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'app_secrets_pkey' and conrelid = 'public.app_secrets'::regclass) then
    alter table public.app_secrets add constraint app_secrets_pkey PRIMARY KEY (name);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'application_messages_pkey' and conrelid = 'public.application_messages'::regclass) then
    alter table public.application_messages add constraint application_messages_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'applications_pkey' and conrelid = 'public.applications'::regclass) then
    alter table public.applications add constraint applications_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'article_notes_pkey' and conrelid = 'public.article_notes'::regclass) then
    alter table public.article_notes add constraint article_notes_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'article_progress_pkey' and conrelid = 'public.article_progress'::regclass) then
    alter table public.article_progress add constraint article_progress_pkey PRIMARY KEY (user_id, article_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'assignments_pkey' and conrelid = 'public.assignments'::regclass) then
    alter table public.assignments add constraint assignments_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'calendar_tokens_pkey' and conrelid = 'public.calendar_tokens'::regclass) then
    alter table public.calendar_tokens add constraint calendar_tokens_pkey PRIMARY KEY (user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'chapter_state_pkey' and conrelid = 'public.chapter_state'::regclass) then
    alter table public.chapter_state add constraint chapter_state_pkey PRIMARY KEY (user_id, profession_key, chapter);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'character_inventory_pkey' and conrelid = 'public.character_inventory'::regclass) then
    alter table public.character_inventory add constraint character_inventory_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'code_attempts_pkey' and conrelid = 'public.code_attempts'::regclass) then
    alter table public.code_attempts add constraint code_attempts_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cohort_changes_pkey' and conrelid = 'public.cohort_changes'::regclass) then
    alter table public.cohort_changes add constraint cohort_changes_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'consent_records_pkey' and conrelid = 'public.consent_records'::regclass) then
    alter table public.consent_records add constraint consent_records_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'contract_owner_log_pkey' and conrelid = 'public.contract_owner_log'::regclass) then
    alter table public.contract_owner_log add constraint contract_owner_log_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cycle_periods_pkey' and conrelid = 'public.cycle_periods'::regclass) then
    alter table public.cycle_periods add constraint cycle_periods_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'email_change_log_pkey' and conrelid = 'public.email_change_log'::regclass) then
    alter table public.email_change_log add constraint email_change_log_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'enrollments_pkey' and conrelid = 'public.enrollments'::regclass) then
    alter table public.enrollments add constraint enrollments_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_pkey' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_items_pkey' and conrelid = 'public.evaluation_items'::regclass) then
    alter table public.evaluation_items add constraint evaluation_items_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_judge_done_pkey' and conrelid = 'public.evaluation_judge_done'::regclass) then
    alter table public.evaluation_judge_done add constraint evaluation_judge_done_pkey PRIMARY KEY (event_id, judge_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_reviews_pkey' and conrelid = 'public.evaluation_reviews'::regclass) then
    alter table public.evaluation_reviews add constraint evaluation_reviews_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_scores_pkey' and conrelid = 'public.evaluation_scores'::regclass) then
    alter table public.evaluation_scores add constraint evaluation_scores_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'events_pkey' and conrelid = 'public.events'::regclass) then
    alter table public.events add constraint events_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'export_log_pkey' and conrelid = 'public.export_log'::regclass) then
    alter table public.export_log add constraint export_log_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'feedback_pkey' and conrelid = 'public.feedback'::regclass) then
    alter table public.feedback add constraint feedback_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'guardian_consents_pkey' and conrelid = 'public.guardian_consents'::regclass) then
    alter table public.guardian_consents add constraint guardian_consents_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'import_staging_pkey' and conrelid = 'public.import_staging'::regclass) then
    alter table public.import_staging add constraint import_staging_pkey PRIMARY KEY (user_id, date);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'item_acquisitions_pkey' and conrelid = 'public.item_acquisitions'::regclass) then
    alter table public.item_acquisitions add constraint item_acquisitions_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_pkey' and conrelid = 'public.koen'::regclass) then
    alter table public.koen add constraint koen_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_cells_pkey' and conrelid = 'public.koen_cells'::regclass) then
    alter table public.koen_cells add constraint koen_cells_pkey PRIMARY KEY (row_id, slot_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kid_contact_reads_pkey' and conrelid = 'public.koen_kid_contact_reads'::regclass) then
    alter table public.koen_kid_contact_reads add constraint koen_kid_contact_reads_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kid_contacts_pkey' and conrelid = 'public.koen_kid_contacts'::regclass) then
    alter table public.koen_kid_contacts add constraint koen_kid_contacts_pkey PRIMARY KEY (kid_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kids_pkey' and conrelid = 'public.koen_kids'::regclass) then
    alter table public.koen_kids add constraint koen_kids_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_members_pkey' and conrelid = 'public.koen_members'::regclass) then
    alter table public.koen_members add constraint koen_members_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_rows_pkey' and conrelid = 'public.koen_rows'::regclass) then
    alter table public.koen_rows add constraint koen_rows_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_session_changes_pkey' and conrelid = 'public.koen_session_changes'::regclass) then
    alter table public.koen_session_changes add constraint koen_session_changes_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_sessions_pkey' and conrelid = 'public.koen_sessions'::regclass) then
    alter table public.koen_sessions add constraint koen_sessions_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_slots_pkey' and conrelid = 'public.koen_slots'::regclass) then
    alter table public.koen_slots add constraint koen_slots_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_ng_dates_pkey' and conrelid = 'public.lesson_ng_dates'::regclass) then
    alter table public.lesson_ng_dates add constraint lesson_ng_dates_pkey PRIMARY KEY (round_id, user_id, ng_on);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_prefs_pkey' and conrelid = 'public.lesson_prefs'::regclass) then
    alter table public.lesson_prefs add constraint lesson_prefs_pkey PRIMARY KEY (round_id, user_id, slot_key);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_preset_targets_pkey' and conrelid = 'public.lesson_preset_targets'::regclass) then
    alter table public.lesson_preset_targets add constraint lesson_preset_targets_pkey PRIMARY KEY (preset_id, teacher_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_presets_pkey' and conrelid = 'public.lesson_presets'::regclass) then
    alter table public.lesson_presets add constraint lesson_presets_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_rounds_pkey' and conrelid = 'public.lesson_rounds'::regclass) then
    alter table public.lesson_rounds add constraint lesson_rounds_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_pkey' and conrelid = 'public.lessons'::regclass) then
    alter table public.lessons add constraint lessons_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'link_consents_pkey' and conrelid = 'public.link_consents'::regclass) then
    alter table public.link_consents add constraint link_consents_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_cuts_pkey' and conrelid = 'public.matching_cuts'::regclass) then
    alter table public.matching_cuts add constraint matching_cuts_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_reports_pkey' and conrelid = 'public.matching_reports'::regclass) then
    alter table public.matching_reports add constraint matching_reports_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_pkey' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'minor_billing_consents_pkey' and conrelid = 'public.minor_billing_consents'::regclass) then
    alter table public.minor_billing_consents add constraint minor_billing_consents_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'monka_read_log_pkey' and conrelid = 'public.monka_read_log'::regclass) then
    alter table public.monka_read_log add constraint monka_read_log_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_periods_pkey' and conrelid = 'public.my_periods'::regclass) then
    alter table public.my_periods add constraint my_periods_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_timetable_pkey' and conrelid = 'public.my_timetable'::regclass) then
    alter table public.my_timetable add constraint my_timetable_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notes_pkey' and conrelid = 'public.notes'::regclass) then
    alter table public.notes add constraint notes_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notice_batches_pkey' and conrelid = 'public.notice_batches'::regclass) then
    alter table public.notice_batches add constraint notice_batches_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notice_targets_pkey' and conrelid = 'public.notice_targets'::regclass) then
    alter table public.notice_targets add constraint notice_targets_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ops_alerts_pkey' and conrelid = 'public.ops_alerts'::regclass) then
    alter table public.ops_alerts add constraint ops_alerts_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ops_audit_log_pkey' and conrelid = 'public.ops_audit_log'::regclass) then
    alter table public.ops_audit_log add constraint ops_audit_log_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_billing_pkey' and conrelid = 'public.org_billing'::regclass) then
    alter table public.org_billing add constraint org_billing_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_billing_log_pkey' and conrelid = 'public.org_billing_log'::regclass) then
    alter table public.org_billing_log add constraint org_billing_log_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_contracts_pkey' and conrelid = 'public.org_contracts'::regclass) then
    alter table public.org_contracts add constraint org_contracts_pkey PRIMARY KEY (org_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_divisions_pkey' and conrelid = 'public.org_divisions'::regclass) then
    alter table public.org_divisions add constraint org_divisions_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_event_participants_pkey' and conrelid = 'public.org_event_participants'::regclass) then
    alter table public.org_event_participants add constraint org_event_participants_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_events_pkey' and conrelid = 'public.org_events'::regclass) then
    alter table public.org_events add constraint org_events_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_invitations_pkey' and conrelid = 'public.org_invitations'::regclass) then
    alter table public.org_invitations add constraint org_invitations_pkey PRIMARY KEY (code);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_message_drafts_pkey' and conrelid = 'public.org_message_drafts'::regclass) then
    alter table public.org_message_drafts add constraint org_message_drafts_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_message_reads_pkey' and conrelid = 'public.org_message_reads'::regclass) then
    alter table public.org_message_reads add constraint org_message_reads_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_messages_pkey' and conrelid = 'public.org_messages'::regclass) then
    alter table public.org_messages add constraint org_messages_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_periods_pkey' and conrelid = 'public.org_periods'::regclass) then
    alter table public.org_periods add constraint org_periods_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_places_pkey' and conrelid = 'public.org_places'::regclass) then
    alter table public.org_places add constraint org_places_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_post_perm_log_pkey' and conrelid = 'public.org_post_perm_log'::regclass) then
    alter table public.org_post_perm_log add constraint org_post_perm_log_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_posts_pkey' and conrelid = 'public.org_posts'::regclass) then
    alter table public.org_posts add constraint org_posts_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'organizations_pkey' and conrelid = 'public.organizations'::regclass) then
    alter table public.organizations add constraint organizations_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'overlap_notices_pkey' and conrelid = 'public.overlap_notices'::regclass) then
    alter table public.overlap_notices add constraint overlap_notices_pkey PRIMARY KEY (lesson_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'page_inquiries_pkey' and conrelid = 'public.page_inquiries'::regclass) then
    alter table public.page_inquiries add constraint page_inquiries_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'page_types_owned_pkey' and conrelid = 'public.page_types_owned'::regclass) then
    alter table public.page_types_owned add constraint page_types_owned_pkey PRIMARY KEY (user_id, type_key);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'payment_records_pkey' and conrelid = 'public.payment_records'::regclass) then
    alter table public.payment_records add constraint payment_records_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'performance_results_pkey' and conrelid = 'public.performance_results'::regclass) then
    alter table public.performance_results add constraint performance_results_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'performances_pkey' and conrelid = 'public.performances'::regclass) then
    alter table public.performances add constraint performances_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'period_markers_pkey' and conrelid = 'public.period_markers'::regclass) then
    alter table public.period_markers add constraint period_markers_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_entries_pkey' and conrelid = 'public.portfolio_entries'::regclass) then
    alter table public.portfolio_entries add constraint portfolio_entries_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_recordings_pkey' and conrelid = 'public.portfolio_recordings'::regclass) then
    alter table public.portfolio_recordings add constraint portfolio_recordings_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolios_pkey' and conrelid = 'public.portfolios'::regclass) then
    alter table public.portfolios add constraint portfolios_pkey PRIMARY KEY (user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'post_change_log_pkey' and conrelid = 'public.post_change_log'::regclass) then
    alter table public.post_change_log add constraint post_change_log_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'postings_pkey' and conrelid = 'public.postings'::regclass) then
    alter table public.postings add constraint postings_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_pkey' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'project_master_pkey' and conrelid = 'public.project_master'::regclass) then
    alter table public.project_master add constraint project_master_pkey PRIMARY KEY (user_id, project_name);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'purchases_pkey' and conrelid = 'public.purchases'::regclass) then
    alter table public.purchases add constraint purchases_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'questionnaire_responses_pkey' and conrelid = 'public.questionnaire_responses'::regclass) then
    alter table public.questionnaire_responses add constraint questionnaire_responses_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'recovery_codes_pkey' and conrelid = 'public.recovery_codes'::regclass) then
    alter table public.recovery_codes add constraint recovery_codes_pkey PRIMARY KEY (user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'repertoire_tessitura_pkey' and conrelid = 'public.repertoire_tessitura'::regclass) then
    alter table public.repertoire_tessitura add constraint repertoire_tessitura_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'role_master_pkey' and conrelid = 'public.role_master'::regclass) then
    alter table public.role_master add constraint role_master_pkey PRIMARY KEY (user_id, role_name);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'roster_drafts_pkey' and conrelid = 'public.roster_drafts'::regclass) then
    alter table public.roster_drafts add constraint roster_drafts_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'score_log_pkey' and conrelid = 'public.score_log'::regclass) then
    alter table public.score_log add constraint score_log_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'stripe_events_pkey' and conrelid = 'public.stripe_events'::regclass) then
    alter table public.stripe_events add constraint stripe_events_pkey PRIMARY KEY (event_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'student_price_consents_pkey' and conrelid = 'public.student_price_consents'::regclass) then
    alter table public.student_price_consents add constraint student_price_consents_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subscription_items_pkey' and conrelid = 'public.subscription_items'::regclass) then
    alter table public.subscription_items add constraint subscription_items_pkey PRIMARY KEY (stripe_item_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_pkey' and conrelid = 'public.subscriptions'::regclass) then
    alter table public.subscriptions add constraint subscriptions_pkey PRIMARY KEY (user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'system_alerts_pkey' and conrelid = 'public.system_alerts'::regclass) then
    alter table public.system_alerts add constraint system_alerts_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_invitations_pkey' and conrelid = 'public.teacher_invitations'::regclass) then
    alter table public.teacher_invitations add constraint teacher_invitations_pkey PRIMARY KEY (code);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_notes_pkey' and conrelid = 'public.teacher_notes'::regclass) then
    alter table public.teacher_notes add constraint teacher_notes_pkey PRIMARY KEY (link_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_student_links_pkey' and conrelid = 'public.teacher_student_links'::regclass) then
    alter table public.teacher_student_links add constraint teacher_student_links_pkey PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'timetable_nudges_pkey' and conrelid = 'public.timetable_nudges'::regclass) then
    alter table public.timetable_nudges add constraint timetable_nudges_pkey PRIMARY KEY (org_id, student_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'user_notices_pkey' and conrelid = 'public.user_notices'::regclass) then
    alter table public.user_notices add constraint user_notices_pkey PRIMARY KEY (id);
  end if;
end $$;

-- ★一意（27）
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'applications_unique' and conrelid = 'public.applications'::regclass) then
    alter table public.applications add constraint applications_unique UNIQUE (posting_id, applicant_user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'article_progress_user_article_key' and conrelid = 'public.article_progress'::regclass) then
    alter table public.article_progress add constraint article_progress_user_article_key UNIQUE (user_id, article_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'calendar_tokens_token_key' and conrelid = 'public.calendar_tokens'::regclass) then
    alter table public.calendar_tokens add constraint calendar_tokens_token_key UNIQUE (token);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'character_inventory_user_id_item_key_key' and conrelid = 'public.character_inventory'::regclass) then
    alter table public.character_inventory add constraint character_inventory_user_id_item_key_key UNIQUE (user_id, item_key);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cycle_periods_unique_start' and conrelid = 'public.cycle_periods'::regclass) then
    alter table public.cycle_periods add constraint cycle_periods_unique_start UNIQUE (user_id, start_date);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'enrollments_org_id_student_id_key' and conrelid = 'public.enrollments'::regclass) then
    alter table public.enrollments add constraint enrollments_org_id_student_id_key UNIQUE (org_id, student_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_user_id_date_key' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_user_id_date_key UNIQUE (user_id, date);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_reviews_event_id_student_id_judge_id_key' and conrelid = 'public.evaluation_reviews'::regclass) then
    alter table public.evaluation_reviews add constraint evaluation_reviews_event_id_student_id_judge_id_key UNIQUE (event_id, student_id, judge_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_scores_event_id_student_id_item_id_judge_id_key' and conrelid = 'public.evaluation_scores'::regclass) then
    alter table public.evaluation_scores add constraint evaluation_scores_event_id_student_id_item_id_judge_id_key UNIQUE (event_id, student_id, item_id, judge_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'guardian_consents_token_key' and conrelid = 'public.guardian_consents'::regclass) then
    alter table public.guardian_consents add constraint guardian_consents_token_key UNIQUE (token);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'item_acquisitions_user_id_item_key_key' and conrelid = 'public.item_acquisitions'::regclass) then
    alter table public.item_acquisitions add constraint item_acquisitions_user_id_item_key_key UNIQUE (user_id, item_key);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_cuts_unique' and conrelid = 'public.matching_cuts'::regclass) then
    alter table public.matching_cuts add constraint matching_cuts_unique UNIQUE (user_id, target_user_id, kind);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_org_id_user_id_key' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_org_id_user_id_key UNIQUE (org_id, user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_timetable_uniq' and conrelid = 'public.my_timetable'::regclass) then
    alter table public.my_timetable add constraint my_timetable_uniq UNIQUE (user_id, weekday, period_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notice_targets_batch_id_user_id_key' and conrelid = 'public.notice_targets'::regclass) then
    alter table public.notice_targets add constraint notice_targets_batch_id_user_id_key UNIQUE (batch_id, user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_event_participants_user_id_org_event_id_key' and conrelid = 'public.org_event_participants'::regclass) then
    alter table public.org_event_participants add constraint org_event_participants_user_id_org_event_id_key UNIQUE (user_id, org_event_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_periods_org_id_ord_key' and conrelid = 'public.org_periods'::regclass) then
    alter table public.org_periods add constraint org_periods_org_id_ord_key UNIQUE (org_id, ord);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_places_org_id_name_key' and conrelid = 'public.org_places'::regclass) then
    alter table public.org_places add constraint org_places_org_id_name_key UNIQUE (org_id, name);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_posts_org_id_name_key' and conrelid = 'public.org_posts'::regclass) then
    alter table public.org_posts add constraint org_posts_org_id_name_key UNIQUE (org_id, name);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'performance_results_performance_id_key' and conrelid = 'public.performance_results'::regclass) then
    alter table public.performance_results add constraint performance_results_performance_id_key UNIQUE (performance_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'period_markers_user_id_marked_on_key' and conrelid = 'public.period_markers'::regclass) then
    alter table public.period_markers add constraint period_markers_user_id_marked_on_key UNIQUE (user_id, marked_on);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolios_public_slug_key' and conrelid = 'public.portfolios'::regclass) then
    alter table public.portfolios add constraint portfolios_public_slug_key UNIQUE (public_slug);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'purchases_stripe_session_id_key' and conrelid = 'public.purchases'::regclass) then
    alter table public.purchases add constraint purchases_stripe_session_id_key UNIQUE (stripe_session_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'repertoire_tessitura_user_id_repertoire_name_key' and conrelid = 'public.repertoire_tessitura'::regclass) then
    alter table public.repertoire_tessitura add constraint repertoire_tessitura_user_id_repertoire_name_key UNIQUE (user_id, repertoire_name);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'roster_drafts_org_id_student_number_key' and conrelid = 'public.roster_drafts'::regclass) then
    alter table public.roster_drafts add constraint roster_drafts_org_id_student_number_key UNIQUE (org_id, student_number);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'system_alerts_once_a_day' and conrelid = 'public.system_alerts'::regclass) then
    alter table public.system_alerts add constraint system_alerts_once_a_day UNIQUE (kind, sent_on);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'user_notices_user_id_notice_key_key' and conrelid = 'public.user_notices'::regclass) then
    alter table public.user_notices add constraint user_notices_user_id_notice_key_key UNIQUE (user_id, notice_key);
  end if;
end $$;

-- ★検査（109）
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'application_messages_pieces_check' and conrelid = 'public.application_messages'::regclass) then
    alter table public.application_messages add constraint application_messages_pieces_check CHECK ((((template_key = 'kyokumoku_kotae'::text) AND (array_length(pieces, 1) >= 1)) OR ((template_key <> 'kyokumoku_kotae'::text) AND (pieces IS NULL))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'application_messages_template_check' and conrelid = 'public.application_messages'::regclass) then
    alter table public.application_messages add constraint application_messages_template_check CHECK ((template_key = ANY (ARRAY['kyokumoku_kotae'::text, 'kyokumoku_kore_kara'::text, 'toujitsu_made_ni'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'applications_days_not_empty' and conrelid = 'public.applications'::regclass) then
    alter table public.applications add constraint applications_days_not_empty CHECK ((array_length(available_days, 1) >= 1));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'applications_status_check' and conrelid = 'public.applications'::regclass) then
    alter table public.applications add constraint applications_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'chosen'::text, 'withdrawn'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'applications_template_check' and conrelid = 'public.applications'::regclass) then
    alter table public.applications add constraint applications_template_check CHECK ((template_key = ANY (ARRAY['ukeraremasu'::text, 'kyokumoku_kikitai'::text, 'orei_sodan'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'article_notes_body_check' and conrelid = 'public.article_notes'::regclass) then
    alter table public.article_notes add constraint article_notes_body_check CHECK ((char_length(body) <= 500));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'article_notes_kind_check' and conrelid = 'public.article_notes'::regclass) then
    alter table public.article_notes add constraint article_notes_kind_check CHECK ((kind = ANY (ARRAY['highlight'::text, 'article'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'article_progress_box_check' and conrelid = 'public.article_progress'::regclass) then
    alter table public.article_progress add constraint article_progress_box_check CHECK (((box >= 0) AND (box <= 4)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cycle_periods_end_after_start' and conrelid = 'public.cycle_periods'::regclass) then
    alter table public.cycle_periods add constraint cycle_periods_end_after_start CHECK (((end_date IS NULL) OR (end_date >= start_date)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'email_change_log_via_check' and conrelid = 'public.email_change_log'::regclass) then
    alter table public.email_change_log add constraint email_change_log_via_check CHECK ((via = ANY (ARRAY['settings'::text, 'recovery'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'enrollments_status_check' and conrelid = 'public.enrollments'::regclass) then
    alter table public.enrollments add constraint enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'left'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_accompaniment_check' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_accompaniment_check CHECK (((accompaniment IS NULL) OR (accompaniment = ANY (ARRAY['piano'::text, 'orchestra'::text, 'band'::text, 'backing_track'::text, 'a_cappella'::text, 'other'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_belly_tight_ok' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_belly_tight_ok CHECK (((belly_tight IS NULL) OR (belly_tight = ANY (ARRAY['yes'::text, 'no'::text, 'unknown'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_head_raised_ok' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_head_raised_ok CHECK (((head_raised IS NULL) OR (head_raised = ANY (ARRAY['yes'::text, 'no'::text, 'unknown'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_morning_edema_check' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_morning_edema_check CHECK (((morning_edema IS NULL) OR (morning_edema = ANY (ARRAY[0, 1, 2]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_sleep_side_ok' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_sleep_side_ok CHECK (((sleep_side IS NULL) OR (sleep_side = ANY (ARRAY['left'::text, 'right'::text, 'back'::text, 'front'::text, 'unknown'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_source_check' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_source_check CHECK (((source IS NULL) OR (source = ANY (ARRAY['live'::text, 'later'::text, 'import'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_weather_source_check' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_weather_source_check CHECK (((weather_source IS NULL) OR (weather_source = ANY (ARRAY['entered'::text, 'carried'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_items_max_check' and conrelid = 'public.evaluation_items'::regclass) then
    alter table public.evaluation_items add constraint evaluation_items_max_check CHECK (((max_points > (0)::numeric) AND (max_points <= (1000)::numeric)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_items_step_check' and conrelid = 'public.evaluation_items'::regclass) then
    alter table public.evaluation_items add constraint evaluation_items_step_check CHECK ((step = ANY (ARRAY[0.5, (1)::numeric])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'item_acquisitions_acquired_by_check' and conrelid = 'public.item_acquisitions'::regclass) then
    alter table public.item_acquisitions add constraint item_acquisitions_acquired_by_check CHECK ((acquired_by = ANY (ARRAY['shop'::text, 'gift'::text, 'unlock'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'item_acquisitions_count_kind_check' and conrelid = 'public.item_acquisitions'::regclass) then
    alter table public.item_acquisitions add constraint item_acquisitions_count_kind_check CHECK ((count_kind = ANY (ARRAY['record_days'::text, 'performances'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'item_acquisitions_count_value_check' and conrelid = 'public.item_acquisitions'::regclass) then
    alter table public.item_acquisitions add constraint item_acquisitions_count_value_check CHECK ((count_value >= 0));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_check' and conrelid = 'public.koen'::regclass) then
    alter table public.koen add constraint koen_check CHECK (((org_id IS NOT NULL) OR (owner_user_id IS NOT NULL)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kind_check' and conrelid = 'public.koen'::regclass) then
    alter table public.koen add constraint koen_kind_check CHECK ((kind = ANY (ARRAY['opera'::text, 'chorus'::text, 'drama'::text, 'orchestra'::text, 'gala'::text, 'chamber'::text, 'band'::text, 'dance'::text, 'other'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_status_check' and conrelid = 'public.koen'::regclass) then
    alter table public.koen add constraint koen_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'open'::text, 'done'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_tier_people_check' and conrelid = 'public.koen'::regclass) then
    alter table public.koen add constraint koen_tier_people_check CHECK ((tier_people = ANY (ARRAY[15, 40, 120, 300, 600])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_cells_people_check' and conrelid = 'public.koen_cells'::regclass) then
    alter table public.koen_cells add constraint koen_cells_people_check CHECK (((people IS NULL) OR (people >= 0)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kid_contact_reads_reason_kind_check' and conrelid = 'public.koen_kid_contact_reads'::regclass) then
    alter table public.koen_kid_contact_reads add constraint koen_kid_contact_reads_reason_kind_check CHECK ((reason_kind = ANY (ARRAY['todays_call'::text, 'emergency'::text, 'guardian_request'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kid_contacts_contact_check' and conrelid = 'public.koen_kid_contacts'::regclass) then
    alter table public.koen_kid_contacts add constraint koen_kid_contacts_contact_check CHECK (((length(contact) >= 1) AND (length(contact) <= 120)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kids_nickname_check' and conrelid = 'public.koen_kids'::regclass) then
    alter table public.koen_kids add constraint koen_kids_nickname_check CHECK (((length(nickname) >= 1) AND (length(nickname) <= 20)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_members_part_check' and conrelid = 'public.koen_members'::regclass) then
    alter table public.koen_members add constraint koen_members_part_check CHECK ((part = ANY (ARRAY['cast'::text, 'staff'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_rows_minutes_check' and conrelid = 'public.koen_rows'::regclass) then
    alter table public.koen_rows add constraint koen_rows_minutes_check CHECK (((minutes IS NULL) OR ((minutes >= 0) AND (minutes <= 600))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_sessions_kind_check' and conrelid = 'public.koen_sessions'::regclass) then
    alter table public.koen_sessions add constraint koen_sessions_kind_check CHECK ((kind = ANY (ARRAY['rehearsal'::text, 'call'::text, 'show'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_slots_slot_kind_check' and conrelid = 'public.koen_slots'::regclass) then
    alter table public.koen_slots add constraint koen_slots_slot_kind_check CHECK ((slot_kind = ANY (ARRAY['one'::text, 'alt'::text, 'many'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_prefs_level_check' and conrelid = 'public.lesson_prefs'::regclass) then
    alter table public.lesson_prefs add constraint lesson_prefs_level_check CHECK ((level = ANY (ARRAY[0, 1, 2])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_presets_need_count_check' and conrelid = 'public.lesson_presets'::regclass) then
    alter table public.lesson_presets add constraint lesson_presets_need_count_check CHECK (((need_count IS NULL) OR ((need_count > 0) AND (need_count <= total_count))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_presets_total_count_check' and conrelid = 'public.lesson_presets'::regclass) then
    alter table public.lesson_presets add constraint lesson_presets_total_count_check CHECK (((total_count > 0) AND (total_count <= 400)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_rounds_check' and conrelid = 'public.lesson_rounds'::regclass) then
    alter table public.lesson_rounds add constraint lesson_rounds_check CHECK ((period_to >= period_from));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_rounds_status_check' and conrelid = 'public.lesson_rounds'::regclass) then
    alter table public.lesson_rounds add constraint lesson_rounds_status_check CHECK ((status = ANY (ARRAY['open'::text, 'confirmed'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_attendance_check' and conrelid = 'public.lessons'::regclass) then
    alter table public.lessons add constraint lessons_attendance_check CHECK (((attendance IS NULL) OR (attendance = ANY (ARRAY['came'::text, 'absent'::text, 'canceled'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_student_notice_check' and conrelid = 'public.lessons'::regclass) then
    alter table public.lessons add constraint lessons_student_notice_check CHECK (((student_notice IS NULL) OR (student_notice = ANY (ARRAY['absent'::text, 'late'::text, 'coming'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_cuts_kind_check' and conrelid = 'public.matching_cuts'::regclass) then
    alter table public.matching_cuts add constraint matching_cuts_kind_check CHECK ((kind = ANY (ARRAY['withdraw'::text, 'mute'::text, 'hide'::text, 'reported'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_cuts_not_self' and conrelid = 'public.matching_cuts'::regclass) then
    alter table public.matching_cuts add constraint matching_cuts_not_self CHECK ((user_id <> target_user_id));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_reports_not_self' and conrelid = 'public.matching_reports'::regclass) then
    alter table public.matching_reports add constraint matching_reports_not_self CHECK ((reporter_user_id <> target_user_id));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_reports_outcome_check' and conrelid = 'public.matching_reports'::regclass) then
    alter table public.matching_reports add constraint matching_reports_outcome_check CHECK (((outcome IS NULL) OR (outcome = ANY (ARRAY['restored'::text, 'banned'::text, 'holding'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_reports_reason_check' and conrelid = 'public.matching_reports'::regclass) then
    alter table public.matching_reports add constraint matching_reports_reason_check CHECK ((reason = ANY (ARRAY['shitsukoku'::text, 'kankei_nai_hanashi'::text, 'hoka_de_renraku'::text, 'okane'::text, 'kowai'::text, 'sonohoka'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'display_title_shape' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint display_title_shape CHECK (((display_title IS NULL) OR ((char_length(display_title) BETWEEN 1 AND 20) AND (display_title = btrim(display_title)) AND (display_title !~ '[[:cntrl:]]'::text))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_grade_label_len' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_grade_label_len CHECK (((grade_label IS NULL) OR (char_length(grade_label) <= 40)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_role_check' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'teacher'::text, 'staff'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'monka_read_log_reason_kind_check' and conrelid = 'public.monka_read_log'::regclass) then
    alter table public.monka_read_log add constraint monka_read_log_reason_kind_check CHECK ((reason_kind = ANY (ARRAY['jiko'::text, 'honnin'::text, 'horei'::text, 'sonohoka'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'monka_read_log_reason_not_blank' and conrelid = 'public.monka_read_log'::regclass) then
    alter table public.monka_read_log add constraint monka_read_log_reason_not_blank CHECK ((char_length(btrim(reason)) >= 4));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'monka_read_log_reason_note_check' and conrelid = 'public.monka_read_log'::regclass) then
    alter table public.monka_read_log add constraint monka_read_log_reason_note_check CHECK (((reason_kind <> 'sonohoka'::text) OR ((reason_note IS NOT NULL) AND (btrim(reason_note) <> ''::text) AND (char_length(reason_note) <= 100))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_periods_end_ok' and conrelid = 'public.my_periods'::regclass) then
    alter table public.my_periods add constraint my_periods_end_ok CHECK (((end_min >= 1) AND (end_min <= 1440)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_periods_name_len' and conrelid = 'public.my_periods'::regclass) then
    alter table public.my_periods add constraint my_periods_name_len CHECK (((char_length(name) >= 1) AND (char_length(name) <= 12)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_periods_ord_ok' and conrelid = 'public.my_periods'::regclass) then
    alter table public.my_periods add constraint my_periods_ord_ok CHECK (((ord >= 1) AND (ord <= 20)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_periods_order_ok' and conrelid = 'public.my_periods'::regclass) then
    alter table public.my_periods add constraint my_periods_order_ok CHECK ((end_min > start_min));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_periods_start_ok' and conrelid = 'public.my_periods'::regclass) then
    alter table public.my_periods add constraint my_periods_start_ok CHECK (((start_min >= 0) AND (start_min <= 1439)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_timetable_either_ok' and conrelid = 'public.my_timetable'::regclass) then
    alter table public.my_timetable add constraint my_timetable_either_ok CHECK (((unavailable = false) OR ((title IS NULL) AND (teacher IS NULL) AND (room IS NULL) AND (memo IS NULL))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_timetable_memo_len' and conrelid = 'public.my_timetable'::regclass) then
    alter table public.my_timetable add constraint my_timetable_memo_len CHECK (((memo IS NULL) OR (char_length(memo) <= 200)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_timetable_room_len' and conrelid = 'public.my_timetable'::regclass) then
    alter table public.my_timetable add constraint my_timetable_room_len CHECK (((room IS NULL) OR (char_length(room) <= 20)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_timetable_teacher_len' and conrelid = 'public.my_timetable'::regclass) then
    alter table public.my_timetable add constraint my_timetable_teacher_len CHECK (((teacher IS NULL) OR (char_length(teacher) <= 20)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_timetable_title_len' and conrelid = 'public.my_timetable'::regclass) then
    alter table public.my_timetable add constraint my_timetable_title_len CHECK (((title IS NULL) OR (char_length(title) <= 40)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_timetable_weekday_ok' and conrelid = 'public.my_timetable'::regclass) then
    alter table public.my_timetable add constraint my_timetable_weekday_ok CHECK (((weekday >= 0) AND (weekday <= 6)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notes_kind_check' and conrelid = 'public.notes'::regclass) then
    alter table public.notes add constraint notes_kind_check CHECK ((kind = ANY (ARRAY['practice'::text, 'repertoire'::text, 'studio'::text, 'clinic'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_billing_method_check' and conrelid = 'public.org_billing'::regclass) then
    alter table public.org_billing add constraint org_billing_method_check CHECK (((method IS NULL) OR (method = ANY (ARRAY['card'::text, 'invoice'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_contracts_check' and conrelid = 'public.org_contracts'::regclass) then
    alter table public.org_contracts add constraint org_contracts_check CHECK ((paid_from = (free_until + 1)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_contracts_cycle_check' and conrelid = 'public.org_contracts'::regclass) then
    alter table public.org_contracts add constraint org_contracts_cycle_check CHECK ((cycle = ANY (ARRAY['monthly'::text, 'annual'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_divisions_kind_check' and conrelid = 'public.org_divisions'::regclass) then
    alter table public.org_divisions add constraint org_divisions_kind_check CHECK ((kind = ANY (ARRAY['faculty'::text, 'department'::text, 'field'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_message_drafts_kind_check' and conrelid = 'public.org_message_drafts'::regclass) then
    alter table public.org_message_drafts add constraint org_message_drafts_kind_check CHECK ((kind = ANY (ARRAY['draft'::text, 'failed'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_periods_time_check' and conrelid = 'public.org_periods'::regclass) then
    alter table public.org_periods add constraint org_periods_time_check CHECK (((start_min >= 0) AND (end_min > start_min) AND (end_min <= 1440)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_post_perm_log_changed_by_kind_check' and conrelid = 'public.org_post_perm_log'::regclass) then
    alter table public.org_post_perm_log add constraint org_post_perm_log_changed_by_kind_check CHECK ((changed_by_kind = ANY (ARRAY['person'::text, 'system'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_post_perm_log_op_check' and conrelid = 'public.org_post_perm_log'::regclass) then
    alter table public.org_post_perm_log add constraint org_post_perm_log_op_check CHECK ((op = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_posts_name_check' and conrelid = 'public.org_posts'::regclass) then
    alter table public.org_posts add constraint org_posts_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 40)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'organizations_kind_check' and conrelid = 'public.organizations'::regclass) then
    alter table public.organizations add constraint organizations_kind_check CHECK ((kind = ANY (ARRAY['solo'::text, 'studio'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'overlap_notices_status_check' and conrelid = 'public.overlap_notices'::regclass) then
    alter table public.overlap_notices add constraint overlap_notices_status_check CHECK ((status = ANY (ARRAY['まだ'::text, '知らせた'::text, '解決'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'page_inquiries_body_check' and conrelid = 'public.page_inquiries'::regclass) then
    alter table public.page_inquiries add constraint page_inquiries_body_check CHECK (((length(body) >= 1) AND (length(body) <= 2000)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'page_inquiries_from_email_check' and conrelid = 'public.page_inquiries'::regclass) then
    alter table public.page_inquiries add constraint page_inquiries_from_email_check CHECK (((from_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text) AND (length(from_email) <= 120)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'page_inquiries_from_name_check' and conrelid = 'public.page_inquiries'::regclass) then
    alter table public.page_inquiries add constraint page_inquiries_from_name_check CHECK (((length(from_name) >= 1) AND (length(from_name) <= 60)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'page_types_owned_source_check' and conrelid = 'public.page_types_owned'::regclass) then
    alter table public.page_types_owned add constraint page_types_owned_source_check CHECK ((source = ANY (ARRAY['included'::text, 'trial'::text, 'bought'::text, 'field_free'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'performance_results_result_check' and conrelid = 'public.performance_results'::regclass) then
    alter table public.performance_results add constraint performance_results_result_check CHECK ((result = ANY (ARRAY['out'::text, 'partial'::text, 'not_out'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'performances_kind_ok' and conrelid = 'public.performances'::regclass) then
    alter table public.performances add constraint performances_kind_ok CHECK ((kind = ANY (ARRAY['honban'::text, 'rehearsal'::text, 'lesson_take'::text, 'lesson_give'::text, 'recording'::text, 'audition'::text, 'travel'::text, 'rest'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'performances_label_len' and conrelid = 'public.performances'::regclass) then
    alter table public.performances add constraint performances_label_len CHECK (((label IS NULL) OR (char_length(label) <= 40)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'performances_morning_words_len' and conrelid = 'public.performances'::regclass) then
    alter table public.performances add constraint performances_morning_words_len CHECK (((morning_words IS NULL) OR (char_length(morning_words) <= 500)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_entries_kind_check' and conrelid = 'public.portfolio_entries'::regclass) then
    alter table public.portfolio_entries add constraint portfolio_entries_kind_check CHECK ((kind = ANY (ARRAY['school'::text, 'award'::text, 'teacher'::text, 'education'::text, 'performance'::text, 'repertoire'::text, 'recording'::text, 'role'::text, 'skill'::text, 'physical'::text, 'news'::text, 'press'::text, 'lesson'::text, 'faq'::text, 'management'::text, 'link'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_recordings_url_check' and conrelid = 'public.portfolio_recordings'::regclass) then
    alter table public.portfolio_recordings add constraint portfolio_recordings_url_check CHECK ((url ~ '^https://[^\s]+$'::text));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_recordings_youtube_only' and conrelid = 'public.portfolio_recordings'::regclass) then
    alter table public.portfolio_recordings add constraint portfolio_recordings_youtube_only CHECK ((url ~* '^https://(www\.|m\.)?(youtube\.com|youtu\.be)/'::text));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolios_visibility_check' and conrelid = 'public.portfolios'::regclass) then
    alter table public.portfolios add constraint portfolios_visibility_check CHECK ((visibility = ANY (ARRAY['self'::text, 'public'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'postings_days_not_empty' and conrelid = 'public.postings'::regclass) then
    alter table public.postings add constraint postings_days_not_empty CHECK ((array_length(days, 1) >= 1));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'postings_fee_amount_check' and conrelid = 'public.postings'::regclass) then
    alter table public.postings add constraint postings_fee_amount_check CHECK (((fee_amount IS NULL) OR (fee_amount >= 0)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'postings_fee_unit_check' and conrelid = 'public.postings'::regclass) then
    alter table public.postings add constraint postings_fee_unit_check CHECK (((fee_unit IS NULL) OR (fee_unit = ANY (ARRAY['1回の本番'::text, '1回の練習'::text, '時給'::text, 'まとめて'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'postings_kind_check' and conrelid = 'public.postings'::regclass) then
    alter table public.postings add constraint postings_kind_check CHECK ((kind = ANY (ARRAY['実技試験'::text, 'コンクール'::text, '演奏会'::text, '録音'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'postings_status_check' and conrelid = 'public.postings'::regclass) then
    alter table public.postings add constraint postings_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'age_band_values' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint age_band_values CHECK (((age_band IS NULL) OR (age_band = ANY (ARRAY['under15'::text, 'teen'::text, 'adult'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_cohort_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_cohort_check CHECK ((cohort = ANY (ARRAY['tester'::text, 'general'::text, 'founder'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_data_region_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_data_region_check CHECK ((data_region = ANY (ARRAY['jp'::text, 'us'::text, 'eu'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_display_scale_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_display_scale_check CHECK ((display_scale = ANY (ARRAY['normal'::text, 'large'::text, 'xlarge'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_record_mode_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_record_mode_check CHECK ((record_mode = ANY (ARRAY['simple'::text, 'full'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_voice_occupation_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_voice_occupation_check CHECK (((voice_occupation IS NULL) OR (voice_occupation = ANY (ARRAY['classical'::text, 'musical'::text, 'pops'::text, 'voiceActor'::text, 'narrator'::text, 'announcer'::text, 'actorStage'::text, 'actorScreen'::text, 'rakugo'::text, 'mc'::text, 'other'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'purchases_refund_le_amount' and conrelid = 'public.purchases'::regclass) then
    alter table public.purchases add constraint purchases_refund_le_amount CHECK (((amount_yen IS NULL) OR (refunded_yen <= amount_yen)));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'purchases_refunded_yen_check' and conrelid = 'public.purchases'::regclass) then
    alter table public.purchases add constraint purchases_refunded_yen_check CHECK ((refunded_yen >= 0));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'purchases_status_check' and conrelid = 'public.purchases'::regclass) then
    alter table public.purchases add constraint purchases_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'ended_early'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'purchases_tier_check' and conrelid = 'public.purchases'::regclass) then
    alter table public.purchases add constraint purchases_tier_check CHECK (((tier IS NULL) OR (tier = ANY (ARRAY['free'::text, 'basic'::text, 'full'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'repertoire_status_check' and conrelid = 'public.repertoire_tessitura'::regclass) then
    alter table public.repertoire_tessitura add constraint repertoire_status_check CHECK (((status IS NULL) OR (status = ANY (ARRAY['はじめたばかり'::text, 'さらい中'::text, '本番済み'::text, 'しばらく置く'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subscription_items_lookup_key_check' and conrelid = 'public.subscription_items'::regclass) then
    alter table public.subscription_items add constraint subscription_items_lookup_key_check CHECK ((lookup_key = ANY (ARRAY['ind_zenbu_m'::text, 'ind_gakusei_m'::text, 'ind_shiraberu_m'::text, 'ind_yosooi_m'::text, 'kyo_m'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_plan_values' and conrelid = 'public.subscriptions'::regclass) then
    alter table public.subscriptions add constraint subscriptions_plan_values CHECK (((plan IS NULL) OR (plan = ANY (ARRAY['monthly'::text, 'annual'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_tier_check' and conrelid = 'public.subscriptions'::regclass) then
    alter table public.subscriptions add constraint subscriptions_tier_check CHECK (((tier IS NULL) OR (tier = ANY (ARRAY['free'::text, 'basic'::text, 'full'::text]))));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_student_links_revoked_by_check' and conrelid = 'public.teacher_student_links'::regclass) then
    alter table public.teacher_student_links add constraint teacher_student_links_revoked_by_check CHECK ((revoked_by = ANY (ARRAY['teacher'::text, 'student'::text])));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_student_links_status_check' and conrelid = 'public.teacher_student_links'::regclass) then
    alter table public.teacher_student_links add constraint teacher_student_links_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'revoked'::text])));
  end if;
end $$;

-- ★外部キー（185）
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'age_answer_changes_user_id_fkey' and conrelid = 'public.age_answer_changes'::regclass) then
    alter table public.age_answer_changes add constraint age_answer_changes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'application_messages_application_id_fkey' and conrelid = 'public.application_messages'::regclass) then
    alter table public.application_messages add constraint application_messages_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'application_messages_sender_user_id_fkey' and conrelid = 'public.application_messages'::regclass) then
    alter table public.application_messages add constraint application_messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'applications_applicant_user_id_fkey' and conrelid = 'public.applications'::regclass) then
    alter table public.applications add constraint applications_applicant_user_id_fkey FOREIGN KEY (applicant_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'applications_org_id_fkey' and conrelid = 'public.applications'::regclass) then
    alter table public.applications add constraint applications_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'applications_posting_id_fkey' and conrelid = 'public.applications'::regclass) then
    alter table public.applications add constraint applications_posting_id_fkey FOREIGN KEY (posting_id) REFERENCES postings(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'article_notes_user_id_fkey' and conrelid = 'public.article_notes'::regclass) then
    alter table public.article_notes add constraint article_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'article_progress_user_id_fkey' and conrelid = 'public.article_progress'::regclass) then
    alter table public.article_progress add constraint article_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'assignments_org_id_fkey' and conrelid = 'public.assignments'::regclass) then
    alter table public.assignments add constraint assignments_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'assignments_student_id_fkey' and conrelid = 'public.assignments'::regclass) then
    alter table public.assignments add constraint assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'assignments_teacher_id_fkey' and conrelid = 'public.assignments'::regclass) then
    alter table public.assignments add constraint assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'calendar_tokens_user_id_fkey' and conrelid = 'public.calendar_tokens'::regclass) then
    alter table public.calendar_tokens add constraint calendar_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'chapter_state_user_id_fkey' and conrelid = 'public.chapter_state'::regclass) then
    alter table public.chapter_state add constraint chapter_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'character_inventory_user_id_fkey' and conrelid = 'public.character_inventory'::regclass) then
    alter table public.character_inventory add constraint character_inventory_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cohort_changes_user_id_fkey' and conrelid = 'public.cohort_changes'::regclass) then
    alter table public.cohort_changes add constraint cohort_changes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'consent_records_user_id_fkey' and conrelid = 'public.consent_records'::regclass) then
    alter table public.consent_records add constraint consent_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'contract_owner_log_org_id_fkey' and conrelid = 'public.contract_owner_log'::regclass) then
    alter table public.contract_owner_log add constraint contract_owner_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cycle_periods_user_id_fkey' and conrelid = 'public.cycle_periods'::regclass) then
    alter table public.cycle_periods add constraint cycle_periods_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'email_change_log_user_id_fkey' and conrelid = 'public.email_change_log'::regclass) then
    alter table public.email_change_log add constraint email_change_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'enrollments_division_id_fkey' and conrelid = 'public.enrollments'::regclass) then
    alter table public.enrollments add constraint enrollments_division_id_fkey FOREIGN KEY (division_id) REFERENCES org_divisions(id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'enrollments_org_id_fkey' and conrelid = 'public.enrollments'::regclass) then
    alter table public.enrollments add constraint enrollments_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'enrollments_student_id_fkey' and conrelid = 'public.enrollments'::regclass) then
    alter table public.enrollments add constraint enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_user_id_fkey' and conrelid = 'public.entries'::regclass) then
    alter table public.entries add constraint entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_items_created_by_fkey' and conrelid = 'public.evaluation_items'::regclass) then
    alter table public.evaluation_items add constraint evaluation_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_items_event_id_fkey' and conrelid = 'public.evaluation_items'::regclass) then
    alter table public.evaluation_items add constraint evaluation_items_event_id_fkey FOREIGN KEY (event_id) REFERENCES org_events(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_items_org_id_fkey' and conrelid = 'public.evaluation_items'::regclass) then
    alter table public.evaluation_items add constraint evaluation_items_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_judge_done_event_id_fkey' and conrelid = 'public.evaluation_judge_done'::regclass) then
    alter table public.evaluation_judge_done add constraint evaluation_judge_done_event_id_fkey FOREIGN KEY (event_id) REFERENCES org_events(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_judge_done_judge_id_fkey' and conrelid = 'public.evaluation_judge_done'::regclass) then
    alter table public.evaluation_judge_done add constraint evaluation_judge_done_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_judge_done_org_id_fkey' and conrelid = 'public.evaluation_judge_done'::regclass) then
    alter table public.evaluation_judge_done add constraint evaluation_judge_done_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_reviews_event_id_fkey' and conrelid = 'public.evaluation_reviews'::regclass) then
    alter table public.evaluation_reviews add constraint evaluation_reviews_event_id_fkey FOREIGN KEY (event_id) REFERENCES org_events(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_reviews_judge_id_fkey' and conrelid = 'public.evaluation_reviews'::regclass) then
    alter table public.evaluation_reviews add constraint evaluation_reviews_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_reviews_org_id_fkey' and conrelid = 'public.evaluation_reviews'::regclass) then
    alter table public.evaluation_reviews add constraint evaluation_reviews_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_reviews_student_id_fkey' and conrelid = 'public.evaluation_reviews'::regclass) then
    alter table public.evaluation_reviews add constraint evaluation_reviews_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_scores_event_id_fkey' and conrelid = 'public.evaluation_scores'::regclass) then
    alter table public.evaluation_scores add constraint evaluation_scores_event_id_fkey FOREIGN KEY (event_id) REFERENCES org_events(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_scores_item_id_fkey' and conrelid = 'public.evaluation_scores'::regclass) then
    alter table public.evaluation_scores add constraint evaluation_scores_item_id_fkey FOREIGN KEY (item_id) REFERENCES evaluation_items(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_scores_judge_id_fkey' and conrelid = 'public.evaluation_scores'::regclass) then
    alter table public.evaluation_scores add constraint evaluation_scores_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_scores_org_id_fkey' and conrelid = 'public.evaluation_scores'::regclass) then
    alter table public.evaluation_scores add constraint evaluation_scores_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'evaluation_scores_student_id_fkey' and conrelid = 'public.evaluation_scores'::regclass) then
    alter table public.evaluation_scores add constraint evaluation_scores_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'events_user_id_fkey' and conrelid = 'public.events'::regclass) then
    alter table public.events add constraint events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'export_log_org_id_fkey' and conrelid = 'public.export_log'::regclass) then
    alter table public.export_log add constraint export_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'export_log_user_id_fkey' and conrelid = 'public.export_log'::regclass) then
    alter table public.export_log add constraint export_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'feedback_user_id_fkey' and conrelid = 'public.feedback'::regclass) then
    alter table public.feedback add constraint feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'guardian_consents_org_id_fkey' and conrelid = 'public.guardian_consents'::regclass) then
    alter table public.guardian_consents add constraint guardian_consents_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'guardian_consents_teacher_id_fkey' and conrelid = 'public.guardian_consents'::regclass) then
    alter table public.guardian_consents add constraint guardian_consents_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'guardian_consents_user_id_fkey' and conrelid = 'public.guardian_consents'::regclass) then
    alter table public.guardian_consents add constraint guardian_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'item_acquisitions_user_id_fkey' and conrelid = 'public.item_acquisitions'::regclass) then
    alter table public.item_acquisitions add constraint item_acquisitions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_org_id_fkey' and conrelid = 'public.koen'::regclass) then
    alter table public.koen add constraint koen_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_owner_user_id_fkey' and conrelid = 'public.koen'::regclass) then
    alter table public.koen add constraint koen_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_cells_member_id_fkey' and conrelid = 'public.koen_cells'::regclass) then
    alter table public.koen_cells add constraint koen_cells_member_id_fkey FOREIGN KEY (member_id) REFERENCES koen_members(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_cells_row_id_fkey' and conrelid = 'public.koen_cells'::regclass) then
    alter table public.koen_cells add constraint koen_cells_row_id_fkey FOREIGN KEY (row_id) REFERENCES koen_rows(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_cells_slot_id_fkey' and conrelid = 'public.koen_cells'::regclass) then
    alter table public.koen_cells add constraint koen_cells_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES koen_slots(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kid_contact_reads_kid_id_fkey' and conrelid = 'public.koen_kid_contact_reads'::regclass) then
    alter table public.koen_kid_contact_reads add constraint koen_kid_contact_reads_kid_id_fkey FOREIGN KEY (kid_id) REFERENCES koen_kids(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kid_contact_reads_koen_id_fkey' and conrelid = 'public.koen_kid_contact_reads'::regclass) then
    alter table public.koen_kid_contact_reads add constraint koen_kid_contact_reads_koen_id_fkey FOREIGN KEY (koen_id) REFERENCES koen(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kid_contact_reads_viewer_user_id_fkey' and conrelid = 'public.koen_kid_contact_reads'::regclass) then
    alter table public.koen_kid_contact_reads add constraint koen_kid_contact_reads_viewer_user_id_fkey FOREIGN KEY (viewer_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kid_contacts_kid_id_fkey' and conrelid = 'public.koen_kid_contacts'::regclass) then
    alter table public.koen_kid_contacts add constraint koen_kid_contacts_kid_id_fkey FOREIGN KEY (kid_id) REFERENCES koen_kids(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kids_guardian_user_id_fkey' and conrelid = 'public.koen_kids'::regclass) then
    alter table public.koen_kids add constraint koen_kids_guardian_user_id_fkey FOREIGN KEY (guardian_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_kids_koen_id_fkey' and conrelid = 'public.koen_kids'::regclass) then
    alter table public.koen_kids add constraint koen_kids_koen_id_fkey FOREIGN KEY (koen_id) REFERENCES koen(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_members_koen_id_fkey' and conrelid = 'public.koen_members'::regclass) then
    alter table public.koen_members add constraint koen_members_koen_id_fkey FOREIGN KEY (koen_id) REFERENCES koen(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_members_user_id_fkey' and conrelid = 'public.koen_members'::regclass) then
    alter table public.koen_members add constraint koen_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_rows_koen_id_fkey' and conrelid = 'public.koen_rows'::regclass) then
    alter table public.koen_rows add constraint koen_rows_koen_id_fkey FOREIGN KEY (koen_id) REFERENCES koen(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_session_changes_changed_by_fkey' and conrelid = 'public.koen_session_changes'::regclass) then
    alter table public.koen_session_changes add constraint koen_session_changes_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_session_changes_session_id_fkey' and conrelid = 'public.koen_session_changes'::regclass) then
    alter table public.koen_session_changes add constraint koen_session_changes_session_id_fkey FOREIGN KEY (session_id) REFERENCES koen_sessions(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_sessions_koen_id_fkey' and conrelid = 'public.koen_sessions'::regclass) then
    alter table public.koen_sessions add constraint koen_sessions_koen_id_fkey FOREIGN KEY (koen_id) REFERENCES koen(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'koen_slots_koen_id_fkey' and conrelid = 'public.koen_slots'::regclass) then
    alter table public.koen_slots add constraint koen_slots_koen_id_fkey FOREIGN KEY (koen_id) REFERENCES koen(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_ng_dates_round_id_fkey' and conrelid = 'public.lesson_ng_dates'::regclass) then
    alter table public.lesson_ng_dates add constraint lesson_ng_dates_round_id_fkey FOREIGN KEY (round_id) REFERENCES lesson_rounds(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_ng_dates_user_id_fkey' and conrelid = 'public.lesson_ng_dates'::regclass) then
    alter table public.lesson_ng_dates add constraint lesson_ng_dates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_prefs_round_id_fkey' and conrelid = 'public.lesson_prefs'::regclass) then
    alter table public.lesson_prefs add constraint lesson_prefs_round_id_fkey FOREIGN KEY (round_id) REFERENCES lesson_rounds(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_prefs_user_id_fkey' and conrelid = 'public.lesson_prefs'::regclass) then
    alter table public.lesson_prefs add constraint lesson_prefs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_preset_targets_org_id_fkey' and conrelid = 'public.lesson_preset_targets'::regclass) then
    alter table public.lesson_preset_targets add constraint lesson_preset_targets_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_preset_targets_preset_id_fkey' and conrelid = 'public.lesson_preset_targets'::regclass) then
    alter table public.lesson_preset_targets add constraint lesson_preset_targets_preset_id_fkey FOREIGN KEY (preset_id) REFERENCES lesson_presets(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_preset_targets_teacher_id_fkey' and conrelid = 'public.lesson_preset_targets'::regclass) then
    alter table public.lesson_preset_targets add constraint lesson_preset_targets_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_presets_created_by_fkey' and conrelid = 'public.lesson_presets'::regclass) then
    alter table public.lesson_presets add constraint lesson_presets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_presets_org_id_fkey' and conrelid = 'public.lesson_presets'::regclass) then
    alter table public.lesson_presets add constraint lesson_presets_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_rounds_created_by_fkey' and conrelid = 'public.lesson_rounds'::regclass) then
    alter table public.lesson_rounds add constraint lesson_rounds_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_rounds_org_id_fkey' and conrelid = 'public.lesson_rounds'::regclass) then
    alter table public.lesson_rounds add constraint lesson_rounds_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lesson_rounds_teacher_id_fkey' and conrelid = 'public.lesson_rounds'::regclass) then
    alter table public.lesson_rounds add constraint lesson_rounds_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_attendance_by_fkey' and conrelid = 'public.lessons'::regclass) then
    alter table public.lessons add constraint lessons_attendance_by_fkey FOREIGN KEY (attendance_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_created_by_fkey' and conrelid = 'public.lessons'::regclass) then
    alter table public.lessons add constraint lessons_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_link_id_fkey' and conrelid = 'public.lessons'::regclass) then
    alter table public.lessons add constraint lessons_link_id_fkey FOREIGN KEY (link_id) REFERENCES teacher_student_links(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_org_id_fkey' and conrelid = 'public.lessons'::regclass) then
    alter table public.lessons add constraint lessons_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_place_id_fkey' and conrelid = 'public.lessons'::regclass) then
    alter table public.lessons add constraint lessons_place_id_fkey FOREIGN KEY (place_id) REFERENCES org_places(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_student_id_fkey' and conrelid = 'public.lessons'::regclass) then
    alter table public.lessons add constraint lessons_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_teacher_id_fkey' and conrelid = 'public.lessons'::regclass) then
    alter table public.lessons add constraint lessons_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'link_consents_student_id_fkey' and conrelid = 'public.link_consents'::regclass) then
    alter table public.link_consents add constraint link_consents_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'link_consents_teacher_id_fkey' and conrelid = 'public.link_consents'::regclass) then
    alter table public.link_consents add constraint link_consents_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_cuts_org_id_fkey' and conrelid = 'public.matching_cuts'::regclass) then
    alter table public.matching_cuts add constraint matching_cuts_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_cuts_target_user_id_fkey' and conrelid = 'public.matching_cuts'::regclass) then
    alter table public.matching_cuts add constraint matching_cuts_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_cuts_user_id_fkey' and conrelid = 'public.matching_cuts'::regclass) then
    alter table public.matching_cuts add constraint matching_cuts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_reports_org_id_fkey' and conrelid = 'public.matching_reports'::regclass) then
    alter table public.matching_reports add constraint matching_reports_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_reports_reporter_user_id_fkey' and conrelid = 'public.matching_reports'::regclass) then
    alter table public.matching_reports add constraint matching_reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'matching_reports_target_user_id_fkey' and conrelid = 'public.matching_reports'::regclass) then
    alter table public.matching_reports add constraint matching_reports_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_display_title_updated_by_fkey' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_display_title_updated_by_fkey FOREIGN KEY (display_title_updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_division_id_fkey' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_division_id_fkey FOREIGN KEY (division_id) REFERENCES org_divisions(id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_org_id_fkey' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_post_id_fkey' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_post_id_fkey FOREIGN KEY (post_id) REFERENCES org_posts(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_user_id_fkey' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'memberships_verified_by_fkey' and conrelid = 'public.memberships'::regclass) then
    alter table public.memberships add constraint memberships_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'minor_billing_consents_user_id_fkey' and conrelid = 'public.minor_billing_consents'::regclass) then
    alter table public.minor_billing_consents add constraint minor_billing_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'monka_read_log_org_id_fkey' and conrelid = 'public.monka_read_log'::regclass) then
    alter table public.monka_read_log add constraint monka_read_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'monka_read_log_post_id_fkey' and conrelid = 'public.monka_read_log'::regclass) then
    alter table public.monka_read_log add constraint monka_read_log_post_id_fkey FOREIGN KEY (post_id) REFERENCES org_posts(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'monka_read_log_target_monka_id_fkey' and conrelid = 'public.monka_read_log'::regclass) then
    alter table public.monka_read_log add constraint monka_read_log_target_monka_id_fkey FOREIGN KEY (target_monka_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'monka_read_log_viewer_user_id_fkey' and conrelid = 'public.monka_read_log'::regclass) then
    alter table public.monka_read_log add constraint monka_read_log_viewer_user_id_fkey FOREIGN KEY (viewer_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_periods_org_id_fkey' and conrelid = 'public.my_periods'::regclass) then
    alter table public.my_periods add constraint my_periods_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_periods_user_id_fkey' and conrelid = 'public.my_periods'::regclass) then
    alter table public.my_periods add constraint my_periods_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_timetable_period_id_fkey' and conrelid = 'public.my_timetable'::regclass) then
    alter table public.my_timetable add constraint my_timetable_period_id_fkey FOREIGN KEY (period_id) REFERENCES my_periods(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'my_timetable_user_id_fkey' and conrelid = 'public.my_timetable'::regclass) then
    alter table public.my_timetable add constraint my_timetable_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notes_user_id_fkey' and conrelid = 'public.notes'::regclass) then
    alter table public.notes add constraint notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notice_targets_batch_id_fkey' and conrelid = 'public.notice_targets'::regclass) then
    alter table public.notice_targets add constraint notice_targets_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES notice_batches(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notice_targets_user_id_fkey' and conrelid = 'public.notice_targets'::regclass) then
    alter table public.notice_targets add constraint notice_targets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ops_audit_log_actor_id_fkey' and conrelid = 'public.ops_audit_log'::regclass) then
    alter table public.ops_audit_log add constraint ops_audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_billing_atesaki_changed_by_fkey' and conrelid = 'public.org_billing'::regclass) then
    alter table public.org_billing add constraint org_billing_atesaki_changed_by_fkey FOREIGN KEY (atesaki_changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_billing_atesaki_user_id_fkey' and conrelid = 'public.org_billing'::regclass) then
    alter table public.org_billing add constraint org_billing_atesaki_user_id_fkey FOREIGN KEY (atesaki_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_billing_org_id_fkey' and conrelid = 'public.org_billing'::regclass) then
    alter table public.org_billing add constraint org_billing_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_billing_log_actor_id_fkey' and conrelid = 'public.org_billing_log'::regclass) then
    alter table public.org_billing_log add constraint org_billing_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_billing_log_org_id_fkey' and conrelid = 'public.org_billing_log'::regclass) then
    alter table public.org_billing_log add constraint org_billing_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_contracts_org_id_fkey' and conrelid = 'public.org_contracts'::regclass) then
    alter table public.org_contracts add constraint org_contracts_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_divisions_org_id_fkey' and conrelid = 'public.org_divisions'::regclass) then
    alter table public.org_divisions add constraint org_divisions_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_divisions_parent_id_fkey' and conrelid = 'public.org_divisions'::regclass) then
    alter table public.org_divisions add constraint org_divisions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES org_divisions(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_event_participants_org_event_id_fkey' and conrelid = 'public.org_event_participants'::regclass) then
    alter table public.org_event_participants add constraint org_event_participants_org_event_id_fkey FOREIGN KEY (org_event_id) REFERENCES org_events(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_event_participants_user_id_fkey' and conrelid = 'public.org_event_participants'::regclass) then
    alter table public.org_event_participants add constraint org_event_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_events_created_by_fkey' and conrelid = 'public.org_events'::regclass) then
    alter table public.org_events add constraint org_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_events_org_id_fkey' and conrelid = 'public.org_events'::regclass) then
    alter table public.org_events add constraint org_events_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_invitations_invited_by_fkey' and conrelid = 'public.org_invitations'::regclass) then
    alter table public.org_invitations add constraint org_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_invitations_org_id_fkey' and conrelid = 'public.org_invitations'::regclass) then
    alter table public.org_invitations add constraint org_invitations_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_invitations_used_by_fkey' and conrelid = 'public.org_invitations'::regclass) then
    alter table public.org_invitations add constraint org_invitations_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_message_drafts_author_id_fkey' and conrelid = 'public.org_message_drafts'::regclass) then
    alter table public.org_message_drafts add constraint org_message_drafts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_message_drafts_org_id_fkey' and conrelid = 'public.org_message_drafts'::regclass) then
    alter table public.org_message_drafts add constraint org_message_drafts_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_message_drafts_teacher_id_fkey' and conrelid = 'public.org_message_drafts'::regclass) then
    alter table public.org_message_drafts add constraint org_message_drafts_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_message_reads_org_id_fkey' and conrelid = 'public.org_message_reads'::regclass) then
    alter table public.org_message_reads add constraint org_message_reads_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_message_reads_reader_id_fkey' and conrelid = 'public.org_message_reads'::regclass) then
    alter table public.org_message_reads add constraint org_message_reads_reader_id_fkey FOREIGN KEY (reader_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_message_reads_teacher_id_fkey' and conrelid = 'public.org_message_reads'::regclass) then
    alter table public.org_message_reads add constraint org_message_reads_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_messages_author_id_fkey' and conrelid = 'public.org_messages'::regclass) then
    alter table public.org_messages add constraint org_messages_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_messages_org_id_fkey' and conrelid = 'public.org_messages'::regclass) then
    alter table public.org_messages add constraint org_messages_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_messages_teacher_id_fkey' and conrelid = 'public.org_messages'::regclass) then
    alter table public.org_messages add constraint org_messages_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_periods_org_id_fkey' and conrelid = 'public.org_periods'::regclass) then
    alter table public.org_periods add constraint org_periods_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_places_org_id_fkey' and conrelid = 'public.org_places'::regclass) then
    alter table public.org_places add constraint org_places_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'org_posts_org_id_fkey' and conrelid = 'public.org_posts'::regclass) then
    alter table public.org_posts add constraint org_posts_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'organizations_contract_owner_user_id_fkey' and conrelid = 'public.organizations'::regclass) then
    alter table public.organizations add constraint organizations_contract_owner_user_id_fkey FOREIGN KEY (contract_owner_user_id) REFERENCES auth.users(id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'organizations_created_by_fkey' and conrelid = 'public.organizations'::regclass) then
    alter table public.organizations add constraint organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'overlap_notices_lesson_id_fkey' and conrelid = 'public.overlap_notices'::regclass) then
    alter table public.overlap_notices add constraint overlap_notices_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'page_inquiries_owner_user_id_fkey' and conrelid = 'public.page_inquiries'::regclass) then
    alter table public.page_inquiries add constraint page_inquiries_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'page_types_owned_user_id_fkey' and conrelid = 'public.page_types_owned'::regclass) then
    alter table public.page_types_owned add constraint page_types_owned_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'performance_results_performance_id_fkey' and conrelid = 'public.performance_results'::regclass) then
    alter table public.performance_results add constraint performance_results_performance_id_fkey FOREIGN KEY (performance_id) REFERENCES performances(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'performance_results_user_id_fkey' and conrelid = 'public.performance_results'::regclass) then
    alter table public.performance_results add constraint performance_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'performances_user_id_fkey' and conrelid = 'public.performances'::regclass) then
    alter table public.performances add constraint performances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'period_markers_user_id_fkey' and conrelid = 'public.period_markers'::regclass) then
    alter table public.period_markers add constraint period_markers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_entries_user_id_fkey' and conrelid = 'public.portfolio_entries'::regclass) then
    alter table public.portfolio_entries add constraint portfolio_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_recordings_user_id_fkey' and conrelid = 'public.portfolio_recordings'::regclass) then
    alter table public.portfolio_recordings add constraint portfolio_recordings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolios_user_id_fkey' and conrelid = 'public.portfolios'::regclass) then
    alter table public.portfolios add constraint portfolios_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'post_change_log_changed_by_fkey' and conrelid = 'public.post_change_log'::regclass) then
    alter table public.post_change_log add constraint post_change_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'post_change_log_org_id_fkey' and conrelid = 'public.post_change_log'::regclass) then
    alter table public.post_change_log add constraint post_change_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'post_change_log_target_user_id_fkey' and conrelid = 'public.post_change_log'::regclass) then
    alter table public.post_change_log add constraint post_change_log_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'postings_org_id_fkey' and conrelid = 'public.postings'::regclass) then
    alter table public.postings add constraint postings_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'postings_owner_user_id_fkey' and conrelid = 'public.postings'::regclass) then
    alter table public.postings add constraint postings_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_id_fkey' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'project_master_user_id_fkey' and conrelid = 'public.project_master'::regclass) then
    alter table public.project_master add constraint project_master_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'purchases_user_id_fkey' and conrelid = 'public.purchases'::regclass) then
    alter table public.purchases add constraint purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'questionnaire_responses_user_id_fkey' and conrelid = 'public.questionnaire_responses'::regclass) then
    alter table public.questionnaire_responses add constraint questionnaire_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'recovery_codes_user_id_fkey' and conrelid = 'public.recovery_codes'::regclass) then
    alter table public.recovery_codes add constraint recovery_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'repertoire_tessitura_user_id_fkey' and conrelid = 'public.repertoire_tessitura'::regclass) then
    alter table public.repertoire_tessitura add constraint repertoire_tessitura_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'role_master_user_id_fkey' and conrelid = 'public.role_master'::regclass) then
    alter table public.role_master add constraint role_master_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'roster_drafts_division_id_fkey' and conrelid = 'public.roster_drafts'::regclass) then
    alter table public.roster_drafts add constraint roster_drafts_division_id_fkey FOREIGN KEY (division_id) REFERENCES org_divisions(id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'roster_drafts_imported_by_fkey' and conrelid = 'public.roster_drafts'::regclass) then
    alter table public.roster_drafts add constraint roster_drafts_imported_by_fkey FOREIGN KEY (imported_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'roster_drafts_linked_user_id_fkey' and conrelid = 'public.roster_drafts'::regclass) then
    alter table public.roster_drafts add constraint roster_drafts_linked_user_id_fkey FOREIGN KEY (linked_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'roster_drafts_org_id_fkey' and conrelid = 'public.roster_drafts'::regclass) then
    alter table public.roster_drafts add constraint roster_drafts_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'score_log_editor_user_id_fkey' and conrelid = 'public.score_log'::regclass) then
    alter table public.score_log add constraint score_log_editor_user_id_fkey FOREIGN KEY (editor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'score_log_org_id_fkey' and conrelid = 'public.score_log'::regclass) then
    alter table public.score_log add constraint score_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'student_price_consents_user_id_fkey' and conrelid = 'public.student_price_consents'::regclass) then
    alter table public.student_price_consents add constraint student_price_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subscription_items_user_id_fkey' and conrelid = 'public.subscription_items'::regclass) then
    alter table public.subscription_items add constraint subscription_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_user_id_fkey' and conrelid = 'public.subscriptions'::regclass) then
    alter table public.subscriptions add constraint subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_invitations_division_id_fkey' and conrelid = 'public.teacher_invitations'::regclass) then
    alter table public.teacher_invitations add constraint teacher_invitations_division_id_fkey FOREIGN KEY (division_id) REFERENCES org_divisions(id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_invitations_draft_id_fkey' and conrelid = 'public.teacher_invitations'::regclass) then
    alter table public.teacher_invitations add constraint teacher_invitations_draft_id_fkey FOREIGN KEY (draft_id) REFERENCES roster_drafts(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_invitations_monka_teacher_id_fkey' and conrelid = 'public.teacher_invitations'::regclass) then
    alter table public.teacher_invitations add constraint teacher_invitations_monka_teacher_id_fkey FOREIGN KEY (monka_teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_invitations_org_id_fkey' and conrelid = 'public.teacher_invitations'::regclass) then
    alter table public.teacher_invitations add constraint teacher_invitations_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_invitations_target_user_id_fkey' and conrelid = 'public.teacher_invitations'::regclass) then
    alter table public.teacher_invitations add constraint teacher_invitations_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_invitations_teacher_id_fkey' and conrelid = 'public.teacher_invitations'::regclass) then
    alter table public.teacher_invitations add constraint teacher_invitations_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_invitations_used_by_student_id_fkey' and conrelid = 'public.teacher_invitations'::regclass) then
    alter table public.teacher_invitations add constraint teacher_invitations_used_by_student_id_fkey FOREIGN KEY (used_by_student_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_notes_link_id_fkey' and conrelid = 'public.teacher_notes'::regclass) then
    alter table public.teacher_notes add constraint teacher_notes_link_id_fkey FOREIGN KEY (link_id) REFERENCES teacher_student_links(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_student_links_student_id_fkey' and conrelid = 'public.teacher_student_links'::regclass) then
    alter table public.teacher_student_links add constraint teacher_student_links_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_student_links_student_profile_fkey' and conrelid = 'public.teacher_student_links'::regclass) then
    alter table public.teacher_student_links add constraint teacher_student_links_student_profile_fkey FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'teacher_student_links_teacher_id_fkey' and conrelid = 'public.teacher_student_links'::regclass) then
    alter table public.teacher_student_links add constraint teacher_student_links_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'timetable_nudges_org_id_fkey' and conrelid = 'public.timetable_nudges'::regclass) then
    alter table public.timetable_nudges add constraint timetable_nudges_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'timetable_nudges_sent_by_fkey' and conrelid = 'public.timetable_nudges'::regclass) then
    alter table public.timetable_nudges add constraint timetable_nudges_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'timetable_nudges_student_id_fkey' and conrelid = 'public.timetable_nudges'::regclass) then
    alter table public.timetable_nudges add constraint timetable_nudges_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'user_notices_user_id_fkey' and conrelid = 'public.user_notices'::regclass) then
    alter table public.user_notices add constraint user_notices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;

