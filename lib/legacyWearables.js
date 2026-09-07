// ============================================================================
// 古い22点を、新しい着せかえへ引き上げる（2026-09-07）
//
//   ★★坂本さんの決め（2026-09-06〜07）
//     ・古い22点（帽子・服・持ちもの）は、いずれ消します。
//     ・★先に配って、あとで消します。★取り上げではなく、増える形にします。
//     ・★character_inventory の記録は、★消しません。
//     ・★22点すべてを、新しいほうに置きかえます（★案あ-1 は採りません）。
//       ★お箸とフォークの絵が届いたので、★代わりの無い品が無くなりました。
//
//   ★★この表が、1つの決めを持ちます。
//     ★移行の SQL も、★画面も、★ここから引きます。
//     ★2か所に書くと、★片方だけ直す日が来ます。
//
//   ★★「同じもの」と「近いもの」を、分けて持ちます。
//     ★近いものは、★見た目が変わります。★そう伝える必要があります。
// ============================================================================

/**
 * ★古い鍵 → 新しい鍵。
 *
 *   same … ★同じ品です（名前も同じ）。★絵の描き方だけが変わります。
 *   near … ★近い品です。★見た目が変わります。
 */
export const LEGACY_TO_NEW = Object.freeze({
  // ---- かぶりもの ----
  hat_straw:           { to: "hatStraw",              kind: "same" },
  hat_knit:            { to: "hatKnit",               kind: "same" },
  hat_ribbon:          { to: "hatCamellia",           kind: "near" },
  hat_western:         { to: "hatUSACowboy",          kind: "same" },
  hat_crown_king:      { to: "hatTurandotCrown",      kind: "near" },
  hat_tiara_princess:  { to: "hatFlowerCrown",        kind: "near" },
  // ---- 服 ----
  // ★★マフラーは、★置き場所が「服」から「襟まき」に変わります。
  //   ★服の枠が空くので、★上に何か着られるようになります。★増える方向です。
  outfit_scarf:        { to: "scarfWine",             kind: "near" },
  outfit_overall:      { to: "wearGermanyLederhosen", kind: "near" },
  outfit_sweater:      { to: "coatWinterDuffle",      kind: "near" },
  outfit_western:      { to: "wearUSAWestern",        kind: "same" },
  outfit_kimono_male:  { to: "kimonoManNavyHaori",    kind: "same" },
  outfit_kimono_female:{ to: "kimonoRedSakura",       kind: "same" },
  outfit_tuxedo:       { to: "tuxedo",                kind: "same" },
  outfit_tailcoat:     { to: "tailcoat",              kind: "same" },
  outfit_dress:        { to: "gownWineMermaid",       kind: "near" },
  outfit_king_robe:    { to: "wearItalyCarnival",     kind: "near" },
  // ---- 持ちもの ----
  accessory_staff:     { to: "propMeijiStick",        kind: "near" },
  accessory_sword:     { to: "propTachi",             kind: "same" },
  // ★★2026-09-07 に絵が届きました。★これで代わりの無い品が無くなりました。
  accessory_chopsticks:{ to: "propChopsticks",        kind: "same" },
  accessory_fork:      { to: "propFork",              kind: "same" },
  accessory_bottle:    { to: "propBottle",            kind: "same" },
  accessory_pet_bottle:{ to: "propTeacup",            kind: "near" }
});

/** ★古い鍵の一覧。 */
export const LEGACY_KEYS = Object.freeze(Object.keys(LEGACY_TO_NEW));

/** ★その鍵は、古いほうのものか。 */
export function isLegacyWearable(key) {
  return Object.prototype.hasOwnProperty.call(LEGACY_TO_NEW, key);
}

/** ★代わりの鍵。★無ければ null。 */
export function newKeyFor(legacyKey) {
  const e = LEGACY_TO_NEW[legacyKey];
  return e ? e.to : null;
}

