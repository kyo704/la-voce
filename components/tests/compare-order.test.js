#!/usr/bin/env node

// ============================================================================
// くらべる ── 「調べていることの 順番」の 見張り
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の SC['順番']（★git hash 7c7c720）
//
//   ★★確かめること
//     ① 5つまで。★重なりと 知らない 鍵を 通さない
//     ② 上へ 動かせる。★いちばん 上は 動かない
//     ③ 調べるのは 1番目だけ（★検定は 1回）
//     ④ 見本の 字を、★1文字も 変えていない
//     ⑤ 好きな ものを 直に 選べない（★見てから 選び直せない）
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
  const load = async (rel) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", rel), "utf-8");
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const o = await load("lib/compareOrder.js");
  const KNOWN = ["dinnerToBed", "sleepHours", "speechMinutes", "morningEdema",
    "humidity", "bedtime", "markFat"];

  console.log("① 5つまで。重なりと 知らない 鍵を 通さない");
  eq(o.ORDER_MAX, 5, "★5つまで（★見本「5つまで」）");
  eq(o.cleanOrder(["a", "b"], KNOWN), [], "★知らない 鍵は 通さない");
  eq(o.cleanOrder(["sleepHours", "sleepHours"], KNOWN), ["sleepHours"], "★重なりを 落とす");
  eq(o.cleanOrder(KNOWN, KNOWN).length, 5, "★6つ 渡しても 5つ");
  eq(o.cleanOrder(null, KNOWN), [], "★無くても 落ちない");
  eq(o.ORDER_DEFAULT.length, 5, "★はじめの 並びは 5つ");
  // ★★見本の SIRA と 同じ 並びで あること
  eq([...o.ORDER_DEFAULT],
    ["dinnerToBed", "sleepHours", "speechMinutes", "morningEdema", "humidity"],
    "★見本の SIRA の 並びの まま");

  console.log("\n② 上へ 動かせる");
  eq(o.moveUp(["a", "b", "c"], 1), ["b", "a", "c"], "★1つ 上へ");
  eq(o.moveUp(["a", "b", "c"], 0), ["a", "b", "c"], "★いちばん 上は 動かない");
  eq(o.moveUp(["a", "b", "c"], 9), ["a", "b", "c"], "★外れた 番号でも 落ちない");
  {
    const base = ["a", "b", "c"];
    o.moveUp(base, 1);
    eq(base, ["a", "b", "c"], "★もとの 並びを 書き換えない");
  }

  console.log("\n③ 調べるのは 1番目だけ");
  eq(o.testedCount(), 1, "★検定は いつも 1回（★見本「1番目だけ」）");
  eq(o.firstOf(["x", "y"]), "x", "★1番目を 返す");
  eq(o.firstOf([]), null, "★空なら null");
  // ★★1回なので、★たくさん 撃った ぶんの 上のせが かかりません。
  const g = await load("lib/displayGates.js").catch(() => null);
  if (g) t(g.minEffectSizeFor(o.testedCount()) === 0.5,
    "★上のせ なし（★差の 大きさ 0.50）");

  console.log("\n④ 見本の 字（★1文字も 変えない）");
  const mihon = fs.readFileSync(path.join(__dirname, "..", "..",
    "docs", "design", "pack-final", "00-動く見本（さわれる・全画面）.html"), "utf8");
  [
    o.ORDER_COPY.title,
    o.ORDER_COPY.warnA,
    o.ORDER_COPY.warnB,
    o.ORDER_COPY.firstNote,
    o.ORDER_COPY.restNote,
    o.ORDER_COPY.recount
  ].forEach((w) => {
    t(mihon.includes(w), "「" + w.slice(0, 26) + "」が 見本に ある");
  });
  o.ORDER_COPY.notes.forEach((w) => {
    // ★★見本は <b> で 途中を 太字に しています。★札を 外して くらべます。
    const flat = w.replace(/。$/, "");
    t(mihon.replace(/<[^>]*>/g, "").includes(flat.slice(0, 14)),
      "★note「" + flat.slice(0, 18) + "」");
  });

  console.log("\n⑤ 好きな ものを 直に 選べないこと");
  const ui = readCode("components", "CompareV2.jsx");
  // ★★見てから 選び直せると、★いちばん よく見える 組を 選べてしまいます。
  t(!/ITEMS\.map\(\(it\)/.test(ui), "★項目の 札を 並べていない");
  t(/firstOf\(order\)/.test(ui), "★調べるのは 順番の 1番目");
  t(/setShowOrder\(true\)/.test(ui), "★順番の 画面へ 行ける");
  t(/ORDER_COPY\.recount/.test(ui), "★入れ替えたら 数え直す、と 出す");
  // ★★端末の 覚え書きです。★列を 増やしていません。
  t(!/supabase|from\("/.test(readRaw("lib", "compareOrder.js")),
    "★並びを 台帳に 書いていない（★端末の 覚え書き）");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
