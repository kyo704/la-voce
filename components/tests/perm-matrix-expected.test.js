#!/usr/bin/env node

// ============================================================================
// §3 ★50通り ── ★第1層：★実装の 役職定義が、★期待表と 合っていること
//
//   ★出どころ docs/opus/期待表-権限の総当たり（9月11日）.json（★Opus・9月11日）
//     ★★見本 動く見本-PC.html から 機械で 作られた 表です。
//
//   ★★これは 3つの 層の うち、★1つ目 だけです。
//     ★① 紙の 層 …… lib/opsPerms.js の できことが 期待表と 合うか ← ★これ
//     ★② 台帳の 層 …… 決まり（RLS）が 実際に 止めるか
//     ★③ 通しの 層 …… API／ブラウザからの 要求が 実際に 止まるか
//   ★★①が 通っても、★②③が 通るとは 限りません。
//     ★★できことの 一覧が 正しくても、★決まりが 見ていなければ 素通りします。
//     ★★だから この見張りは「合っています」とは 言いません。
//       ★★「役職の 定義は、★期待表と 同じです」と だけ 言います。
// ============================================================================

const fs = require("fs");
const path = require("path");

let ok = 0, ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

const EXP = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..",
  "docs", "opus", "期待表-権限の総当たり（9月11日）.json"), "utf8"));

// ★★期待表の 規則を、★そのまま 写します（★言い換えません）。
//   ★★"meibo" → その できことを 持っているか。
const RULE = {
  "名簿":            (h) => h("meibo"),
  "役職と 所属":     (h) => h("post") || h("master"),
  "レッスンの 日程": (h) => h("sched_all") || h("sched_mine"),
  "レッスンの 出席": (h) => h("shukketsu") && (h("sched_all") || h("meibo")),
  "行事":            (h) => h("gyoji")
};
const READ_RULE = (h) => h("meibo") && h("master");

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "opsPerms.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const POSTS = m.TEMPLATE_POSTS;

  console.log("① 役職の 数と 名前");
  t(POSTS.length === 10, "★役職は 10");
  t(Object.keys(EXP.期待).length === 10, "★期待表も 10");
  Object.keys(EXP.期待).forEach((name) => {
    t(POSTS.some((p) => p.name === name), "★「" + name + "」が 実装に ある");
  });

  console.log("\n② 50マス（★10役職 × 5つの表）");
  const TABLES = Object.keys(RULE);
  const diff = [];
  let cells = 0;
  Object.entries(EXP.期待).forEach(([name, e]) => {
    const post = POSTS.find((p) => p.name === name);
    if (!post) return;
    const has = (k) => post.perms.includes(k);
    TABLES.forEach((tb) => {
      cells++;
      const got = !!RULE[tb](has);
      const want = !!e.書き出し[tb];
      if (got !== want) diff.push({ name, tb, want, got });
    });
  });
  t(cells === 50, "★50マス ちょうど 見た（★" + cells + "）");
  diff.forEach((d) => console.log(
    "    ✗ ★" + d.name + " × " + d.tb + "　期待 " + d.want + " / 実装 " + d.got));
  t(diff.length === 0, "★50マス すべて 期待表の とおり");

  console.log("\n③ 読み込み（★10マス）");
  const rdiff = [];
  Object.entries(EXP.期待).forEach(([name, e]) => {
    const post = POSTS.find((p) => p.name === name);
    if (!post) return;
    const got = !!READ_RULE((k) => post.perms.includes(k));
    if (got !== !!e.読み込み) rdiff.push({ name, want: !!e.読み込み, got });
  });
  rdiff.forEach((d) => console.log(
    "    ✗ ★" + d.name + " × 読み込み　期待 " + d.want + " / 実装 " + d.got));
  t(rdiff.length === 0, "★読み込み 10マス すべて 期待表の とおり");

  console.log("\n④ 規則の 写しちがいが ないこと");
  // ★★私が 規則を 言い換えて いないか。★期待表の 字と つき合わせます。
  t(EXP.規則["レッスンの 出席"] === "shukketsu AND (sched_all OR meibo)",
    "★出席の 規則を そのまま 写している");
  t(EXP.規則["読み込み"] === "meibo AND master", "★読み込みの 規則を そのまま 写している");
  t(EXP.規則["既定"].includes("false"), "★知らない 表は false");

  console.log("\n★★この見張りが 見ていないこと");
  console.log("　★決まり（RLS）が 実際に 止めるか ── ★台帳の 層");
  console.log("　★API／ブラウザの 要求が 実際に 止まるか ── ★通しの 層");
  console.log("　★★定義が 正しくても、★決まりが 見ていなければ 素通りします。");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
