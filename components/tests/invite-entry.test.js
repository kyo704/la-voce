#!/usr/bin/env node

// ============================================================================
// ★「生徒を 招待する」の 入口が、★1つ 以上 あること
//
//   ★出どころ [ACTION] Opus → Code（★2026-09-15）「★RULING: ㋒」
//   ★調べ docs/reports/2026-09-15-招待の入口が無い.md
//
//   ★★★何が 起きて いたか。
//     ★札そのものは 壊れて いません でした。★道が 無く なって いました。
//     ★★札は `activeTab === "lesson"` の 中に しか ありません。
//     ★★門の 中の 帯（`TABS_V2_ORDER`）に、★`lesson` が ありません。
//     ★★「入口は ホームに 2つ 残ります」と 書いて ありましたが、
//       ★その 2つは レッスンが **1件でも ある** ときだけ 出ます。
//     ★★つまり ──
//       ★生徒0人 → レッスン0件 → 行が出ない → タブへ行けない
//         → 招待できない → 生徒0人のまま。
//
//   ★★同じ 形を、★生徒の 側で 1度 解いて います
//     （★`lib/featureFlags.js:37-47`）──
//     「★場所を 移しただけで、★鶏と 卵は 解けて いなかった」。
//   ★★だから この 見張りは、★**札が 在るか** では なく
//     ★**道が 在るか** を 見ます。
//
//   ★★見えたか どうかは、★これでは 分かりません。実機で お確かめください。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const NEED = [
  ["lib", "moreMenu.js"], ["components", "VocalTracker.jsx"],
  ["docs", "design", "pack-final", "00-動く見本（さわれる・全画面）.html"],
  ["docs", "design", "pack-final", "00-動く見本-iPhoneで開く用.html"]
];
const missing = NEED.filter((p) => !fs.existsSync(path.join(__dirname, "..", "..", ...p)));
if (missing.length) {
  missing.forEach((p) => console.log("★★ありません: " + p.join("/")));
  console.log("　★数えません。★止まります。");
  process.exit(1);
}

const b64 = (...p) => "data:text/javascript;base64," + Buffer.from(
  fs.readFileSync(path.join(__dirname, "..", "..", ...p), "utf8")).toString("base64");

(async () => {
  const M = await import(b64("lib", "moreMenu.js"));
  const vt = readCode("components", "VocalTracker.jsx");

  console.log("① もっとに 行が あること");
  const row = M.MORE_ROWS.find((r) => r.key === "招待");
  t(!!row, "「招待」の 行が ある");
  t(row && row.label === "生徒を 招待する", "字は「生徒を 招待する」");
  t(row && row.group === "教室", "かたまりは「教室」");

  console.log("\n② ★出す・出さない が、★1つの 条件で 決まること");
  // ★★`activeTab` も `lessonRole` も 見ません。★あれが 詰まりの 元 です。
  t(M.mayShowMoreRow("招待", { canInvite: true }) === true, "持って いる 方には 出す");
  t(M.mayShowMoreRow("招待", { canInvite: false }) === false, "持って いない 方には 出さない");
  t(M.mayShowMoreRow("招待", {}) === false, "何も 渡さなければ 出さない（★閉じる 側に 倒す）");
  // ★★「押せない 札」に して いない こと（★§8⑤）。
  const off = M.moreSections({ canInvite: false }).flatMap((s) => s.rows).map((r) => r.key);
  t(!off.includes("招待"), "★出さない ときは、★一覧から 消える（★押せない 札に しない）");
  const on = M.moreSections({ canInvite: true }).flatMap((s) => s.rows).map((r) => r.key);
  t(on.includes("招待"), "出す ときは 一覧に ある");

  console.log("\n③ ★画面が、★`canSeeBetaFeatures` だけで 決めて いること");
  const callAt = vt.indexOf("canInvite:");
  const call = callAt < 0 ? "" : vt.slice(callAt, callAt + 120);
  t(callAt > -1, "画面が canInvite を 渡して いる");
  t(/canInvite:\s*canSeeBetaFeatures\(profile\)/.test(call),
    "★渡して いるのは canSeeBetaFeatures(profile) だけ");
  t(!/canInvite:[^\n]*activeTab/.test(call), "★activeTab を 条件に して いない");
  t(!/canInvite:[^\n]*lessonRole/.test(call), "★lessonRole を 条件に して いない");
  t(!/canInvite:[^\n]*myOrgs/.test(call), "★教室を 持って いる ことを 条件に して いない");

  console.log("\n④ 押した 先が あること");
  // ★★しくみは 前から あります。★道だけが 無く なって いました。
  t(/if \(r\.key === "招待"\) \{/.test(vt), "「招待」の 行き先が 書いて ある");
  const go = vt.slice(vt.indexOf('if (r.key === "招待") {'), vt.indexOf('if (r.key === "招待") {') + 220);
  t(/setActiveTab\("lesson"\)/.test(go), "レッスンの 画面へ 行く");
  t(/setLessonRoleChoice\("teach"\)/.test(go),
    "★「教える」側を 立てる（★習う側が 出ると おかしい）");
  // ★★行き先の しくみが 生きて いること。
  t(/async function handleGenerateTeacherInvite\(\)/.test(vt), "招待を 作る しくみが ある");
  t(/from\("teacher_invitations"\)/.test(vt), "台帳に 書く ところが ある");

  console.log("\n⑤ ★教室に 招く（㋑）は、★この 直しに 混ぜて いないこと");
  // ★★出どころ「★DO NOT add ㋑ (教室に招く) to もっと in this change」
  //   ★★あちらは owner/admin の 教室が 要ります。★別の 条件 です。
  //   ★★1つの 行に、★1つの 問題。
  t(!M.MORE_ROWS.some((r) => r.key === "教室招待" || (r.label || "").includes("教室に 招")),
    "教室に 招く 行を 足して いない");

  console.log("\n⑥ ★見本にも 同じ 行が あること");
  // ★★出どころ「★BUT: add the same row to the mock too.
  //   ★do not leave the mock and the implementation out of step」
  //   ★★片方だけ 直すと、★次に 見くらべた 人が また 悩みます。
  ["00-動く見本（さわれる・全画面）.html", "00-動く見本-iPhoneで開く用.html"].forEach((f) => {
    const html = readRaw("docs", "design", "pack-final", f);
    const at = html.lastIndexOf("SC['もっと']");
    const blk = at < 0 ? "" : html.slice(at, at + 3500);
    t(blk.includes("生徒を 招待する"), f.slice(0, 18) + "… に 行が ある");
    t(blk.includes('<div class="h3">教室</div>'), f.slice(0, 18) + "… に「教室」の かたまりが ある");
  });

  console.log("\n⑦ ★詰まりの 元が、★戻って いないこと");
  // ★★帯に lesson を 戻して いない こと（★見本の 帯は 5つで 固定・§9）。
  t(/const TABS_V2_ORDER = \["home", "today", "analysis", "notes", "garden"\];/.test(vt),
    "門の 中の 帯は 5つの まま（★lesson を 戻して いない）");
  // ★★「無いことを 毎朝 知らせない」を ゆるめて いない こと。
  const band = readCode("lib", "todayBand.js");
  t(/該当がなければ その行は出ない/.test(readRaw("lib", "todayBand.js")),
    "「該当がなければ その行は出ない」が 残って いる");
  t(!/レッスンは ありません|今日のレッスンはありません/.test(band),
    "「今日の レッスンは ありません」と 書いて いない");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
