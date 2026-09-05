// ============================================================================
// 羊の着せかえ ── ★決めごと（2026-09-05 夜・Stage 1）
//
//   出どころ docs/assets/羊-着せかえ一式-読んでください（決定版11・217点）.md
//            docs/lavoce-作業指示-羊StageAとアイテム.md（B-4・B-5）
//            docs/opus/lavoce-判断-季節の装いと、隠し方（9月4日・夜）.md
//
//   ★★絵は、★217点あります（public/sheep/items/）。
//     ★どれを、いつ、どうやって出すか ── ★その決めが、ここです。
//     ★画面で組み立て直さないこと。
//
//   ★★守ること（作業指示 D・禁止事項）
//     ✕ ポイントを、★体調に連動させない
//     ✕ 連続が途切れたときに、★しおれる・減る・催促する、を作らない
//     ✕ professions を、★買える／買えないに使わない（★並び順だけ）
//     ✕ season を、★入手の期限に使わない
//     ✕ 羊のデザインを、★変えない
// ============================================================================

// ---------------------------------------------------------------------------
// ① ★★まだ、坂本さんにしか出しません（2026-09-05 夜）
//
//   ★★門と同じ形です（lib/freeTier.js ①-2）。
//     ★環境変数に入っている方にだけ、★この機能を出します。
//     ★空なら、★誰にも出しません（★いまは、まだ出す段ではありません）。
//
//   ★Vercel → Settings → Environment Variables
//       NEXT_PUBLIC_WARDROBE_USER_IDS = <ご自身のユーザーID>
//
//   ★★公開するときは、★ここを WARDROBE_PUBLIC = true にします。
// ---------------------------------------------------------------------------
export const WARDROBE_PUBLIC = false;

export function wardrobeUserIds(env) {
  const raw = (env || {}).NEXT_PUBLIC_WARDROBE_USER_IDS;
  if (typeof raw !== "string") return [];
  return raw.split(",").map((x) => x.trim()).filter(Boolean);
}

/**
 * ★この方に、着せかえを出してよいか。
 *
 *   ★★空のときは、★誰にも出しません。
 *     ★門（freeTier）とは、★逆に倒します。
 *     ★あちらは「止めない側」が安全。★こちらは「出さない側」が安全です。
 */
export function mayUseWardrobe(userId, env) {
  if (WARDROBE_PUBLIC) return true;
  const ids = wardrobeUserIds(env);
  if (ids.length === 0) return false;
  return ids.includes(String(userId || ""));
}

// ---------------------------------------------------------------------------
// ② ★重ね順（★読んでください.md §1）
//
//   ★★この順番を、★変えないこと。
//     ★頭より前に服を描くと、★首が消えます。
//     ★帽子より前に持ち物を描くと、★顔に かぶさります。
// ---------------------------------------------------------------------------
export const LAYER_ORDER = Object.freeze([
  "body", "garment", "neck", "head", "shoes", "hat", "prop"
]);

// ★持ち物の置き場所（★左・まん中・右）。
//   ★1つだけなら R が既定。★大きいものは C（傘・蓄音機・新聞）。
export const PROP_SIDES = Object.freeze(["L", "C", "R"]);
export const PROP_SIDE_DEFAULT = "R";

// ---------------------------------------------------------------------------
// ③ ★季節（★B-5）
//
//   ★★season を、★入手の期限に使わないこと（★禁止事項）。
//     ★過ぎた季節のものも、★持っている方は、★そのまま使えます。
//     ★店に並ぶかどうかだけが、★季節で変わります。
//
//   ★区切りは、★暦のとおりにします。★9月は、秋です。
// ---------------------------------------------------------------------------
export const SEASONS = Object.freeze(["spring", "summer", "autumn", "winter"]);

export const SEASON_LABELS = Object.freeze({
  spring: "春", summer: "夏", autumn: "秋", winter: "冬"
});

