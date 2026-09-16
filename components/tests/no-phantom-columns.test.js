/**
 * ★台帳に 無い 列を、★引きに 行って いないか。
 *
 *   ★★2026-09-16。★`lessons` の 引く 列に `held` が 入って いました。
 *     ★★そんな 列は ありません。★400 が 返り、★2つの 読みが 両方 落ち、
 *       ★「次のレッスンは、いま 読めませんでした」が 出て いました。
 *     ★★`supabase/migration_lesson_held.sql` は 書かれて います。
 *       ★★けれど 一度も 流れて いません。
 *       ★★**移行の ファイルが ある ことは、★列が 在る 証しに なりません。**
 *     ★★2026-09-08 に すでに 分かって いて、★書き残しも ありました。
 *       ★★9月15日に 書いた `lib/classroomShell.js` が、★それを 読まずに
 *         ★古い 名を 持って きて しまいました。
 *
 *   ★★覚え書きは `lib/absentColumns.js` が 1つで 持ちます。
 */
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "absentColumns.js"), "utf8");
  const m = await import(
    "data:text/javascript;base64," + Buffer.from(src, "utf8").toString("base64"));

  console.log("\n=== ★覚え書きの 形 ===");
  t("★1つ 以上 ある", m.ABSENT_COLUMNS.length > 0);
  m.ABSENT_COLUMNS.forEach((a) => {
    t(`★${a.table}.${a.column} に 根拠が ある`,
      Boolean(a.confirmedOn && a.evidence));
    t(`★${a.table}.${a.column} に 代わりが 書いて ある`, Boolean(a.insteadUse));
  });

  console.log("\n=== ★較正 ── ★当たる ものが 当たるか ===");
  t("★★held を 混ぜたら 見つかる",
    m.phantomColumnsIn("lessons", "id, scheduled_at, held").includes("held"));
  t("★正しい 並びでは 何も 出ない",
    m.phantomColumnsIn("lessons", "id, scheduled_at, attendance").length === 0);
  t("★別の 表なら 当たらない",
    m.phantomColumnsIn("entries", "id, held").length === 0);
  t("★似た 名に 当たらない",
    m.phantomColumnsIn("lessons", "id, withheld_at").length === 0);

  console.log("\n=== ★引く 列の 並びを、★1つずつ 見る ===");
  // ★★`from("表").select("…")` と、★`lib` の `*_COLUMNS` の 両方を 見ます。
  const files = [];
  ["lib", "components", "app"].forEach((d) => {
    (function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== "tests") walk(full); }
        else if (/\.jsx?$/.test(e.name)) files.push(full);
      });
    })(path.join(ROOT, d));
  });
  t("★読む ファイルが ある（★立ち会い）", files.length > 0);

  let 見た = 0;
  const 見つけた = [];
  files.forEach((f) => {
    const code = readCode(path.relative(ROOT, f));
    // ① from("表") … select("…")
    const re = /\.from\(\s*"([a-z_]+)"\s*\)\s*\n?\s*\.select\(\s*"([^"]*)"/g;
    let x;
    while ((x = re.exec(code))) {
      見た += 1;
      m.phantomColumnsIn(x[1], x[2]).forEach((c) =>
        見つけた.push(`${path.relative(ROOT, f)} … ${x[1]}.${c}`));
    }
    // ② LESSON_COLUMNS のような 並び（★表の 名を 名前から 当てます）
    const re2 = /const\s+([A-Z_]+)_COLUMNS\s*=\s*\n?\s*"([^"]*)"/g;
    while ((x = re2.exec(code))) {
      見た += 1;
      const 表 = x[1].toLowerCase() + "s";
      m.phantomColumnsIn(表, x[2]).forEach((c) =>
        見つけた.push(`${path.relative(ROOT, f)} … ${表}.${c}`));
    }
  });
  t(`★引く 並びを ${見た} か所 見た`, 見た > 10);
  t("★★台帳に 無い 列を 引いて いない"
    + (見つけた.length ? "\n         " + 見つけた.join("\n         ") : ""),
    見つけた.length === 0);

  console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
  process.exit(落ち === 0 ? 0 : 1);
})();
