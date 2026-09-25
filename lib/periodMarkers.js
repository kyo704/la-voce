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
// ★★★一覧の 1枚（★見本 `SC['区切り']`・design-v76・2026-09-25）
//
//   ★★★置き所が 決まりました ── ★「しらべる」の 束 です。
//     ★★Opus は「アカウントと設定」を 薦めて いました が、★利用者の 目 で 決め直し ──
//       ★設定に 置くと「1度 決めて 忘れる もの」に 見え、
//       ★しらべるに 置くと「調べる ときに 使う 道具」に 見える。
//
//   ★★★見本の 4行の うち **2つ を 置いて いません**。★わけ ──
//     ①★「くらべるときに、前と あとを まぜない ために 使います」
//     ②★見本の warn「この日の 前と あとで、分けて 見られます」
//     ★★★どちらも 「くらべる が 区切りで 分かれる」と 言って います。
//       ★★`splitByMarkers()` は この 紙に **あります** が、
//         ★★どこからも **呼ばれて いません**（★見張りの 中だけ）。
//       ★★だから いま 書くと、★守って いない 約束に なります。
//     ★★外す 条件 …… ★`splitByMarkers` を くらべる の 画面が 呼んだ 日。
//       ★★そこは いまの 38人にも 効く ところ なので、★影響を 数えて から です。
//
//   ★★★見本の 1行目の 札に「先生が 変わった とき」と 添えて あります。
//     ★★これは **理由** です。★置きません ── ★設計 §9 の 8番の 禁止 です。
//       ★★`FORBIDDEN_COLUMNS` に `reason`／`note`／`memo` が 並んで います。
//     ★★見本の 註も「わけは うかがいません」と 言って います。★中で 食い違って います。
//       ★★だから 註の 前半だけ 置き、★「書いても、書かなくても かまいません」は
//         ★置きません ── ★書く ところが 無い のに 書ける と 言えません。
// ============================================================================

/** ★戻る 先（★見本 `bk('しらべる機能')` ── ★束の 題 は「しらべる」）。 */
export const LIST_BACK_TO = "しらべる";

/** ★題。 */
export const LIST_TITLE = "区切り";

/** ★上の 断り（★見本の `warn` の 2行目 だけ）。 */
export const LIST_HEAD_LINES = Object.freeze([
  "記録は 止まりません。いつもどおり 書けます。"
]);

/** ★1つも 無い とき。★数を 出しません。 */
export const LIST_EMPTY = "まだ ありません。";

/** ★置く 札（★見本の `＋ 区切りを 置く`）。 */
export const LIST_ADD = "＋ 区切りを 置く";

/** ★置けた とき の 一言（★見本の `toast`）。 */
export const LIST_ADDED = "置きました";

/**
 * ★下の 断り（★約束）。
 *
 *   ★★3行 とも、★いま 本当の こと だけ です。
 *     ★★見本の 4行目（くらべる と 混ぜない）は 上の 註の とおり 置いて いません。
 */
export const LIST_NOTES = Object.freeze([
  "わけは うかがいません。",
  "良い・悪いは 出しません。前と あとを 分けるだけです。",
  "外しても、記録は 1つも 変わりません。"
]);

/** ★太字に する 行（★見本の `<b>`）。 */
export const LIST_NOTES_STRONG = Object.freeze([0, 1, 2]);
