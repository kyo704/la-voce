// ============================================================================
// ★「毎日、聞いてほしいこと」（★見本 A10 ／ 2026-09-11）
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html:1281
//            docs/design/pack-final/screens/A10-歯車もっと.html:102
//            docs/design/pack-final/functions.md:251
//
//   ★★見本の 言葉（★そのまま）
//     「★記録の 画面に 出す ものを 選べます。★5つまで。」
//     「★中核の 5つを 外しても かまいません
//       （★分析に 使うのは 5つですが、強制しません）」
//     「★足りない項目を 責めません。★『あと◯項目』を 出しません」
//
//   ★★枠8「記録する項目（畳む・戻す）」とは、★別の ものです。
//     ★調べました（docs/reports/2026-09-11-毎日聞いてほしいことの調査.md）。
//     ★★向きが 逆です ── ★あちらは 減らす、★こちらは 選ぶ。
//     ★★単位も ちがいます ── ★あちらは まとまり、★こちらは 1つずつ。
//     ★★どちらも 残します。★置き換えでは ありません。
//
//   ★★「足せるもの」は 6つです（★2026-09-11・坂本さんの お決め）。
//     ★見本には 8つ ありますが、★「肩の こわばり」「鼻の つまり」の 2つは
//     ★いまの 記録に ありません。★見送り、★今後の 課題に 残しました
//     （docs/reports/2026-09-11-実装の順番.md §5）。
//     ★★無い ものを 選ばせては いけません。★選んでも 出ないからです。
//
//   ★★端末ごとに 覚えます。★サーバに 送りません。
//     ★「文字の 大きさ」「どちらとして 見るか」と 同じ 決めです。
//     ★★これは 見え方の 選びです。★記録の 中身では ありません。
//
//   ★見張り components/tests/daily-ask.test.js
// ============================================================================

/** ★覚え場所の 名前。 */
export const DAILY_ASK_KEY = "woolsong-daily-ask";

/** ★いくつまで 選べるか（★見本「5つまで」）。 */
export const DAILY_ASK_MAX = 5;

/**
 * ★選べる もの ぜんぶ。
 *
 *   key   … 記録の 欄の 名前（★entry の 中の 名前）
 *   label … 見本の 文字。★1文字も 変えないこと
 *   core  … 見本の 既定の 5つ
 */
/**
 * ★選べる もの ぜんぶ。
 *
 *   key   … 記録の 欄の 名前（★entry の 中の 名前）
 *   label … 見本の 文字。★1文字も 変えないこと
 *   core  … 見本の 既定の 5つ
 *   fold  … その 欄が ある 折りたたみ（★lib/recordV2.js の RECORD_FOLDS の 鍵）
 *
 *   ★★中核の 5つは、★記録の いちばん上で そのまま 書けます（fold なし）。
 *   ★★あとの 6つは、★その 欄の ある 折りたたみを 開く 道に します。
 *     ★★入れる 口を もう1つ 作りません。★同じ ものが 2か所に なります。
 *     ★「毎日 聞く」＝「毎日 目に 入る」です。★書く 場所は 1つの ままです。
 */
export const DAILY_ASK_ITEMS_DOC = true;

export const DAILY_ASK_ITEMS = Object.freeze([
  // ---- 見本の 既定（★中核の 5つ） ----
  { key: "throatCondition", label: "のどの 調子", core: true },
  { key: "voiceQuality", label: "声の 出来", core: true },
  { key: "sleepHours", label: "昨夜の 睡眠", core: true },
  { key: "morningEdema", label: "起きたときの むくみ", core: true },
  { key: "nonPerformanceSpeechMinutes", label: "声を使った 時間", core: true },
  // ---- 見本の「足せるもの」（★いまの 記録に ある 6つ） ----
  { key: "dinnerToBed", label: "食べ終えてから 寝るまで", core: false, fold: "meal" },
  { key: "humidity", label: "部屋の しめり", core: false, fold: "body" },
  { key: "exercise", label: "運動", core: false, fold: "body" },
  { key: "waterIntake", label: "水を 飲んだ量", core: false, fold: "meal" },
  { key: "medication", label: "薬", core: false, fold: "body" },
  { key: "cycle", label: "生理", core: false, fold: "body" }
]);

const KEYS = DAILY_ASK_ITEMS.map((x) => x.key);

/** ★既定の 5つ（★見本の 並びの まま）。 */
export const DAILY_ASK_DEFAULT = Object.freeze(
  DAILY_ASK_ITEMS.filter((x) => x.core).map((x) => x.key)
);

export function askItem(key) {
  return DAILY_ASK_ITEMS.find((x) => x.key === key) || null;
}

/**
 * ★知らない 値・多すぎる 値を、★そろえます。
 *
 *   ★★知らない 名前は 落とします。★同じ ものは 1つに します。
 *   ★★5つを 超えたら、★はじめの 5つだけ 残します。
 *   ★★0でも かまいません。★「中核の 5つを 外しても かまいません」。
 */
export function normalizeAsk(list) {
  if (!Array.isArray(list)) return [...DAILY_ASK_DEFAULT];
  const out = [];
  list.forEach((k) => {
    if (KEYS.includes(k) && !out.includes(k) && out.length < DAILY_ASK_MAX) out.push(k);
  });
  return out;
}

/** ★もう 足せるか。 */
export function canAdd(list) {
  return normalizeAsk(list).length < DAILY_ASK_MAX;
}

/** ★足す。★入らなければ、★そのまま 返します（★黙って 落としません）。 */
export function addAsk(list, key) {
  const cur = normalizeAsk(list);
  if (!KEYS.includes(key) || cur.includes(key) || cur.length >= DAILY_ASK_MAX) return cur;
  return [...cur, key];
}

/** ★外す。 */
export function removeAsk(list, key) {
  return normalizeAsk(list).filter((k) => k !== key);
}

/** ★まだ 足せる もの（★選んでいない もの）。 */
export function restOf(list) {
  const cur = normalizeAsk(list);
  return DAILY_ASK_ITEMS.filter((x) => !cur.includes(x.key));
}

/**
 * ★その 欄を、★きょうの 記録の 画面に 出すか。
 *
 *   ★★選んでいない ものも、★記録の 画面の 下の 欄には あります。
 *     ★ここで 決めるのは「★毎日 聞く 5つ」だけです。
 *     ★★書けなく なる ものは、★1つも ありません。
 */
export function isAsked(list, key) {
  return normalizeAsk(list).includes(key);
}

/** ★端末から 読みます。★読めなくても 落ちません。 */
export function readAsk() {
  if (typeof window === "undefined") return [...DAILY_ASK_DEFAULT];
  try {
    const raw = window.localStorage.getItem(DAILY_ASK_KEY);
    if (raw == null) return [...DAILY_ASK_DEFAULT];
    return normalizeAsk(JSON.parse(raw));
  } catch (e) {
    // ★★壊れていても、★既定に 戻すだけです。★落ちません。
    return [...DAILY_ASK_DEFAULT];
  }
}

/** ★端末に 覚えます。★覚えられなくても 落ちません。 */
export function writeAsk(list) {
  const v = normalizeAsk(list);
  if (typeof window === "undefined") return v;
  try {
    window.localStorage.setItem(DAILY_ASK_KEY, JSON.stringify(v));
  } catch (e) {
    // ★覚えられなくても、★その場では 効いています。
  }
  return v;
}
