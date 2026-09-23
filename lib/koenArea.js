// ============================================================================
// ★★★公演の 運営 ── ★どの 画面へ 行けるかを 決めるのは ここ だけ です
//
//   ★出どころ  裁定141 ／ 裁定176（作り終えて 隠して 置く）／ 裁定178
//     ／ 見本 `P_koen`（`SC['公演の運営']`）
//        woolsong-2026-09-21_3.zip ／ 00-動く見本-PC・iPad（運営）.html
//        ★2026-09-24 に 確かめ
//
//   ★★★見本の 行き先は 11 あります。★作った ものは その うち 7つ です。
//     ★★★まだ 無い ものを **出しません**（★裁定176 §3）。
//       ★押せない 札は 不具合に 見えます。
//     ★★どれが まだかは `tools/not_wired_yet.json` と ここの 註に 書きます。
//       ★★数えられる ように して おきます ── ★隠す ためでは ありません。
//
//   ★★★出すか 出さないかは `featureOn(features, "koen")` だけ が 決めます。
//     ★鍵が 閉じて いれば、★入口ごと 出しません。
// ============================================================================

/** ★機能の 鍵。★字を 2か所に 書きません。 */
export const KOEN_KEY = "koen";

/**
 * ★「つぎに すること」（★見本 `P_koen` の st）。
 *
 *   ★★見本は 4つ です ── ★配役 ／ 出演者 ／ 香盤表 ／ 稽古。
 *   ★★★「稽古を 組む」は まだ 作って いません。★出しません。
 *   ★★「済み」の 印は **数** で 決めます。★人が つける ものでは ありません。
 */
export function nextSteps({ words, roleCount, memberCount, rowCount } = {}) {
  const w = words || {};
  return [
    { key: "cast", label: (w.cast_word || "配役") + "を 決める", done: (roleCount || 0) > 0 },
    { key: "invite", label: "出演者を 招く", done: (memberCount || 0) > 1 },
    { key: "sheet", label: (w.tbl_word || "表") + "を 作る", done: (rowCount || 0) > 0 }
  ];
}

/**
 * ★上の 札（★見本 `P_koen` の pills）。
 *
 *   ★★作った ものだけ です。★「当日の 進行」「配る」「稽古の 一覧」は まだ です。
 */
export function tabs(words) {
  const w = words || {};
  return [
    { key: "sheet", label: w.tbl_word || "表" },
    { key: "export", label: "書き出す" },
    { key: "copy", label: "前の 公演から 写す" }
  ];
}

/** ★行の 字（★見本の まま）。 */
export const KOEN_NEXT_HEAD = "つぎに すること";
export const KOEN_DONE = "済み";
export const KOEN_INFO = "公演の 情報・使える 期限";
export const KOEN_UNTIL = " まで";
export const KOEN_EXPIRED = "（過ぎました）";
export const KOEN_NONE = "—";

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★2行目が 約束 です ──
 *     「出演者の 体調は、どの 画面からも 見られません。」
 */
export const KOEN_NOTE = Object.freeze([
  "順番は 前後して かまいません。出演者の 体調は、どの 画面からも 見られません。"
]);

/**
 * ★まだ 作って いない 行き先（★見本には あります）。
 *
 *   ★★★ここに 書くのは、★**出さない ことを 数えられる ように する** ため です。
 *     ★この 一覧を 画面に 出しません。★押せない 札を 置きません。
 *   ★★作ったら、★`tabs()` か `nextSteps()` に 足し、★ここから 消します。
 */
export const NOT_MADE_YET = Object.freeze([
  "稽古を組む", "稽古の一覧", "配る", "公演の出欠", "当日の進行", "公演を作る",
  // ★★★代役を 立てる（★2026-09-24）。
  //   ★画面は できて います（`components/Understudy.jsx`）。
  //   ★★けれど **稽古の 1回**（`koen_sessions`）が 無いと 中身が 出ません ──
  //     ★`koen_understudy_needed(p_session)` が その 番号を 求めます。
  //   ★★★`稽古を組む` が できるまで、★ここから 出しません。
  //     ★押せる のに 中身が 空、は「押せない 札」より たちが 悪い です。
  "代役を立てる"
]);
