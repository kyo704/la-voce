-- ============================================================================
-- プロフィールの保存が 403 になる件（2026年9月9日）
--
--   ★★実機のご報告
--     ★プロフィールの画面で 項目を変えて「保存」を押すと、
--     ★★PATCH /profiles が 403（Forbidden）で 失敗する。
--
--   ★★原因（★コードから 突き止めました）
--     ★profiles の UPDATE は「★列ごとの許し」に なっています。
--     ★★きょう、★新しい列を 2つ 足しました。
--         reflux_care_consent_at　（2026-09-09）
--         consent_health_data_withdrawn_at（2026-09-09）
--     ★★列を 足しても、★その列の UPDATE の許しは 付きません。
--     ★★そして プロフィールの保存は、★reflux_care_consent_at を
--       ★毎回 いっしょに 送ります（components/VocalTracker.jsx の
--       ★handleSaveProfile）。★1列でも 許しが無ければ、★丸ごと 403 です。
--
--   ★★だから「権限を 絞りすぎた」のでは ありません。
--     ★★絞ったあとに 足した列が、★取り残されただけです。
--     ★これは、★列を足すたびに 起きます。★下の ① で 毎回 確かめられます。
--
--   ★★何度 実行しても 安全です。★BEGIN / ROLLBACK で 包みません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① いま、どの列に UPDATE の許しが あるか（★読むだけ）
--
--   ★★ここに 出てこない列は、★保存できません。
-- ---------------------------------------------------------------------------
select column_name as "許しのある列"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'profiles'
   and grantee = 'authenticated' and privilege_type = 'UPDATE'
 order by column_name;

-- ---------------------------------------------------------------------------
-- ★② ★足りない列を、1度に 洗い出します（★読むだけ）
--
--   ★★下に並ぶのは「★画面が 保存で 書こうとする列」です。
--     ★1行も 出なければ、★足りています。
--   ★★次の列は、★はじめの版に 入れていましたが、★外しました。
--     ★2026-09-09、★坂本さんの ご判断です。★そのとおりです。
--       is_admin　　　　　　　 ★ご自分で 管理者に なれてしまいます
--       character_points_spent ★てんの残高。★ご自分で 増やせてしまいます
--       deleted_at　　　　　　 ★退会の しるし。★サーバが 立てます
--       reauth_at　　　　　　  ★本人確認の しるし。★サーバが 立てます
--     ★★どれも「サーバだけが 書く列」です。★画面から 書かせません。
--     ★★私の はじめの一覧は、★コードの update から 機械的に 拾ったもので、
--       ★「書いてよいか」を 見ていませんでした。★拾えることと、
--       ★★許してよいことは、★別です。
-- ---------------------------------------------------------------------------
with 画面が書く列(名) as (
  select unnest(array[
    -- ★プロフィールの保存（handleSaveProfile）
    'height_cm','voice_type','nutrition_phase','protein_coefficient','age','sex',
    'vocal_range_low','vocal_range_high','comfort_range_low','comfort_range_high',
    'technical_goal','health_notes','conditions','vocal_profession','professions',
    'track_cycle','reflux_care_consent_at',
    -- ★同じ画面の、別の保存（★列が無い環境を考えて 分けてあります）
    'allergies','regular_medications',
    -- ★そのほか、画面から 書く列
    'character_equipped','consent_health_data_withdrawn_at',
    'consent_stats_use_at','cycle_show_on_home','day_record_boundary_hour',
    'display_name','folded_groups','garden_theme','line_link_code','line_linked_at',
    'line_notification_enabled','line_user_id','occupation_notice_shown_at',
    'practice_reviews','practice_goal','practice_goal_tags','practice_goal_started_at',
    'pwa_install_prompted_at','pwa_installed_at','record_mode',
    'survey_day7_response','survey_day7_shown_at','voice_occupation','voice_mix',
    'voice_mix_edited_at','onboarding_completed','goal_focus','display_scale',
    'simple_display','age_band','age_band_answered_at','consent_health_data_at',
    'consent_policy_version'
  ])
)
select 名 as "★許しが無い列"
  from 画面が書く列
 where 名 in (
   select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
 )
   and 名 not in (
   select column_name from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'profiles'
      and grantee = 'authenticated' and privilege_type = 'UPDATE'
 )
 order by 名;

-- ---------------------------------------------------------------------------
-- ★③ きょう足した2列に、許しを 付けます
--
--   ★★列ごとの 許しです。★表ぜんたいの UPDATE は 与えません。
--     ★与えると、★is_admin まで 書けるように なります。
--   ★★②で ほかの列も 出た場合は、★同じ形で 足してください。
--     ★★ただし is_admin は 足さないこと。
-- ---------------------------------------------------------------------------
grant update (reflux_care_consent_at) on public.profiles to authenticated;
grant update (consent_health_data_withdrawn_at) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- ★④ 確かめ（★読むだけ）
-- ---------------------------------------------------------------------------

-- ④-1 ★きょうの2列に 許しが 付いたこと（★2行）
select column_name as "列", privilege_type as "許し"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'profiles'
   and grantee = 'authenticated' and privilege_type = 'UPDATE'
   and column_name in ('reflux_care_consent_at','consent_health_data_withdrawn_at')
 order by column_name;

-- ④-2 ★★is_admin に 許しが 付いていないこと（★0行で あること）
select column_name as "★危ない：is_admin に許しがあります"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'profiles'
   and grantee = 'authenticated' and privilege_type = 'UPDATE'
   and column_name = 'is_admin';

-- ④-3 ★表ぜんたいの UPDATE が 無いこと（★0行で あること）
--     ★表ぜんたいに 許しが あると、★列ごとの絞りは 意味を なしません。
select privilege_type as "★表ぜんたいの許し"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'profiles'
   and grantee = 'authenticated' and privilege_type = 'UPDATE';

-- ============================================================================
-- ★このあと
--   ★★列を 足すときは、★かならず 許しも 足すこと。
--     ★①と②を 流せば、★取り残しが その場で 分かります。
--   ★★きょうの件は「絞りすぎ」では ありません。
--     ★絞ったあとに 足した列が、取り残されていました。
-- ============================================================================
