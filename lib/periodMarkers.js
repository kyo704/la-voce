// ============================================================================
// 区切りマーカー（★理由は書かせない）── 2026-09-08
//
//   ★出どころ docs/lavoce-食事と就寝の設計.md §6
//            docs/opus/woolsong-00-実行ルート-v5（9月7日・夜・正）.md 2-7
//            docs/opus/…219点の分け方…（9月7日・夜）.md ⑥
//
//   ★★「薬を飲み始めた」「受診した」「生活を変えた」──
//     ★そういう区切りがあると、★その前後で記録の意味が変わります。
//
//   ★★ですが、★服薬や受診そのものを、★記録させません。
//     ★治療の内容は、★要配慮性が さらに上がります。
//     ★そのわりに、★分析には効きません。
//
//   ★★だから、★理由のない印を、★1つだけ置けるようにします。
//
//       [ ここから区切りをつける ]
//          ※ この日から、記録の見方を分けます
//          ※ ★理由の入力欄を作らないこと
//
//   ★★何があったかは、★ご本人だけが知っていれば足ります。
//   ★★前後を並べるだけです。★どちらが良いとも、言いません（★裁定 ⑥）。
//
//   ★★禁止（★設計 §9 の8番）
//     ★服薬・受診の記録を作らない（★区切りマーカーに理由欄を作らない）
//
//   ★見張り components/tests/period-markers.test.js
// ============================================================================

/**
 * ★1行の形。
 *
 *   ★★date だけです。★理由も、種類も、ひとことも、ありません。
 *     ★足さないでください。★足した時点で、服薬の記録になります。
 */
export const MARKER_COLUMNS = Object.freeze(["user_id", "marked_on", "created_at"]);

/**
 * ★★作ってはいけない欄。★見張りが、これを見ています。
 *   ★「memo」「note」も入れません。★理由を書く場所は、1つも作りません。
 */
export const FORBIDDEN_COLUMNS = Object.freeze([
  "reason", "why", "note", "memo", "comment", "detail", "kind", "type",
  "medication", "medicine", "drug", "visit", "clinic", "diagnosis",
  "理由", "内容", "種類", "薬", "受診", "病名"
]);

/** ★画面に、書いてはいけない言葉。 */
export const FORBIDDEN_WORDS = Object.freeze([
  "服薬", "薬を", "受診", "通院", "診断", "病名", "治療", "処方",
  "良くなった", "悪くなった", "効いた", "効果"
]);

export function markerRow({ userId, dateISO, now }) {
  if (!userId || !isDate(dateISO)) return null;
  return {
    user_id: userId,
    marked_on: dateISO,
    created_at: now || new Date().toISOString()
  };
}

function isDate(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/** ★日付だけを取り出して、古い順に並べます。 */
export function markerDates(rows) {
  return (rows || [])
    .map((r) => (r && r.marked_on ? String(r.marked_on) : null))
    .filter(isDate)
    .sort();
}

/**
 * ★その日に、印が置いてあるか。
 *   ★★同じ日に2つ置けません。★押すと、外れます。
 */
export function hasMarker(rows, dateISO) {
  return markerDates(rows).includes(dateISO);
}

/**
 * ★印で、期間を分けます。
 *
 *   ★★印の日から、★次の期間が始まります。★印の日は、あとの期間に入ります。
 *   ★★何も言いません。★どちらが良いとも、書きません。
 *     ★返すのは、★区間の始まりと終わりだけです。
 *
 *   @param dates   並べたい日（★ISO の文字列）
 *   @param rows    印の行
 *   @returns [{ from, to, dates }] ★古い順
 */
export function splitByMarkers(dates, rows) {
  const days = (dates || []).filter(isDate).slice().sort();
  if (days.length === 0) return [];
  const marks = markerDates(rows).filter((m) => m > days[0] && m <= days[days.length - 1]);
  if (marks.length === 0) {
    return [{ from: days[0], to: days[days.length - 1], dates: days }];
  }
  const out = [];
  let start = 0;
  marks.forEach((m) => {
    const cut = days.findIndex((d) => d >= m);
    if (cut <= start) return;
    out.push({ from: days[start], to: days[cut - 1], dates: days.slice(start, cut) });
    start = cut;
  });
  out.push({ from: days[start], to: days[days.length - 1], dates: days.slice(start) });
  return out;
}

/**
 * ★画面の言葉。★1か所で持ちます。
 *
 *   ★★「良い」「悪い」を、★1文字も書きません。
 *   ★★理由を尋ねません。★「何がありましたか」と聞かないこと。
 */
export const COPY = Object.freeze({
  add: "ここから区切りをつける",
  remove: "この区切りをやめる",
  note: "この日から、記録の見方を分けます。",
  // ★★なぜ理由を聞かないのかを、★書いておきます。★黙って省くと、不親切です。
  whyNoReason: "何があったかは、書いていただかなくてけっこうです。"
});
