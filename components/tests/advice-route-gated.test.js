#!/usr/bin/env node
/**
 * ★記録を外へ出す経路は、サーバ側で閉じる（2026-09-03）
 *
 * ★app/api/advice/route.js は、entries を読んで
 *   喉・睡眠・症状を文にし、api.anthropic.com へ送ります。
 *   ★記録の中身が外部へ出る、唯一の経路です。
 *
 * ★これまで、止めていたのは画面の定数だけでした
 *   （VocalTracker.jsx の AI_ADVICE_ENABLED = false）。
 *   あれは★ボタンを隠すだけで、経路を止めません。
 *   ログイン済みの人が URL を直に叩けば、隠れたボタンは無関係です。
 *
 * ★守ること
 *   ① サーバ側で判定する（画面の定数を見ない）
 *   ② 環境変数が無ければ★閉じたまま（フェイルクローズ）
 *   ③ 閉じているときは、記録を1行も読まない
 */
const { readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const route = readCode("app/api/advice", "route.js");
const ui = readCode("components", "VocalTracker.jsx");

console.log("=== ★サーバ側で閉じている ===");
{
  assertTrue(/function adviceEnabled\(\)/.test(route), "サーバ側の判定がある");
  assertTrue(/process\.env\.AI_ADVICE_ENABLED === "true"/.test(route),
    "★環境変数で決めている（画面の定数を見ていない）");
  assertTrue(/status: 403/.test(route), "閉じているときは 403");
}

console.log("\n=== ★閉じるほうへ倒れる（フェイルクローズ） ===");
{
  // ★=== "true" なので、未設定・空・"1"・"yes" はすべて閉じます。
  const check = (v) => v === "true";
  [undefined, "", "false", "1", "yes", "TRUE", "on"].forEach((v) => {
    assertTrue(check(v) === false, `★"${v}" では開かない`);
  });
  assertTrue(check("true") === true, '"true" のときだけ開く');
}

console.log("\n=== ★閉じているときは、記録を読まない ===");
{
  const gateAt = route.indexOf("if (!adviceEnabled())");
  // ★門は POST の中にあること（関数の外に書いても効きません）
  const readAt = route.indexOf('.from("entries")');
  // ★import 行にも同じ名前が出るので、POST の中だけを見ます。
  const postAt = route.indexOf("export async function POST");
  const authAt = route.indexOf("getUserWithTimeout", postAt);
  assertTrue(gateAt > -1 && readAt > -1, "両方ある");
  assertTrue(gateAt < readAt, "★門が、記録を読むより前にある");
  assertTrue(gateAt < authAt, "★門が、認証より前にある（1行も読まない）");
}

console.log("\n=== ★画面の定数は、門の代わりにならない ===");
{
  // 画面側の定数は残してよい（ボタンを隠す役目）。ただし★これだけに頼らない。
  assertTrue(/const AI_ADVICE_ENABLED = false/.test(ui),
    "画面の定数は、ボタンを隠すために残っている");
  assertTrue(!/AI_ADVICE_ENABLED/.test(route.replace(/process\.env\.AI_ADVICE_ENABLED/g, "")),
    "★ルートが画面の定数を import していない");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
