#!/usr/bin/env node
/**
 * かんたん表示の「1画面に1つ」（見やすさとかんたん表示.md §3-3）。
 *
 * ★「とばす」を必ず置くこと。
 *   答えられない項目で止まると、その日の記録が丸ごと消えます。
 *
 * ★とばした数を数えないこと。数えると、いつか画面に出ます。
 *   「未入力」「不足」「完了度◯%」を出さない（統合実行ルート v4 §11）。
 *   かんたん記録は劣った記録ではなく、悪い日でも開ける道です。
 */
const { readRaw, stripComments, assertAbsent } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) {
  if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; }
}
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

async function main() {
  const m = await import("data:text/javascript;base64," +
    Buffer.from(readRaw("lib", "simpleFlow.js"), "utf-8").toString("base64"));
  const uiCode = stripComments(readRaw("components", "VocalTracker.jsx"));

  console.log("\n=== 1画面に1つ、残り何問かを出す ===");
  assertTrue(m.SIMPLE_STEP_COUNT >= 3, `手順がある（${m.SIMPLE_STEP_COUNT}問）`);
  assertEqual(m.remainingSteps(0), m.SIMPLE_STEP_COUNT, "はじめは、全部残っている");
  assertEqual(m.remainingSteps(m.SIMPLE_STEP_COUNT), 0, "終わったら、残り0");
  assertEqual(m.remainingSteps(-5), m.SIMPLE_STEP_COUNT, "変な値でも壊れない");
  assertTrue(/あと \{left\}つ/.test(uiCode), "★画面に「あと◯つ」を出している");

  console.log("\n=== ★とばせること ===");
  console.log("     答えられない項目で止まると、その日の記録が丸ごと消えます。");
  assertEqual(m.SIMPLE_SKIP_LABEL, "とばす", "「とばす」という言葉で置く");
  assertTrue(/SIMPLE_SKIP_LABEL/.test(uiCode), "★画面に「とばす」が必ずある");
  {
    const before = { throatCondition: 4 };
    const after = m.skipStep(before);
    assertEqual(after, before, "★とばしても、何も書き込まない");
    assertTrue(!("sleepQuality" in after), "★とばした項目に既定値を入れない");
  }
  console.log("     0 や既定値を入れると、「答えなかった」が「そう答えた」に化けます。");

  console.log("\n=== ★とばした数を数えない ===");
  let blocked = false;
  try { m.countSkipped(); } catch (e) { blocked = /数えません/.test(e.message); }
  assertTrue(blocked, "★数えようとしたら止まる");
  // ★lib/simpleFlow.js 自身は数えない。countSkipped の拒否メッセージが
  //   「『未入力』『不足』『完了度』を出さない」と、禁止語をそのまま名指ししている。
  //   禁止を実装している側を数えると、必ず落ちる。
  //   コメントを外すだけでは足りない場合がある、という例（これは文字列）。
  //   数えるべきは、実際に画面へ出る側。
  {
    const flowStart = uiCode.indexOf("あと {left}つ");
    const flowBlock = uiCode.slice(flowStart - 600, flowStart + 3000);
    ["未入力", "不足", "完了度", "達成率", "がんばり"].forEach((w) => {
      assertTrue(!flowBlock.includes(w), `★画面に「${w}」が出ていない`);
    });
  }

  console.log("\n=== 書き込む先は、ふつうの記録と同じ ===");
  console.log("     別の保存先を作ると、分析から見えない記録ができます。");
  const applied = m.applyStep({}, "throatCondition", 4);
  assertEqual(applied, { throatCondition: 4 }, "同じ項目名に書く");
  m.SIMPLE_STEPS.forEach((s) => {
    assertTrue(/^[a-z][A-Za-z]+$/.test(s.key), `${s.key} は、ふつうの記録と同じ項目名`);
    assertTrue((s.choices || []).length >= 2, `${s.key} に選択肢がある`);
    assertTrue(s.choices.every((c) => typeof c.value === "number" && c.label),
      `${s.key} の選択肢に、言葉と値の両方がある`);
  });
  console.log("     ★粗い選択肢を、尺度の端（1や5）に寄せない。あとで平均が引っぱられます。");
  const extremes = m.SIMPLE_STEPS.flatMap((s) => s.choices.map((c) => c.value))
    .filter((v) => v === 1 || v === 5);
  assertTrue(extremes.length === 0, "★1や5に寄せていない");

  console.log("\n=== 画面のつなぎ ===");
  assertTrue(/isSimpleDisplay\(profile\) && formData && !isFinished\(simpleStepIndex\)/.test(uiCode),
    "かんたん表示のときだけ出している");
  assertTrue(/setFormData\(\(f\) => applyStep\(f, step\.key, choice\.value\)\)/.test(uiCode),
    "★答えは、ふつうの記録と同じ formData に書いている");
  assertTrue(/minHeight: "var\(--tap\)"/.test(uiCode.slice(uiCode.indexOf("あと {left}つ"))),
    "選択肢の的が、文字の大きさに追従する");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
