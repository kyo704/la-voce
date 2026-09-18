// ============================================================================
// ★確かめられた ことを、★ご本人に お伝えする 1行 ── ★決めごと 1か所
//
//   ★出どころ 裁定 その76 訂正版 ③「通知」（★2026-09-18）
//     ★「○月○日、あなたと ○○先生の やりとりが 確かめられました」
//
//   ★★★誰が 見たかは 出しません（★報復を 避ける）。
//     ★★台帳の 関数（`get_monka_read_notices`）が、★そもそも 返しません。
//     ★★ここでも、★受け取った もの しか 使いません。
//
//   ★★★言い方を 和らげません。
//     ★★「確かめられました」── ★起きた ことを そのまま 書きます。
//     ★★「念のため」「問題は ありません」を 足しません。
//       ★★足すと、★こちらの 見立てに なります。★事実だけ お伝えします。
//
//   ★見張り components/tests/monka-read-notice.test.js
// ============================================================================

// ★★日づけは 端末の 時計で 読みます（★台帳は UTC です）。
import { dayOf } from "@/lib/todayBand";

/**
 * ★1行に します。
 *
 *   ★★日づけは「○月○日」。★年は 出しません（★見本の 書き方）。
 *     ★★年を またいだ ものは 出ません ── ★下の `RECENT_DAYS` で 切ります。
 *   ★★先生の お名前が 読めない ときは、★「先生」と だけ 書きます。
 *     ★★★「名前を表示できませんでした」を ここに 出しません。
 *       ★★お伝えしたいのは **確かめられた こと** です。
 *       ★★読めなかった 断りを 混ぜると、★何の 知らせか 分からなく なります。
 *       ★★（★2026-09-18、★招かれて いる 1枚で 同じ ことが 起きて いました）
 */
export function noticeLine(viewedAt, teacherName) {
  // ★★★端末の 時計で 読みます（★2026-09-18・実機で 見つけた 形）。
  //   ★★`slice(0,10)` は、★台帳の 字を そのまま 切ります。★台帳は UTC です。
  //   ★★9月19日 朝 6時に 読まれた ことが、★「9月18日」と 出ます。
  //   ★★★日づけを 間違えた 知らせは、★知らせない より 悪い です。
  const d = dayOf(viewedAt);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const 月 = Number(d.slice(5, 7));
  const 日 = Number(d.slice(8, 10));
  const 先生 = teacherName ? `${teacherName} 先生` : "先生";
  return `${月}月${日}日、あなたと ${先生}の やりとりが 確かめられました。`;
}

/** ★見出し。★1つでも あれば 出します。 */
export const NOTICE_HEAD = "やりとりが 確かめられました";

/**
 * ★いつまで 出すか。
 *
 *   ★★★消しません。★出しつづける のも ちがいます。
 *     ★★古い ものが 積もると、★新しい ものが 埋もれます。
 *   ★★90日 ── ★連絡が 画面から 消える のと 同じ 長さ に します
 *     （★`lib/renraku.js` の `HIDE_AFTER_DAYS`）。
 *     ★★★数を 書き写しません。★あちらから 取ります。
 *       ★★片方だけ 変わる ことを 起こさせません。
 */
// ★★★`"./renraku.js"` では なく `"@/lib/renraku"` に します。
//   ★★見張りは この 束を `data:` で 読みます。★`data:` からは となりの 道が 解けません。
//   ★★`@/` なら、★`components/tests/_source.js` の `loadLib` が 書き換えます。
//   ★★（★2026-09-18、★`lib/opsPerms.js` で 同じ ところに 当たりました）
export { HIDE_AFTER_DAYS as RECENT_DAYS } from "@/lib/renraku";

/**
 * ★出す ぶんを 選びます。
 *
 *   ★★時計を 見ません。★今日を 渡して もらいます（★`lib/renraku.js` と 同じ 形）。
 *   ★★新しい 順に します。★いちばん 新しい ものが 上 です。
 */
export function visibleNotices(rows, todayISO, recentDays) {
  const 今日 = String(todayISO || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(今日)) return [];
  const 端 = Date.UTC(Number(今日.slice(0, 4)), Number(今日.slice(5, 7)) - 1,
    Number(今日.slice(8, 10))) - (recentDays * 86400000);
  return (rows || [])
    .filter((r) => {
      const d = dayOf(r && r.viewed_at);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
      return Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1,
        Number(d.slice(8, 10))) >= 端;
    })
    .sort((a, b) => (String(a.viewed_at) < String(b.viewed_at) ? 1 : -1))
    .map((r) => noticeLine(r.viewed_at, r.teacher_name))
    .filter(Boolean);
}
