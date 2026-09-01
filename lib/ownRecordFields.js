// ============================================================================
// 「自分の記録」に返す項目の一覧
//
//   ★憲章 §10「書けるのに、本人に返らない項目を作らない」を、
//     実際に守らせるための表です。
//
//   ★なぜ要るのか（2026-09-01 に数えて分かったこと）
//     記録される項目は65個ありました。そのうち
//       ・throatSymptomsOther（自由記述の症状）
//       ・pianissimoOnsetDelay（弱声の立ち上がりの遅れ）
//       ・activityDetail（活動の詳細）
//     は、保存されるだけで★どこにも表示されていませんでした。
//     利用者が自分の言葉で書いた症状が、二度と本人に返らない状態でした。
//
//     さらに waterIntake・exerciseMinutes などは、
//     ★相関が統計的に有意になった日にしか画面に出ませんでした。
//     3重ゲート（n≥10・|g|≥0.4・FDR q<0.10）は
//     「関係についての主張」に掛けるものです。
//     ★記録そのものに掛けてはいけません（課金の器と無料枠.md §3）。
//
//   ★この表の使い方
//     ・新しい記録項目を足したら、ここにも足すこと。
//       足し忘れると components/tests/own-record-fields.test.js が落ちます。
//     ・表示は生の値だけです。「高めでした」のような解釈を足さないこと。
//     ・良い／悪いの色分けをしないこと（信号機の色は使わない）。
//
//   ★ここは「記録の側」の画面です。分析タブには置きません。
//     同じ数字でも、置く場所で読まれ方が変わります。
//     分析は「判断が住む場所」、こちらは「記録がそのまま返る場所」です。
// ============================================================================

/**
 * 表示の種類。値の形が違うので、描き方も違います。
 *
 *   number       数と、30日の折れ線
 *   text         書いた文字を、日付つきで並べる（★自由記述はこれ）
 *   tags         選んだタグを、日付つきで並べる
 *   boolean      あった／なかったを、日付つきで並べる
 *   object       中身をそのまま見せる（鍵と値）
 *   activities   その日の活動（種類と分）
 *   voiceEntries 1日の中の各回（時刻・喉・声・MPT など）
 */
export const OWN_RECORD_KINDS = ["number", "text", "tags", "boolean", "object", "activities", "voiceEntries"];

/**
 * ★entries に記録される項目のうち、date 以外のすべて。
 *   date は「いつの記録か」であって、記録した中身ではないので入れません。
 */
