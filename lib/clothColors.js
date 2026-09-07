// ============================================================================
// 服のいろ 24色（2026-09-08）
//
//   ★出どころ docs/opus/woolsong-確定-服のいろ24色（9月8日）.md
//            assets/color-2layer/…（9月8日）.zip の中の README.md
//
//   ★★2枚方式です。★ただし form ＋ mask では ありません。
//     ★白版（light）と 黒版（dark）の2枚です。
//
//   ★★なぜ2枚 要るのか（★README の説明のとおり）
//     ★絵を作るとき、★色に2つの処理がかかっています。
//       sh(c, d) = c × (1−d)          ★かけ算
//       li(c, d) = c + (255−c)×d      ★足し算
//     ★★合わせると「入力 × m ＋ a」という形（アフィン変換）です。
//       ★かけ算1枚では、★足し算のぶん（a）を作れません。
//     ★白と黒で1回ずつ描けば、★m と a が求まります。
//       dark  = その絵を黒で描いたもの → ★a そのもの
//       light = その絵を白で描いたもの → ★m×255 + a
//
//   ★★塗る式（★README のとおり・1画素ごと）
//       out = (light − dark) × col / 255 + dark
//       アルファは light のものを、そのまま使います
//     ★★mask は要りません。★light のアルファが、塗る形です。
//
//   ★Opus の実測：本来の色との差は 平均0.23／最大0.50（255のうち）。
//
//   ★★ボーダーの白い縞も、チェックの柄も、ボタンも、そのまま残ります。
//     ★変わるのは「本体の色」だけです。
//
//   ★見張り components/tests/cloth-colors.test.js
// ============================================================================

/**
 * ★24色。
 *
 *   ★name  … ひらがなにしてあります（★この製品の言葉づかいに合わせて）。
 *             ★「テラコッタ」「ミント」「ベージュ」「ローズ」「オリーブ」は
 *             ★カタカナのままです。★日本語にすると、かえって分かりにくい色です。
 *   ★hex   … ★狙う色（★様式を通さないときは、これを使います）
 *   ★pre   … ★様式を通すときに使う値（★Opus が逆算したもの）
 *   ★edge  … ★羊の毛と対比が弱く、★縁取りが要る色
 */
export const CLOTH_COLORS = Object.freeze([
  { key: "sumi", name: "すみ", hex: "#2E2A28", pre: "#262A2D" },
  { key: "haiiro", name: "はいいろ", hex: "#8A8580", pre: "#828585" },
  { key: "kinari", name: "きなり", hex: "#F2EDE3", pre: "#EAEDE7", edge: true },
  { key: "kuro", name: "くろ", hex: "#1A1A1C", pre: "#111A22" },
  { key: "enji", name: "えんじ", hex: "#840C24", pre: "#850626" },
  { key: "aka", name: "あか", hex: "#C0392B", pre: "#C43429" },
  { key: "terracotta", name: "テラコッタ", hex: "#C4674A", pre: "#C56449" },
  { key: "sakura", name: "さくら", hex: "#E8A8B0", pre: "#E5A5B3", edge: true },
  { key: "rose", name: "ローズ", hex: "#B05C6E", pre: "#AE5871" },
  { key: "yamabuki", name: "やまぶき", hex: "#BF8722", pre: "#C0891C" },
  { key: "karashi", name: "からし", hex: "#A8862E", pre: "#A6892A" },
  { key: "kitsune", name: "きつね", hex: "#D9A15B", pre: "#D8A258", edge: true },
  { key: "kogecha", name: "こげちゃ", hex: "#5C4433", pre: "#564436" },
  { key: "beige", name: "ベージュ", hex: "#C9AE86", pre: "#C4AF87", edge: true },
  { key: "fukamidori", name: "ふかみどり", hex: "#447862", pre: "#377C68" },
  { key: "olive", name: "オリーブ", hex: "#6B7043", pre: "#647245" },
  { key: "moegi", name: "もえぎ", hex: "#7D9B5C", pre: "#749F5D" },
  { key: "mint", name: "ミント", hex: "#A8CFC0", pre: "#9CD2C6", edge: true },
  { key: "fukamori", name: "ふかもり", hex: "#2F4A3C", pre: "#244C42" },
  { key: "kon", name: "こん", hex: "#2B3A5C", pre: "#1F3965" },
  { key: "ao", name: "あお", hex: "#4A6FA5", pre: "#3B6EB1" },
  { key: "mizuiro", name: "みずいろ", hex: "#9BBFD9", pre: "#8EC0E3", edge: true },
  { key: "fuji", name: "ふじ", hex: "#8E7CA8", pre: "#8579B1" },
  { key: "sumire", name: "すみれ", hex: "#5B4B7A", pre: "#514883" }
]);

