#!/usr/bin/env node
// ============================================================================
// 運営モード（第3便・見本⑪）の 見張り
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §3-3・§1-1・§4-7
//
//   ★★いちばん大事な 一文（★§3-3）
//     「★この画面から、★生徒の健康の記録には たどりつけません
//       　（★画面そのものが ありません）」
//
//   ★★確かめること
//     ① 役割ごとの 下タブが §3-3 の 表の とおりであること。
//     ② teacher が 入れないこと。★入口も 出ないこと。
//     ③ お金は owner だけ であること。
//     ④ ★健康側の 画面を 1つも import して いないこと（★§7-7）。
//     ⑤ §4-7 の 一覧だけが パソコン。★運営モード全体は iPhone でも 出ること。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}
function eq(a, b, label) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  t(ja === jb, label + (ja === jb ? "" : `  期待:${jb} 実際:${ja}`));
}

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "opsShell.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const label = (r) => m.tabsFor(r).map((x) => x.label);

  console.log("=== ① 役割ごとの 下タブ（★§3-3 の 表） ===");
  eq(label("owner"), ["ホーム", "日程", "名簿", "行事", "連絡", "設定"], "owner は 6つ");
  eq(label("admin"), ["ホーム", "日程", "名簿", "行事", "連絡"], "admin は 5つ（★設定なし）");
  eq(label("staff"), ["日程"], "★staff は 日程 だけ");
  eq(label("teacher"), [], "★teacher は 入りません");
  eq(label("しらない役割"), [], "★知らない役割は 空（★勝手に 開けない）");
  eq(m.OPS_TABS.length, 6, "帯は 6つ");

  console.log("\n=== ② 入れるか ===");
  eq(m.mayEnterOps("owner"), true, "owner は 入れる");
  eq(m.mayEnterOps("admin"), true, "admin は 入れる");
  eq(m.mayEnterOps("staff"), true, "staff も 入れる（★日程だけ）");
  eq(m.mayEnterOps("teacher"), false, "★teacher は 入れない");
  eq(m.mayEnterOps(null), false, "役割が 無ければ 入れない");
  // ★★入れないのに 入口を 出さないこと
  t(/入れないのに 入口を 出すと/.test(readRaw("lib", "opsShell.js")),
    "★入口も 同じ判定で 決める、と 書いてある");

  console.log("\n=== ③ お金は owner だけ（★§1-1） ===");
  eq(m.maySeeMoney("owner"), true, "owner は 見られる");
  eq(m.maySeeMoney("admin"), false, "★admin は 見られない（★お金以外は 同じ）");
  eq(m.maySeeMoney("staff"), false, "staff も 見られない");
  eq(m.maySeeMoney("teacher"), false, "teacher も 見られない");

  console.log("\n=== ④ ★健康側の 画面を 持たない（★§3-3・§7-7） ===");
  const ui = readCode("components", "OpsShell.jsx");
  const imports = (ui.match(/^import[\s\S]*?from "[^"]+";/gm) || []).join("\n");
  m.NEVER_IN_OPS.forEach((name) => {
    t(!new RegExp(`\\b${name}\\b`).test(imports), `★${name} を import して いない`);
  });
  // ★★記録そのものへも たどりつけないこと
  ["entries", "throatCondition", "voiceQuality", "sleepHours", "throat_symptoms"].forEach((w) => {
    t(!ui.includes(w), `★「${w}」に 触れていない`);
  });
  t(!/supabase|createClient/.test(ui), "★この画面じしんが データベースを 引かない");

  console.log("\n=== ⑤ §4-7 の 一覧だけが パソコン ===");
  eq(m.mayShowWideTable(390), false, "iPhone では 横並びの 表を 出さない");
  eq(m.mayShowWideTable(834), false, "iPad でも 出さない（★見るだけ・§4-7）");
  eq(m.mayShowWideTable(1024), true, "パソコンなら 出す");
  eq(m.mayShowWideTable(null), false, "★はばが 分からないうちは 出さない");
  eq(m.WIDE_TABLE_NOTE, "先生を横に並べた表は、パソコンでご覧ください。", "★1行だけの 断り");
  t(!/ご利用いただけません|使えません|対応していません/.test(m.WIDE_TABLE_NOTE),
    "★責める言葉に なっていない");

  console.log("\n=== ★運営モード全体は、iPhone でも 出る ===");
  // ★★2026-09-09 の お決め。★はばで シェルごと 止めていないこと。
  t(!/mayShowWideTable\(width\)\s*\)\s*return null/.test(ui),
    "★はばで シェルごと 止めていない");
  t(!/innerWidth\s*<\s*\d+[\s\S]{0,40}return null/.test(ui), "★はばで 早く 返していない");
  {
    // ★★早く 返す 行を、★1つずつ 見ます。
    //   ★はじめ「最初の return ( まで」で 切りましたが、
    //   ★useWidth の「return () => …」に 当たって いました。
    //   ★★境目を 探して 切らない。★行で 見ます。
    const early = ui.split("\n").filter((l) => /return null;/.test(l));
    t(early.length > 0, `★早く 返す 行が ある（${early.length}行）`);
    t(early.every((l) => /tabs\.length === 0/.test(l)),
      "★止めるのは 役割だけ（★はばでは ない）：" + early.map((l) => l.trim()).join(" / "));
  }
  t(/env\(safe-area-inset-bottom\)/.test(readRaw("components", "OpsShell.jsx")),
    "★iPhone の 下の 余白を よけている");

  console.log("\n=== 呼ぶ側（★入口と、別のシェル） ===");
  {
    const vt = readCode("components", "VocalTracker.jsx");
    // ★★入口は、★入れる役割にだけ
    t(/myOrgs\.filter\(\(mm\) => mayEnterOps\(mm\.role\)\)/.test(vt),
      "★入口は、入れる役割にだけ 出る");
    // ★★別のシェルであること（★個人のアプリと 重ねない）
    t(/if \(opsOrgId\) \{[\s\S]{0,400}return \([\s\S]{0,120}<OpsShell/.test(vt),
      "★運営モードは、個人のアプリより 前に 返す（★重ねない）");
    t(/mayEnterOps\(role\)/.test(vt), "★役割で 入れるかを 確かめてから 描く");
    // ★★もどれること
    t(/onBack=\{\(\) => setOpsOrgId\(null\)\}/.test(vt), "★もどると、個人のアプリへ 帰る");
    // ★★役割を 画面で 決めていないこと
    t(!/role === "owner" \|\| role === "admin"/.test(readCode("components", "OpsShell.jsx")),
      "★役割の 判定を 画面に 書いていない（★決めは lib 1か所）");
  }

  console.log("\n=== もどる道（★§3-3） ===");
  t(/もどる/.test(readRaw("components", "OpsShell.jsx")), "★左上に「もどる」が ある");
  t(/onBack/.test(ui), "★呼ぶ側へ 帰れる");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