export const OWN_RECORD_FIELDS = [
  { key: "throatCondition", label: "のどの調子", unit: "", kind: "number", get: (e) => e.throatCondition },
  { key: "voiceQuality", label: "声の出来", unit: "", kind: "number", get: (e) => e.voiceQuality },
  { key: "resonanceScore", label: "響きのスコア", unit: "", kind: "number", get: (e) => e.resonanceScore },
  { key: "throatSymptoms", label: "のどの症状", unit: "", kind: "tags", get: (e) => e.throatSymptoms },
  { key: "throatSymptomsOther", label: "のどの症状（自由記述）", unit: "", kind: "text", get: (e) => e.throatSymptomsOther },
  { key: "morningEdema", label: "起きたときのむくみ", unit: "", kind: "number", get: (e) => e.morningEdema },
  { key: "sleepHours", label: "睡眠時間", unit: "時間", kind: "number", get: (e) => e.sleepHours },
  { key: "sleepQuality", label: "睡眠の質", unit: "", kind: "number", get: (e) => e.sleepQuality },
  { key: "bedtime", label: "就寝時刻", unit: "", kind: "text", get: (e) => e.bedtime },
  { key: "waterIntake", label: "水分", unit: "ml", kind: "number", get: (e) => e.waterIntake },
  { key: "waterBySlot", label: "時間帯ごとの水分", unit: "", kind: "object", get: (e) => e.waterBySlot },
  { key: "mealNotes", label: "食事のメモ", unit: "", kind: "text", get: (e) => e.mealNotes },
  { key: "meals", label: "食事", unit: "", kind: "tags", get: (e) => e.meals },
  { key: "dinnerTime", label: "夕食の時刻", unit: "", kind: "text", get: (e) => e.dinnerTime },
  { key: "dinnerTags", label: "夕食の内容", unit: "", kind: "tags", get: (e) => e.dinnerTags },
  { key: "carbs", label: "炭水化物", unit: "g", kind: "number", get: (e) => e.carbs },
  { key: "protein", label: "たんぱく質", unit: "g", kind: "number", get: (e) => e.protein },
  { key: "fat", label: "脂質", unit: "g", kind: "number", get: (e) => e.fat },
  { key: "fiber", label: "食物繊維", unit: "g", kind: "number", get: (e) => e.fiber },
  { key: "proteinLevel", label: "たんぱく質の量感", unit: "", kind: "number", get: (e) => e.proteinLevel },
  { key: "calorieLevel", label: "食事の量感", unit: "", kind: "number", get: (e) => e.calorieLevel },
  { key: "weightKg", label: "体重", unit: "kg", kind: "number", get: (e) => e.weightKg },
  { key: "bodyFatPct", label: "体脂肪率", unit: "%", kind: "number", get: (e) => e.bodyFatPct },
  { key: "exerciseMinutes", label: "運動の時間", unit: "分", kind: "number", get: (e) => e.exerciseMinutes },
  { key: "exerciseLevel", label: "運動の強さ", unit: "", kind: "number", get: (e) => e.exerciseLevel },
  { key: "exercises", label: "運動の種類", unit: "", kind: "tags", get: (e) => e.exercises },
  { key: "activityType", label: "その日の活動（保存された値）", unit: "", kind: "text", get: (e) => e.activityType },
  { key: "activityDuration", label: "活動の時間（保存された値）", unit: "分", kind: "number", get: (e) => e.activityDuration },
  { key: "activityDetail", label: "活動の詳細", unit: "", kind: "object", get: (e) => e.activityDetail },
  { key: "activities", label: "活動", unit: "", kind: "activities", get: (e) => e.activities },
  { key: "recovery", label: "休養", unit: "", kind: "object", get: (e) => e.recovery },
  { key: "loadDetail", label: "負荷の詳細", unit: "", kind: "object", get: (e) => e.loadDetail },
  { key: "repertoire", label: "曲・レパートリー", unit: "", kind: "text", get: (e) => e.repertoire },
  { key: "performanceQuality", label: "本番の出来", unit: "", kind: "number", get: (e) => e.performanceQuality },
  { key: "ease", label: "楽さ", unit: "", kind: "number", get: (e) => e.ease },
  { key: "speakingLevel", label: "話した量", unit: "", kind: "number", get: (e) => e.speakingLevel },
  { key: "nonPerformanceSpeechMinutes", label: "本番以外で声を使った時間", unit: "分", kind: "number", get: (e) => e.nonPerformanceSpeechMinutes },
  { key: "longestSpeechBlockMinutes", label: "いちばん長く話し続けた時間", unit: "分", kind: "number", get: (e) => e.longestSpeechBlockMinutes },
  { key: "notes", label: "メモ", unit: "", kind: "text", get: (e) => e.notes },
  { key: "voiceMemo", label: "声の一言メモ", unit: "", kind: "text", get: (e) => e.voiceMemo },
  { key: "voiceCheckins", label: "時間帯ごとの声", unit: "", kind: "object", get: (e) => e.voiceCheckins },
  { key: "voiceEntries", label: "声の記録（1日の中の各回）", unit: "", kind: "voiceEntries", get: (e) => e.voiceEntries },
  { key: "mptSeconds", label: "最長発声時間（MPT）", unit: "秒", kind: "number", get: (e) => { const v = (e.voiceEntries || []).map((x) => x.mptSeconds).filter((n) => typeof n === "number"); return v.length ? Math.max(...v) : null; } },
  { key: "wakeNote", label: "起き抜けの音名", unit: "", kind: "text", get: (e) => e.wakeNote },
  { key: "routineNote", label: "ルーティン後の音名", unit: "", kind: "text", get: (e) => e.routineNote },
  { key: "pianissimoHighNote", label: "弱声の最高音", unit: "", kind: "text", get: (e) => e.pianissimoHighNote },
  { key: "pianissimoOnsetDelay", label: "弱声の立ち上がりの遅れ", unit: "", kind: "boolean", get: (e) => e.pianissimoOnsetDelay },
  { key: "cppsValue", label: "CPPS（声の明瞭さ）", unit: "dB", kind: "number", get: (e) => e.cppsValue },
  { key: "mentalTags", label: "気持ちのタグ", unit: "", kind: "tags", get: (e) => e.mentalTags },
  { key: "mentalReason", label: "気持ちの理由", unit: "", kind: "text", get: (e) => e.mentalReason },
  { key: "temperature", label: "気温", unit: "℃", kind: "number", get: (e) => e.temperature },
  { key: "humidity", label: "湿度", unit: "%", kind: "number", get: (e) => e.humidity },
  { key: "weather", label: "天気", unit: "", kind: "text", get: (e) => e.weather },
  { key: "weatherSource", label: "天気の取得元", unit: "", kind: "text", get: (e) => e.weatherSource },
  { key: "location", label: "滞在地", unit: "", kind: "text", get: (e) => e.location },
  { key: "environmentTags", label: "環境のタグ", unit: "", kind: "tags", get: (e) => e.environmentTags },
  { key: "ambientNoiseDb", label: "まわりの音の大きさ", unit: "dB", kind: "number", get: (e) => e.ambientNoiseDb },
  { key: "noisyEnvironment", label: "うるさい場所にいた", unit: "", kind: "boolean", get: (e) => e.noisyEnvironment },
  { key: "flightHours", label: "飛行時間", unit: "時間", kind: "number", get: (e) => e.flightHours },
  { key: "jetlagHours", label: "時差", unit: "時間", kind: "number", get: (e) => e.jetlagHours },
  { key: "smokedToday", label: "喫煙", unit: "", kind: "boolean", get: (e) => e.smokedToday },
  { key: "drankToday", label: "飲酒", unit: "", kind: "boolean", get: (e) => e.drankToday },
  { key: "medicationTags", label: "服薬", unit: "", kind: "tags", get: (e) => e.medicationTags },
  { key: "cycleStart", label: "月経周期の開始", unit: "", kind: "boolean", get: (e) => e.cycleStart },
  { key: "typeFields", label: "職業ごとの項目", unit: "", kind: "object", get: (e) => e.typeFields },
];

