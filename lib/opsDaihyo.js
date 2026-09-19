// ============================================================================
// ★代表を 決める（★見本 `P_daihyo`）── ★決めごと 1か所
//
//   ★出どころ docs/opus/visual-*/pack/00-動く見本-PC・iPad（運営）.html `P_daihyo`
//
//   ★★★これは **役職では ありません**。★門下の 中の 印 です。
//     ★★役職（`has_can`）の 仕組みの 外 です。
//     ★★その 門下の 先生 だけ が 決めます。★学校の 持ち主でも 決められません。
//
//   ★★★「2人まで」は 台帳が 守ります
//     （`supabase/migration_monka_representative.sql`）。
//     ★★ここの `MAX` は、★早く 断る ため の 写し です。★正は 台帳 です。
//     ★★★画面だけで 守ると、★通信を 直に 叩く 人に 守れません。
//
//   ★見張り components/tests/ops-daihyo.test.js
// ============================================================================

export const HEAD = "代表を 決める";
export const SUB_LINE =
  "1〜2名まで　／　新しい 役職では ありません（門下の 中の 印です）";
export const BACK_LABEL = "門下";
export const MARK = "✓ 代表";

/** ★何人まで（★正は 台帳の `monka_representative_max()`）。 */
export const MAX = 2;

/** ★いま 何人 か。 */
export function countOf(rows) {
  return (rows || []).filter((r) => r && r.isRepresentative).length;
}

/** ★押せるか。★外す のは いつでも できます。 */
export function mayToggle(rows, studentId) {
  const 行 = (rows || []).find((r) => r && r.studentId === studentId);
  if (!行) return false;
  if (行.isRepresentative) return true;
  return countOf(rows) < MAX;
}

/** ★押せない ときの わけ（★押す 前に 出します）。 */
export const FULL_LINE = `代表は ${MAX}人までです`;
export function whyCannot(rows, studentId) {
  return mayToggle(rows, studentId) ? "" : FULL_LINE;
}

/**
 * ★代表が できる こと・できない こと（★見本の 8行）。
 *
 *   ★★★できない ものを、★隠さずに 並べます。
 *     ★★「代表に すると 何が 変わるか」を、★決める 前に 見て いただきます。
 *   ★★★とくに ──「ほかの人の 時間割の 中身」は 見えません。
 *     ★★出したか どうか だけ です（★台帳 08-11 と 同じ 線）。
 */
export const CAN_DO = Object.freeze([
  { label: "門下の 連絡に「重要」を 付ける", ok: true },
  { label: "門下の 投稿を 消す", ok: true },
  { label: "時間割の 集まりを 見る", ok: true },
  { label: "出して いない人に 1回だけ 知らせる", ok: true },
  { label: "ほかの人の 時間割の 中身を 見る", ok: false },
  { label: "ほかの人の 空きコマを 見る", ok: false },
  { label: "予定を 決める", ok: false },
  { label: "生徒の 記録を 見る", ok: false }
]);
export const CAN_HEAD = "代表が できる こと";
export const CAN_WORD = "できます";
export const CANNOT_WORD = "できません";

export const NOTES = Object.freeze([
  "決めるのは 先生です。代表は 集める ところまで。",
  "代表にも、ほかの人の 時間割の 中身は 見えません（出したか どうかだけ）。",
  "この 代表だけは、役職の 仕組みの 外です。その 門下の 先生だけが 決めます。"
]);

/** ★書けなかった ときの 1行（★理由を 作りません）。 */
export const FAILED_LINE = "いま 変えられませんでした。もう一度 お試し ください。";

/**
 * ★台帳が 返した 並びを、★画面の 形に します。
 *
 *   ★★★返り が 来ない ときは、★手もとを 書き換えません。
 *     ★★「書けた」と「書けて いない」を、★同じ 顔に しません。
 */
export function applyResult(rows, data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const 表 = new Map(data.map((d) => [String(d.student_id), !!d.is_representative]));
  return (rows || []).map((r) => (
    表.has(String(r.studentId))
      ? { ...r, isRepresentative: 表.get(String(r.studentId)) }
      : r));
}
