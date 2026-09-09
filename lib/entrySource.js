// ============================================================================
// 「あとから書いた」印 ── その記録は、いつ 書かれたか（2026-09-09・査読 §7）
//
//   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §7
//     「★表示には 出す（★小さく「あとから書いた」）
//      ★★Eの判定からは、★既定で 外す
//        （★設定で「含める」も 選べる。ただし 既定は 外す）」
//   ★坂本さんのお決め（2026-09-09）★境目は「翌日23:59まで」
//
//   ★★なぜ 外すのか（★§7）
//     ★★思い出しの 偏りが あるからです。
//     ★あとから 書くとき、★人は「何かあった日」を よく 覚えています。
//     ★★だから、★あとから書いた日は、★悪い日に 寄りやすい。
//     ★それを 判定に 混ぜると、★偶然が 意味に 見えます。
//
//   ★★見えなくは しません（★§7「表示には 出す」）。
//     ★見本⑫の 凡例：★● 書いた日　★○ あとから書いた日　★--- まんなか
//     ★「○は あとから書いた日です。★目では見えますが、★判定には 入れていません。」
//     ★★消すのでは なく、★区別します。★書いたものを 取り上げません。
//
//   ★★印は、★行が できる ときだけ 入ります（★データベースの 引き金）。
//     ★★あとから 直しても、★印は 変わりません。
//       ★変わる作りだと、★直すたびに 判定から 外れていきます。
//     ★★だから、★画面から source を 送りません。★ここでも 作りません。
//
//   ★見張り components/tests/entry-source.test.js
// ============================================================================

/** ★境目。★その日から 数えて、★翌日の 終わりまで。 */
export const LIVE_WITHIN_DAYS = 1;

/**
 * ★印の 3つ。
 *
 *   ★live　 … ★その日〜翌日23:59 に 書いた
 *   ★later　… ★それより あとに 書いた（★見本⑫の ○）
 *   ★import … ★まとめて 取り込んだもの
 *   ★null　 … ★分からない（★この列より 前の記録）
 */
export const SOURCES = Object.freeze(["live", "later", "import"]);

/** ★判定に 入れてよい 印。★既定は live だけです。 */
export const JUDGING_SOURCES = Object.freeze(["live"]);

/**
 * ★判定に 入れてよいか。
 *
 *   @param source          ★その記録の 印
 *   @param includeLater    ★設定で「含める」を 選んだか（★既定 false）
 *
 *   ★★null（分からない）は、★入れます。
 *     ★★この列より 前の記録は、★ほとんどが その日に 書かれたものです。
 *     ★外すと、★これまでの記録が まるごと 判定から 消えます。
 *     ★★「分からない」を「あとから書いた」と 決めつけません。
 *   ★★import は、★「含める」を 選んでも 入れません。
 *     ★1年ぶんを まとめて 入れたものは、★試すための ものだからです（★§7）。
 */
export function countsForJudging(source, includeLater = false) {
  if (source == null) return true;
  if (source === "import") return false;
  if (source === "live") return true;
  if (source === "later") return includeLater;
  return true;
}

/** ★画面に、★○（あとから書いた）を 出すか。 */
export function isLaterWritten(source) {
  return source === "later" || source === "import";
}

/**
 * ★小さく 添える 言葉。★出さないときは null。
 *
 *   ★★責める 言葉に しないこと。★「遅い」「未入力」と 書きません。
 */
export function sourceNote(source) {
  if (source === "later") return "あとから書いた";
  if (source === "import") return "取り込んだ記録";
  return null;
}

/**
 * ★その記録は live か（★書いた時刻から 決めます）。
 *
 *   ★★これは、★確かめのための 関数です。
 *     ★★本番で 印を つけるのは データベースです（★引き金）。
 *     ★ここで つけると、★決めが 2か所に なります。
 *   ★見張りが、★データベースと 同じ境目に なっているかを 確かめます。
 *
 *   @param dateISO   ★記録した日（YYYY-MM-DD）
 *   @param writtenAt ★書いた時刻（Date または ISO の文字列）
 */
export function classify(dateISO, writtenAt) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateISO || ""))) return null;
  const w = writtenAt instanceof Date ? writtenAt : new Date(writtenAt);
  if (!w || Number.isNaN(w.getTime())) return null;
  // ★境目は、★date + 2 の 0時00分（＝ 翌日の 23:59:59 まで）。
  const y = Number(dateISO.slice(0, 4));
  const m = Number(dateISO.slice(5, 7));
  const d = Number(dateISO.slice(8, 10));
  const limit = Date.UTC(y, m - 1, d + LIVE_WITHIN_DAYS + 1);
  // ★日本時間で くらべます（★データベースも Asia/Tokyo で くらべています）。
  const jst = w.getTime() + 9 * 60 * 60 * 1000;
  return jst < limit ? "live" : "later";
}

/**
 * ★判定に 使う日だけを 残します。
 *
 *   @param entries      ★{ 日付: 記録 }
 *   @param dates        ★見ている日
 *   @param includeLater ★既定 false
 */
export function judgingDates(entries, dates, includeLater = false) {
  return (dates || []).filter((d) => {
    const e = entries && entries[d];
    if (!e) return false;
    return countsForJudging(e.source, includeLater);
  });
}