/** date は中身ではないので、表に載せません。 */
export const NOT_A_RECORDED_VALUE = ["date"];

const BY_KEY = OWN_RECORD_FIELDS.reduce((a, f) => { a[f.key] = f; return a; }, {});
export function ownRecordField(key) { return BY_KEY[key] || null; }

/**
 * その値が「記録された」と言えるか。
 *
 * ★0 と false は「記録された」です。null と undefined と空だけが「まだ」です。
 *   むくみ0（なし）を「記録していない」にすると、
 *   ★答えた人の答えが消えます。
 */
export function hasValue(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

/**
 * その人が実際に記録したことのある項目だけを返す。
 *
 * ★一度も触っていない項目は出しません。
 *   空の欄を65個並べても、自分の記録には見えません。
 */
export function recordedFieldsFor(entries) {
  const days = Object.values(entries || {});
  if (days.length === 0) return [];
  return OWN_RECORD_FIELDS.filter((f) => days.some((e) => {
    try { return hasValue(f.get(e)); } catch (err) { return false; }
  }));
}

/**
 * 1つの項目について、日付と値の並びを返す（新しい順）。
 * ★値は加工しません。丸めも、言い換えも、色もつけません。
 */
export function seriesFor(entries, key, limit = 30) {
  const f = BY_KEY[key];
  if (!f) return [];
  return Object.keys(entries || {}).sort().reverse().slice(0, limit)
    .map((d) => {
      let value = null;
      try { value = f.get(entries[d]); } catch (err) { value = null; }
      return { date: d, value };
    })
    .filter((r) => hasValue(r.value));
}