export const CLOTH_COLOR_KEYS = Object.freeze(CLOTH_COLORS.map((c) => c.key));

export function colorByKey(key) {
  return CLOTH_COLORS.find((c) => c.key === key) || null;
}

/**
 * ★実際に塗る色。
 *
 *   ★★あつ森様式を通すなら、★pre（逆算した値）を使います。
 *     ★通したあとに、★狙った色になります（★ずれ 0）。
 *   ★通さないなら、★hex（狙う色）をそのまま使います。
 *
 *   ★★2つのパレットを持つのは、★わざとです。
 *     ★どちらを使うかは、★様式を通すかで決まります。
 */
export const STYLE_APPLIED = true;   // ★いまの絵は、あつ森様式を通してあります

export function paintHex(key) {
  const c = colorByKey(key);
  if (!c) return null;
  return STYLE_APPLIED ? c.pre : c.hex;
}

/** ★見本に出す色（★お客さまが見る色）。★こちらは、いつも「狙う色」です。 */
export function swatchHex(key) {
  const c = colorByKey(key);
  return c ? c.hex : null;
}

export function needsEdge(key) {
  const c = colorByKey(key);
  return !!(c && c.edge);
}

/** ★縁取りの色。★README の sh(c, 0.45) と同じです。 */
export function edgeHex(key) {
  const h = swatchHex(key);
  if (!h) return null;
  const [r, g, b] = hexToRgb(h);
  const d = 0.45;
  return rgbToHex([r * (1 - d), g * (1 - d), b * (1 - d)]);
}

export function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function rgbToHex(rgb) {
  return "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v)))
    .toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// ★色を塗れる品
// ---------------------------------------------------------------------------

/**
 * ★2枚（light / dark）が在る品。
 *
 *   ★★いまは「上」17点だけです（★2026-09-08）。
 *   ★下・羽織りは、★17点で確かめてからです（★Opus のお勧め）。
 *   ★★ここに無い品は、★色を選べません。★それでよい形にします。
 */
export const COLORABLE_KEYS = Object.freeze([
  "top_01", "top_06", "top_07", "top_09", "top_11", "top_12", "top_14", "top_24",
  "top_28", "top_30", "top_34", "top_35", "top_37", "top_39", "top_40", "top_47", "top_52"
]);

export function isColorable(key) {
  return COLORABLE_KEYS.includes(key);
}

/** ★2枚の絵の在りか。 */
export function layerSrc(key, which) {
  return `/sheep/cloth/${key}_${which}.png`;
}

/**
 * ★選んでいる色。★character_equipped の中に持ちます（★列を、足しません）。
 *
 *   ★★箱1（記念のもの）は、★色を変えられません。
 *     ★「夜の女王のかんむり」の色を変えたら、★それは夜の女王ではありません。
 *     ★★その判定は lib/wardrobeBoxes.js が持ちます。★ここでは持ちません。
 */
export function colorsOf(equipped) {
  const v = equipped && equipped.clothColors;
  return v && typeof v === "object" ? v : {};
}

export function colorOf(equipped, itemKey) {
  return colorsOf(equipped)[itemKey] || null;
}

export function setColor(equipped, itemKey, colorKey) {
  const cur = colorsOf(equipped);
  const next = { ...cur };
  if (!colorKey || cur[itemKey] === colorKey) delete next[itemKey];
  else next[itemKey] = colorKey;
  return { ...(equipped || {}), clothColors: next };
}

/**
 * ★1画素を塗る式（★README のとおり）。
 *
 *   ★★検査のための、★同じ式です。★画面は canvas で、まとめて塗ります。
 */
export function blendChannel(light, dark, col) {
  return (light - dark) * col / 255 + dark;
}
