-- ★本番の 形を、★試しの 台帳へ 写します（★2026-09-20・D115）。
-- ★★人の 記録は 1行も ありません。★形 だけ です。
-- ★足す 表 26 ／ ★足す 読み道 30

-- ── app_secrets ──
create table if not exists public.app_secrets (
  name text not null,
  value text not null,
  updated_at timestamp with time zone not null default now()
);
alter table public.app_secrets enable row level security;
revoke all on table public.app_secrets from public, anon, authenticated;
alter table public.app_secrets add constraint app_secrets_pkey PRIMARY KEY (name);

-- ── code_attempts ──
create table if not exists public.code_attempts (
  id uuid not null default gen_random_uuid(),
  code_hash text not null,
  ip_hash text,
  at timestamp with time zone not null default now()
);
alter table public.code_attempts enable row level security;
revoke all on table public.code_attempts from public, anon, authenticated;
alter table public.code_attempts add constraint code_attempts_pkey PRIMARY KEY (id);

-- ── evaluation_items ──
create table if not exists public.evaluation_items (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  event_id uuid,
  name text not null,
  max_points numeric(5,2) not null,
  step numeric(3,2) not null default 1,
  note text,
  in_use boolean not null default true,
  ord integer not null default 0,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
alter table public.evaluation_items enable row level security;
revoke all on table public.evaluation_items from public, anon, authenticated;
alter table public.evaluation_items add constraint evaluation_items_pkey PRIMARY KEY (id);
alter table public.evaluation_items add constraint evaluation_items_max_check CHECK (((max_points > (0)::numeric) AND (max_points <= (1000)::numeric)));
alter table public.evaluation_items add constraint evaluation_items_step_check CHECK ((step = ANY (ARRAY[0.5, (1)::numeric])));
grant delete, insert, select, update on table public.evaluation_items to authenticated;
create policy evaluation_items_select on public.evaluation_items for select using ((EXISTS ( SELECT 1    FROM memberships m   WHERE ((m.org_id = evaluation_items.org_id) AND (m.user_id = auth.uid())))));
create policy evaluation_items_write on public.evaluation_items for all using (has_can(org_id, 'saiten'::text)) with check (has_can(org_id, 'saiten'::text));

-- ── evaluation_judge_done ──
create table if not exists public.evaluation_judge_done (
  org_id uuid not null,
  event_id uuid not null,
  judge_id uuid not null,
  done_at timestamp with time zone not null default now()
);
alter table public.evaluation_judge_done enable row level security;
revoke all on table public.evaluation_judge_done from public, anon, authenticated;
alter table public.evaluation_judge_done add constraint evaluation_judge_done_pkey PRIMARY KEY (event_id, judge_id);
grant delete, insert, select on table public.evaluation_judge_done to authenticated;
create policy evaluation_judge_done_own on public.evaluation_judge_done for all using ((judge_id = auth.uid())) with check ((judge_id = auth.uid()));

-- ── evaluation_reviews ──
create table if not exists public.evaluation_reviews (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  event_id uuid,
  student_id uuid not null,
  judge_id uuid not null,
  body text not null default ''::text,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
alter table public.evaluation_reviews enable row level security;
revoke all on table public.evaluation_reviews from public, anon, authenticated;
alter table public.evaluation_reviews add constraint evaluation_reviews_event_id_student_id_judge_id_key UNIQUE (event_id, student_id, judge_id);
alter table public.evaluation_reviews add constraint evaluation_reviews_pkey PRIMARY KEY (id);
grant insert, select, update on table public.evaluation_reviews to authenticated;
create policy evaluation_reviews_select on public.evaluation_reviews for select using ((has_can(org_id, 'saiten'::text) OR (judge_id = auth.uid()) OR ((EXISTS ( SELECT 1    FROM evaluation_judge_done d   WHERE ((d.event_id = evaluation_reviews.event_id) AND (d.judge_id = auth.uid())))) AND (EXISTS ( SELECT 1    FROM assignments a   WHERE ((a.org_id = evaluation_reviews.org_id) AND (a.teacher_id = auth.uid()) AND (a.ended_at IS NULL))))) OR ((student_id = auth.uid()) AND (confirmed_at IS NOT NULL))));
create policy evaluation_reviews_write on public.evaluation_reviews for all using ((judge_id = auth.uid())) with check ((judge_id = auth.uid()));

-- ── evaluation_scores ──
create table if not exists public.evaluation_scores (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  event_id uuid,
  student_id uuid not null,
  item_id uuid not null,
  judge_id uuid not null,
  points numeric(5,2),
  confirmed_at timestamp with time zone,
  entered_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
alter table public.evaluation_scores enable row level security;
revoke all on table public.evaluation_scores from public, anon, authenticated;
alter table public.evaluation_scores add constraint evaluation_scores_event_id_student_id_item_id_judge_id_key UNIQUE (event_id, student_id, item_id, judge_id);
alter table public.evaluation_scores add constraint evaluation_scores_pkey PRIMARY KEY (id);
grant insert, select, update on table public.evaluation_scores to authenticated;
create policy evaluation_scores_select on public.evaluation_scores for select using ((has_can(org_id, 'saiten'::text) OR (judge_id = auth.uid()) OR ((EXISTS ( SELECT 1    FROM evaluation_judge_done d   WHERE ((d.event_id = evaluation_scores.event_id) AND (d.judge_id = auth.uid())))) AND (EXISTS ( SELECT 1    FROM assignments a   WHERE ((a.org_id = evaluation_scores.org_id) AND (a.teacher_id = auth.uid()) AND (a.ended_at IS NULL))))) OR ((student_id = auth.uid()) AND (confirmed_at IS NOT NULL))));
create policy evaluation_scores_write on public.evaluation_scores for all using ((judge_id = auth.uid())) with check ((judge_id = auth.uid()));

-- ── export_log ──
create table if not exists public.export_log (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid not null,
  what text not null,
  rows integer not null default 0,
  created_at timestamp with time zone not null default now()
);
alter table public.export_log enable row level security;
revoke all on table public.export_log from public, anon, authenticated;
alter table public.export_log add constraint export_log_pkey PRIMARY KEY (id);
grant insert, select on table public.export_log to authenticated;
create policy export_log_insert on public.export_log for insert with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1    FROM memberships m   WHERE ((m.org_id = export_log.org_id) AND (m.user_id = auth.uid()))))));
create policy export_log_select on public.export_log for select using (((user_id = auth.uid()) OR has_can(org_id, 'master'::text)));

-- ── guardian_consents ──
create table if not exists public.guardian_consents (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  org_id uuid not null,
  teacher_id uuid,
  guardian_email text not null,
  token text not null,
  sent_at timestamp with time zone not null default now(),
  consented_at timestamp with time zone,
  expires_at timestamp with time zone not null default (now() + '7 days'::interval),
  withdrawn_at timestamp with time zone
);
alter table public.guardian_consents enable row level security;
revoke all on table public.guardian_consents from public, anon, authenticated;
alter table public.guardian_consents add constraint guardian_consents_token_key UNIQUE (token);
alter table public.guardian_consents add constraint guardian_consents_pkey PRIMARY KEY (id);
grant select on table public.guardian_consents to authenticated;
create policy guardian_consents_select_own on public.guardian_consents for select using ((auth.uid() = user_id));

-- ── lesson_preset_targets ──
create table if not exists public.lesson_preset_targets (
  preset_id uuid not null,
  teacher_id uuid not null,
  org_id uuid not null,
  created_at timestamp with time zone not null default now()
);
alter table public.lesson_preset_targets enable row level security;
revoke all on table public.lesson_preset_targets from public, anon, authenticated;
alter table public.lesson_preset_targets add constraint lesson_preset_targets_pkey PRIMARY KEY (preset_id, teacher_id);
grant delete, insert, select, update on table public.lesson_preset_targets to authenticated;
create policy lesson_preset_targets_select on public.lesson_preset_targets for select using ((has_can(org_id, 'meibo'::text) OR has_can(org_id, 'monka_write'::text)));
create policy lesson_preset_targets_write on public.lesson_preset_targets for all using (has_can(org_id, 'meibo'::text)) with check (has_can(org_id, 'meibo'::text));

-- ── lesson_presets ──
create table if not exists public.lesson_presets (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  total_count integer not null,
  note text,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  need_count integer
);
alter table public.lesson_presets enable row level security;
revoke all on table public.lesson_presets from public, anon, authenticated;
alter table public.lesson_presets add constraint lesson_presets_pkey PRIMARY KEY (id);
alter table public.lesson_presets add constraint lesson_presets_need_count_check CHECK (((need_count IS NULL) OR ((need_count > 0) AND (need_count <= total_count))));
alter table public.lesson_presets add constraint lesson_presets_total_count_check CHECK (((total_count > 0) AND (total_count <= 400)));
grant delete, insert, select, update on table public.lesson_presets to authenticated;
create policy lesson_presets_select on public.lesson_presets for select using ((has_can(org_id, 'meibo'::text) OR has_can(org_id, 'monka_write'::text)));
create policy lesson_presets_write on public.lesson_presets for all using (has_can(org_id, 'meibo'::text)) with check (has_can(org_id, 'meibo'::text));

-- ── monka_read_log ──
create table if not exists public.monka_read_log (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  viewer_user_id uuid not null,
  target_monka_id uuid not null,
  viewed_at timestamp with time zone not null default now(),
  reason text not null
);
alter table public.monka_read_log enable row level security;
revoke all on table public.monka_read_log from public, anon, authenticated;
alter table public.monka_read_log add constraint monka_read_log_pkey PRIMARY KEY (id);
alter table public.monka_read_log add constraint monka_read_log_reason_not_blank CHECK ((char_length(btrim(reason)) >= 4));
grant insert, select on table public.monka_read_log to authenticated;
create policy monka_read_log_insert_self_monka_read on public.monka_read_log for insert with check (((viewer_user_id = auth.uid()) AND has_can(org_id, 'monka_read'::text)));
create policy monka_read_log_select_master_or_self on public.monka_read_log for select using (((viewer_user_id = auth.uid()) OR has_can(org_id, 'master'::text)));