export function seasonOfMonth(month) {
  const m = Number(month);
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

/** ★いまの季節。★日付は、呼ぶ側が渡します（★試せるように）。 */
export function currentSeason(dateISO) {
  const d = new Date(String(dateISO || "") + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "autumn";
  return seasonOfMonth(d.getUTCMonth() + 1);
}

// ★四季の服は、★key で見分けられます（coatSpring… coatSummer… ）。
const SEASON_KEY_HINT = Object.freeze({
  spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter"
});

export function seasonOfItem(item) {
  if (!item || item.group !== "season") return null;
  for (const s of SEASONS) {
    if (String(item.key || "").includes(SEASON_KEY_HINT[s])) return s;
  }
  return null;
}

// ---------------------------------------------------------------------------
// ④ ★店に並ぶか（★B-5）
//
//   ★四季の服は、★その季節のあいだだけ並びます。
//   ★★持っている方からは、★取り上げません（★owned は、いつでも使えます）。
// ---------------------------------------------------------------------------
export function inShopNow(item, todayISO) {
  const s = seasonOfItem(item);
  if (!s) return true;                 // ★季節のものでなければ、いつでも
  return s === currentSeason(todayISO);
}

/** ★持っているものは、★季節に関わらず、★いつでも着られます。 */
export function mayWear(item, owned) {
  if (!item) return false;
  return (owned || []).includes(item.key);
}

// ---------------------------------------------------------------------------
// ⑤ ★達成で開くもの（★B-4）
//
//   ★★お金では買えません。★記録した先で、★開きます。
//     ★「記念のもの」は、★ずっと無料です（⑫の決め）。
//
//   ★★組み合わせに、★意味を持たせること。
//     ★「初めての本番」で麦わら帽子が開いても、★つながりがありません。
// ---------------------------------------------------------------------------
//   ★★2026-09-05、★私は鍵の名前を、★作ってしまいました
//     （propBouquet_R・wearTailcoat・accGlasses・hatLaurel）。
//     ★★どれも、★実物にありません。★確かめが止めました。
//     ★_L / _C / _R は、★鍵ではなく★ファイル名の側に付きます。
//   ★★実物から取り直しました。★思いつきで書かないこと。
export const UNLOCKS = Object.freeze({
  // ★初めての本番 → ★花束。★その日を、形にして残します。
  firstPerformance: ["propBouquet"],
  // ★本番10回 → ★燕尾服。★重ねた回数に、見合う一着です。
  performances10: ["tailcoat"],
  // ★初めてのピアニッシモ → ★指揮棒。★小さな音を、支える人の道具です。
  firstPianissimo: ["propBaton"],
  // ★10種類の記録 → ★メトロノーム。★きちんと測る人の道具です。
  tenFieldKinds: ["propMetronome"],
  // ★稽古の目標を達成 → ★椿の髪かざり。★舞台の日のためのものです。
  practiceGoalDone: ["hatCamellia"]
});

/** ★開いた鍵から、★開いた品物を出します。 */
export function unlockedItemKeys(unlockedFlags) {
  const out = [];
  for (const key of Object.keys(UNLOCKS)) {
    if (unlockedFlags && unlockedFlags[key]) out.push(...UNLOCKS[key]);
  }
  return out;
}

/** ★その品物は、達成で開くものか（★お金では買えません）。 */
export function isUnlockItem(itemKey) {
  return Object.values(UNLOCKS).some((list) => list.includes(itemKey));
}

// ---------------------------------------------------------------------------
// ⑥ ★並び順（★B-2）
//
//   ★★professions は、★並び順にだけ使います。★買えなくしないこと。
//   ★いまの季節のもの → ★達成で開いたもの → ★そのほか、の順にします。
// ---------------------------------------------------------------------------
export function sortForShop(items, { todayISO, unlockedFlags } = {}) {
  const opened = new Set(unlockedItemKeys(unlockedFlags));
  const rank = (it) => {
    if (seasonOfItem(it) === currentSeason(todayISO)) return 0;
    if (opened.has(it.key)) return 1;
    return 2;
  };
  return [...(items || [])].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    return String(a.key).localeCompare(String(b.key));
  });
}
