// ============================================================================
// 型ごとの追加項目 — 配合が閾値を超えた型のぶんだけ出す
//
// 出典：docs/lavoce-作業指示-職業を声の型で切り直す.md §5-2・§5-3・§9
//
// ★共通コア（§5-1）には1文字も触りません。
//   sleepHours / offStageVoiceMinutes / absoluteHumidity /
//   dayAfterPerformance / morningEdema は分析の中核5項目で、
//   族の設計の前提です。この表には入れません。
//
// ★ここで足す項目は、当面は記録だけです（§9）。
//   検定に入れると族が増え、検出力が落ちます。explore に置きます。
//   分析の族（lib/analysisFamilies.js）には、1つも入れないでください。
//
// ★どれも任意です。空欄のまま保存できます（§5-2）。
// ============================================================================

// 閾値。配合（合計10）のうち、その型がこの数以上なら項目を出す。
export const TYPE_THRESHOLDS = { sing: 5, speak: 6, project: 2 };

// ★2〜3個まで（§5-2）。増やしたくなったら、それは新しい型が要る合図です（§10-8）。
export const TYPE_FIELDS = {
  sing: [
    // §5-3: 「パッサッジョ通過数」を置き換えたもの。自己申告で測れない
    //       「通過数」をやめ、感じ方を5段階で聞きます。
    { key: "passaggioDifficulty", label: "パッサッジョの通りにくさ", type: "scale5" },
    { key: "highNoteEase",        label: "高音の出しやすさ",         type: "scale5" }
  ],
  speak: [
    // ★時間ではなく「量」で聞きます（§5-2）。原稿の分量は、
    //   しゃべった時間とは別の負荷だからです。
    { key: "scriptVolume",      label: "台詞・原稿の分量", type: "choice",
      options: ["少ない", "ふつう", "多い"] },
    { key: "longestTalkMinutes", label: "連続してしゃべった最長の時間", type: "minutes" }
  ],
  project: [
    { key: "projectedVoiceMinutes", label: "遠くへ飛ばした時間", type: "minutes" }
  ]
};

export const TYPE_ORDER = ["sing", "speak", "project"];

// ★これ以上は出しません（§5-2）。
//   配合の合計は10なので sing≥5 と speak≥6 は同時に成り立たず、
//   実際に出るのは多くても3項目です。上限は仕様書の値を使います。
export const MAX_TYPE_FIELDS = 4;

/**
 * その配合で閾値を超えている型。
 * ★複数超えたら、両方出します（§5-2）。
 */
export function activeTypes(mix) {
  if (!mix) return [];
  return TYPE_ORDER.filter((t) => Number(mix[t]) >= TYPE_THRESHOLDS[t]);
}

/**
 * その人に出す追加項目の一覧。
 * ★閾値を超えた型のぶんだけ。超えていなければ、何も出しません。
 */
export function typeFieldsFor(mix) {
  const fields = activeTypes(mix).flatMap((t) => TYPE_FIELDS[t]);
  return fields.slice(0, MAX_TYPE_FIELDS);
}

/** その項目が、いまのその人に出ているか（保存済みの値を読むとき用）。 */
export function isTypeFieldVisible(fieldKey, mix) {
  return typeFieldsFor(mix).some((f) => f.key === fieldKey);
}

/** 追加項目の鍵の全部。★書き出しと削除の一覧に使います。 */
export const ALL_TYPE_FIELD_KEYS = TYPE_ORDER.flatMap((t) => TYPE_FIELDS[t].map((f) => f.key));
