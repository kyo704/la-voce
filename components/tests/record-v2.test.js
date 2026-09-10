#!/usr/bin/env node

// ============================================================================
// 「記録」の 3択（★動く見本 S_kiroku）の 見張り
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     ★★静止画（screens/*.html）は 参照元から 外れました（★正誤表 §1）。
//     ★★2026-09-11、★動く見本で 見張る 形に 作り直しました。
//
//   ★★確かめること
//     ① 3択 3つの 言葉と 数が、★行って戻ること。
//     ② すでに 場面ごとに 書いてある日は、★3択を 出さないこと（★上書き防止）。
//     ③ 空いた 場面に 書くとき、★ほかの 場面を 触らないこと。
//     ④ 押した値が、★entryToRow を 通って 列に 届くこと。
//        ★★ここが 肝です。★formData に 書いても 捨てられる道が あります。
//     ⑤ 3つの 3択が、★別々の 列に 書くこと（★上書きし合わない）。
//     ⑥ 節の 出し分け（★どの 1枚の 中に 出るか）。
//     ⑦ 数や「あと◯」を 画面に 出さないこと。
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


  console.log("\n=== ① 3択 3つの 言葉と 数 ===");
  assertEqual(rv2.EDEMA_CHOICES.length, 3, "むくみ は 3択");
  assertEqual(rv2.THROAT_CHOICES.length, 3, "のどの調子 は 3択");
  assertEqual(rv2.DEKI_CHOICES.length, 3, "声の出来 は 3択");
  assertEqual(rv2.MARKS, ["◎", "○", "△"], "印は ◎○△（★左が よいほう）");
  rv2.EDEMA_CHOICES.forEach((w, i) => {
    assertEqual(rv2.edemaValue(w), i, `むくみ ${w} → ${i}`);
    assertEqual(rv2.edemaWord(i), w, `　${i} → ${w}（行って戻る）`);
    assertEqual(rv2.markOf(rv2.EDEMA_CHOICES, w), rv2.MARKS[i], `　印は ${rv2.MARKS[i]}`);
  });
  [rv2.THROAT_CHOICES, rv2.DEKI_CHOICES].forEach((set) => {
    set.forEach((w, i) => {
      const v = rv2.fiveOf(set, w);
      assertEqual(v, [4, 3, 2][i], `${w} → ${v}`);
      assertEqual(rv2.wordOfFive(set, v), w, `　${v} → ${w}（行って戻る）`);
    });
  });
  // ★★端（5／1）を 書きません。★これまで 5 と 書いてきた方の 記録と、
  //   ★同じ言葉なのに 値が ずれるからです。
  assertTrue(!rv2.THROAT_CHOICES.map((w) => rv2.fiveOf(rv2.THROAT_CHOICES, w)).includes(5),
    "★5 を 書かない");
  assertTrue(!rv2.DEKI_CHOICES.map((w) => rv2.fiveOf(rv2.DEKI_CHOICES, w)).includes(1),
    "★1 を 書かない");
  assertEqual(rv2.fiveOf(rv2.THROAT_CHOICES, "しらない"), null, "★知らない言葉は null");
  // ★★きょうの画面（A01）の 読み方と そろっていること。
  //   ★conditionWord は「出た／ふつう／出づらい」を 返します＝★声の出来 です。
  rv2.DEKI_CHOICES.forEach((w) => {
    assertEqual(tc.conditionWord(rv2.fiveOf(rv2.DEKI_CHOICES, w)), w,
      `A01 の 読み方と そろう：${w}`);
  });
  {
    const home = readCode("components", "HomeV2.jsx");
    assertTrue(/conditionWord\(today\.voiceQuality\)/.test(home),
      "★A01 の「こえの調子」は 声の出来（voiceQuality）を 読む");
    assertTrue(!/conditionWord\(today\.throatCondition\)/.test(home),
      "★のどの列を「出た／出づらい」の 言葉で 読んでいない");
  }

  console.log("\n=== ② 上書きを しない ===");
  assertEqual(rv2.mayUseQuickCondition({ voiceEntries: [{ bodyFeel: 5 }] }), false,
    "★場面ごとに 書いてある日は、3択を 出さない");
  assertEqual(rv2.mayUseQuickCondition({ voiceEntries: [{ quality: 7 }] }), false,
    "★出来だけ 場面ごとに 書いてある日も、出さない");
  assertEqual(rv2.mayUseQuickCondition({ voiceEntries: [{ bodyFeel: null }] }), true,
    "空の 場面だけなら 出す");
  assertEqual(rv2.mayUseQuickCondition({}), true, "場面が 無ければ 出す");
  assertEqual(rv2.mayUseQuickCondition(
    { voiceEntries: [{ bodyFeel: 4, source: "migrated", context: "other" }] }), true,
    "★移行で 作った 写しは、場面の記録では ない（★notOutDates と 同じ穴を 作らない）");
  const kept = { voiceEntries: [{ id: "a", bodyFeel: 5 }, { id: "b", bodyFeel: null }] };
  assertEqual(rv2.applyThroatWord(kept, "わるい"), kept,
    "★書いてある日は、のどを 押しても 1つも 変えない");
  assertEqual(rv2.applyDekiWord(kept, "出づらい"), kept,
    "★書いてある日は、出来を 押しても 1つも 変えない");

  console.log("\n=== ③ 空いた 場面に 書く ===");
  const two = { voiceEntries: [{ id: "a", bodyFeel: null, note: "あ" }, { id: "b", bodyFeel: null, note: "い" }] };
  const after = rv2.applyThroatWord(two, "ふつう");
  assertEqual(after.voiceEntries[0].bodyFeel, 3, "1つめに 書く");
  assertEqual(after.voiceEntries[1].bodyFeel, null, "2つめは 触らない");
  assertEqual(after.voiceEntries[0].note, "あ", "ほかの 中身を 消さない");
  assertEqual(two.voiceEntries[0].bodyFeel, null, "★もとの記録を 書き換えない");

  console.log("\n=== ④ entryToRow まで 届く ===");
  [["よい", 4], ["ふつう", 3], ["わるい", 2]].forEach(([w, v]) => {
    const e = rv2.applyThroatWord({ date: "2026-09-09" }, w);
    assertEqual(entryToRow(USER_ID, e).throat_condition, v,
      `場面が無い日：のど ${w} が throat_condition ${v} で 届く`);
    const e2 = rv2.applyThroatWord(
      { date: "2026-09-09", voiceEntries: [{ id: "a", at: "08:00", context: "wake", bodyFeel: null }] }, w);
    assertEqual(entryToRow(USER_ID, e2).throat_condition, v,
      `★場面が1つ空いている日：のど ${w} が throat_condition ${v} で 届く`);
  });
  [["出た", 4], ["ふつう", 3], ["出づらい", 2]].forEach(([w, v]) => {
    const e = rv2.applyDekiWord({ date: "2026-09-09" }, w);
    assertEqual(entryToRow(USER_ID, e).voice_quality, v,
      `場面が無い日：出来 ${w} が voice_quality ${v} で 届く`);
    const e2 = rv2.applyDekiWord(
      { date: "2026-09-09", voiceEntries: [{ id: "a", at: "08:00", context: "wake", quality: null }] }, w);
    assertEqual(entryToRow(USER_ID, e2).voice_quality, v,
      `★場面が1つ空いている日：出来 ${w} が voice_quality ${v} で 届く`);
  });
  rv2.EDEMA_CHOICES.forEach((w, i) => {
    const e = rv2.applyEdemaWord({ date: "2026-09-09" }, w);
    assertEqual(entryToRow(USER_ID, e).morning_edema, i,
      `むくみ ${w} が morning_edema ${i} で 届く`);
  });

  console.log("\n=== ⑤ 3つは 別々の 列（★上書きし合わない） ===");
  {
    // ★★のどを 押してから 出来を 押しても、★のどが 消えないこと。
    let e = { date: "2026-09-09" };
    e = rv2.applyThroatWord(e, "よい");
    e = rv2.applyDekiWord(e, "出づらい");
    e = rv2.applyEdemaWord(e, "すこし");
    const row = entryToRow(USER_ID, e);
    assertEqual(row.throat_condition, 4, "★のどが 残っている");
    assertEqual(row.voice_quality, 2, "★出来が 残っている");
    assertEqual(row.morning_edema, 1, "★むくみが 残っている");
    // ★★逆の 順でも 同じこと。
    let f = { date: "2026-09-09" };
    f = rv2.applyDekiWord(f, "出た");
    f = rv2.applyThroatWord(f, "わるい");
    const row2 = entryToRow(USER_ID, f);
    assertEqual(row2.voice_quality, 4, "★順が 逆でも 出来が 残る");
    assertEqual(row2.throat_condition, 2, "★順が 逆でも のどが 残る");
  }

  console.log("\n=== ⑥ 節が どの 1枚の 中に 出るか ===");
  {
    const vt = readRaw("components", "VocalTracker.jsx");
    const inUi = [...new Set((vt.match(/fold="([a-zA-Z]+)"/g) || []).map((m) => m.slice(6, -1)))];
    const inTable = rv2.SECTION_SHEETS.flatMap((f) => f.sections);
    // ★★気候・滞在地（env）だけは わざと 表に 載せていません
    //   （★坂本さんの お決め 5-b ㋒「当面、そのまま、下に残す」）。
    assertEqual(inUi.filter((k) => !inTable.includes(k)), ["env"],
      "★表に 載っていない節は、気候・滞在地 ひとつだけ");
    assertEqual(inTable.filter((k) => !inUi.includes(k)), [],
      "★表の節は、すべて 画面に ある（★死んだ行が 無い）");
    assertEqual(inTable.length, new Set(inTable).size,
      "★同じ節が 2つの 1枚に 入っていない");
  }
  assertEqual(rv2.sectionIsOpen("meal", { layoutV2: false, openSheet: null }), true,
    "★門の外では、★節は いつも 出る（★38人の画面を 変えない）");
  assertEqual(rv2.sectionIsOpen("meal", { layoutV2: false, openSheet: "からだ" }), true,
    "★門の外では、1枚が 開いていても 全部 出る");
  assertEqual(rv2.sectionIsOpen("meal", { layoutV2: true, openSheet: null }), false,
    "門の中で 1枚が 閉じていれば 出ない");
  assertEqual(rv2.sectionIsOpen("meal", { layoutV2: true, openSheet: "たべ" }), true,
    "その 1枚が 開いていれば 出る");
  assertEqual(rv2.sectionIsOpen("meal", { layoutV2: true, openSheet: "からだ" }), false,
    "ほかの 1枚が 開いていても 出ない");
  assertEqual(rv2.sectionIsOpen("env", { layoutV2: true, openSheet: null }), true,
    "★気候・滞在地は、1枚が 閉じている あいだ 画面に 出る（★お決め 5-b ㋒）");
  assertEqual(rv2.sectionIsOpen("env", { layoutV2: true, openSheet: "からだ" }), false,
    "★1枚が 開いている あいだは 出ない（★1枚の 中に 紛れ込ませない）");
  assertEqual(rv2.sheetOfSection("しらない節"), null, "★表に無い節は null");

  console.log("\n=== ⑦ 数え上げを 出さない ===");
  {
    const head = readCode("components", "RecordV2Head.jsx");
    // ★★下の 3行は「出しません」と 書いてある 但し書きです。★先に 外します。
    const body = head.replace(/A03_NOTES[\s\S]*?\}\)\}/g, "");
    assertTrue(!/完了度|未入力|あと\s*\d|あと\s*\{/.test(body), "★数え上げを 出さない");
    assertTrue(!/>\s*完了\s*<|完了する/.test(body), "★「完了」という 押しどころが ない");
    assertTrue(/A03_SKIP/.test(head), "★出口（きょうは 書かない）が ある");
    assertTrue(/aria-hidden="true"/.test(head), "★印は 読み上げで 二度 言わない");
    // ★★色で 分けていないこと（★形で 分ける）。
    const tri = head.slice(head.indexOf("function Tri("), head.indexOf("export default"));
    assertTrue(!/C\.(sage|rust|gold)/.test(tri), "★色で 分けていない");
    // ★★押した その場で 保存すること。
    const vt2 = readRaw("components", "VocalTracker.jsx");
    ["applyEdemaWord", "applyThroatWord", "applyDekiWord"].forEach((fn) => {
      assertTrue(new RegExp(`const n = ${fn}\\(formData, w\\); setFormData\\(n\\); handleSave\\(n\\)`).test(vt2),
        `★${fn}：押した姿を そのまま 保存に 渡している`);
    });
  }

  console.log(`\n通過 ${passCount} ／ 失敗 ${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
