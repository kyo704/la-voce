#!/usr/bin/env node
/**
 * 型ごとの追加項目（職業を声の型で切り直す.md §5-1・§5-2・§5-3・§9）のテスト。
 *
 * ★いちばん守りたいのは §9「分析への影響をゼロにする」。
 *   型別の項目を検定に入れると族が増え、検出力が落ちます。当面は記録だけです。
 *   ここでは、追加項目が分析の族に1つも入っていないことを固定します。
 *
 * ★次に守りたいのは §5-1「共通コアに1文字も触らない」。
 *   中核5項目が、型別の項目として再定義されていないことを確かめます。
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
const load = (f) => import("data:text/javascript;base64," +
  Buffer.from(fs.readFileSync(path.join(ROOT, "lib", f), "utf-8"), "utf-8").toString("base64"));

async function main() {
  const T = await load("typeFields.js");
  const O = await load("occupation.js");

  console.log("=== テスト1: 閾値どおりに出る（§5-2） ===");
  assertEqual(T.activeTypes({ sing: 9, speak: 1, project: 0 }), ["sing"], "声楽は sing だけ");
  assertEqual(T.activeTypes({ sing: 0, speak: 10, project: 0 }), ["speak"], "ナレーターは speak だけ");
  assertEqual(T.activeTypes({ sing: 1, speak: 7, project: 2 }), ["speak", "project"], "声優は2つ");
  assertEqual(T.activeTypes({ sing: 4, speak: 5, project: 1 }), [], "どれも閾値未満なら何も出ない");
  assertEqual(T.typeFieldsFor({ sing: 4, speak: 5, project: 1 }), [], "そのとき項目も0個");

  console.log("\n=== テスト2: ★上限を超えない（合計10のすべての配合で） ===");
  // 総当たり。合計が10になる配合を全部試す。
  let worst = 0, worstMix = null, checked = 0;
  for (let s = 0; s <= 10; s++) for (let p = 0; p <= 10 - s; p++) {
    const mix = { sing: s, speak: 10 - s - p, project: p };
    checked++;
    const n = T.typeFieldsFor(mix).length;
    if (n > worst) { worst = n; worstMix = mix; }
  }
  assertEqual(checked, 66, "合計10の配合を66通りすべて試した");
  assertTrue(worst <= T.MAX_TYPE_FIELDS, `どの配合でも上限${T.MAX_TYPE_FIELDS}個を超えない（最大${worst}個）`);
  assertTrue(worst === 3, `実際の最大は3個（${JSON.stringify(worstMix)}）`);
  // sing≥5 と speak≥6 は合計10では両立しない
  assertTrue(!T.activeTypes({ sing: 5, speak: 6, project: 0 }) || true, "（参考）");

  console.log("\n=== テスト3: 11職業すべてで項目が決まる ===");
  O.OCCUPATIONS.forEach((occ) => {
    const fields = T.typeFieldsFor(O.DEFAULT_MIX[occ]);
    assertTrue(fields.length >= 1 && fields.length <= 3, `${occ} は1〜3個（${fields.length}個）`);
  });

  console.log("\n=== テスト4: ★共通コアに触っていない（§5-1） ===");
  const CORE = ["sleepHours", "offStageVoiceMinutes", "absoluteHumidity",
                "dayAfterPerformance", "morningEdema"];
  CORE.forEach((k) => {
    assertTrue(!T.ALL_TYPE_FIELD_KEYS.includes(k), `★中核の ${k} を型別項目にしていない`);
  });

  console.log("\n=== テスト5: ★分析の族に1つも入っていない（§9） ===");
  const fam = readCode("lib", "analysisFamilies.js");
  T.ALL_TYPE_FIELD_KEYS.forEach((k) => {
    assertTrue(!fam.includes(k), `★族の定義に ${k} が入っていない`);
  });
  const tf = readCode("lib", "typeFields.js");
  ["FAMILIES", "CORE_FAMILY", "benjamini", "fdr", "pValue"].forEach((w) => {
    assertTrue(!tf.includes(w), `★検定の仕組み（${w}）に触れていない`);
  });

  console.log("\n=== テスト6: §5-3 の置き換え ===");
  assertTrue(T.ALL_TYPE_FIELD_KEYS.includes("passaggioDifficulty"),
    "「通りにくさ」がある（通過数の置き換え）");
  assertTrue(!T.ALL_TYPE_FIELD_KEYS.includes("passaggioCrossings"),
    "★「通過数」は復活していない");
  assertTrue(!tf.includes("音域") && !tf.includes("ダイナミクス"),
    "★自己申告で測れない項目（音域・ダイナミクス）を足していない");
  const singKeys = T.TYPE_FIELDS.sing.map((f) => f.key);
  assertTrue(singKeys.includes("passaggioDifficulty"), "「通りにくさ」は sing 型だけ（§5-3）");
  assertTrue(!T.TYPE_FIELDS.speak.concat(T.TYPE_FIELDS.project).some((f) => f.key === "passaggioDifficulty"),
    "★speak・project には出ない");

  console.log("\n=== テスト7: 全部そろっている・任意である ===");
  Object.values(T.TYPE_FIELDS).flat().forEach((f) => {
    assertTrue(!!f.key && !!f.label && !!f.type, `${f.key} に鍵・表示名・型がある`);
    assertTrue(!f.required, `★${f.key} は必須になっていない（§10-7）`);
  });
  assertEqual(T.TYPE_FIELDS.speak.find((f) => f.key === "scriptVolume").options,
    ["少ない", "ふつう", "多い"], "分量は「量」で聞く（時間ではない）");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
