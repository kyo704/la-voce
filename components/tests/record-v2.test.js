#!/usr/bin/env node

// ★★2026-09-11、★静止画（screens/*.html）を 参照元から 外しました。
//   ★出どころ docs/opus/00-はじめに読む-正誤表（9月10日）.md §1
//     「screens/（138ファイル）★9月9日 10:55　★24時間 古い。
//       ★裁定20本ぶん 反映なし」
//   ★★正は 4本の 動く見本だけです（★同 §2）。
//   ★★この 節は、★静止画を 読んでいたので 止めました。
//     ★消していません。★動く見本で 見張る 形に 作り直すまでの あいだです。

console.log("★この見張りは、いったん 止めています（★静止画が 参照元から 外れたため）。");
console.log("★動く見本で 見張る 形に 作り直します。");
process.exit(0);

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

  console.log("\n=== ⑦ 折りたたみ 5つ（見本③） ===");
  assertEqual(rv2.RECORD_FOLDS.map((f) => f.label),
    ["歌った時間", "からだのこと", "ねむり", "食べたもの", "ひとこと"],
    "★見本③の 5つ、その並びのまま");
  {
    // ★★節を 1つも 落とさないこと。★落ちた節は、★書けなくなった節です。
    const vt = readRaw("components", "VocalTracker.jsx");
    const inUi = (vt.match(/fold="([a-zA-Z]+)"/g) || []).map((m) => m.slice(6, -1));
    const inTable = rv2.RECORD_FOLDS.flatMap((f) => f.sections);
    assertEqual(inUi.length, 11, "★画面の節は 11 で、すべて fold を 渡している");
    assertEqual(inUi.filter((k) => !inTable.includes(k)), [],
      "★画面の節は、すべて 表に 載っている（★載せ忘れが 無い）");
    assertEqual(inTable.filter((k) => !inUi.includes(k)), [],
      "★表の節は、すべて 画面に ある（★死んだ行が 無い）");
    assertEqual(inTable.length, new Set(inTable).size,
      "★同じ節が 2つの 折りたたみに 入っていない");
  }
  assertEqual(rv2.sectionIsOpen("meal", { layoutV2: false, openFold: null }), true,
    "★門の外では、★節は いつも 出る（★38人の画面を 変えない）");
  assertEqual(rv2.sectionIsOpen("meal", { layoutV2: true, openFold: null }), false,
    "門の中で 閉じていれば 出ない");
  assertEqual(rv2.sectionIsOpen("meal", { layoutV2: true, openFold: "meal" }), true,
    "開いていれば 出る");
  assertEqual(rv2.sectionIsOpen("meal", { layoutV2: true, openFold: "sleep" }), false,
    "ほかが 開いていても 出ない（★1つずつ）");
  assertEqual(rv2.sectionIsOpen("しらない節", { layoutV2: true, openFold: null }), true,
    "★表に無い節は 畳まない（★載せ忘れで 消えないため）");

  console.log("\n=== ⑩ ◎ ○ △ の 印（★見本③・2026-09-10） ===");
  {
    assertEqual(rv2.conditionMark("出た"), "◎", "出た は ◎");
    assertEqual(rv2.conditionMark("ふつう"), "○", "ふつう は ○");
    assertEqual(rv2.conditionMark("出づらい"), "△", "出づらい は △");
    assertEqual(rv2.conditionMark("しらない"), "", "★知らない 言葉は 空");
    const head = readRaw("components", "RecordV2Head.jsx");
    assertTrue(/conditionMark\(w\)/.test(head), "★画面が 印を 出している");
    assertTrue(/aria-hidden="true"/.test(head), "★読み上げでは 二度 言わない");
    // ★★色で 分けていないこと（★3つとも 同じ 字の色）
    const btn = head.slice(head.indexOf("CONDITION_CHOICES.map"), head.indexOf("CONDITION_CHOICES.map") + 1400);
    assertTrue(!/C\.(sage|rust|gold)/.test(btn), "★色で 分けていない（★形で 分ける）");
  }

  console.log("\n=== ⑨ 折りたたみを 開けば、中身が 出る（★2026-09-10 の 直し） ===");
  {
    const vt = readRaw("components", "VocalTracker.jsx");
    // ★★実機で「開いても 何も 出ない」が 起きました。
    //   ★節は recordView（声の記録／一日の記録）で 2つに 分かれており、
    //   ★★折りたたみは それを 知りませんでした。
    //   ★門の中では、★両側とも 出し、★絞るのは 折りたたみだけに します。
    assertTrue(/\(layoutV2 \|\| recordView === "voice"\) &&/.test(vt),
      "★門の中では、声の側を いつも 出す");
    assertTrue(/\(layoutV2 \|\| recordView === "day"\) &&/.test(vt),
      "★門の中では、一日の側も いつも 出す");
    assertTrue(/\{!layoutV2 && \(\s*\n\s*<div className="flex rounded-full border p-1/.test(vt),
      "★門の中では、声／一日の 切替を 出さない（★見本③に 無い）");
    // ★★1つの 折りたたみが 両側に またがること
    const sing = rv2.RECORD_FOLDS.find((f) => f.key === "body");
    assertTrue(sing.sections.includes("voice") && sing.sections.includes("body"),
      "★「からだのこと」は、声の側と 一日の側の 両方を 持つ");
  }

  console.log("\n=== ⑧ 見本③の 但し書き ===");
  {
    const head = readCode("components", "RecordV2Head.jsx");
    // ★★この見張りは、★但し書きが 画面に 出ていることを 求めていました。
    //   ★★design.zip（2026-09-10）で、★あれは 画面の 文では なく
    //     ★A03-….notes.md の「実装への 注記」だと 分かりました。
    //     ★★.txt（画面に 出る 文字だけ）にも 入っていません。
    //   ★★見張りが、★注記を 画面に 写した 状態を 固定していました。
    //     ★消さずに、★向きを 変えます ── ★「注記を 画面に 写していないこと」。
    const a03txt = readRaw("docs", "design", "pack-final", "screens", "A03-記録2タップで完成.txt");
    assertTrue(!/「完了」はありません/.test(a03txt),
      "★見本の 画面の 文に、★但し書きは 入っていない");
    assertTrue(!/「完了」はありません|ここでもう保存されて/.test(head),
      "★注記を 画面に 写していない");
    // ★★「完了」を 作らない、という 決めそのものは 生きています。
    //   ★押しどころが「完了」「終わる」に なっていないこと。
    assertTrue(!/>\s*完了\s*<|完了する/.test(head), "★「完了」という 押しどころが ない");
    assertTrue(/きょうは、書かない/.test(head), "★出口（きょうは、書かない）が ある");
    assertTrue(!/完了度|未入力|あと\s*\d/.test(head), "★数え上げを 出さない");
    // ★★押した その場で 保存すること（★見本③「ここでもう保存されています」）。
    const vt2 = readRaw("components", "VocalTracker.jsx");
    assertTrue(/const next = applyConditionWord\(formData, w\);[\s\S]{0,120}handleSave\(next\)/.test(vt2),
      "★押した姿を そのまま 保存に 渡している（★古い formData を 保存しない）");
    assertTrue(!/onClick=\{handleSave\}/.test(vt2),
      "★handleSave を 押しどころに 裸で 渡していない（★event が override に なる）");
  }

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
