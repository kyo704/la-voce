#!/usr/bin/env node
/**
 * 守りのテスト② ｜ 書き出しと削除は、支払いの有無にかかわらず使える
 * （守りのテスト3本.md §4。権利と課金の線引き.md §3）
 *
 * ★これが3本の中で本体です。G3.2 で課金を実装したときに、
 *   うっかり書き出しを囲む事故を、機械的に止めます。
 *   いまこの検査は他のどこにもありません。
 *
 * ★文書の例は /api/export を叩く形でしたが、このリポジトリに
 *   書き出しの API ルートはありません。書き出しは画面の中の
 *   handleExportData（VocalTracker.jsx）で、その場でファイルを作ります。
 *   なので「無料ユーザーが200を受け取れるか」ではなく、
 *   ★「支払いを判定する語が、書き出しと削除の経路に入り込んでいないか」を見ます。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

// 支払いで機能を分けるときに使われる語。★増やすことはあっても、減らさない。
//
// ★2種類に分ける必要があります。
//   ALWAYS … 出てきた時点でおかしい語（判定そのもの）
//   IN_CONDITION … 語そのものは正当に出てくるので、条件の中にあるときだけ疑う語
//
//   例: accountDeletion.js には "subscriptions" が出てきますが、これは
//   「アカウントを消すときに、この表も消す」という対象の名前です。正しい用法で、
//   むしろ消し忘れると困ります。語の有無だけで判定すると、正しい実装を
//   不合格にしてしまいます（テスト①でも同じ間違いをしました）。
const PLAN_GATE_ALWAYS = [
  "isPremium", "requirePremium", "requirePlan", "hasPlan", "canUsePremium",
  "entitlement", "isPaid", "isSubscribed", "checkPlan", "gatePremium"
];
const PLAN_GATE_IN_CONDITION = ["premium", "subscription", "plan", "stripe", "paid"];

/** 条件（if・三項・&&）の中に、支払いの語が入っていないか */
function conditionalPlanHits(src) {
  const conds = [
    ...src.matchAll(/if\s*\(([^)]{0,200})\)/g),
    ...src.matchAll(/([^\n]{0,120})\s*\?\s*[^\n]{0,60}:/g),
    ...src.matchAll(/([^\n]{0,120})&&/g)
  ].map((m) => m[1].toLowerCase());
  const hits = new Set();
  conds.forEach((c) => PLAN_GATE_IN_CONDITION.forEach((w) => { if (c.includes(w)) hits.add(w); }));
  return [...hits];
}

// 絶対にゲートしてはいけない処理（権利と課金の線引き.md §3）
const MUST_STAY_FREE = [
  { name: "書き出し", fn: "handleExportData" },
  { name: "アカウントの削除", fn: "handleDeleteAccount" },
  { name: "記録の控え", fn: "buildExportSummary" }
];

const ui = readCode("components", "VocalTracker.jsx");
const uiRaw = readRaw("components", "VocalTracker.jsx");

