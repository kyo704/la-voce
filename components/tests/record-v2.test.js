#!/usr/bin/env node
// ============================================================================
// 「記録」の 2タップ（見本③）の 見張り
//
//   ★★確かめること
//     ① 3択の 言葉と 数が、★きょうの画面の 読み方と 行って戻ること。
//     ② すでに 場面ごとに 書いてある日は、★3択を 出さないこと（★上書き防止）。
//     ③ 空いた 場面に 書くとき、★ほかの 場面を 触らないこと。
//     ④ 押した値が、★entryToRow を 通って throat_condition に 届くこと。
//        ★★ここが 肝です。★formData に 書いても 捨てられる道が あります。
//     ⑤ 門（layoutV2）の 中でだけ 出ること。
//     ⑥ 数や「あと◯」を 画面に 出さないこと。
// ============================================================================

const fs = require("fs");
const path = require("path");

const SOURCE_PATH = path.join(__dirname, "..", "VocalTracker.jsx");

// ---------------------------------------------------------------------------
// VocalTracker.jsx から、指定した名前の関数定義を「そのまま」抽出するユーティリティ。
// 波かっこの対応を数えることで、関数の終わりを正しく見つける（正規表現の限界を回避）。
// ---------------------------------------------------------------------------
function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`関数 ${name} が VocalTracker.jsx 内に見つかりませんでした。関数名が変更された可能性があります。`);
  }
  let i = source.indexOf("{", start);
  if (i === -1) throw new Error(`関数 ${name} の開始かっこが見つかりません。`);
  let depth = 0;
  let end = -1;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end === -1) throw new Error(`関数 ${name} の終わりが見つかりませんでした（波かっこの対応が崩れている可能性）。`);
  return source.slice(start, end);
}

// 関数だけでなく、`const NAME = {...}` のようなオブジェクト/配列定数も抽出する。
// 波かっこ・角かっこ両方の対応を数えて、宣言の終わり（セミコロン）を正しく見つける。
function extractConst(source, name) {
  const marker = `const ${name} = `;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`定数 ${name} が VocalTracker.jsx 内に見つかりませんでした。`);
  }
  let i = start + marker.length;
  let depth = 0;
  let end = -1;
  for (; i < source.length; i++) {
    if (source[i] === "{" || source[i] === "[") depth++;
    else if (source[i] === "}" || source[i] === "]") depth--;
    else if (source[i] === ";" && depth === 0) { end = i + 1; break; }
  }
  if (end === -1) throw new Error(`定数 ${name} の終わりが見つかりませんでした。`);
  return source.slice(start, end);
}

/**
 * ★VocalTracker が lib から借りている関数を、★そのまま持ってきます。
 *
 *   ★★entryToRow は、★lib/refluxCare.js の toRow を呼びます。
 *     ★★これは VocalTracker の中の関数ではないので、
 *       ★brace 合わせでは取り出せません。★だから、★源から読みます。
 *   ★★偽物を置かないこと。★本物を読みます。
 *     ★偽物を置くと、★検査が通っても、★本番では落ちます。
 */
function libPrelude() {
  const reflux = fs.readFileSync(
    path.join(__dirname, "..", "..", "lib", "refluxCare.js"), "utf-8")
    .replace(/^export\s+/gm, "");
  return reflux + "\nconst refluxToRow = toRow;\n";
}

function loadFunctions(names, constNames = []) {
  const source = fs.readFileSync(SOURCE_PATH, "utf-8");
  const funcSnippets = names.map((n) => extractFunction(source, n));
  const constSnippets = constNames.map((n) => extractConst(source, n));
  const sandbox = {};
  // 定数を先に、関数をあとに評価する（関数の中で定数を参照している場合があるため）。
  const code = libPrelude() + "\n" +
    constSnippets.join("\n") + "\n" + funcSnippets.join("\n") + "\n" +
    names.concat(constNames).map((n) => `sandbox.${n} = ${n};`).join("\n");
  const fn = new Function("sandbox", code);
  fn(sandbox);
  return sandbox;
}

// ---------------------------------------------------------------------------
// テスト用の最小フレームワーク（依存を増やさないため自前で用意）
// ---------------------------------------------------------------------------
let passCount = 0;
let failCount = 0;
function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    console.log(`  ✓ ${label}`);
    passCount++;
  } else {
    console.log(`  ✗ ${label}`);
    console.log(`      期待値: ${b}`);
    console.log(`      実際値: ${a}`);
    failCount++;
  }
}
function assertTrue(cond, label) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passCount++;
  } else {
    console.log(`  ✗ ${label}`);
    failCount++;
  }
}
function assertNoThrow(fn, label) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passCount++;
  } catch (err) {
    console.log(`  ✗ ${label}（例外: ${err.message}）`);
    failCount++;
  }
}

