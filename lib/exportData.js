// ============================================================================
// データの書き出し（統合実行ルートv4 G3-16 / 改善タスクv2 P0-3）
//
// ★ここに含める項目を減らさないこと。
//   月経周期・既往症・アレルギー・常用薬は、先生には一切共有しない設定だが
//   （lib/shareScope.js の11列）、本人が自分のデータを持ち出す権利は別の話。
//   「共有しない」と「本人も取り出せない」を混同しないこと。
//
// JSON は完全な構造をそのまま（入れ子の meals / activities / voiceEntries を
// 落とさない）。CSV は日付を1行にした表で、表計算ソフトで開ける形。
// どちらか一方では足りないので、両方を出す。
// ============================================================================

export const EXPORT_FORMAT_VERSION = 2;

// 書き出すテーブルと、その並び順のキー。
// 新しいテーブルを足したら、ここにも足すこと。足し忘れると黙って欠ける。
export const EXPORTED_TABLES = [
  { table: "entries", orderBy: "date" },
  { table: "questionnaire_responses", orderBy: "response_date" },
  // ★周期の記録。先生には一切共有しないが、本人の持ち出しには必ず含める
  //   （ルート文書 G3 の注記。「共有しない」と「本人も取り出せない」は別の話）。
  { table: "cycle_periods", orderBy: "start_date" },
  // ★★区切りマーカー（★2026-09-08）。★ご本人が置いた印です。★お返しします。
  //   ★理由は入っていません。★はじめから、そういう表です。
  { table: "period_markers", orderBy: "marked_on" },
  { table: "repertoire_tessitura", orderBy: null },
  { table: "role_master", orderBy: null },
  { table: "project_master", orderBy: null },
  { table: "article_notes", orderBy: null },
  // ★★ノート（★見本⑥・2026-09-09）。★表は もう 作ってあります。
  //   ★★画面は まだですが、★台帳には 先に 入れます。
  //     ★入れ忘れたまま 画面が 出ると、★書いたものが 書き出しに 入りません。
  //   ★消したもの（deleted_at）も 出します。★ご本人のものです。
  { table: "notes", orderBy: "updated_at" },
  { table: "article_progress", orderBy: null },
  { table: "chapter_state", orderBy: null },
  { table: "character_inventory", orderBy: null },
  // ★★手に入れた日の台帳（★J05・2026-09-11）。
  //   ★★入れ忘れると、★書き出しに「いつ 手に入れたか」が 入りません。
  //     ★ご本人にしか 意味の ない 記録です。★必ず 出します。
  { table: "item_acquisitions", orderBy: "acquired_on" },
  // 組織の予定に「出ます」と印をつけた記録。★本人のものなので書き出しに含めます。
  { table: "org_event_participants", orderBy: "joined_at" },
  // 同意の記録。★本人の持ち出しには必ず含める。
  //   「いつ・どの文面に同意したか」は、本人が確かめられるべき情報です
  //   （研究利用の同意.md §3-3「同意の履歴を見る」）。
  { table: "consent_records", orderBy: "granted_at" },
  // ★未成年の方の、有料機能への申告（2026-09-04）。
  //   ★★本人の書き出しに含めます。★本人の同意の記録です。
  //   ★「何円と表示されていたか」は、★本人が確かめられるべき情報です。
  { table: "minor_billing_consents", orderBy: "declared_at" },
  // 年齢の答えを変えた記録。★本人のものなので、書き出しに含める。
  { table: "age_answer_changes", orderBy: "changed_at" },
  // お知らせの宛先（TASK A）。★本人あてに何を送ったかは、本人のものです。
  //   ★notice_batches は含めません。あちらは運営の束で、
  //     ほかの方の分も混ざっています。
  { table: "notice_targets", orderBy: "created_at" },
  // ★教室での所属と、教室が付けた呼び方（2026-09-03）。
  //   ★display_title は「その人について、★他人が付けた値」です。
  //   ★★それでも、その人に関する情報です。★本人の書き出しに含めます。
  //   ★「他人が付けたから、本人には返さない」は、通りません。
  //     ★むしろ、他人が付けたものだからこそ、本人が確かめられるべきです。
  //   ★user_id 列で本人の行だけが出ます。ほかの方の行は出ません。
  { table: "memberships", orderBy: "joined_at" }
];

