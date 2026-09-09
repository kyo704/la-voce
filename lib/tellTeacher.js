// ============================================================================
// 先生に 伝える ── 連絡板では ない、別の道（2026-09-10・見本⑥）
//
//   ★出どころ docs/opus/woolsong-見本-連絡6画面（9月9日）.html ⑥
//            docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §6-1 の 対処②
//     「★欠席の連絡を、★連絡板に 書かせない
//       　★定型連絡は、★先生1人にしか 届きません。★門下の20人には 届きません」
//
//   ★★理由を 受け取りません。★欄も、★列も、★作りません。
//     ★★欄が あれば、★書く人が 出ます。★書けば 体調が 伝わります。
//     ★★§6-1 の いちばん大きな 危険は、★そこから 始まります。
//
//   ★見張り components/tests/tell-teacher.test.js
// ============================================================================

/** ★伝えること。★3つだけ（★見本⑥）。★増やしません。 */
export const NOTICES = Object.freeze([
  { key: "absent", label: "休みます" },
  { key: "late", label: "遅れます" },
  { key: "coming", label: "行けるように なりました" }
]);

export function noticeLabel(key) {
  const n = NOTICES.find((x) => x.key === key);
  return n ? n.label : null;
}

/** ★知らない 言葉は 通しません。 */
export function isNotice(key) {
  return key === null || NOTICES.some((n) => n.key === key);
}

/**
 * ★誰に 届くか。★いちばん上に 出します（★見本⑥）。
 *
 *   ★★押したあとに 知らせるのでは 遅すぎます。
 */
export const ONLY_TEACHER_LINE =
  "これは、{先生} おひとりに 届きます。\n" +
  "門下のみなさんには 届きません。学校の運営の方にも 届きません。";

/** ★理由の 欄が ない ことを、★はっきり 書きます（★見本⑥）。 */
export const NO_REASON_LINES = Object.freeze([
  "理由の欄は ありません。",
  "書かなくて 構いません。"
]);
