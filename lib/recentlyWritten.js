// ============================================================================
// 「このごろ、よく書いていること」（2026-09-07）
//
//   ★★坂本さんの決め：★「今日やるといいこと」の助言を、やめます。
//     ★枠と場所は、そのまま残します。★中身だけを入れ替えます。
//
//   ★★助言をしません。★数えて、並べるだけです。
//     ★「だから◯◯しましょう」を、★付けないこと。
//     ★出どころ 分析画面の表示規約 §7-10「図の中に解釈の文章を書き込まない」
//       ★★ここは図ではありませんが、★考え方は同じです。
//
//   ★★お薬のことは、★数えません。
//     ★medication_tags は、★先生にも共有しない11列の1つです。
//     ★ホームの目立つところに出すものではありません。
//
//   ★決めは、ここが1つだけ持ちます。★画面に数を書き写さないこと。
// ============================================================================

/** ★何日ぶんを見るか。 */
export const RECENT_DAYS = 14;

/** ★いくつまで並べるか。★多いと、読まずに飛ばされます。 */
export const TOP_N = 3;

/** ★これ以上書かれていたら、出します。★1回だけのものは「よく」ではありません。 */
export const MIN_COUNT = 2;

/**
 * ★数える対象。
 *
 *   ★★medicationTags は、★入れません（★上の理由）。
 *   ★★自由記述も、★入れません。★何が出るか分からないためです。
 */
export const COUNTED_FIELDS = Object.freeze(["dinnerTags", "mentalTags", "environmentTags"]);

/**
 * ★直近の記録から、よく書かれているものを数えます。
 *
 *   @param entries  { "YYYY-MM-DD": entry } の形
 *   @param todayISO 今日（★呼ぶ側が渡します。★ここで時計を引きません）
 *   @returns [{ label, count }] ★多い順。★無ければ空の配列。
 */
export function recentlyWritten(entries, todayISO, { days = RECENT_DAYS, topN = TOP_N } = {}) {
  if (!entries || !todayISO) return [];
  const from = shiftDate(todayISO, -(days - 1));
  const counts = new Map();
  for (const [date, entry] of Object.entries(entries)) {
    if (!entry || date < from || date > todayISO) continue;
    for (const field of COUNTED_FIELDS) {
      const list = entry[field];
      if (!Array.isArray(list)) continue;
      for (const raw of list) {
        const label = typeof raw === "string" ? raw.trim() : "";
        if (!label) continue;
        counts.set(label, (counts.get(label) || 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= MIN_COUNT)
    .sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))
    .slice(0, topN)
    .map(([label, count]) => ({ label, count }));
}

/** ★日付をずらします。★時計は引きません。 */
function shiftDate(iso, delta) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

/**
 * ★見出しの言葉。★画面に書き写さないこと。
 *
 *   ★★「よく書いていること」であって、★「よくあること」ではありません。
 *     ★書いた回数を数えているだけで、★実際に多いかどうかは分かりません。
 *     ★書かなかった日のことは、★数えようがありません。
 */
export const RECENT_TITLE = "このごろ、よく書いていること";

/** ★1つぶんの言い方。★「◯◯（5回）」。★良し悪しを言いません。 */
export function recentLine(item) {
  if (!item) return "";
  return `${item.label}（${item.count}回）`;
}
