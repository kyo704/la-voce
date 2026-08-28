#!/usr/bin/env node
/**
 * ★訳してはいけない日本語を、機械が見張る（多言語対応（伊英中）.md §2）
 *
 * この一覧の語は、画面の文字ではなく★保存されている値です。
 * 翻訳キーに置き換えると、過去の記録が引けなくなり、
 * 発声負荷の計算が壊れます。表示が変になるだけでは済みません。
 *
 * ★このテストは、多言語対応の作業を始める前に置いています。
 *   作業のあいだ、誤って訳してしまったことを、その場で知るためです。
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "storedValues.js"), "utf-8");
  const S = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  const vt = readCode("components", "VocalTracker.jsx");

  console.log("=== 一覧そのもの ===");
  assertEqual(S.ACTIVITY_KINDS.length, 5, "活動の種類は5つ");
  assertTrue(S.isStoredValue("本番"), "「本番」は保存される値");
  assertTrue(!S.isStoredValue("こんにちは"), "ふつうの文は保存される値ではない");

  console.log("\n=== ★コード側の実物と一致しているか（写し間違いを防ぐ） ===");
  // 一覧が実物からずれると、見張りが効かなくなる。
  const weight = vt.slice(vt.indexOf("ACTIVITY_LOAD_WEIGHT = {"), vt.indexOf("ACTIVITY_LOAD_WEIGHT = {") + 200);
  S.ACTIVITY_KINDS.forEach((k) => {
    assertTrue(weight.includes(`"${k}"`), `発声負荷の重みに「${k}」がある`);
  });
  const vtypes = vt.slice(vt.indexOf("const VOICE_TYPES = ["), vt.indexOf("const VOICE_TYPES = [") + 220);
  S.VOICE_TYPE_VALUES.forEach((k) => {
    assertTrue(vtypes.includes(`"${k}"`), `声種に「${k}」がある`);
  });
  const nut = vt.slice(vt.indexOf("const NUTRITION_PHASES = ["), vt.indexOf("const NUTRITION_PHASES = [") + 120);
  S.NUTRITION_PHASE_VALUES.forEach((k) => {
    assertTrue(nut.includes(`"${k}"`), `栄養のフェーズに「${k}」がある`);
  });

  console.log("\n=== ★保存される値が、翻訳キーに置き換わっていないか ===");
  // ここが本体。t("activityPerformance") に変えてしまうと、
  // activity_type に英語が保存され、過去の記録が引けなくなる。
  assertTrue(/ACTIVITY_LOAD_WEIGHT = \{ "休養": 0/.test(vt),
    "★発声負荷の重みが、日本語の鍵のままである");
  assertTrue(/ACTIVITY_BLOCK_KINDS = \["自主練習", "レッスン", "リハーサル", "本番"\]/.test(vt),
    "★活動の種類の一覧が、日本語のままである");
  assertTrue(/key: "休養"/.test(vt), "★選択肢の key が日本語のままである");
  // 表示は labelKey 経由であること（key と label が分かれている）
  assertTrue(/labelKey: "activityRest"/.test(vt), "表示は labelKey を経由している");
  assertTrue(/NUTRITION_PHASE_KEYS = \{ "維持": "phaseMaintain"/.test(vt),
    "栄養のフェーズも key と labelKey が分かれている");

  console.log("\n=== 登録画面の「学生」（★保存される値） ===");
  // profiles.occupation に固定の文字列として入ります。訳すと、管理画面の
  // 一覧と本人の書き出しに、言語ごとに違う値が並びます。
  assertEqual(S.SIGNUP_STUDENT_VALUE, "学生", "値は「学生」");
  const signup = readCode("components", "SignupForm.jsx");
  assertTrue(/occupation: form\.isStudent \? "学生" : form\.occupation/.test(signup),
    "★登録画面が、固定の「学生」を保存している（t() を通していない）");
  assertTrue(!/isStudent \? t\(/.test(signup), "★t() に置き換えられていない");

  console.log("\n=== ★保存する側に、翻訳した文字が入っていないか ===");
  // activity_type に t(...) を渡していたら、訳語が保存されてしまう。
  assertTrue(!/activity_type:\s*t\(/.test(vt), "★activity_type に t() を渡していない");
  assertTrue(!/voice_type:\s*t\(/.test(vt), "★voice_type に t() を渡していない");
  assertTrue(!/nutrition_phase:\s*t\(/.test(vt), "★nutrition_phase に t() を渡していない");
  assertTrue(!/kind:\s*t\(/.test(vt), "★activity.kind に t() を渡していない");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
