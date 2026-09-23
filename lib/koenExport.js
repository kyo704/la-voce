// ============================================================================
// ★★★書き出す（香盤表）／ 前の 公演から 写す ── ★決めは ここ だけ です
//
//   ★出どころ  裁定178（公演の 使いやすさ）
//     ／ 見本 `SC['書き出す（香盤表）']` `SC['前の公演から写す']`
//        woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//        ★2026-09-23 に 展開・docs/design/pack-final/ に 反映
//
//   ★★★体調の ことは、★1文字も 入りません（★見本の 註）。
//     ★出す もとは 台帳の `koen_sheet_export` ほか です。
//     ★★どれも 体の 列を 返しません。★この ファイルも 受け取る 形を 持ちません。
//
//   ★★★写すのは **形だけ** です（★裁定178）。
//     ★人・配役・稽古・出欠・呼び出し・期限は 写りません。
//     ★★止めて いるのは 台帳の `koen_copy_frame` です。★こちらは 書くだけ。
// ============================================================================

/**
 * ★書き出せる もの（★見本の 並びの まま）。
 *
 *   ★★`rowWord` `colWord` は 台帳の 言葉（`koen_kind_words`）から 来ます。
 *     ★ここで「場面」「役」と 書きません。
 *   ★★★`fn` は 台帳の 関数の 名 です。★画面が 何を 呼ぶかを ここで 決めます。
 */
export function exportKinds(words) {
  const w = words || {};
  const 行 = w.row_word || "行";
  const 列 = w.col_word || "列";
  return [
    { key: "sheet", label: "香盤表（" + 行 + " × " + 列 + "）", fn: "koen_sheet_export" },
    { key: "keiko", label: "稽古の 一覧", fn: "koen_day_sheet" },
    { key: "attend", label: "出欠の まとめ（率は 出しません）", fn: "koen_attendance_counts" },
    { key: "runsheet", label: "当日の 進行", fn: "koen_runsheet_sheet" },
    { key: "calls", label: "呼ぶ方の 一覧", fn: "koen_runsheet_sheet" }
  ];
}

/**
 * ★出した ものに 体の ことが 混ざって いないか。
 *
 *   ★★★約束は 字だけでは 守れません。★出す 前に **数えます**。
 *     ★1つでも 見つかったら 出しません。
 *   ★★台帳の 関数は どれも 体の 列を 返しません。★これは 2つ目の 見張り です。
 */
export const BODY_WORDS = Object.freeze([
  "throat", "voice_quality", "resonance", "condition", "体調", "のど", "声の 調子",
  "sleep", "睡眠", "cycle", "medication", "薬"
]);

export function hasBodyWords(rows) {
  const 字 = JSON.stringify(rows == null ? [] : rows);
  return BODY_WORDS.some((w) => 字.includes(w));
}

/** ★写せる 公演（★自分が 運営して いる もの。★いまの 公演は 除きます）。 */
export function copyCandidates(koens, currentId) {
  return (Array.isArray(koens) ? koens : [])
    .filter((k) => k && k.id !== currentId)
    .map((k) => ({
      id: k.id,
      title: k.title || "（題名が まだ です）",
      opens_on: k.opens_on || "",
      slots: Number(k.slot_count) || 0,
      rows: Number(k.row_count) || 0
    }));
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const EXPORT_HEAD = "書き出す";
export const EXPORT_WHY = "紙で 配る ときの ためです。体調の ことは、1文字も 入りません。";
export const EXPORT_WHAT = "何を 出しますか";
export const EXPORT_NOTE = "出した ものは、その ときの 姿です。あとで 変えても、出した 紙は 変わりません。";

export const COPY_HEAD = "前の 公演から 写す";
export const COPY_WARN_1 = "写すのは ";
export const COPY_WARN_2 = "の 形だけです。";
export const COPY_WARN_3 = "人・配役・稽古・出欠・呼び出し・期限は 写りません。";
export const COPY_WHICH = "どの 公演から";
export const COPY_EMPTY = "去年の 公演は、ここに 並びます";
export const COPY_DO = "写す";
export const COPY_NOTE = Object.freeze([
  "毎年 同じ 演目を 出す 学校・市民オペラの ための 道です。",
  "新しい 公演として 作ります。前の 公演は そのまま 残り、期限も 延びません。"
]);
