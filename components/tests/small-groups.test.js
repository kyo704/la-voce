#!/usr/bin/env node
// ============================================================================
// 5人未満の かたまりを 出さない（2026-09-10）の 見張り
//
//   ★出どころ 坂本さん経由・Opus（2026-09-10）
//
//   ★★確かめること
//     ① 5人に 満たなければ、★数を 出さないこと。
//     ② 0 も 出さないこと（★0 も 中身の 1つ）。
//     ③ 合計は 出せること（★分けたときにだけ 効く）。
//     ④ 決めが 1か所に あること（★画面で 数を 書かない）。
//     ⑤ 行事・名簿に 効いていること。
// ============================================================================

const fs = require("fs");
const path = require("path");
const os = require("os");
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sg-"));
  ["smallGroups", "orgEventsView"].forEach((n) => {
    fs.writeFileSync(path.join(dir, n + ".js"),
      fs.readFileSync(path.join(__dirname, "..", "..", "lib", n + ".js"), "utf8")
        .replace(/@\/lib\/([a-zA-Z]+)/g, "./$1.js"));
  });
  const m = await import("file://" + path.join(dir, "smallGroups.js"));
  const ev = await import("file://" + path.join(dir, "orgEventsView.js"));

  console.log("=== ① 5人が 境目 ===");
  eq(m.MIN_GROUP, 5, "5人");
  [0, 1, 2, 3, 4].forEach((n) => eq(m.mayShowGroup(n), false, `${n}人は 出さない`));
  [5, 6, 54].forEach((n) => eq(m.mayShowGroup(n), true, `${n}人は 出せる`));
  eq(m.mayShowGroup(null), false, "★分からなければ 出さない");
  eq(m.mayShowGroup("うそ"), false, "★数でなければ 出さない");

  console.log("\n=== ② 分母で 決める（★分子では ない） ===");
  eq(m.groupCountWord(0, 3), null, "★3人のうち 0人 も 出さない");
  eq(m.groupCountWord(2, 3), null, "★3人のうち 2人 も 出さない");
  eq(m.groupCountWord(0, 5), "0/5", "★5人なら、0人でも 出せる");
  eq(m.groupCountWord(41, 54), "41/54", "見本④の 数");
  t(/分子では なく、★分母で 決めます/.test(readRaw("lib", "smallGroups.js")),
    "★分母で 決める、と 書いてある");

  console.log("\n=== ③ 落としたことを 黙らない ===");
  const f = m.filterGroups([
    { label: "1年", part: 12, size: 14 },
    { label: "3年", part: 2, size: 3 },
    { label: "4年", part: 1, size: 2 }
  ]);
  eq(f.shown.length, 1, "出せるのは 1つ");
  eq(f.hidden, 2, "★落とした数を 返す（★黙って 減らさない）");
  eq(m.TOO_SMALL_NOTE, "人数が少ないため、内訳は出していません。", "★断りの 言葉");
  t(!/少なすぎ|不足|出せません$/.test(m.TOO_SMALL_NOTE), "★責める言葉に なっていない");

  console.log("\n=== ④ ようすの 内訳 ===");
  eq(m.safeBreakdown({ paused: 2, invited: 0 }), { paused: null, invited: 0 },
    "★2人は 隠す。★0人は 出す");
  eq(m.safeBreakdown({ paused: 7, invited: 5 }), { paused: 7, invited: 5 }, "5人以上は 出す");
  eq(m.safeBreakdown({}), { paused: 0, invited: 0 }, "空は 0");
  t(/0 は「誰も いない」であって、★誰かを 指しません/.test(readRaw("lib", "smallGroups.js")),
    "★0 を 出すわけが 書いてある");

  console.log("\n=== ⑤ 行事に 効いている ===");
  eq(ev.joinedWord(2, 3), null, "★3人の 行事は、数を 出さない");
  eq(ev.joinedWord(41, 54), "41/54", "54人なら 出す");
  eq(ev.joinedWord(0, 0), null, "対象が 0 なら null（★もとから）");
  {
    const evs = [{ id: 1, event_date: "2026-09-14", title: "小さい行事" }];
    const rows = ev.buildEvents(evs, [{ org_event_id: 1 }, { org_event_id: 1 }], () => 3);
    eq(rows[0].countWord, null, "★組み立てた あとも、数が 出ない");
    t(rows[0].label !== null, "★ようす（受付中 など）は 出す");
  }

  console.log("\n=== 決めは 1か所 ===");
  const roster = readCode("components", "OpsRoster.jsx");
  t(/safeBreakdown\(/.test(roster), "★名簿は lib に 尋ねている");
  t(!/>= 5|< 5|MIN_GROUP = /.test(roster), "★画面で 5 を 書いていない");
  const evUi = readCode("components", "OpsEvents.jsx");
  t(!/>= 5|< 5/.test(evUi), "★行事の画面でも 5 を 書いていない");
  t(/mayShowGroup/.test(readCode("lib", "orgEventsView.js")), "★行事の lib は 尋ねている");
  t(!/MIN_GROUP\s*=\s*\d/.test(readCode("lib", "orgEventsView.js")), "★数を 書き写していない");

  console.log("\n=== 合計は 出せる ===");
  const r = readCode("components", "OpsRoster.jsx");
  t(/数える人数/.test(readRaw("components", "OpsRoster.jsx")), "★数える人数は 出している");
  t(!/safeBreakdown\(counted\)|mayShowGroup\(counted\)/.test(r), "★合計に かけていない");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
