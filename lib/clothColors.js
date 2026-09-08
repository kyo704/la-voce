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
import { CLOTH_COLORS_ENABLED } from "@/lib/pausedFeatures";

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
 *   ★★ふだん着 166点すべてです（★2026-09-08・parts-v3-2026-09-08b）。
 *     ★上54・下35・羽織り35・かぶりもの13・くつ12・首元11・目元6。
 *   ★★記念のもの219点は、★入っていません。★色を変えられません。
 *   ★★ここに無い品は、★色を選べません。★それでよい形にします。
 */
export const COLORABLE_KEYS = Object.freeze([
  "top_01", "top_06", "top_07", "top_09", "top_11", "top_12",
  "top_14", "top_24", "top_28", "top_30", "top_34", "top_35",
  "top_37", "top_39", "top_40", "top_47", "top_52", "bottom_01",
  "bottom_05", "bottom_08", "bottom_12", "bottom_14", "bottom_15", "bottom_19",
  "bottom_20", "bottom_21", "bottom_29", "bottom_30", "outer_01", "outer_04",
  "outer_09", "outer_13", "outer_19", "outer_20", "outer_22", "outer_28",
  "outer_30", "shoes_01", "shoes_03", "shoes_04", "shoes_05", "shoes_09",
  "shoes_11", "hats_01", "hats_02", "hats_03", "hats_04", "hats_05",
  "hats_06", "hats_07", "hats_08", "hats_09", "hats_11", "hats_12",
  "hats_13", "neck_01", "neck_03", "neck_04", "neck_05", "neck_09",
  "eyes_01", "eyes_02", "top_02", "top_03", "top_04", "top_05",
  "top_08", "top_10", "top_13", "top_15", "top_16", "top_17",
  "top_18", "top_19", "top_20", "top_21", "top_22", "top_23",
  "top_25", "top_26", "top_27", "top_29", "top_31", "top_32",
  "top_33", "top_36", "top_38", "top_41", "top_42", "top_43",
  "top_44", "top_45", "top_46", "top_48", "top_49", "top_50",
  "top_51", "top_53", "top_54", "bottom_02", "bottom_03", "bottom_04",
  "bottom_06", "bottom_07", "bottom_09", "bottom_10", "bottom_11", "bottom_13",
  "bottom_16", "bottom_17", "bottom_18", "bottom_22", "bottom_23", "bottom_24",
  "bottom_25", "bottom_26", "bottom_27", "bottom_28", "bottom_31", "bottom_32",
  "bottom_33", "bottom_34", "bottom_35", "outer_02", "outer_03", "outer_05",
  "outer_06", "outer_07", "outer_08", "outer_10", "outer_11", "outer_12",
  "outer_14", "outer_15", "outer_16", "outer_17", "outer_18", "outer_21",
  "outer_23", "outer_24", "outer_25", "outer_26", "outer_27", "outer_29",
  "outer_31", "outer_32", "outer_33", "outer_34", "outer_35", "neck_02",
  "neck_06", "neck_07", "neck_08", "neck_10", "neck_11", "eyes_03",
  "eyes_04", "eyes_05", "eyes_06", "shoes_02", "shoes_06", "shoes_07",
  "shoes_08", "shoes_10", "shoes_12", "hats_10"
]);

/**
 * ★全身もの（★上下ひとつづきの衣装）。★色を変えられません。
 *
 *   ★★坂本さんの決め（2026-09-08）
 *     ★記念のもの（箱1）と、★同じ扱いにします。
 *     ★「夜の女王の衣装」の色を変えたら、★それは夜の女王ではありません。
 *   ★★これから「下」「羽織り」へ広げるときも、★ここが止めます。
 *     ★COLORABLE_KEYS に足すだけでは、★通りません。
 */
export const NEVER_COLORABLE_SLOTS = Object.freeze(["garment"]);

/**
 * ★色を塗れるか。
 *
 *   ★★止めているあいだは、★1点も塗れません（lib/pausedFeatures.js）。
 *     ★2枚方式の絵が、★出荷済みの217点と違う裁ち方で描かれているためです。
 *     ★色を選ぶと、★上着が裾で90画素 長くなり、★下を覆います。
 *   ★★ここが唯一の門です。★画面で判じないこと。
 *
 * @param key   品の鍵
 * @param slot  その品の置き場所（★分かるときは渡してください）
 */
export function isColorable(key, slot) {
  if (!CLOTH_COLORS_ENABLED) return false;
  if (slot && NEVER_COLORABLE_SLOTS.includes(slot)) return false;
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
