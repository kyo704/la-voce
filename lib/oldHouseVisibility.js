// ============================================================================
// 古いおうちの道具79点を、門の中の方から隠す（2026-09-08・案あ）
//
//   ★★坂本さんの決め（2026-09-08）
//     ★消しません。★門の中の方の画面から、出さないだけです。
//     ★門の外の方には、★これまでどおり、そのまま出ます。
//     ★背景10点（backdrop）は、★隠しません。★新しい側に当たるものがありません。
//
//   ★★2026-09-08、★不具合のご報告をいただきました。
//     ★「特大窓ガラスが、まだ部屋に出ている」
//     ★★そのとおりでした。
//       ★お店の一覧からは隠していましたが、
//       ★★すでに置いてあるものを、★部屋を描く側で見ていませんでした。
//     ★★「隠す」の決めが、★2か所に分かれていたのが原因です。
//       ★お店の側 … HIDDEN_WHEN_NEW_INTERIOR で分類ごとに外す
//       ★部屋の側 … 1行ずつ hideOldHouse ? … : … と書いていた
//       ★★7分類のうち、★窓と庭の3行を、★書き忘れていました。
//     ★★だから、★決めを、ここ1か所に集めます。
//       ★これがこの repo の決まりです（CLAUDE.md「一つの決定、一つのモジュール」）。
//
//   ★見張り components/tests/old-house-hidden.test.js
// ============================================================================

/**
 * ★門の中の方から隠す分類。
 *
 *   ★★backdrop（背景10点）は、★入れません。
 *     ★新しい側に、★当たるものがないためです。★消えたように見えてしまいます。
 */
export const HIDDEN_WHEN_NEW_INTERIOR = Object.freeze([
  "wall", "floor", "window", "scenery", "furniture", "garden", "wallhang"
]);

/**
 * ★1つだけ置ける分類の、★既定の名前。
 *
 *   ★★null にしないこと。★色を引く先が MATERIAL_COLORS[…] なので、
 *     ★null だと引けず、★色が消えます。
 */
export const OLD_HOUSE_DEFAULTS = Object.freeze({
  wall: "wall_default",
  floor: "floor_default",
  window: "window_default",
  scenery: "scenery_default"
});

/** ★いくつでも置ける分類。 */
export const OLD_HOUSE_LIST_CATEGORIES = Object.freeze(["furniture", "garden", "wallhang"]);

export function isHiddenCategory(category) {
  return HIDDEN_WHEN_NEW_INTERIOR.includes(category);
}

/**
 * ★1つだけ置ける分類の、★いま出すべき名前。
 *
 *   ★門の中の方には、★既定のものを返します（★選んだものは消しません）。
 *   ★門の外の方には、★選んだものを、そのまま返します。
 *
 *   ★★選んだ値そのものは、★1つも書き替えません。
 *     ★character_equipped は、そのままです。
 *     ★門を外せば、★また出ます。★取り上げていません。
 */
export function oldHouseKey(equipped, category, wardrobeOn) {
  const fallback = OLD_HOUSE_DEFAULTS[category] || null;
  if (wardrobeOn && isHiddenCategory(category)) return fallback;
  const v = equipped && equipped[category];
  return v || fallback;
}

/**
 * ★いくつでも置ける分類の、★いま出すべき一覧。
 *
 *   ★門の中の方には、★空の一覧を返します。
 */
export function oldHouseList(equipped, category, wardrobeOn) {
  if (wardrobeOn && isHiddenCategory(category)) return [];
  const v = equipped && equipped[category];
  return Array.isArray(v) ? v : [];
}
