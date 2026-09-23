-- ★★★土台 ── 表と 列
-- ★裁定175 ㋐。★2026-09-23 の 本番（xxjtplvpcneksrofkjmf）の 形を 機械で 書き出した もの。
-- ★★本番には 当てません。★「すでに 当たって いる」と 記録するだけ です。

-- ★★★連番
create sequence if not exists public.email_change_log_id_seq as bigint;

-- ★★★表（★しばりは 次の 本で 付けます。★表どうしの 順番に 縛られない ため）

create table if not exists public.account_deletions (
  id uuid default gen_random_uuid() not null,
  deleted_at timestamp with time zone default now() not null
);
alter table public.account_deletions add column if not exists id uuid;
alter table public.account_deletions add column if not exists deleted_at timestamp with time zone;

create table if not exists public.age_answer_changes (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  from_value boolean,
  to_value boolean,
  changed_at timestamp with time zone default now() not null
);
alter table public.age_answer_changes add column if not exists id uuid;
alter table public.age_answer_changes add column if not exists user_id uuid;
alter table public.age_answer_changes add column if not exists from_value boolean;
alter table public.age_answer_changes add column if not exists to_value boolean;
alter table public.age_answer_changes add column if not exists changed_at timestamp with time zone;

create table if not exists public.app_secrets (
  name text not null,
  value text not null,
  updated_at timestamp with time zone default now() not null
);
alter table public.app_secrets add column if not exists name text;
alter table public.app_secrets add column if not exists value text;
alter table public.app_secrets add column if not exists updated_at timestamp with time zone;

create table if not exists public.application_messages (
  id uuid default gen_random_uuid() not null,
  application_id uuid not null,
  sender_user_id uuid not null,
  template_key text not null,
  pieces text[],
  created_at timestamp with time zone default now() not null
);
alter table public.application_messages add column if not exists id uuid;
alter table public.application_messages add column if not exists application_id uuid;
alter table public.application_messages add column if not exists sender_user_id uuid;
alter table public.application_messages add column if not exists template_key text;
alter table public.application_messages add column if not exists pieces text[];
alter table public.application_messages add column if not exists created_at timestamp with time zone;

create table if not exists public.applications (
  id uuid default gen_random_uuid() not null,
  posting_id uuid not null,
  applicant_user_id uuid not null,
  org_id uuid not null,
  available_days date[] not null,
  template_key text not null,
  show_career boolean default true not null,
  show_recordings boolean default true not null,
  show_repertoire boolean default true not null,
  show_photo boolean default false not null,
  status text default 'sent'::text not null,
  created_at timestamp with time zone default now() not null
);
alter table public.applications add column if not exists id uuid;
alter table public.applications add column if not exists posting_id uuid;
alter table public.applications add column if not exists applicant_user_id uuid;
alter table public.applications add column if not exists org_id uuid;
alter table public.applications add column if not exists available_days date[];
alter table public.applications add column if not exists template_key text;
alter table public.applications add column if not exists show_career boolean;
alter table public.applications add column if not exists show_recordings boolean;
alter table public.applications add column if not exists show_repertoire boolean;
alter table public.applications add column if not exists show_photo boolean;
alter table public.applications add column if not exists status text;
alter table public.applications add column if not exists created_at timestamp with time zone;

create table if not exists public.article_notes (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  article_id text not null,
  kind text not null,
  anchor_text text,
  anchor_offset integer,
  body text not null,
  shared_with_teacher boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone
);
alter table public.article_notes add column if not exists id uuid;
alter table public.article_notes add column if not exists user_id uuid;
alter table public.article_notes add column if not exists article_id text;
alter table public.article_notes add column if not exists kind text;
alter table public.article_notes add column if not exists anchor_text text;
alter table public.article_notes add column if not exists anchor_offset integer;
alter table public.article_notes add column if not exists body text;
alter table public.article_notes add column if not exists shared_with_teacher boolean;
alter table public.article_notes add column if not exists created_at timestamp with time zone;
alter table public.article_notes add column if not exists updated_at timestamp with time zone;
alter table public.article_notes add column if not exists deleted_at timestamp with time zone;

create table if not exists public.article_progress (
  user_id uuid not null,
  article_id text not null,
  read_at timestamp with time zone,
  bookmarked boolean default false,
  first_read_at timestamp with time zone,
  box smallint default 0 not null,
  next_due_at date,
  last_answered_at timestamp with time zone
);
alter table public.article_progress add column if not exists user_id uuid;
alter table public.article_progress add column if not exists article_id text;
alter table public.article_progress add column if not exists read_at timestamp with time zone;
alter table public.article_progress add column if not exists bookmarked boolean;
alter table public.article_progress add column if not exists first_read_at timestamp with time zone;
alter table public.article_progress add column if not exists box smallint;
alter table public.article_progress add column if not exists next_due_at date;
alter table public.article_progress add column if not exists last_answered_at timestamp with time zone;

create table if not exists public.assignments (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  teacher_id uuid not null,
  student_id uuid not null,
  started_at timestamp with time zone default now() not null,
  ended_at timestamp with time zone,
  is_representative boolean default false not null
);
alter table public.assignments add column if not exists id uuid;
alter table public.assignments add column if not exists org_id uuid;
alter table public.assignments add column if not exists teacher_id uuid;
alter table public.assignments add column if not exists student_id uuid;
alter table public.assignments add column if not exists started_at timestamp with time zone;
alter table public.assignments add column if not exists ended_at timestamp with time zone;
alter table public.assignments add column if not exists is_representative boolean;

create table if not exists public.calendar_tokens (
  user_id uuid not null,
  token text default encode(gen_random_bytes(24), 'hex'::text) not null,
  created_at timestamp with time zone default now() not null,
  rotated_at timestamp with time zone
);
alter table public.calendar_tokens add column if not exists user_id uuid;
alter table public.calendar_tokens add column if not exists token text;
alter table public.calendar_tokens add column if not exists created_at timestamp with time zone;
alter table public.calendar_tokens add column if not exists rotated_at timestamp with time zone;

create table if not exists public.chapter_state (
  user_id uuid not null,
  profession_key text not null,
  chapter integer not null,
  is_open boolean default true
);
alter table public.chapter_state add column if not exists user_id uuid;
alter table public.chapter_state add column if not exists profession_key text;
alter table public.chapter_state add column if not exists chapter integer;
alter table public.chapter_state add column if not exists is_open boolean;

create table if not exists public.character_inventory (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  item_key text not null,
  purchased_at timestamp with time zone default now()
);
alter table public.character_inventory add column if not exists id uuid;
alter table public.character_inventory add column if not exists user_id uuid;
alter table public.character_inventory add column if not exists item_key text;
alter table public.character_inventory add column if not exists purchased_at timestamp with time zone;

create table if not exists public.code_attempts (
  id uuid default gen_random_uuid() not null,
  code_hash text not null,
  ip_hash text,
  at timestamp with time zone default now() not null
);
alter table public.code_attempts add column if not exists id uuid;
alter table public.code_attempts add column if not exists code_hash text;
alter table public.code_attempts add column if not exists ip_hash text;
alter table public.code_attempts add column if not exists at timestamp with time zone;

create table if not exists public.cohort_changes (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  from_value text,
  to_value text not null,
  changed_at timestamp with time zone default now() not null
);
alter table public.cohort_changes add column if not exists id uuid;
alter table public.cohort_changes add column if not exists user_id uuid;
alter table public.cohort_changes add column if not exists from_value text;
alter table public.cohort_changes add column if not exists to_value text;
alter table public.cohort_changes add column if not exists changed_at timestamp with time zone;

create table if not exists public.consent_records (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  purpose_key text not null,
  policy_version text not null,
  text_hash text not null,
  locale text default 'ja'::text not null,
  method text default 'checkbox'::text not null,
  granted_at timestamp with time zone default now() not null,
  withdrawn_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);
alter table public.consent_records add column if not exists id uuid;
alter table public.consent_records add column if not exists user_id uuid;
alter table public.consent_records add column if not exists purpose_key text;
alter table public.consent_records add column if not exists policy_version text;
alter table public.consent_records add column if not exists text_hash text;
alter table public.consent_records add column if not exists locale text;
alter table public.consent_records add column if not exists method text;
alter table public.consent_records add column if not exists granted_at timestamp with time zone;
alter table public.consent_records add column if not exists withdrawn_at timestamp with time zone;
alter table public.consent_records add column if not exists created_at timestamp with time zone;

create table if not exists public.contract_owner_log (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  from_user_id uuid,
  to_user_id uuid not null,
  changed_at timestamp with time zone default now() not null,
  changed_by uuid not null
);
alter table public.contract_owner_log add column if not exists id uuid;
alter table public.contract_owner_log add column if not exists org_id uuid;
alter table public.contract_owner_log add column if not exists from_user_id uuid;
alter table public.contract_owner_log add column if not exists to_user_id uuid;
alter table public.contract_owner_log add column if not exists changed_at timestamp with time zone;
alter table public.contract_owner_log add column if not exists changed_by uuid;

create table if not exists public.cycle_periods (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  start_date date not null,
  end_date date,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone
);
alter table public.cycle_periods add column if not exists id uuid;
alter table public.cycle_periods add column if not exists user_id uuid;
alter table public.cycle_periods add column if not exists start_date date;
alter table public.cycle_periods add column if not exists end_date date;
alter table public.cycle_periods add column if not exists created_at timestamp with time zone;
alter table public.cycle_periods add column if not exists updated_at timestamp with time zone;

create table if not exists public.email_change_log (
  id bigint default nextval('email_change_log_id_seq'::regclass) not null,
  user_id uuid not null,
  changed_at timestamp with time zone default now() not null,
  old_email text,
  new_email text,
  via text not null
);
alter table public.email_change_log add column if not exists id bigint;
alter table public.email_change_log add column if not exists user_id uuid;
alter table public.email_change_log add column if not exists changed_at timestamp with time zone;
alter table public.email_change_log add column if not exists old_email text;
alter table public.email_change_log add column if not exists new_email text;
alter table public.email_change_log add column if not exists via text;

create table if not exists public.enrollments (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  student_id uuid not null,
  status text default 'active'::text not null,
  enrolled_at timestamp with time zone default now() not null,
  left_at timestamp with time zone,
  grade_label text,
  grade_year integer,
  division_id uuid,
  student_number text
);
alter table public.enrollments add column if not exists id uuid;
alter table public.enrollments add column if not exists org_id uuid;
alter table public.enrollments add column if not exists student_id uuid;
alter table public.enrollments add column if not exists status text;
alter table public.enrollments add column if not exists enrolled_at timestamp with time zone;
alter table public.enrollments add column if not exists left_at timestamp with time zone;
alter table public.enrollments add column if not exists grade_label text;
alter table public.enrollments add column if not exists grade_year integer;
alter table public.enrollments add column if not exists division_id uuid;
alter table public.enrollments add column if not exists student_number text;

