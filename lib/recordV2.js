// ============================================================================
// 「記録」の画面の 2タップ（2026-09-09・見本③）
//
//   ★出どころ Woolsong 画面の見本（2026年9月9日）③ 記録／生徒
//
//   ★★見本の 決まり
//     ★2タップで 終わります。★「こえのちょうし」を1つ選び、★「きろくする」。
//     ★のこりは、★折りたたみの 中です。★開かなくても、記録は 成り立ちます。
//
//   ★★3択の 言葉は lib/todayCard.js の conditionWord と 同じ組です。
//     ★★書く側（ここ）と 読む側（きょうの画面）で、★組がずれないためです。
//     ★どちらも 1〜5 の throatCondition の 上に 立っています。
//     ★★新しい列を 作りません。★作れば、★読む所が 1つも 無くなります。
//
//   ★★どこへ 書くか、は 2通りあります。★ここが この帳面の 肝です。
//     ★entries は 1日1行ですが、★声の記録は voiceEntries[] という
//       場面ごとの 束に なっており、★throat_condition は その 中央値から
//       導かれます（★entryToRow の deriveLegacyVoiceFieldsFromEntries）。
//     ★★だから、★formData.throatCondition に 書いても、
//       ★場面の記録が 1つでも あれば、★その値は 捨てられます。
//     ★★同じ決めを 2か所に 書かないため、★行き先を 決めるのは この関数だけです。
//
//   ★★すでに 場面ごとに 書いてある日は、★3択を 出しません。
//     ★★中央値を 1つの 3択で 上書きすると、★その方が 書いたものが 消えます。
//     ★「受け取ったもの・書いたものを 黙って 消さない」という 決めです。
//     ★その日は、★下の いつもの 欄で 直していただきます。
//
//   ★見張り components/tests/record-v2.test.js
// ============================================================================

/** ★3択。★見本③の 並びの ままです。★左が よいほうです。 */
export const CONDITION_CHOICES = ["出た", "ふつう", "出づらい"];

/**
 * ★3択の 印（★見本③）。★◎ ／ ○ ／ △。
 *
 *   ★★色では なく、★形で 分けます。
 *     ★★色だけに 意味を 持たせない、という 決めです（★色覚多様性への 対応）。
 *     ★★赤い＝悪い に しません。★5段の 目盛りで やめたのと 同じ 理由です。
 *   ★◎と○と△は、★大きさでは なく 形が ちがいます。
 */
export const CONDITION_MARKS = Object.freeze({
  "出た": "◎",
  "ふつう": "○",
  "出づらい": "△"
});

export function conditionMark(word) {
  return CONDITION_MARKS[word] || "";
}

/**
 * ★3択の 言葉を、★1〜5 の 数に します。
 *
 *   ★★conditionWord（lib/todayCard.js）の 逆です。
 *     ★4→出た→4、★3→ふつう→3、★2→出づらい→2 と、★行って戻ります。
 *   ★★5 や 1 を 書きません。★端を 使うと、★これまで 5 と 書いてきた方の
 *     記録と、★同じ言葉なのに 値が ずれます。
 */
export function conditionValue(word) {
  if (word === "出た") return 4;
  if (word === "ふつう") return 3;
  if (word === "出づらい") return 2;
  return null;
}

/**
 * ★その日の 声の 記録が、★場面ごとに 書かれているか。
 *
 *   ★★2026-09-10、★ここが 誰にも 3択を 出さなく していました。
 *     ★★rowToEntry は、★1日ぶんの throat_condition から、
 *       ★正午の 場面の記録を 1件 作ります（migrateLegacyToVoiceEntries）。
 *       ★それは 移行で 作った 写しであって、★場面ごとの 記録では ありません。
 *     ★★だから「声の調子を 1度でも 書いた日」は すべて、
 *       ★「場面ごとに 書いてくださっています」に なっていました。
 *     ★★notOutDates と 同じ形の 穴です。★条件が 厳しすぎました。
 *
 *   ★★見分け方。★移行で 作った 1日ぶんの 写しは、
 *     ★source が "migrated" で、★context が "other" です。
 *     ★朝／昼／晩に 分けて 書かれた 日は、★context が それぞれ ちがいます。
 *       ★あちらは ご本人が 場面ごとに 書いたものです。★そのまま 守ります。
 */
