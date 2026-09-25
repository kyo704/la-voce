// ============================================================================
// ★緊急の 連絡先 ── ★当日だけ・責任者だけ・記録が 残る（★2026-09-25・第1段・束6）
//
//   ★見本 `P_kinkyu`（★design-v51・PC・iPad 運営）。
//
//   ★★★3つの 約束（★見本の `.note`・1文字も 変えないこと）──
//     ①「子どもの 枠に あるのは 呼び名だけです。年齢・学校・写真・体調は ありません。」
//     ②「連絡先は 公演の 責任者だけ、稽古と 本番の 当日だけ 見られます。台帳でも 同じ 条件で 確かめます。」
//     ③「見た 記録は 消せません。保護者の 方にも 出ます（いつ・どの 役割の 方か だけ。名前は 出しません）。」
//
//   ★★★②の「台帳でも 同じ 条件で 確かめます」は ほんとう です
//     （★2026-09-25・本番で 確かめました）──
//     ★`koen_kid_contacts` は **決まりが 0本** で、★RLS が 入って います。
//       ★★つまり 誰も 直に 読めません。★書けません。
//     ★読む 道は `read_kid_contact(p_kid, p_reason_kind)` **1本 だけ** です ──
//       ★`koen_can_manage(koen_id)` でなければ `NOT_ALLOWED`
//       ★`todays_call` の ときは その日に `call`／`show` が 無ければ `NOT_TODAY`
//       ★★返す **前に** `koen_kid_contact_reads` へ 書きます。
//         ★★★書けなければ 返りません。★見て から 記録する のでは ありません。
//     ★書く 道は `set_kid_contact(p_kid, p_contact)` 1本 だけ です。
//
//   ★★③の「消せません」も 決まりで 守られて います ──
//     ★`koen_kid_contact_reads` に delete の 決まりが ありません。
//
//   ★★★画面が やる ことは 3つ だけ です ──
//     ① わけを 選ばせる（★3つ から）／② 呼ぶ ／③ 離れたら 忘れる。
//     ★★番号を 覚えません。★`useState` にも 置いたら 画面を 出る とき 捨てます。
// ============================================================================

/** ★台帳の 関数の 名（★字は ここ 1か所）。 */
export const READ_FN = "read_kid_contact";

/**
 * ★見る わけ（★台帳が 受け取る 3つ だけ）。
 *
 *   ★★見本は 「見る」1つ ですが、★台帳は わけを 要ります。
 *     ★★★わけを 選ばせるのは、★記録に 残す ため です ──
 *       ★あとで 保護者が「なぜ 見たか」を 学校に 尋ねられます。
 *   ★★字は 見本に ありません。★台帳の 鍵から 起こしました。
 */
export const REASONS = Object.freeze([
  { key: "todays_call", label: "きょうの 呼び出し" },
  { key: "emergency", label: "急ぎの こと" },
  { key: "guardian_request", label: "保護者の 方から 頼まれて" }
]);
export function isReason(k) {
  return REASONS.some((r) => r.key === String(k || ""));
}

/** ★題と 戻り先（★見本の `<h2>` と `bk`）。 */
export const TITLE = "緊急の 連絡先";
export const BACK_TO = "出演者";

/** ★見られない とき（★見本の `.empty`）。 */
export const NO_RIGHT_HEAD = "見られません。";
export const NO_RIGHT_SUB = "公演の 責任者だけが 見られます。";

/** ★当日で ない とき（★見本の `.empty`）。 */
export const NOT_TODAY_HEAD = "稽古と 本番の 当日だけ 見られます。";

/** ★保護者が 入れて いない とき（★見本の `.empty`）。★責めません。 */
export const NO_CONTACT_HEAD = "保護者の 方が 入れていません。";
export const NO_CONTACT_SUB = "入れるかどうかは 任意です。";

/** ★押す 前の 1行（★見本の `.usu`）。 */
export const BEFORE_LINE = "見ると、見た 記録が 残ります（だれが・いつ）。";
export const BTN_SHOW = "見る";

/** ★確かめの 字（★見本の `askShow`・1文字も 変えないこと）。 */
export const ASK_HEAD = "見ますか";
export const ASK_LINES = Object.freeze([
  "見た 記録が 残ります（だれが・いつ）。",
  "保護者の 方には、いつ・どの 役割の 方が 見たかが 出ます。",
  "急ぎの ときだけ お使いください。"
]);

/** ★出した あと（★見本）。 */
export const TEL_HEAD = "保護者の 方の 電話";
export const TEL_HIDE_LINE = "この 画面を 離れると、また 隠れます。";

/** ★見た 記録の 欄（★見本の `.h3`）。 */
export const READS_HEAD = "見た 記録";
export const READS_EMPTY = "まだ ありません";

/** ★引く 列 だけ。★見た 人の 名前は 台帳にも ありません。 */
export const COLS_READ = "id, viewer_role_at, reason_kind, viewed_at";

/**
 * ★台帳が 断った ときの 字。
 *
 *   ★★機械の 字を そのまま 出しません。★頭の 語で 分けます。
 *   ★★知らない ものは、★出まかせを 言わずに「できませんでした」と だけ。
 */
export function errorLine(message) {
  const m = String(message || "");
  if (m.includes("NOT_ALLOWED")) return NO_RIGHT_SUB;
  if (m.includes("NOT_TODAY")) return NOT_TODAY_HEAD;
  if (m.includes("REASON_REQUIRED")) return "なぜ 見るかを 選んで ください。";
  if (m.includes("NO_SUCH_KID")) return "その お子さんが 見つかりません。";
  if (m.includes("NOT_AUTHENTICATED")) return "もう一度 お入りください。";
  return "いまは 出せませんでした。";
}

/** ★下の 3行（★見本の `.note`・1文字も 変えないこと）。 */
export const NOTE_LINES = Object.freeze([
  "子どもの 枠に あるのは 呼び名だけです。年齢・学校・写真・体調は ありません。",
  "連絡先は 公演の 責任者だけ、稽古と 本番の 当日だけ 見られます。台帳でも 同じ 条件で 確かめます。",
  "見た 記録は 消せません。保護者の 方にも 出ます（いつ・どの 役割の 方か だけ。名前は 出しません）。"
]);