create table if not exists public.entries (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  date date not null,
  throat_condition integer,
  voice_quality integer,
  throat_symptoms text[] default '{}'::text[],
  sleep_hours numeric,
  sleep_quality integer,
  water_intake numeric,
  meal_notes text,
  location text,
  temperature numeric,
  humidity numeric,
  activity_type text,
  activity_duration numeric,
  repertoire text,
  performance_quality integer,
  ease integer,
  notes text,
  created_at timestamp with time zone default now(),
  voice_checkins jsonb default '{}'::jsonb,
  water_by_slot jsonb default '{}'::jsonb,
  weight_kg numeric,
  carbs_g numeric,
  protein_g numeric,
  fat_g numeric,
  fiber_g numeric,
  exercise_minutes numeric,
  meals jsonb default '[]'::jsonb,
  exercises jsonb default '[]'::jsonb,
  weather text,
  mental_reason text,
  throat_symptoms_other text,
  voice_memo text,
  activity_detail jsonb default '{}'::jsonb,
  wake_note text,
  routine_note text,
  resonance_score numeric,
  bedtime text,
  dinner_time text,
  dinner_tags text[] default '{}'::text[],
  load_detail jsonb default '{}'::jsonb,
  mental_tags text[] default '{}'::text[],
  cycle_start boolean default false,
  medication_tags text[] default '{}'::text[],
  ambient_noise_db numeric,
  flight_hours numeric,
  jetlag_hours numeric,
  activities jsonb default '[]'::jsonb,
  recovery jsonb,
  pianissimo_high_note text,
  pianissimo_onset_delay boolean default false,
  speaking_level integer,
  noisy_environment boolean default false,
  cpps_value numeric,
  exercise_level integer,
  body_fat_pct numeric,
  protein_level integer,
  calorie_level integer,
  voice_entries jsonb default '[]'::jsonb,
  non_performance_speech_minutes numeric,
  environment_tags text[] default '{}'::text[],
  longest_speech_block_minutes numeric,
  type_fields jsonb,
  morning_edema smallint,
  accompaniment text,
  smoked_today boolean,
  drank_today boolean,
  weather_source text,
  meal_marks text[],
  sleep_side text,
  head_raised text,
  belly_tight text,
  source text
);
alter table public.entries add column if not exists id uuid;
alter table public.entries add column if not exists user_id uuid;
alter table public.entries add column if not exists date date;
alter table public.entries add column if not exists throat_condition integer;
alter table public.entries add column if not exists voice_quality integer;
alter table public.entries add column if not exists throat_symptoms text[];
alter table public.entries add column if not exists sleep_hours numeric;
alter table public.entries add column if not exists sleep_quality integer;
alter table public.entries add column if not exists water_intake numeric;
alter table public.entries add column if not exists meal_notes text;
alter table public.entries add column if not exists location text;
alter table public.entries add column if not exists temperature numeric;
alter table public.entries add column if not exists humidity numeric;
alter table public.entries add column if not exists activity_type text;
alter table public.entries add column if not exists activity_duration numeric;
alter table public.entries add column if not exists repertoire text;
alter table public.entries add column if not exists performance_quality integer;
alter table public.entries add column if not exists ease integer;
alter table public.entries add column if not exists notes text;
alter table public.entries add column if not exists created_at timestamp with time zone;
alter table public.entries add column if not exists voice_checkins jsonb;
alter table public.entries add column if not exists water_by_slot jsonb;
alter table public.entries add column if not exists weight_kg numeric;
alter table public.entries add column if not exists carbs_g numeric;
alter table public.entries add column if not exists protein_g numeric;
alter table public.entries add column if not exists fat_g numeric;
alter table public.entries add column if not exists fiber_g numeric;
alter table public.entries add column if not exists exercise_minutes numeric;
alter table public.entries add column if not exists meals jsonb;
alter table public.entries add column if not exists exercises jsonb;
alter table public.entries add column if not exists weather text;
alter table public.entries add column if not exists mental_reason text;
alter table public.entries add column if not exists throat_symptoms_other text;
alter table public.entries add column if not exists voice_memo text;
alter table public.entries add column if not exists activity_detail jsonb;
alter table public.entries add column if not exists wake_note text;
alter table public.entries add column if not exists routine_note text;
alter table public.entries add column if not exists resonance_score numeric;
alter table public.entries add column if not exists bedtime text;
alter table public.entries add column if not exists dinner_time text;
alter table public.entries add column if not exists dinner_tags text[];
alter table public.entries add column if not exists load_detail jsonb;
alter table public.entries add column if not exists mental_tags text[];
alter table public.entries add column if not exists cycle_start boolean;
alter table public.entries add column if not exists medication_tags text[];
alter table public.entries add column if not exists ambient_noise_db numeric;
alter table public.entries add column if not exists flight_hours numeric;
alter table public.entries add column if not exists jetlag_hours numeric;
alter table public.entries add column if not exists activities jsonb;
alter table public.entries add column if not exists recovery jsonb;
alter table public.entries add column if not exists pianissimo_high_note text;
alter table public.entries add column if not exists pianissimo_onset_delay boolean;
alter table public.entries add column if not exists speaking_level integer;
alter table public.entries add column if not exists noisy_environment boolean;
alter table public.entries add column if not exists cpps_value numeric;
alter table public.entries add column if not exists exercise_level integer;
alter table public.entries add column if not exists body_fat_pct numeric;
alter table public.entries add column if not exists protein_level integer;
alter table public.entries add column if not exists calorie_level integer;
alter table public.entries add column if not exists voice_entries jsonb;
alter table public.entries add column if not exists non_performance_speech_minutes numeric;
alter table public.entries add column if not exists environment_tags text[];
alter table public.entries add column if not exists longest_speech_block_minutes numeric;
alter table public.entries add column if not exists type_fields jsonb;
alter table public.entries add column if not exists morning_edema smallint;
alter table public.entries add column if not exists accompaniment text;
alter table public.entries add column if not exists smoked_today boolean;
alter table public.entries add column if not exists drank_today boolean;
alter table public.entries add column if not exists weather_source text;
alter table public.entries add column if not exists meal_marks text[];
alter table public.entries add column if not exists sleep_side text;
alter table public.entries add column if not exists head_raised text;
alter table public.entries add column if not exists belly_tight text;
alter table public.entries add column if not exists source text;

