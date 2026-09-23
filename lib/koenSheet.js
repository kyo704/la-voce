// ============================================================================
// ★★★香盤表 ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定141 ／ design-v36 の 直し ②（★配役が まだでも 場面を 先に 作れる）
//     ／ 見本 `P_kouban`（`SC['香盤表']`）
//        woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★台帳の 形 ──
//     `koen_rows`  … ★場面（label・group_label・minutes・sort_order）
//     `koen_slots` … ★役
//     `koen_cells` … ★その 場面に その 役が 出るか（★行が あれば 出る）と 人数
//
//   ★★★言葉は **台帳**（`koen_kind_words`）から 引きます。★ここに 写しません。
//     ★見本の `KW` と 台帳は ちがいます（★`docs/ledgers/08-保留している決め.md` ⑦）。
//     ★★2か所に 置くと、★台帳を 直した ときに 画面だけ 古く なります。
//
//   ★★★体の ことは 1つも 扱いません（★裁定141）。
// ============================================================================

export const COLS_ROW = "id, koen_id, label, group_label, minutes, memo, sort_order, time_from, time_to";
export const COLS_WORDS = "kind, row_word, col_word, cast_word, tbl_word";

/** ★言葉が 引けなかった ときの もの。★`other` と 同じ です。 */
export const FALLBACK_WORDS = Object.freeze({
  kind: "other", row_word: "項目", col_word: "担当", cast_word: "担当", tbl_word: "表"
});

/** ★その 公演の 言葉（★台帳の 1行）。★無ければ `other` の もの。 */
export function wordsOf(rows, kind) {
  const r = (Array.isArray(rows) ? rows : []).find((x) => x && x.kind === kind);
  return r || FALLBACK_WORDS;
}

/**
 * ★表の ます目。
 *
 *   ★★`cells` に 行が あれば「出る」です。★無ければ 出ません。
 *     ★★★`member_id` が 入って いなくても、★行が あれば 出ます ──
 *       ★配役が まだでも 場面は 組める、が この 表の 決め です（★直し ②）。
 */
export function sheetGrid(rows, slots, cells) {
  const 場 = (Array.isArray(rows) ? rows : []).slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const 役 = (Array.isArray(slots) ? slots : []).slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const 有 = {};
  (Array.isArray(cells) ? cells : []).forEach((c) => {
    if (c) 有[c.row_id + "|" + c.slot_id] = c;
  });
  return {
    rows: 場, slots: 役,
    cellOf: (rowId, slotId) => 有[rowId + "|" + slotId] || null,
    on: (rowId, slotId) => Boolean(有[rowId + "|" + slotId])
  };
}

/** ★場面の 見出し（★幕・場が あれば それ、★無ければ 名前）。 */
export function rowLabel(row) {
  if (!row) return "";
  const 幕 = String(row.group_label || "").trim();
  return 幕 ? (幕 + " " + String(row.label || "").trim()).trim() : String(row.label || "");
}

/** ★合計の 分。★入って いない 場面は 0 と 数えます。 */
export function totalMinutes(rows) {
  return (Array.isArray(rows) ? rows : [])
    .reduce((n, r) => n + (Number(r && r.minutes) || 0), 0);
}

/** ★場面を 足せるか。★名前が 要ります。 */
export function canAddRow(name) {
  return String(name == null ? "" : name).trim() !== "";
}

/** ★場面を 足す ときの 形。 */
export function newRow(name, order) {
  return {
    label: String(name || "").trim().slice(0, 60),
    minutes: 10,
    sort_order: Number(order) || 0
  };
}

/** ★分を 読みます。★空・数でない ものは null。 */
export function readMinutes(v) {
  const s = String(v == null ? "" : v).trim();
  if (s === "" || !/^[0-9]+$/.test(s)) return null;
  return Number(s);
}

/** ★見本の 言葉（★1字 も 足しません。★「◯◯」は 台帳の 言葉が 入ります）。 */
export const SHEET_NEED_CAST = "を 決めてください。";
export const SHEET_NEED_CAST_SUB = "が 列に なります。";
export const SHEET_ROWS_FIRST_HEAD = "だけ 先に 作る";
export const SHEET_ROWS_FIRST_NOTE = "が まだでも、幕・場・曲 は 先に 並べられます。";
export const SHEET_IS_TRUTH = "これが 正。稽古に 要る方は ここから 出します";
export const SHEET_EDIT_ON = "●を つける";
export const SHEET_EDIT_ON_CNT = "●と 人数を つける";
export const SHEET_EDIT_OFF = "つけ終わる";
export const SHEET_ADD_ROW_NEED = "の 名前を 入れてください";
export const SHEET_ADDED = "足しました";
export const SHEET_NOW = "いま";

/**
 * ★下の 但し書き（★見本の .note）。
 *
 *   ★★★「色ではなく 列の 中で 分けています」は **約束** です。
 *     ★色だけで 分けると、★色の 見分けに くい 方に 伝わりません。
 *     ★★だから A・B を **列** に 分けて います（★`lib/koenCast.js`）。
 *     ★★★この 1行を 消す ときは、★列で 分けるのを やめる とき だけ です。
 */
export function sheetNotes(words) {
  const 出 = [];
  const w = words || FALLBACK_WORDS;
  if (w.cast_word === "配役") {
    出.push("ダブルキャストは、色ではなく 列の 中で 分けています。");
  }
  出.push("席の 順（プルト）は ここでは 作りません。");
  return 出;
}

// ★★★まだ この 画面に 無い 札（CSV・PDF・雛形）は、★ここに 名前を 書きません。
//   ★書くと、★くらべる 道具が「実装に ある」と 数えます ── ★出して いないのに。
//   ★★どこで 作るか・いつ 見直すかは `tools/excluded_by_design.json` に あります。
//   ★★★「入口だけ 出す」も しません（★裁定176 §3）。押せない 札は 不具合に 見えます。
