// ============================================================================
// ★引く 列（★台帳から 作りました・2026-09-20）
//
//   ★★★`select("*")` を 使いません（★裁定 その113 §5-1）。
//     ★★列ごとの 渡し（column grant）の ある 表では、★`*` は 要求ごと 落ちます。
//     ★★0行では なく `data` が null です。★画面は 黙って 空に なります。
//     ★★★2026-09-20 に 2件 起きました ── `lessons` と `org_events`。
//
//   ★★この 紙は `tools/gen_columns.py` が 作りました。★手で 直さないで ください。
//     ★★列を 足したら、★もう一度 走らせて ください。
//   ★★入って いるのは、★**いま 渡して ある 列 だけ** です。
// ============================================================================

/** ★`subscriptions` ── ★渡して ある 列 だけ。 */
export const COLS_SUBSCRIPTIONS =
  "user_id, stripe_customer_id, stripe_subscription_id, status, trial_end, "
  + "current_period_end, updated_at, plan, contracted_price_yen, tier, "
  + "stripe_price_id, period_end";

/** ★`org_invitations` ── ★渡して ある 列 だけ。 */
export const COLS_ORG_INVITATIONS =
  "code, org_id, invited_by, expires_at, used_at, used_by";

/** ★`recovery_codes` ── ★渡して ある 列 だけ。 */
export const COLS_RECOVERY_CODES =
  "None";

/** ★`entries` ── ★渡して ある 列 だけ。 */
export const COLS_ENTRIES =
  "id, user_id, date, throat_condition, voice_quality, throat_symptoms, "
  + "sleep_hours, sleep_quality, water_intake, meal_notes, location, "
  + "temperature, humidity, activity_type, activity_duration, repertoire, "
  + "performance_quality, ease, notes, created_at, voice_checkins, "
  + "water_by_slot, weight_kg, carbs_g, protein_g, fat_g, fiber_g, "
  + "exercise_minutes, meals, exercises, weather, mental_reason, "
  + "throat_symptoms_other, voice_memo, activity_detail, wake_note, "
  + "routine_note, resonance_score, bedtime, dinner_time, dinner_tags, "
  + "load_detail, mental_tags, cycle_start, medication_tags, "
  + "ambient_noise_db, flight_hours, jetlag_hours, activities, recovery, "
  + "pianissimo_high_note, pianissimo_onset_delay, speaking_level, "
  + "noisy_environment, cpps_value, exercise_level, body_fat_pct, "
  + "protein_level, calorie_level, voice_entries, "
  + "non_performance_speech_minutes, environment_tags, "
  + "longest_speech_block_minutes, type_fields, morning_edema, "
  + "accompaniment, smoked_today, drank_today, weather_source, meal_marks, "
  + "sleep_side, head_raised, belly_tight, source";

/** ★`questionnaire_responses` ── ★渡して ある 列 だけ。 */
export const COLS_QUESTIONNAIRE_RESPONSES =
  "id, user_id, questionnaire_type, response_date, item_scores, "
  + "total_score, factor_scores, created_at";

/** ★`repertoire_tessitura` ── ★渡して ある 列 だけ。 */
export const COLS_REPERTOIRE_TESSITURA =
  "id, user_id, repertoire_name, tessitura_note, created_at, top_note, "
  + "d_override, confidence, standard_minutes, singing_language, composer, "
  + "position_in, bottom_note, status";

/** ★`role_master` ── ★渡して ある 列 だけ。 */
export const COLS_ROLE_MASTER =
  "user_id, role_name, work_title, pitch_low_note, pitch_high_note, "
  + "required_voice_character";

/** ★`project_master` ── ★渡して ある 列 だけ。 */
export const COLS_PROJECT_MASTER =
  "user_id, project_name, script_type, speech_speed, is_live";

