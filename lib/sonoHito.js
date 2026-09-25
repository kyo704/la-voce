// ============================================================================
// ★その人 ── ★名簿の 1人の 中身（★2026-09-25・C群）
//
//   ★見本 `P_sonohito`（★`00-動く見本-PC・iPad（運営）.html`・design-v76）。
//     ★★電話の 見本にも 同じ 名の 画面が あります が、★字が **短い** です。
//       ★運営の 見本の ほうが 後 です。★長い ほうを 取ります。
//
//   ★★★対応表の 誤り（★2026-09-25・Opus が 認めた）──
//     ★この 画面は `components/OpsPeople.jsx`（★名簿の 一覧）では ありません。
//     ★★一覧は `P_settei` §11 `stPeople` です。★別の 画面 です。
//
//   ★★★ようすの 字は `lib/orgRoster.js` が 持ちます。★ここで 書きません。
//     ★★`STATUSES` は 台帳の `enrollments_status_check` と 同じ 3つ です。
//     ★★見本の「招待中」は **台帳に ありません**。★出しません（★下の 註）。
//
//   ★★★見られない ものの 8行は **約束** です。
//     ★「画面が ありません」── ★隠して いるのでは なく、★作って いません。
//     ★★1つでも 作ったら、★この 行を 先に 外します。
//
//   ★見張り components/tests/sono-hito.test.js
// ============================================================================

import { STATUSES, statusLabel } from "@/lib/orgRoster";

/** ★戻る 先（★見本 `bk('名簿')`）。 */
export const BACK_TO = "名簿";

/** ★左の 1枚目の 見出し（★見本の `li plain` の 左）。 */
export const FACTS = Object.freeze([
  "学年", "学科・コース", "担当の 先生", "門下", "数える 人数に"
]);

/** ★出席の 節（★見本の `h3`）。 */
export const ATTEND_HEAD = "レッスンの 出席（この3か月）";

/**
 * ★出席の 3行（★見本の 並び そのまま）。
 *
 *   ★★`key` は `lib/attendanceCount.js` の しるし と 同じ です。
 *   ★★★休講は「その回を しなかった」です。★休みとは 別 です。
 *     ★★行われた 回数に 入れません（★`heldCount` が そう して います）。
 */
export const ATTEND_ROWS = Object.freeze([
  Object.freeze({ key: "came", label: "出席" }),
  Object.freeze({ key: "absent", label: "休み" }),
  Object.freeze({ key: "canceled", label: "休講（この回を しなかった）" })
]);

/** ★何回、と 書きます（★見本「21回」）。★率を 作れる 形に しません。 */
export function timesWord(n) {
  return String(Number(n) || 0) + "回";
}

/** ★ようすの 節（★見本の `h3`）。 */
export const STATUS_HEAD = "在籍の様子";

/** ★いま これ です（★見本の `✓ いま これです`）。 */
export const STATUS_NOW = "✓ いま これです";

/** ★これに する（★見本の `これに する ›`）。 */
export const STATUS_PICK = "これに する ›";

/**
 * ★選べる 3つ（★`lib/orgRoster.js` から 出します）。
 *
 *   ★★★ここで 並べ直しません。★台帳が 許す 3つ が そのまま 出ます。
 *   ★★字も あちらの もの です。★2か所に 書きません。
 */
export function statusChoices() {
  return STATUSES.map((s) => ({ key: s.key, label: s.label, note: s.note }));
}

/** ★いま どれか（★空は `active` と 見ます。★台帳の 既定と 同じ）。 */
export function statusOf(enrollment) {
  const k = (enrollment && enrollment.status) || "active";
  return STATUSES.some((s) => s.key === k) ? k : "active";
}

/** ★数える 人数に 入るか（★見本の 1枚目の 5行目）。 */
export function countedWord(enrollment) {
  const s = STATUSES.find((x) => x.key === statusOf(enrollment));
  return s && s.counted ? "入ります" : "入りません";
}

/** ★題の 下の 1行（★見本の `sub`）。★無い ところは 詰めます。 */
export function subLineOf(o) {
  const v = o || {};
  const 並 = [v.grade, v.course, v.teacher ? v.teacher + " 先生" : "", statusLabel(statusOf(v.enrollment))];
  return 並.filter((x) => x && String(x).trim()).join("　／　");
}

/**
 * ★変えた ことが 残る、と 書きます（★見本の `usu`）。
 *
 *   ★★★これは **約束** です。★`ops_audit_log` に 置いて 初めて 本当 です。
 *     ★★あの 表は `actor_id`・`created_at`・`detail`(jsonb) を 持って います ──
 *       ★「誰が・いつ・何から 何へ」が そろいます。
 *     ★★置かずに この 行を 出したら 嘘に なります。
 */
export const CHANGE_LOGGED = "変えた記録が残ります（誰が・いつ・何から何へ）。あとから戻せます。";

/** ★できない とき（★見本の `warn`）。★字は `lib/opsPerms.js` の `whoCan` が 埋めます。 */
export const CANNOT_HEAD = "あなたの役職では 在籍の様子を 変えられません。";
export const CANNOT_WHO = "変えられるのは";

/** ★右の 節（★見本の `h3`）。 */
export const HIDDEN_HEAD = "見られないもの";

/** ★右の 8行（★約束。★消さないこと）。 */
export const HIDDEN_ROWS = Object.freeze([
  "声の記録", "からだの記録", "ノート・レパートリー", "受診用の 1枚",
  "時間割の 中身", "ほかの 教室の こと",
  "ほかの 教室に 通っていること そのもの", "来られない 理由"
]);

/** ★右の 8行の 右に 添える 字。 */
export const HIDDEN_WORD = "画面が ありません";

/** ★下の 断り（★約束）。 */
export const NOTE = "％を 出しません。実数だけ。健康に関するものは 1つも ありません。";

/**
 * ★台帳から 読む 列（★`select('*')` を 書かない ため）。
 *
 *   ★★★健康の 列は 1つも ありません。★`entries` を 1度も 引きません。
 *     ★★見本の 右の 8行が、★そのまま この 決まり です。
 */
export const COLS_ENROLLMENT =
  "id, org_id, student_id, status, grade_label, grade_year, division_id, student_number";
export const COLS_LESSON = "id, student_id, org_id, attendance, scheduled_at";
export const COLS_ASSIGNMENT = "teacher_id, student_id, org_id, ended_at";
