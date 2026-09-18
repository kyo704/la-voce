// ============================================================================
// ★見張り ── ★名簿の 表（★裁定 その80・2026-09-18）
//
//   ★★測る のは 5つ です。
//     ★一 ★境目を 書き写して いない（★列から 組み立てて いる）
//     ★二 ★役職の 表（TABLE_AT）を 流用して いない
//     ★三 ★境目の 両がわ（-1 / +0）で 切り替わる
//     ★四 ★見出しの 行と、★お名前の 列を 貼り付けて いる
//     ★五 ★札を 捨てて いない
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

(async () => {
  const R = await loadLib("lib", "opsRosterTable.js");
  const M = await loadLib("lib", "opsPostMatrix.js");

  // ------------------------------------------------------------------------
  // ★一 ★列から 組み立てて いる
  // ------------------------------------------------------------------------
  ok(R.ROSTER_COLUMNS.length === 6, "列は 6つ（見本の とおり・いま " + R.ROSTER_COLUMNS.length + "）");
  const 合計 = R.ROSTER_COLUMNS.reduce((n, c) => n + c.min, 0);
  ok(R.TABLE_WIDTH === 合計, "表の 幅は 列の 合計（" + 合計 + "）");
  ok(R.ROSTER_TABLE_AT === R.TABLE_WIDTH + R.SHELL_PADDING_X,
    "境目 ＝ 表の 幅 ＋ 殻の 余白（" + R.ROSTER_TABLE_AT + "）");

  const 束 = readCode("lib", "opsRosterTable.js");
  ok(!new RegExp("=\\s*" + R.ROSTER_TABLE_AT + "\\b").test(束),
    "境目の 数を 直に 書いて いない");

  // ★★殻の 余白は、★殻の 字と 合って いるか。
  const 殻 = readCode("components", "OpsShell.jsx");
  const 余白 = /padding: "(\d+)px (\d+)px/.exec(殻);
  assert.ok(余白, "★止まりました ── 殻の 余白を 読めません。");
  ok(R.SHELL_PADDING_X === Number(余白[2]) * 2,
    "殻の 余白と 合って いる（" + Number(余白[2]) * 2 + "）");

  // ------------------------------------------------------------------------
  // ★二 ★役職の 表を 流用して いない
  // ------------------------------------------------------------------------
  ok(!/TABLE_AT\b/.test(束.replace(/ROSTER_TABLE_AT/g, "")),
    "役職の 表の 境目を 読みに 行って いない");
  ok(R.ROSTER_TABLE_AT !== M.TABLE_AT,
    "役職の 表とは 別の 数（名簿 " + R.ROSTER_TABLE_AT + " ／ 役職 " + M.TABLE_AT + "）");

  // ------------------------------------------------------------------------
  // ★三 ★境目の 両がわ
  // ------------------------------------------------------------------------
  ok(R.showRosterTable(R.ROSTER_TABLE_AT) === true, "境目 ちょうどで 表");
  ok(R.showRosterTable(R.ROSTER_TABLE_AT - 1) === false, "1px 足りなければ 札");
  ok(R.showRosterTable(null) === false, "幅が 分からない うちは 表を 出さない");
  ok(R.showRosterTable(834) === false, "iPad たて（834）は 札");
  ok(R.showRosterTable(1194) === true, "iPad よこ（1194）は 表");

  // ------------------------------------------------------------------------
  // ★四 ★貼り付け
  // ------------------------------------------------------------------------
  const 表 = readRaw("components", "OpsRosterTable.jsx");
  ok(/position: "sticky", top: 0/.test(表), "見出しの 行を 貼り付けて いる");
  ok(/position: "sticky", left: 0/.test(表), "お名前の 列を 左に 貼り付けて いる");
  ok(R.anchorColumn().key === "name", "錨は お名前の 列");
  // ★★貼り付けた ところに 背の 色が 無いと、★下の 字が 透けます。
  ok((表.match(/background: C\.card/g) || []).length >= 2,
    "貼り付けた ところに 背の 色が ある（透けません）");

  // ★★「数えない」を ×に しない。★数えない ことは 悪い ことでは ありません。
  ok(!/"×"/.test(表), "数えない ことを ×で 書いて いない");
  ok(/"○"/.test(表) && /"—"/.test(表), "○ と — で 書いて いる（見本の とおり）");

  // ------------------------------------------------------------------------
  // ★五 ★札を 捨てて いない
  // ------------------------------------------------------------------------
  const 画面 = readRaw("components", "OpsRoster.jsx");
  ok(/showRosterTable\(winW\)/.test(画面), "幅で 出し分けて いる");
  ok(/<OpsRosterTable/.test(画面), "表が ある");
  ok(/list\.map\(\(m\) =>/.test(画面), "札も 残って いる");

  console.log("\n★" + 数 + "件 通りました ── 名簿の 表");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
