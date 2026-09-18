// ============================================================================
// ★見張り ── ★役職 × できこと の 表（★裁定 その75 修正・2026-09-18）
//
//   ★★測る のは 5つ です。
//     ★一 ★境目は 930。★測った 数（表の 実の 幅 905）より 大きい
//     ★二 ★`TWO_PANE_AT`（900）を 流用して いない
//     ★三 ★押せない マスを、★押せる ように 見せて いない（★Option_B）
//     ★四 ★動かせない わけが、★行の 頭に ある
//     ★五 ★どちらの 形も 残って いる（★表 と 札）
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
  const M = await loadLib("lib", "opsPostMatrix.js");
  const P = await loadLib("lib", "opsPerms.js");
  const R = await loadLib("lib", "renraku.js");

  // ------------------------------------------------------------------------
  // ★一 ★境目
  // ------------------------------------------------------------------------
  //   ★★見本の 表の 実の 幅 …… 905px（★2026-09-18 に 描いて 測りました）
  //     ★できことの 列 245 ＋ 役職の 列 66 × 10 ＝ 660
  //   ★★★数を 覚えず、★ここで 数え直します。
  //     ★★役職が 増えた 日に、★この 見張りが 自分で 気づきます。
  const 列 = P.TEMPLATE_POSTS.length;
  const 要る幅 = 245 + (66 * 列);
  ok(M.TABLE_WIDTH >= 要る幅,
    "表の 幅が、★列の ぶん ある（要る " + 要る幅 + " ／ いま " + M.TABLE_WIDTH + "）");

  // ★★★殻の 余白を、★殻の 字から 読み直します（★2026-09-18）。
  //   ★★930 で 3px すべりました。★差の 28px は 殻の 左右の 余白 でした。
  //   ★★★数を 覚えません。★`components/OpsShell.jsx` から 読みます。
  //     ★★余白を 変えた 日に、★この 見張りが 自分で 気づきます。
  const 殻 = readCode("components", "OpsShell.jsx");
  const 余白 = /padding: "(\d+)px (\d+)px/.exec(殻);
  assert.ok(余白, "★止まりました ── 殻の 余白を 読めません。");
  const 左右 = Number(余白[2]) * 2;
  ok(M.SHELL_PADDING_X === 左右,
    "殻の 余白と 合って いる（殻 " + 左右 + " ／ 束 " + M.SHELL_PADDING_X + "）");
  ok(M.TABLE_AT === M.TABLE_WIDTH + M.SHELL_PADDING_X,
    "境目 ＝ 表の 幅 ＋ 殻の 余白（" + M.TABLE_AT + "）");
  ok(M.showTable(930) === false, "930 では 出さない（★3px すべりました）");
  ok(M.showTable(M.TABLE_AT) === true, "境目 ちょうどで 表");
  ok(M.showTable(M.TABLE_AT - 1) === false, "1px 足りなければ 札");
  ok(M.showTable(null) === false, "幅が 分からない うちは 表を 出さない");
  ok(M.showTable(834) === false, "iPad たて（834）は 札");
  ok(M.showTable(933) === true, "933 で 表（★すべり 0 を 実機で 測りました）");
  ok(M.showTable(1194) === true, "iPad よこ（1194）は 表");

  // ------------------------------------------------------------------------
  // ★二 ★流用して いない
  // ------------------------------------------------------------------------
  const 束 = readCode("lib", "opsPostMatrix.js");
  ok(!/TWO_PANE_AT/.test(束), "TWO_PANE_AT を 流用して いない（用が ちがいます）");
  ok(M.TABLE_AT !== R.TWO_PANE_AT, "2ペインの 境目 とは 別の 数");

  // ------------------------------------------------------------------------
  // ★三・四 ★押せない マスと、★行の 頭の わけ
  // ------------------------------------------------------------------------
  const 学長 = P.TEMPLATE_POSTS.find((x) => x.name === "学長").perms;
  ok(M.rowLocked(学長, "monka_read") === false,
    "学長は monka_read の 行を 動かせる（★裁定 その77 の 特例）");
  ok(M.rowLocked(学長, "bill") === false, "持って いる 行は 動かせる");
  const 課長 = P.TEMPLATE_POSTS.find((x) => x.name === "課長").perms;
  ok(M.rowLocked(課長, "meibo") === true, "持って いない 行は 動かせない");
  ok(typeof M.rowLockedReason(課長, "meibo") === "string",
    "動かせない 行に、★わけが ある");
  ok(M.rowLockedReason(学長, "bill") === null, "動かせる 行に わけは 出さない");
  // ★★monka_read の わけは、★ほかと ちがいます（★特例 だから）。
  ok(M.rowLockedReason(課長, "monka_read") !== M.rowLockedReason(課長, "meibo"),
    "monka_read の わけは、★ほかと 言い分けて いる");

  const 表 = readRaw("components", "OpsPostMatrix.jsx");
  ok(/押せる \? \(/.test(表), "押せる ときだけ 札に して いる");
  ok(!/disabled=\{!押せる\}|disabled=\{動かせない\}/.test(表),
    "押せない 札を 置いて いない（★灰色の 札に しない）");
  ok(/rowLockedReason/.test(表), "行の 頭に わけを 出して いる");
  // ★★丸は 消しません。★「持って いるか」の しるし です。
  ok(/●/.test(表) && /○/.test(表), "丸は 消して いない");

  // ★★自分の 役職には monka_read を 付けられない（★裁定 その77）。
  ok(/monka_read" && 自分の役職/.test(表.replace(/\s+/g, " ")),
    "自分の 役職の monka_read は 押せない");

  // ------------------------------------------------------------------------
  // ★五 ★どちらの 形も 残って いる
  // ------------------------------------------------------------------------
  const 画面 = readRaw("components", "OpsPosts.jsx");
  ok(/showTable\(winW\)/.test(画面), "幅で 出し分けて いる");
  ok(/<OpsPostMatrix/.test(画面), "表が ある");
  ok(/posts\.map\(\(p\) =>/.test(画面), "札も 残って いる");

  console.log("\n★" + 数 + "件 通りました ── 役職 × できこと の 表");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
