// ============================================================================
// コーデ（保存した着せ方）と、下から出るシートの高さ
//
//   出どころ assets/wardrobe-v2/lavoce-仕様-着せ替え画面のUI（9月6日）.md
//            §2（シートの3段階）／§6（コーデ）
//
//   ★★仕様書は 166点の版のものですが、★この2つは点数に関係なく効きます。
//     ★9つのスロットへの作り替えは、★していません（★§3 が「既存の217点は
//     ★レールの外」と書いており、★いまの5スロットのままで動きます）。
//
//   ★★決めは、ここが1つだけ持ちます。
//     ★上限の数を、★画面に書き写さないこと。★2か所になります。
// ============================================================================

// ---------------------------------------------------------------------------
// ① 下から出るシートの高さ（★仕様書 §2）
//
//   ★★羊を、★絶対に隠さないこと。★これが §0 の「いまの問題」そのものです。
//     ★一覧を全画面にしないこと。
//
//   ★仕様書は 390×844 の端末で y700 / y470 / y250 と書いています。
//     ★端末の高さで割って、★割合にしてあります。
//     ★★そうしないと、★小さい端末で羊が隠れます。
// ---------------------------------------------------------------------------

export const SHEET_SNAPS = Object.freeze([
  // ★開いた直後。★羊が全部見えます。
  { key: "peek", topPct: 83, label: "少しだけ" },
  // ★★ふだんの高さ。★羊の顔と胸が見えるので、★着替えた変化が分かります。
  { key: "half", topPct: 56, label: "半分" },
  // ★「ならべる」を押したとき。
  { key: "full", topPct: 30, label: "全部" }
]);

/** ★はじめの高さ。★仕様書は「半分」を既定にせよ、と書いています。 */
export const SHEET_DEFAULT = "half";

export function snapByKey(key) {
  return SHEET_SNAPS.find((s) => s.key === key) || SHEET_SNAPS[1];
}

/**
 * ★指で動かしたあと、★いちばん近い段に吸い付かせます。
 *
 *   ★topPct は、★画面の上からの割合です。
 *   ★★途中で止めないこと。★中途半端な高さは、★次に開いたとき戻せません。
 */
export function nearestSnap(topPct) {
  let best = SHEET_SNAPS[0];
  let bestD = Infinity;
  for (const s of SHEET_SNAPS) {
    const d = Math.abs(s.topPct - topPct);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// ② コーデ（★仕様書 §6）
//
//   ★★「166点を毎回探させないでください。★探すのではなく、呼び出させます。」
//
//   ★上限は20です。
//   ★★いっぱいのとき、★古いものから黙って消さないこと。
//     ★坂本さんの決め（2026-09-06）：★「どれかを消してください」と伝えます。
//     ★この企画の決まり（★受け取ったものは取り上げない）と、同じ向きです。
// ---------------------------------------------------------------------------

export const OUTFIT_LIMIT = 20;

/** ★いっぱいのときの言い方。★画面に書き写さないこと。 */
export const OUTFIT_FULL_MESSAGE = "いっぱいです。どれかを消してください。";

/** ★名前の長さ。★長い名前は、一覧で読めなくなります。 */
export const OUTFIT_LABEL_MAX = 20;

/**
 * ★保存するのは、★この置き場所だけです。
 *
 *   ★★知らない鍵を、★そのまま持たないこと。
 *     ★あとで着せかえの作りが変わったとき、★意味の分からない値が残ります。
 */
export const OUTFIT_SLOTS = Object.freeze([
  "garment", "neck", "shoes", "hat", "prop", "propSide"
]);

/** ★いま着ているものから、★保存する形だけを取り出します。 */
export function wornForSave(wearing) {
  const out = {};
  for (const k of OUTFIT_SLOTS) {
    const v = wearing && wearing[k];
    if (typeof v === "string" && v) out[k] = v;
  }
  return out;
}

/** ★何も着ていないか。★空のコーデは、保存しても意味がありません。 */
export function isEmptyWorn(worn) {
  return Object.keys(wornForSave(worn)).filter((k) => k !== "propSide").length === 0;
}

/**
 * ★コーデを1つ作ります。
 *
 *   ★id と now は、★呼ぶ側が渡します。
 *   ★★ここで時計と乱数を引かないこと。★試験で確かめられなくなります。
 */
export function makeOutfit({ id, label, worn, now }) {
  const name = String(label == null ? "" : label).trim().slice(0, OUTFIT_LABEL_MAX);
  return {
    id: String(id),
    label: name,
    worn: wornForSave(worn),
    createdAt: now
  };
}

/**
 * ★一覧に足します。
 *
 *   ★★返すのは { ok, list, message } です。
 *     ★入らなかったときも、★list はそのまま返します（★消しません）。
 */
export function addOutfit(list, outfit) {
  const cur = Array.isArray(list) ? list : [];
  if (cur.length >= OUTFIT_LIMIT) {
    // ★★古いものを、黙って落とさないこと。★取り上げになります。
    return { ok: false, list: cur, message: OUTFIT_FULL_MESSAGE };
  }
  if (isEmptyWorn(outfit && outfit.worn)) {
    return { ok: false, list: cur, message: "何も着ていません。" };
  }
  return { ok: true, list: [...cur, outfit], message: null };
}

/** ★1つ消します。★本人が選んだものだけです。 */
export function removeOutfit(list, id) {
  const cur = Array.isArray(list) ? list : [];
  return cur.filter((o) => o && o.id !== id);
}

/** ★あと何着、保存できるか。 */
export function outfitsLeft(list) {
  const n = Array.isArray(list) ? list.length : 0;
  return Math.max(0, OUTFIT_LIMIT - n);
}

/** ★いっぱいか。 */
export function outfitsFull(list) {
  return outfitsLeft(list) === 0;
}

/**
 * ★保存したコーデを、★着ている形に戻します。
 *
 *   ★★いま着ているものを、★丸ごと置きかえます。
 *     ★混ぜると、★前のコーデの帽子が残る、といったことが起きます。
 */
export function outfitToWearing(outfit) {
  return wornForSave(outfit && outfit.worn);
}
