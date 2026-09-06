// ============================================================================
// おうちの内装 ── ★壁と床のタイル（2026-09-06）
//
//   出どころ docs/assets/sheep-tiles-index.json（★インテリア第1便・壁10・床9）
//
//   ★★いままで、★壁と床は「1色」で塗っていました。
//     ★タイルの絵が届いたので、★絵で敷けるようにします。
//
//   ★★色は、★消しません。
//     ★絵が無い style（いままでの品物）は、★これまでどおり色で塗ります。
//     ★★絵が在るものだけ、★絵に差し替わります。
//     ★取り上げない、という決まりのとおりです。
//
//   ★出す・出さないは、★着せかえと同じ鍵で決めます（mayUseWardrobe）。
//     ★まだ、坂本さんにしか出しません。
// ============================================================================

import tiles from "@/docs/assets/sheep-tiles-index.json";

export const TILE_INDEX = tiles;
export const TILE_BASE = "/sheep/tiles/";

/** ★タイルの絵が在る鍵の一覧。 */
export const TILE_KEYS = Object.freeze(Object.keys(tiles));

/**
 * ★その品物に、★タイルの絵が在るか。
 *
 *   ★品物の鍵（floor_natural・wall_asian…）で引きます。
 *   ★★無ければ null。★呼ぶ側は、これまでどおり色で塗ります。
 */
export function tileFor(materialKey) {
  const t = tiles[materialKey];
  if (!t) return null;
  return {
    ...t,
    src: TILE_BASE + materialKey + ".png"
  };
}

/**
 * ★敷き方（CSS）。
 *
 *   ★★タイルは 256×256 で、★継ぎ目なく並びます。
 *   ★大きさは、★画面の広さに合わせて変えられるようにします。
 *     ★小さくしすぎると、★模様がうるさくなります。
 *     ★大きくしすぎると、★1枚の絵に見えます。
 */
export function tileStyle(materialKey, { sizePx = 96 } = {}) {
  const t = tileFor(materialKey);
  if (!t) return null;
  return {
    backgroundImage: `url("${t.src}")`,
    backgroundRepeat: t.tile === false ? "no-repeat" : "repeat",
    backgroundSize: t.tile === false ? "cover" : `${sizePx}px ${sizePx}px`
  };
}

/** ★壁のタイルだけ。 */
export function wallTiles() {
  return TILE_KEYS.filter((k) => tiles[k].cat === "wall");
}

/** ★床のタイルだけ。 */
export function floorTiles() {
  return TILE_KEYS.filter((k) => tiles[k].cat === "floor");
}

/** ★見せる名前。★鍵の名前を、画面に出さないこと。 */
export function tileName(materialKey) {
  const t = tiles[materialKey];
  return (t && t.name) || materialKey;
}

/**
 * ★★インテリア第1便で増えた材質かどうか（2026-09-06）。
 *
 *   ★まだ坂本さんだけにお見せしています。★門は呼ぶ側が持ちます。
 *   ★★ここでは「新しく増えたもの」の一覧だけを持ちます。
 *     ★門の判定は mayUseWardrobe です。★2つ作らないこと。
 *
 *   ★wall_american と floor_american は、★もとから店に在ります。
 *     ★絵が付いただけなので、★新しいものには数えません。
 *     ★数えると、★もとからお持ちの方から、★取り上げてしまいます。
 */
const ALREADY_IN_SHOP = Object.freeze(["wall_american", "floor_american"]);

export const NEW_MATERIAL_KEYS = Object.freeze(
  TILE_KEYS.filter((k) => !ALREADY_IN_SHOP.includes(k))
);

export function isNewMaterial(materialKey) {
  return NEW_MATERIAL_KEYS.includes(materialKey);
}
