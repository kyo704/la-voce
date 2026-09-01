#!/usr/bin/env node
/**
 * いったん止めている機能の台帳（2026-09-01）
 *
 * ★「作らないと決めたもの」（憲章 §10）とは別です。
 *   ここに載るのは「作ってあるが、いまは出していない」ものです。
 *
 * ★止めた機能について守りたいこと
 *   ① 画面に出ていない（測る導線も、値の表示も、推移も、勧めも）
 *   ② 新しい値が増えない
 *   ③ ★過去に測った値は消さない・埋めない
 *   ④ 下流（書き出し・分析・管理画面）が落ちない
 *   ⑤ 台帳に、理由と再開の条件が書いてある
 */
const { readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");

(async () => {
  const pf = await import("../../lib/pausedFeatures.js");
  const cols = await import("../../lib/entryColumns.js");
  const scope = await import("../../lib/shareScope.js");

  console.log("=== ★⑤ 台帳に、理由と再開の条件がある ===");
  assertTrue(pf.PAUSED_FEATURES.length >= 1, "止めている機能が載っている");
  pf.PAUSED_FEATURES.forEach((f) => {
    ["key", "label", "since", "why", "dataPolicy"].forEach((k) => {
      assertTrue(typeof f[k] === "string" && f[k].length > 0, `${f.key}: ${k} が書いてある`);
    });
    assertTrue(Array.isArray(f.evidence) && f.evidence.length > 0, `${f.key}: 根拠が書いてある`);
    assertTrue(Array.isArray(f.resumeWhen) && f.resumeWhen.length > 0, `${f.key}: ★再開の条件が書いてある`);
    assertTrue(/消しません|残します/.test(f.dataPolicy), `${f.key}: ★既存データを消さないと明記`);
  });
  assertTrue(pf.isPaused("measure.cpps"), "CPPS が止まっている");
  assertTrue(pf.CPPS_ENABLED === false, "★CPPS_ENABLED は false");

  console.log("\n=== ★① 画面に出ていない ===");
  assertTrue(/\{CPPS_ENABLED && showGroup\("cpps"\) && \(/.test(vt),
    "★測定ブロックが CPPS_ENABLED で囲まれている");
  assertTrue(/const vals = CPPS_ENABLED/.test(vt),
    "★稽古ノートの推移も止めている");
  assertTrue(/if \(CPPS_ENABLED && !usedCpps/.test(vt),
    "★「使ってみませんか」の勧めも出さない");

  console.log("\n=== ★③ 過去の値を壊さない ===");
  // entryToRow は「そのまま通す」まま。null を書くようにすると、
  // 古い記録を開いて保存し直したときに、当時の値が消える。
  assertTrue(/cpps_value: numOrNull\(e\.cppsValue\)/.test(vt),
    "★保存は素通しのまま（null を書きに行かない）");
  assertTrue(!/cpps_value: null/.test(vt),
    "★cpps_value に null を書き込む行が無い");
  assertTrue(/cppsValue: row\.cpps_value/.test(vt),
    "読み出しはそのまま（過去の値は読める）");
  // 列も消さない
  assertTrue(cols.LIVE_COLUMNS.includes("cpps_value"),
    "★列は台帳に残っている（消さない）");

  console.log("\n=== ★④ 下流が落ちない ===");
  // 相関の説明変数に入っていないこと（入っていたら null だらけで壊れる）
  const factors = vt.slice(vt.indexOf("const FACTORS = ["), vt.indexOf("];", vt.indexOf("const FACTORS = [")));
  assertTrue(!/cpps/i.test(factors), "★相関の説明変数に入っていない");
  // 共有範囲はそのまま（過去の値は、許可されていれば見えてよい）
  assertTrue(scope.COLUMN_SCOPE.cpps_value === "voice", "共有範囲の分類は変えていない");
  // 管理画面は件数を数えるだけ＝0件でも落ちない
  const admin = readCode("app/admin", "page.js");
  assertTrue(/typeof e\.cpps_value === "number"/.test(admin),
    "管理画面は型で数えるだけ（null で落ちない）");

  console.log("\n=== ★計算そのものは残っている（消さない） ===");
  assertTrue(/function computeCPPS/.test(vt), "computeCPPS は残っている");
  assertTrue(/function recordAndAnalyzeCPPS/.test(vt), "録音の関数も残っている");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
