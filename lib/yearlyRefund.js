// ============================================================================
// 年払いを途中でやめたときに返す額（裁定155 C1・裁定110・2026-09-21）
//
//   なぜ「返さない」にしないか
//     買い切りにしても消費者の解除権は残ります。「返金しない」は違約金の
//     条項として審査されます（裁定110・9月8日の確定文書）。
//     未経過の月ぶんを先に返す形にすると、争いうる部分がそもそも残りません。
//
//   244点（ひつじの品）は返しません
//     お渡し済みだからです。どのプランをやめても、品は残ります。
//     これは「取り上げない」という約束と同じ向きです。
//
//   月払いはここに入りません
//     いつでも止められます。止めたら月の終わりまで。日割りにしません。
//
//   学校（学校法人）もここに入りません
//     事業者なので消費者契約法の考えが当てはまりません。年間契約の途中解約は
//     契約書で定めます（裁定156 注記。B案と同じ考えを勧める、とあります）。
//
//   見張り components/tests/yearly-refund.test.js
//   値段の決めは lib/plans.js が1つ持ちます。ここには書きません。
// ============================================================================

import { YEARLY_PRICE_155 } from "./plans.js";

/**
 * ★1か月あたり返す額（円・税込）。
 *
 *   ★裁定155 C1 の表をそのまま持ちます。割り算で出しません。
 *     ★★出すと、端数の丸め方を決める場所がもう1つできます。
 *     ★★「よそおい 490円」は 年額÷12 を 10円単位で切り上げた値です。
 *       ★式から出すと 1円 ずれます。
 *   ★内訳（244点ぶん／利用権ぶん）は裁定110 のまま。ここでは合計だけ持ちます。
 */
export const MONTHLY_REFUND = Object.freeze({
  zenbu: 400,       // ぜんぶ（年）
  student: 200,     // 学生（年）
  tsutaeru: 300,    // つたえる（年）
  shiraberu: 400,   // しらべる（年）
  yosooi: 490,      // よそおい（年）
  classroom: 2490   // 教室（年）（裁定155 §6）
});

/**
 * ★年額（円・税込）。★返す額の 上限 です。
 *
 *   ★★★数は ここに 書きません。★`lib/plans.js` が 1つ 持ちます。
 *     ★★はじめ ここに 書きました。★見張りが 捕まえました
 *       （`tools/price_hardcode_scan.py` ／ `price-single-source.test.js`）。
 *     ★★値段の 決めが 2か所に なると、★片方だけ 直す 日が 来ます。
 *
 *   ★★★なぜ 上限が 要るか ── ★測って 分かりました（2026-09-21）。
 *     ★★1か月あたりの 額は 10円単位で 切り上げて あります。
 *       ★★12か月ぶん 足すと、★年額を **越える** ものが 2つ あります ──
 *         ★よそおい … 490 × 12 が 年額を 80円 越えます
 *         ★教室 ……… 2,490 × 12 が 年額を 80円 越えます
 *     ★★1日も 使わずに やめた方に、★払った額より 多く 返す ことに なります。
 *   ★★だから 上限を 置きます。★裁定の 表は 1文字も 変えません。
 */
export const YEARLY_PRICE = YEARLY_PRICE_155;

/** ★返さないもの。★お渡し済みです。 */
export const NOT_REFUNDED = Object.freeze(["244点"]);
export const NOT_REFUNDED_LINE =
  "ひつじの 品（244点）は お渡し済みです。やめても 残ります。返金の 対象では ありません。";

/** ★年の 月数。 */
export const MONTHS_IN_YEAR = 12;

/**
 * ★未経過の月数。
 *
 *   ★使った月は、1日でも使っていれば「使った」と数えます。
 *     ★★日割りにしません。★半端な日を争う形を作らないためです。
 *   ★12か月すべて使っていれば 0。★1か月も使っていなければ 12。
 */
export function monthsLeft(monthsUsed) {
  // ★★★`null` は「0か月 使った」では ありません。「分からない」です。
  //   ★★`Number(null)` は 0 に なります。★そのまま 通すと 12か月ぶん、
  //     ★つまり **いちばん 多い 額** が 出ます。
  //   ★★分からない ものを、いちばん 大きい 答えに しません。
  //   ★★★0 を 渡された ときは 12 です。★それは 答えです。
  if (monthsUsed === null || monthsUsed === undefined || monthsUsed === "") return 0;
  const n = Number(monthsUsed);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n >= MONTHS_IN_YEAR) return 0;
  return MONTHS_IN_YEAR - Math.floor(n);
}

/**
 * ★返す額（円）。
 *
 *   ★知らないプランには 0 を返しません。★`null` を返します。
 *     ★★0 は「返す額が 0円」という答えです。★「分からない」とは別です。
 *     ★★学校は ここに 入れません（★契約書のとおり）。
 */
export function refundYen(planKey, monthsUsed) {
  const per = MONTHLY_REFUND[planKey];
  if (per === undefined) return null;
  const 額 = per * monthsLeft(monthsUsed);
  const 上限 = YEARLY_PRICE[planKey];
  // ★払った額より 多くは 返しません（★上の 註）。
  return 上限 === undefined ? 額 : Math.min(額, 上限);
}

/** ★画面に出す1行（★いくら返るか）。 */
export function refundLine(planKey, monthsUsed) {
  const yen = refundYen(planKey, monthsUsed);
  if (yen === null) return "";
  const m = monthsLeft(monthsUsed);
  return `残り ${m}か月ぶん ${yen.toLocaleString("ja-JP")}円を お返しします。`;
}

/** ★規約・特商法・最終確認の画面に置く字（★裁定155 §5 Sonnet 宛）。 */
export const YEARLY_TERMS_LINE =
  "年払いは 自動で 更新しません。途中で やめたときは、"
  + "未経過の 月ぶんを お返しします。";
