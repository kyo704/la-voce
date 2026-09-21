// ============================================================================
// ★こまったことが ありました（★通報）── ★決めごと 1か所
//   ★出どころ 見本 `SC['こまったこと']`／★裁定 その94 §6／★裁定 その121 Q2・その125
//
//   ★★★字は ここ だけ に 置きます。★画面に 書き写しません。
//     ★★2か所に 置くと、★片方だけ 直る 日が 来ます。
//
//   ★★★通報は「切る」とは 別 です（★§5 separation_from_report）。
//     ★★切った 後でも 通報できます。★切ったら 通報できない、に しません。
//
//   ★見張り components/tests/matching-report-copy.test.js
// ============================================================================
import { tx } from "@/lib/t";

/** ★題（★見本の `h2`）。 */
export const HEAD = tx("こまったことが ありました");

/**
 * ★いちばん 上の 断り（★見本の `.warn`）。
 *
 *   ★★★「お名前は、相手に お伝えしません」を **先頭に** 置きます（★裁定 その121 Q2）。
 *     ★★これが 無いと、★言い出せません。
 */
export const TOP_LINES = Object.freeze([
  tx("お知らせいただくと、その方の「さがす」は すぐに 止まります。"),
  tx("そのあと、こちらで 拝見します。"),
  tx("お名前は、相手に お伝えしません。")
]);
/** ★上の 断りの うち、★太くする 1行。 */
export const TOP_BOLD = tx("お名前は、相手に お伝えしません。");

/** ★節の 題。 */
export const REASON_HEAD = tx("どんなことでしたか");
export const DETAIL_HEAD = tx("よろしければ、もう少し");
export const DETAIL_HINT = tx("書かなくても かまいません");
export const SUBMIT = tx("お知らせする");

/**
 * ★7つ。
 *
 *   ★★`key` は 台帳の `matching_reports.reason` と 同じ 名 です。
 *     ★★台帳の 縛り（check）が、★この 7つ 以外を 受け取りません。
 *     ★★★足す ときは `supabase/migration_report_reason_chosaku.sql` の 形で、
 *       ★★台帳の ほうも 同じ日に 足して ください。★片方だけ だと 出せません。
 *
 *   ★★★`chosakuken` は 2026-09-21 に 足しました（★裁定157 T6）。
 *     ★★公開ページに 本番の 録画（YouTube の URL）を 埋められる ように します。
 *     ★★権利者から 申し立てが あった とき、★受け取る 口が 要ります。
 *     ★★口が 無いと、★申し立ては 別の 道（メール・法的手続き）で 来ます。
 *   ★★★「そのほか」は いちばん 下の まま です。
 *     ★★足した ものを 下に 置くと、★「そのほか」より 後ろに なります。
 *     ★★選ぶ 方は「そのほか」で 一度 止まります。★その前に 置きます。
 */
export const REASONS = Object.freeze([
  { key: "shitsukoku", label: tx("しつこく 連絡が 来る") },
  { key: "kankei_nai_hanashi", label: tx("演奏と 関係のない 話を される") },
  { key: "hoka_de_renraku", label: tx("ほかの ところで 連絡してくる") },
  { key: "okane", label: tx("お金の ことで こまっている") },
  { key: "kowai", label: tx("こわい 思いを した") },
  { key: "chosakuken", label: tx("著作権・実演家の 権利") },
  { key: "sonohoka", label: tx("そのほか") }
]);

/** ★下の 断り（★見本の `.note`）。★減らしません。 */
export const NOTES = Object.freeze([
  tx("お知らせいただいた あと、その方から あなたは 見えなくなります。"),
  tx("やりとりは、こちらで 拝見することが あります。"),
  tx("あなたの 記録・ノート・ひつじは、この件で 変わりません。")
]);
export const NOTES_BOLD = tx("その方から あなたは 見えなくなります。");

/**
 * ★止まった 方に お見せする 字（★裁定 その125・2026-09-21 確定）。
 *
 *   ★★★わけを 書きません。
 *     ★★「しつこく 連絡した 件で」と 書くと、★相手が 絞れます。
 *     ★★通報した 方が 誰かを、★推し量れる ように しません。
 *   ★★★「お返事を いただく 必要も ありません」を 入れます。
 *     ★★弁明の 場を 作ると、★そこから 通報した 方へ 連絡が 行く 道が できます。
 */
export const SUSPENDED_NOTICE = Object.freeze([
  tx("あなたの「さがす」を、いったん 止めました。"),
  tx("お知らせを いただきました。"),
  tx("こちらで 拝見します。"),
  tx("誰から、どんな お知らせかは お伝えできません。"),
  tx("お返事を いただく 必要も ありません。"),
  tx("記録・ノート・ひつじは、そのままです。"),
  tx("この件で 何も 変わりません。")
]);

/** ★出せるか。★わけを 1つ 選んで いれば 出せます（★もう少し は 任意）。 */
export function canSubmit(reason) {
  return REASONS.some((r) => r.key === reason);
}

/**
 * ★台帳に 渡す 形。
 *
 *   ★★★`matching_cuts` の 行は **作りません**。★台帳の 引き金が 作ります
 *     （★`matching_report_makes_cut`・裁定 その125）。
 *     ★★画面が 作ると、★呼び忘れた 道から 漏れます。
 */
export function toRow({ reporterUserId, targetUserId, orgId, reason, detail }) {
  return {
    reporter_user_id: reporterUserId,
    target_user_id: targetUserId,
    org_id: orgId,
    reason,
    // ★空の 字は 入れません。★`null` に します。
    detail: String(detail || "").trim() || null
  };
}
