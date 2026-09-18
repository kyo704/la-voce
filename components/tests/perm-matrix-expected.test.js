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
// ★★`@/` を 解く 決めは _source.js が 1つ 持ちます（★見張りごとに 写しません）。
const { loadLib } = require("./_source");

let ok = 0, ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

const EXP = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..",
  "docs", "opus", "期待表-権限の総当たり（9月11日）.json"), "utf8"));

// ★★規則は 期待表から **読み取ります**。★写しを 持ちません。
//
//   ★★2026-09-13、★ここに 写しを 置いて いました。
//     ★★期待表の ほうを「post OR master」→「post」に 直したのに、
//       ★★この 写しが 古い まま で、★見張りが 落ちました。
//     ★★同じ 決めごとが 2か所に ある、★この 帳面が いちばん 繰り返して きた 形です。
//     ★★だから 写しを 捨てて、★期待表の 字から その場で 組み立てます。
//
//   ★★字の 形は 小さいので、★そのまま 読めます ──
//     `meibo` ／ `post` ／ `A OR B` ／ `A AND (B OR C)`
const RULE_SRC = EXP.規則;

/** ★規則の 字を 読んで、★はい／いいえ を 返します。 */
function evalRule(src, has) {
  // ★★丸かっこの 中を 先に 片づけます。
  let t = String(src);
  for (let i = 0; i < 8 && t.includes("("); i++) {
    t = t.replace(/\(([^()]*)\)/, (m, inner) => (evalRule(inner, has) ? "TRUE" : "FALSE"));
  }
  // ★★AND は OR より 強く つなぎます。
  return t.split(/\s+OR\s+/).some((orPart) =>
    orPart.split(/\s+AND\s+/).every((k) => {
      const key = k.trim();
      if (key === "TRUE") return true;
      if (key === "FALSE") return false;
      return has(key);
    }));
}

const RULE = {};
["名簿", "役職と 所属", "レッスンの 日程", "レッスンの 出席", "行事"].forEach((w) => {
  RULE[w] = (h) => evalRule(RULE_SRC[w], h);
});
const READ_RULE = (h) => evalRule(RULE_SRC["読み込み"], h);

(async () => {
  const m = await loadLib("lib", "opsPerms.js");
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

  console.log("\n④ 規則の 字が 読めて いること");
  // ★★写しを 持たなく なったので、★「言い換えて いないか」は 問いません。
  //   ★★代わりに、★字を 読む 仕掛けが 正しく 動くかを 見ます。
  //   ★★読めない 字が 来たら、★黙って false に せず、★ここで 気づける ように。
  const H = (set) => (k) => set.includes(k);
  t(evalRule("meibo", H(["meibo"])) === true, "★1つの 鍵");
  t(evalRule("meibo", H([])) === false, "★持って いなければ いいえ");
  t(evalRule("a OR b", H(["b"])) === true, "★または");
  t(evalRule("a AND b", H(["a"])) === false, "★かつ（★片方 だけ）");
  t(evalRule("a AND (b OR c)", H(["a", "c"])) === true, "★かっこの 中の または");
  t(evalRule("a AND (b OR c)", H(["a"])) === false, "★かっこの 中が どちらも 無い");
  t(EXP.規則["既定"].includes("false"), "★知らない 表は false");
  // ★★いま 期待表に 書いて ある 字を、★そのまま 並べて おきます。
  //   ★★人が 読んで 気づける ように（★機械は 上で 見て います）。
  Object.entries(EXP.規則).forEach(([k, v]) => console.log("    " + k + "　" + v));

  console.log("\n★★この見張りが 見ていないこと");
  console.log("　★決まり（RLS）が 実際に 止めるか ── ★台帳の 層");
  console.log("　★API／ブラウザの 要求が 実際に 止まるか ── ★通しの 層");
  console.log("　★★定義が 正しくても、★決まりが 見ていなければ 素通りします。");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
