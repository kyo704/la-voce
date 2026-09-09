// ============================================================================
// ★「どちらとして 見るか」（★2026-09-10・坂本さんの ご提案）
//
//   ★★これまでは、★その日に レッスンが あるかどうかで、★勝手に 決めていました。
//     ★レッスンが あれば 先生の 画面（A02）、★なければ 生徒の 画面（A01）。
//   ★★2026-09-10、★それが 困りごとに なりました ──
//     ★羊の 大きさを 4度 直し、★4度とも「変わらない」と なりました。
//     ★★実際には 正しく 動いていました。★A02 の 日だったのです。
//     ★★作った 側も、★使う 側も、★どちらの 画面を 見ているか
//       ★分かりませんでした。
//   ★★勝手に 決めるなら、★せめて どちらに 決めたかが 見えなければ なりません。
//     ★見えないなら、★選べる ほうが よい。★それが この 仕組みです。
//
//   ★★門の中（名簿の方）だけです。
//     ★一般の 先生・生徒の 方は、★これまでどおり じどう です。
//     ★★38人の 画面に、★この 選びは 出ません。
//
//   ★★端末ごとに 覚えます（localStorage）。★サーバーに 送りません。
//     ★★「文字の 大きさ」と 同じ 決めです（★見やすさ §1-2）。
//     ★読めなかったら「じどう」で 立ち上がります。
//
//   ★★これは「見え方」の 選びです。★権限では ありません。
//     ★★生徒として 見ても、★先生で なくなる わけでは ありません。
//     ★★先生として 見ても、★教えていない 方が 出欠を 付けられる わけでは
//       ★ありません。★出欠は、★その日の レッスンが あって はじめて 出ます。
//
//   ★見張り components/tests/view-as.test.js
// ============================================================================

/** ★覚え場所の 名前。 */
export const VIEW_AS_KEY = "woolsong-view-as";

/** ★選べる 3つ。★並びも この とおりです。 */
export const VIEW_AS_MODES = Object.freeze([
  { key: "auto", label: "じどう" },
  { key: "teacher", label: "先生として" },
  { key: "student", label: "生徒として" }
]);

const KEYS = VIEW_AS_MODES.map((m) => m.key);

/** ★知らない 値は「じどう」に します。 */
export function normalizeViewAs(v) {
  return KEYS.includes(v) ? v : "auto";
}

/**
 * ★けっきょく、★先生として 見るのか。
 *
 *   ★★「じどう」のときだけ、★その日に レッスンが あるかを 見ます。
 *   ★★選んで あるなら、★その とおりに します。
 *
 *   @param o.mode             auto ／ teacher ／ student
 *   @param o.hasTeachingToday その日に 教える レッスンが あるか
 */
export function resolveTeaching(o) {
  const opt = o || {};
  const mode = normalizeViewAs(opt.mode);
  if (mode === "teacher") return true;
  if (mode === "student") return false;
  return !!opt.hasTeachingToday;
}

/**
 * ★いま どちらとして 見ているかを、★言葉に します。
 *
 *   ★★「じどう」のときも、★どちらに なったかを 言います。
 *     ★それが 見えなかったことが、★この 仕組みを 作った 理由です。
 */
export function viewAsWord(o) {
  const opt = o || {};
  const mode = normalizeViewAs(opt.mode);
  const teaching = resolveTeaching(opt);
  const who = teaching ? "先生" : "生徒";
  return mode === "auto" ? `じどう（いまは ${who}）` : `${who}として`;
}

/** ★端末から 読みます。★読めなくても 落ちません。 */
export function readViewAs() {
  if (typeof window === "undefined") return "auto";
  try {
    return normalizeViewAs(window.localStorage.getItem(VIEW_AS_KEY));
  } catch (e) {
    // ★★覗けない 設定の 端末が あります。★そのときは じどう です。
    return "auto";
  }
}

/** ★端末に 覚えます。★覚えられなくても 落ちません。 */
export function writeViewAs(v) {
  const mode = normalizeViewAs(v);
  if (typeof window === "undefined") return mode;
  try {
    window.localStorage.setItem(VIEW_AS_KEY, mode);
  } catch (e) {
    // ★覚えられなくても、★その場では 効いています。
  }
  return mode;
}