// プロフィールから書き出す列。★機微な項目こそ本人には返す。
export const EXPORTED_PROFILE_COLUMNS = [
  "name", "email", "occupation", "school", "display_name",
  "height_cm", "age", "sex", "voice_type", "vocal_profession", "professions",
  "conditions", "allergies", "regular_medications", "health_notes",
  "vocal_range_low", "vocal_range_high", "comfort_range_low", "comfort_range_high",
  "technical_goal", "nutrition_phase", "protein_coefficient", "track_cycle",
  "goal_focus", "practice_goal", "practice_goal_tags", "practice_goal_started_at",
  "practice_reviews", "folded_groups", "record_mode", "day_record_boundary_hour",
  "garden_theme", "character_equipped", "character_points_spent",
  "consent_health_data_at", "consent_stats_use_at", "consent_policy_version",
  "onboarding_completed", "created_at",
  // 職業を声の型で切り直す §7。本人のデータなので、書き出しにも含める。
  // ★voice_occupation だけでなく voice_mix も入れる。配合は本人が動かした
  //   設定であり、片方だけ持ち出せるのは筋が通らない。
  // ★occupation_notice_shown_at は入れない。あれは「知らせを出したか」という
  //   画面側の覚え書きで、本人の記録ではない。
  "voice_occupation", "voice_mix", "voice_mix_edited_at",
  // テスターの印。本人の状態なので書き出しに含める。
  // ★is_internal も含める。運営がつけた印だが、その人の状態であることに
  //   変わりはなく、cohort を含めておいて片方だけ隠すのは筋が通らない。
  //   ★この印はお知らせの人数から外すためだけのもので、書き出し・削除・
  //     控えからは外しません（supabase/migration_profiles_is_internal.sql）。
  "is_tester", "cohort", "cohort_since", "is_internal",
  // EUの下地づくり.md §4-3。本人のデータなので、書き出しにも含める。
  "data_region",
  // A-7 の年齢の確認。本人が答えた内容なので、書き出しに含める。
  // ★age_question_shown_at は入れない。あれは「質問を出したか」という画面側の
  //   覚え書きで、本人の記録ではない（occupation_notice_shown_at と同じ理由）。
  "is_under_18"
];

// ---------------------------------------------------------------------------
// 共有設定の履歴（作業指示-公開前の実装.md A-3 の「共有設定の履歴」）
//
// ★A-3 は「他のユーザーの情報（先生のメモなど）は含めない」とも定めている。
//   teacher_student_links には相手の teacher_id が入っているので、そのまま
//   出すと「誰と繋がっていたか」という相手側の情報まで書き出すことになる。
//   自分が「何を・いつからいつまで共有していたか」だけを残し、相手を特定
//   できる値は落とす。
//
// ★安全側の作り: 残す列を並べるのではなく、残してよい列だけを通す。
//   あとから列が増えても、ここに書かない限り書き出されない（fail closed）。
// ---------------------------------------------------------------------------
// ★share_scope は 2026-09-01 に外しました。
//   共有範囲という考え方そのものを廃止したので、これから先そこに値が入りません。
//   ★「二度と設定できない項目」を書き出しに載せ続けると、
//     いまも選べるかのように読めます。残すのは、実際に起きた事実だけです。
//   （本番の紐付けは0件だったので、失われた履歴はありません）
export const SHARE_HISTORY_SAFE_COLUMNS = ["status", "accepted_at", "revoked_at", "revoked_by", "created_at"];

export function sanitizeShareHistory(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, i) => {
    const out = {};
    SHARE_HISTORY_SAFE_COLUMNS.forEach((k) => { if (k in row) out[k] = row[k]; });
    // 相手を特定できる値は残さないが、複数の共有を見分けられるよう連番だけ振る。
    out.connection = `連携${i + 1}`;
    return out;
  });
}

