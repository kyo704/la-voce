// ============================================================================
// 静かにする期間 ── 本番のまわりでは、羊が呼びに来ない（2026-09-09）
//
//   ★出どころ 坂本さんのご指示（2026-09-09）。Opus の決定文書。
//     「①「静かにする期間」（本番の3日前〜翌々日）、羊が、呼びに来ない
//       ように。これは、約束を書く前に、必ず、入れてください。」
//
//   ★★なぜ 先に 入れるのか
//     ★「毎日 呼びに行きます」と 約束してから 例外を 作ると、
//       ★その例外は「約束を 守れなかった日」に なります。
//     ★★先に 入れておけば、★はじめから そういう 決まりです。
//     ★だから、★約束の 文（規約・案内・おしらせ）より 先に 入れます。
//
//   ★★何を 止めるのか ── 「こちらから 呼びに行く」道だけです。
//     ★★止めるもの　　★LINE の おたより、★おしらせ、★こちらから出す 催促。
//     ★★止めないもの　★ご本人が 開いたときに 出るもの。
//       ★記録も、★ふりかえるも、★羊の部屋も、★そのままです。
//       ★★「静かにする」は、★閉じることでは ありません。
//         ★閉じると、★いちばん書きたい日に 書けなくなります。
//
//   ★★期間 ── 本番の 3日前 から 翌々日 まで（★6日間 ＋ 本番の日 ＝ 計6日）。
//     ★-3, -2, -1, 0, +1, +2 の 6日です。
//     ★本番が 2つ 近ければ、★どちらかに 入っていれば 静かです。
//
//   ★★数えません。「静かな日が ◯日あります」と 出しません。
//     ★カウントダウンを 出さない、という 決めと 同じです。
//
//   ★見張り components/tests/quiet-days.test.js
// ============================================================================

/** ★本番の 何日前から 静かにするか。 */
export const QUIET_BEFORE_DAYS = 3;

/** ★本番の 何日後まで 静かにするか（★翌々日 ＝ 2）。 */
export const QUIET_AFTER_DAYS = 2;

/**
 * ★ISO の 日付の 差（日）。★b − a。
 *
 *   ★★UTC で 組み立てます。★端末の 時差で ずれないためです。
 *   ★どちらかが 日付でなければ null。
 */
export function daysBetween(a, b) {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(String(a || "")) || !re.test(String(b || ""))) return null;
  const ta = Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)));
  const tb = Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10)));
  return Math.round((tb - ta) / 86400000);
}

/**
 * ★その日は、★静かにする日か。
 *
 *   @param dateISO         ★見ている日
 *   @param performanceDays ★本番の日の 並び（["2026-09-14", ...]）
 *
 *   ★★本番が 1つも 無ければ false。★静かにしません。
 *   ★★知らない形の 日付は、★黙って 飛ばします。★落ちません。
 *     ★おたよりの 道で 落ちると、★誰にも 届かなく なります。
 */
export function isQuietDay(dateISO, performanceDays) {
  if (!Array.isArray(performanceDays) || performanceDays.length === 0) return false;
  return performanceDays.some((p) => {
    const d = daysBetween(p, dateISO);
    if (d == null) return false;
    return d >= -QUIET_BEFORE_DAYS && d <= QUIET_AFTER_DAYS;
  });
}

/**
 * ★こちらから 呼びに行ってよいか。
 *
 *   ★★この 1つだけを 見て 決めること。★呼ぶ道が 増えても、★ここを 通します。
 *   ★★いまは LINE の おたよりだけですが、★これから 増えます。
 *     ★増えたときに、★片方だけ 静かにならない ように します。
 */
export function mayCall(dateISO, performanceDays) {
  return !isQuietDay(dateISO, performanceDays);
}
