// ============================================================================
// 「記録」の 画面（A03）の 決めごと ── 1か所
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の S_kiroku()（★616〜690行）。★これが 唯一の 正です。
//     ★★静止画（screens/*.html）は 参照元から 外れました
//       （★docs/design/pack-final/00-はじめに読む-正誤表（9月10日）.md §1）。
//
//   ★★見本の 記録の 画面
//     ★あさ　　　… 起きたときの むくみ（3択）／ 昨夜の 睡眠（＋の行）
//     ★よる　　　… のどの 調子（3択）／ 声の 出来（3択）／
//     　　　　　　 本番以外で 声を使った時間（＋の行）
//     ★足す　　　… 本番・レッスン ／ 食べたもの ／ からだのこと ／ ひとこと
//     ★［きょうは 書かない］［出す］
//
//   ★★3択が 3つ、★＋の行が 6つ、★ボタンが 2つ。★以上です。
//     ★★折りたたみ 5つ（RECORD_FOLDS）は、★9月9日の 古い見本の ものでした。
//       ★★9月11日、★見本の「あさ／よる／足す」に 置き換えました。
//
//   ★★どこへ 書くか、が この帳面の 肝です。
//     ★entries は 1日1行ですが、★声の記録は voiceEntries[] という
//       場面ごとの 束に なっており、★throat_condition ／ voice_quality は
//       その 代表から 導かれます（★entryToRow の
//       deriveLegacyVoiceFieldsFromEntries）。
//     ★★だから、★formData.throatCondition に 書いても、
//       ★場面の記録が 1つでも あれば、★その値は 捨てられます。
//     ★★同じ決めを 2か所に 書かないため、★行き先を 決めるのは この帳面だけです。
//
//   ★★のど と 出来 の 行き先（★2026-09-11・見本が 3択を 2つに 分けたため）
//     ★のどの 調子 → voiceEntries[].bodyFeel（★「喉の身体感覚」）→ throat_condition
//     ★声の 出来　 → voiceEntries[].quality （★「声の出来」0〜10）→ voice_quality
//     ★★9月9日の 見本は 3択が 1つだけで、★「出た／ふつう／出づらい」を
//       ★throat_condition に 書いていました。★列の 意味と ずれていました。
//     ★★新しい列を 1つも 作っていません。★どちらも もとから ある 列です。
//
//   ★見張り components/tests/record-v2.test.js
//         components/tests/a03-kiroku.test.js
// ============================================================================

/** ★3択の 印。★左が よいほう。★色では なく 形で 分けます（★色覚多様性）。 */
export const MARKS = Object.freeze(["◎", "○", "△"]);

/** ★起きたときの むくみ（★あさ）。★→ morningEdema（0／1／2）。 */
export const EDEMA_CHOICES = Object.freeze(["ない", "すこし", "ある"]);

/** ★のどの 調子（★よる）。★→ bodyFeel ／ throat_condition（4／3／2）。 */
export const THROAT_CHOICES = Object.freeze(["よい", "ふつう", "わるい"]);

/** ★声の 出来（★よる）。★→ quality ／ voice_quality（4／3／2）。 */
export const DEKI_CHOICES = Object.freeze(["出た", "ふつう", "出づらい"]);

/** ★見出し（★見本 .h3）。 */
export const A03_HEADS = Object.freeze({
  morning: "あさ",
  night: "よる",
  add: "足す（どれも 任意）"
});

/** ★3択の 題（★見本の tri の 第2引数）。 */
export const A03_TITLES = Object.freeze({
  edema: "起きたときの むくみ",
  throat: "のどの 調子",
  deki: "声の 出来"
});

/**
 * ★よる の 3択の 下の しるし（★見本 .warn）。★1文字も 変えないこと。
 *
 *   ★★「聞かない」と 画面で 約束しています。
 *     ★だから 湿度の 入力欄を、★門の中では 出しません。
 */
export const A03_ASK_NOTE =
  "部屋の しめり は こちらで 取ります。本番・レッスンの 翌日かどうかも、"
  + "予定から 分かります。この2つは 聞きません。";

/** ★いちばん下の しるし 3行（★見本 .note）。★1文字も 変えないこと。 */
export const A03_NOTES = Object.freeze([
  "「n/5」を 出しません。",
  "書かなかった行に 赤い印を つけません。必須は 1つも ありません。",
  "「夜の3つが 入れば その日は 記録した日」── この規則を 画面に 書きません。"
]);