// ---------------------------------------------------------------------------
// ★CSV の 見出しを、★日本語に します（★裁定 2026-09-15・Opus ㋒）
//
//   ★★決め ──「見出しは『列名の意味』では なく
//                『実際に 格納されて いる 中身』を 表す こと」
//
//   ★★なぜ ここまで 厳しく するか。
//     ★★この ファイルは、★お医者さんに 渡される ことが あります。
//       ★誤った 見出しは、★誤った 情報を 医師の 前に 出す ことに なります。
//
//   ★★★列の 名前と 中身が 食い違って いる ものが あります
//     （★裁定 その29／その49 で 判明済み。★改名は 別途 あとで 行います）。
//       ★`throat_condition` … 入って いるのは **bodyFeel** です
//         （★`components/VocalTracker.jsx` の `rowToEntry`:1649 ──
//           `bodyFeel: row.throat_condition`）。
//         ★だから 見出しは「からだの 感じ」。★のどの ことでは ありません。
//       ★`voice_quality`   … 5段階。
//       ★`resonance_score` … 同じ ものの 0〜10。
//     ★★いま 列名を そのまま 日本語に すると、★嘘を 印刷します。
//
//   ★★★逆に、★正しく 名づけられて いる ものも あります。
//     ★`wake_note`／`routine_note`／`pianissimo_high_note` の `note` は
//       ★**音名**です。★「メモ」では ありません。
//       ★（★`labelWakeNote` =「起き抜けの地声の音名」）。
//
//   ★★名前の 無い 列は、★**列名の まま** 出します。★空に しません。
//     ★★空に すると、★どの 列か 分からなく なります。
//     ★★列は これからも 増えます。★増えた ことに 気づける 形に します。
// ---------------------------------------------------------------------------

/**
 * ★見出しに 入れては いけない 語（★裁定 2026-09-15・Opus 追加2）。
 *
 *   ★★見張りは「警告」では なく **失敗** に します。
 *     ★★病名・尺度名を 見出しに 出さない、★という 決めは
 *       ★見本 `SC['書き出す']` の `.wl` に 書いて あります ──
 *       「病気の 名前・尺度の 名前は、見出しにも 入れません。」
 *   ★★`components/tests/export-headings.test.js` が 毎回 数えます。
 */
export const FORBIDDEN_IN_HEADING = Object.freeze([
  "CPPS", "cpps", "score", "index", "偏差値", "点数", "スコア"
]);

/**
 * ★列の 名前 → ★見出しの 日本語。
 *
 *   ★★1列ずつ、★`entryToRow` が 何を 書いて いるかを 見て 付けました。
 *   ★★足りない 列は、★`headingOf()` が 列名の まま 返します。
 */
export const ENTRY_COLUMN_LABELS = Object.freeze({
  date: "日づけ",
  // ★★★中身が 名前と ちがう 3つ（★裁定 その29／その49）。
  throat_condition: "からだの 感じ",
  voice_quality: "声の 出来（5段階）",
  resonance_score: "声の 出来（0〜10）",
  // ★★音名（★`note` は メモでは ありません）。
  wake_note: "起き抜けの 地声の 音名",
  routine_note: "ルーティーン後の 地声の 音名",
  pianissimo_high_note: "ピアニッシモで 出せた 高い 音名",
  // ★★のど・声
  throat_symptoms: "のどの 症状",
  throat_symptoms_other: "のどの 症状（そのほか）",
  voice_memo: "声に ついて 書いたこと",
  voice_checkins: "その日の 声の 記録（時刻ごと）",
  voice_entries: "その日の 声の 記録（まとめ）",
  pianissimo_onset_delay: "ピアニッシモの 出だしの 遅れ",
  // ★★★止めて いる 測り（★lib/pausedFeatures.js「measure.cpps」）。
  //   ★★値が 実際より 低く 出ます。★数字が 信用 できません。
  //   ★★列も 値も 消して いません。★新しく 増やさないだけ です。
  //   ★★見出しに 尺度の 名前を 出しません。★何を したかだけ 書きます。
  cpps_value: "録音から 出した 数（2026年9月1日に 止めました）",
  // ★★ねむり
  sleep_hours: "眠った 時間",
  sleep_quality: "眠りの 深さ",
  bedtime: "寝た 時刻",
  sleep_side: "横向きの 向き",
  head_raised: "頭を 高く して 寝たか",
  morning_edema: "朝の むくみ",
  // ★★稽古・本番
  activity_type: "その日の 活動",
  activity_duration: "活動した 分",
  activity_detail: "活動の 中身",
  repertoire: "歌った 曲",
  performance_quality: "本番の 出来",
  ease: "らくに 歌えたか",
  load_detail: "稽古の 中身（こまかく）",
  type_fields: "お仕事に 合わせた 記録",
  // ★★話す 仕事
  speaking_level: "話した 量",
  non_performance_speech_minutes: "本番 以外で 声を 使った 分",
  longest_speech_block_minutes: "いちばん 長く 続けて 話した 分",
  // ★★からだ
  weight_kg: "体重（kg）",
  body_fat_pct: "体脂肪（％）",
  belly_tight: "おなかの 張り",
  exercise_level: "運動の 量",
  exercise_minutes: "運動した 分",
  exercises: "した 運動",
  // ★★食べる・飲む
  meals: "食べたもの",
  meal_marks: "食事の 印",
  meal_notes: "食事に ついて 書いたこと",
  dinner_time: "食べ終えた 時刻",
  dinner_tags: "夕食の 中身",
  water_intake: "飲んだ 水の 量",
  water_by_slot: "飲んだ 水（時間帯ごと）",
  protein_level: "たんぱく質の 量",
  calorie_level: "食べた 量",
  carbs_g: "炭水化物（g）",
  protein_g: "たんぱく質（g）",
  fat_g: "脂質（g）",
  fiber_g: "食物繊維（g）",
  // ★★くらし
  smoked_today: "たばこを 吸ったか",
  drank_today: "お酒を 飲んだか",
  medication_tags: "のんだ くすり",
  mental_tags: "こころの 様子",
  mental_reason: "こころの 様子の わけ",
  notes: "その日に 書いたこと",
  routine_done: "ルーティーンを したか",
  // ★★まわり（★見本には 入力欄が ありません。★列と 値は 残って います）
  location: "いた ところ",
  temperature: "気温",
  humidity: "湿度",
  weather: "天気",
  weather_source: "天気の 出どころ",
  environment_tags: "まわりの 様子",
  ambient_noise_db: "まわりの 音の 大きさ（dB）",
  noisy_environment: "うるさい ところに いたか",
  flight_hours: "飛行機に 乗った 時間",
  jetlag_hours: "時差",
  // ★★周期（★先生には 一切 共有しません。★ご本人の 持ち出しには 必ず 入れます）
  cycle_start: "周期の はじまりの 日",
  // ★★しくみの 列
  user_id: "利用者の 番号",
  source: "どこから 入った 記録か",
  created_at: "作った 日時",
  updated_at: "直した 日時",
  recovery: "休みの 記録"
});

