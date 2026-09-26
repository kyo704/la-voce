// ============================================================================
// ★子どもの 枠 ── ★呼び名だけ（★2026-09-25・C群 第1段・束6）
//
//   ★見本 `SC['子どもの枠']`（★design-v51・iPhone で 開く用）。
//
//   ★★★7つの 約束（★見本の `.note`・1文字も 変えないこと）──
//     ①「子どもの 枠に あるのは 呼び名だけです。年齢・学校・写真・体調は うかがいません。」
//     ②「呼び名が 見えるのは 同じ 公演の 中だけです（公開の ページ・行事の 一覧には 出ません）。」
//     ③「呼び出しと 集合・解散の 時刻は、あなたの スマホに 出ます。」
//     ④「緊急の 連絡先を 見られるのは 公演の 責任者だけ、稽古と 本番の 当日だけです。」
//     ⑤「見られると、いつ・どの 役割の 方が 見たかが ここに 出ます（見た 方の 名前は 出しません）。」
//     ⑥「子どもの 枠で 使えるのは 公演だけです。記録・ひつじ・体調・さがす は 使えません。」
//     ⑦「兄弟など、何人でも 足せます。いつでも 外せます（運営の 出欠の 記録だけ 残ります）。」
//
//   ★★①は 列で 守られて います（★2026-09-25・本番で 確かめました）──
//     ★`koen_kids` は id, koen_id, guardian_user_id, nickname, dismiss_at,
//       ★created_at, left_at。★★年齢・学校・写真・体の 列が **1つも ありません**。
//     ★★連絡先は 別の 表（`koen_kid_contacts`）です ── ★`kid_id, contact, updated_at`。
//
//   ★★④⑤は 台帳の 関数が 守って います ── `read_kid_contact(p_kid, p_reason_kind)`。
//     ★`koen_can_manage(koen_id)` でない 人は `NOT_ALLOWED`。
//     ★`todays_call` の ときは、★その日に `call`／`show` が 無いと `NOT_TODAY`。
//     ★★★返す 前に `koen_kid_contact_reads` へ 書きます ──
//       ★`viewer_role_at`（運営／主催）・`reason_kind`・`viewed_at`。
//       ★★**見た 人の 名前を 書きません**。★役割 だけ です（★⑤の とおり）。
//
//   ★★★書くのは 関数だけ です ── `set_kid_contact(p_kid, p_contact)`。
//     ★`koen_kid_contacts` に 直に 書く 道は ありません（★Opus の 確かめ・2026-09-24）。
// ============================================================================

/** ★題（★見本の `<h2>`）。 */
export const TITLE = "子どもの 枠";

/** ★台帳の 関数の 名（★字は ここ 1か所）。 */
export const SET_FN = "set_kid_contact";
export const READ_FN = "read_kid_contact";

/**
 * ★見る わけ（★台帳が 受け取る 3つ だけ）。
 *
 *   ★★`read_kid_contact` の 縛り ── `todays_call` ／ `emergency` ／ `guardian_request`。
 *   ★★知らない わけを 送ると `REASON_REQUIRED` で 落ちます。★送る 前に 止めます。
 */
export const REASONS = Object.freeze(["todays_call", "emergency", "guardian_request"]);
export function isReason(k) {
  return REASONS.includes(String(k || ""));
}

/** ★引く 列 だけ。★`select('*')` を 書きません。 */
export const COLS_KID = "id, nickname, dismiss_at, left_at";
export const COLS_READ = "id, viewer_role_at, reason_kind, viewed_at";

/** ★小見出し（★見本の `.usu`）。 */
export function subLine(koenTitle) {
  return (koenTitle || "") + "　／　あなたの アカウントで 出している 子ども";
}

/** ★役が まだ 決まって いない ときの 1行（★見本）。★「未定」と 書きません。 */
export const ROLE_NOT_YET = "配役は 運営が 決めます";

