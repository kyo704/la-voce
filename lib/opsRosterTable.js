// ============================================================================
// ★名簿 ── ★表に する 幅と、★表の 列（★裁定 その80・2026-09-18）
//
//   ★出どころ 見本 `00-動く見本-PC・iPad（運営）.html` の `P_meibo`
//
//   ★★★裁定 その75 と 同じ 形 です。★どちらかを 捨てません。
//     ★表  … ★200人を 横に 並べて くらべる。★担当・状態を 一目で。
//     ★札  … ★1人を 見る。★触って 直す。
//   ★★名簿は 最大 500人 です。★札だけ では 一覧できません。
//
//   ★★★`TABLE_AT`（役職の 表・933）を **流用しません**（★裁定 その80）。
//     ★★用が ちがいます。★列の 数も 幅も ちがいます。
//     ★★片方を 変えた とき、★もう 片方が 壊れます。
//
//   ★見張り components/tests/ops-roster-table.test.js
// ============================================================================

/**
 * ★表の 列（★見本の とおり・6つ）。
 *
 *   ★★`min` は、★見本を 実際に 描いて 測った 幅 です（★2026-09-18）。
 *     ★★216人 の 中身で 測りました。★見当では ありません。
 *   ★★`anchor` … ★左に 貼り付ける 列（★裁定 その80 の「錨」）。
 *     ★★横に すべらせた とき、★お名前だけは 残ります。
 *     ★★★お名前が 消えると、★どの 行を 見て いるか 分からなく なります。
 */
export const ROSTER_COLUMNS = Object.freeze([
  { key: "name", label: "お名前", min: 194, anchor: true },
  { key: "grade", label: "学年", min: 87 },
  { key: "course", label: "学科・コース", min: 181 },
  { key: "teacher", label: "担当の 先生", min: 173 },
  { key: "status", label: "状態", min: 116 },
  { key: "counted", label: "数える", min: 106, num: true }
]);

/** ★表そのものの 幅。★列から 組み立てます。★書き写しません。 */
export const TABLE_WIDTH = ROSTER_COLUMNS.reduce((n, c) => n + c.min, 0);

/**
 * ★運営の 殻の、★左右の 余白の 合計（★`components/OpsShell.jsx`）。
 *
 *   ★★役職の 表と 同じ 数 です。★同じ 殻の 中に 出る から です。
 *   ★★★けれど **別に 書きます**。★あちらを 読みに 行きません。
 *     ★★読みに 行くと、★役職の 表を 直した 日に 名簿も 動きます。
 *     ★★見張りが、★どちらも 殻の 字と 合って いる ことを 見ます。
 */
export const SHELL_PADDING_X = 28;

/**
 * ★表に する 幅。
 *
 *   ★★★測った 幅 ＋ 殻の 余白。★数を 直に 書きません（★裁定 その80）。
 *   ★★役職の 表（933）とは 別の 数 に なります。★それで よい のです。
 */
export const ROSTER_TABLE_AT = TABLE_WIDTH + SHELL_PADDING_X;

/** ★表に するか。★幅が 分からない うちは 出しません。 */
export function showRosterTable(width) {
  return typeof width === "number" && width >= ROSTER_TABLE_AT;
}

/** ★左に 貼り付ける 列（★錨）。 */
export function anchorColumn() {
  return ROSTER_COLUMNS.find((c) => c.anchor) || ROSTER_COLUMNS[0];
}
