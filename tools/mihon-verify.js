#!/usr/bin/env node

// ============================================================================
// 動く見本と 実装の 突き合わせ ── ★言葉の 有無だけを 見ます
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//
//   ★★この道具が できること／できないこと（★先に 書きます）
//     ◯ ★見本に 出る 日本語が、★実装の どこにも 無いことを 見つける
//     ✕ ★見た目が 見本と 同じか　　　　　★分かりません
//     ✕ ★並び順が 見本と 同じか　　　　　★分かりません
//     ✕ ★古いものが 余分に 出ていないか　★分かりません
//
//   ★★2026-09-11、★前の 道具（screen-check.js）が
//     ★A03 を 14/14 と 報告し、★実機は まったく 別物でした。
//     ★★原因は 2つ ── ①静止画（24時間 古い）を 見ていた
//     　　　　　　　　　②片道だった（★余分なものが 見えない）
//     ★★①は 直りました（★動く見本を 読みます）。
//     ★★②は 直っていません。★だから「✕」を 上に 書きました。
//     ★★この道具の 結果を「完成」の 根拠に しないこと。
//
//   使い方  node tools/mihon-verify.js <画面の名前>
//           node tools/mihon-verify.js --all
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MIHON = path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html");
const src = fs.readFileSync(MIHON, "utf8");

/** ★見本の 中の、★1つの 画面の 本文を 切り出します。 */
function bodyOf(name) {
  const heads = [
    "function " + name + "(",
    "SC['" + name + "']=",
    "SH['" + name + "']="
  ];
  for (const h of heads) {
    const i = src.indexOf(h);
    if (i < 0) continue;
    const rest = src.slice(i + h.length);
    const m = /\n(?:function [A-Za-z_]+\(|SC\['|SH\['|\/\* )/.exec(rest);
    return rest.slice(0, m ? m.index : Math.min(rest.length, 8000));
  }
  return null;
}

/**
 * ★画面に 出る 日本語だけを 取り出します。
 *
 *   ★★見本は 文字列を つなげて HTML を 作ります。
 *     ★'…' の 中から、★HTMLの 札を 外し、★日本語の 続きだけを 拾います。
 *   ★★差し込み（'+x+'）で 切れた 断片も、★そのまま 1つの 言葉に します。
 *     ★★短すぎる 断片は 捨てます（★偶然 当たるため）。
 */
function wordsOf(body) {
  const out = new Set();
  const lits = body.match(/'(?:[^'\\]|\\.)*'/g) || [];
  lits.forEach((raw) => {
    let s = raw.slice(1, -1).replace(/\\'/g, "'");
    s = s.replace(/<[^>]*>/g, "\n");
    s.split("\n").forEach((piece) => {
      const t = piece.trim();
      if (t.length < 4) return;
      if (!/[ぁ-んァ-ヶ一-龠]/.test(t)) return;
      out.add(t);
    });
  });
  return [...out];
}

function implText() {
  const files = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    if (e.name === "node_modules" || e.name.startsWith(".")) return;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx?|mjs)$/.test(e.name)) files.push(p);
  });
  ["components", "lib", "app"].forEach((d) => walk(path.join(ROOT, d)));
  return files
    .filter((p) => !p.includes(path.join("components", "tests")))
    .map((p) => fs.readFileSync(p, "utf8"))
    .join("\n");
}

const IMPL = implText();
const squeeze = (s) => s.replace(/[\s　]/g, "");
const IMPL_SQ = squeeze(IMPL);

function check(name) {
  const body = bodyOf(name);
  if (!body) return { name, error: "見本に ありません" };
  const words = wordsOf(body);
  const missing = words.filter((w) => !IMPL_SQ.includes(squeeze(w)));
  return { name, total: words.length, missing };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("使い方: node tools/mihon-verify.js <画面の名前>  ／  --all");
  process.exit(1);
}

let names = args;
if (args[0] === "--all") {
  names = [];
  const push = (re) => {
    let m;
    const r = new RegExp(re, "gm");
    while ((m = r.exec(src))) names.push(m[1]);
  };
  push("^function (S_[A-Za-z]+)\\(");
  push("^function (narabe|sakanobo|kuraberu|kazoeru)\\(");
  push("^SC\\['([^']+)'\\]=");
  push("^SH\\['([^']+)'\\]=");
  names = [...new Set(names)];
}

let bad = 0;
const rows = [];
names.forEach((n) => {
  const r = check(n);
  if (r.error) { console.log("\n■ " + n + "  ── " + r.error); return; }
  const ok = r.total - r.missing.length;
  const mark = r.missing.length === 0 ? "○" : "★";
  console.log("\n" + mark + " " + n + "　言葉 " + r.total + " のうち " + ok + " が 実装に あります");
  if (r.missing.length) {
    bad += 1;
    r.missing.forEach((w) => console.log("    ✗ " + w));
  }
  rows.push({ name: n, total: r.total, missing: r.missing.length });
});
console.log("\n★言葉の 欠けが ある 画面: " + bad + " / " + rows.length);
console.log("★★これは「見た目が 合っている」ことの 証しでは ありません。");