/** ★`teacher_student_links` ── ★渡して ある 列 だけ。 */
// ★★★2026-09-23 ── ★`share_scope` を 外しました（★裁定182 の お尋ねへの 答え）。
//
//   ★★調べた こと ── ★この 列を 引いて いるのは 1か所 だけ です
//     （`components/VocalTracker.jsx` の 書き出し。★`student_id = 自分` の 行）。
//   ★★★その あと `sanitizeShareHistory` を 通ります。★残す 列は 5つ です ──
//       status ／ accepted_at ／ revoked_at ／ revoked_by ／ created_at
//     ★★`share_scope` は **そこで 捨てられて** います。
//
//   ★★★つまり ── ★引いて、★網を 通って ブラウザまで 運ばれ、★捨てられて いました。
//     ★画面は 1度も 使って いません。★書き出しにも 入りません。
//     ★★`lib/exportData.js:112` にも「2026-09-01 に 外した」と 書いて あります。
//     ★★`components/tests/teacher-link-reconnect.test.js` も それを 見張って います。
//
//   ★★★本番の 11行 は、★どれも 中身の 入った `share_scope` を 持って います。
//     ★11人ぶんの 共有の 好みが、★使いもしないのに 運ばれて いました。
//     ★★行の 決まり（RLS）は 列を 隠せません。★引かない ことでしか 止められません。
export const COLS_TEACHER_STUDENT_LINKS =
  "id, teacher_id, student_id, status, invited_at, "
  + "accepted_at, revoked_at, revoked_by";

/** ★`chapter_state` ── ★渡して ある 列 だけ。 */
export const COLS_CHAPTER_STATE =
  "user_id, profession_key, chapter, is_open";

/** ★`article_progress` ── ★渡して ある 列 だけ。 */
// ★★★`read_at`・`first_read_at`・`bookmarked` を 外しました
//   （★2026-09-25・移行 `article_read_off_ledger`）。
//   ★★読んだ印は 端末に だけ 残ります。★決めは lib/articleRead.js。
//   ★`bookmarked` は 書く ところも 読む ところも ありませんでした。
export const COLS_ARTICLE_PROGRESS =
  "user_id, article_id, box, next_due_at, last_answered_at";

/** ★`article_notes` ── ★渡して ある 列 だけ。 */
export const COLS_ARTICLE_NOTES =
  "id, user_id, article_id, kind, anchor_text, anchor_offset, body, "
  + "shared_with_teacher, created_at, updated_at, deleted_at";

/** ★`organizations` ── ★渡して ある 列 だけ。 */
export const COLS_ORGANIZATIONS =
  "id, name, kind, created_by, created_at";

/** ★`enrollments` ── ★渡して ある 列 だけ。 */
export const COLS_ENROLLMENTS =
  "id, org_id, student_id, status, enrolled_at, left_at, grade_label, "
  + "grade_year, division_id, student_number";

/** ★`assignments` ── ★渡して ある 列 だけ。 */
export const COLS_ASSIGNMENTS =
  "id, org_id, teacher_id, student_id, started_at, ended_at, "
  + "is_representative";

/** ★`memberships` ── ★渡して ある 列 だけ。 */
export const COLS_MEMBERSHIPS =
  "id, org_id, user_id, role, created_at, display_title, "
  + "display_title_updated_by, display_title_updated_at, grade_label, "
  + "post_id, division_id, verified_at, verified_by";

/** ★`org_billing` ── ★渡して ある 列 だけ。 */
export const COLS_ORG_BILLING =
  "id, org_id, atesaki_name, atesaki_email, atesaki_user_id, "
  + "atesaki_changed_at, atesaki_changed_by, stripe_customer_id, method, "
  + "next_billing_date, created_at, invoice_no, invoice_issuer, bill_dept, "
  + "bill_contact";

/** ★`my_periods` ── ★渡して ある 列 だけ。 */
export const COLS_MY_PERIODS =
  "id, user_id, ord, name, start_min, end_min, created_at, updated_at";

/** ★`my_timetable` ── ★渡して ある 列 だけ。 */
export const COLS_MY_TIMETABLE =
  "id, user_id, weekday, period_id, title, teacher, room, memo, "
  + "unavailable, created_at, updated_at";

/** ★`character_inventory` ── ★渡して ある 列 だけ。 */
export const COLS_CHARACTER_INVENTORY =
  "id, user_id, item_key, purchased_at";