/** 関数の本体を、名前から取り出す（波括弧を数える。★正規表現で境界を取らない） */
function functionBody(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) return null;
  const paren = src.indexOf("(", start);
  let pd = 0, bodyStart = -1;
  for (let k = paren; k < src.length; k++) {
    if (src[k] === "(") pd++;
    else if (src[k] === ")") { pd--; if (pd === 0) { bodyStart = src.indexOf("{", k); break; } }
  }
  if (bodyStart < 0) return null;
  let depth = 0;
  for (let i = bodyStart; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

console.log("=== ① 書き出し・削除の実装が、支払いを判定していない ===");
MUST_STAY_FREE.forEach(({ name, fn }) => {
  const body = functionBody(ui, fn) || functionBody(readCode("lib", "exportSummary.js"), fn);
  assertTrue(!!body, `${name}（${fn}）の実装が見つかる`);
  if (!body) return;
  const always = PLAN_GATE_ALWAYS.filter((w) => body.toLowerCase().includes(w.toLowerCase()));
  assertEqual(always, [], `★${name} に支払いの判定が入っていない（法定の権利なので、支払いで制限できない）`);
  assertEqual(conditionalPlanHits(body), [], `★${name} が、支払いを条件に分岐していない`);
});

console.log("\n=== ② 書き出し・削除のボタンが、支払いで隠れていない ===");
// ボタンの前後に、プランで出し分ける条件が入っていないこと。
[
  // ★★2026-09-05、★書き出しの前に、もう一度確かめるようにしました。
  //   ★押す先が startExport に変わっています。★隠れていないことは、変わりません。
  { name: "書き出しのボタン", mark: "onClick={startExport}" },
  { name: "削除の入口", mark: 'setActiveTab("deleteAccount1")' }
].forEach(({ name, mark }) => {
  const at = ui.indexOf(mark);
  assertTrue(at > 0, `${name}が存在する`);
  if (at < 0) return;
  const around = ui.slice(Math.max(0, at - 700), at);
  const always = PLAN_GATE_ALWAYS.filter((w) => around.toLowerCase().includes(w.toLowerCase()));
  assertEqual(always, [], `★${name}が、支払いで出し分けられていない`);
  assertEqual(conditionalPlanHits(around), [], `★${name}の周りに、支払いの条件が無い`);
});

console.log("\n=== ③ 対象の表・列を、支払いで減らしていない ===");
const exportSrc = readCode("lib", "exportData.js");
const delSrc = readCode("lib", "accountDeletion.js");
[["書き出し", exportSrc], ["削除", delSrc]].forEach(([name, src]) => {
  // ★表の名前として "subscriptions" が出るのは正しい（消す対象なので）。
  //   疑うのは、条件の中に出てきたときだけ。
  const always = PLAN_GATE_ALWAYS.filter((w) => src.toLowerCase().includes(w.toLowerCase()));
  assertEqual(always, [], `★${name}の対象一覧に、支払いの判定が入っていない`);
  assertEqual(conditionalPlanHits(src), [], `★${name}が、支払いを条件に対象を減らしていない`);
});
// 中身が空でないこと（「全部返さない」で通してしまわないように）
const tables = (exportSrc.match(/table: "([a-z_]+)"/g) || []).length;
assertTrue(tables >= 8, `★書き出しの対象が${tables}表ある（空にして通していない）`);
assertTrue(/EXPORTED_PROFILE_COLUMNS/.test(exportSrc), "プロフィールの列も書き出している");
assertTrue(/cycle_periods/.test(exportSrc) && /cycle_periods/.test(delSrc),
  "★機微な記録こそ、本人には返し、本人は消せる");

console.log("\n=== ④ ★法定の書き出しと「受診用の1枚」を、同じ実装にまとめていない ===");
console.log("     前者は無料の権利、後者は診察用に整形した便宜。混ぜると片方の判断が他方に移る。");
const summaryBody = functionBody(readCode("lib", "exportSummary.js"), "buildExportSummary");
assertTrue(!!summaryBody, "記録の控えは別のモジュールにある");
assertTrue(!/clinicSummary|受診用/.test(exportSrc), "★書き出しが受診用サマリーを取り込んでいない");
assertTrue(ui.includes('activeTab === "clinicSummary"') && ui.includes('activeTab === "exportSummary"'),
  "★2つは別の画面として存在する");

console.log("\n=== ⑤ ★課金の仕組みは、まだ1行も入っていない（G3.2 まで着手しない） ===");
// 権利と課金の線引き.md の冒頭: G3 が終わるまで1行も実装しないこと。
//
// ★2026-08-30、lib/entitlements.js を作りました。★これは課金ではありません。
//   「仕上がった機能を、テスターにだけ先に見せる」出し分けです。
//   売っていません。値段も支払いも期限もありません。
//   ★したがって、見張る対象を「ファイルの有無」から「課金の概念の有無」へ
//     変えます。ファイルの有無で見ると、別物まで止めてしまいます。
//   ★凍結そのものは、いまも見張っています。下の3つが入った時点で落ちます。
const entSrc = readCode("lib", "entitlements.js");
assertTrue(!/plan|price|stripe|subscription|premium/i.test(entSrc),
  "★出し分けの表に、プラン・価格・課金の概念が入っていない");
assertTrue(!/stripe|checkout|price_/i.test(uiRaw.replace(/\/\/.*$/gm, "")),
  "★画面に決済の導線が入っていない");
assertTrue(!/有料プラン|アップグレード|購入/.test(uiRaw.replace(/\/\/.*$/gm, "")),
  "★画面に購入を促す言葉が入っていない");
assertTrue(/これは課金の実装ではありません/.test(readRaw("lib", "entitlements.js")),
  "★entitlements.js 自身が「課金ではない」と明記している");

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
