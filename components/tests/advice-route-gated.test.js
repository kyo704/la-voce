#!/usr/bin/env node

// ============================================================================
// ★助言の 道が、★無い こと（★No.019・2026-09-14）
//
//   ★★この 見張りは、★前は「門が 閉じて いる こと」を 見て いました。
//     ★2026-09-14、★道そのものを 消したので、★見る ものが 変わりました。
//
//   ★★消した のに 見張りを 消さない のは、★足し直された ときに
//     ★気づける ように する ため です。
//     ★★見張りごと 消すと、★半年後に 誰かが 同じ 道を 作っても、
//       ★何も 言わずに 通ります。
//
//   ★出どころ 裁定 その59（★Opus・2026-09-14）
//     「★2つの 閉じた 門が あっても、★大学に 説明しなければ ならない
//       コードが 残る。★いちばん 短い 本当の 一文は『存在しません』」
//
//   ★消した いきさつ docs/records/修正の記録-No.019-助言の道を消す.md
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

console.log("① ★道が 無い こと");

t(!fs.existsSync(path.join(ROOT, "app", "api", "advice")),
  "★app/api/advice が 無い");
t(!fs.existsSync(path.join(ROOT, "lib", "anthropic.js")),
  "★lib/anthropic.js が 無い");

console.log("\n② ★宛先を 指す 字が、★どこにも 無い こと");

// ★★コメントを 外してから 探します。★記録の 文には 出てきます。
//   ★docs/ は 見ません。★そこは「昔 何が あったか」を 残す 場所です。
const dirs = ["app", "lib", "components"];
function walk(d, out) {
  const full = path.join(ROOT, d);
  if (!fs.existsSync(full)) return out;
  for (const f of fs.readdirSync(full)) {
    const p = path.join(full, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) { if (f !== "tests") walk(path.join(d, f), out); }
    else if (f.endsWith(".js") || f.endsWith(".jsx")) out.push(path.join(d, f));
    // ★★`lib/outboundRoutes.js` は のけます（★下の ④ で 別に 見ます）。
    //   ★そこに ある `api.anthropic.com` は ★通信では ありません。
    //     ★「昔 ここへ 送る 道が あった」という ★記録の 文字です。
    //   ★★のけないと、★記録を 残した ことで 見張りが 落ちます。
    //     ★記録を 消す ほうへ 押されて しまいます。
  }
  return out;
}
const LEDGER = path.join("lib", "outboundRoutes.js");
const files = dirs.flatMap((d) => walk(d, [])).filter((f) => f !== LEDGER);
console.log("　★見た ファイル: " + files.length +
  " 件（★tests・docs・台帳 は のぞく）");

const hits = { host: [], key: [], fn: [] };
files.forEach((rel) => {
  const code = readCode(rel);          // ★コメントを 外した もの
  if (code.includes("api.anthropic.com")) hits.host.push(rel);
  if (code.includes("ANTHROPIC_API_KEY")) hits.key.push(rel);
  if (/\bgetAdvice\s*\(/.test(code)) hits.fn.push(rel);
});
hits.host.forEach((f) => console.log("    ✗ " + f + " に api.anthropic.com"));
hits.key.forEach((f) => console.log("    ✗ " + f + " に ANTHROPIC_API_KEY"));
hits.fn.forEach((f) => console.log("    ✗ " + f + " に getAdvice("));
t(hits.host.length === 0, "★api.anthropic.com が 0件");
t(hits.key.length === 0, "★ANTHROPIC_API_KEY が 0件");
t(hits.fn.length === 0, "★getAdvice( が 0件");

console.log("\n③ ★画面にも 入口が 無い こと");

const ui = readCode("components", "VocalTracker.jsx");
t(!/const AI_ADVICE_ENABLED/.test(ui), "★止めの 札が 無い");
t(!/setActiveTab\("advice"\)/.test(ui), "★入口が 無い");
t(!/\{activeTab === "advice" &&/.test(ui), "★画面が 無い");
t(!/\badviceText\b|\badviceLoading\b|\bhandleGenerateAdvice\b/.test(ui), "★覚えも 呼び出しも 無い");

console.log("\n④ ★台帳からは 消して いない こと");

// ★★消した 行まで 消すと、★「無かった」に なって しまいます。
//   ★★「一度も 送って いない」は、★残す 値打ちの ある 事実です。
const led = readRaw("lib", "outboundRoutes.js");
t(/export const REMOVED_ROUTES/.test(led), "★REMOVED_ROUTES が ある");
t(/id: "anthropic"/.test(led), "★anthropic の 行が 残って いる");
t(/everTransmitted: false/.test(led), "★一度も 送って いない ことが 残って いる");
t(/removedOn: "2026-09-14"/.test(led), "★消した 日が 入って いる");
t(/removedWhy:/.test(led), "★なぜ 消したかが 入って いる");

// ★★いまの 一覧には 入って いない こと。★大学向けの 一覧は こちらから 作ります。
const nowBlock = led.slice(led.indexOf("export const OUTBOUND_ROUTES"),
                           led.indexOf("export const REMOVED_ROUTES"));
t(!/id: "anthropic"/.test(nowBlock), "★いまの 一覧には 入って いない");

console.log("\n⑤ ★記録が 残って いる こと");

const rec = path.join(ROOT, "docs", "records", "修正の記録-No.019-助言の道を消す.md");
t(fs.existsSync(rec), "★修正の記録 No.019 が ある");
if (fs.existsSync(rec)) {
  const r = fs.readFileSync(rec, "utf8");
  t(/throat_symptoms/.test(r), "★送って いた 欄が 書いて ある");
  t(/\$0\.00/.test(r), "★受け手側の 根拠が 書いて ある");
  t(/AI_ADVICE_ENABLED/.test(r), "★門の こと が 書いて ある");
}

console.log("\n⑥ ★この 見張りが 見て いない こと");
console.log("　★本番の Vercel に ANTHROPIC_API_KEY が 残って いるかは 見えません。");
console.log("　★★環境変数は 倉庫の 外に あります。★管理画面で お確かめください。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