-- ── org_billing ──
create table if not exists public.org_billing (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  atesaki_name text,
  atesaki_email text,
  atesaki_user_id uuid,
  atesaki_changed_at timestamp with time zone,
  atesaki_changed_by uuid,
  stripe_customer_id text,
  method text,
  next_billing_date date,
  created_at timestamp with time zone not null default now(),
  invoice_no text,
  invoice_issuer text,
  bill_dept text,
  bill_contact text
);
alter table public.org_billing enable row level security;
revoke all on table public.org_billing from public, anon, authenticated;
alter table public.org_billing add constraint org_billing_pkey PRIMARY KEY (id);
alter table public.org_billing add constraint org_billing_method_check CHECK (((method IS NULL) OR (method = ANY (ARRAY['card'::text, 'invoice'::text]))));
grant insert, select, update on table public.org_billing to authenticated;
create policy org_billing_insert_bill on public.org_billing for insert with check (has_can(org_id, 'bill_pay'::text));
create policy org_billing_select_bill on public.org_billing for select using (has_can(org_id, 'bill'::text));
create policy org_billing_update_bill on public.org_billing for update using (has_can(org_id, 'bill_pay'::text)) with check (has_can(org_id, 'bill_pay'::text));

-- ── org_billing_log ──
create table if not exists public.org_billing_log (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  actor_id uuid,
  what text not null,
  created_at timestamp with time zone not null default now()
);
alter table public.org_billing_log enable row level security;
revoke all on table public.org_billing_log from public, anon, authenticated;
alter table public.org_billing_log add constraint org_billing_log_pkey PRIMARY KEY (id);
grant insert, select on table public.org_billing_log to authenticated;
create policy org_billing_log_insert on public.org_billing_log for insert with check ((has_can(org_id, 'bill_pay'::text) AND (actor_id = auth.uid())));
create policy org_billing_log_select on public.org_billing_log for select using (has_can(org_id, 'bill'::text));

-- ── org_divisions ──
create table if not exists public.org_divisions (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  kind text not null,
  name text not null,
  parent_id uuid,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now()
);
alter table public.org_divisions enable row level security;
revoke all on table public.org_divisions from public, anon, authenticated;
alter table public.org_divisions add constraint org_divisions_pkey PRIMARY KEY (id);
alter table public.org_divisions add constraint org_divisions_kind_check CHECK ((kind = ANY (ARRAY['faculty'::text, 'department'::text, 'field'::text])));
grant delete, insert, select, update on table public.org_divisions to authenticated;
create policy org_divisions_select on public.org_divisions for select using ((has_can(org_id, 'meibo'::text) OR (EXISTS ( SELECT 1    FROM enrollments e   WHERE ((e.org_id = org_divisions.org_id) AND (e.student_id = auth.uid()) AND (e.status = 'active'::text))))));
create policy org_divisions_write on public.org_divisions for all using (has_can(org_id, 'meibo'::text)) with check (has_can(org_id, 'meibo'::text));

