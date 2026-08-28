#!/usr/bin/env node
/**
 * オフラインのときに、必ず何かが出ること（配信と更新の確認.md §5 テスト4）
 *
 * ★2026-08-29 の実機確認で落ちた項目です。
 *   ホーム画面のアイコンから機内モードで開くと、真っ白になりました。
 *
 *   原因: start_url が「/」で、ログイン済みだと 307（転送）を返す。
 *         sw.js は response.ok のものだけ保存するため、
 *         ★「/」は原理的にキャッシュに入りません。
 *         オンラインでどれだけ使っても貯まりません。
 *         standalone にはブラウザのオフライン画面も無いので、白くなります。
 *
 * ★このテストは、その経路をそのまま真似て確かめます。
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const sw = readRaw("public", "sw.js");
const offline = readRaw("public", "offline.html");

console.log("=== オフライン画面が、それ単体で出せること ===");
// ★外部を読みに行くと、それ自体がオフラインで取れず、また白くなります。
assertTrue(!/<script[^>]*\ssrc=/.test(offline), "★外部の JS を読んでいない");
assertTrue(!/<link[^>]*rel=["']stylesheet/.test(offline), "★外部の CSS を読んでいない");
assertTrue(!/https?:\/\//.test(offline.replace(/<!--[\s\S]*?-->/g, "")), "★外部への参照が無い");
assertTrue(/インターネットにつながっていません/.test(offline), "何が起きているかを書いている");
assertTrue(/記録は、そのまま残っています/.test(offline), "★記録が消えていないことを伝えている");
assertTrue(/location\.reload\(\)/.test(offline), "もう一度ためす手段がある");

console.log("\n=== install で焼き込んでいること ===");
assertTrue(/const OFFLINE_URL = "\/offline\.html"/.test(sw), "オフライン画面の場所を持っている");
assertTrue(/cache\.add\(new Request\(OFFLINE_URL/.test(sw), "install で取り込んでいる");
assertTrue(/cache: "reload"/.test(sw), "★古い控えではなく、取り直して焼き込む");
// ★焼き込みに失敗しても install を止めないこと。止めると更新の経路まで死ぬ。
const installBlock = sw.slice(sw.indexOf('addEventListener("install"'), sw.indexOf('addEventListener("activate"'));
assertTrue(/\.catch\(/.test(installBlock), "★取り込みに失敗しても install を止めない");
assertTrue(/self\.skipWaiting\(\)/.test(installBlock), "skipWaiting は残っている");

console.log("\n=== 画面への移動が失敗したときの順番 ===");
const catchBlock = sw.slice(sw.indexOf(".catch(async () =>"), sw.indexOf(".catch(async () =>") + 900);
assertTrue(/caches\.match\(event\.request\)/.test(catchBlock), "① まず、そのURL自身の控えを探す");
assertTrue(/event\.request\.mode === "navigate"/.test(catchBlock), "② 画面への移動かどうかを見る");
assertTrue(/caches\.match\(OFFLINE_URL\)/.test(catchBlock), "③ オフライン画面を返す");
assertTrue(catchBlock.indexOf("caches.match(event.request)") < catchBlock.indexOf("OFFLINE_URL"),
  "★自身の控えを、オフライン画面より先に試す");

console.log("\n=== ★失敗の経路をそのまま真似る ===");
{
  // sw.js の catch と同じ規則を、そのまま書き写して確かめる。
  const CACHE = { "/offline.html": "OFFLINE_PAGE", "/dashboard": "DASH" };
  async function fallback(url, mode) {
    const cached = CACHE[url];
    if (cached) return cached;
    if (mode === "navigate") {
      const off = CACHE["/offline.html"];
      if (off) return off;
    }
    return "NETWORK_ERROR";
  }
  // ★これが今回の失敗そのもの: 「/」は 307 なので控えが無い
  (async () => {
    assertEqual(await fallback("/", "navigate"), "OFFLINE_PAGE",
      "★start_url「/」の控えが無くても、オフライン画面が出る（＝白くならない）");
    assertEqual(await fallback("/dashboard", "navigate"), "DASH",
      "控えがあるURLは、そのまま出る");
    assertEqual(await fallback("/learn/xxx", "navigate"), "OFFLINE_PAGE",
      "★「/」以外の未保存のURLでも、白くならない");
    assertEqual(await fallback("/_next/static/chunks/x.js", "no-cors"), "NETWORK_ERROR",
      "画面への移動でないものは、これまでどおりエラーにする");

    console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
    process.exit(failCount === 0 ? 0 : 1);
  })();
}