/** ★下の ボタン 2つ（★見本 .two）。 */
export const A03_SKIP = "きょうは 書かない";
export const A03_SUBMIT = "出す";

/** ★印。★並びが 印を 決めます。★組ごとに 書き写しません。 */
export function markOf(choices, word) {
  const i = (choices || []).indexOf(word);
  return i < 0 ? "" : MARKS[i];
}

/**
 * ★1〜5 の 目盛りの 上の 3択（★のど・出来 とも 同じ 切り方）。
 *
 *   ★★5 や 1 を 書きません。★端を 使うと、★これまで 5 と 書いてきた方の
 *     記録と、★同じ言葉なのに 値が ずれます。
 */
export function fiveOf(choices, word) {
  const i = (choices || []).indexOf(word);
  if (i < 0) return null;
  return [4, 3, 2][i];
}

/** ★1〜5 を 3択の 言葉に 戻します（★fiveOf の 逆）。 */
export function wordOfFive(choices, v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (v >= 4) return choices[0];
  if (v <= 2) return choices[2];
  return choices[1];
}

/** ★むくみは 0／1／2 です（★列の check 制約が この3つだけを 通します）。 */
export function edemaValue(word) {
  const i = EDEMA_CHOICES.indexOf(word);
  return i < 0 ? null : i;
}

/** ★0／1／2 を 言葉に 戻します。 */
export function edemaWord(v) {
  return typeof v === "number" && EDEMA_CHOICES[v] ? EDEMA_CHOICES[v] : null;
}

/** ★1〜5 を 0〜10 に（★VocalTracker の fiveScaleToQuality10 と 同じ式）。 */
export function fiveToQuality10(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return ((v - 1) / 4) * 10;
}

/** ★0〜10 を 1〜5 に（★quality10ToFiveScale と 同じ式）。 */
export function quality10ToFive(q) {
  if (typeof q !== "number" || !Number.isFinite(q)) return null;
  return Math.round((q / 10) * 4 + 1);
}

/**
 * ★その日の 声の 記録が、★場面ごとに 書かれているか。
 *
 *   ★★rowToEntry は、★1日ぶんの throat_condition から、
 *     ★正午の 場面の記録を 1件 作ります（migrateLegacyToVoiceEntries）。
 *     ★それは 移行で 作った 写しであって、★場面ごとの 記録では ありません。
 *   ★★見分け方。★移行で 作った 写しは source が "migrated" で
 *     context が "other" です。★朝／昼／晩に 分けて 書かれた 日は ちがいます。
 */
export function hasSceneCondition(entry) {
  const ve = entry && entry.voiceEntries;
  if (!Array.isArray(ve)) return false;
  return ve.some((v) => {
    if (!v) return false;
    const hasBody = typeof v.bodyFeel === "number" && Number.isFinite(v.bodyFeel);
    const hasQual = typeof v.quality === "number" && Number.isFinite(v.quality);
    if (!hasBody && !hasQual) return false;
    if (v.source === "migrated" && v.context === "other") return false;
    return true;
  });
}

/**
 * ★3択を 出してよいか。
 *
 *   ★★場面ごとに もう 書いてある日は、★出しません（★上書きを しないため）。
 *     ★「受け取ったもの・書いたものを 黙って 消さない」という 決めです。
 */
export function mayUseQuickCondition(entry) {
  return !hasSceneCondition(entry);
}

