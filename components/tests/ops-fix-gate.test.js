#!/usr/bin/env node

// ============================================================================
// ★運営モードの 直しの 門 ── ★お二人だけ に かかって いること
//
//   ★出どころ 2026-09-13、★坂本さんの お指図。
//     ★★「運営モードで 名簿を 読みに 行く 直しは、★まず お二人だけに。
//       ★★38人の タブの 出方を、★お決めの 前に 変えない こと」
//
//   ★★形は lib/layoutV2.js に そろえて います（★2026-09-09 の お指図）。
//     ★★画面で 判じません。★決めは lib が 持ちます。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}
function eq(a, b, label) {
  const x = JSON.stringify(a), y = JSON.stringify(b);
  if (x === y) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label + "\n      期待 " + y + "\n      実際 " + x); ng++; }
}

(async () => {
  const src = fs.readFileSync(
    path.join(__dirname, "..", "..", "lib", "opsFixGate.js"), "utf-8");
  const m = await import("data:text/javascript;base64," +
    Buffer.from(src).toString("base64"));

  const E = "NEXT_PUBLIC_OPS_FIX_ALLOWLIST";

  console.log("① 名簿が 空なら、★どなたにも かかりません");
  eq(m.mayLoadOpsDetail("a@b.jp", {}), false, "★環境が 空");
  eq(m.mayLoadOpsDetail("a@b.jp", { [E]: "" }), false, "★字が 空");
  eq(m.mayLoadOpsDetail("a@b.jp", { [E]: " , , " }), false, "★区切りだけ");
  eq(m.mayLoadOpsDetail("a@b.jp", null), false, "★環境が null");

  console.log("\n② 名簿に 載って いる 方だけ");
  const two = { [E]: "kyo0703opera@gmail.com,kyo0703opera+forcode@gmail.com" };
  eq(m.mayLoadOpsDetail("kyo0703opera@gmail.com", two), true, "★坂本さん");
  eq(m.mayLoadOpsDetail("kyo0703opera+forcode@gmail.com", two), true, "★使い捨て");
  eq(m.mayLoadOpsDetail("hoka@example.com", two), false, "★ほかの 方は かからない");
  eq(m.mayLoadOpsDetail("", two), false, "★お名前が 空");
  eq(m.mayLoadOpsDetail(null, two), false, "★お名前が null");
  eq(m.mayLoadOpsDetail(undefined, two), false, "★お名前が undefined");

  console.log("\n③ 前後の 空白と 大文字小文字");
  eq(m.mayLoadOpsDetail(" kyo0703opera@gmail.com ", two), true, "★前後の 空白");
  eq(m.mayLoadOpsDetail("KYO0703opera@Gmail.com", two), true, "★大文字でも 同じ");
  eq(m.mayLoadOpsDetail("kyo0703opera@gmail.com",
    { [E]: " kyo0703opera@gmail.com , x@y.jp " }), true, "★名簿の 側の 空白");

  console.log("\n④ 似た お名前を 通さない こと");
  eq(m.mayLoadOpsDetail("kyo0703opera@gmail.com.evil.jp", two), false, "★後ろに 足した もの");
  eq(m.mayLoadOpsDetail("xkyo0703opera@gmail.com", two), false, "★前に 足した もの");
  eq(m.mayLoadOpsDetail("kyo0703opera@gmail.co", two), false, "★1文字 足りない");

  console.log("\n⑤ 環境変数の 名前を、★2か所で 書いて いない こと");
  eq(m.OPS_FIX_ENV, E, "★名前は lib が 持つ");
  const ui = readCode("components", "VocalTracker.jsx");
  // ★★数える のは **行** です。★1行の 中に 2回 出るのは、★この家の 形です ──
  //   ★`{ NEXT_PUBLIC_X: process.env.NEXT_PUBLIC_X }`
  //   ★★Next.js は `process.env.X` を 字の まま 書かないと 埋め込みません。
  //   ★★lib/layoutV2.js の 呼び方も 同じです。
  //   ★★2026-09-13、★はじめ 回数で 数えて いて、★正しい 形を 落として いました。
  const rows = ui.split("\n").filter((l) => l.includes("NEXT_PUBLIC_OPS_FIX_ALLOWLIST"));
  t(rows.length <= 1, "★環境変数の 名前が 出る 行は 1つ まで（★" + rows.length + "）");
  // ★★手本と 同じ 形か。★2か所で ちがう 書き方を しない ため。
  t(rows.length === 0 || /NEXT_PUBLIC_OPS_FIX_ALLOWLIST: process\.env\.NEXT_PUBLIC_OPS_FIX_ALLOWLIST/.test(rows[0]),
    "★lib/layoutV2.js と 同じ 渡し方");

  console.log("\n⑥ 画面で 判じて いない こと");
  t(!/userEmail\s*===\s*["']/.test(ui), "★お名前を 画面で くらべて いない");
  t(/mayLoadOpsDetail\(/.test(ui), "★lib に 尋ねて いる");
  t(/if \(opsFixOn\) void fetchOrgDetail\(opsOrgId\)/.test(ui),
    "★門の 内側でだけ 読みに 行く");

  console.log("\n⑦ ★38人の 側が 変わって いない こと");
  const raw = readRaw("components", "VocalTracker.jsx");
  // ★★門の 外の 2本は、★これまでどおり 誰にでも 走ります。
  t(/if \(!opsOrgId\) return;\s*\n\s*if \(opsFixOn\) void fetchOrgDetail\(opsOrgId\);\s*\n\s*void fetchRenrakuStudios\(opsOrgId\);\s*\n\s*void fetchRenraku\(opsOrgId, null\);/.test(raw),
    "★門が かかるのは fetchOrgDetail の 1本だけ");
  // ★★もとから ある 道（もっとの 教室の詳細）は 残って います。
  t(/onToggle=\{\(e\) => \{ if \(e\.target\.open\) \{ fetchOrgDetail\(orgId\)/.test(raw),
    "★もとの 道（教室の詳細）は そのまま");

  console.log("\n★★この 見張りが 見て いない こと");
  console.log("　★環境変数に 何が 入って いるかは 見て いません（★Vercel の 側）。");
  console.log("　★名簿が 空の あいだは、★誰にも かかりません ── ★それが 既定です。");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
