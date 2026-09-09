// ============================================================================
// 「記録した日」の 数え方 ── 夜の3項目だけ（2026-09-09）
//
//   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §10
//     「★夜の3項目（のどの調子・声の出来・声を使った時間）が 入った日
//       　　＝ ★記録した日
//      ★朝の2項目（むくみ・昨夜の睡眠）は ★任意。
//       　　★入っていなくても 記録した日です
//      ★カレンダーの色も、★夜の3項目で 付きます。」
//
//   ★★なぜ こう 数えるのか
//     ★記録を 朝と夜の 二段に した ぶんだけ、★失敗の 機会が 増えました。
//     ★★朝を 逃した日が「記録していない日」に なると、
//       ★二段にしたことが、★そのまま 罰に なります。
//     ★★数え方で、★それを 打ち消します（★§10）。
//
//   ★★これは lib/character.js の hasAnyRecord とは ★別のものです。
//     ★★1つに しないこと。★別の問いに 答えています。
//       ★hasAnyRecord　… ★「てん」を 差し上げてよいか。
//         ★開いて 何か 書いてくださった日は、★すべて 数えます。★広いです。
//         ★「開いてくれた日を 無にしない」ためです。
//       ★★こちら　　　 … ★分析と カレンダーが「記録した日」と 見なす日。
//         ★声の3つが そろって はじめて、★くらべる 材料に なります。★狭いです。
//     ★★広いほうを 狭めると、★書いた日に てんが 付かなくなります。
//     ★★狭いほうを 広げると、★材料の 無い日を 分析が 数えます。
//
//   ★見張り components/tests/recorded-day.test.js
// ============================================================================

/**
 * ★夜の3項目。★§10 の 言葉の ままです。
 *
 *   ★のどの調子　　　throatCondition
 *   ★声の出来　　　　voiceQuality
 *   ★声を使った時間　nonPerformanceSpeechMinutes
 */
export const NIGHT_THREE = Object.freeze([
  { key: "throatCondition", label: "のどの調子" },
  { key: "voiceQuality", label: "声の出来" },
  { key: "nonPerformanceSpeechMinutes", label: "声を使った時間" }
]);

/**
 * ★朝の2項目。★任意です。★入っていなくても「記録した日」です。
 *
 *   ★むくみ　　　　　morningEdema
 *   ★昨夜の睡眠　　　sleepHours
 *
 *   ★★ここに 載せるのは、★「数えない」と 決めたことを 残すためです。
 *     ★載っていないと、★次に 誰かが 足してしまいます。
 */
export const MORNING_TWO = Object.freeze([
  { key: "morningEdema", label: "むくみ" },
  { key: "sleepHours", label: "昨夜の睡眠" }
]);

/** ★数として 書かれているか。★0 も「書いた」です。★null と 分けます。 */
function written(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * ★その日の 声の記録を、★1つの 姿に します。
 *
 *   ★★声は voiceEntries[]（★場面ごと）に 入っていることが あります。
 *     ★★上の throatCondition だけを 見ると、★場面ごとに 書いた日を
 *       ★「記録していない日」と 数えてしまいます。
 *     ★entryToRow が 中央値から 導くのと、★同じ考え方です。
 */
function voiceOf(entry, key) {
  if (written(entry[key])) return entry[key];
  const ve = entry.voiceEntries;
  if (!Array.isArray(ve)) return null;
  // ★voiceEntries の 中の 呼び名は ちがいます。★ここで 合わせます。
  const inner = key === "throatCondition" ? "bodyFeel" : key === "voiceQuality" ? "quality" : null;
  if (!inner) return null;
  const hit = ve.find((v) => v && written(v[inner]));
  return hit ? hit[inner] : null;
}

/**
 * ★その日は「記録した日」か。
 *
 *   ★★3つ そろって、はじめて そうです。★1つでも 欠けたら 数えません。
 *     ★★§10 は「夜の3項目が 入った日」と 書いています。
 *     ★「どれか1つ」では ありません。
 */
export function isRecordedDay(entry) {
  if (!entry) return false;
  return NIGHT_THREE.every((f) => written(voiceOf(entry, f.key)));
}

/** ★3つのうち、★いくつ 書いてあるか（★カレンダーの 濃さに 使えます）。 */
export function nightThreeCount(entry) {
  if (!entry) return 0;
  return NIGHT_THREE.filter((f) => written(voiceOf(entry, f.key))).length;
}

/**
 * ★記録した日の 数。
 *
 *   ★★entries の 鍵の数では ありません。★開いただけの日が 入ります。
 */
export function countRecordedDays(entries) {
  return Object.keys(entries || {}).filter((d) => isRecordedDay(entries[d])).length;
}

/** ★記録した日の 並び（★古い順）。 */
export function recordedDates(entries) {
  return Object.keys(entries || {}).filter((d) => isRecordedDay(entries[d])).sort();
}
