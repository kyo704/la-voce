// ============================================================================
// 羊の着せかえ ── ★品物の一覧（2026-09-05 夜）
//
//   ★★中身は、★絵と一緒に届いた items-index.json です。
//     ★手で書き写しません。★写すと、★絵と食い違います。
//     ★絵を差し替えるときは、★あの json も一緒に差し替えてください。
//
//   ★出どころ docs/assets/sheep-items-index.json（決定版11・217点）
// ============================================================================

import index from "@/docs/assets/sheep-items-index.json";

export const SHEEP_INDEX = index;
export const SHEEP_ITEMS = index.items;
export const SHEEP_BASE = index.base;
export const SHEEP_GROUPS = index.groups;
export const SHEEP_HANDS = index.hands;

/** ★絵の置き場所。★public/sheep/ の下です。 */
export const SHEEP_ASSET_BASE = "/sheep/";

export function sheepItemByKey(key) {
  return SHEEP_ITEMS.find((i) => i.key === key) || null;
}

/**
 * ★その品物の、★絵のみちすじ。
 *
 *   ★持ち物は、★左・まん中・右で、★別の絵です。
 *   ★★side を渡さないと、★右（既定）になります。
 */
export function sheepItemSrc(item, side) {
  if (!item) return null;
  if (item.files) {
    const k = side === "L" ? "left" : (side === "C" ? "both" : "right");
    return SHEEP_ASSET_BASE + (item.files[k] || item.files.right);
  }
  return SHEEP_ASSET_BASE + item.file;
}

/** ★置き場所ごとに分けます（garment / neck / shoes / hat / prop）。 */
export function itemsBySlot(slot) {
  return SHEEP_ITEMS.filter((i) => i.slot === slot);
}

/** ★まとまりごとに分けます（四季・和服・時代・世界…）。 */
export function itemsByGroup(group) {
  return SHEEP_ITEMS.filter((i) => i.group === group);
}