// ---------------------------------------------------------------------------
// 実装の読み込み
// ---------------------------------------------------------------------------
const { intOrNull, numOrNull, boolOrNull, weatherSourceOrNull, sumMacro, deriveActivityTypeForStorage, migrateLegacyToActivities, fiveScaleToQuality10, migrateLegacyToVoiceEntries, deriveVoiceEntryRepresentatives, deriveLegacyVoiceFieldsFromEntries, rowToEntry, entryToRow } = loadFunctions([
  "numOrNull",
  // ★entryToRow が呼ぶ新しいヘルパは、必ずここに足すこと（CLAUDE.md）。
  "boolOrNull",
  "weatherSourceOrNull",
  "sumMacro",
  "deriveActivityTypeForStorage",
  "migrateLegacyToActivities",
  "fiveScaleToQuality10",
  "migrateLegacyToVoiceEntries",
  "deriveVoiceEntryRepresentatives",
  "intOrNull",
  "quality10ToFiveScale",
  "deriveLegacyVoiceFieldsFromEntries",
  "rowToEntry",
  "entryToRow"
], [
  "VOICE_QUALITY_SLOT_TIME",
  "VOICE_QUALITY_SLOT_CONTEXT"
]);
// ---------------------------------------------------------------------------
const { readCode, readRaw } = require("./_source");
const USER_ID = "test-user-id";

(async () => {
  const rv2src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "recordV2.js"), "utf-8");
  const rv2 = await import("data:text/javascript;base64," + Buffer.from(rv2src).toString("base64"));
  const tcsrc = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "todayCard.js"), "utf-8");
  const tc = await import("data:text/javascript;base64," + Buffer.from(tcsrc).toString("base64"));

  console.log("\n=== ① 3択の 言葉と 数 ===");
  rv2.CONDITION_CHOICES.forEach((w) => {
    const v = rv2.conditionValue(w);
    assertEqual(tc.conditionWord(v), w, `${w} → ${v} → ${w}（行って戻る）`);
  });
  assertEqual(rv2.conditionValue("よい"), null, "★知らない言葉は null");
  assertEqual(rv2.CONDITION_CHOICES.length, 3, "3択である");

  console.log("\n=== ② 上書きを しない ===");
  assertEqual(rv2.mayUseQuickCondition({ voiceEntries: [{ bodyFeel: 5 }] }), false,
    "★場面ごとに 書いてある日は、3択を 出さない");
  assertEqual(rv2.mayUseQuickCondition({ voiceEntries: [{ bodyFeel: null }] }), true,
    "空の 場面だけなら 出す");
  assertEqual(rv2.mayUseQuickCondition({}), true, "場面が 無ければ 出す");
  const kept = { voiceEntries: [{ id: "a", bodyFeel: 5 }, { id: "b", bodyFeel: null }] };
  assertEqual(rv2.applyConditionWord(kept, "出づらい"), kept,
    "★書いてある日は、押しても 1つも 変えない");

  console.log("\n=== ③ 空いた 場面に 書く ===");
  const two = { voiceEntries: [{ id: "a", bodyFeel: null, note: "あ" }, { id: "b", bodyFeel: null, note: "い" }] };
  const after = rv2.applyConditionWord(two, "ふつう");
  assertEqual(after.voiceEntries[0].bodyFeel, 3, "1つめに 書く");
  assertEqual(after.voiceEntries[1].bodyFeel, null, "2つめは 触らない");
  assertEqual(after.voiceEntries[0].note, "あ", "ほかの 中身を 消さない");
  assertEqual(two.voiceEntries[0].bodyFeel, null, "★もとの記録を 書き換えない");

  console.log("\n=== ④ entryToRow まで 届く ===");
  const P = { records_consent_at: "2026-01-01T00:00:00Z" };
  [["出た", 4], ["ふつう", 3], ["出づらい", 2]].forEach(([w, v]) => {
    const e = rv2.applyConditionWord({ date: "2026-09-09" }, w);
    assertEqual(entryToRow(USER_ID, e).throat_condition, v,
      `場面が無い日：${w} が throat_condition ${v} で 届く`);
    const e2 = rv2.applyConditionWord(
      { date: "2026-09-09", voiceEntries: [{ id: "a", at: "08:00", context: "wake", bodyFeel: null }] }, w);
    assertEqual(entryToRow(USER_ID, e2).throat_condition, v,
      `★場面が1つ空いている日：${w} が throat_condition ${v} で 届く`);
  });

  console.log("\n=== ⑤⑥ 門と、見本の 決まり ===");
  const head = readCode("components", "RecordV2Head.jsx");
  assertTrue(!/あと\s*\d|あと[０-９]|データ不足/.test(head), "「あと◯」「データ不足」と 書かない");
  assertTrue(!/NEXT_PUBLIC/.test(head), "画面じしんは 環境変数を 読まない");
  assertTrue(!/throatCondition\s*[:=]|voiceEntries/.test(head),
    "★行き先を 画面で 決めない（★lib/recordV2.js だけが 決める）");
  const vt = readRaw("components", "VocalTracker.jsx");
  assertTrue(/\{layoutV2 && formData && \(\s*\n\s*<RecordV2Head/.test(vt),
    "★RecordV2Head は 門の 中でだけ 出る");
  assertTrue(vt.includes("<RecordV2Head"), "呼ばれている（★作って 呼ばない ものを 残さない）");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  process.exit(failCount > 0 ? 1 : 0);
})();
