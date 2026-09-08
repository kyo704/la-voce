// ============================================================================
// おうち画面の作り直し ── 決めを、ここ1か所に（2026-09-08）
//
//   ★出どころ docs/opus/woolsong-仕様-おうち画面の作り直し（9月8日）.md
//
//   ★★いちばん大事な決め（★§0・§5）
//     ★★「ながめる」と「いじる」を、★分けます。
//       ★★ふだんは、★部屋と羊しか出しません。
//         ★一覧も、絞り込みも、並び順も、★1つも出しません。
//       ★「したく」を押したときだけ、★引き出しが上がります。
//
//   ★★言葉（★§7-2・§7-4・坂本さんのお決め 2026-09-08）
//     ★★「もようがえ」「マイコーデ」は、★使いません。
//       ★あの作品の言い回しだからです。
//     ★★したく ／ さっきに もどす ／ これでいい ／ おわり
//
//   ★★絵（★§7-2・坂本さんのお決め）
//     ★★アイコンを、★作りません。★字だけです。
//       ★りんご・のこぎり・葉に似ないためには、★作らないのが いちばん確かです。
//       ★そして「字のほうが迷わせない」とは、★§2 自身が書いています。
//
//   ★見張り components/tests/home-drawer.test.js
// ============================================================================

/**
 * ★画面の状態（★§3・6つ）。
 *
 *   ★★「色をえらぶ」は、★別の画面ではありません。
 *     ★引き出しの中で、★帯が1段せり出すだけです。
 *   ★★「さがす」だけが、★別画面です（★§3-6）。
 */
export const VIEW = "view";       // ★① ながめる（★既定）
export const DRESS = "dress";     // ★② したく（★引き出しが上がる）
export const SEARCH = "search";   // ★⑥ さがす（★別画面）

export const STATES = Object.freeze([VIEW, DRESS, SEARCH]);

/**
 * ★大分類（★§3-2・5つ）。
 *
 *   ★★ポケ森は6つですが、★うちは5つです。★点数が1桁 少ないためです（★§2）。
 *   ★★アイコンは、★持ちません。★字だけです。
 */
export const CATEGORIES = Object.freeze([
  { key: "wear", label: "きるもの" },
  { key: "place", label: "おくもの" },
  { key: "surface", label: "かべ・ゆか" },
  { key: "window", label: "まど" },
  { key: "store", label: "しまう" }
]);

export function categoryLabel(key) {
  const c = CATEGORIES.find((x) => x.key === key);
  return c ? c.label : null;
}

/**
 * ★中分類の、★先頭3つ（★§3-2）。
 *
 *   ★★いつも、★同じ順で、★いちばん前です。★場所を覚えられるためです。
 *   ★★入れ替えないこと。★並べ替えの対象にも しないこと。
 */
export const FIXED_TABS = Object.freeze([
  { key: "recent", label: "さいきん" },
  { key: "fav", label: "おきにいり" },
  { key: "all", label: "ぜんぶ" }
]);

/**
 * ★大分類ごとの、★そのあとの中分類。
 *
 *   ★★中身のないものは、★出しません（★空の札を並べないこと）。
 *   ★★「きるもの」は、★置き場所で分けます。
 *     ★仕様 §3-2 は「166点」と書いていますが、★着るものは 385点あります。
 *     ★★219点（記念のもの）を、★出さない形にはしません。
 *       ★受け取ったものが、★画面から消えることになります。
 */
export const SUB_TABS = Object.freeze({
  wear: [
    { key: "top", label: "うわぎ" },
    { key: "bottom", label: "したぎ" },
    { key: "outer", label: "はおり" },
    { key: "garment", label: "ぜんしん" },
    { key: "hat", label: "ぼうし" },
    { key: "neck", label: "くびもと" },
    { key: "shoes", label: "くつ" },
    { key: "eyes", label: "めもと" },
    { key: "prop", label: "もちもの" }
  ],
  place: [
    { key: "furniture", label: "かぐ" },
    { key: "showa", label: "むかしのかぐ" },
    { key: "wallart", label: "かべかけ" },
    { key: "garden", label: "にわ" }
  ],
  surface: [
    { key: "wallTile", label: "かべ" },
    { key: "floorTile", label: "ゆか" }
  ],
  window: [
    { key: "window", label: "まどわく" },
    { key: "view", label: "そとのけしき" },
    { key: "door", label: "とびら" }
  ],
  store: []
});