create table if not exists public.evaluation_items (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  event_id uuid,
  name text not null,
  max_points numeric(5,2) not null,
  step numeric(3,2) default 1 not null,
  note text,
  in_use boolean default true not null,
  ord integer default 0 not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
alter table public.evaluation_items add column if not exists id uuid;
alter table public.evaluation_items add column if not exists org_id uuid;
alter table public.evaluation_items add column if not exists event_id uuid;
alter table public.evaluation_items add column if not exists name text;
alter table public.evaluation_items add column if not exists max_points numeric(5,2);
alter table public.evaluation_items add column if not exists step numeric(3,2);
alter table public.evaluation_items add column if not exists note text;
alter table public.evaluation_items add column if not exists in_use boolean;
alter table public.evaluation_items add column if not exists ord integer;
alter table public.evaluation_items add column if not exists created_by uuid;
alter table public.evaluation_items add column if not exists created_at timestamp with time zone;
alter table public.evaluation_items add column if not exists updated_at timestamp with time zone;

create table if not exists public.evaluation_judge_done (
  org_id uuid not null,
  event_id uuid not null,
  judge_id uuid not null,
  done_at timestamp with time zone default now() not null
);
alter table public.evaluation_judge_done add column if not exists org_id uuid;
alter table public.evaluation_judge_done add column if not exists event_id uuid;
alter table public.evaluation_judge_done add column if not exists judge_id uuid;
alter table public.evaluation_judge_done add column if not exists done_at timestamp with time zone;

create table if not exists public.evaluation_reviews (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  event_id uuid,
  student_id uuid not null,
  judge_id uuid not null,
  body text default ''::text not null,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  judge_name_at text
);
alter table public.evaluation_reviews add column if not exists id uuid;
alter table public.evaluation_reviews add column if not exists org_id uuid;
alter table public.evaluation_reviews add column if not exists event_id uuid;
alter table public.evaluation_reviews add column if not exists student_id uuid;
alter table public.evaluation_reviews add column if not exists judge_id uuid;
alter table public.evaluation_reviews add column if not exists body text;
alter table public.evaluation_reviews add column if not exists confirmed_at timestamp with time zone;
alter table public.evaluation_reviews add column if not exists created_at timestamp with time zone;
alter table public.evaluation_reviews add column if not exists updated_at timestamp with time zone;
alter table public.evaluation_reviews add column if not exists judge_name_at text;

create table if not exists public.evaluation_scores (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  event_id uuid,
  student_id uuid not null,
  item_id uuid not null,
  judge_id uuid not null,
  points numeric(5,2),
  confirmed_at timestamp with time zone,
  entered_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  judge_name_at text
);
alter table public.evaluation_scores add column if not exists id uuid;
alter table public.evaluation_scores add column if not exists org_id uuid;
alter table public.evaluation_scores add column if not exists event_id uuid;
alter table public.evaluation_scores add column if not exists student_id uuid;
alter table public.evaluation_scores add column if not exists item_id uuid;
alter table public.evaluation_scores add column if not exists judge_id uuid;
alter table public.evaluation_scores add column if not exists points numeric(5,2);
alter table public.evaluation_scores add column if not exists confirmed_at timestamp with time zone;
alter table public.evaluation_scores add column if not exists entered_at timestamp with time zone;
alter table public.evaluation_scores add column if not exists updated_at timestamp with time zone;
alter table public.evaluation_scores add column if not exists judge_name_at text;

create table if not exists public.events (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  event_type text,
  payload jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  name text,
  props jsonb default '{}'::jsonb not null,
  at timestamp with time zone default now() not null,
  tz text,
  session_id text,
  platform text
);
alter table public.events add column if not exists id uuid;
alter table public.events add column if not exists user_id uuid;
alter table public.events add column if not exists event_type text;
alter table public.events add column if not exists payload jsonb;
alter table public.events add column if not exists created_at timestamp with time zone;
alter table public.events add column if not exists name text;
alter table public.events add column if not exists props jsonb;
alter table public.events add column if not exists at timestamp with time zone;
alter table public.events add column if not exists tz text;
alter table public.events add column if not exists session_id text;
alter table public.events add column if not exists platform text;

create table if not exists public.export_log (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  user_id uuid not null,
  what text not null,
  rows integer default 0 not null,
  created_at timestamp with time zone default now() not null
);
alter table public.export_log add column if not exists id uuid;
alter table public.export_log add column if not exists org_id uuid;
alter table public.export_log add column if not exists user_id uuid;
alter table public.export_log add column if not exists what text;
alter table public.export_log add column if not exists rows integer;
alter table public.export_log add column if not exists created_at timestamp with time zone;

create table if not exists public.feedback (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  email text,
  category text,
  message text not null,
  created_at timestamp with time zone default now()
);
alter table public.feedback add column if not exists id uuid;
alter table public.feedback add column if not exists user_id uuid;
alter table public.feedback add column if not exists email text;
alter table public.feedback add column if not exists category text;
alter table public.feedback add column if not exists message text;
alter table public.feedback add column if not exists created_at timestamp with time zone;

create table if not exists public.guardian_consents (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  org_id uuid not null,
  teacher_id uuid,
  guardian_email text not null,
  token text not null,
  sent_at timestamp with time zone default now() not null,
  consented_at timestamp with time zone,
  expires_at timestamp with time zone default (now() + '7 days'::interval) not null,
  withdrawn_at timestamp with time zone
);
alter table public.guardian_consents add column if not exists id uuid;
alter table public.guardian_consents add column if not exists user_id uuid;
alter table public.guardian_consents add column if not exists org_id uuid;
alter table public.guardian_consents add column if not exists teacher_id uuid;
alter table public.guardian_consents add column if not exists guardian_email text;
alter table public.guardian_consents add column if not exists token text;
alter table public.guardian_consents add column if not exists sent_at timestamp with time zone;
alter table public.guardian_consents add column if not exists consented_at timestamp with time zone;
alter table public.guardian_consents add column if not exists expires_at timestamp with time zone;
alter table public.guardian_consents add column if not exists withdrawn_at timestamp with time zone;

create table if not exists public.import_staging (
  user_id uuid not null,
  date date not null,
  throat_condition integer,
  voice_quality integer,
  sleep_hours numeric,
  non_performance_speech_minutes numeric,
  throat_symptoms text[],
  notes text,
  voice_memo text,
  dinner_time text,
  bedtime text,
  meal_notes text,
  weight_kg numeric
);
alter table public.import_staging add column if not exists user_id uuid;
alter table public.import_staging add column if not exists date date;
alter table public.import_staging add column if not exists throat_condition integer;
alter table public.import_staging add column if not exists voice_quality integer;
alter table public.import_staging add column if not exists sleep_hours numeric;
alter table public.import_staging add column if not exists non_performance_speech_minutes numeric;
alter table public.import_staging add column if not exists throat_symptoms text[];
alter table public.import_staging add column if not exists notes text;
alter table public.import_staging add column if not exists voice_memo text;
alter table public.import_staging add column if not exists dinner_time text;
alter table public.import_staging add column if not exists bedtime text;
alter table public.import_staging add column if not exists meal_notes text;
alter table public.import_staging add column if not exists weight_kg numeric;

create table if not exists public.item_acquisitions (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  item_key text not null,
  acquired_on date not null,
  acquired_by text not null,
  count_kind text,
  count_value integer,
  created_at timestamp with time zone default now() not null
);
alter table public.item_acquisitions add column if not exists id uuid;
alter table public.item_acquisitions add column if not exists user_id uuid;
alter table public.item_acquisitions add column if not exists item_key text;
alter table public.item_acquisitions add column if not exists acquired_on date;
alter table public.item_acquisitions add column if not exists acquired_by text;
alter table public.item_acquisitions add column if not exists count_kind text;
alter table public.item_acquisitions add column if not exists count_value integer;
alter table public.item_acquisitions add column if not exists created_at timestamp with time zone;

create table if not exists public.koen (
  id uuid default gen_random_uuid() not null,
  org_id uuid,
  owner_user_id uuid,
  title text not null,
  kind text not null,
  venue text,
  opens_on date,
  status text default 'draft'::text not null,
  tier_people integer default 15 not null,
  created_at timestamp with time zone default now() not null
);
alter table public.koen add column if not exists id uuid;
alter table public.koen add column if not exists org_id uuid;
alter table public.koen add column if not exists owner_user_id uuid;
alter table public.koen add column if not exists title text;
alter table public.koen add column if not exists kind text;
alter table public.koen add column if not exists venue text;
alter table public.koen add column if not exists opens_on date;
alter table public.koen add column if not exists status text;
alter table public.koen add column if not exists tier_people integer;
alter table public.koen add column if not exists created_at timestamp with time zone;

create table if not exists public.koen_cells (
  row_id uuid not null,
  slot_id uuid not null,
  member_id uuid,
  people integer
);
alter table public.koen_cells add column if not exists row_id uuid;
alter table public.koen_cells add column if not exists slot_id uuid;
alter table public.koen_cells add column if not exists member_id uuid;
alter table public.koen_cells add column if not exists people integer;

create table if not exists public.koen_kid_contact_reads (
  id uuid default gen_random_uuid() not null,
  kid_id uuid not null,
  koen_id uuid not null,
  viewer_user_id uuid,
  viewer_role_at text not null,
  reason_kind text not null,
  viewed_at timestamp with time zone default now() not null
);
alter table public.koen_kid_contact_reads add column if not exists id uuid;
alter table public.koen_kid_contact_reads add column if not exists kid_id uuid;
alter table public.koen_kid_contact_reads add column if not exists koen_id uuid;
alter table public.koen_kid_contact_reads add column if not exists viewer_user_id uuid;
alter table public.koen_kid_contact_reads add column if not exists viewer_role_at text;
alter table public.koen_kid_contact_reads add column if not exists reason_kind text;
alter table public.koen_kid_contact_reads add column if not exists viewed_at timestamp with time zone;

create table if not exists public.koen_kid_contacts (
  kid_id uuid not null,
  contact text not null,
  updated_at timestamp with time zone default now() not null
);
alter table public.koen_kid_contacts add column if not exists kid_id uuid;
alter table public.koen_kid_contacts add column if not exists contact text;
alter table public.koen_kid_contacts add column if not exists updated_at timestamp with time zone;

create table if not exists public.koen_kids (
  id uuid default gen_random_uuid() not null,
  koen_id uuid not null,
  guardian_user_id uuid not null,
  nickname text not null,
  dismiss_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  left_at timestamp with time zone
);
alter table public.koen_kids add column if not exists id uuid;
alter table public.koen_kids add column if not exists koen_id uuid;
alter table public.koen_kids add column if not exists guardian_user_id uuid;
alter table public.koen_kids add column if not exists nickname text;
alter table public.koen_kids add column if not exists dismiss_at timestamp with time zone;
alter table public.koen_kids add column if not exists created_at timestamp with time zone;
alter table public.koen_kids add column if not exists left_at timestamp with time zone;

create table if not exists public.koen_members (
  id uuid default gen_random_uuid() not null,
  koen_id uuid not null,
  user_id uuid,
  name_at text not null,
  part text default 'cast'::text not null,
  can_manage boolean default false not null,
  invited_at timestamp with time zone default now() not null,
  joined_at timestamp with time zone,
  left_at timestamp with time zone
);
alter table public.koen_members add column if not exists id uuid;
alter table public.koen_members add column if not exists koen_id uuid;
alter table public.koen_members add column if not exists user_id uuid;
alter table public.koen_members add column if not exists name_at text;
alter table public.koen_members add column if not exists part text;
alter table public.koen_members add column if not exists can_manage boolean;
alter table public.koen_members add column if not exists invited_at timestamp with time zone;
alter table public.koen_members add column if not exists joined_at timestamp with time zone;
alter table public.koen_members add column if not exists left_at timestamp with time zone;

create table if not exists public.koen_rows (
  id uuid default gen_random_uuid() not null,
  koen_id uuid not null,
  label text not null,
  group_label text,
  minutes integer,
  memo text,
  sort_order integer default 0 not null
);
alter table public.koen_rows add column if not exists id uuid;
alter table public.koen_rows add column if not exists koen_id uuid;
alter table public.koen_rows add column if not exists label text;
alter table public.koen_rows add column if not exists group_label text;
alter table public.koen_rows add column if not exists minutes integer;
alter table public.koen_rows add column if not exists memo text;
alter table public.koen_rows add column if not exists sort_order integer;

create table if not exists public.koen_session_changes (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  what text not null,
  changed_by uuid,
  changed_at timestamp with time zone default now() not null
);
alter table public.koen_session_changes add column if not exists id uuid;
alter table public.koen_session_changes add column if not exists session_id uuid;
alter table public.koen_session_changes add column if not exists what text;
alter table public.koen_session_changes add column if not exists changed_by uuid;
alter table public.koen_session_changes add column if not exists changed_at timestamp with time zone;

create table if not exists public.koen_sessions (
  id uuid default gen_random_uuid() not null,
  koen_id uuid not null,
  kind text not null,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone,
  place text,
  note text,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);
alter table public.koen_sessions add column if not exists id uuid;
alter table public.koen_sessions add column if not exists koen_id uuid;
alter table public.koen_sessions add column if not exists kind text;
alter table public.koen_sessions add column if not exists starts_at timestamp with time zone;
alter table public.koen_sessions add column if not exists ends_at timestamp with time zone;
alter table public.koen_sessions add column if not exists place text;
alter table public.koen_sessions add column if not exists note text;
alter table public.koen_sessions add column if not exists canceled_at timestamp with time zone;
alter table public.koen_sessions add column if not exists created_at timestamp with time zone;

create table if not exists public.koen_slots (
  id uuid default gen_random_uuid() not null,
  koen_id uuid not null,
  label text not null,
  slot_kind text not null,
  sort_order integer default 0 not null
);
alter table public.koen_slots add column if not exists id uuid;
alter table public.koen_slots add column if not exists koen_id uuid;
alter table public.koen_slots add column if not exists label text;
alter table public.koen_slots add column if not exists slot_kind text;
alter table public.koen_slots add column if not exists sort_order integer;

create table if not exists public.lesson_ng_dates (
  round_id uuid not null,
  user_id uuid not null,
  ng_on date not null
);
alter table public.lesson_ng_dates add column if not exists round_id uuid;
alter table public.lesson_ng_dates add column if not exists user_id uuid;
alter table public.lesson_ng_dates add column if not exists ng_on date;

create table if not exists public.lesson_prefs (
  round_id uuid not null,
  user_id uuid not null,
  slot_key text not null,
  level smallint not null,
  updated_at timestamp with time zone default now() not null
);
alter table public.lesson_prefs add column if not exists round_id uuid;
alter table public.lesson_prefs add column if not exists user_id uuid;
alter table public.lesson_prefs add column if not exists slot_key text;
alter table public.lesson_prefs add column if not exists level smallint;
alter table public.lesson_prefs add column if not exists updated_at timestamp with time zone;

create table if not exists public.lesson_preset_targets (
  preset_id uuid not null,
  teacher_id uuid not null,
  org_id uuid not null,
  created_at timestamp with time zone default now() not null
);
alter table public.lesson_preset_targets add column if not exists preset_id uuid;
alter table public.lesson_preset_targets add column if not exists teacher_id uuid;
alter table public.lesson_preset_targets add column if not exists org_id uuid;
alter table public.lesson_preset_targets add column if not exists created_at timestamp with time zone;

create table if not exists public.lesson_presets (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  name text not null,
  total_count integer not null,
  note text,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  need_count integer
);
alter table public.lesson_presets add column if not exists id uuid;
alter table public.lesson_presets add column if not exists org_id uuid;
alter table public.lesson_presets add column if not exists name text;
alter table public.lesson_presets add column if not exists total_count integer;
alter table public.lesson_presets add column if not exists note text;
alter table public.lesson_presets add column if not exists created_by uuid;
alter table public.lesson_presets add column if not exists created_at timestamp with time zone;
alter table public.lesson_presets add column if not exists updated_at timestamp with time zone;
alter table public.lesson_presets add column if not exists need_count integer;

create table if not exists public.lesson_rounds (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  teacher_id uuid,
  name text not null,
  period_from date not null,
  period_to date not null,
  due_on date,
  status text default 'open'::text not null,
  confirmed_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);
alter table public.lesson_rounds add column if not exists id uuid;
alter table public.lesson_rounds add column if not exists org_id uuid;
alter table public.lesson_rounds add column if not exists teacher_id uuid;
alter table public.lesson_rounds add column if not exists name text;
alter table public.lesson_rounds add column if not exists period_from date;
alter table public.lesson_rounds add column if not exists period_to date;
alter table public.lesson_rounds add column if not exists due_on date;
alter table public.lesson_rounds add column if not exists status text;
alter table public.lesson_rounds add column if not exists confirmed_at timestamp with time zone;
alter table public.lesson_rounds add column if not exists created_by uuid;
alter table public.lesson_rounds add column if not exists created_at timestamp with time zone;

create table if not exists public.lessons (
  id uuid default gen_random_uuid() not null,
  link_id uuid,
  scheduled_at timestamp with time zone not null,
  duration_minutes integer default 60,
  note text default ''::text,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  org_id uuid,
  teacher_id uuid,
  student_id uuid,
  attendance text,
  attendance_at timestamp with time zone,
  attendance_by uuid,
  student_notice text,
  student_notice_at timestamp with time zone,
  place_id uuid,
  kind text
);
alter table public.lessons add column if not exists id uuid;
alter table public.lessons add column if not exists link_id uuid;
alter table public.lessons add column if not exists scheduled_at timestamp with time zone;
alter table public.lessons add column if not exists duration_minutes integer;
alter table public.lessons add column if not exists note text;
alter table public.lessons add column if not exists created_by uuid;
alter table public.lessons add column if not exists created_at timestamp with time zone;
alter table public.lessons add column if not exists org_id uuid;
alter table public.lessons add column if not exists teacher_id uuid;
alter table public.lessons add column if not exists student_id uuid;
alter table public.lessons add column if not exists attendance text;
alter table public.lessons add column if not exists attendance_at timestamp with time zone;
alter table public.lessons add column if not exists attendance_by uuid;
alter table public.lessons add column if not exists student_notice text;
alter table public.lessons add column if not exists student_notice_at timestamp with time zone;
alter table public.lessons add column if not exists place_id uuid;
alter table public.lessons add column if not exists kind text;

create table if not exists public.link_consents (
  id uuid default gen_random_uuid() not null,
  student_id uuid not null,
  teacher_id uuid,
  linked_at timestamp with time zone default now() not null,
  unlinked_at timestamp with time zone,
  unlinked_by text,
  agreement_version text not null,
  created_at timestamp with time zone default now() not null
);
alter table public.link_consents add column if not exists id uuid;
alter table public.link_consents add column if not exists student_id uuid;
alter table public.link_consents add column if not exists teacher_id uuid;
alter table public.link_consents add column if not exists linked_at timestamp with time zone;
alter table public.link_consents add column if not exists unlinked_at timestamp with time zone;
alter table public.link_consents add column if not exists unlinked_by text;
alter table public.link_consents add column if not exists agreement_version text;
alter table public.link_consents add column if not exists created_at timestamp with time zone;

create table if not exists public.matching_cuts (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  target_user_id uuid not null,
  kind text not null,
  org_id uuid not null,
  created_at timestamp with time zone default now() not null
);
alter table public.matching_cuts add column if not exists id uuid;
alter table public.matching_cuts add column if not exists user_id uuid;
alter table public.matching_cuts add column if not exists target_user_id uuid;
alter table public.matching_cuts add column if not exists kind text;
alter table public.matching_cuts add column if not exists org_id uuid;
alter table public.matching_cuts add column if not exists created_at timestamp with time zone;

create table if not exists public.matching_reports (
  id uuid default gen_random_uuid() not null,
  reporter_user_id uuid not null,
  target_user_id uuid not null,
  org_id uuid not null,
  reason text not null,
  detail text,
  created_at timestamp with time zone default now() not null,
  outcome text,
  reviewed_at timestamp with time zone,
  review_note text
);
alter table public.matching_reports add column if not exists id uuid;
alter table public.matching_reports add column if not exists reporter_user_id uuid;
alter table public.matching_reports add column if not exists target_user_id uuid;
alter table public.matching_reports add column if not exists org_id uuid;
alter table public.matching_reports add column if not exists reason text;
alter table public.matching_reports add column if not exists detail text;
alter table public.matching_reports add column if not exists created_at timestamp with time zone;
alter table public.matching_reports add column if not exists outcome text;
alter table public.matching_reports add column if not exists reviewed_at timestamp with time zone;
alter table public.matching_reports add column if not exists review_note text;

create table if not exists public.memberships (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  user_id uuid not null,
  role text not null,
  created_at timestamp with time zone default now() not null,
  display_title text,
  display_title_updated_by uuid,
  display_title_updated_at timestamp with time zone,
  grade_label text,
  post_id uuid,
  division_id uuid,
  verified_at timestamp with time zone,
  verified_by uuid
);
alter table public.memberships add column if not exists id uuid;
alter table public.memberships add column if not exists org_id uuid;
alter table public.memberships add column if not exists user_id uuid;
alter table public.memberships add column if not exists role text;
alter table public.memberships add column if not exists created_at timestamp with time zone;
alter table public.memberships add column if not exists display_title text;
alter table public.memberships add column if not exists display_title_updated_by uuid;
alter table public.memberships add column if not exists display_title_updated_at timestamp with time zone;
alter table public.memberships add column if not exists grade_label text;
alter table public.memberships add column if not exists post_id uuid;
alter table public.memberships add column if not exists division_id uuid;
alter table public.memberships add column if not exists verified_at timestamp with time zone;
alter table public.memberships add column if not exists verified_by uuid;

create table if not exists public.minor_billing_consents (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  age_band text not null,
  policy_version text not null,
  displayed_price_yen integer not null,
  plan text not null,
  declared_at timestamp with time zone default now() not null
);
alter table public.minor_billing_consents add column if not exists id uuid;
alter table public.minor_billing_consents add column if not exists user_id uuid;
alter table public.minor_billing_consents add column if not exists age_band text;
alter table public.minor_billing_consents add column if not exists policy_version text;
alter table public.minor_billing_consents add column if not exists displayed_price_yen integer;
alter table public.minor_billing_consents add column if not exists plan text;
alter table public.minor_billing_consents add column if not exists declared_at timestamp with time zone;

create table if not exists public.monka_read_log (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  viewer_user_id uuid not null,
  target_monka_id uuid not null,
  viewed_at timestamp with time zone default now() not null,
  reason text not null,
  reason_kind text,
  reason_note text,
  post_id uuid,
  post_name_at text,
  name_at text,
  target_name_at text
);
alter table public.monka_read_log add column if not exists id uuid;
alter table public.monka_read_log add column if not exists org_id uuid;
alter table public.monka_read_log add column if not exists viewer_user_id uuid;
alter table public.monka_read_log add column if not exists target_monka_id uuid;
alter table public.monka_read_log add column if not exists viewed_at timestamp with time zone;
alter table public.monka_read_log add column if not exists reason text;
alter table public.monka_read_log add column if not exists reason_kind text;
alter table public.monka_read_log add column if not exists reason_note text;
alter table public.monka_read_log add column if not exists post_id uuid;
alter table public.monka_read_log add column if not exists post_name_at text;
alter table public.monka_read_log add column if not exists name_at text;
alter table public.monka_read_log add column if not exists target_name_at text;

create table if not exists public.my_periods (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  ord smallint not null,
  name text not null,
  start_min smallint not null,
  end_min smallint not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  org_id uuid
);
alter table public.my_periods add column if not exists id uuid;
alter table public.my_periods add column if not exists user_id uuid;
alter table public.my_periods add column if not exists ord smallint;
alter table public.my_periods add column if not exists name text;
alter table public.my_periods add column if not exists start_min smallint;
alter table public.my_periods add column if not exists end_min smallint;
alter table public.my_periods add column if not exists created_at timestamp with time zone;
alter table public.my_periods add column if not exists updated_at timestamp with time zone;
alter table public.my_periods add column if not exists org_id uuid;

create table if not exists public.my_timetable (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  weekday smallint not null,
  period_id uuid not null,
  title text,
  teacher text,
  room text,
  memo text,
  unavailable boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
alter table public.my_timetable add column if not exists id uuid;
alter table public.my_timetable add column if not exists user_id uuid;
alter table public.my_timetable add column if not exists weekday smallint;
alter table public.my_timetable add column if not exists period_id uuid;
alter table public.my_timetable add column if not exists title text;
alter table public.my_timetable add column if not exists teacher text;
alter table public.my_timetable add column if not exists room text;
alter table public.my_timetable add column if not exists memo text;
alter table public.my_timetable add column if not exists unavailable boolean;
alter table public.my_timetable add column if not exists created_at timestamp with time zone;
alter table public.my_timetable add column if not exists updated_at timestamp with time zone;

create table if not exists public.notes (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  kind text default 'practice'::text not null,
  body text default ''::text not null,
  source_label text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  lesson_on date,
  teacher_label text,
  repertoire_name text,
  said_text text,
  next_action text,
  gained_text text
);
alter table public.notes add column if not exists id uuid;
alter table public.notes add column if not exists user_id uuid;
alter table public.notes add column if not exists kind text;
alter table public.notes add column if not exists body text;
alter table public.notes add column if not exists source_label text;
alter table public.notes add column if not exists created_at timestamp with time zone;
alter table public.notes add column if not exists updated_at timestamp with time zone;
alter table public.notes add column if not exists deleted_at timestamp with time zone;
alter table public.notes add column if not exists lesson_on date;
alter table public.notes add column if not exists teacher_label text;
alter table public.notes add column if not exists repertoire_name text;
alter table public.notes add column if not exists said_text text;
alter table public.notes add column if not exists next_action text;
alter table public.notes add column if not exists gained_text text;

create table if not exists public.notice_batches (
  id uuid default gen_random_uuid() not null,
  type text not null,
  label text,
  frozen_count integer default 0 not null,
  frozen_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);
alter table public.notice_batches add column if not exists id uuid;
alter table public.notice_batches add column if not exists type text;
alter table public.notice_batches add column if not exists label text;
alter table public.notice_batches add column if not exists frozen_count integer;
alter table public.notice_batches add column if not exists frozen_at timestamp with time zone;
alter table public.notice_batches add column if not exists created_at timestamp with time zone;

create table if not exists public.notice_targets (
  id uuid default gen_random_uuid() not null,
  batch_id uuid not null,
  user_id uuid not null,
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  progressed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);
alter table public.notice_targets add column if not exists id uuid;
alter table public.notice_targets add column if not exists batch_id uuid;
alter table public.notice_targets add column if not exists user_id uuid;
alter table public.notice_targets add column if not exists sent_at timestamp with time zone;
alter table public.notice_targets add column if not exists opened_at timestamp with time zone;
alter table public.notice_targets add column if not exists progressed_at timestamp with time zone;
alter table public.notice_targets add column if not exists created_at timestamp with time zone;

create table if not exists public.ops_alerts (
  id uuid default gen_random_uuid() not null,
  kind text not null,
  detail text,
  created_at timestamp with time zone default now() not null,
  notified_at timestamp with time zone
);
alter table public.ops_alerts add column if not exists id uuid;
alter table public.ops_alerts add column if not exists kind text;
alter table public.ops_alerts add column if not exists detail text;
alter table public.ops_alerts add column if not exists created_at timestamp with time zone;
alter table public.ops_alerts add column if not exists notified_at timestamp with time zone;

create table if not exists public.ops_audit_log (
  id uuid default gen_random_uuid() not null,
  org_id uuid,
  org_name_at text,
  actor_id uuid,
  actor_post_at text,
  action text not null,
  target_kind text not null,
  target_id text,
  detail jsonb,
  created_at timestamp with time zone default now() not null
);
alter table public.ops_audit_log add column if not exists id uuid;
alter table public.ops_audit_log add column if not exists org_id uuid;
alter table public.ops_audit_log add column if not exists org_name_at text;
alter table public.ops_audit_log add column if not exists actor_id uuid;
alter table public.ops_audit_log add column if not exists actor_post_at text;
alter table public.ops_audit_log add column if not exists action text;
alter table public.ops_audit_log add column if not exists target_kind text;
alter table public.ops_audit_log add column if not exists target_id text;
alter table public.ops_audit_log add column if not exists detail jsonb;
alter table public.ops_audit_log add column if not exists created_at timestamp with time zone;

create table if not exists public.org_billing (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  atesaki_name text,
  atesaki_email text,
  atesaki_user_id uuid,
  atesaki_changed_at timestamp with time zone,
  atesaki_changed_by uuid,
  stripe_customer_id text,
  method text,
  next_billing_date date,
  created_at timestamp with time zone default now() not null,
  invoice_no text,
  invoice_issuer text,
  bill_dept text,
  bill_contact text
);
alter table public.org_billing add column if not exists id uuid;
alter table public.org_billing add column if not exists org_id uuid;
alter table public.org_billing add column if not exists atesaki_name text;
alter table public.org_billing add column if not exists atesaki_email text;
alter table public.org_billing add column if not exists atesaki_user_id uuid;
alter table public.org_billing add column if not exists atesaki_changed_at timestamp with time zone;
alter table public.org_billing add column if not exists atesaki_changed_by uuid;
alter table public.org_billing add column if not exists stripe_customer_id text;
alter table public.org_billing add column if not exists method text;
alter table public.org_billing add column if not exists next_billing_date date;
alter table public.org_billing add column if not exists created_at timestamp with time zone;
alter table public.org_billing add column if not exists invoice_no text;
alter table public.org_billing add column if not exists invoice_issuer text;
alter table public.org_billing add column if not exists bill_dept text;
alter table public.org_billing add column if not exists bill_contact text;

create table if not exists public.org_billing_log (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  actor_id uuid,
  what text not null,
  created_at timestamp with time zone default now() not null
);
alter table public.org_billing_log add column if not exists id uuid;
alter table public.org_billing_log add column if not exists org_id uuid;
alter table public.org_billing_log add column if not exists actor_id uuid;
alter table public.org_billing_log add column if not exists what text;
alter table public.org_billing_log add column if not exists created_at timestamp with time zone;

create table if not exists public.org_contracts (
  org_id uuid not null,
  contract_start date not null,
  is_pilot boolean default false not null,
  free_until date not null,
  paid_from date not null,
  cycle text not null,
  created_at timestamp with time zone default now() not null
);
alter table public.org_contracts add column if not exists org_id uuid;
alter table public.org_contracts add column if not exists contract_start date;
alter table public.org_contracts add column if not exists is_pilot boolean;
alter table public.org_contracts add column if not exists free_until date;
alter table public.org_contracts add column if not exists paid_from date;
alter table public.org_contracts add column if not exists cycle text;
alter table public.org_contracts add column if not exists created_at timestamp with time zone;

create table if not exists public.org_divisions (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  kind text not null,
  name text not null,
  parent_id uuid,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);
alter table public.org_divisions add column if not exists id uuid;
alter table public.org_divisions add column if not exists org_id uuid;
alter table public.org_divisions add column if not exists kind text;
alter table public.org_divisions add column if not exists name text;
alter table public.org_divisions add column if not exists parent_id uuid;
alter table public.org_divisions add column if not exists sort_order integer;
alter table public.org_divisions add column if not exists created_at timestamp with time zone;

create table if not exists public.org_event_participants (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  org_event_id uuid not null,
  joined_at timestamp with time zone default now() not null,
  dismissed_at timestamp with time zone
);
alter table public.org_event_participants add column if not exists id uuid;
alter table public.org_event_participants add column if not exists user_id uuid;
alter table public.org_event_participants add column if not exists org_event_id uuid;
alter table public.org_event_participants add column if not exists joined_at timestamp with time zone;
alter table public.org_event_participants add column if not exists dismissed_at timestamp with time zone;

create table if not exists public.org_events (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  event_date date not null,
  start_time time without time zone,
  end_time time without time zone,
  kind text default 'その他'::text not null,
  title text default ''::text not null,
  previous_date date,
  withdrawn_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  place text,
  target_grades text[] default '{}'::text[] not null,
  target_courses text[] default '{}'::text[] not null
);
alter table public.org_events add column if not exists id uuid;
alter table public.org_events add column if not exists org_id uuid;
alter table public.org_events add column if not exists event_date date;
alter table public.org_events add column if not exists start_time time without time zone;
alter table public.org_events add column if not exists end_time time without time zone;
alter table public.org_events add column if not exists kind text;
alter table public.org_events add column if not exists title text;
alter table public.org_events add column if not exists previous_date date;
alter table public.org_events add column if not exists withdrawn_at timestamp with time zone;
alter table public.org_events add column if not exists created_by uuid;
alter table public.org_events add column if not exists created_at timestamp with time zone;
alter table public.org_events add column if not exists updated_at timestamp with time zone;
alter table public.org_events add column if not exists place text;
alter table public.org_events add column if not exists target_grades text[];
alter table public.org_events add column if not exists target_courses text[];

create table if not exists public.org_invitations (
  code text not null,
  org_id uuid not null,
  invited_by uuid not null,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  used_by uuid
);
alter table public.org_invitations add column if not exists code text;
alter table public.org_invitations add column if not exists org_id uuid;
alter table public.org_invitations add column if not exists invited_by uuid;
alter table public.org_invitations add column if not exists expires_at timestamp with time zone;
alter table public.org_invitations add column if not exists used_at timestamp with time zone;
alter table public.org_invitations add column if not exists used_by uuid;

create table if not exists public.org_message_drafts (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  author_id uuid not null,
  teacher_id uuid,
  title text,
  body text default ''::text not null,
  target_division_ids uuid[] default '{}'::uuid[] not null,
  target_grade_years integer[] default '{}'::integer[] not null,
  target_user_ids uuid[] default '{}'::uuid[] not null,
  kind text default 'draft'::text not null,
  fail_reason text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
alter table public.org_message_drafts add column if not exists id uuid;
alter table public.org_message_drafts add column if not exists org_id uuid;
alter table public.org_message_drafts add column if not exists author_id uuid;
alter table public.org_message_drafts add column if not exists teacher_id uuid;
alter table public.org_message_drafts add column if not exists title text;
alter table public.org_message_drafts add column if not exists body text;
alter table public.org_message_drafts add column if not exists target_division_ids uuid[];
alter table public.org_message_drafts add column if not exists target_grade_years integer[];
alter table public.org_message_drafts add column if not exists target_user_ids uuid[];
alter table public.org_message_drafts add column if not exists kind text;
alter table public.org_message_drafts add column if not exists fail_reason text;
alter table public.org_message_drafts add column if not exists created_at timestamp with time zone;
alter table public.org_message_drafts add column if not exists updated_at timestamp with time zone;

create table if not exists public.org_message_reads (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  teacher_id uuid,
  reader_id uuid not null,
  reader_role text not null,
  read_at timestamp with time zone default now() not null
);
alter table public.org_message_reads add column if not exists id uuid;
alter table public.org_message_reads add column if not exists org_id uuid;
alter table public.org_message_reads add column if not exists teacher_id uuid;
alter table public.org_message_reads add column if not exists reader_id uuid;
alter table public.org_message_reads add column if not exists reader_role text;
alter table public.org_message_reads add column if not exists read_at timestamp with time zone;

create table if not exists public.org_messages (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  teacher_id uuid,
  author_id uuid not null,
  body text not null,
  created_at timestamp with time zone default now() not null,
  withdrawn_at timestamp with time zone,
  title text,
  target_division_ids uuid[] default '{}'::uuid[] not null,
  target_grade_years integer[] default '{}'::integer[] not null,
  target_user_ids uuid[] default '{}'::uuid[] not null,
  author_name_at text,
  teacher_name_at text
);
alter table public.org_messages add column if not exists id uuid;
alter table public.org_messages add column if not exists org_id uuid;
alter table public.org_messages add column if not exists teacher_id uuid;
alter table public.org_messages add column if not exists author_id uuid;
alter table public.org_messages add column if not exists body text;
alter table public.org_messages add column if not exists created_at timestamp with time zone;
alter table public.org_messages add column if not exists withdrawn_at timestamp with time zone;
alter table public.org_messages add column if not exists title text;
alter table public.org_messages add column if not exists target_division_ids uuid[];
alter table public.org_messages add column if not exists target_grade_years integer[];
alter table public.org_messages add column if not exists target_user_ids uuid[];
alter table public.org_messages add column if not exists author_name_at text;
alter table public.org_messages add column if not exists teacher_name_at text;

create table if not exists public.org_periods (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  ord smallint not null,
  name text not null,
  start_min smallint not null,
  end_min smallint not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
alter table public.org_periods add column if not exists id uuid;
alter table public.org_periods add column if not exists org_id uuid;
alter table public.org_periods add column if not exists ord smallint;
alter table public.org_periods add column if not exists name text;
alter table public.org_periods add column if not exists start_min smallint;
alter table public.org_periods add column if not exists end_min smallint;
alter table public.org_periods add column if not exists created_at timestamp with time zone;
alter table public.org_periods add column if not exists updated_at timestamp with time zone;

create table if not exists public.org_places (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  name text not null,
  ord smallint default 0 not null,
  created_at timestamp with time zone default now() not null
);
alter table public.org_places add column if not exists id uuid;
alter table public.org_places add column if not exists org_id uuid;
alter table public.org_places add column if not exists name text;
alter table public.org_places add column if not exists ord smallint;
alter table public.org_places add column if not exists created_at timestamp with time zone;

create table if not exists public.org_post_perm_log (
  id uuid default gen_random_uuid() not null,
  changed_at timestamp with time zone default now() not null,
  changed_by uuid,
  changed_by_kind text default 'person'::text not null,
  org_id uuid not null,
  post_id uuid,
  post_name_at text,
  perms_before jsonb,
  perms_after jsonb,
  added text[] default '{}'::text[] not null,
  removed text[] default '{}'::text[] not null,
  op text not null
);
alter table public.org_post_perm_log add column if not exists id uuid;
alter table public.org_post_perm_log add column if not exists changed_at timestamp with time zone;
alter table public.org_post_perm_log add column if not exists changed_by uuid;
alter table public.org_post_perm_log add column if not exists changed_by_kind text;
alter table public.org_post_perm_log add column if not exists org_id uuid;
alter table public.org_post_perm_log add column if not exists post_id uuid;
alter table public.org_post_perm_log add column if not exists post_name_at text;
alter table public.org_post_perm_log add column if not exists perms_before jsonb;
alter table public.org_post_perm_log add column if not exists perms_after jsonb;
alter table public.org_post_perm_log add column if not exists added text[];
alter table public.org_post_perm_log add column if not exists removed text[];
alter table public.org_post_perm_log add column if not exists op text;

create table if not exists public.org_posts (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  name text not null,
  perms jsonb default '{}'::jsonb not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);
alter table public.org_posts add column if not exists id uuid;
alter table public.org_posts add column if not exists org_id uuid;
alter table public.org_posts add column if not exists name text;
alter table public.org_posts add column if not exists perms jsonb;
alter table public.org_posts add column if not exists sort_order integer;
alter table public.org_posts add column if not exists created_at timestamp with time zone;

create table if not exists public.organizations (
  id uuid default gen_random_uuid() not null,
  name text not null,
  kind text default 'solo'::text not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  contract_owner_user_id uuid
);
alter table public.organizations add column if not exists id uuid;
alter table public.organizations add column if not exists name text;
alter table public.organizations add column if not exists kind text;
alter table public.organizations add column if not exists created_by uuid;
alter table public.organizations add column if not exists created_at timestamp with time zone;
alter table public.organizations add column if not exists contract_owner_user_id uuid;

create table if not exists public.overlap_notices (
  lesson_id uuid not null,
  status text default 'まだ'::text not null,
  updated_at timestamp with time zone default now() not null
);
alter table public.overlap_notices add column if not exists lesson_id uuid;
alter table public.overlap_notices add column if not exists status text;
alter table public.overlap_notices add column if not exists updated_at timestamp with time zone;

create table if not exists public.page_inquiries (
  id uuid default gen_random_uuid() not null,
  owner_user_id uuid not null,
  from_name text not null,
  from_email text not null,
  body text not null,
  created_at timestamp with time zone default now() not null,
  forwarded_at timestamp with time zone
);
alter table public.page_inquiries add column if not exists id uuid;
alter table public.page_inquiries add column if not exists owner_user_id uuid;
alter table public.page_inquiries add column if not exists from_name text;
alter table public.page_inquiries add column if not exists from_email text;
alter table public.page_inquiries add column if not exists body text;
alter table public.page_inquiries add column if not exists created_at timestamp with time zone;
alter table public.page_inquiries add column if not exists forwarded_at timestamp with time zone;

create table if not exists public.page_types_owned (
  user_id uuid not null,
  type_key text not null,
  source text not null,
  acquired_at timestamp with time zone default now() not null
);
alter table public.page_types_owned add column if not exists user_id uuid;
alter table public.page_types_owned add column if not exists type_key text;
alter table public.page_types_owned add column if not exists source text;
alter table public.page_types_owned add column if not exists acquired_at timestamp with time zone;

create table if not exists public.payment_records (
  id uuid default gen_random_uuid() not null,
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
  severed_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);
alter table public.payment_records add column if not exists id uuid;
alter table public.payment_records add column if not exists kind text;
alter table public.payment_records add column if not exists stripe_customer_id text;
alter table public.payment_records add column if not exists stripe_subscription_id text;
alter table public.payment_records add column if not exists stripe_session_id text;
alter table public.payment_records add column if not exists stripe_payment_intent text;
alter table public.payment_records add column if not exists stripe_price_id text;
alter table public.payment_records add column if not exists plan text;
alter table public.payment_records add column if not exists status text;
alter table public.payment_records add column if not exists amount_yen integer;
alter table public.payment_records add column if not exists started_at timestamp with time zone;
alter table public.payment_records add column if not exists ends_at timestamp with time zone;
alter table public.payment_records add column if not exists current_period_end timestamp with time zone;
alter table public.payment_records add column if not exists cancelled_at timestamp with time zone;
alter table public.payment_records add column if not exists severed_at timestamp with time zone;
alter table public.payment_records add column if not exists created_at timestamp with time zone;

create table if not exists public.performance_results (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  performance_id uuid not null,
  result text not null,
  answered_at timestamp with time zone default now() not null
);
alter table public.performance_results add column if not exists id uuid;
alter table public.performance_results add column if not exists user_id uuid;
alter table public.performance_results add column if not exists performance_id uuid;
alter table public.performance_results add column if not exists result text;
alter table public.performance_results add column if not exists answered_at timestamp with time zone;

create table if not exists public.performances (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  performed_on date not null,
  kind text not null,
  label text,
  org_event_id uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  repertoire_name text,
  morning_words text
);
alter table public.performances add column if not exists id uuid;
alter table public.performances add column if not exists user_id uuid;
alter table public.performances add column if not exists performed_on date;
alter table public.performances add column if not exists kind text;
alter table public.performances add column if not exists label text;
alter table public.performances add column if not exists org_event_id uuid;
alter table public.performances add column if not exists created_at timestamp with time zone;
alter table public.performances add column if not exists updated_at timestamp with time zone;
alter table public.performances add column if not exists repertoire_name text;
alter table public.performances add column if not exists morning_words text;

create table if not exists public.period_markers (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  marked_on date not null,
  created_at timestamp with time zone default now() not null
);
alter table public.period_markers add column if not exists id uuid;
alter table public.period_markers add column if not exists user_id uuid;
alter table public.period_markers add column if not exists marked_on date;
alter table public.period_markers add column if not exists created_at timestamp with time zone;

create table if not exists public.portfolio_entries (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  kind text not null,
  title text not null,
  detail text,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);
alter table public.portfolio_entries add column if not exists id uuid;
alter table public.portfolio_entries add column if not exists user_id uuid;
alter table public.portfolio_entries add column if not exists kind text;
alter table public.portfolio_entries add column if not exists title text;
alter table public.portfolio_entries add column if not exists detail text;
alter table public.portfolio_entries add column if not exists sort_order integer;
alter table public.portfolio_entries add column if not exists created_at timestamp with time zone;

create table if not exists public.portfolio_recordings (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  title text not null,
  url text not null,
  detail text,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);
alter table public.portfolio_recordings add column if not exists id uuid;
alter table public.portfolio_recordings add column if not exists user_id uuid;
alter table public.portfolio_recordings add column if not exists title text;
alter table public.portfolio_recordings add column if not exists url text;
alter table public.portfolio_recordings add column if not exists detail text;
alter table public.portfolio_recordings add column if not exists sort_order integer;
alter table public.portfolio_recordings add column if not exists created_at timestamp with time zone;

create table if not exists public.portfolios (
  user_id uuid not null,
  display_name text,
  instrument text,
  bio text,
  regions text[] default '{}'::text[] not null,
  visibility text default 'self'::text not null,
  public_slug text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  paper_type text,
  web_type text,
  field text,
  trial_until timestamp with time zone,
  published_at timestamp with time zone
);
alter table public.portfolios add column if not exists user_id uuid;
alter table public.portfolios add column if not exists display_name text;
alter table public.portfolios add column if not exists instrument text;
alter table public.portfolios add column if not exists bio text;
alter table public.portfolios add column if not exists regions text[];
alter table public.portfolios add column if not exists visibility text;
alter table public.portfolios add column if not exists public_slug text;
alter table public.portfolios add column if not exists created_at timestamp with time zone;
alter table public.portfolios add column if not exists updated_at timestamp with time zone;
alter table public.portfolios add column if not exists paper_type text;
alter table public.portfolios add column if not exists web_type text;
alter table public.portfolios add column if not exists field text;
alter table public.portfolios add column if not exists trial_until timestamp with time zone;
alter table public.portfolios add column if not exists published_at timestamp with time zone;

create table if not exists public.post_change_log (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  target_user_id uuid not null,
  from_post_id uuid,
  from_post_name text,
  to_post_id uuid,
  to_post_name text,
  changed_at timestamp with time zone default now() not null,
  changed_by uuid not null
);
alter table public.post_change_log add column if not exists id uuid;
alter table public.post_change_log add column if not exists org_id uuid;
alter table public.post_change_log add column if not exists target_user_id uuid;
alter table public.post_change_log add column if not exists from_post_id uuid;
alter table public.post_change_log add column if not exists from_post_name text;
alter table public.post_change_log add column if not exists to_post_id uuid;
alter table public.post_change_log add column if not exists to_post_name text;
alter table public.post_change_log add column if not exists changed_at timestamp with time zone;
alter table public.post_change_log add column if not exists changed_by uuid;

create table if not exists public.postings (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  owner_user_id uuid not null,
  title text,
  kind text not null,
  piece text,
  days date[] not null,
  need_all_days boolean default false not null,
  fee_amount integer,
  fee_unit text,
  sodan boolean default false not null,
  status text default 'open'::text not null,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone
);
alter table public.postings add column if not exists id uuid;
alter table public.postings add column if not exists org_id uuid;
alter table public.postings add column if not exists owner_user_id uuid;
alter table public.postings add column if not exists title text;
alter table public.postings add column if not exists kind text;
alter table public.postings add column if not exists piece text;
alter table public.postings add column if not exists days date[];
alter table public.postings add column if not exists need_all_days boolean;
alter table public.postings add column if not exists fee_amount integer;
alter table public.postings add column if not exists fee_unit text;
alter table public.postings add column if not exists sodan boolean;
alter table public.postings add column if not exists status text;
alter table public.postings add column if not exists created_at timestamp with time zone;
alter table public.postings add column if not exists expires_at timestamp with time zone;

create table if not exists public.profiles (
  id uuid not null,
  name text,
  email text,
  occupation text,
  school text,
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  height_cm numeric,
  voice_type text,
  nutrition_phase text default '維持'::text,
  protein_coefficient numeric default 1.6,
  age integer,
  sex text,
  character_points_spent integer default 0,
  character_equipped jsonb default '{}'::jsonb,
  vocal_range_low text,
  vocal_range_high text,
  technical_goal text,
  health_notes text,
  garden_theme text default 'rose'::text,
  vocal_profession text default 'singer'::text,
  track_cycle boolean default false,
  comfort_range_low text,
  comfort_range_high text,
  conditions text[] default '{}'::text[],
  onboarding_completed boolean default false,
  consent_health_data_at timestamp with time zone,
  consent_stats_use_at timestamp with time zone,
  consent_policy_version text,
  professions text[] default '{}'::text[],
  goal_focus text,
  practice_goal text,
  practice_goal_tags text[] default '{}'::text[],
  practice_goal_started_at date,
  practice_reviews jsonb default '[]'::jsonb,
  folded_groups text[] default '{}'::text[],
  pwa_install_prompted_at timestamp with time zone,
  pwa_installed_at timestamp with time zone,
  survey_day7_shown_at timestamp with time zone,
  survey_day7_response text,
  line_user_id text,
  line_link_code text,
  line_linked_at timestamp with time zone,
  line_notification_enabled boolean default true,
  day_record_boundary_hour integer default 21,
  display_name text default ''::text,
  teacher_beta_access boolean default false,
  record_mode text default 'full'::text not null,
  allergies text[] default '{}'::text[],
  regular_medications text[] default '{}'::text[],
  deleted_at timestamp with time zone,
  cycle_show_on_home boolean default true not null,
  data_region text default 'jp'::text not null,
  display_scale text default 'normal'::text not null,
  simple_display boolean default false not null,
  voice_mix jsonb,
  voice_mix_edited_at timestamp with time zone,
  occupation_migrated_from text,
  occupation_notice_shown_at timestamp with time zone,
  voice_occupation text,
  is_under_18 boolean,
  age_question_shown_at timestamp with time zone,
  is_tester boolean default false not null,
  cohort text default 'general'::text not null,
  cohort_since timestamp with time zone,
  is_internal boolean default false not null,
  consent_health_data_withdrawn_at timestamp with time zone,
  age_band text,
  age_band_answered_at timestamp with time zone,
  guardian_consent_declared_at timestamp with time zone,
  otp_migration_declined_at timestamp with time zone,
  otp_migration_completed_at timestamp with time zone,
  otp_migration_steps text[] default '{}'::text[] not null,
  reauth_at timestamp with time zone,
  reflux_care_consent_at timestamp with time zone,
  kana text
);
alter table public.profiles add column if not exists id uuid;
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists occupation text;
alter table public.profiles add column if not exists school text;
alter table public.profiles add column if not exists is_admin boolean;
alter table public.profiles add column if not exists created_at timestamp with time zone;
alter table public.profiles add column if not exists height_cm numeric;
alter table public.profiles add column if not exists voice_type text;
alter table public.profiles add column if not exists nutrition_phase text;
alter table public.profiles add column if not exists protein_coefficient numeric;
alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists sex text;
alter table public.profiles add column if not exists character_points_spent integer;
alter table public.profiles add column if not exists character_equipped jsonb;
alter table public.profiles add column if not exists vocal_range_low text;
alter table public.profiles add column if not exists vocal_range_high text;
alter table public.profiles add column if not exists technical_goal text;
alter table public.profiles add column if not exists health_notes text;
alter table public.profiles add column if not exists garden_theme text;
alter table public.profiles add column if not exists vocal_profession text;
alter table public.profiles add column if not exists track_cycle boolean;
alter table public.profiles add column if not exists comfort_range_low text;
alter table public.profiles add column if not exists comfort_range_high text;
alter table public.profiles add column if not exists conditions text[];
alter table public.profiles add column if not exists onboarding_completed boolean;
alter table public.profiles add column if not exists consent_health_data_at timestamp with time zone;
alter table public.profiles add column if not exists consent_stats_use_at timestamp with time zone;
alter table public.profiles add column if not exists consent_policy_version text;
alter table public.profiles add column if not exists professions text[];
alter table public.profiles add column if not exists goal_focus text;
alter table public.profiles add column if not exists practice_goal text;
alter table public.profiles add column if not exists practice_goal_tags text[];
alter table public.profiles add column if not exists practice_goal_started_at date;
alter table public.profiles add column if not exists practice_reviews jsonb;
alter table public.profiles add column if not exists folded_groups text[];
alter table public.profiles add column if not exists pwa_install_prompted_at timestamp with time zone;
alter table public.profiles add column if not exists pwa_installed_at timestamp with time zone;
alter table public.profiles add column if not exists survey_day7_shown_at timestamp with time zone;
alter table public.profiles add column if not exists survey_day7_response text;
alter table public.profiles add column if not exists line_user_id text;
alter table public.profiles add column if not exists line_link_code text;
alter table public.profiles add column if not exists line_linked_at timestamp with time zone;
alter table public.profiles add column if not exists line_notification_enabled boolean;
alter table public.profiles add column if not exists day_record_boundary_hour integer;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists teacher_beta_access boolean;
alter table public.profiles add column if not exists record_mode text;
alter table public.profiles add column if not exists allergies text[];
alter table public.profiles add column if not exists regular_medications text[];
alter table public.profiles add column if not exists deleted_at timestamp with time zone;
alter table public.profiles add column if not exists cycle_show_on_home boolean;
alter table public.profiles add column if not exists data_region text;
alter table public.profiles add column if not exists display_scale text;
alter table public.profiles add column if not exists simple_display boolean;
alter table public.profiles add column if not exists voice_mix jsonb;
alter table public.profiles add column if not exists voice_mix_edited_at timestamp with time zone;
alter table public.profiles add column if not exists occupation_migrated_from text;
alter table public.profiles add column if not exists occupation_notice_shown_at timestamp with time zone;
alter table public.profiles add column if not exists voice_occupation text;
alter table public.profiles add column if not exists is_under_18 boolean;
alter table public.profiles add column if not exists age_question_shown_at timestamp with time zone;
alter table public.profiles add column if not exists is_tester boolean;
alter table public.profiles add column if not exists cohort text;
alter table public.profiles add column if not exists cohort_since timestamp with time zone;
alter table public.profiles add column if not exists is_internal boolean;
alter table public.profiles add column if not exists consent_health_data_withdrawn_at timestamp with time zone;
alter table public.profiles add column if not exists age_band text;
alter table public.profiles add column if not exists age_band_answered_at timestamp with time zone;
alter table public.profiles add column if not exists guardian_consent_declared_at timestamp with time zone;
alter table public.profiles add column if not exists otp_migration_declined_at timestamp with time zone;
alter table public.profiles add column if not exists otp_migration_completed_at timestamp with time zone;
alter table public.profiles add column if not exists otp_migration_steps text[];
alter table public.profiles add column if not exists reauth_at timestamp with time zone;
alter table public.profiles add column if not exists reflux_care_consent_at timestamp with time zone;
alter table public.profiles add column if not exists kana text;

create table if not exists public.project_master (
  user_id uuid not null,
  project_name text not null,
  script_type text,
  speech_speed text,
  is_live boolean default false
);
alter table public.project_master add column if not exists user_id uuid;
alter table public.project_master add column if not exists project_name text;
alter table public.project_master add column if not exists script_type text;
alter table public.project_master add column if not exists speech_speed text;
alter table public.project_master add column if not exists is_live boolean;

create table if not exists public.purchases (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  plan text not null,
  tier text,
  stripe_session_id text,
  stripe_payment_intent text,
  stripe_price_id text,
  amount_yen integer,
  started_at timestamp with time zone default now() not null,
  ends_at timestamp with time zone not null,
  status text default 'active'::text not null,
  created_at timestamp with time zone default now() not null,
  lookup_key text,
  ended_early_at timestamp with time zone,
  refunded_yen integer default 0 not null
);
alter table public.purchases add column if not exists id uuid;
alter table public.purchases add column if not exists user_id uuid;
alter table public.purchases add column if not exists plan text;
alter table public.purchases add column if not exists tier text;
alter table public.purchases add column if not exists stripe_session_id text;
alter table public.purchases add column if not exists stripe_payment_intent text;
alter table public.purchases add column if not exists stripe_price_id text;
alter table public.purchases add column if not exists amount_yen integer;
alter table public.purchases add column if not exists started_at timestamp with time zone;
alter table public.purchases add column if not exists ends_at timestamp with time zone;
alter table public.purchases add column if not exists status text;
alter table public.purchases add column if not exists created_at timestamp with time zone;
alter table public.purchases add column if not exists lookup_key text;
alter table public.purchases add column if not exists ended_early_at timestamp with time zone;
alter table public.purchases add column if not exists refunded_yen integer;

create table if not exists public.questionnaire_responses (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  questionnaire_type text not null,
  response_date date not null,
  item_scores jsonb default '[]'::jsonb not null,
  total_score numeric,
  factor_scores jsonb,
  created_at timestamp with time zone default now() not null
);
alter table public.questionnaire_responses add column if not exists id uuid;
alter table public.questionnaire_responses add column if not exists user_id uuid;
alter table public.questionnaire_responses add column if not exists questionnaire_type text;
alter table public.questionnaire_responses add column if not exists response_date date;
alter table public.questionnaire_responses add column if not exists item_scores jsonb;
alter table public.questionnaire_responses add column if not exists total_score numeric;
alter table public.questionnaire_responses add column if not exists factor_scores jsonb;
alter table public.questionnaire_responses add column if not exists created_at timestamp with time zone;

create table if not exists public.recovery_codes (
  user_id uuid not null,
  code_hash text not null,
  code_salt text not null,
  issued_at timestamp with time zone default now() not null,
  used_at timestamp with time zone,
  failed_attempts integer default 0 not null,
  locked_until timestamp with time zone
);
alter table public.recovery_codes add column if not exists user_id uuid;
alter table public.recovery_codes add column if not exists code_hash text;
alter table public.recovery_codes add column if not exists code_salt text;
alter table public.recovery_codes add column if not exists issued_at timestamp with time zone;
alter table public.recovery_codes add column if not exists used_at timestamp with time zone;
alter table public.recovery_codes add column if not exists failed_attempts integer;
alter table public.recovery_codes add column if not exists locked_until timestamp with time zone;

create table if not exists public.repertoire_tessitura (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  repertoire_name text not null,
  tessitura_note text,
  created_at timestamp with time zone default now() not null,
  top_note text,
  d_override numeric,
  confidence text default 'entered'::text,
  standard_minutes numeric,
  singing_language text,
  composer text,
  position_in text,
  bottom_note text,
  status text
);
alter table public.repertoire_tessitura add column if not exists id uuid;
alter table public.repertoire_tessitura add column if not exists user_id uuid;
alter table public.repertoire_tessitura add column if not exists repertoire_name text;
alter table public.repertoire_tessitura add column if not exists tessitura_note text;
alter table public.repertoire_tessitura add column if not exists created_at timestamp with time zone;
alter table public.repertoire_tessitura add column if not exists top_note text;
alter table public.repertoire_tessitura add column if not exists d_override numeric;
alter table public.repertoire_tessitura add column if not exists confidence text;
alter table public.repertoire_tessitura add column if not exists standard_minutes numeric;
alter table public.repertoire_tessitura add column if not exists singing_language text;
alter table public.repertoire_tessitura add column if not exists composer text;
alter table public.repertoire_tessitura add column if not exists position_in text;
alter table public.repertoire_tessitura add column if not exists bottom_note text;
alter table public.repertoire_tessitura add column if not exists status text;

create table if not exists public.role_master (
  user_id uuid not null,
  role_name text not null,
  work_title text default ''::text,
  pitch_low_note text,
  pitch_high_note text,
  required_voice_character text
);
alter table public.role_master add column if not exists user_id uuid;
alter table public.role_master add column if not exists role_name text;
alter table public.role_master add column if not exists work_title text;
alter table public.role_master add column if not exists pitch_low_note text;
alter table public.role_master add column if not exists pitch_high_note text;
alter table public.role_master add column if not exists required_voice_character text;

create table if not exists public.roster_drafts (
  id uuid default gen_random_uuid() not null,
  org_id uuid not null,
  student_number text not null,
  name text not null,
  grade_year integer,
  division_id uuid,
  email text,
  imported_at timestamp with time zone default now() not null,
  imported_by uuid not null,
  invited_at timestamp with time zone,
  linked_user_id uuid,
  linked_at timestamp with time zone
);
alter table public.roster_drafts add column if not exists id uuid;
alter table public.roster_drafts add column if not exists org_id uuid;
alter table public.roster_drafts add column if not exists student_number text;
alter table public.roster_drafts add column if not exists name text;
alter table public.roster_drafts add column if not exists grade_year integer;
alter table public.roster_drafts add column if not exists division_id uuid;
alter table public.roster_drafts add column if not exists email text;
alter table public.roster_drafts add column if not exists imported_at timestamp with time zone;
alter table public.roster_drafts add column if not exists imported_by uuid;
alter table public.roster_drafts add column if not exists invited_at timestamp with time zone;
alter table public.roster_drafts add column if not exists linked_user_id uuid;
alter table public.roster_drafts add column if not exists linked_at timestamp with time zone;

create table if not exists public.score_log (
  id uuid default gen_random_uuid() not null,
  score_id uuid not null,
  org_id uuid not null,
  editor_user_id uuid not null,
  before_value numeric(5,2),
  after_value numeric(5,2),
  reason text,
  edited_at timestamp with time zone default now() not null
);
alter table public.score_log add column if not exists id uuid;
alter table public.score_log add column if not exists score_id uuid;
alter table public.score_log add column if not exists org_id uuid;
alter table public.score_log add column if not exists editor_user_id uuid;
alter table public.score_log add column if not exists before_value numeric(5,2);
alter table public.score_log add column if not exists after_value numeric(5,2);
alter table public.score_log add column if not exists reason text;
alter table public.score_log add column if not exists edited_at timestamp with time zone;

create table if not exists public.stripe_events (
  event_id text not null,
  type text not null,
  received_at timestamp with time zone default now() not null,
  processed_at timestamp with time zone,
  error text
);
alter table public.stripe_events add column if not exists event_id text;
alter table public.stripe_events add column if not exists type text;
alter table public.stripe_events add column if not exists received_at timestamp with time zone;
alter table public.stripe_events add column if not exists processed_at timestamp with time zone;
alter table public.stripe_events add column if not exists error text;

create table if not exists public.student_price_consents (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  consented_at timestamp with time zone default now() not null,
  text_version text not null,
  checked_at timestamp with time zone,
  enrolled boolean,
  withdrawn_at timestamp with time zone
);
alter table public.student_price_consents add column if not exists id uuid;
alter table public.student_price_consents add column if not exists user_id uuid;
alter table public.student_price_consents add column if not exists consented_at timestamp with time zone;
alter table public.student_price_consents add column if not exists text_version text;
alter table public.student_price_consents add column if not exists checked_at timestamp with time zone;
alter table public.student_price_consents add column if not exists enrolled boolean;
alter table public.student_price_consents add column if not exists withdrawn_at timestamp with time zone;

create table if not exists public.subscription_items (
  stripe_item_id text not null,
  user_id uuid not null,
  stripe_subscription_id text not null,
  lookup_key text not null,
  added_at timestamp with time zone default now() not null,
  removed_at timestamp with time zone
);
alter table public.subscription_items add column if not exists stripe_item_id text;
alter table public.subscription_items add column if not exists user_id uuid;
alter table public.subscription_items add column if not exists stripe_subscription_id text;
alter table public.subscription_items add column if not exists lookup_key text;
alter table public.subscription_items add column if not exists added_at timestamp with time zone;
alter table public.subscription_items add column if not exists removed_at timestamp with time zone;

create table if not exists public.subscriptions (
  user_id uuid not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text default 'none'::text,
  trial_end timestamp with time zone,
  current_period_end timestamp with time zone,
  updated_at timestamp with time zone default now(),
  plan text,
  contracted_price_yen integer,
  tier text,
  stripe_price_id text,
  period_end timestamp with time zone
);
alter table public.subscriptions add column if not exists user_id uuid;
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists status text;
alter table public.subscriptions add column if not exists trial_end timestamp with time zone;
alter table public.subscriptions add column if not exists current_period_end timestamp with time zone;
alter table public.subscriptions add column if not exists updated_at timestamp with time zone;
alter table public.subscriptions add column if not exists plan text;
alter table public.subscriptions add column if not exists contracted_price_yen integer;
alter table public.subscriptions add column if not exists tier text;
alter table public.subscriptions add column if not exists stripe_price_id text;
alter table public.subscriptions add column if not exists period_end timestamp with time zone;

create table if not exists public.system_alerts (
  id uuid default gen_random_uuid() not null,
  kind text not null,
  sent_on date not null,
  detail text,
  created_at timestamp with time zone default now() not null
);
alter table public.system_alerts add column if not exists id uuid;
alter table public.system_alerts add column if not exists kind text;
alter table public.system_alerts add column if not exists sent_on date;
alter table public.system_alerts add column if not exists detail text;
alter table public.system_alerts add column if not exists created_at timestamp with time zone;

create table if not exists public.teacher_invitations (
  code text not null,
  teacher_id uuid not null,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  used_by_student_id uuid,
  org_id uuid,
  monka_teacher_id uuid,
  grade_year integer,
  division_id uuid,
  target_user_id uuid,
  invited_at timestamp with time zone,
  kind text default 'open'::text not null,
  draft_id uuid
);
alter table public.teacher_invitations add column if not exists code text;
alter table public.teacher_invitations add column if not exists teacher_id uuid;
alter table public.teacher_invitations add column if not exists expires_at timestamp with time zone;
alter table public.teacher_invitations add column if not exists used_at timestamp with time zone;
alter table public.teacher_invitations add column if not exists used_by_student_id uuid;
alter table public.teacher_invitations add column if not exists org_id uuid;
alter table public.teacher_invitations add column if not exists monka_teacher_id uuid;
alter table public.teacher_invitations add column if not exists grade_year integer;
alter table public.teacher_invitations add column if not exists division_id uuid;
alter table public.teacher_invitations add column if not exists target_user_id uuid;
alter table public.teacher_invitations add column if not exists invited_at timestamp with time zone;
alter table public.teacher_invitations add column if not exists kind text;
alter table public.teacher_invitations add column if not exists draft_id uuid;

create table if not exists public.teacher_notes (
  link_id uuid not null,
  body text default ''::text,
  updated_at timestamp with time zone default now() not null
);
alter table public.teacher_notes add column if not exists link_id uuid;
alter table public.teacher_notes add column if not exists body text;
alter table public.teacher_notes add column if not exists updated_at timestamp with time zone;

create table if not exists public.teacher_student_links (
  id uuid default gen_random_uuid() not null,
  teacher_id uuid not null,
  student_id uuid not null,
  status text default 'pending'::text not null,
  share_scope jsonb default '{"body": false, "meal": false, "notes": false, "sleep": true, "voice": true, "mental": false, "activity": true, "symptoms": true, "hydration": false}'::jsonb not null,
  invited_at timestamp with time zone default now() not null,
  accepted_at timestamp with time zone,
  revoked_at timestamp with time zone,
  revoked_by text
);
alter table public.teacher_student_links add column if not exists id uuid;
alter table public.teacher_student_links add column if not exists teacher_id uuid;
alter table public.teacher_student_links add column if not exists student_id uuid;
alter table public.teacher_student_links add column if not exists status text;
alter table public.teacher_student_links add column if not exists share_scope jsonb;
alter table public.teacher_student_links add column if not exists invited_at timestamp with time zone;
alter table public.teacher_student_links add column if not exists accepted_at timestamp with time zone;
alter table public.teacher_student_links add column if not exists revoked_at timestamp with time zone;
alter table public.teacher_student_links add column if not exists revoked_by text;

create table if not exists public.timetable_nudges (
  org_id uuid not null,
  student_id uuid not null,
  sent_by uuid,
  sent_at timestamp with time zone default now() not null
);
alter table public.timetable_nudges add column if not exists org_id uuid;
alter table public.timetable_nudges add column if not exists student_id uuid;
alter table public.timetable_nudges add column if not exists sent_by uuid;
alter table public.timetable_nudges add column if not exists sent_at timestamp with time zone;

create table if not exists public.user_notices (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  notice_key text not null,
  shown_at timestamp with time zone default now() not null
);
alter table public.user_notices add column if not exists id uuid;
alter table public.user_notices add column if not exists user_id uuid;
alter table public.user_notices add column if not exists notice_key text;
alter table public.user_notices add column if not exists shown_at timestamp with time zone;

-- ★★★連番の 持ち主
alter sequence public.email_change_log_id_seq owned by public.email_change_log.id;
