// ============================================================================
// 2つの 時刻の あいだの 時間（2026-09-09）
//
//   ★★もとは components/VocalTracker.jsx の中にありました（computeTimeGapHours）。
//     ★★「ふりかえる」の画面（見本⑤「寝るまでの間」）からも 要るように なりました。
//     ★★写しを 作りません。★同じ決めが 2か所に 住むと、★片方だけ 直ります。
//       ★この repo で いちばん よく出る 不具合の 形です。
//   ★VocalTracker は、この関数を computeTimeGapHours という名で 読み続けます。
//
//   ★見張り components/tests/look-back.test.js
// ============================================================================

/**
 * ★start から end までの 時間（★小数1桁）。
 *
 *   ★★日を またぐときは、★24時間を 足します（★例：夕食19:00 → 就寝1:00 ＝ 6時間）。
 *   ★どちらかが 空なら null。★0 に しません。
 */
export function timeGapHours(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const [sh, sm] = String(startTime).split(":").map(Number);
  const [eh, em] = String(endTime).split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // 日をまたぐ場合（例: 夕食19:00→就寝1:00）
  return Math.round((diff / 60) * 10) / 10;
}
