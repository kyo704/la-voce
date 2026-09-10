#!/usr/bin/env node
// ============================================================================
// 名簿と ご請求（第3便・見本③⑦）の 見張り
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §10
//            坂本さん経由・Opus の裁定（2026-09-09・画面の作り方）
//
//   ★★確かめること
//     ① 先生・事務・休会中を 数えないこと。
//     ② 段の 境目で、★人数が 少ないほうが 高くならないこと。
//     ③ 見本③の 数（52人 → 20,800円）と 合うこと。
//     ④ 下限・初期費用・年の 前払い。
//     ⑤ 画面：★表で ない／★さがすが 前／★合計が 下に 固定／★44pt 以上。
//     ⑥ ％・連続日数を 出さないこと。
//     ⑦ 健康の 記録に たどりつけないこと。
//     ⑧ お金は 責任者だけ。
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
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "orgRoster.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const ui = readCode("components", "OpsRoster.jsx");
  const raw = readRaw("components", "OpsRoster.jsx");

  console.log("=== ① 数える人・数えない人（★§10） ===");
  eq(m.NOT_COUNTED_ROLES.slice().sort(), ["admin", "owner", "staff", "teacher"],
    "★先生・事務・責任者・管理者は 数えない");
  eq(m.rosterCount([
    { role: "student" }, { role: "teacher" }, { role: "staff" },
    { role: "owner" }, { role: "admin" }, { role: "student" }
  ]), 2, "★生徒だけ 数える");
  eq(m.rosterCount([{ role: "student", status: "paused" }]), 0, "★休会中は 数えない");
  eq(m.rosterCount([{ role: "student", status: "invited" }]), 0, "★返事まちも 数えない");
  eq(m.rosterCount([]), 0, "空は 0");
  eq(m.rosterCount(null), 0, "無くても 落ちない");
  eq(m.countsByStatus([
    { role: "student" }, { role: "student", status: "paused" },
    { role: "student", status: "invited" }, { role: "teacher" }
  ]), { counted: 1, paused: 1, invited: 1, notCounted: 1 }, "ようす ごとに 数えられる");

  console.log("\n=== ② 段の 境目で 逆転しない（★§10「安いほうを 当てます」） ===");
  let bad = [];
  for (let n = 2; n <= 400; n++) {
    if (m.monthlyFee(n) < m.monthlyFee(n - 1)) bad.push(n);
  }
  eq(bad, [], "★人数が 増えて 安くなる 所が 無い");
  t(m.monthlyFee(95) <= m.monthlyFee(100), "★95人が 100人より 高くない");
  t(m.monthlyFee(299) <= m.monthlyFee(300), "★299人が 300人より 高くない");
  eq(m.monthlyFee(100), 35000, "100人 → 35,000（★350円の段）");
  eq(m.monthlyFee(300), 75000, "300人 → 75,000（★250円の段）");

  console.log("\n=== ③ 見本③の 数 ===");
  eq(m.monthlyFee(52), 20800, "★52人 → 20,800円（★見本③の とおり）");
  eq(m.perHead(52), 400, "★1人あたり 400円");

  console.log("\n=== ④ 下限・初期費用・年の 前払い ===");
  eq(m.MONTHLY_FLOOR, 12800, "下限は 12,800");
  eq(m.monthlyFee(20), 12800, "★20人でも 下限");
  eq(m.monthlyFee(32), 12800, "★32人（12,800円ちょうど）");
  eq(m.monthlyFee(0), 0, "★0人なら 0円（★下限を 当てない）");
  eq(m.monthlyFee(null), 0, "★人数が 無ければ 0円");
  eq(m.setupFee(49), 0, "★49人なら 初期費用 なし");
  eq(m.setupFee(50), 50000, "★50人から 50,000円");
  eq(m.yearlyFee(52), 20800 * 10, "★年は 2か月ぶん 引く");
  eq(m.yen(20800), "20,800", "読みやすく");

  console.log("\n=== ⑤ 画面の 作り方（★裁定） ===");
  t(!/<table|<thead|<tbody|<tr[ >]/.test(ui), "★表を 使っていない（★1行1カード）");
  {
    // ★★さがすが、★一覧より 前に あること
    const searchAt = raw.indexOf('type="search"');
    const listAt = raw.indexOf("list.map(");
    t(searchAt > 0 && listAt > 0 && searchAt < listAt, "★さがすが 一覧の 前に ある");
  }
  t(/position: "fixed"[\s\S]{0,120}bottom/.test(raw), "★合計が 下に 固定されている");
  t(/今月のご請求/.test(raw), "★合計に ご請求が ある");
  {
    const parts = raw.split("<button").slice(1);
    const noH = parts.filter((p) => !/minHeight/.test(p.slice(0, p.indexOf("</button>") + 1 || 400)));
    t(parts.length > 0 && noH.length === 0, `★押しどころは 44pt 以上（${parts.length}件）`);
    const mins = (raw.match(/minHeight: (\d+)/g) || []).map((x) => Number(x.replace(/\D/g, "")));
    t(mins.every((v) => v >= 44), `★最小 ${Math.min(...mins)}pt`);
  }
  // ★★操作は 下半分に
  {
    const inviteAt = raw.indexOf("名簿に招く");
    const halfway = raw.indexOf("list.map(");
    t(inviteAt > halfway, "★招く は、一覧の あとに ある（★下半分）");
  }

  console.log("\n=== ⑥ ％・連続日数を 出さない ===");
  ["％", "パーセント", "連続", "達成率", "順位", "平均"].forEach((w) => {
    t(!ui.includes(w), `★「${w}」を 出さない`);
  });
  {
    const shown = ui.replace(/`[^`]*%`/g, "").replace(/"\d+%"/g, "");
    t(!/%/.test(shown), "★読み手に ％を 見せない");
  }

  console.log("\n=== ⑦ 健康の 記録に たどりつけない（★見本⑦） ===");
  ["throatCondition", "voiceQuality", "sleepHours", "entries", "throat_symptoms", "ノート"]
    .forEach((w) => t(!ui.includes(w), `★「${w}」に 触れていない`));
  const imports = (ui.match(/^import[\s\S]*?from "[^"]+";/gm) || []).join("\n");
  ["VocalTracker", "HomeV2", "LookBackV2", "CompareV2", "CountV2"]
    .forEach((n) => t(!imports.includes(n), `★${n} を import して いない`));
  t(!/supabase|createClient/.test(ui), "★この画面じしんが データベースを 引かない");

  console.log("\n=== ⑧ お金は 責任者だけ（★§1-1） ===");
  t(/canSeeMoney \?/.test(ui), "★お金は、渡された ときだけ 出す");
  t(!/role === "owner"/.test(ui), "★役割の 判定を 画面で していない");
  {
    const vt = readCode("components", "VocalTracker.jsx");
    // ★★2026-09-11、★役職への 一本化の 3段目。
    //   ★役割（role）では なく、★できこと（gate）を 渡すように なりました。
    //   ★★見張るのは「lib に 尋ねている」ことです。★何を 渡すかでは ありません。
    t(/canSeeMoney=\{maySeeMoney\((role|gate)\)\}/.test(vt), "★呼ぶ側が lib に 尋ねている");
    // ★★受け皿。★役職が 無ければ、★これまでどおり 役割で 分けます。
    //   ★★これが 無いと、★切り替えた その日に 全員が タブを 失います。
    t(/permsOfMember\(opsMembership, opsPostsById\) \|\| role/.test(vt),
      "★役職が 無ければ、役割に 戻る（受け皿）");
  }

  console.log("\n=== 「席」と 呼ばない（★§10-1） ===");
  t(!/席/.test(raw), "★「席」を 使っていない（★名簿の人数）");
  t(!/席/.test(readRaw("lib", "orgRoster.js")) || /「席」とは 呼びません/.test(readRaw("lib", "orgRoster.js")),
    "★lib でも 使っていない（★注記で 断るのは 可）");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
