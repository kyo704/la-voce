// ============================================================================
// 手に入れた日の台帳 ── J05「もっているもの」の、決めごと 1か所
//
//   ★出どころ docs/design/pack-final/screens/J05-台帳.txt
//            docs/design/pack-final/screens/J06-まだ見えていないもの.txt
//            supabase/2026-09-11-手に入れた日の台帳.sql
//
//   ★★この一枚が 持つ 決めは、3つだけです。
//     ① 表の 名前と、入れてよい 値
//     ② 1行を、画面の 1行の 言葉に する 直し方
//     ③ 日が 残っていない ときに、何と 出すか
//
//   ★★この一枚は「何を 持っているか」を 決めません。
//     それは character_inventory と computeUnlocked() が 決めます。
//     ★同じ ことを 2か所が 言わない ように します。
//
//   ★★台帳は 足すだけです。
//     書き換えも 消しもしません（★SQL の §3 で 権限ごと ありません）。
//     だから この一枚にも、直す 関数を 置きません。
// ============================================================================

import { todayJST } from "@/lib/systemAlert";
// ★★日本時間の きょう。★systemAlert から 借ります。
//   ★同じ +9時間を 4か所目に 書かない ためです。
//   ★★置き場所としては 収まりが よく ありません。
//     日付の 一枚を 作るときに、まとめて 引っ越します。

/** ★表の 名前。★文字列を 散らかさない ため、ここから 引きます。 */
export const LEDGER_TABLE = "item_acquisitions";

/**
 * ★どの 道で 手に入ったか。
 *
 *   ★SQL の check と、★同じ 3つで あること。
 *   ★★増やすときは、★先に SQL の check を 広げてください。
 *     ★こちらだけ 増やすと、★書き込みが 落ちます。
 */
export const ACQUIRED_BY = Object.freeze({
  SHOP: "shop",       // ★点で 買った
  GIFT: "gift",       // ★贈りもの（箱②）
  UNLOCK: "unlock"    // ★条件が 開いた
});

export const ACQUIRED_BY_VALUES = Object.freeze(Object.values(ACQUIRED_BY));

/**
 * ★そのときの 数の、種類。
 *
 *   record_days  … 記録した 日（見本の「記録 60日」）
 *   performances … 本番の 回数（見本の「本番 3回」）
 */
export const COUNT_KIND = Object.freeze({
  RECORD_DAYS: "record_days",
  PERFORMANCES: "performances"
});

export const COUNT_KIND_VALUES = Object.freeze(Object.values(COUNT_KIND));

/** ★数の 種類ごとの、画面の 言葉。 */
const COUNT_WORD = Object.freeze({
  record_days: (n) => `記録 ${n}日`,
  performances: (n) => `本番 ${n}回`
});

/**
 * ★台帳に 入れる 1行を 組み立てます。
 *
 *   ★★画面から 受け取った 値を、そのまま 入れません。
 *     日も 数も、★サーバが 出したものだけを 通します。
 *
 * @param {object} a
 * @param {string} a.userId
 * @param {string} a.itemKey
 * @param {string} a.acquiredBy   ACQUIRED_BY の どれか
 * @param {string} [a.countKind]  COUNT_KIND の どれか
 * @param {number} [a.countValue] 0 以上
 * @param {Date}   [a.now]        ★試験から 時刻を 渡すため
 * @returns {object|null}  ★入れてよい 形でなければ null（★書きません）
 */
export function buildAcquisition({ userId, itemKey, acquiredBy, countKind, countValue, now } = {}) {
  if (!userId || typeof userId !== "string") return null;
  if (!itemKey || typeof itemKey !== "string") return null;
  if (!ACQUIRED_BY_VALUES.includes(acquiredBy)) return null;

  const row = {
    user_id: userId,
    item_key: itemKey,
    acquired_on: todayJST(now),
    acquired_by: acquiredBy,
    count_kind: null,
    count_value: null
  };

  // ★数は、★揃っているときだけ 入れます。
  //   ★★片方だけ 入れません。「60」だけ 残っても、読めません。
  const kindOk = COUNT_KIND_VALUES.includes(countKind);
  const valueOk = Number.isInteger(countValue) && countValue >= 0;
  if (kindOk && valueOk) {
    row.count_kind = countKind;
    row.count_value = countValue;
  }
  return row;
}

