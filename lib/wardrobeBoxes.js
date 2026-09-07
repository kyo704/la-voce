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
 * ★箱2（記録で交換）に入る品の、鍵の一覧。★70点。
 *
 *   ★出どころ docs/opus/woolsong-確定-アイテムの全体像と、箱2の作り方（9月7日・夜・訂正版）.md §3-2
 *
 *   ★★条件は1つだけです。★「全身が組めること」。
 *     ★無料の方の羊が、★裸になってはいけません。
 *     ★部位ごとに、★最低の数を決めてあります。
 *       上17／下11／羽織り9／靴6／帽子12／首元5／目元2 ＝ 62
 *       ＋ 持ちもの8（★これだけ元から入っていました） ＝ 70
 *
 *   ★★全身もの（set）は、★0点です。
 *     ★94点すべてが「記念」か「遊び」で、★日常の基本形が1つもありませんでした。
 *
 *   ★★同じ名前のものについて（★坂本さんの決め・2026-09-07）。
 *     ★麦わら帽子・ニット帽・スニーカーは、★古いお店で実際に売った品です。
 *     ★古い鍵（hatStraw / hatKnit / shoesSneakers）は、★持ち物として残します。
 *       ★すでにお持ちの方から、★取り上げません。
 *     ★★これから配るのは、★新しい鍵のほうです（hats_06 / hats_02 / shoes_01）。
 *       ★だから、★この一覧には新しい鍵だけを入れます。
 */
export const BOX2_KEYS = Object.freeze([
  // ★上 17
  "top_01", "top_06", "top_07", "top_09", "top_11", "top_12", "top_14", "top_24",
  "top_28", "top_30", "top_34", "top_35", "top_37", "top_39", "top_40", "top_47", "top_52",
  // ★下 11
  "bottom_01", "bottom_05", "bottom_08", "bottom_12", "bottom_14", "bottom_15",
  "bottom_19", "bottom_20", "bottom_21", "bottom_29", "bottom_30",
  // ★羽織り 9
  "outer_01", "outer_04", "outer_09", "outer_13", "outer_19",
  "outer_20", "outer_22", "outer_28", "outer_30",
  // ★靴 6
  "shoes_01", "shoes_03", "shoes_04", "shoes_05", "shoes_09", "shoes_11",
  // ★帽子 12（★hats_10 王冠は箱1。★売りません）
  "hats_01", "hats_02", "hats_03", "hats_04", "hats_05", "hats_06",
  "hats_07", "hats_08", "hats_09", "hats_11", "hats_12", "hats_13",
  // ★首元 5
  "neck_01", "neck_03", "neck_04", "neck_05", "neck_09",
  // ★目元 2
  "eyes_01", "eyes_02",
  // ★持ちもの 8（★元から入っていた品です）
  //
  //   ★★§3-2 の一覧には propMetronome（メトロノーム）が入っていました。
  //     ★ですが、★これは★達成で開く品です（UNLOCKS.tenFieldKinds）。
  //     ★★箱1は「買えない・交換もできない」箱です。★箱2と重ねられません。
  //       ★重ねると、★記録で交換できてしまい、★§6 ④ に反します。
  //     ★だから、★propMetronome は箱1に置いたままにしました。
  //   ★★代わりに propUmbrella（傘）を入れます。★2026-09-07。
  //     ★傘は business の持ちもので、★どの箱にも入っていませんでした。
  //     ★目録384には載っていません。★実装ずみの2点のうちの1つです。
  //     ★★ふだん使うものなので、★「ふだん着が組める」に合います。
  //   ★これで70点そろいます。★ご確認ください。
  "propScore", "propUmbrella", "propMusicBag", "propBriefcase",
  "propBottle", "propTeacup", "propChopsticks", "propFork"
]);

/**
 * ★同じ名前の、古い鍵と新しい鍵。
 *
 *   ★古いほうは、★持ち物として残ります。★取り上げません。
 *   ★配るのは、★新しいほうです。
 *   ★★お店の一覧に、★両方を並べないこと。★同じ絵が2つ出ます。
 */
export const SUPERSEDED_BY = Object.freeze({
  hatStraw: "hats_06",       // 麦わら帽子
  hatKnit: "hats_02",        // ニット帽
  shoesSneakers: "shoes_01", // スニーカー
  hatBeret: "hats_03"        // ベレー帽 → ベレー
});

/** ★その古い鍵は、★新しいものに置き換わっているか。 */
export function supersededBy(key) {
  return SUPERSEDED_BY[key] || null;
}

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
  // ★★目録に載っていない品が、★2つあります（2026-09-07 に数えました）。
  //   ★propSword（剣・opera）と ★propUmbrella（傘・business）です。
  //   ★★目録が無いからと箱3に落とすと、★剣が売り物になります。
  //     ★「舞台のものは、全部 unlock 側です。売りません」に当たります。
  //   ★だから、★実装ずみの品が自分で持っている group も見ます。
  //   ★★これは取りこぼしの受け皿です。★theme のほうが正です。
  if (KEEPSAKE_THEMES.includes(item.group)) return BOX_KEEPSAKE;
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
  dressupMonthly: "今月の装いです。この中から、ひとつ選べます。"
  // ★★"dressupDaily" を外しました（★2026-09-07）。
  //   ★1日1点えらべる形（¥980）は、★11月へ延ばすと決まりました。
  //   ★10月19日に売るのは ¥580 と ¥4,800 の2つだけです。
  //   ★★無いものの文言を、★置いておかないこと。
});

// ---------------------------------------------------------------------------
// ★箱2の配り方（★2026-09-07・坂本さんの決め）
//
//   ★★ポイントで買う形を、★箱2からやめました。
//     ★値段を付けると、★「あと何点」を数えたくなります。
//     ★数えたくなる形を、★はじめから作りません。
//
//   ★記録が30日ぶんたまるごとに、★箱2から3点をお見せして、★1つ選んでいただきます。
//   ★選ばなければ、★月末に1つ届きます。★残高は、発生しません。
//
//   ★★古いおうちの道具101点の、★ポイントの仕組みは、そのままです。
//     ★すでに貯めた方の残高を、★消さないためです。
// ---------------------------------------------------------------------------

/** ★何日ぶん記録がたまるごとに、選べるか。 */
export const BOX2_EVERY_DAYS = 30;

/** ★いちどにお見せする点数。 */
export const BOX2_CHOICES = 3;

/**
 * ★何回ぶん受け取れるか。★記録した日数から出します。
 *
 *   ★★「あと何日」を返しません。★返すと、画面に出したくなります。
 *     ★返すのは、★受け取れる回数だけです。
 */
export function box2Rounds(recordedDays) {
  const d = Number(recordedDays);
  if (!Number.isFinite(d) || d < 0) return 0;
  return Math.floor(d / BOX2_EVERY_DAYS);
}

/**
 * ★まだ受け取っていない回があるか。
 *
 * @param {number} recordedDays  記録した日数（★通算）
 * @param {number} received      すでに受け取った点数
 */
export function box2HasPending(recordedDays, received) {
  return box2Rounds(recordedDays) > (Number(received) || 0);
}

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