export function hasSceneCondition(entry) {
  const ve = entry && entry.voiceEntries;
  if (!Array.isArray(ve)) return false;
  return ve.some((v) => {
    if (!v || typeof v.bodyFeel !== "number" || !Number.isFinite(v.bodyFeel)) return false;
    // ★★1日ぶんの 総合を 写しただけの 1件は、★場面の記録では ありません。
    if (v.source === "migrated" && v.context === "other") return false;
    return true;
  });
}

/**
 * ★3択を 出してよいか。
 *
 *   ★★場面ごとに もう 書いてある日は、★出しません（★上書きを しないため）。
 */
export function mayUseQuickCondition(entry) {
  return !hasSceneCondition(entry);
}

/**
 * ★いま 何が 選ばれているか（★押しどころを 光らせるため）。
 *
 *   ★★読むのは、★書いたのと 同じ場所です。
 */
export function readConditionValue(entry) {
  if (!entry) return null;
  if (hasSceneCondition(entry)) return null;
  const ve = entry.voiceEntries;
  if (Array.isArray(ve) && ve.length > 0) {
    const v = ve[0] && ve[0].bodyFeel;
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  const t = entry.throatCondition;
  return typeof t === "number" && Number.isFinite(t) ? t : null;
}

/**
 * ★3択を 押したときの、★次の記録の姿を 返します。
 *
 *   ★★もとの記録を 書き換えません。★新しい姿を 返すだけです。
 *   ★★場面の記録が 空で 1つ あるなら、★その 空いた所に 書きます。
 *     ★★空いた所に 書くのは、★上書きでは ありません。
 *   ★★場面の記録が 無ければ、★1日ぶんの throatCondition に 書きます。
 */
export function applyConditionWord(entry, word) {
  const value = conditionValue(word);
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


// ============================================================================
// 見本③の 折りたたみ 5つ
//
//   ★出どころ Woolsong 画面の見本（2026年9月9日）③ 記録／2タップで完成
//
//   ★★見本の 決まり
//     ★＋歌った時間 ／ ＋からだのこと ／ ＋ねむり ／ ＋食べたもの ／ ＋ひとこと
//     ★★「開いた時点で 並んでいる＝0タップ。★タブは 増やさない」
//     ★★1つずつ 開きます。★開くと、★ほかは 閉じます。
//       ★2つ開くと、★下まで 見に行くことに なります。
//
//   ★★いまの記録画面には、★節が 11 あります。
//     ★★節を 動かしません。★どこに あるかを、★この表が 決めるだけです。
//     ★動かすと、★入れ子の 条件（showGroup・型ごとの項目）が ずれます。
//     ★★「消えた」より「動かしていない」ほうが、★はるかに 安全です。
//
//   ★★この 振り分けは、★私が 決めました。★見本には 中身が 書かれていません。
//     ★お確かめのうえ、★違っていれば、★この表だけを 直してください。
//     ★画面は この表を 読むので、★1か所 直せば 全部 直ります。
// ============================================================================

export const RECORD_FOLDS = [
  { key: "sing",  label: "歌った時間",   sections: ["practice", "typeFields"] },
  // ★★「声・のど」は、★からだのこと に 入れます（★2026-09-09・坂本さんのお決め）。
  //   ★はじめ「歌った時間」に 入れていました。★お決めで 移しました。
  { key: "body",  label: "からだのこと", sections: ["voice", "body", "env", "exercise"] },
  { key: "sleep", label: "ねむり",       sections: ["sleep"] },
  { key: "meal",  label: "食べたもの",   sections: ["hydration", "meal"] },
  { key: "note",  label: "ひとこと",     sections: ["mental", "practiceNote"] }
];

/** ★その節は、★どの 折りたたみに 入るか。★入らないものは null。 */
export function foldOfSection(sectionKey) {
  const f = RECORD_FOLDS.find((x) => x.sections.includes(sectionKey));
  return f ? f.key : null;
}

/**
 * ★その節を、★いま 出してよいか。
 *
 *   ★★門の外（layoutV2 でない方）は、★これまでどおり 全部 出ます。
 *     ★★38人の 画面を、★1つも 変えません。
 *   ★★表に 載っていない節は、★畳みません。★出しつづけます。
 *     ★★載せ忘れで、★節が 画面から 消えるのを 防ぎます。
 *     ★「消えた」は、★書けなくなった、ということです。
 */
export function sectionIsOpen(sectionKey, { layoutV2, openFold }) {
  if (!layoutV2) return true;
  const fold = foldOfSection(sectionKey);
  if (fold == null) return true;
  return fold === openFold;
}
