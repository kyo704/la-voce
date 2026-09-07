import index from "@/docs/assets/sheep-interior-index.json";

// ============================================================================
// おうちの内装 120点（第2〜5便・2026-09-08）
//
//   ★出どころ assets/wardrobe-v3 の zip の中の acnh/interior/
//            （★中身の説明は、その zip の README.md が正です）
//
//   ★★いまの101点（lib/character.js の SHOP_ITEMS）とは、★別のものです。
//     ★鍵が、★1つも重なりません（★2026-09-08 に数えました）。
//     ★★だから「差し替え」ではなく、★足す形になります。
//     ★101点をどうするかは、まだ決まっていません
//       （docs/reports/2026-09-08-おうちの道具79点の行く先.md）。
//
//   ★★大きさが、★5種類あります。★1024 の1種類ではありません。
//     家具・庭・壁掛け・昭和   320×320  ★床に接する位置は y300
//     窓枠                     384×384  ★中は抜いてある（景色が透ける）
//     扉                       320×512
//     窓の外の景色             480×320
//     壁・床のタイル           256×256  ★敷き詰め用
//
//   ★★窓は「枠」と「景色」の★2枚です。
//     ★13枠 × 13景色 ＝ ★169通り。
//     ★重ね順は ★景色（view）→ 枠（window）。★枠が上です。
//
//   ★見張り components/tests/sheep-interior-v2.test.js
// ============================================================================

export const INTERIOR_INDEX = index;
export const INTERIOR_ITEMS = index.items;
export const INTERIOR_BASE = "/sheep/";

/** ★分類。★並べる順です（★探す順であって、描く順ではありません）。 */
export const INTERIOR_CATEGORIES = Object.freeze([
  { key: "furniture", label: "家具" },
  { key: "showa", label: "昭和の家具" },
  { key: "window", label: "窓枠" },
  { key: "view", label: "窓の外" },
  { key: "door", label: "扉" },
  { key: "wallart", label: "壁かけ" },
  { key: "garden", label: "庭の置物" },
  { key: "tile", label: "壁と床" }
]);

export function categoryLabel(key) {
  const c = INTERIOR_CATEGORIES.find((x) => x.key === key);
  return c ? c.label : key;
}

export function interiorItemByKey(key) {
  return INTERIOR_ITEMS.find((i) => i.key === key) || null;
}

export function interiorSrc(item) {
  return item ? INTERIOR_BASE + item.file : null;
}

export function itemsByCategory(category) {
  return INTERIOR_ITEMS.filter((i) => i.category === category);
}

/**
 * ★床に接する位置（★zip の README より）。
 *
 *   ★「家具は y300 が床の線です。320の画像の下20pxは余白なので、
 *     ★床のラインに y300 を合わせて置いてください。全点そろえてあります。」
 *
 *   ★★数を、ここ1か所で持ちます。★画面で書かないこと。
 */
export const FLOOR_LINE_Y = 300;
export const FURNITURE_CANVAS = 320;

/** ★その絵の、下端から床の線までの割合（★置くときに使います）。 */
export function floorOffsetRatio(item) {
  const h = item && item.size ? item.size[1] : FURNITURE_CANVAS;
  return (h - FLOOR_LINE_Y) / h;
}

// ---------------------------------------------------------------------------
// ★窓（★枠 ＋ 景色 ＝ 169通り）
// ---------------------------------------------------------------------------

/**
 * ★窓の重ね順。
 *
 *   ★★景色を先に描き、★枠を上に重ねます。
 *     ★枠の中は抜いてあるので、★景色が透けます。
 *   ★★逆にすると、★枠が景色に隠れます。
 */
export const WINDOW_LAYER_ORDER = Object.freeze(["view", "window"]);

export function windowFrames() {
  return itemsByCategory("window");
}

export function windowViews() {
  return itemsByCategory("view");
}

/**
 * ★いま選んでいる窓の、2枚。
 *
 *   ★★どちらか片方だけでも、成り立ちます。
 *     ★枠だけ … 外は、部屋の壁の色のままです
 *     ★景色だけ … 枠のない、抜けた窓になります
 *   ★★片方が無いときに、★もう片方を出さない、としないこと。
 *     ★選んだものは、そのまま出します。
 *
 * @param {object} chosen  { window: 鍵, view: 鍵 }
 */
export function windowLayers(chosen) {
  const c = chosen || {};
  return WINDOW_LAYER_ORDER
    .map((k) => interiorItemByKey(c[k]))
    .filter(Boolean);
}

/** ★組み合わせの数。★画面には出しません（★数を見せない決めのため）。 */
export function windowCombinationCount() {
  return windowFrames().length * windowViews().length;
}

// ---------------------------------------------------------------------------
// ★置き場所（★1つの分類につき、1つだけ置けるもの）
// ---------------------------------------------------------------------------

/**
 * ★1つだけ置ける分類。
 *
 *   ★窓枠・窓の外・扉・壁と床は、★部屋に1つです。
 *   ★家具・庭・壁かけは、★いくつでも置けます。
 */
export const SINGLE_SLOT_CATEGORIES = Object.freeze(["window", "view", "door", "tile"]);

export function isSingleSlot(category) {
  return SINGLE_SLOT_CATEGORIES.includes(category);
}

/**
 * ★置いているものの形。
 *
 *   ★★character_equipped の中に持ちます（★列を、足しません）。
 *     ★着せかえの印と、同じ入れ物です。★保存の道も、もう在ります。
 *
 *     interior: {
 *       window: "window_03",        ← 1つだけ
 *       view:   "view_07",          ← 1つだけ
 *       door:   "door_02",          ← 1つだけ
 *       tile:   "tile_04",          ← 1つだけ
 *       furniture: ["furniture_01", …],   ← いくつでも
 *       garden:    ["garden_02", …],
 *       wallart:   ["wallart_05", …]
 *     }
 */
export function interiorOf(equipped) {
  const v = equipped && equipped.interior;
  return v && typeof v === "object" ? v : {};
}

/**
 * ★1つ置く・外す。
 *
 *   ★★1つだけの分類は、★置き換えます。★同じものを押したら、外します。
 *   ★いくつでも置ける分類は、★足す・引くです。
 *   ★★元の入れ物を書き替えません。★新しいものを返します。
 */
export function toggleInterior(equipped, item) {
  if (!item || !item.category) return equipped || {};
  const cur = interiorOf(equipped);
  const c = item.category;
  if (isSingleSlot(c)) {
    const next = { ...cur };
    if (next[c] === item.key) delete next[c];
    else next[c] = item.key;
    return { ...(equipped || {}), interior: next };
  }
  const list = Array.isArray(cur[c]) ? cur[c] : [];
  const has = list.includes(item.key);
  return {
    ...(equipped || {}),
    interior: {
      ...cur,
      [c]: has ? list.filter((k) => k !== item.key) : [...list, item.key]
    }
  };
}

/** ★いま置いているか。 */
export function isPlaced(equipped, item) {
  if (!item) return false;
  const cur = interiorOf(equipped);
  if (isSingleSlot(item.category)) return cur[item.category] === item.key;
  const list = cur[item.category];
  return Array.isArray(list) && list.includes(item.key);
}