// ---------------------------------------------------------------------------
// ★同じ品が、新しい絵で描き直されたもの（★2026-09-07・坂本さんの決め）
//
//   ★ふだん着62点の中に、★すでにある品と同じものが4つありました。
//     ★麦わら帽子・ニット帽・スニーカー・ベレー。
//
//   ★★決めごとは2つです。
//     ① ★古い鍵は、★そのまま残します。★取り上げません。
//     ② ★新しい鍵も、★お持ちであることにします。
//        ★★同じ品を、★2回受け取らせないためです。
//        ★これから配るのは新しいほうなので、★もう持っている方に
//          ★もう一度配ると、★1回ぶん損をさせることになります。
//
//   ★お店の一覧には、★新しい鍵だけを並べます（lib/wardrobeBoxes.js）。
// ---------------------------------------------------------------------------
export const REDRAWN_AS = Object.freeze({
  hatKnit: "hats_02",        // ニット帽
  hatStraw: "hats_06",       // 麦わら帽子
  shoesSneakers: "shoes_01", // スニーカー
  hatBeret: "hats_03"        // ベレー帽 → ベレー
});

/**
 * ★持ち物の一覧に、★描き直されたぶんの新しい鍵を足します。
 *
 *   ★★元の一覧は、★変えません。★足すだけです。
 *   ★すでに新しい鍵をお持ちなら、★二重に足しません。
 *
 *   ★★scarfCheck（チェックのマフラー）と neck_01（マフラー）は、
 *     ★別の品として扱います（坂本さんの決め）。★ここには入れません。
 *
 * @param {string[]} owned  いま持っている鍵
 * @returns {string[]}      足したあとの一覧
 */
export function withRedrawnKeys(owned) {
  const list = Array.isArray(owned) ? [...owned] : [];
  const have = new Set(list);
  for (const [oldKey, newKey] of Object.entries(REDRAWN_AS)) {
    if (have.has(oldKey) && !have.has(newKey)) {
      list.push(newKey);
      have.add(newKey);
    }
  }
  return list;
}

/**
 * ★古い着せかえの状態から、★新しいほうの着せかえを組み立てます。
 *
 *   ★★equipped.hat / outfit / accessory を見て、
 *     ★equipped.wardrobe の側に置き直します。
 *   ★★古いほうは、★消しません。★そのまま残します。
 *     ★戻す必要が出たときに、★元が残っていないと戻せません。
 */
export function migrateEquipped(equipped) {
  const src = equipped || {};
  const wardrobe = { ...(src.wardrobe || {}) };
  const moved = [];
  for (const [from, slot] of [["hat", "hat"], ["outfit", null], ["accessory", "prop"]]) {
    const oldKey = src[from];
    if (!oldKey || !isLegacyWearable(oldKey)) continue;
    const to = newKeyFor(oldKey);
    if (!to) continue;
    // ★★置き場所は、★新しいほうの品が決めます。
    //   ★マフラーは「服」から「襟まき」へ動きます。
    const target = slot || slotOfNew(to);
    if (!target) continue;
    // ★★すでに新しいほうで何か着ておられたら、★上書きしません。
    //   ★ご本人が選ばれたものが、★優先です。
    if (wardrobe[target]) continue;
    wardrobe[target] = to;
    moved.push({ from: oldKey, to, slot: target, kind: LEGACY_TO_NEW[oldKey].kind });
  }
  return { wardrobe, moved };
}

// ★★新しいほうの置き場所は、★一覧が持っています。
//   ★ここに書き写さないこと。★2か所になります。
let slotIndex = null;
export function setNewSlotIndex(map) { slotIndex = map; }
export function slotOfNew(key) {
  return slotIndex ? (slotIndex[key] || null) : null;
}

/**
 * ★お知らせの文（★判断4：先に伝えます）。
 *
 *   ★★驚かせないために、★消す前に伝えます。
 *   ★お詫びではありません。★増えたことのお知らせです。
 */
export const LEGACY_NOTICE_TITLE = "着せかえが、新しくなりました";

export const LEGACY_NOTICE_BODY = [
  "これまでの帽子・服・持ちものを、新しい着せかえの中にご用意しました。",
  "すでにお持ちの扱いにしてありますので、そのままお使いいただけます。",
  "同じ品でも、絵を描き直したものがあります。見た目が変わって見えるかもしれません。",
  "これまでのものも、しばらくはそのままお使いいただけます。",
  "なくなるときは、前もってお知らせします。"
].join("\n");
