#!/usr/bin/env node

// ============================================================================
// 気になったこと（印）が、★列まで 届くことの 見張り
//
//   ★出どころ docs/reports/2026-09-11-A03シートの精査.md §1
//     ★2026-09-11、★「からだのこと」の 1枚で つけた 印が、
//       ★声の記録の ある日は 保存されずに 消えていました。
//     ★★列は throat_symptoms 1つ、★書く 入口は 2つ あります。
//
//   ★★この見張りは、★文字を くらべません。★entryToRow を 実際に 走らせます。
//     ★★前の 誤りは、★「書いてあるか」を 見て「届くか」を 見なかったこと でした。
//
//   ★★確かめること
//     ① 場面の 記録が ある日でも、★1枚で つけた 印が 列に 届くこと
//     ② 場面が 無い日でも 届くこと
//     ③ 場面の 印を 触ったら、★その日 ぜんぶの 印にも 映ること
//     ④ 1枚だけで つけた 印を、★場面を 触っても 消さないこと
//     ⑤ 外した 印は、★ちゃんと 外れること（★消せない ことも 困ります）
// ============================================================================

const fs = require("fs");
const path = require("path");

const SRC = fs.readFileSync(path.join(__dirname, "..", "VocalTracker.jsx"), "utf-8");

function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`関数 ${name} が 見つかりません`);
  let i = source.indexOf("{", start), depth = 0, end = -1;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end === -1) throw new Error(`関数 ${name} の 終わりが 見つかりません`);
  return source.slice(start, end);
}
function extractConst(source, name) {
  const marker = `const ${name} = `;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`定数 ${name} が 見つかりません`);
  let i = start + marker.length, depth = 0, end = -1;
  for (; i < source.length; i++) {
    const c = source[i];
    if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") depth--;
    else if (c === ";" && depth === 0) { end = i + 1; break; }
  }
  return source.slice(start, end);
}

// ★★lib から 借りている ものは、★本物を 読みます。★偽物を 置きません。
const reflux = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "refluxCare.js"), "utf-8")
  .replace(/^export\s+/gm, "");

const NAMES = [
  "numOrNull", "boolOrNull", "weatherSourceOrNull", "sumMacro",
  "deriveActivityTypeForStorage", "migrateLegacyToActivities", "fiveScaleToQuality10",
  "migrateLegacyToVoiceEntries", "deriveVoiceEntryRepresentatives", "intOrNull",
  "quality10ToFiveScale", "deriveLegacyVoiceFieldsFromEntries", "rowToEntry", "entryToRow"
];
const CONSTS = ["VOICE_QUALITY_SLOT_TIME", "VOICE_QUALITY_SLOT_CONTEXT"];

const box = {};
new Function("box",
  reflux + "\nconst refluxToRow = toRow;\n"
  + CONSTS.map((n) => extractConst(SRC, n)).join("\n") + "\n"
  + NAMES.map((n) => extractFunction(SRC, n)).join("\n") + "\n"
  + NAMES.concat(CONSTS).map((n) => `box.${n} = ${n};`).join("\n"))(box);

let ok = 0, ng = 0;
function eq(a, b, label) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  if (ja === jb) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label + `\n      期待 ${jb}\n      実際 ${ja}`); ng++; }
}
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const U = "u";
const D = "2026-09-10";
/** ★移行で 作られる 写し（★1度 保存して 読み直すと 必ず できます）。 */
const migrated = (symptoms) => ([{
  id: "m", date: D, at: "12:00", context: "other",
  bodyFeel: 3, quality: 5, symptoms: symptoms || [], source: "migrated"
}]);

(async () => {
  const rv2src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "recordV2.js"), "utf-8");
  const rv2 = await import("data:text/javascript;base64,"
    + Buffer.from(rv2src).toString("base64"));

  console.log("① 場面の 記録が ある日でも、印が 列に 届く");
  {
    // ★★これが 実機で 起きていた 形です。
    //   ★読み込んだ 直後は、その日の 印と 場面の 印が 同じ 並びです。
    //   ★そこから「からだのこと」の 1枚で 1つ 足します。
    const e = {
      date: D,
      throatSymptoms: ["のどが いがらっぽい", "せきばらい"],
      voiceEntries: migrated(["のどが いがらっぽい"])
    };
    eq(box.entryToRow(U, e).throat_symptoms,
      ["のどが いがらっぽい", "せきばらい"], "★1枚で 足した 印が 届く");
  }

  console.log("\n② 場面が 無い日でも 届く");
  eq(box.entryToRow(U, { date: D, throatSymptoms: ["痛み"] }).throat_symptoms,
    ["痛み"], "場面が 無い日");

  console.log("\n③ 外した 印は、ちゃんと 外れる");
  {
    const e = {
      date: D, throatSymptoms: [],
      voiceEntries: migrated(["のどが いがらっぽい"])
    };
    eq(box.entryToRow(U, e).throat_symptoms, [], "★ぜんぶ 外せる（★消せないのも 困ります）");
  }

  console.log("\n④ 場面を 触ったら、その日 ぜんぶの 印に 映る");
  {
    const before = { date: D, throatSymptoms: ["咳"], voiceEntries: migrated(["咳"]) };
    const nextScenes = [{ ...before.voiceEntries[0], symptoms: ["咳", "痛み"] }];
    const merged = rv2.mergeSceneSymptoms(before, nextScenes);
    eq(merged, ["咳", "痛み"], "★場面で 足した 印が、その日 ぜんぶの 印に 入る");
    eq(box.entryToRow(U, { ...before, voiceEntries: nextScenes, throatSymptoms: merged })
      .throat_symptoms, ["咳", "痛み"], "★そのまま 列に 届く");
  }

  console.log("\n⑤ 1枚だけで つけた 印を、場面を 触っても 消さない");
  {
    // ★「乾燥」は どの 場面にも 無く、★1枚だけで つけた 印です。
    const before = {
      date: D, throatSymptoms: ["咳", "乾燥"], voiceEntries: migrated(["咳"])
    };
    const nextScenes = [{ ...before.voiceEntries[0], symptoms: ["痛み"] }];
    const merged = rv2.mergeSceneSymptoms(before, nextScenes);
    t(merged.includes("乾燥"), "★1枚だけの 印（乾燥）が 残る");
    t(merged.includes("痛み"), "★場面で 足した 印（痛み）が 入る");
    t(!merged.includes("咳"), "★場面から 外した 印（咳）は 外れる");
  }

  console.log("\n⑥ 場面を 消しても、1枚だけの 印は 残る");
  {
    const before = {
      date: D, throatSymptoms: ["咳", "乾燥"], voiceEntries: migrated(["咳"])
    };
    const merged = rv2.mergeSceneSymptoms(before, []);
    eq(merged, ["乾燥"], "★場面ごと 消しても、1枚だけの 印は 残る");
  }

  console.log("\n⑦ 呼ぶ側が、★映す 決めを 通っていること");
  {
    t(/throatSymptoms: mergeSceneSymptoms\(f, next\)/.test(SRC),
      "★updateVoiceEntry が mergeSceneSymptoms を 通る");
    const count = (SRC.match(/mergeSceneSymptoms\(f, next\)/g) || []).length;
    eq(count, 2, "★場面を 差し替える 2か所（直す・消す）とも 通っている");
    t(!/voiceLegacy \? voiceLegacy\.throatSymptoms : e\.throatSymptoms\) \|\| \[\]/.test(SRC),
      "★古い 書き方（場面を 優先する）が 残っていない");
  }

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
