#!/usr/bin/env node
// STRIP: B（言葉）── ★約束の 文を 見ます。★何も 落としません。
/**
 * ★その人 の 見張り（★2026-09-25・C群）。
 *
 *   ★★★見る もの ──
 *     ①★右の 8行（★「見られないもの」）が 1文字も 変わって いない か
 *     ②★健康の 記録に 手が 届いて いない か（★`entries` を 引かない）
 *     ③★ようすの 3つが **台帳の CHECK と 同じ** か（★覚えず 数え直す）
 *     ④★率（％）と「9 / 12」の 形を 出して いない か（★裁定90 §4）
 *     ⑤★字を 画面に 書き写して いない か
 *     ⑥★「変えた記録が残ります」は 約束 ── ★置き場（`ops_audit_log`）が ある か
 *
 *   ★★較正 ── ★8行の どれか を 消すと ①が 落ちる こと。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw, libUrl } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

async function main() {
  const libRaw = readRaw("lib", "sonoHito.js");
  const jsx = readRaw("components", "SonoHito.jsx");
  const jsxCode = stripComments(jsx);
  // ★★すり替えは `_source.js` の `libUrl` に 寄せました（★2026-09-26）。
  const b64 = (...q) => libUrl(q[q.length - 1]);
  const m = await import(libUrl("sonoHito"));

  console.log("=== 一 ★見られないもの 8行（★約束） ===");
  const 約 = ["声の記録", "からだの記録", "ノート・レパートリー", "受診用の 1枚",
    "時間割の 中身", "ほかの 教室の こと",
    "ほかの 教室に 通っていること そのもの", "来られない 理由"];
  t(m.HIDDEN_ROWS.length === 8, `★8行（いま ${m.HIDDEN_ROWS.length}）`);
  約.forEach((l) => t(m.HIDDEN_ROWS.includes(l), `★「${l}」`));
  t(m.HIDDEN_WORD === "画面が ありません", "★「画面が ありません」（★隠して いるのでは ない）");

  console.log("=== 二 ★健康の 記録に 手が 届いて いない ===");
  ["entries", "questionnaire_responses", "cycle_periods", "period_markers"].forEach((tb) => {
    t(!new RegExp(tb).test(jsxCode), `★${tb} に 触れて いない`);
    t(!new RegExp(tb).test(stripComments(libRaw)), `★字の 側も ${tb} に 触れて いない`);
  });
  // ★★読む 列に 健康の ものが 無い こと。
  const 列 = [m.COLS_ENROLLMENT, m.COLS_LESSON, m.COLS_ASSIGNMENT].join(",");
  ["throat", "voice", "sleep", "mood", "medication", "cycle", "health", "temperature"]
    .forEach((c) => t(!列.includes(c), `★読む 列に ${c} が 無い`));

  console.log("=== 三 ★ようすの 3つは 台帳の CHECK と 同じ（★数え直す） ===");
  const sql = fs.readFileSync(
    path.join(ROOT, "supabase", "migration_enrollment_shape_and_pause.sql"), "utf-8");
  const chk = /status\s*=\s*any\s*\(array\[([^\]]*)\]/i.exec(sql)
    || /status\s+in\s*\(([^)]*)\)/i.exec(sql);
  t(!!chk, "★台帳の 側に 3つが 書いて ある");
  if (chk) {
    const 台 = [...chk[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]).sort();
    const 画 = m.statusChoices().map((s) => s.key).sort();
    t(JSON.stringify(台) === JSON.stringify(画),
      `★同じ 3つ（台帳 ${台.join("/")} ／ 画面 ${画.join("/")}）`);
  }
  // ★★見本の「招待中」は 台帳に 無い ので 出しません。
  t(!m.statusChoices().some((s) => s.label === "招待中"), "★招待中を 出して いない");
  t(!/招き直す/.test(jsxCode), "★「招き直す」も 出して いない");

  console.log("=== 四 ★率も「9 / 12」も 出さない（★裁定90 §4） ===");
  t(!/[％%]/.test(jsxCode.replace(/width|height|100%|max-width/g, "")), "★％が 無い");
  t(m.timesWord(21) === "21回" && m.timesWord(null) === "0回", "★数 ＋ 回 だけ");
  t(!/\/\s*\$\{|回\s*\/\s*/.test(jsxCode), "★「/」で 割った 形が 無い");
  t(m.NOTE === "％を 出しません。実数だけ。健康に関するものは 1つも ありません。",
    "★下の 断りが 見本の まま");

  console.log("=== 五 ★字を 画面に 書き写して いない ===");
  約.forEach((l) => t(!jsx.includes('"' + l + '"'), `★直書きして いない …… ${l.slice(0, 10)}…`));
  t(/from "@\/lib\/sonoHito"/.test(jsx), "★字は lib から 受け取って いる");
  // ★★ようすの 字は `orgRoster` の もの。★`sonoHito` で 書き直して いない。
  t(!/在籍中|休会|退会/.test(stripComments(libRaw)), "★ようすの 札を 書き写して いない");

  console.log("=== 六 ★「変えた記録が残ります」の 置き場が ある ===");
  t(m.CHANGE_LOGGED.indexOf("誰が・いつ・何から何へ") > 0, "★約束の 字が ある");
  // ★★`ops_audit_log` が 誰が・いつ・何から何へ を 持って いる こと。
  const 台帳 = fs.readFileSync(path.join(ROOT, "lib", "backupTables.js"), "utf-8");
  t(/ops_audit_log/.test(台帳), "★`ops_audit_log` が 台帳の 一覧に ある");
  // ★★つなぐ ときに 置く、と 紙に 書いて ある こと。
  const 待 = fs.readFileSync(path.join(ROOT, "tools", "not_wired_yet.json"), "utf-8");
  t(/SonoHito/.test(待), "★まだ つないで いない、と 書いて ある");
  t(/ops_audit_log/.test(待), "★つなぐ ときに 置く、と 書いて ある");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail) process.exit(1);
}
main();
