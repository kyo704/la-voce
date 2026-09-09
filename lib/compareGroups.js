// ============================================================================
// くらべる ── 群の作り方（2026-09-09・査読 §1）
//
//   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §1
//     「★1「初日だけで比べる」は、機能ではなく ★正しさの安全装置です。
//      ★無料の人に 逆向きの1文が出る設計は、無料の人を傷つけ、製品の信用を削ります。
//      ★私は これを 有料の切替（E3）に 置いていました。★置く場所を 間違えていました。」
//
//   ★★だから、★これは 既定です。★売り物では ありません。
//     ★★entitlements.js に、★この鍵を 作らないこと。
//     ★見張りが、★作られていないことを 確かめます。
//
//   ★★何を するのか
//     ★「出づらい」が つづいた日は、★その かたまりの ★初日だけを 群Bに 入れます。
//     ★★2日目・3日目は、★1日目の 続きであって、★別の 出来事では ありません。
//       ★同じ出来事を 3回 数えると、★偶然が 3倍に 見えます。
//       ★★逆向きの1文が 出る道は、★ここです。
//
//   ★★正直に 書いておくこと（★§1-1）
//     ★初日だけにすると、★n は 減ります。
//     ★1文が 出るまでの日数は、★確実に 延びます。
//     ★★それでも 既定にします。★間違った1文より、★遅い1文のほうが よいからです。
//
//   ★★実測（2026-09-09）★19日 → 16日（★残る割合 84.2%）。
//     ★いまは まだ、★つづいた日が ほとんど ありません。
//     ★書く日が 増えれば、★減る割合は 上がります。
//
//   ★見張り components/tests/compare-groups.test.js
// ============================================================================

import { addDaysISO } from "@/lib/lookBack";

/**
 * ★既定は「初日だけ」。
 *
 *   ★★true が 既定です。★false に するのは、★中身が 分かる方だけです。
 *   ★見本⑬の 切替：「つづいた日は、初日だけで くらべる」［既定］
 */
export const FIRST_DAY_ONLY_DEFAULT = true;

/** ★見本⑬の 切替の 言葉。★1文字も 変えないこと。 */
export const FIRST_DAY_ONLY_LABEL = "つづいた日は、初日だけで くらべる";

/**
 * ★つづいた日を、★かたまりに 分けます。
 *
 *   @param dates ★「出づらい」と 書いた日（★どの順でも かまいません）
 *   @returns [[日, 日, …], …] ★かたまりごと・古い順
 *
 *   ★★1日 空いたら、★別の かたまりです。
 *     ★★「書いていない日」で 切れるか、は 別の問いです。
 *       ★ここでは 切りません。★書いていない日を またいでも、
 *       ★日付が 続いていなければ 別の かたまりです。
 */
export function streaksOf(dates) {
  const sorted = [...new Set((dates || []).filter(Boolean))].sort();
  const out = [];
  let cur = [];
  sorted.forEach((d) => {
    if (cur.length === 0) { cur = [d]; return; }
    if (addDaysISO(cur[cur.length - 1], 1) === d) { cur.push(d); return; }
    out.push(cur);
    cur = [d];
  });
  if (cur.length > 0) out.push(cur);
  return out;
}

/**
 * ★群B（★「出なかった」ほう）に 入れる日。
 *
 *   @param dates          ★「出づらい」と 書いた日
 *   @param firstDayOnly   ★既定 true。★false なら つづいた日も 全部
 */
export function groupBDates(dates, firstDayOnly = FIRST_DAY_ONLY_DEFAULT) {
  if (!firstDayOnly) return [...new Set((dates || []).filter(Boolean))].sort();
  return streaksOf(dates).map((s) => s[0]);
}

/**
 * ★どれだけ 減ったか。★正直に 見せるための 数です。
 *
 *   ★★これは 画面に 出しません。★「あと◯日」に なりません。
 *     ★私たちが、★§1-1 の「n は減ります」を 数で 確かめるためのものです。
 */
export function firstDayOnlyCost(dates) {
  const all = [...new Set((dates || []).filter(Boolean))].length;
  const first = streaksOf(dates).length;
  return { all, first, dropped: all - first };
}