/** ★連絡先の あり／なし（★見本「緊急の 連絡先 あり／なし」）。 */
export function contactWord(has) {
  // ★★★3つ です ── ★あり ／ なし ／ **知れない**（★2026-09-26）。
  //   ★★`koen_kid_contacts` は 保護者にも 選べません（★`42501`）。
  //     ★それは 正しい 作り です ── ★番号を 読めるのは 責任者の 当日だけ です。
  //   ★★★だから 知れない ときに「なし」と 書きません。
  //     ★「無い」のと「知れない」のは 別 です。★空を 返し、★行から 落とします。
  if (has === undefined || has === null) return "";
  return has ? "緊急の 連絡先 あり" : "緊急の 連絡先 なし";
}


/** ★見た 記録の 見出しと、★1件も 無い とき（★見本）。 */
export const READS_HEAD = "緊急の 連絡先を 見た 記録";
export const READS_EMPTY = "まだ 見られていません";

/** ★外す（★見本の `.pill.sm`）。 */
export const BTN_REMOVE = "外す";

/** ★足す ところ（★見本の `.sh3` と 2つの 欄）。 */
export const ADD_HEAD = "子どもを 足す";
export const F_NAME = "呼び名";
export const F_NAME_PH = "れい：はるちゃん（本名で なくて かまいません）";
export const F_TEL = "緊急の 連絡先（任意）";
export const F_TEL_PH = "保護者の 方の 電話";
export const BTN_ADD = "この 公演に 出す";

/** ★呼び名が 無い ときの 1行（★見本の `toast`）。 */
export const NAME_REQUIRED = "呼び名を 入れてください";

/** ★呼び名だけ 要ります。★連絡先は 任意 です（★見本）。 */
export function mayAdd(nickname) {
  return String(nickname || "").trim().length > 0;
}

/** ★1人も いない とき（★見本の `.empty`）。 */
export const EMPTY_LINE = "まだ いません。";

/**
 * ★見た 記録の 1行（★見本 `l[0]` と `l[1]`）。
 *
 *   ★★★見た 人の 名前を 出しません。★役割 だけ です（★約束⑤）。
 *     ★台帳も 名前を 持って いません ── `viewer_role_at` だけ です。
 */
export function readLine(row) {
  const r = row || {};
  return { when: r.viewed_at || "", role: r.viewer_role_at || "" };
}

/**
 * ★下の 8行（★見本の `.note`・1文字も 変えないこと）。
 *
 *   ★★★1行目は **先に 要る こと** です ──
 *     ★「あなたが この公演に 入っていることが 先に 要ります
 *       （合言葉か お招きで 入ってから、お子さんを 足してください）。」
 *   ★★これを 書かないと、★足せない ときに 何が 足りないか 分かりません。
 *     ★★★台帳も そう なって います ── ★`koen_kids` は `koen_id` を 要り、
 *       ★保護者が その 公演に 入って いない と 書けません。
 *     ★★だから 先に 言います。★押してから 断りません。
 */
export const NOTE_LINES = Object.freeze([
  // ★★空きを 入れないこと ── ★見本は「入っていることが」です（★2026-09-26 に 数えました）。
  "あなたが この公演に 入っていることが 先に 要ります"
    + "（合言葉か お招きで 入ってから、お子さんを 足してください）。",
  "子どもの 枠に あるのは 呼び名だけです。年齢・学校・写真・体調は うかがいません。",
  "呼び名が 見えるのは 同じ 公演の 中だけです（公開の ページ・行事の 一覧には 出ません）。",
  "呼び出しと 集合・解散の 時刻は、あなたの スマホに 出ます。",
  "緊急の 連絡先を 見られるのは 公演の 責任者だけ、稽古と 本番の 当日だけです。",
  "見られると、いつ・どの 役割の 方が 見たかが ここに 出ます（見た 方の 名前は 出しません）。",
  "子どもの 枠で 使えるのは 公演だけです。記録・ひつじ・体調・さがす は 使えません。",
  "兄弟など、何人でも 足せます。いつでも 外せます（運営の 出欠の 記録だけ 残ります）。"
]);
