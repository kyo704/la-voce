// ============================================================================
// 絵の 形 ── WebP を 先に、PNG に 戻せるように（2026-09-09）
//
//   ★★1024×1024 の PNG が、★いちばん 重いところでした。
//     ★羊の土台 94KB → 13KB（86%減）／着せかえ 52KB → 11KB（79%減）
//     ★床壁 69KB → 5KB（93%減）
//     ★★ぜんぶで 37.1MB → 13.4MB（★64%減）。★1,250枚を 変えました。
//
//   ★★絵は 1枚も 作り直していません。★形を 変えただけです。
//   ★★PNG は 1枚も 消していません。★読めない端末のために 残します。
//     ★★画面は WebP を 先に 出し、★読めなければ PNG に 戻します（onError）。
//     ★戻す道が 無いまま 切り替えると、★古い端末で 絵が 消えます。
//
//   ★★一覧の 小さい絵（thumbs）は、★変えていません。
//     ★1枚 3.4KB です。★変える手間に 見合いません。
//
//   ★★ここが 1つの決めです。★画面で「.webp」と 書かないこと。
//
//   ★見張り components/tests/image-format.test.js
// ============================================================================

/** ★WebP に します。★png 以外は、そのまま 返します。 */
export function webp(src) {
  if (typeof src !== "string" || !src) return src;
  if (!src.endsWith(".png")) return src;
  return src.slice(0, -4) + ".webp";
}

/** ★PNG に 戻します（★読めなかったとき）。 */
export function png(src) {
  if (typeof src !== "string" || !src) return src;
  if (!src.endsWith(".webp")) return src;
  return src.slice(0, -5) + ".png";
}

/**
 * ★＜img＞に そのまま 付けられる、★戻す 仕掛け。
 *
 *   ★★1度だけ 戻します。★2度 繰り返すと、★止まらなくなります。
 */
export function fallbackToPng(e) {
  const el = e && e.currentTarget;
  if (!el || el.dataset.pngFallback) return;
  const back = png(el.src || "");
  if (!back || back === el.src) return;
  el.dataset.pngFallback = "1";
  el.src = back;
}
