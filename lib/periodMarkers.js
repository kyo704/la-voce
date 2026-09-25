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

// ============================================================================
// ★★★一覧の 1枚（★見本 `SC['区切り']`・design-v78・2026-09-25）
//
//   ★★★置き所 …… ★「しらべる」の 束。
//     ★★Opus は「アカウントと設定」を 薦めて いました が、★決め直し ──
//       ★設定に 置くと「1度 決めて 忘れる もの」に 見え、
//       ★しらべるに 置くと「調べる ときに 使う 道具」に 見える。
//
//   ★★★design-v78 で 見本の ほうが 3か所 直りました（★こちらの 指摘から）──
//     ①★札の 例から「先生が 変わった とき」を 外した ── ★あれは **理由** でした。
//       ★★台帳（`period_markers`）は 日だけ です。★例も 日だけ に なりました。
//     ②★「書いても、書かなくても かまいません」を 消した ── ★書く 欄が ありません。
//     ③★「分けて 見られます」→「分けて 見られるように なります（いまは まだです）」。
//       ★★`splitByMarkers()` を くらべる が まだ 呼んで いない から です。
//   ★★★だから いまは **4行 とも 置けます**。★withhold は 1つも ありません。
//     ★★外した ものが 戻る 引き金 …… ★くらべるが `splitByMarkers` を 呼んだ 日。
//       ★★その 日に 4行目の「（いまは まだです）」を 外します。★忘れないこと。
//
//   ★★★Opus の 気づき（★2026-09-25）── ★`sql/91`（書いて あるのに 守られて いない）と、
//     ★この 3件（守って いるのに 書いて いない）は、★向きは 逆でも 同じ 傷 です ──
//     ★★「書いて ある ことと 実際が ちがう」。
//   ★★★足された 決め 2つ ── ★例は 台帳に ある もの だけ で 作る／
//     ★できない ことを できると 書かない。
// ============================================================================

/** ★戻る 先（★見本 `bk('しらべる機能')` ── ★束の 題 は「しらべる」）。 */
export const LIST_BACK_TO = "しらべる";

/** ★題。 */
export const LIST_TITLE = "区切り";

/** ★上の 断り（★見本の `warn`・2行）。 */
export const LIST_HEAD_LINES = Object.freeze([
  "日を 置くと、その 前と あとが 分かれます。",
  "記録は 止まりません。いつもどおり 書けます。"
]);

/** ★上の 断りで 太字に する 行。 */
export const LIST_HEAD_STRONG = Object.freeze([0, 1]);

/** ★1つも 無い とき。★数を 出しません。 */
export const LIST_EMPTY = "まだ ありません。";

/** ★置く 札（★見本の `＋ 区切りを 置く`）。 */
export const LIST_ADD = "＋ 区切りを 置く";

/** ★置けた とき の 一言（★見本の `toast`）。 */
export const LIST_ADDED = "置きました";

/**
 * ★下の 断り（★約束）。
 *
 *   ★★4行 とも 見本の まま です（★design-v78）。
 *   ★★★4行目は「いまは まだです」と 添えて あります。
 *     ★★くらべるが `splitByMarkers` を 呼んだ 日に、★この 括弧を 外します。
 *       ★★外し忘れると、★できる ことを できないと 書いた ままに なります。
 */
export const LIST_NOTES = Object.freeze([
  "置くのは 日だけ です。わけは うかがいません。",
  "良い・悪いは 出しません。前と あとを 分けるだけです。",
  "外しても、記録は 1つも 変わりません。",
  "くらべるときに 前と あとを 分けて 見られるように なります（いまは まだです）。"
]);

/** ★太字に する 行（★見本の `<b>`）。★4行目は 小さな 字 です。 */
export const LIST_NOTES_STRONG = Object.freeze([0, 1, 2]);
export const LIST_NOTES_SMALL = Object.freeze([3]);
