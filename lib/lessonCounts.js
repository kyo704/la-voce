// ============================================================================
// レッスンを何回やったかを数える（2026-09-02）
//
//   ★出どころ：docs/lavoce-判断のまとめ-20260902.md §1
//     この裁定は会話で伝えられたもので、仕様書はありません。
//
//   ★数えるのは回数だけです。金額は1円も扱いません。
//     単価も、合計も、ここでは持ちません。作らないでください。
//
//   ★null は「まだ答えていない」です。「実施しなかった」ではありません。
//     だから held にも notHeld にも★数えません。別に数えます。
//
//   ★未回答の数を、必ず一緒に返します。
//     「今月3回」とだけ出すと、3回で全部なのか、10件のうち3件しか
//     答えていないのかが★分かりません。
//     表示ゲートで守っている「分からないことを、分かったように見せない」
//     と同じ線です（lib/displayGates.js）。
// ============================================================================

/** その月に入るか。★scheduled_at は ISO の文字列。 */
function inMonth(scheduledAt, year, month) {
  if (!scheduledAt) return false;
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

/**
 * 月ごとの回数。
 *
 * @param {Array} lessons  lessons の行（scheduled_at と held を持つ）
 * @param {{year:number, month:number}} when  month は 1〜12
 * @returns {{held:number, notHeld:number, unanswered:number, total:number}}
 *
 * ★held / notHeld / unanswered を足すと total になります。
 *   どれかに寄せて丸めないこと。
 */
export function countHeldLessons(lessons, { year, month }) {
  const rows = (lessons || []).filter((l) => inMonth(l && l.scheduled_at, year, month));
  let held = 0, notHeld = 0, unanswered = 0;
  rows.forEach((l) => {
    if (l.held === true) held += 1;
    else if (l.held === false) notHeld += 1;
    else unanswered += 1;          // ★null も undefined も、ここ
  });
  return { held, notHeld, unanswered, total: rows.length };
}

/**
 * 画面に出す1行。
 *
 * ★未回答が0のときだけ、かっこを出しません。
 * ★「0回」も、そのまま出します。隠すと「まだ数えていない」に見えます。
 */
export function heldCountLine(counts) {
  if (!counts) return "";
  const base = `実施 ${counts.held}回`;
  return counts.unanswered > 0 ? `${base}（未回答 ${counts.unanswered}件）` : base;
}

/**
 * ★作らないもの（ここに足さないこと）
 *
 *   ・金額、単価、合計、月謝の計算
 *     → 数えるところと、お金を扱うところを、同じ場所に置かないこと。
 *   ・欠席の理由
 *     → 要配慮個人情報。docs/lavoce-教室運営の範囲とカレンダー書き出し.md §4-3
 *   ・ほかの生徒との比較、平均、順位
 *     → 憲章 §10。恒久的に作りません。
 */
export const NEVER_IN_LESSON_COUNTS = ["金額", "単価", "合計", "月謝", "欠席理由", "平均", "順位"];
