// ============================================================================
// 前に着ていた姿を、覚えておく（2026-09-09）
//
//   ★★実機のご報告
//     ★おうちの画面が、★脚だけ 先に 出て、★体と服が あとから 出る。
//     ★装備の返事が 来ないと、★服が いつまでも 出ない。
//
//   ★★装備は、★プロフィールの 大きな問い合わせに 乗っています。
//     ★返事が 来るまで、★何を着ているか 分かりません。
//     ★★だから、★前に見たときの姿を 覚えておいて、★先に 描きます。
//
//   ★★覚えるのは この端末の中だけです（localStorage）。
//     ★サーバへ 送りません。★ほかの端末にも 行きません。
//     ★★中身は「どの品を着ているか」の 鍵だけです。
//       ★体調も、記録も、名前も、★1つも 入りません。
//     ★読めなくても 落ちません。★そのときは 空から 始めます。
//
//   ★★返事が 来たら、★サーバの姿に そろえます。★覚えは 上書きします。
//     ★★覚えのほうを 正に しません。★あくまで「先に描くための下書き」です。
//
//   ★見張り components/tests/equipped-cache.test.js
// ============================================================================

const KEY_PREFIX = "woolsong-equipped-";

/** ★人ごとに 分けます。★別の方の姿を 描かないためです。 */
function keyFor(userId) {
  return KEY_PREFIX + String(userId || "");
}

/** ★覚えておきます。★書けなくても 黙って あきらめます。 */
export function rememberEquipped(userId, equipped) {
  if (!userId || !equipped || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(equipped));
  } catch (e) {
    // ★★書けない設定の 端末が あります。★それで 落としません。
  }
}

/** ★思い出します。★無ければ null。★壊れていても null。 */
export function recallEquipped(userId) {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const v = JSON.parse(raw);
    return (v && typeof v === "object" && !Array.isArray(v)) ? v : null;
  } catch (e) {
    return null;
  }
}

/** ★退会・切り替えのときに、消します。 */
export function forgetEquipped(userId) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch (e) {
    // ★消せなくても、落としません。
  }
}
