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
// ★★J06「まだ 見えていないもの」── ★2026-09-11 に、まるごと 消しました
//
//   ★出どころ docs/opus/回答-とだなの数字はどこか（9月10日）.md §3-2・§3-3
//     「★私の 見本は、★『まだ』を 薄く 並べていました。★これも 直しました」
//     「★理由1　★枠が あれば、★数えられます。★出さないのと 同じに なりません
//       ★理由2　★『まだ』を 見せるのは、★欲しがらせる 装置です → 催促の 一種
//       ★理由3　★名前を 出すのは ★中身を 出すことです」
//   ＋ 坂本さんの お決め（★2026-09-11）
//     「『置ける点数』、『まだ』の 枠、これらは、今後も、実装しないでください。
//       進捗バーの 一種として、禁止事項に 該当します」
//
//   ★★消したのは 3つです。
//     ・UNSEEN_TILES　… 8つの 伏せ札
//     ・unseenKeys()　… まだ 手に入れていない 鍵を 数える
//     ・UNSEEN_HINTS　… 手に入る きっかけ 3行
//   ★★品も 台帳も、★1件も 触っていません。
//
//   ★★代わりに 出すのは、★§3-3 の とおり 2行だけです。
// ---------------------------------------------------------------------------

/** ★1つも 無いときの 言葉（★§3-3・1文字も 変えないこと）。 */
export const OWNED_EMPTY_TEXT =
  "ここに 置けるものは、まだ ありません。\n記録を つづけると、いつか 届きます。";

/** ★下に 添える 1行（★§3-3・1文字も 変えないこと）。 */
export const OWNED_ONLY_NOTE =
  "持っているものだけを 並べます。まだ 手に入れていないものは、枠も 数も 出しません。";