/** ★日が 残っていない ときの 言葉（★見本には 無い 行です・§5）。 */
export const NO_DATE_TEXT = "いつ 手に入れたかは、残っていません";

/**
 * ★台帳の 1行を、見本の 右の 言葉に します。
 *   「9月8日　記録 60日」
 *
 *   ★★年は 出しません（★見本のとおり）。
 *   ★★数が 無い 行は、日だけ 出します。
 */
export function ledgerLine(row) {
  if (!row || !row.acquired_on) return NO_DATE_TEXT;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(row.acquired_on));
  if (!m) return NO_DATE_TEXT;
  const date = `${Number(m[2])}月${Number(m[3])}日`;
  const word = COUNT_WORD[row.count_kind];
  if (!word || !Number.isFinite(Number(row.count_value))) return date;
  return `${date}　${word(Number(row.count_value))}`;
}

/**
 * ★台帳を、新しい順に 並べます。
 *   ★同じ日なら、あとから 入った ほうが 上です。
 */
export function sortLedger(rows) {
  return [...(Array.isArray(rows) ? rows : [])].sort((a, b) => {
    const d = String(b.acquired_on || "").localeCompare(String(a.acquired_on || ""));
    if (d !== 0) return d;
    return String(b.created_at || "").localeCompare(String(a.created_at || ""));
  });
}

// ---------------------------------------------------------------------------
// J06「まだ 見えていないもの」── 手に入る きっかけ
//
//   ★見本のとおり、★3行。★数を 書きません。
//   ★★「あと◯日で 開きます」は、★2026-09-10 に 消した ものです。
//     ★ここでも 書きません。★きっかけの 種類だけを 出します。
// ---------------------------------------------------------------------------
export const UNSEEN_HINTS = Object.freeze([
  { label: "記録した 日が たまる", note: "累計" },
  { label: "本番を 記録する", note: "回数" },
  { label: "季節・行事", note: "その月だけ" }
]);

/** ★見本の 伏せ札の 数（★.gr2 が 4列 × 2段）。 */
export const UNSEEN_TILES = 8;

/**
 * ★「まだ 見えていないもの」とは 何か。★ここで 決めます。
 *
 *   ★★点で 買える ものは、★入れません。
 *     棚に 並んでいて、いつでも 見られるからです。
 *     ★「見えていない」の 意味に 合いません。
 *   ★★入れるのは、★向こうから 来る ものだけです。
 *     ・開く 品（★本番の 回数・記録の 種類・稽古の 目標）
 *     ・箱②の 品（★記録した 日が たまると、3点ずつ 選べます）
 *     ★見本の きっかけ 3行（累計・回数・その月だけ）と、そろえてあります。
 *
 *   ★★中身は 出しません。★数だけです（★J06 の 注記）。
 *   ★★「あと◯日」も 出しません（★2026-09-10 に 消した ものです）。
 *
 * @param {object} a
 *   @param {string[]} a.arrivingKeys  向こうから 来る 品の 鍵、ぜんぶ
 *   @param {string[]} a.ownedKeys     もう 手もとに ある 鍵
 * @returns {string[]}  まだ 見えていない 鍵
 */
export function unseenKeys({ arrivingKeys, ownedKeys } = {}) {
  const owned = new Set(Array.isArray(ownedKeys) ? ownedKeys : []);
  const list = Array.isArray(arrivingKeys) ? arrivingKeys : [];
  return [...new Set(list)].filter((k) => k && !owned.has(k));
}
