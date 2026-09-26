// ============================================================================
// ★ページの 節 ── ★出どころは **台帳の 関数 だけ** です（★2026-09-26・裁定207）
//
//   ★★★Opus の お指し（2026-09-26）──
//     「★`ENTRY_KINDS` を 手で 書き足さないで ください。
//       ★`my_page_fields()` から 動的に 取得する 形に して ください。
//       ★わけ …… ★2か所に 同じ ことを 書くと、また ずれます」。
//
//   ★★★実際に ずれて いました ──
//     ★台帳（`portfolio_entries.kind`）は 16種を 通します。
//     ★見本（design-v80）は music 9 ／ voice 11 ／ stage 11。
//     ★★`lib/portfolio.js` の 手書きの 一覧は music 9 ／ voice 7 ／ stage 8 でした。
//       ★★節の 名も 古い まま（`keireki` `shiji` `sho` `honban` `rep` `rokuga` …）。
//     ★★★どちらが 正 かを 争わない ため に、★**書くのを やめました**。
//
//   ★★★だから ここには 節の 一覧が **1行も ありません**。
//     ★★倒れ先（fallback）の 一覧も 置きません ── ★それも 2つ目の 一覧 です。
//     ★★まだ 返って きて いない ときは **空** です。★画面は 何も 並べません。
//       ★★空の 1枚は、★まちがった 1枚より ましです。
//
//   ★★`sql/96`（★本番 132本目・2026-09-26）が その 関数を 作って います。
//
//   ★見張り components/tests/page-fields.test.js
// ============================================================================

/** ★台帳の 関数の 名（★2か所に 書かない ため）。 */
export const RPC = "my_page_fields";

/**
 * ★返って くる 1行の 形。
 *
 *   ★`kind` …… ★`portfolio_entries.kind` に 入る 字
 *   ★`label` …… ★札の 字（★お仕事で 変わります）
 *   ★`hint` …… ★書く ときの 手引き
 *   ★`sort_order` …… ★並び
 */
export const COLUMNS = Object.freeze(["kind", "label", "hint", "sort_order"]);

/**
 * ★返って きた ものを 整えます。
 *
 *   ★★★並べ替えを ここで **決め直しません** ── ★`sort_order` の まま です。
 *     ★台帳が 並べて 返して います（★`order by` ではなく `sort_order` の 値）。
 *   ★★字の 無い 行は 落とします（★`label is null` は 台帳側で 落ちて います が、
 *     ★★念の ため ここでも 見ます ── ★空の 札を 並べません）。
 */
export function normalize(rows) {
  const 列 = Array.isArray(rows) ? rows.filter(Boolean) : [];
  return 列
    .filter((r) => r.kind && r.label)
    .slice()
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((r) => Object.freeze({
      key: String(r.kind),
      label: String(r.label),
      hint: r.hint ? String(r.hint) : ""
    }));
}

/** ★まだ 返って きて いない とき（★空）。★一覧を 作りません。 */
export const NOT_YET = Object.freeze([]);

/** ★その 節の 札（★無ければ 空）。★字を 書き写しません。 */
export function labelOf(fields, kind) {
  const f = (Array.isArray(fields) ? fields : []).find((x) => x.key === kind);
  return f ? f.label : "";
}

/** ★その 節の 手引き（★無ければ 空）。 */
export function hintOf(fields, kind) {
  const f = (Array.isArray(fields) ? fields : []).find((x) => x.key === kind);
  return f ? f.hint : "";
}

/** ★鍵だけ（★紙に 並べる 順など）。 */
export function keysOf(fields) {
  return (Array.isArray(fields) ? fields : []).map((x) => x.key);
}
