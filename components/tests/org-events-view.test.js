#!/usr/bin/env node
// ============================================================================
// 行事・運営ホーム・設定（第3便・見本①④⑤）の 見張り
//
//   ★出どころ docs/opus/woolsong-見本-運営モード8点（9月9日）.jpg ①④⑤
//
//   ★★確かめること
//     ① 取り下げても、★除いて 出さないこと。
//     ② まだ 押していない方の 中身を 出さないこと（★数だけ）。
//     ③ ％を 出さないこと。★「41/54」と 数で 書くこと。
//     ④ 対象が 0 なら「おしらせ」。★0/0 と 書かないこと。
//     ⑤ 重なりは 印だけ。★勝手に 動かさないこと。
//     ⑥ 料金の 表を 書き写していないこと（★lib から 組み立てる）。
//     ⑦ 3つの画面とも、★健康の 記録に たどりつけないこと。
//     ⑧ 押しどころは 44pt 以上。★操作は 下半分。
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
  // ★★orgEventsView は lib/smallGroups.js を 読みます（★2026-09-10）。
  //   ★連れも 一緒に 写します。★本物を 読みます。★偽物を 置きません。
  const os = require("os");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oev-"));
  ["orgEventsView", "smallGroups"].forEach((n) => {
    fs.writeFileSync(path.join(dir, n + ".js"),
      fs.readFileSync(path.join(__dirname, "..", "..", "lib", n + ".js"), "utf8")
        .replace(/@\/lib\/([a-zA-Z]+)/g, "./$1.js"));
  });
  const m = await import("file://" + path.join(dir, "orgEventsView.js"));

  const evs = [
    { id: 1, event_date: "2026-09-14", title: "実技試験" },
    { id: 2, event_date: "2026-09-28", title: "学内演奏会" },
    { id: 3, event_date: "2026-10-12", title: "休講" },
    { id: 4, event_date: "2026-09-20", title: "やめた行事", withdrawn_at: "2026-09-09" }
  ];
  const parts = [];
  for (let i = 0; i < 41; i++) parts.push({ org_event_id: 1, user_id: `u${i}` });
  for (let i = 0; i < 28; i++) parts.push({ org_event_id: 2, user_id: `v${i}` });
  const targetOf = (e) => (e.id === 1 ? 54 : e.id === 2 ? 28 : 0);
  const rows = m.buildEvents(evs, parts, targetOf);

  console.log("=== ① 取り下げても 除かない ===");
  eq(rows.length, 4, "★4件とも 残っている");
  t(rows.some((x) => x.state === m.EVENT_STATES.WITHDRAWN), "★取り下げた ものも ある");
  eq(m.stateLabel(m.EVENT_STATES.WITHDRAWN), "取り下げました", "その言葉");
  eq(m.actionsFor(m.EVENT_STATES.WITHDRAWN), [], "★取り下げた ものに、できることは 無い");
  t(/除いて 出しません/.test(readRaw("lib", "orgEventsView.js")), "★除かない、と 書いてある");
  const ui = readCode("components", "OpsEvents.jsx");
  t(/opacity: withdrawn \? 0\.55 : 1/.test(ui), "★薄くして、★消していない");
  t(!/filter\([^)]*withdrawn_at/.test(ui), "★画面でも、取り下げを ふるい落としていない");

  console.log("\n=== ② 中身を 出さない（★数だけ） ===");
  eq(rows[0].countWord, "41/54", "★「41/54」と 数で 書く");
  t(!/participants\.map|joined\.map|誰が|未回答の方/.test(ui), "★まだの方を 並べていない");
  t(!/user_id/.test(ui), "★画面が 誰かを 見ていない");

  console.log("\n=== ③ ％を 出さない ===");
  ["％", "パーセント", "率", "割合"].forEach((w) => {
    t(!ui.includes(w), `★「${w}」を 出さない`);
    t(!readCode("lib", "orgEventsView.js").includes(w), `★lib も 「${w}」を 持たない`);
  });
  {
    const shown = ui.replace(/`[^`]*%`/g, "").replace(/"\d+%"/g, "");
    t(!/%/.test(shown), "★読み手に ％を 見せない");
  }

  console.log("\n=== ④ 対象が 0 なら おしらせ ===");
  const notice = rows.find((x) => x.ev.id === 3);
  eq(notice.state, m.EVENT_STATES.NOTICE, "休講は おしらせ");
  eq(notice.countWord, null, "★0/0 と 書かない");
  eq(m.joinedWord(0, 0), null, "★対象が 0 なら null");
  eq(m.joinedWord(3, 10), "3/10", "対象が あれば 数で");
  const ready = rows.find((x) => x.ev.id === 2);
  eq(ready.state, m.EVENT_STATES.READY, "★そろったら そろいました");
  eq(m.stateLabel(m.EVENT_STATES.OPEN), "受付中", "まだなら 受付中");

  console.log("\n=== ⑤ 重なりは 印だけ（★見本①） ===");
  const home = readRaw("components", "OpsHome.jsx");
  t(/重なりは印をつけるだけです。こちらで勝手に動かしません。/.test(home),
    "★見本①の 一文を、1文字も 変えずに 出している");
  t(!/autoMove|自動で 直/.test(readCode("components", "OpsHome.jsx")), "★動かす 仕掛けが 無い");

  console.log("\n=== ⑥ 料金の 表を 書き写していない ===");
  const set = readCode("components", "OpsSettings.jsx");
  t(/TIERS\.map/.test(set), "★段を lib から 組み立てている");
  t(!/400円|350円|250円|12,800|12800/.test(set), "★金額を 画面に 書き写していない");
  t(/MONTHLY_FLOOR|SETUP_FEE|YEARLY_FREE_MONTHS/.test(set), "★下限・初期費用も lib から");
  t(!/席/.test(readRaw("components", "OpsSettings.jsx")), "★「席」と 呼んでいない");

  console.log("\n=== ⑦ 健康の 記録に たどりつけない ===");
  ["OpsHome.jsx", "OpsEvents.jsx", "OpsSettings.jsx"].forEach((f) => {
    const c = readCode("components", f);
    ["throatCondition", "voiceQuality", "sleepHours", "entries", "throat_symptoms"]
      .forEach((w) => t(!c.includes(w), `★${f}：「${w}」に 触れていない`));
    const imports = (c.match(/^import[\s\S]*?from "[^"]+";/gm) || []).join("\n");
    ["VocalTracker", "HomeV2", "LookBackV2", "CompareV2", "CountV2"]
      .forEach((n) => t(!imports.includes(n), `★${f}：${n} を import して いない`));
    t(!/supabase|createClient/.test(c), `★${f}：データベースを 引かない`);
  });
  // ★★見本⑤の「画面が ありません」を、★そのまま 書けること
  t(/画面が ありません/.test(readRaw("components", "OpsSettings.jsx")),
    "★設定に「画面が ありません」と 書いてある（★嘘に ならない）");

  console.log("\n=== ⑧ 押しどころ ===");
  ["OpsHome.jsx", "OpsEvents.jsx"].forEach((f) => {
    const raw = readRaw("components", f);
    const parts2 = raw.split("<button").slice(1);
    const noH = parts2.filter((p) => !/minHeight/.test(p.slice(0, (p.indexOf("</button>") + 1) || 400)));
    t(noH.length === 0, `★${f}：高さの 無い 押しどころが 無い（${parts2.length}件）`);
    const mins = (raw.match(/minHeight: (\d+)/g) || []).map((x) => Number(x.replace(/\D/g, "")));
    if (mins.length) t(Math.min(...mins) >= 44, `★${f}：最小 ${Math.min(...mins)}pt`);
  });
  {
    // ★★行事を 出す は、★一覧の あと（★下半分）
    const raw = readRaw("components", "OpsEvents.jsx");
    t(raw.indexOf("行事を 出す") > raw.indexOf("rows.map("), "★足すのは 一覧の あと");
  }

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