/**
 * ★書き出しの 画面に 出す、★3つの かたまり（★見本 `SC['書き出す']`）。
 *
 *   ★裁定 2026-09-15・Opus（坂本さん 経由）
 *     ㋓「採用。★約束として 扱う（★文言だけで なく 実際の 義務として）」
 *        ★根拠 GDPR 20条 ＋ 12条5項（★法務調査済み）
 *     ㋑「19表 全て 表示（★5表のみでは なく）」
 *        ★わけ ── 一部だけの 一覧は「残りは 含まれない」という 誤解を 招く。
 *          ★医師に 渡す 可能性が ある 以上、★読み手は 全体を 知る 必要が ある。
 *     ㋐「選択UIなし。『両方 落ちてきます』と 明記」
 *        ★わけ ── 正解の 無い 選択は 選択では ない。★両方 無料。
 *
 *   ★★㋓ は 約束 です。★飾りでは ありません。
 *     ★★「いつでも 無料」── ★`REQUIRE_SUBSCRIPTION` が true に なっても、
 *       ★書き出しの 道に 門を 置かない、★という こと です。
 *     ★★「退会された あとも」── ★手元の ファイルに 有効期限を 付けない、
 *       ★遠隔で 消さない、★という こと です。
 *     ★★`components/tests/export-headings.test.js` が 緑に なるまで
 *       ★この 字を 出しては いけない、★という 順序も 裁定に あります。
 *       ★★守れて いない 約束を 先に 書かない ため です。
 */
export const EXPORT_PROMISE =
  "書き出しは いつでも 無料です。退会された あとも、お手元の ファイルは あなたの ものです。";

/** ★見本 `.wl` の 2行（★見出しに ついての 約束）。 */
export const EXPORT_HEADING_NOTE = Object.freeze([
  "病気の 名前・尺度の 名前は、見出しにも 入れません。",
  "見出しは、画面と 同じ ことばです（のどの調子／声の出来 …）。"
]);

/**
 * ★㋐ ── 形を 選ばせません。★両方 落ちてきます。
 *
 *   ★★見本は［CSV］［JSON］の 札を 出して います。
 *   ★★アプリは 選ばせず、★両方 渡します。★渡す 量は 減って いません。
 *   ★★「正解の 無い 選択は 選択では ない」── ★裁定の ことば です。
 *   ★★CSV 単体を 求める 声が 出てから 再検討します。
 */