export function subTabsFor(categoryKey) {
  return [...FIXED_TABS, ...(SUB_TABS[categoryKey] || [])];
}

/**
 * ★並び順（★§6・巡回）。
 *
 *   ★★1つのチップを押すと、★次へ回ります。★メニューを開かせません。
 *   ★★終わりまで行ったら、★先頭へ戻ります。★行き止まりを作らないこと。
 */
export const SORTS = Object.freeze([
  { key: "new", label: "あたらしい順" },
  { key: "often", label: "よく使う順" },
  { key: "color", label: "色の順" },
  { key: "name", label: "名前順" }
]);

export function nextSort(key) {
  const i = SORTS.findIndex((s) => s.key === key);
  return SORTS[(i < 0 ? 0 : (i + 1) % SORTS.length)].key;
}

export function sortLabel(key) {
  const s = SORTS.find((x) => x.key === key);
  return s ? s.label : SORTS[0].label;
}

/**
 * ★数（★§6・§8-5）。
 *
 *   ★★画面で書かないこと。★ここ1か所です。
 */
export const SIZES = Object.freeze({
  drawerPct: 60,        // ★引き出しの高さ（★絵を40%残す）
  gridColumns: 4,       // ★4列
  cellPx: 74,           // ★1マス（★見本の目安）
  gridGapPx: 6,         // ★1マスのあいだ
  roomPct: 40,          // ★★絵を残す高さ（★引き出しが 60% なので、残りです）
  tier1LabelPx: 10.5,   // ★大分類の字（★アイコンは作りません）
  tier2ChipPx: 26,      // ★中分類のチップの高さ
  tier3Px: 40,          // ★第3段の高さ
  colorBandPx: 46,      // ★色の帯（★§8-5）
  swatchPx: 25,
  swatchRadiusPx: 4,
  swatchGapPx: 5
});

/**
 * ★言葉（★§7-2・§7-4）。
 *
 *   ★★「もようがえ」「マイコーデ」「きせかえ」を、★使わないこと。
 *   ★下の帯は3つ。★左だけ、場面で変わります（★§6）。
 */
export const COPY = Object.freeze({
  open: "したく",
  closeLeft: "おわり",
  storeLeft: "しまう",
  undo: "さっきに もどす",
  done: "これでいい",
  search: "さがす",
  searchCancel: "やめる",
  searchClear: "けす",
  placing: "ドラッグで うごかす",
  // ★★色の帯は、★きるもの のときだけ 出します（★§8-4）。
  //   ★帯が有るかどうかが、そのまま「色を変えられる」という説明になります。
  //   ★★文字で説明しないこと。
  colorNone: "もとの",
  // ★★まだ何も えらんでいないとき（★見本①）。
  //   ★★帯は、★出したままにします。★隠しません。
  //     ★「ここで色が かえられる」と、★先に分かるためです。
  //     ★押しても 何も起きないので、★間違えません。
  colorHint: "品を えらぶと、いろを かえられます",
  // ★★柄もの（★見本③）。★2色目は 自動なので、選ばせません。
  //   ★何色になるかだけを、★見せます。
  colorPattern: "がら"
});

/**
 * ★えらぶ前の、帯の見え方（★§8-5）。
 *
 *   ★★消しません。★薄くして、★灰色にします。
 *     ★出したままだと「ここで色が かえられる」と 先に分かります。
 */
export const BAND_IDLE = Object.freeze({ opacity: 0.45, grayscale: 0.7 });

/** ★★使ってはいけない言葉（★§7-4）。★見張りが見ています。 */
export const FORBIDDEN_WORDS = Object.freeze([
  "もようがえ", "マイコーデ", "きせかえ", "着せ替え", "コーディネート"
]);

/**
 * ★色の帯を、出してよい大分類か（★§8-4）。
 *
 *   ★★「きるもの」のときだけです。
 *     ★おくもの・かべとゆか・まど では、★出しません。
 */
export function colorBandApplies(categoryKey) {
  return categoryKey === "wear";
}

/**
 * ★下の帯の、いちばん左（★§6「左だけ 場面で変わる」）。
 */
export function leftButtonLabel(categoryKey) {
  return categoryKey === "store" ? COPY.storeLeft : COPY.closeLeft;
}
