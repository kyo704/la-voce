-- ============================================================================
-- 逆流の記録の 門の列 と、★profiles の 不足列の 洗い出し（2026年9月9日）
--
--   ★★実機で「column profiles.reflux_care_consent_at does not exist」。
--     ★SQL は 書いてありました
--       （supabase/2026-09-08-寝るときの姿勢と締めつけ.sql の ①-2）。
--     ★entries の3列（sleep_side／head_raised／belly_tight）は 入っていて、
--     ★★profiles の 1列だけが 入っていませんでした。
--
--   ★★同じことを 繰り返さないために、★②で ぜんぶ 洗い出します。
--     ★画面が profiles に 求めている列は 49 件です。
--     ★★どれが 足りないかを、★1度に 出します。★1つずつ 見つけません。
--
--   ★★何度 実行しても 安全です。
--   ★★BEGIN / ROLLBACK で 包みません（★SQL エディタが 効かせないため）。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 逆流の記録の 門（★これが 無いと、記録させません）
--
--   ★★null なら 記録させません。★既定は null です。
--   ★撤回されたら null に 戻します。★日時を 消すのでは なく、null にします。
--   ★周期の記録（track_cycle）と、同じ形です。
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists reflux_care_consent_at timestamptz;

comment on column public.profiles.reflux_care_consent_at is
  '寝るときの姿勢と締めつけの記録に、同意を受け取った日時。null なら記録させません。'
  '要配慮個人情報。正は lib/refluxCare.js。';

-- ---------------------------------------------------------------------------
-- ★② ★不足している列を、★1度に 洗い出します（★読むだけです）
--
--   ★★下に並ぶのは「★画面が 読もうとしている列」です。
--     ★★1行も 出なければ、★足りている、ということです。
--     ★出た列は、★足す必要が あります。★型は 下の ③ に 目安を 書きました。
-- ---------------------------------------------------------------------------
with 画面が求める列(名) as (
  select unnest(array[
    'age',
    'age_band',
    'age_band_answered_at',
    'character_equipped',
    'character_points_spent',
    'comfort_range_high',
    'comfort_range_low',
    'conditions',
    'consent_health_data_at',
    'consent_health_data_withdrawn_at',
    'consent_policy_version',
    'consent_stats_use_at',
    'day_record_boundary_hour',
    'display_name',
    'display_scale',
    'folded_groups',
    'garden_theme',
    'goal_focus',
    'health_notes',
    'height_cm',
    'is_admin',
    'line_link_code',
    'line_linked_at',
    'line_notification_enabled',
    'line_user_id',
    'nutrition_phase',
    'occupation_notice_shown_at',
    'onboarding_completed',
    'practice_goal',
    'practice_goal_started_at',
    'practice_goal_tags',
    'practice_reviews',
    'professions',
    'protein_coefficient',
    'reflux_care_consent_at',
    'sex',
    'simple_display',
    'survey_day7_response',
    'survey_day7_shown_at',
    'teacher_beta_access',
    'technical_goal',
    'track_cycle',
    'vocal_profession',
    'vocal_range_high',
    'vocal_range_low',
    'voice_mix',
    'voice_mix_edited_at',
    'voice_occupation',
    'voice_type'
  ])
)
select 名 as "★足りない列"
  from 画面が求める列
 where 名 not in (
   select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
 )
 order by 名;

-- ---------------------------------------------------------------------------
-- ★③ 型の 目安（★②で 出た列だけ、足してください）
--
--   ★★勝手には 足しません。★何が 足りないかを 見てから 決めます。
--   ★★埋め戻しません。★null のままに します。
--     ★「決めていない」と「そう決めた」を、★見分けられなくなるためです。
--
--     時刻の列（★〜_at）　　　　timestamptz
--     はい／いいえ　　　　　　　boolean
--     数　　　　　　　　　　　　integer ／ numeric
--     字　　　　　　　　　　　　text
--     並び・入れ物　　　　　　　jsonb
--
--   ★れい
--     alter table public.profiles add column if not exists 〜 timestamptz;
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ★④ 確かめ（★①が できたこと）
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型", is_nullable as "nullを許すか"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name = 'reflux_care_consent_at';
-- ★1行 出れば、門の列が できています。