export const EXPORT_FORMAT_NOTE = Object.freeze([
  "形は 選びません。CSV と JSON が、両方 落ちてきます。",
  "JSON は すべてを そのままの 形で 残すため、CSV は 表計算ソフトで 開くためのものです。"
]);

/**
 * ★㋑ ── 入れるものの 一覧（★19表 すべて）。
 *
 *   ★★見本は 5行に ✓ を 付けて 見せて います。
 *     ★★5つとも 入って います。★見せて いないだけ でした。
 *   ★★けれど 5つだけ 出すと、★「残りは 含まれない」と 読まれます。
 *     ★★医師に 渡る かも しれない ファイルです。★全体が 分からないと 困ります。
 *
 *   ★★`tables` … `EXPORTED_TABLES` の 表の 名前。★空なら 表では ない もの。
 *     ★★名前は ここで 決めます。★列の 見出しとは 別の 話です。
 *   ★★この 一覧と `EXPORTED_TABLES` が ずれて いないことを、
 *     ★`components/tests/export-contents.test.js` が 毎回 数えます。
 */
export const EXPORT_CONTENT_GROUPS = Object.freeze([
  Object.freeze({
    group: "記録",
    items: Object.freeze([
      Object.freeze({ label: "日々の 記録（すべての 項目）", tables: Object.freeze(["entries"]) }),
      Object.freeze({ label: "質問票の 答え", tables: Object.freeze(["questionnaire_responses"]) }),
      Object.freeze({ label: "周期の 記録", tables: Object.freeze(["cycle_periods", "period_markers"]) }),
      Object.freeze({ label: "ノート", tables: Object.freeze(["notes", "article_notes"]) })
    ])
  }),
  Object.freeze({
    group: "曲・本番",
    items: Object.freeze([
      Object.freeze({ label: "レパートリー", tables: Object.freeze(["repertoire_tessitura"]) }),
      Object.freeze({ label: "役どころ", tables: Object.freeze(["role_master"]) }),
      Object.freeze({ label: "公演", tables: Object.freeze(["project_master"]) }),
      Object.freeze({ label: "行事の 出欠", tables: Object.freeze(["org_event_participants"]) })
    ])
  }),
  Object.freeze({
    group: "羊のおうち",
    items: Object.freeze([
      Object.freeze({ label: "手に入れたものの 台帳", tables: Object.freeze(["item_acquisitions"]) }),
      Object.freeze({ label: "持ち物", tables: Object.freeze(["character_inventory"]) })
    ])
  }),
  Object.freeze({
    group: "学ぶ",
    items: Object.freeze([
      Object.freeze({ label: "読んだ 記事", tables: Object.freeze(["article_progress"]) }),
      Object.freeze({ label: "章の 開け閉め", tables: Object.freeze(["chapter_state"]) })
    ])
  }),
  Object.freeze({
    group: "同意・お知らせ",
    items: Object.freeze([
      Object.freeze({ label: "同意の 記録（いつ・どの 文面に）", tables: Object.freeze(["consent_records"]) }),
      Object.freeze({ label: "有料機能への 申告", tables: Object.freeze(["minor_billing_consents"]) }),
      Object.freeze({ label: "年齢の 答えを 変えた 記録", tables: Object.freeze(["age_answer_changes"]) }),
      Object.freeze({ label: "あなたに 送った お知らせ", tables: Object.freeze(["notice_targets"]) })
    ])
  }),
  Object.freeze({
    group: "教室・共有",
    items: Object.freeze([
      Object.freeze({ label: "所属と、教室が 付けた 呼び方", tables: Object.freeze(["memberships"]) }),
      // ★★共有の 履歴は 表の まま 出しません。★`sanitizeShareHistory` を 通します。
      //   ★★相手を 特定できる 値を 落とし、★「連携1」「連携2」と 番号だけ 振ります。
      Object.freeze({ label: "共有の 履歴（お相手の 名前は 入りません）", tables: Object.freeze([]) })
    ])
  }),
  Object.freeze({
    group: "あなたの 設定",
    items: Object.freeze([
      Object.freeze({ label: "プロフィール（決まった 項目だけ）", tables: Object.freeze([]) })
    ])
  })
]);

/**
 * ★入って いない ものを、★はっきり 書きます（★裁定 ㋑
 *   「含まれないものが あれば 明記」）。
 *
 *   ★★黙って 外すと、★「全部 入って いる」と 読まれます。
 *   ★★どれも わけが あって 外して います。★わけも 一緒に 書きます。
 */
