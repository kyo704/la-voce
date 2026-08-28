#!/usr/bin/env node
/**
 * Service Worker の更新経路（配信と更新の確認.md §3）
 *
 * ★守りたいのは2つ。
 *   ① 新しい版が来たら、利用者が何もしなくても入れ替わること
 *   ② ★リロードのループを絶対に起こさないこと（§6-3）
 *
 * ②は、間違えると被害が大きい種類の不具合です。画面が延々と
 * 読み込み直され、利用者は操作できません。守りを3つ重ねています。
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

function makeEnv({ hasController }) {
  const handlers = [];
  let reloads = 0;
  const store = { m: {}, getItem(k) { return this.m[k]; }, setItem(k, v) { this.m[k] = v; } };
  return {
    handlers, store,
    get reloads() { return reloads; },
    navigator: { serviceWorker: {
      controller: hasController ? {} : null,
      addEventListener: (e, h) => handlers.push(h),
      removeEventListener: () => {}
    } },
    window: { location: { reload: () => { reloads++; } }, addEventListener(){}, removeEventListener(){} }
  };
}

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "swUpdate.js"), "utf-8");
  const M = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));

  console.log("=== ★リロードのループを起こさない（§6-3） ===");
  {
    // 守り1: 初回インストール（もともと制御下でない）ならリロードしない
    const e = makeEnv({ hasController: false });
    M.reloadOnceOnControllerChange({ navigator: e.navigator, window: e.window, sessionStorage: e.store, now: () => 1000 });
    e.handlers.forEach((h) => h());
    assertEqual(e.reloads, 0, "★初めて入れたときは読み込み直さない");
  }
  {
    // 守り2: 何度 controllerchange が来ても1回だけ
    const e = makeEnv({ hasController: true });
    M.reloadOnceOnControllerChange({ navigator: e.navigator, window: e.window, sessionStorage: e.store, now: () => 1000 });
    e.handlers.forEach((h) => h()); e.handlers.forEach((h) => h()); e.handlers.forEach((h) => h());
    assertEqual(e.reloads, 1, "★3回来ても、読み込み直すのは1回だけ");
  }
  {
    // 守り3: 直前にリロードしていたら、しない（別のページ生成でも効く）
    const e = makeEnv({ hasController: true });
    e.store.setItem("woolsong-sw-reloaded-at", "1000");
    M.reloadOnceOnControllerChange({ navigator: e.navigator, window: e.window, sessionStorage: e.store, now: () => 3000 });
    e.handlers.forEach((h) => h());
    assertEqual(e.reloads, 0, "★直前に読み込み直していたら、しない");
  }
  {
    // 冷却期間を過ぎていれば、ふつうに動く
    const e = makeEnv({ hasController: true });
    e.store.setItem("woolsong-sw-reloaded-at", "1000");
    M.reloadOnceOnControllerChange({ navigator: e.navigator, window: e.window, sessionStorage: e.store, now: () => 999999 });
    e.handlers.forEach((h) => h());
    assertEqual(e.reloads, 1, "時間が経っていれば、ふつうに読み込み直す");
  }
  {
    // sessionStorage が使えなくても、守り1と2は効く
    const e = makeEnv({ hasController: true });
    M.reloadOnceOnControllerChange({ navigator: e.navigator, window: e.window, sessionStorage: null, now: () => 1000 });
    e.handlers.forEach((h) => h()); e.handlers.forEach((h) => h());
    assertEqual(e.reloads, 1, "sessionStorage が無くても1回だけ");
  }

  console.log("\n=== 開いたとき・戻ったときに、新しい版を確かめる ===");
  {
    let updates = 0;
    const listeners = {};
    const doc = { visibilityState: "visible",
      addEventListener: (e, h) => { listeners[e] = h; }, removeEventListener: () => {} };
    const win = { addEventListener: (e, h) => { listeners[e] = h; }, removeEventListener: () => {} };
    const reg = { update: () => { updates++; } };
    const stop = M.watchForUpdates(reg, { document: doc, window: win });
    assertEqual(updates, 1, "登録した直後に1回確かめる");
    listeners.visibilitychange();
    assertEqual(updates, 2, "画面に戻ったときに確かめる");
    listeners.focus();
    assertEqual(updates, 3, "フォーカスが戻ったときに確かめる");
    doc.visibilityState = "hidden";
    listeners.visibilitychange();
    assertEqual(updates, 3, "★隠れているときは確かめない（無駄な通信をしない）");
    assertTrue(typeof stop === "function", "後片付けの関数を返す");
  }

  console.log("\n=== sw.js 側（§3-1 の前半・§3-3） ===");
  const sw = readRaw("public", "sw.js");
  assertTrue(/self\.skipWaiting\(\)/.test(sw), "skipWaiting がある");
  assertTrue(/self\.clients\.claim\(\)/.test(sw), "clients.claim がある");
  assertTrue(/CACHE_NAME = "woolsong-shell-v3"/.test(sw), "キャッシュ名に版が入っている（§3-3）");
  assertTrue(/keys\s*\n?\s*\.filter\(\(key\) => key !== CACHE_NAME\)/.test(sw.replace(/\s+/g, " ").replace(/ /g, " ")) || /key !== CACHE_NAME/.test(sw),
    "activate で古いキャッシュを消す（§3-3）");
  assertTrue(/cached \|\| Response\.error\(\)/.test(sw), "★キャッシュに無くても Response を返す");
  // ★API はキャッシュしない（§3-2）。Supabase は別オリジンなので type が basic にならない。
  assertTrue(/response\.type === "basic"/.test(sw), "★別オリジンの応答はキャッシュしない（§3-2）");

  console.log("\n=== 画面側に配線されているか ===");
  const vt = readCode("components", "VocalTracker.jsx");
  assertTrue(/watchForUpdates\(reg\)/.test(vt), "登録できたら見張りを始める");
  assertTrue(/reloadOnceOnControllerChange\(\)/.test(vt), "controllerchange を見ている");
  assertTrue(/stopWatching\(\);\s*\n\s*stopReload\(\);/.test(vt),
    "★後片付けしている（listener が積み上がらない）");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