/** ★いま 選ばれている のどの 調子（★1〜5）。 */
export function readThroatValue(entry) {
  if (!entry || hasSceneCondition(entry)) return null;
  const ve = entry.voiceEntries;
  if (Array.isArray(ve) && ve.length > 0) {
    const v = ve[0] && ve[0].bodyFeel;
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  const t = entry.throatCondition;
  return typeof t === "number" && Number.isFinite(t) ? t : null;
}

/** ★いま 選ばれている 声の 出来（★1〜5）。 */
export function readDekiValue(entry) {
  if (!entry || hasSceneCondition(entry)) return null;
  const ve = entry.voiceEntries;
  if (Array.isArray(ve) && ve.length > 0) {
    const q = ve[0] && ve[0].quality;
    const f = quality10ToFive(q);
    if (f != null) return f;
  }
  const v = entry.voiceQuality;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * ★のどの 調子を 押したときの、★次の記録の姿を 返します。
 *
 *   ★★もとの記録を 書き換えません。★新しい姿を 返すだけです。
 *   ★★場面の記録が 空で 1つ あるなら、★その 空いた所に 書きます。
 */
export function applyThroatWord(entry, word) {
  const value = fiveOf(THROAT_CHOICES, word);
  if (value == null) return entry;
  const base = entry || {};
  if (hasSceneCondition(base)) return base;
  const ve = base.voiceEntries;
  if (Array.isArray(ve) && ve.length > 0) {
    const next = ve.map((v, i) => (i === 0 ? { ...v, bodyFeel: value } : v));
    return { ...base, voiceEntries: next, throatCondition: value };
  }
  return { ...base, throatCondition: value };
}

/**
 * ★声の 出来を 押したときの、★次の記録の姿。
 *
 *   ★★しまうのは quality（0〜10）です。★voice_quality は そこから 出ます。
 *     ★resonance_score にも 同じ値が 入ります（★列の 決めが そうなっています）。
 */
export function applyDekiWord(entry, word) {
  const five = fiveOf(DEKI_CHOICES, word);
  if (five == null) return entry;
  const q = fiveToQuality10(five);
  const base = entry || {};
  if (hasSceneCondition(base)) return base;
  const ve = base.voiceEntries;
  if (Array.isArray(ve) && ve.length > 0) {
    const next = ve.map((v, i) => (i === 0 ? { ...v, quality: q } : v));
    return { ...base, voiceEntries: next, voiceQuality: five, resonanceScore: q };
  }
  return { ...base, voiceQuality: five, resonanceScore: q };
}

/** ★むくみを 押したとき。★1つの 列に 入れるだけです。 */
export function applyEdemaWord(entry, word) {
  const v = edemaValue(word);
  if (v == null) return entry;
  return { ...(entry || {}), morningEdema: v };
}


// ============================================================================
// 古い 節を、★見本の どの 1枚に 入れるか
//
//   ★出どころ 坂本さんの お決め（★2026-09-11）
//     docs/reports/2026-09-11-A03の古い節の仕分け.md §3・§4 への ご返事
//
//   ★★③引っ越す ── ★機能は そのまま。★置き場所だけ 変わります。
//     ★声・喉　　　　　→ こえ の 1枚
//     ★睡眠　　　　　　→ ねむり の 1枚
//     ★練習・公演　　　→ 本番・レッスン の 1枚
//     ★食事の詳細記録　→ 食べたもの の 1枚
//     ★メモ　　　　　　→ ひとこと の 1枚
//
//   ★★お決めで 移したもの
//     ★お仕事に合わせた記録 → ★足す の 7つめ（★お決め 2 ㋐）
//     ★今日の身体　　　　　 → ★からだのこと の 1枚（★お決め 4 ㋐）
//     ★水分　　　　　　　　 → ★食べたもの の 1枚（★お決め 8 ㋐）
//     ★運動記録・メンタル　 → ★からだのこと の 1枚（★お決め 11・12 ㋐）
//
//   ★★気候・滞在地（env）は 表に ありません。
//     ★お決め 5-b ㋒「当面、そのまま、下に残す」。★1枚に 入れません。
//     ★★だから、★1枚が 開いていない ときにだけ 画面に 出ます。
//
//   ★★節を 動かしていません。★どこに 出すかを、★この表が 決めるだけです。
//     ★動かすと、★入れ子の 条件（showGroup・型ごとの項目）が ずれます。
// ============================================================================

export const SECTION_SHEETS = Object.freeze([
  Object.freeze({ sheet: "ねむり", sections: Object.freeze(["sleep"]) }),
  Object.freeze({ sheet: "こえ", sections: Object.freeze(["voice"]) }),
  Object.freeze({ sheet: "ほんばん", sections: Object.freeze(["practice"]) }),
  Object.freeze({ sheet: "たべ", sections: Object.freeze(["hydration", "meal"]) }),
  Object.freeze({ sheet: "からだ", sections: Object.freeze(["body", "exercise", "mental"]) }),
  Object.freeze({ sheet: "ひとこと", sections: Object.freeze(["practiceNote"]) }),
  Object.freeze({ sheet: "しごと", sections: Object.freeze(["typeFields"]) })
]);

/** ★その節は、★どの 1枚の 中に 出るか。★どこにも 入らないものは null。 */
export function sheetOfSection(sectionKey) {
  const f = SECTION_SHEETS.find((x) => x.sections.includes(sectionKey));
  return f ? f.sheet : null;
}

/**
 * ★その節を、★いま 出してよいか。
 *
 *   ★★門の外（layoutV2 でない方）は、★これまでどおり 全部 出ます。
 *     ★★38人の 画面を、★1つも 変えません。
 *   ★★表に 載っていない節（★気候・滞在地）は、
 *     ★1枚が 開いていない ときだけ 出ます。★1枚の 中には 入りません。
 */
export function sectionIsOpen(sectionKey, { layoutV2, openSheet }) {
  if (!layoutV2) return true;
  const sheet = sheetOfSection(sectionKey);
  // ★★門の中では、★1枚に 入る 節を 出しません（★2026-09-11・お決め ㋐）。
  //
  //   ★★そこまでの 経緯を、★短く 書いておきます。
  //     ★① はじめ、★節を 1枚の 中へ 引っ越しました（★③引っ越す）。
  //     ★② 見本に 無い ものが 1枚の 下に 並び、★古い 画面に 見えました。
  //     ★③ そこで「詳しく」に 畳みました（★㋒）。
  //     ★④ ★★その「詳しく」自体が、★見本の どこにも ありません。
  //       ★見本 4本に <details> は 0件、★<summary> も 0件です。
  //       ★「詳しく」の 語は 4か所 ありますが、★どれも 別の 機能の 名前です
  //       （★「詳しく 書く（分で）」「詳しく 数える」）。
  //     ★⑤ ★私が 独自に 足した 仕組みでした。★坂本さんの お決めで 外します。
  //
  //   ★★列も、★これまでに 書かれた 値も、★1つも 消していません。
  //     ★消したのは「画面に 出す」ことだけです。
  //   ★★どこに 置き直すかは、★すべての 画面が 見本どおりに なった あとで、
  //     ★改めて お決めいただきます（★坂本さん・2026-09-11）。
  if (sheet != null) return false;
  // ★★表に 載っていない節（★気候・滞在地）は、
  //   ★1枚が 開いていない ときだけ 出ます（★お決め 5-b ㋒）。
  return openSheet == null;
}


// ============================================================================
// 気になったこと（印）の 行き先 ── 1つの 列に、★2つの 入口
//
//   ★★2026-09-11、★実機で「からだのこと で つけた 印が 消える」と 分かりました。
//     ★出どころ docs/reports/2026-09-11-A03シートの精査.md §1
//
//   ★★何が 起きていたか
//     ★列は throat_symptoms 1つですが、★書く 場所が 2つ あります ──
//       ★① からだのこと の 1枚（★その日 ぜんぶ）
//       ★② 声・喉 の 場面ごとの 記録（★VoiceEntryEditor の symptoms）
//     ★★entryToRow は、★場面が 1つでも あれば ②を 使い、★①を 捨てていました。
//     ★★場面は、★1度 保存して 読み直せば 必ず 1件 作られます
//       （migrateLegacyToVoiceEntries）。★だから 2度目からは 必ず 消えました。
//
//   ★★どう 直したか
//     ★★①を 正に します。★entryToRow は e.throatSymptoms を そのまま 書きます。
//     ★★②を 触ったときは、★ここで ①に 映します。
//       ★どちらの 入口から 書いても、★列に 届きます。
//     ★★消えるのは、★その 場面から 外した 印だけです。
//       ★①だけに ある 印（★場面に 無い もの）は、★残します。
// ============================================================================

/** ★場面ぜんぶの 印を 1つに まとめます。 */
export function sceneSymptomsOf(voiceEntries) {
  if (!Array.isArray(voiceEntries)) return [];
  return [...new Set(voiceEntries.flatMap((v) => (v && v.symptoms) || []))];
}

/**
 * ★場面の 記録を 差し替えたときの、★その日 ぜんぶの 印。
 *
 *   @param entry      ★いまの記録
 *   @param nextScenes ★差し替えた あとの 場面の 記録
 *
 *   ★★残すもの
 *     ★新しい 場面ぜんぶの 印
 *     ★★その日の 印の うち、★どの 場面にも 無かった もの
 *       （★からだのこと の 1枚だけで つけた 印です。★消しません）
 */
export function mergeSceneSymptoms(entry, nextScenes) {
  const base = entry || {};
  const before = sceneSymptomsOf(base.voiceEntries);
  const after = sceneSymptomsOf(nextScenes);
  const dayOnly = (base.throatSymptoms || []).filter((s) => !before.includes(s));
  return [...new Set([...after, ...dayOnly])];
}