export const EXPORT_EXCLUDED = Object.freeze([
  Object.freeze({
    label: "先生が 書いた メモ",
    why: "お相手の 書かれた ものです。あなたの ものでは ありません。"
  }),
  Object.freeze({
    label: "お相手の 名前・連絡先",
    why: "共有の 履歴からも 落として います。「連携1」「連携2」と 番号だけ 残します。"
  }),
  Object.freeze({
    label: "運営が まとめて 送った お知らせの 束",
    why: "ほかの 方の 分も 混ざって います。あなた宛ての 分だけを 入れて います。"
  })
]);

/**
 * ★1つの 列の 見出し。/**
 * ★1つの 列の 見出し。
 *
 *   ★★名前が 無ければ、★**列名の まま**返します。★空に しません。
 *     ★★空に すると、★どの 列か 分からなく なります。
 *     ★★見張りが「名前の 無い 列」として 数えます。
 */
export function headingOf(column) {
  const key = String(column == null ? "" : column);
  return ENTRY_COLUMN_LABELS[key] || key;
}

/** ★名前の 付いて いない 列を 並べます（★見張り用）。 */
export function unlabeledColumns(columns) {
  return (Array.isArray(columns) ? columns : [])
    .filter((c) => !Object.prototype.hasOwnProperty.call(ENTRY_COLUMN_LABELS, String(c)));
}

/**
 * ★見出しに 禁止語が 入って いる ものを 並べます（★見張り用）。
 *
 *   ★★返すのは `{ column, heading, word }` の 並びです。
 *   ★★1件でも あれば、★見張りは **落ちます**。★警告では ありません。
 */
export function forbiddenHeadings() {
  const out = [];
  Object.keys(ENTRY_COLUMN_LABELS).forEach((col) => {
    const h = ENTRY_COLUMN_LABELS[col];
    FORBIDDEN_IN_HEADING.forEach((w) => {
      if (h.includes(w)) out.push({ column: col, heading: h, word: w });
    });
  });
  return out;
}

/** CSV の1セルを安全にする（改行・カンマ・引用符を含む値に対応）。 */
export function csvCell(value) {
  if (value === null || value === undefined) return "";
  let s;
  if (typeof value === "object") s = JSON.stringify(value);
  else s = String(value);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/**
 * 日々の記録を、日付1行のCSVにする。
 * 列は、実際に含まれている全キーの和集合から作る（欠けた項目は空欄）。
 *
 * ★entries に列を足したとき、ここに書き足す必要はありません。
 *   行に入っていれば、自動で列になります（type_fields もそうです）。
 *   ★プロフィール側は違います。EXPORTED_PROFILE_COLUMNS に
 *     明示的に並べた列だけが出るので、足したら書き足してください。
 *   2026-08-29 に、この違いを取り違えて「type_fields が書き出しから
 *   漏れている」と報告しかけました。漏れていません。
 */
export function entriesToCsv(entries) {
  const rows = Array.isArray(entries) ? entries : [];
  if (rows.length === 0) return "";
  const keys = [];
  const seen = new Set();
  rows.forEach((r) => Object.keys(r).forEach((k) => { if (!seen.has(k)) { seen.add(k); keys.push(k); } }));
  // 日付を先頭に固定すると、表計算ソフトで並べ替えやすい
  keys.sort((a, b) => (a === "date" ? -1 : b === "date" ? 1 : 0));
  // ★★見出しを 日本語に します（★裁定 2026-09-15・Opus ㋒）。
  //   ★★見本 `SC['書き出す']` の `.wl` ──
  //     「見出しは、画面と 同じ ことばです（のどの調子／声の出来 …）。」
  //   ★★名前の 無い 列は、★列名の まま 出ます（★`headingOf`）。★空に しません。
  //   ★★中身は 1つも 変えて いません。★見出しの 行 だけ です。
  const head = keys.map((k) => csvCell(headingOf(k))).join(",");
  const body = rows.map((r) => keys.map((k) => csvCell(r[k])).join(",")).join("\n");
  return head + "\n" + body;
}

/** 書き出し全体の形。JSONファイルの中身になる。 */
export function buildExportPayload({ profile, tables, exportedAt }) {
  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt,
    note: "Woolsong から書き出したあなた自身の記録です。すべての項目を含んでいます。",
    profile: profile || null,
    ...tables
  };
}
