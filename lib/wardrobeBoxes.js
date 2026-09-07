import { UNLOCKS } from "@/lib/sheepWardrobe";

// ============================================================================
// よそおいの、3つの箱（2026-09-07）
//
//   ★出どころ docs/opus/woolsong-裁定-219点の分け方と、追加38項目の安全性（9月7日・夜）.md
//     ★§1 の結論と、★§6 のCodeへの作業。
//
//   ★★「219点のうち何点まで無料か」という数え方を、やめました。
//     ★同じ品が「無料でも取れる／お金でも取れる」になると、
//       ★お金は「早く取る」ためのものになります。
//     ★9月7日朝の禁止事項に、まっすぐ当たります。
//       ✕ ★お金で早く進める
//
//   ★★だから、箱を3つに分けて、★重ねません。
//
//     箱1 記念　　　条件を満たした方だけ。★買えません。交換もできません
//     箱2 記録　　　記録で貯めて交換します。★お金では絶対に買えません
//     箱3 よそおい　お金で得ます。★記録では絶対に手に入りません
//
//   ★★1つの品が、どの箱かを決めるのは、★このファイル1か所です。
//     ★画面ごとに書かないこと。★2か所になると、片方だけが古くなります。
//
//   ★見張り components/tests/wardrobe-boxes.test.js
// ============================================================================

export const BOX_KEEPSAKE = 1;   // ★記念
export const BOX_RECORD = 2;     // ★記録で交換
export const BOX_DRESSUP = 3;    // ★お金

/**
 * ★箱1（記念）に入る theme。
 *
 *   ★裁定 §6 「box=1  theme が opera / stage」。
 *   ★裁定 §2 「★舞台のものは、全部 unlock 側です。売りません。」
 */
export const KEEPSAKE_THEMES = Object.freeze(["opera", "stage"]);

/**
 * ★達成で開く品は、★theme に関わらず、★必ず箱1です。
 *
 *   ★lib/sheepWardrobe.js の UNLOCKS が正です。★ここでは写しません。
 *   ★★propMetronome は theme が "work" なので、
 *     ★theme だけで数えると、★箱1から漏れます。
 *     ★漏れると、★お金で買える側に落ちます。★それは §2 の線を越えます。
 */
export function unlockKeys() {
  const out = [];
  for (const k of Object.keys(UNLOCKS)) out.push(...UNLOCKS[k]);
  return out;
}

/**
 * ★箱2（記録で交換）に入る品の、鍵の一覧。
 *
 *   ★★いまは空です。★まだ決められません。
 *
 *   ★裁定 §3 は、★部位ごとの最低数を決めています（合計70点）。
 *     top 15 ／ bottom 10 ／ outer 8 ／ shoes 6 ／ hat 12 ／
 *     neck 4 ／ hold 8 ／ eyes 2 ／ set 5
 *
 *   ★★ところが、★いま実装されている219点には、
 *     ★top が0点、★bottom が0点、★eyes が0点しかありません。
 *     ★outer も4点で、★8点に届きません。
 *
 *   ★足りない品は、★assets/wardrobe-v2 の zip（166点）の中にあります。
 *     ★目録384点のうち★実装されていない167点は、
 *     ★166点が modern、★1点が stage でした。★まさにその部分です。
 *
 *   ★★だから、★zip を開けるまで、★箱2は作れません。
 *     ★modern の基本形だけで組むと、★18点にしかなりません。
 *     ★theme を問わずに集めても、★39点です。
 *
 *   ★空のまま置きます。★推測で埋めないこと。
 *     ★埋めると、★無料の羊が、★裸か、ちぐはぐになります。
 */
export const BOX2_KEYS = Object.freeze([]);

/**
 * ★その品が、どの箱か。
 *
 * @param {object} item     実装ずみの品（docs/assets/sheep-items-index.json の1件）
 * @param {object} cat      目録の1件（docs/opus/items.json）。theme を持ちます
 * @returns {1|2|3}
 *
 *   ★順番に意味があります。
 *     ① 記念かどうかを、いちばん先に見ます。★売り物に落とさないためです。
 *     ② 次に、箱2の一覧に載っているか。
 *     ③ 残りが、箱3です。
 */
export function boxOf(item, cat) {
  if (!item) return BOX_DRESSUP;
  const key = String(item.key || "");
  if (unlockKeys().includes(key)) return BOX_KEEPSAKE;
  if (cat && KEEPSAKE_THEMES.includes(cat.theme)) return BOX_KEEPSAKE;
  if (BOX2_KEYS.includes(key)) return BOX_RECORD;
  return BOX_DRESSUP;
}

/** ★記録で交換できるか。★箱2だけです。 */
export function mayExchangeWithPoints(item, cat) {
  return boxOf(item, cat) === BOX_RECORD;
}

/** ★お金で得られるか。★箱3だけです。★箱1は、決して買えません。 */
export function mayBuyWithMoney(item, cat) {
  return boxOf(item, cat) === BOX_DRESSUP;
}

/**
 * ★配り方の言葉（裁定 §5）。
 *
 *   ★★数を、出さないこと。
 *     ★「あと13ポイント」を、★どこにも出しません（坂本さんの決め・2026-09-07）。
 *     ★残高が発生しない形にします。★選ばなければ、月末に1つ届きます。
 *
 *   ★★ここに数を混ぜないこと。★見張りが見ています。
 */
export const DELIVERY_LINES = Object.freeze({
  record: "記録がたまりました。この中から、ひとつ選べます。",
  recordAuto: "記録がたまったので、ひとつお届けしました。",
  dressupMonthly: "今月の装いです。この中から、ひとつ選べます。",
  dressupDaily: "今日の装いを、ひとつ選べます。"
});

/**
 * ★出してはいけない言い方。★見張りが、この一覧で画面を調べます。
 *
 *   ★「あと◯ポイント」「残り◯点」「あと◯着」。
 *   ★★受け取るまでの距離を、★数で見せないこと。
 *     ★届くこと自体が、★書きつづける理由を残します。
 *     ★数を見せると、★その数のほうが、理由になります。
 */
export const FORBIDDEN_COUNT_PHRASES = Object.freeze([
  "あとポイント", "残りポイント", "ポイントで受け取れます",
  "まであと", "あと何点", "残り点数"
]);