-- ── org_message_drafts ──
create table if not exists public.org_message_drafts (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  author_id uuid not null,
  teacher_id uuid,
  title text,
  body text not null default ''::text,
  target_division_ids uuid[] not null default '{}'::uuid[],
  target_grade_years integer[] not null default '{}'::integer[],
  target_user_ids uuid[] not null default '{}'::uuid[],
  kind text not null default 'draft'::text,
  fail_reason text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
alter table public.org_message_drafts enable row level security;
revoke all on table public.org_message_drafts from public, anon, authenticated;
alter table public.org_message_drafts add constraint org_message_drafts_pkey PRIMARY KEY (id);
alter table public.org_message_drafts add constraint org_message_drafts_kind_check CHECK ((kind = ANY (ARRAY['draft'::text, 'failed'::text])));
grant delete, insert, references, select, trigger, truncate, update on table public.org_message_drafts to authenticated;
create policy org_message_drafts_own on public.org_message_drafts for all using ((auth.uid() = author_id)) with check ((auth.uid() = author_id));

-- ── org_periods ──
create table if not exists public.org_periods (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  ord smallint not null,
  name text not null,
  start_min smallint not null,
  end_min smallint not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
alter table public.org_periods enable row level security;
revoke all on table public.org_periods from public, anon, authenticated;
alter table public.org_periods add constraint org_periods_org_id_ord_key UNIQUE (org_id, ord);
alter table public.org_periods add constraint org_periods_pkey PRIMARY KEY (id);
alter table public.org_periods add constraint org_periods_time_check CHECK (((start_min >= 0) AND (end_min > start_min) AND (end_min <= 1440)));
grant delete, insert, select, update on table public.org_periods to authenticated;
create policy org_periods_select on public.org_periods for select using ((EXISTS ( SELECT 1    FROM memberships m   WHERE ((m.org_id = org_periods.org_id) AND (m.user_id = auth.uid())))));
create policy org_periods_write on public.org_periods for all using (has_can(org_id, 'koma'::text)) with check (has_can(org_id, 'koma'::text));

-- ── org_places ──
create table if not exists public.org_places (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  ord smallint not null default 0,
  created_at timestamp with time zone not null default now()
);
alter table public.org_places enable row level security;
revoke all on table public.org_places from public, anon, authenticated;
alter table public.org_places add constraint org_places_org_id_name_key UNIQUE (org_id, name);
alter table public.org_places add constraint org_places_pkey PRIMARY KEY (id);
grant delete, insert, select, update on table public.org_places to authenticated;
create policy org_places_select on public.org_places for select using ((EXISTS ( SELECT 1    FROM memberships m   WHERE ((m.org_id = org_places.org_id) AND (m.user_id = auth.uid())))));
create policy org_places_write on public.org_places for all using (has_can(org_id, 'koma'::text)) with check (has_can(org_id, 'koma'::text));

-- ── overlap_notices ──
create table if not exists public.overlap_notices (
  lesson_id uuid not null,
  status text not null default 'まだ'::text,
  updated_at timestamp with time zone not null default now()
);
alter table public.overlap_notices enable row level security;
revoke all on table public.overlap_notices from public, anon, authenticated;
alter table public.overlap_notices add constraint overlap_notices_pkey PRIMARY KEY (lesson_id);
alter table public.overlap_notices add constraint overlap_notices_status_check CHECK ((status = ANY (ARRAY['まだ'::text, '知らせた'::text, '解決'::text])));
grant delete, insert, select, update on table public.overlap_notices to authenticated;
create policy overlap_notices_select on public.overlap_notices for select using ((EXISTS ( SELECT 1    FROM lessons l   WHERE ((l.id = overlap_notices.lesson_id) AND ((l.teacher_id = auth.uid()) OR has_can(l.org_id, 'sched_all'::text))))));
create policy overlap_notices_write on public.overlap_notices for all using ((EXISTS ( SELECT 1    FROM lessons l   WHERE ((l.id = overlap_notices.lesson_id) AND ((l.teacher_id = auth.uid()) OR has_can(l.org_id, 'sched_all'::text)))))) with check ((EXISTS ( SELECT 1    FROM lessons l   WHERE ((l.id = overlap_notices.lesson_id) AND ((l.teacher_id = auth.uid()) OR has_can(l.org_id, 'sched_all'::text))))));

-- ── payment_records ──
create table if not exists public.payment_records (
  id uuid not null default gen_random_uuid(),
  kind text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_session_id text,
  stripe_payment_intent text,
  stripe_price_id text,
  plan text,
  status text,
  amount_yen integer,
  started_at timestamp with time zone,
  ends_at timestamp with time zone,
  current_period_end timestamp with time zone,
  cancelled_at timestamp with time zone,
  severed_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);
alter table public.payment_records enable row level security;
revoke all on table public.payment_records from public, anon, authenticated;
alter table public.payment_records add constraint payment_records_pkey PRIMARY KEY (id);

-- ── portfolio_entries ──
create table if not exists public.portfolio_entries (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  title text not null,
  detail text,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now()
);
alter table public.portfolio_entries enable row level security;
revoke all on table public.portfolio_entries from public, anon, authenticated;
alter table public.portfolio_entries add constraint portfolio_entries_pkey PRIMARY KEY (id);
alter table public.portfolio_entries add constraint portfolio_entries_kind_check CHECK ((kind = ANY (ARRAY['school'::text, 'award'::text, 'teacher'::text])));
grant delete, insert, select, update on table public.portfolio_entries to authenticated;
create policy portfolio_entries_own on public.portfolio_entries for all using ((user_id = auth.uid())) with check ((user_id = auth.uid()));

-- ── portfolio_recordings ──
create table if not exists public.portfolio_recordings (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  url text not null,
  detail text,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now()
);
alter table public.portfolio_recordings enable row level security;
revoke all on table public.portfolio_recordings from public, anon, authenticated;
alter table public.portfolio_recordings add constraint portfolio_recordings_pkey PRIMARY KEY (id);
alter table public.portfolio_recordings add constraint portfolio_recordings_url_check CHECK ((url ~ '^https://[^\s]+$'::text));
grant delete, insert, select, update on table public.portfolio_recordings to authenticated;
create policy portfolio_recordings_own on public.portfolio_recordings for all using ((user_id = auth.uid())) with check ((user_id = auth.uid()));

-- ── portfolios ──
create table if not exists public.portfolios (
  user_id uuid not null,
  display_name text,
  instrument text,
  bio text,
  regions text[] not null default '{}'::text[],
  visibility text not null default 'self'::text,
  public_slug text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
alter table public.portfolios enable row level security;
revoke all on table public.portfolios from public, anon, authenticated;
alter table public.portfolios add constraint portfolios_public_slug_key UNIQUE (public_slug);
alter table public.portfolios add constraint portfolios_pkey PRIMARY KEY (user_id);
alter table public.portfolios add constraint portfolios_visibility_check CHECK ((visibility = ANY (ARRAY['self'::text, 'school'::text, 'link'::text])));
grant delete, insert, select, update on table public.portfolios to authenticated;
create policy portfolios_own on public.portfolios for all using ((user_id = auth.uid())) with check ((user_id = auth.uid()));

-- ── post_change_log ──
create table if not exists public.post_change_log (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  target_user_id uuid not null,
  from_post_id uuid,
  from_post_name text,
  to_post_id uuid,
  to_post_name text,
  changed_at timestamp with time zone not null default now(),
  changed_by uuid not null
);
alter table public.post_change_log enable row level security;
revoke all on table public.post_change_log from public, anon, authenticated;
alter table public.post_change_log add constraint post_change_log_pkey PRIMARY KEY (id);
grant insert, select on table public.post_change_log to authenticated;
create policy post_change_log_insert on public.post_change_log for insert with check (((changed_by = auth.uid()) AND has_can(org_id, 'post'::text)));
create policy post_change_log_select on public.post_change_log for select using (((target_user_id = auth.uid()) OR has_can(org_id, 'post'::text)));

-- ── roster_drafts ──
create table if not exists public.roster_drafts (
  id uuid not null default gen_random_uuid(),
  org_id uuid not null,
  student_number text not null,
  name text not null,
  grade_year integer,
  division_id uuid,
  email text,
  imported_at timestamp with time zone not null default now(),
  imported_by uuid not null,
  invited_at timestamp with time zone,
  linked_user_id uuid,
  linked_at timestamp with time zone
);
alter table public.roster_drafts enable row level security;
revoke all on table public.roster_drafts from public, anon, authenticated;
alter table public.roster_drafts add constraint roster_drafts_org_id_student_number_key UNIQUE (org_id, student_number);
alter table public.roster_drafts add constraint roster_drafts_pkey PRIMARY KEY (id);
grant delete, insert, select, update on table public.roster_drafts to authenticated;
create policy roster_drafts_all on public.roster_drafts for all using (has_can(org_id, 'meibo'::text)) with check (has_can(org_id, 'meibo'::text));

-- ── score_log ──
create table if not exists public.score_log (
  id uuid not null default gen_random_uuid(),
  score_id uuid not null,
  org_id uuid not null,
  editor_user_id uuid not null,
  before_value numeric(5,2),
  after_value numeric(5,2),
  reason text,
  edited_at timestamp with time zone not null default now()
);
alter table public.score_log enable row level security;
revoke all on table public.score_log from public, anon, authenticated;
alter table public.score_log add constraint score_log_pkey PRIMARY KEY (id);
grant select on table public.score_log to authenticated;
create policy score_log_select on public.score_log for select using (has_can(org_id, 'saiten'::text));

-- ── timetable_nudges ──
create table if not exists public.timetable_nudges (
  org_id uuid not null,
  student_id uuid not null,
  sent_by uuid,
  sent_at timestamp with time zone not null default now()
);
alter table public.timetable_nudges enable row level security;
revoke all on table public.timetable_nudges from public, anon, authenticated;
alter table public.timetable_nudges add constraint timetable_nudges_pkey PRIMARY KEY (org_id, student_id);
grant select on table public.timetable_nudges to authenticated;
create policy timetable_nudges_select on public.timetable_nudges for select using (has_can(org_id, 'meibo'::text));

-- ── ★列を 足す … enrollments ──
alter table public.enrollments add column if not exists grade_year integer;
alter table public.enrollments add column if not exists division_id uuid;
alter table public.enrollments add column if not exists student_number text;

-- ── ★列を 足す … lessons ──
alter table public.lessons add column if not exists place_id uuid;
alter table public.lessons add column if not exists kind text;

-- ── ★列を 足す … memberships ──
alter table public.memberships add column if not exists division_id uuid;
alter table public.memberships add column if not exists verified_at timestamp with time zone;
alter table public.memberships add column if not exists verified_by uuid;

-- ── ★列を 足す … org_events ──
alter table public.org_events add column if not exists place text;
alter table public.org_events add column if not exists target_grades text[] default '{}'::text[];
alter table public.org_events add column if not exists target_courses text[] default '{}'::text[];

-- ── ★列を 足す … org_messages ──
alter table public.org_messages add column if not exists title text;
alter table public.org_messages add column if not exists target_division_ids uuid[] default '{}'::uuid[];
alter table public.org_messages add column if not exists target_grade_years integer[] default '{}'::integer[];
alter table public.org_messages add column if not exists target_user_ids uuid[] default '{}'::uuid[];

-- ── ★列を 足す … profiles ──
alter table public.profiles add column if not exists kana text;

-- ── ★列を 足す … teacher_invitations ──
alter table public.teacher_invitations add column if not exists monka_teacher_id uuid;
alter table public.teacher_invitations add column if not exists grade_year integer;
alter table public.teacher_invitations add column if not exists division_id uuid;
alter table public.teacher_invitations add column if not exists target_user_id uuid;
alter table public.teacher_invitations add column if not exists invited_at timestamp with time zone;
alter table public.teacher_invitations add column if not exists kind text default 'open'::text;
alter table public.teacher_invitations add column if not exists draft_id uuid;

-- ── ★読み道（1回目）──
CREATE OR REPLACE FUNCTION public.accept_guardian_consent(p_token text)
 RETURNS TABLE(ok boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
begin
  select g.id into v_id
  from public.guardian_consents g
  where g.token = p_token
    and g.consented_at is null
    and g.withdrawn_at is null
    and g.expires_at > now()
  limit 1;

  if v_id is null then
    -- ★★★無い ときと、★切れた ときと、★済んだ ときを 分けません。
    --   ★★分けると、★合言葉を 総当たりして 中が 分かります（★裁定 その77）。
    return query select false;
    return;
  end if;

  update public.guardian_consents
  set consented_at = now()
  where id = v_id;

  return query select true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_entry_stats(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when not exists (
      select 1 from public.profiles
       where id = p_user_id and is_admin is true
    ) then null
    else jsonb_build_object(
      'total', (select count(*) from public.entries),
      'per_user', coalesce((
        select jsonb_agg(jsonb_build_object('user_id', e.user_id, 'n', e.n))
        from (select user_id, count(*) as n from public.entries group by user_id) e
      ), '[]'::jsonb),
      'fill', (
        select jsonb_build_object(
          'weight_kg',
            count(*) filter (where jsonb_typeof(to_jsonb(weight_kg)) = 'number'),
          'body_fat_pct',
            count(*) filter (where jsonb_typeof(to_jsonb(body_fat_pct)) = 'number'),
          'meals',
            count(*) filter (where jsonb_typeof(to_jsonb(meals)) = 'array'
                               and jsonb_array_length(to_jsonb(meals)) > 0),
          'exercises',
            count(*) filter (where jsonb_typeof(to_jsonb(exercises)) = 'array'
                               and jsonb_array_length(to_jsonb(exercises)) > 0),
          'environment',
            count(*) filter (where jsonb_typeof(to_jsonb(temperature)) = 'number'
                                or jsonb_typeof(to_jsonb(humidity))    = 'number'),
          'medication_tags',
            count(*) filter (where jsonb_typeof(to_jsonb(medication_tags)) = 'array'
                               and jsonb_array_length(to_jsonb(medication_tags)) > 0),
          'mental',
            count(*) filter (where (jsonb_typeof(to_jsonb(mental_tags)) = 'array'
                                    and jsonb_array_length(to_jsonb(mental_tags)) > 0)
                                or coalesce(trim(mental_reason), '') <> ''),
          'cpps_value',
            count(*) filter (where jsonb_typeof(to_jsonb(cpps_value)) = 'number'),
          'voice_memo',
            count(*) filter (where coalesce(trim(voice_memo), '') <> '')
        )
        from public.entries
      )
    )
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.change_monka_teacher(p_org_id uuid, p_student_id uuid, p_new_teacher_id uuid)
 RETURNS TABLE(assignment_id uuid, old_teacher_id uuid, new_teacher_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_old uuid;
  v_new_id uuid;
  v_student_name text;
  v_new_name text;
begin
  -- ★① 門 ── ★できこと で 見ます。★役職の 名では 見ません。
  if not public.has_can(p_org_id, 'meibo') then
    raise exception 'その 学校の 名簿を 直せません';
  end if;

  -- ★② 新しい 先生が、★その 学校の 方か。
  if not exists (
    select 1 from public.memberships m
    where m.org_id = p_org_id and m.user_id = p_new_teacher_id
  ) then
    raise exception 'その 先生は、この 学校に いません';
  end if;

  -- ★③ 学生が、★その 学校に 在籍して いるか。
  if not exists (
    select 1 from public.enrollments e
    where e.org_id = p_org_id and e.student_id = p_student_id
  ) then
    raise exception 'その 方は、この 学校に いません';
  end if;

  -- ★④ いまの 担当（★1人とは 限りません。★ぜんぶ 閉じます）。
  select a.teacher_id into v_old
  from public.assignments a
  where a.org_id = p_org_id and a.student_id = p_student_id and a.ended_at is null
  order by a.started_at desc nulls last
  limit 1;

  if v_old = p_new_teacher_id then
    raise exception 'すでに その 先生が 担当です';
  end if;

  -- ★⑤ 閉じる ── ★消しません。★履歴に 残します（★裁定 その72）。
  update public.assignments a
  set ended_at = now()
  where a.org_id = p_org_id and a.student_id = p_student_id and a.ended_at is null;

  -- ★⑥ 作る
  insert into public.assignments (org_id, teacher_id, student_id, started_at)
  values (p_org_id, p_new_teacher_id, p_student_id, now())
  returning id into v_new_id;

  -- ★⑦ お知らせ 2行（★宛て先は その方 1人）
  select coalesce(pr.display_name, '') into v_student_name
  from public.profiles pr where pr.id = p_student_id;
  select coalesce(pr.display_name, '') into v_new_name
  from public.profiles pr where pr.id = p_new_teacher_id;

  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body, target_user_ids)
  values
    (p_org_id, p_new_teacher_id, auth.uid(), '担当の 先生が 変わりました',
     '担当の 先生が ' || coalesce(nullif(v_new_name, ''), '新しい 先生') ||
     ' に 変わりました。',
     array[p_student_id]);

  if v_old is not null then
    insert into public.org_messages
      (org_id, teacher_id, author_id, title, body, target_user_ids)
    values
      (p_org_id, v_old, auth.uid(), '担当を 外れました',
       coalesce(nullif(v_student_name, ''), 'その 方') ||
       ' さんの 担当を 外れました。',
       array[v_old]);
  end if;

  return query select v_new_id, v_old, p_new_teacher_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.character_unlock_summary(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when not exists (select 1 from public.profiles where id = p_user_id)
    then null
    else jsonb_build_object(
      'performances', (
        select count(*)
        from public.entries e
        where e.user_id = p_user_id
          and case
                when jsonb_typeof(to_jsonb(e.activities)) = 'array'
                 and jsonb_array_length(to_jsonb(e.activities)) > 0
                then exists (
                       select 1 from jsonb_array_elements(to_jsonb(e.activities)) a
                       where a ->> 'kind' = '本番')
                else e.activity_type = '本番'
              end
      ),
      'hasPianissimo', coalesce((
        select bool_or(
                 jsonb_typeof(to_jsonb(e.pianissimo_high_note)) <> 'null'
             and to_jsonb(e.pianissimo_high_note) <> '""'::jsonb
             and to_jsonb(e.pianissimo_high_note) <> 'false'::jsonb
             and to_jsonb(e.pianissimo_high_note) <> '0'::jsonb)
        from public.entries e where e.user_id = p_user_id
      ), false),
      'fieldKinds', (
        select count(distinct kv.key)
        from public.entries e,
             lateral jsonb_each(to_jsonb(e.*)) as kv(key, value)
        where e.user_id = p_user_id
          and kv.key not in ('date', 'user_id', 'id')
          and jsonb_typeof(kv.value) <> 'null'
          and not (jsonb_typeof(kv.value) = 'string' and kv.value = '""'::jsonb)
          and not (jsonb_typeof(kv.value) = 'array'  and jsonb_array_length(kv.value) = 0)
      )
    )
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.confirm_event_scores(p_org_id uuid, p_event_id uuid)
 RETURNS TABLE(scores integer, reviews integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_s integer := 0;
  v_r integer := 0;
begin
  if not public.has_can(p_org_id, 'saiten') then
    raise exception 'この 学校の 点を 確定できません';
  end if;

  with 済 as (
    update public.evaluation_scores s
    set confirmed_at = now()
    where s.org_id = p_org_id and s.event_id = p_event_id and s.confirmed_at is null
    returning 1
  )
  select count(*) into v_s from 済;

  with 済2 as (
    update public.evaluation_reviews r
    set confirmed_at = now()
    where r.org_id = p_org_id and r.event_id = p_event_id and r.confirmed_at is null
    returning 1
  )
  select count(*) into v_r from 済2;

  return query select v_s, v_r;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.edit_confirmed_score(p_score_id uuid, p_points numeric, p_reason text)
 RETURNS TABLE(ok boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v public.evaluation_scores;
  v_before numeric;
begin
  select * into v from public.evaluation_scores where id = p_score_id;
  if v.id is null then
    raise exception 'その 点が ありません';
  end if;
  if v.judge_id <> auth.uid() and not public.has_can(v.org_id, 'saiten') then
    raise exception 'その 点を 直せません';
  end if;
  if v.confirmed_at is null then
    raise exception 'まだ 確定して いません';
  end if;

  v_before := v.points;

  perform set_config('app.score_edit', 'on', true);
  update public.evaluation_scores
  set points = p_points, updated_at = now()
  where id = p_score_id;
  perform set_config('app.score_edit', 'off', true);

  insert into public.score_log
    (score_id, org_id, editor_user_id, before_value, after_value, reason)
  values
    (p_score_id, v.org_id, auth.uid(), v_before, p_points,
     nullif(trim(coalesce(p_reason, '')), ''));

  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body, target_user_ids)
  values
    (v.org_id, null, auth.uid(), '点が 直されました',
     to_char(now() at time zone 'Asia/Tokyo', 'MM月DD日') || 'の 点が 直されました。',
     array[v.student_id]);

  return query select true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.evaluation_scores_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- ★★★読み道（`edit_confirmed_score`）からの 直しは 通します。
  --   ★★あちらは `score_log` に 残して から 直します。
  if current_setting('app.score_edit', true) = 'on' then
    return new;
  end if;
  if old.confirmed_at is not null and new.points is distinct from old.points then
    raise exception '確定の あとは、わけを 添えて 直して ください';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_lesson_preset_for_student(p_org_id uuid)
 RETURNS TABLE(name text, total_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select p.name, p.total_count
  from public.lesson_presets p
  where p.org_id = p_org_id
    and exists (
      select 1 from public.enrollments e
      where e.org_id = p.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
$function$
;

CREATE OR REPLACE FUNCTION public.get_monka_free_counts()
 RETURNS TABLE(student_id uuid, free_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select a.student_id,
         (
           select count(*)::int
           from my_periods p
           cross join (select generate_series(0, 6) as weekday) d
           where p.user_id = a.student_id
             and not exists (
               select 1 from my_timetable t
               where t.user_id = a.student_id
                 and t.weekday = d.weekday
                 and t.period_id = p.id
             )
         ) as free_count
  from assignments a
  where a.teacher_id = auth.uid()
    and a.ended_at is null
$function$
;

CREATE OR REPLACE FUNCTION public.get_monka_read_notices()
 RETURNS TABLE(viewed_at timestamp with time zone, teacher_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select l.viewed_at,
         nullif(btrim(coalesce(p.display_name, '')), '') as teacher_name
    from public.monka_read_log l
    left join public.profiles p on p.id = l.target_monka_id
   where exists (
     -- ★★★呼んだ 方が、★その 門下に 居た か。
     --   ★★`ended_at` で 絞りません（★裁定 その76 追補）。
     --     ★★やめた あとに 確かめられる ことが あります。
     --     ★★やめた から 知らせない、では 筋が 通りません。
     --   ★★`org_id` と `teacher_id` の 両方で 合わせます。
     --     ★★片方だけ だと、★別の 学校の 同じ 先生に 当たります。
     select 1
       from public.assignments a
      where a.org_id = l.org_id
        and a.teacher_id = l.target_monka_id
        and a.student_id = auth.uid()
   )
   order by l.viewed_at desc
   limit 50;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_busy_slots()
 RETURNS TABLE(weekday smallint, period_id uuid)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select t.weekday, t.period_id
  from public.my_timetable t
  where t.user_id = auth.uid()
    and t.unavailable = true;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_monka_invites()
 RETURNS TABLE(code text, teacher_name text, org_name text, expires_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select i.code,
         coalesce(nullif(trim(p.display_name), ''), '先生') as teacher_name,
         coalesce(o.name, '') as org_name,
         i.expires_at
  from public.teacher_invitations i
  left join public.profiles p on p.id = i.monka_teacher_id
  left join public.organizations o on o.id = i.org_id
  where i.kind = 'named'
    and i.target_user_id = auth.uid()
    and i.used_at is null
    and i.expires_at > now();
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_named_invites(p_org_id uuid)
 RETURNS TABLE(target_user_id uuid, invited_at timestamp with time zone, used_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select i.target_user_id, i.invited_at, i.used_at
  from public.teacher_invitations i
  where i.org_id = p_org_id
    and i.kind = 'named'
    and i.monka_teacher_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_student_free_slots(p_org_id uuid, p_user_ids uuid[])
 RETURNS TABLE(user_id uuid, slot_key text, is_free boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.user_id,
         (d.weekday::text || '-' || p.ord::text) as slot_key,
         not exists (
           select 1 from my_timetable t
           where t.user_id = s.user_id
             and t.weekday = d.weekday
             and t.period_id = p.id
         ) as is_free
  from unnest(coalesce(p_user_ids, '{}'::uuid[])) as s(user_id)
  join my_periods p on p.user_id = s.user_id
  cross join (select generate_series(0, 6) as weekday) d
  where
    -- ★★その 学校に いま 在る 方 だけ（★やめた 方の 時間割は 出しません）
    exists (
      select 1 from enrollments e
      where e.org_id = p_org_id
        and e.student_id = s.user_id
        and e.status = 'active'
    )
    and (
      -- ★① 学校 全部の 日程を 組む できこと
      has_can(p_org_id, 'sched_all')
      -- ★② 担当の 先生 ご本人
      or exists (
        select 1 from assignments a
        where a.org_id = p_org_id
          and a.student_id = s.user_id
          and a.teacher_id = auth.uid()
          and a.ended_at is null
      )
    )
  order by s.user_id, d.weekday, p.ord
$function$
;

CREATE OR REPLACE FUNCTION public.get_teacher_periods(p_org_id uuid, p_teacher_id uuid)
 RETURNS TABLE(id uuid, ord smallint, name text, start_min smallint, end_min smallint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.id, p.ord, p.name, p.start_min, p.end_min
  from my_periods p
  where p.user_id = p_teacher_id
    and (
      p_teacher_id = auth.uid()
      or has_can(p_org_id, 'sched_all')
    )
    and exists (
      select 1 from memberships m
      where m.org_id = p_org_id and m.user_id = p_teacher_id
    )
  order by p.ord
$function$
;

CREATE OR REPLACE FUNCTION public.get_timetable_submitted(p_org_id uuid)
 RETURNS TABLE(student_id uuid, submitted boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select e.student_id,
         exists (select 1 from public.my_timetable t where t.user_id = e.student_id)
  from public.enrollments e
  where e.org_id = p_org_id
    and e.status = 'active'
    and (
      public.has_can(p_org_id, 'meibo')
      or exists (
        select 1 from public.assignments a
        where a.org_id = p_org_id
          and a.student_id = e.student_id
          and a.teacher_id = auth.uid()
          and a.ended_at is null
      )
    );
$function$
;

CREATE OR REPLACE FUNCTION public.has_can_user(p_user_id uuid, p_org_id uuid, p_perm text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.memberships m
    join public.org_posts p on p.id = m.post_id
    where m.org_id = p_org_id
      and m.user_id = p_user_id
      and coalesce((p.perms -> p_perm)::text, 'false') = 'true'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.has_guardian_consent(p_user_id uuid, p_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.guardian_consents g
    where g.user_id = p_user_id
      and g.org_id = p_org_id
      and g.consented_at is not null
      and g.withdrawn_at is null
  );
$function$
;

CREATE OR REPLACE FUNCTION public.leave_enrollment(p_org_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n integer;
begin
  if auth.uid() is null then
    return 0;
  end if;

  update public.enrollments
     set status = 'left',
         left_at = now()
   where student_id = auth.uid()
     and org_id = p_org_id
     and status = 'active';

  get diagnostics n = row_count;

  update public.assignments
     set ended_at = now()
   where student_id = auth.uid()
     and org_id = p_org_id
     and ended_at is null;

  return n;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.monka_representative_max()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$ select 2 $function$
;

CREATE OR REPLACE FUNCTION public.nudge_timetable(p_org_id uuid, p_student_ids uuid[])
 RETURNS TABLE(sent integer, skipped integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_sent integer := 0;
  v_all integer := 0;
  v_id uuid;
begin
  if not public.has_can(p_org_id, 'meibo') then
    raise exception 'その 学校の 名簿を 直せません';
  end if;

  v_all := coalesce(array_length(p_student_ids, 1), 0);

  foreach v_id in array coalesce(p_student_ids, array[]::uuid[])
  loop
    -- ★★その 学校の 方か。★ちがえば 飛ばします。
    if not exists (
      select 1 from public.enrollments e
      where e.org_id = p_org_id and e.student_id = v_id and e.status = 'active'
    ) then
      continue;
    end if;

    insert into public.timetable_nudges (org_id, student_id, sent_by)
    values (p_org_id, v_id, auth.uid())
    on conflict (org_id, student_id) do nothing;

    if found then
      v_sent := v_sent + 1;
      insert into public.org_messages
        (org_id, teacher_id, author_id, title, body, target_user_ids)
      values
        (p_org_id, null, auth.uid(), '時間割を 出して ください',
         '時間割が まだ 出て いません。出して いただけると、レッスンの 日程を 組めます。',
         array[v_id]);
    end if;
  end loop;

  return query select v_sent, v_all - v_sent;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.purge_code_attempts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n integer;
begin
  delete from public.code_attempts where at < now() - interval '24 hours';
  get diagnostics n = row_count;
  return n;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.request_guardian_consent(p_org_id uuid, p_teacher_id uuid, p_guardian_email text)
 RETURNS TABLE(token text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_token text;
  v_exp timestamptz;
begin
  if auth.uid() is null then
    raise exception 'お入りに なって いません';
  end if;
  if coalesce(trim(p_guardian_email), '') = '' then
    raise exception '保護者の メールアドレスが ありません';
  end if;

  -- ★★32文字より 長く します（★裁定 §3）。
  v_token := encode(gen_random_bytes(32), 'hex');
  v_exp := now() + interval '7 days';

  insert into public.guardian_consents
    (user_id, org_id, teacher_id, guardian_email, token, expires_at)
  values
    (auth.uid(), p_org_id, p_teacher_id, trim(p_guardian_email), v_token, v_exp);

  return query select v_token, v_exp;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.retire_teacher(p_org_id uuid, p_teacher_id uuid)
 RETURNS TABLE(closed_invitations integer, closed_assignments integer, students_without_teacher integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_inv integer := 0;
  v_asg integer := 0;
  v_std integer := 0;
begin
  -- ★① 門 ── ★できこと で 見ます。
  if not public.has_can(p_org_id, 'meibo') then
    raise exception 'その 学校の 名簿を 直せません';
  end if;

  -- ★② 合言葉を 閉じます（★出した 方・門下の 先生、★どちらの 形でも）。
  with 閉 as (
    update public.teacher_invitations i
    set expires_at = now()
    where i.org_id = p_org_id
      and (i.monka_teacher_id = p_teacher_id or i.teacher_id = p_teacher_id)
      and i.used_at is null
      and i.expires_at > now()
    returning 1
  )
  select count(*) into v_inv from 閉;

  -- ★③ 担当を 閉じます（★消しません）。
  with 閉2 as (
    update public.assignments a
    set ended_at = now()
    where a.org_id = p_org_id
      and a.teacher_id = p_teacher_id
      and a.ended_at is null
    returning a.student_id
  )
  select count(*) into v_asg from 閉2;

  -- ★④ 門下が 未定に なった 方の 数（★事務が Q1 の 手順で 決め直します）。
  select count(*) into v_std
  from public.enrollments e
  where e.org_id = p_org_id
    and e.status = 'active'
    and not exists (
      select 1 from public.assignments a
      where a.org_id = p_org_id and a.student_id = e.student_id and a.ended_at is null
    );

  return query select v_inv, v_asg, v_std;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_message_draft(p_draft_id uuid)
 RETURNS TABLE(message_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  d public.org_message_drafts;
  v_id uuid;
begin
  select * into d from public.org_message_drafts
  where id = p_draft_id;

  if d.id is null then
    raise exception 'その 下書きが ありません';
  end if;
  if d.author_id <> auth.uid() then
    raise exception '書いた ご本人だけが 出せます';
  end if;
  if coalesce(trim(d.body), '') = '' then
    raise exception '中身が ありません';
  end if;

  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body,
     target_division_ids, target_grade_years, target_user_ids)
  values
    (d.org_id, d.teacher_id, d.author_id, d.title, d.body,
     d.target_division_ids, d.target_grade_years, d.target_user_ids)
  returning id into v_id;

  delete from public.org_message_drafts where id = p_draft_id;

  return query select v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.withdraw_guardian_consent(p_org_id uuid)
 RETURNS TABLE(withdrawn integer, had_consent boolean, guardian_email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_n integer := 0;
  v_had boolean := false;
  v_mail text;
begin
  if auth.uid() is null then
    raise exception 'お入りに なって いません';
  end if;

  -- ★★済んだ 同意が 在ったか（★在籍を 閉じて よいかの 分かれ目）。
  select true, g.guardian_email into v_had, v_mail
  from public.guardian_consents g
  where g.user_id = auth.uid() and g.org_id = p_org_id
    and g.consented_at is not null and g.withdrawn_at is null
  order by g.consented_at desc
  limit 1;
  v_had := coalesce(v_had, false);

  with 閉 as (
    update public.guardian_consents g
    set withdrawn_at = now()
    where g.user_id = auth.uid() and g.org_id = p_org_id
      and g.withdrawn_at is null
    returning 1
  )
  select count(*) into v_n from 閉;

  return query select v_n, v_had, v_mail;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_ops_perm(viewer_id uuid, p_org_id uuid, p_student_id uuid, p_perm text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    exists (
      select 1 from enrollments
      where org_id = p_org_id and student_id = p_student_id and status = 'active'
    )
    and (
      public.has_can_user(viewer_id, p_org_id, p_perm)
      or exists (
        select 1 from assignments
        where org_id = p_org_id and teacher_id = viewer_id
          and student_id = p_student_id and ended_at is null
      )
    )
$function$
;

CREATE OR REPLACE FUNCTION public.set_monka_representative(p_assignment_id uuid, p_on boolean)
 RETURNS TABLE(assignment_id uuid, student_id uuid, is_representative boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_teacher uuid;
  v_org uuid;
  v_now integer;
begin
  -- ★★その 行が、★ご自分の 門下か。★ちがえば 何も しません。
  select a.teacher_id, a.org_id into v_teacher, v_org
  from public.assignments a
  where a.id = p_assignment_id and a.ended_at is null;

  if v_teacher is null then
    raise exception 'その 担当が ありません';
  end if;
  if v_teacher <> auth.uid() then
    raise exception 'その 門下の 先生だけが 決められます';
  end if;

  -- ★★2人までを、★ここで 守ります。★画面だけに 任せません。
  if p_on then
    select count(*) into v_now
    from public.assignments a
    where a.teacher_id = v_teacher and a.org_id = v_org
      and a.ended_at is null and a.is_representative
      and a.id <> p_assignment_id;
    if v_now >= public.monka_representative_max() then
      raise exception '代表は %人までです', public.monka_representative_max();
    end if;
  end if;

  update public.assignments a
  set is_representative = p_on
  where a.id = p_assignment_id;

  return query
  select a.id, a.student_id, a.is_representative
  from public.assignments a
  where a.teacher_id = v_teacher and a.org_id = v_org and a.ended_at is null
  order by a.student_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_org_student_names(p_org_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, kana text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select e.student_id,
         nullif(btrim(coalesce(p.display_name, '')), '') as display_name,
         nullif(btrim(coalesce(p.kana, '')), '') as kana
    from enrollments e
    left join profiles p on p.id = e.student_id
   where e.org_id = p_org_id
     and e.status = 'active'
     and can_view_ops_perm(auth.uid(), p_org_id, e.student_id, 'sched_all')
$function$
;

CREATE OR REPLACE FUNCTION public.move_lesson(p_lesson_id uuid, p_scheduled_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_place_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, scheduled_at timestamp with time zone, place_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_org uuid;
  v_teacher uuid;
  v_student uuid;
begin
  select l.org_id, l.teacher_id, l.student_id
    into v_org, v_teacher, v_student
    from lessons l where l.id = p_lesson_id;
  if v_org is null then
    return;
  end if;

  if not (
    can_view_ops_perm(auth.uid(), v_org, v_student, 'sched_all')
    or (v_teacher = auth.uid()
        and can_view_ops_perm(auth.uid(), v_org, v_student, 'sched_mine'))
  ) then
    return;
  end if;

  return query
    update lessons l set
      scheduled_at = coalesce(p_scheduled_at, l.scheduled_at),
      place_id     = coalesce(p_place_id, l.place_id)
    where l.id = p_lesson_id
    returning l.id, l.scheduled_at, l.place_id;
end;
$function$
;

-- ── ★読み道（2回目）──
CREATE OR REPLACE FUNCTION public.accept_guardian_consent(p_token text)
 RETURNS TABLE(ok boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
begin
  select g.id into v_id
  from public.guardian_consents g
  where g.token = p_token
    and g.consented_at is null
    and g.withdrawn_at is null
    and g.expires_at > now()
  limit 1;

  if v_id is null then
    -- ★★★無い ときと、★切れた ときと、★済んだ ときを 分けません。
    --   ★★分けると、★合言葉を 総当たりして 中が 分かります（★裁定 その77）。
    return query select false;
    return;
  end if;

  update public.guardian_consents
  set consented_at = now()
  where id = v_id;

  return query select true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_entry_stats(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when not exists (
      select 1 from public.profiles
       where id = p_user_id and is_admin is true
    ) then null
    else jsonb_build_object(
      'total', (select count(*) from public.entries),
      'per_user', coalesce((
        select jsonb_agg(jsonb_build_object('user_id', e.user_id, 'n', e.n))
        from (select user_id, count(*) as n from public.entries group by user_id) e
      ), '[]'::jsonb),
      'fill', (
        select jsonb_build_object(
          'weight_kg',
            count(*) filter (where jsonb_typeof(to_jsonb(weight_kg)) = 'number'),
          'body_fat_pct',
            count(*) filter (where jsonb_typeof(to_jsonb(body_fat_pct)) = 'number'),
          'meals',
            count(*) filter (where jsonb_typeof(to_jsonb(meals)) = 'array'
                               and jsonb_array_length(to_jsonb(meals)) > 0),
          'exercises',
            count(*) filter (where jsonb_typeof(to_jsonb(exercises)) = 'array'
                               and jsonb_array_length(to_jsonb(exercises)) > 0),
          'environment',
            count(*) filter (where jsonb_typeof(to_jsonb(temperature)) = 'number'
                                or jsonb_typeof(to_jsonb(humidity))    = 'number'),
          'medication_tags',
            count(*) filter (where jsonb_typeof(to_jsonb(medication_tags)) = 'array'
                               and jsonb_array_length(to_jsonb(medication_tags)) > 0),
          'mental',
            count(*) filter (where (jsonb_typeof(to_jsonb(mental_tags)) = 'array'
                                    and jsonb_array_length(to_jsonb(mental_tags)) > 0)
                                or coalesce(trim(mental_reason), '') <> ''),
          'cpps_value',
            count(*) filter (where jsonb_typeof(to_jsonb(cpps_value)) = 'number'),
          'voice_memo',
            count(*) filter (where coalesce(trim(voice_memo), '') <> '')
        )
        from public.entries
      )
    )
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.change_monka_teacher(p_org_id uuid, p_student_id uuid, p_new_teacher_id uuid)
 RETURNS TABLE(assignment_id uuid, old_teacher_id uuid, new_teacher_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_old uuid;
  v_new_id uuid;
  v_student_name text;
  v_new_name text;
begin
  -- ★① 門 ── ★できこと で 見ます。★役職の 名では 見ません。
  if not public.has_can(p_org_id, 'meibo') then
    raise exception 'その 学校の 名簿を 直せません';
  end if;

  -- ★② 新しい 先生が、★その 学校の 方か。
  if not exists (
    select 1 from public.memberships m
    where m.org_id = p_org_id and m.user_id = p_new_teacher_id
  ) then
    raise exception 'その 先生は、この 学校に いません';
  end if;

  -- ★③ 学生が、★その 学校に 在籍して いるか。
  if not exists (
    select 1 from public.enrollments e
    where e.org_id = p_org_id and e.student_id = p_student_id
  ) then
    raise exception 'その 方は、この 学校に いません';
  end if;

  -- ★④ いまの 担当（★1人とは 限りません。★ぜんぶ 閉じます）。
  select a.teacher_id into v_old
  from public.assignments a
  where a.org_id = p_org_id and a.student_id = p_student_id and a.ended_at is null
  order by a.started_at desc nulls last
  limit 1;

  if v_old = p_new_teacher_id then
    raise exception 'すでに その 先生が 担当です';
  end if;

  -- ★⑤ 閉じる ── ★消しません。★履歴に 残します（★裁定 その72）。
  update public.assignments a
  set ended_at = now()
  where a.org_id = p_org_id and a.student_id = p_student_id and a.ended_at is null;

  -- ★⑥ 作る
  insert into public.assignments (org_id, teacher_id, student_id, started_at)
  values (p_org_id, p_new_teacher_id, p_student_id, now())
  returning id into v_new_id;

  -- ★⑦ お知らせ 2行（★宛て先は その方 1人）
  select coalesce(pr.display_name, '') into v_student_name
  from public.profiles pr where pr.id = p_student_id;
  select coalesce(pr.display_name, '') into v_new_name
  from public.profiles pr where pr.id = p_new_teacher_id;

  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body, target_user_ids)
  values
    (p_org_id, p_new_teacher_id, auth.uid(), '担当の 先生が 変わりました',
     '担当の 先生が ' || coalesce(nullif(v_new_name, ''), '新しい 先生') ||
     ' に 変わりました。',
     array[p_student_id]);

  if v_old is not null then
    insert into public.org_messages
      (org_id, teacher_id, author_id, title, body, target_user_ids)
    values
      (p_org_id, v_old, auth.uid(), '担当を 外れました',
       coalesce(nullif(v_student_name, ''), 'その 方') ||
       ' さんの 担当を 外れました。',
       array[v_old]);
  end if;

  return query select v_new_id, v_old, p_new_teacher_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.character_unlock_summary(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when not exists (select 1 from public.profiles where id = p_user_id)
    then null
    else jsonb_build_object(
      'performances', (
        select count(*)
        from public.entries e
        where e.user_id = p_user_id
          and case
                when jsonb_typeof(to_jsonb(e.activities)) = 'array'
                 and jsonb_array_length(to_jsonb(e.activities)) > 0
                then exists (
                       select 1 from jsonb_array_elements(to_jsonb(e.activities)) a
                       where a ->> 'kind' = '本番')
                else e.activity_type = '本番'
              end
      ),
      'hasPianissimo', coalesce((
        select bool_or(
                 jsonb_typeof(to_jsonb(e.pianissimo_high_note)) <> 'null'
             and to_jsonb(e.pianissimo_high_note) <> '""'::jsonb
             and to_jsonb(e.pianissimo_high_note) <> 'false'::jsonb
             and to_jsonb(e.pianissimo_high_note) <> '0'::jsonb)
        from public.entries e where e.user_id = p_user_id
      ), false),
      'fieldKinds', (
        select count(distinct kv.key)
        from public.entries e,
             lateral jsonb_each(to_jsonb(e.*)) as kv(key, value)
        where e.user_id = p_user_id
          and kv.key not in ('date', 'user_id', 'id')
          and jsonb_typeof(kv.value) <> 'null'
          and not (jsonb_typeof(kv.value) = 'string' and kv.value = '""'::jsonb)
          and not (jsonb_typeof(kv.value) = 'array'  and jsonb_array_length(kv.value) = 0)
      )
    )
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.confirm_event_scores(p_org_id uuid, p_event_id uuid)
 RETURNS TABLE(scores integer, reviews integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_s integer := 0;
  v_r integer := 0;
begin
  if not public.has_can(p_org_id, 'saiten') then
    raise exception 'この 学校の 点を 確定できません';
  end if;

  with 済 as (
    update public.evaluation_scores s
    set confirmed_at = now()
    where s.org_id = p_org_id and s.event_id = p_event_id and s.confirmed_at is null
    returning 1
  )
  select count(*) into v_s from 済;

  with 済2 as (
    update public.evaluation_reviews r
    set confirmed_at = now()
    where r.org_id = p_org_id and r.event_id = p_event_id and r.confirmed_at is null
    returning 1
  )
  select count(*) into v_r from 済2;

  return query select v_s, v_r;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.edit_confirmed_score(p_score_id uuid, p_points numeric, p_reason text)
 RETURNS TABLE(ok boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v public.evaluation_scores;
  v_before numeric;
begin
  select * into v from public.evaluation_scores where id = p_score_id;
  if v.id is null then
    raise exception 'その 点が ありません';
  end if;
  if v.judge_id <> auth.uid() and not public.has_can(v.org_id, 'saiten') then
    raise exception 'その 点を 直せません';
  end if;
  if v.confirmed_at is null then
    raise exception 'まだ 確定して いません';
  end if;

  v_before := v.points;

  perform set_config('app.score_edit', 'on', true);
  update public.evaluation_scores
  set points = p_points, updated_at = now()
  where id = p_score_id;
  perform set_config('app.score_edit', 'off', true);

  insert into public.score_log
    (score_id, org_id, editor_user_id, before_value, after_value, reason)
  values
    (p_score_id, v.org_id, auth.uid(), v_before, p_points,
     nullif(trim(coalesce(p_reason, '')), ''));

  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body, target_user_ids)
  values
    (v.org_id, null, auth.uid(), '点が 直されました',
     to_char(now() at time zone 'Asia/Tokyo', 'MM月DD日') || 'の 点が 直されました。',
     array[v.student_id]);

  return query select true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.evaluation_scores_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- ★★★読み道（`edit_confirmed_score`）からの 直しは 通します。
  --   ★★あちらは `score_log` に 残して から 直します。
  if current_setting('app.score_edit', true) = 'on' then
    return new;
  end if;
  if old.confirmed_at is not null and new.points is distinct from old.points then
    raise exception '確定の あとは、わけを 添えて 直して ください';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_lesson_preset_for_student(p_org_id uuid)
 RETURNS TABLE(name text, total_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select p.name, p.total_count
  from public.lesson_presets p
  where p.org_id = p_org_id
    and exists (
      select 1 from public.enrollments e
      where e.org_id = p.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
$function$
;

CREATE OR REPLACE FUNCTION public.get_monka_free_counts()
 RETURNS TABLE(student_id uuid, free_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select a.student_id,
         (
           select count(*)::int
           from my_periods p
           cross join (select generate_series(0, 6) as weekday) d
           where p.user_id = a.student_id
             and not exists (
               select 1 from my_timetable t
               where t.user_id = a.student_id
                 and t.weekday = d.weekday
                 and t.period_id = p.id
             )
         ) as free_count
  from assignments a
  where a.teacher_id = auth.uid()
    and a.ended_at is null
$function$
;

CREATE OR REPLACE FUNCTION public.get_monka_read_notices()
 RETURNS TABLE(viewed_at timestamp with time zone, teacher_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select l.viewed_at,
         nullif(btrim(coalesce(p.display_name, '')), '') as teacher_name
    from public.monka_read_log l
    left join public.profiles p on p.id = l.target_monka_id
   where exists (
     -- ★★★呼んだ 方が、★その 門下に 居た か。
     --   ★★`ended_at` で 絞りません（★裁定 その76 追補）。
     --     ★★やめた あとに 確かめられる ことが あります。
     --     ★★やめた から 知らせない、では 筋が 通りません。
     --   ★★`org_id` と `teacher_id` の 両方で 合わせます。
     --     ★★片方だけ だと、★別の 学校の 同じ 先生に 当たります。
     select 1
       from public.assignments a
      where a.org_id = l.org_id
        and a.teacher_id = l.target_monka_id
        and a.student_id = auth.uid()
   )
   order by l.viewed_at desc
   limit 50;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_busy_slots()
 RETURNS TABLE(weekday smallint, period_id uuid)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select t.weekday, t.period_id
  from public.my_timetable t
  where t.user_id = auth.uid()
    and t.unavailable = true;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_monka_invites()
 RETURNS TABLE(code text, teacher_name text, org_name text, expires_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select i.code,
         coalesce(nullif(trim(p.display_name), ''), '先生') as teacher_name,
         coalesce(o.name, '') as org_name,
         i.expires_at
  from public.teacher_invitations i
  left join public.profiles p on p.id = i.monka_teacher_id
  left join public.organizations o on o.id = i.org_id
  where i.kind = 'named'
    and i.target_user_id = auth.uid()
    and i.used_at is null
    and i.expires_at > now();
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_named_invites(p_org_id uuid)
 RETURNS TABLE(target_user_id uuid, invited_at timestamp with time zone, used_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select i.target_user_id, i.invited_at, i.used_at
  from public.teacher_invitations i
  where i.org_id = p_org_id
    and i.kind = 'named'
    and i.monka_teacher_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_student_free_slots(p_org_id uuid, p_user_ids uuid[])
 RETURNS TABLE(user_id uuid, slot_key text, is_free boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.user_id,
         (d.weekday::text || '-' || p.ord::text) as slot_key,
         not exists (
           select 1 from my_timetable t
           where t.user_id = s.user_id
             and t.weekday = d.weekday
             and t.period_id = p.id
         ) as is_free
  from unnest(coalesce(p_user_ids, '{}'::uuid[])) as s(user_id)
  join my_periods p on p.user_id = s.user_id
  cross join (select generate_series(0, 6) as weekday) d
  where
    -- ★★その 学校に いま 在る 方 だけ（★やめた 方の 時間割は 出しません）
    exists (
      select 1 from enrollments e
      where e.org_id = p_org_id
        and e.student_id = s.user_id
        and e.status = 'active'
    )
    and (
      -- ★① 学校 全部の 日程を 組む できこと
      has_can(p_org_id, 'sched_all')
      -- ★② 担当の 先生 ご本人
      or exists (
        select 1 from assignments a
        where a.org_id = p_org_id
          and a.student_id = s.user_id
          and a.teacher_id = auth.uid()
          and a.ended_at is null
      )
    )
  order by s.user_id, d.weekday, p.ord
$function$
;

CREATE OR REPLACE FUNCTION public.get_teacher_periods(p_org_id uuid, p_teacher_id uuid)
 RETURNS TABLE(id uuid, ord smallint, name text, start_min smallint, end_min smallint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.id, p.ord, p.name, p.start_min, p.end_min
  from my_periods p
  where p.user_id = p_teacher_id
    and (
      p_teacher_id = auth.uid()
      or has_can(p_org_id, 'sched_all')
    )
    and exists (
      select 1 from memberships m
      where m.org_id = p_org_id and m.user_id = p_teacher_id
    )
  order by p.ord
$function$
;

CREATE OR REPLACE FUNCTION public.get_timetable_submitted(p_org_id uuid)
 RETURNS TABLE(student_id uuid, submitted boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select e.student_id,
         exists (select 1 from public.my_timetable t where t.user_id = e.student_id)
  from public.enrollments e
  where e.org_id = p_org_id
    and e.status = 'active'
    and (
      public.has_can(p_org_id, 'meibo')
      or exists (
        select 1 from public.assignments a
        where a.org_id = p_org_id
          and a.student_id = e.student_id
          and a.teacher_id = auth.uid()
          and a.ended_at is null
      )
    );
$function$
;

CREATE OR REPLACE FUNCTION public.has_can_user(p_user_id uuid, p_org_id uuid, p_perm text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.memberships m
    join public.org_posts p on p.id = m.post_id
    where m.org_id = p_org_id
      and m.user_id = p_user_id
      and coalesce((p.perms -> p_perm)::text, 'false') = 'true'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.has_guardian_consent(p_user_id uuid, p_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.guardian_consents g
    where g.user_id = p_user_id
      and g.org_id = p_org_id
      and g.consented_at is not null
      and g.withdrawn_at is null
  );
$function$
;

CREATE OR REPLACE FUNCTION public.leave_enrollment(p_org_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n integer;
begin
  if auth.uid() is null then
    return 0;
  end if;

  update public.enrollments
     set status = 'left',
         left_at = now()
   where student_id = auth.uid()
     and org_id = p_org_id
     and status = 'active';

  get diagnostics n = row_count;

  update public.assignments
     set ended_at = now()
   where student_id = auth.uid()
     and org_id = p_org_id
     and ended_at is null;

  return n;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.monka_representative_max()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$ select 2 $function$
;

CREATE OR REPLACE FUNCTION public.nudge_timetable(p_org_id uuid, p_student_ids uuid[])
 RETURNS TABLE(sent integer, skipped integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_sent integer := 0;
  v_all integer := 0;
  v_id uuid;
begin
  if not public.has_can(p_org_id, 'meibo') then
    raise exception 'その 学校の 名簿を 直せません';
  end if;

  v_all := coalesce(array_length(p_student_ids, 1), 0);

  foreach v_id in array coalesce(p_student_ids, array[]::uuid[])
  loop
    -- ★★その 学校の 方か。★ちがえば 飛ばします。
    if not exists (
      select 1 from public.enrollments e
      where e.org_id = p_org_id and e.student_id = v_id and e.status = 'active'
    ) then
      continue;
    end if;

    insert into public.timetable_nudges (org_id, student_id, sent_by)
    values (p_org_id, v_id, auth.uid())
    on conflict (org_id, student_id) do nothing;

    if found then
      v_sent := v_sent + 1;
      insert into public.org_messages
        (org_id, teacher_id, author_id, title, body, target_user_ids)
      values
        (p_org_id, null, auth.uid(), '時間割を 出して ください',
         '時間割が まだ 出て いません。出して いただけると、レッスンの 日程を 組めます。',
         array[v_id]);
    end if;
  end loop;

  return query select v_sent, v_all - v_sent;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.purge_code_attempts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n integer;
begin
  delete from public.code_attempts where at < now() - interval '24 hours';
  get diagnostics n = row_count;
  return n;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.request_guardian_consent(p_org_id uuid, p_teacher_id uuid, p_guardian_email text)
 RETURNS TABLE(token text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_token text;
  v_exp timestamptz;
begin
  if auth.uid() is null then
    raise exception 'お入りに なって いません';
  end if;
  if coalesce(trim(p_guardian_email), '') = '' then
    raise exception '保護者の メールアドレスが ありません';
  end if;

  -- ★★32文字より 長く します（★裁定 §3）。
  v_token := encode(gen_random_bytes(32), 'hex');
  v_exp := now() + interval '7 days';

  insert into public.guardian_consents
    (user_id, org_id, teacher_id, guardian_email, token, expires_at)
  values
    (auth.uid(), p_org_id, p_teacher_id, trim(p_guardian_email), v_token, v_exp);

  return query select v_token, v_exp;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.retire_teacher(p_org_id uuid, p_teacher_id uuid)
 RETURNS TABLE(closed_invitations integer, closed_assignments integer, students_without_teacher integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_inv integer := 0;
  v_asg integer := 0;
  v_std integer := 0;
begin
  -- ★① 門 ── ★できこと で 見ます。
  if not public.has_can(p_org_id, 'meibo') then
    raise exception 'その 学校の 名簿を 直せません';
  end if;

  -- ★② 合言葉を 閉じます（★出した 方・門下の 先生、★どちらの 形でも）。
  with 閉 as (
    update public.teacher_invitations i
    set expires_at = now()
    where i.org_id = p_org_id
      and (i.monka_teacher_id = p_teacher_id or i.teacher_id = p_teacher_id)
      and i.used_at is null
      and i.expires_at > now()
    returning 1
  )
  select count(*) into v_inv from 閉;

  -- ★③ 担当を 閉じます（★消しません）。
  with 閉2 as (
    update public.assignments a
    set ended_at = now()
    where a.org_id = p_org_id
      and a.teacher_id = p_teacher_id
      and a.ended_at is null
    returning a.student_id
  )
  select count(*) into v_asg from 閉2;

  -- ★④ 門下が 未定に なった 方の 数（★事務が Q1 の 手順で 決め直します）。
  select count(*) into v_std
  from public.enrollments e
  where e.org_id = p_org_id
    and e.status = 'active'
    and not exists (
      select 1 from public.assignments a
      where a.org_id = p_org_id and a.student_id = e.student_id and a.ended_at is null
    );

  return query select v_inv, v_asg, v_std;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_message_draft(p_draft_id uuid)
 RETURNS TABLE(message_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  d public.org_message_drafts;
  v_id uuid;
begin
  select * into d from public.org_message_drafts
  where id = p_draft_id;

  if d.id is null then
    raise exception 'その 下書きが ありません';
  end if;
  if d.author_id <> auth.uid() then
    raise exception '書いた ご本人だけが 出せます';
  end if;
  if coalesce(trim(d.body), '') = '' then
    raise exception '中身が ありません';
  end if;

  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body,
     target_division_ids, target_grade_years, target_user_ids)
  values
    (d.org_id, d.teacher_id, d.author_id, d.title, d.body,
     d.target_division_ids, d.target_grade_years, d.target_user_ids)
  returning id into v_id;

  delete from public.org_message_drafts where id = p_draft_id;

  return query select v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.withdraw_guardian_consent(p_org_id uuid)
 RETURNS TABLE(withdrawn integer, had_consent boolean, guardian_email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_n integer := 0;
  v_had boolean := false;
  v_mail text;
begin
  if auth.uid() is null then
    raise exception 'お入りに なって いません';
  end if;

  -- ★★済んだ 同意が 在ったか（★在籍を 閉じて よいかの 分かれ目）。
  select true, g.guardian_email into v_had, v_mail
  from public.guardian_consents g
  where g.user_id = auth.uid() and g.org_id = p_org_id
    and g.consented_at is not null and g.withdrawn_at is null
  order by g.consented_at desc
  limit 1;
  v_had := coalesce(v_had, false);

  with 閉 as (
    update public.guardian_consents g
    set withdrawn_at = now()
    where g.user_id = auth.uid() and g.org_id = p_org_id
      and g.withdrawn_at is null
    returning 1
  )
  select count(*) into v_n from 閉;

  return query select v_n, v_had, v_mail;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_ops_perm(viewer_id uuid, p_org_id uuid, p_student_id uuid, p_perm text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    exists (
      select 1 from enrollments
      where org_id = p_org_id and student_id = p_student_id and status = 'active'
    )
    and (
      public.has_can_user(viewer_id, p_org_id, p_perm)
      or exists (
        select 1 from assignments
        where org_id = p_org_id and teacher_id = viewer_id
          and student_id = p_student_id and ended_at is null
      )
    )
$function$
;

CREATE OR REPLACE FUNCTION public.set_monka_representative(p_assignment_id uuid, p_on boolean)
 RETURNS TABLE(assignment_id uuid, student_id uuid, is_representative boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_teacher uuid;
  v_org uuid;
  v_now integer;
begin
  -- ★★その 行が、★ご自分の 門下か。★ちがえば 何も しません。
  select a.teacher_id, a.org_id into v_teacher, v_org
  from public.assignments a
  where a.id = p_assignment_id and a.ended_at is null;

  if v_teacher is null then
    raise exception 'その 担当が ありません';
  end if;
  if v_teacher <> auth.uid() then
    raise exception 'その 門下の 先生だけが 決められます';
  end if;

  -- ★★2人までを、★ここで 守ります。★画面だけに 任せません。
  if p_on then
    select count(*) into v_now
    from public.assignments a
    where a.teacher_id = v_teacher and a.org_id = v_org
      and a.ended_at is null and a.is_representative
      and a.id <> p_assignment_id;
    if v_now >= public.monka_representative_max() then
      raise exception '代表は %人までです', public.monka_representative_max();
    end if;
  end if;

  update public.assignments a
  set is_representative = p_on
  where a.id = p_assignment_id;

  return query
  select a.id, a.student_id, a.is_representative
  from public.assignments a
  where a.teacher_id = v_teacher and a.org_id = v_org and a.ended_at is null
  order by a.student_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_org_student_names(p_org_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, kana text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select e.student_id,
         nullif(btrim(coalesce(p.display_name, '')), '') as display_name,
         nullif(btrim(coalesce(p.kana, '')), '') as kana
    from enrollments e
    left join profiles p on p.id = e.student_id
   where e.org_id = p_org_id
     and e.status = 'active'
     and can_view_ops_perm(auth.uid(), p_org_id, e.student_id, 'sched_all')
$function$
;

CREATE OR REPLACE FUNCTION public.move_lesson(p_lesson_id uuid, p_scheduled_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_place_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, scheduled_at timestamp with time zone, place_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_org uuid;
  v_teacher uuid;
  v_student uuid;
begin
  select l.org_id, l.teacher_id, l.student_id
    into v_org, v_teacher, v_student
    from lessons l where l.id = p_lesson_id;
  if v_org is null then
    return;
  end if;

  if not (
    can_view_ops_perm(auth.uid(), v_org, v_student, 'sched_all')
    or (v_teacher = auth.uid()
        and can_view_ops_perm(auth.uid(), v_org, v_student, 'sched_mine'))
  ) then
    return;
  end if;

  return query
    update lessons l set
      scheduled_at = coalesce(p_scheduled_at, l.scheduled_at),
      place_id     = coalesce(p_place_id, l.place_id)
    where l.id = p_lesson_id
    returning l.id, l.scheduled_at, l.place_id;
end;
$function$
;

-- ── ★外つなぎ（★表が そろって から）──
alter table public.evaluation_items add constraint evaluation_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.evaluation_items add constraint evaluation_items_event_id_fkey FOREIGN KEY (event_id) REFERENCES org_events(id) ON DELETE CASCADE;
alter table public.evaluation_items add constraint evaluation_items_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.evaluation_judge_done add constraint evaluation_judge_done_event_id_fkey FOREIGN KEY (event_id) REFERENCES org_events(id) ON DELETE CASCADE;
alter table public.evaluation_judge_done add constraint evaluation_judge_done_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.evaluation_judge_done add constraint evaluation_judge_done_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.evaluation_reviews add constraint evaluation_reviews_event_id_fkey FOREIGN KEY (event_id) REFERENCES org_events(id) ON DELETE CASCADE;
alter table public.evaluation_reviews add constraint evaluation_reviews_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.evaluation_reviews add constraint evaluation_reviews_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.evaluation_reviews add constraint evaluation_reviews_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.evaluation_scores add constraint evaluation_scores_event_id_fkey FOREIGN KEY (event_id) REFERENCES org_events(id) ON DELETE CASCADE;
alter table public.evaluation_scores add constraint evaluation_scores_item_id_fkey FOREIGN KEY (item_id) REFERENCES evaluation_items(id) ON DELETE CASCADE;
alter table public.evaluation_scores add constraint evaluation_scores_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.evaluation_scores add constraint evaluation_scores_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.evaluation_scores add constraint evaluation_scores_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.export_log add constraint export_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.export_log add constraint export_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.guardian_consents add constraint guardian_consents_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.guardian_consents add constraint guardian_consents_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.guardian_consents add constraint guardian_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.lesson_preset_targets add constraint lesson_preset_targets_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.lesson_preset_targets add constraint lesson_preset_targets_preset_id_fkey FOREIGN KEY (preset_id) REFERENCES lesson_presets(id) ON DELETE CASCADE;
alter table public.lesson_preset_targets add constraint lesson_preset_targets_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.lesson_presets add constraint lesson_presets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.lesson_presets add constraint lesson_presets_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.monka_read_log add constraint monka_read_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.monka_read_log add constraint monka_read_log_target_monka_id_fkey FOREIGN KEY (target_monka_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.monka_read_log add constraint monka_read_log_viewer_user_id_fkey FOREIGN KEY (viewer_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.org_billing add constraint org_billing_atesaki_changed_by_fkey FOREIGN KEY (atesaki_changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.org_billing add constraint org_billing_atesaki_user_id_fkey FOREIGN KEY (atesaki_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.org_billing add constraint org_billing_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.org_billing_log add constraint org_billing_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.org_billing_log add constraint org_billing_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.org_divisions add constraint org_divisions_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.org_divisions add constraint org_divisions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES org_divisions(id) ON DELETE SET NULL;
alter table public.org_message_drafts add constraint org_message_drafts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.org_message_drafts add constraint org_message_drafts_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.org_message_drafts add constraint org_message_drafts_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.org_periods add constraint org_periods_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.org_places add constraint org_places_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.overlap_notices add constraint overlap_notices_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
alter table public.portfolio_entries add constraint portfolio_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.portfolio_recordings add constraint portfolio_recordings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.portfolios add constraint portfolios_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.post_change_log add constraint post_change_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.post_change_log add constraint post_change_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.post_change_log add constraint post_change_log_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.roster_drafts add constraint roster_drafts_division_id_fkey FOREIGN KEY (division_id) REFERENCES org_divisions(id);
alter table public.roster_drafts add constraint roster_drafts_imported_by_fkey FOREIGN KEY (imported_by) REFERENCES auth.users(id);
alter table public.roster_drafts add constraint roster_drafts_linked_user_id_fkey FOREIGN KEY (linked_user_id) REFERENCES auth.users(id);
alter table public.roster_drafts add constraint roster_drafts_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.score_log add constraint score_log_editor_user_id_fkey FOREIGN KEY (editor_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.score_log add constraint score_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.timetable_nudges add constraint timetable_nudges_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.timetable_nudges add constraint timetable_nudges_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.timetable_nudges add constraint timetable_nudges_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

