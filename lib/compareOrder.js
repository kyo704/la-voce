// ============================================================================
// くらべる ── 「調べていることの 順番」
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の SC['順番']（★git hash 7c7c720）
//
//   ★★見本の 決まり
//     ★「疑っている 順に、5つまで。★1番目だけ、補正なしで 見ます。」
//     ★「順番を 入れ替えると、そこから 数え直します。」
//     ★「2番目から先の 結果は 出しません。★止まった 理由だけ 出します。」
//     ★「原因・助言・「べき」を 書きません。」
//
//   ★★なぜ 順番が 要るか
//     ★★調べる ものを 見てから 選べると、★いちばん よく見える 組を
//       ★選べてしまいます。★先に 決めるから、★意味が あります。
//     ★★1番目だけを 調べるので、★たくさん 撃った ぶんの 上のせが 要りません
//       （★lib/displayGates.js の minEffectSizeFor(1) ＝ 0.50）。
//
//   ★★どこに しまうか
//     ★端末の 覚え書き（localStorage）です。★列を 増やしません。
//     ★★「毎日、聞いてほしいこと」（lib/dailyAsk.js）と 同じ 置き方です。
//     ★★端末ごとに ちがって かまいません。★調べ方の 好みだからです。
//
//   ★見張り components/tests/compare-order.test.js
// ============================================================================

/** ★覚え書きの 鍵。 */
export const ORDER_KEY = "la-voce-compare-order";

/** ★いくつまで 並べられるか（★見本「5つまで」）。 */
export const ORDER_MAX = 5;

/**
 * ★はじめの 並び。
 *
 *   ★出どころ 見本の SIRA
 *     食べ終えてから 寝るまでの間／昨夜の 睡眠／声を使った 時間／
 *     起きたときの むくみ／部屋の しめり
 *   ★★lib/lagChoice.js の ITEMS の 鍵で 書きます。★言葉を 書き写しません。
 */
export const ORDER_DEFAULT = Object.freeze([
  "dinnerToBed", "sleepHours", "speechMinutes", "morningEdema", "humidity"
]);

/** ★画面の 言葉。★1か所で 持ちます。★1文字も 変えないこと。 */
export const ORDER_COPY = Object.freeze({
  title: "調べていることの 順番",
  row: "調べていることの 順番",
  warnA: "疑っている 順に、5つまで。",
  warnB: "1番目だけ",
  warnC: "、補正なしで 見ます。",
  firstLabel: "1番目",
  firstNote: "いま 見ています",
  restLabel: "2番目から先",
  restNote: "1番目で 差が 見えなかったので、ここで 止まっています",
  recount: "順番を 変えたので、ここから 数え直します",
  notes: Object.freeze([
    "順番を 入れ替えると、そこから 数え直します。",
    "2番目から先の 結果は 出しません。止まった 理由だけ 出します。",
    "原因・助言・「べき」を 書きません。"
  ])
});

/** ★並びとして 正しいか。★知らない 鍵と 重なりを 落とします。 */
export function cleanOrder(list, known) {
  const ok = Array.isArray(known) ? known : [];
  const seen = new Set();
  const out = [];
  (Array.isArray(list) ? list : []).forEach((k) => {
    if (typeof k !== "string") return;
    if (ok.length && !ok.includes(k)) return;
    if (seen.has(k)) return;
    seen.add(k);
    if (out.length < ORDER_MAX) out.push(k);
  });
  return out;
}

/** ★覚え書きから 読みます。★読めなければ はじめの 並び。 */
export function readOrder(known) {
  if (typeof window === "undefined") return [...ORDER_DEFAULT];
  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    const v = cleanOrder(JSON.parse(raw), known);
    return v.length ? v : [...ORDER_DEFAULT];
  } catch (e) {
    return [...ORDER_DEFAULT];
  }
}

/** ★覚え書きへ 書きます。★書けなくても 落ちません。 */
export function writeOrder(list, known) {
  const v = cleanOrder(list, known);
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(ORDER_KEY, JSON.stringify(v)); }
    catch (e) { /* ★そのまま */ }
  }
  return v;
}

/**
 * ★1つ 上へ。
 *
 *   ★★もとの 並びを 書き換えません。★新しい 並びを 返します。
 *   ★★いちばん 上は 動きません。★押しても 何も 起きない、では なく、
 *     ★画面の 側で 押せない ように します。
 */
export function moveUp(list, i) {
  const a = [...(list || [])];
  if (i <= 0 || i >= a.length) return a;
  const t = a[i];
  a[i] = a[i - 1];
  a[i - 1] = t;
  return a;
}

/** ★いま 調べている もの（★1番目）。★無ければ null。 */
export function firstOf(list) {
  const a = Array.isArray(list) ? list : [];
  return a.length ? a[0] : null;
}

/**
 * ★いくつ 調べたか（★差の 大きさの 上のせに 使います）。
 *
 *   ★★いつでも 1 です。★1番目しか 調べないからです。
 *   ★★並びが 5つ あっても、★検定は 1回です。
 *     ★見本「1番目だけ、補正なしで 見ます」。
 */
export function testedCount() {
  return 1;
}
