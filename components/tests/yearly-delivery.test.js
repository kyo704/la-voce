// ============================================================================
// 年払いの 244点を、一度に お届けする（2026-09-08 夜）
//
//   ★出どころ 2026-09-08・坂本さんのお決め
//     ★箱3は「着せかえだけ」（★290点）。★内装も 古いお店101点も 入れません。
//
//   ★★守ること
//     ・★244点に なるまで 渡す（★もう持っている ぶんを 引く）
//     ・★重ねない（★同じ品を 2度 渡さない）
//     ・★かたよらない（★部位ごとの 比を 保つ）
//     ・★運を 使わない（★同じ人・同じ持ち物なら 同じ結果）
//     ・★箱1（記念）と 箱2（記録で交換）を 混ぜない
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

// ★★取り込みを たどって、★1つの本文に します（★@/ は 解けないため）。
function inline(rel) {
  let src = fs.readFileSync(path.join(ROOT, rel), "utf-8");
  src = src.replace(/^import \{([^}]*)\} from "@\/lib\/([a-zA-Z0-9]+)";$/gm,
    (_, names, mod) => inline("lib/" + mod + ".js").replace(/^export /gm, ""));
  return src;
}

(async () => {
  const src = inline("lib/yearlyDelivery.js");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  const w = JSON.parse(fs.readFileSync(
    path.join(ROOT, "docs", "assets", "sheep-items-index.json"), "utf-8"));
  const wear = Array.isArray(w) ? w : w.items;
  const byKey = Object.fromEntries(wear.map((i) => [i.key, i]));

  console.log("■ ★箱3の 束");
  const pool = m.box3Keys(wear);
  // ★★287点です。★290 では ありません（★2026-09-08 夜・数え直し）。
  //   ★★はじめ 290 と ご報告しました。★誤りでした。
  //     ★UNLOCKS を 荒く 拾って 数えていました。
  //   ★★boxOf に 通して 数えると 287 です。
  //     ★413 ＝ 箱1 56 ＋ 箱2 70 ＋ 箱3 287。
  ok(`★287点（いま ${pool.length}）`, pool.length === 287);
  ok("★重なりが ない", new Set(pool).size === pool.length);
  ok("★すべて 着せかえ（★内装が 混ざっていない）",
    pool.every((k) => byKey[k] && byKey[k].slot));

  console.log("■ ★はじめての方");
  const r = m.planYearlyDelivery(wear, []);
  ok(`★244点 渡す（いま ${r.deliver.length}）`, r.deliver.length === 244);
  ok("★足りない ぶんが ない", r.short === 0);
  ok("★重ねていない", new Set(r.deliver).size === r.deliver.length);
  ok("★すべて 箱3の 中から", r.deliver.every((k) => pool.includes(k)));

  console.log("■ ★かたよらないこと");
  const poolBy = {}; for (const k of pool) poolBy[byKey[k].slot] = (poolBy[byKey[k].slot] || 0) + 1;
  const gotBy = {}; for (const k of r.deliver) gotBy[byKey[k].slot] = (gotBy[byKey[k].slot] || 0) + 1;
  // ★★どの部位も、★束の中の 割合に 近いこと（★ずれ 3点まで）。
  const off = [];
  for (const [slot, n] of Object.entries(poolBy)) {
    const want = Math.round(244 * n / pool.length);
    const got = gotBy[slot] || 0;
    if (Math.abs(got - want) > 3) off.push(`${slot} ${got}/${want}`);
  }
  ok("★★部位の 比が 保たれている", off.length === 0, off.join(" "));
  ok("★どの部位も 1点は 入っている",
    Object.keys(poolBy).every((s) => (gotBy[s] || 0) > 0),
    JSON.stringify(gotBy));

  console.log("■ ★重ねないこと");
  const r2 = m.planYearlyDelivery(wear, r.deliver);
  ok("★★2度目は、渡さない", r2.deliver.length === 0 && r2.already === 244);
  const some = r.deliver.slice(0, 50);
  const r3 = m.planYearlyDelivery(wear, some);
  ok(`★50点 持っていれば 194点（いま ${r3.deliver.length}）`, r3.deliver.length === 194);
  ok("★もう 持っているものを 渡していない",
    r3.deliver.every((k) => !some.includes(k)));

  console.log("■ ★運を 使わないこと");
  const a = m.planYearlyDelivery(wear, []);
  const b = m.planYearlyDelivery(wear, []);
  ok("★★何度 呼んでも 同じ", JSON.stringify(a.deliver) === JSON.stringify(b.deliver));
  // ★★禁じた言葉の検めは、★注釈を外してから 見ること（★CLAUDE.md）。
  //   ★★「Math.random を 使いません」と 説明に 書いてあります。
  //     ★外さずに 見ると、★自分の説明で 落ちます。★この罠は 4度目です。
  const code = readCode("lib", "yearlyDelivery.js");
  ok("★Math.random を 使っていない", !/Math\.random/.test(code));

  console.log("■ ★箱を 混ぜないこと");
  const b2 = fs.readFileSync(path.join(ROOT, "lib", "wardrobeBoxes.js"), "utf-8");
  const box2 = [...(/const BOX2_KEYS = Object\.freeze\(\[([\s\S]*?)\]\)/.exec(b2)[1])
    .matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  ok("★★箱2（記録で交換）が 混ざっていない",
    !r.deliver.some((k) => box2.includes(k)));
  ok("★★箱1（記念）が 混ざっていない",
    !r.deliver.some((k) => ["opera", "stage"].includes(byKey[k].group)));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
