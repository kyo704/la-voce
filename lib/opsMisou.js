// ============================================================================
// ★未送信（★見本 `P_misou`・お決め D82）── ★決めごと 1か所
//
//   ★★★見本の 字 ──
//     「ここに あるものは、★**誰にも 届いていません**。
//      ★**自動で 出しません。** 出すかどうかは、いつも 人が 決めます。」
//
//   ★★★2つに 分けます ──
//     ★下書き（書きかけ）…… ご自分で 止めた もの
//     ★送れなかった もの …… つながらなかった もの
//   ★★★同じ 一覧に 混ぜません。★わけが ちがえば、★次に する ことも ちがいます。
//
//   ★★★下書きは 別の 表に あります（`org_message_drafts`）。
//     ★★連絡の 表には 入って いません。★届く 道が そもそも ありません。
//
//   ★見張り components/tests/ops-misou.test.js
// ============================================================================

export const HEAD = "未送信";
export const BACK_LABEL = "連絡";

export const KINDS = Object.freeze([
  { key: "draft", label: "下書き", note: "書きかけ です。まだ 出して いません。" },
  { key: "failed", label: "送れなかった", note: "つながらなかった もの です。" }
]);

export const WARN_LINES = Object.freeze([
  "ここに あるものは、誰にも 届いて いません。",
  "下書き（書きかけ）と、送れなかった もの（つながらなかった）を 分けて 出します。",
  "自動で 出しません。出すかどうかは、いつも 人が 決めます。"
]);

/** ★件数の 1行。 */
export function countWord(rows) {
  return `${(rows || []).length}件`;
}

/**
 * ★2つに 分けます。
 *
 *   ★★★読めて いない ときは `null`。★空と 分けます。
 */
export function split(rows) {
  if (!Array.isArray(rows)) return null;
  return {
    draft: rows.filter((r) => r && r.kind !== "failed"),
    failed: rows.filter((r) => r && r.kind === "failed")
  };
}

/** ★中身が 無ければ 出せません。 */
export function maySend(row) {
  return !!(row && String(row.body || "").trim());
}
export const EMPTY_BODY = "中身が ありません。書いてから 出して ください。";
export function whyCannotSend(row) {
  return maySend(row) ? "" : EMPTY_BODY;
}

/** ★1行の 見出し（★題が 無ければ 中身の 頭）。 */
export function headOf(row) {
  const t = String((row && row.title) || "").trim();
  if (t) return t;
  const b = String((row && row.body) || "").trim().replace(/\s+/g, " ");
  return b ? (b.length > 24 ? b.slice(0, 24) + "…" : b) : "（まだ 何も ありません）";
}

/**
 * ★送れなかった わけ。
 *
 *   ★★★機械の 字を そのまま 出しません。★読めません。
 *     ★★1つの 言い方に します ──「つながりませんでした」。
 *   ★★★細かい わけは 台帳に 残って います。★出さない だけ です。
 */
export const FAIL_WORD = "つながりませんでした";

export const EMPTY_HEAD = "未送信は ありません。";
export const NOT_READ = "いま 読めませんでした。";

export const SEND_LABEL = "出す";
export const DELETE_LABEL = "消す";
export const DELETE_ASK = "この 下書きを 消しますか。";

export const NOTES = Object.freeze([
  "出すまで、誰にも 届きません。",
  "消すと、戻せません。"
]);

export const FAILED_LINE = "いま 出せませんでした。もう一度 お試し ください。";
