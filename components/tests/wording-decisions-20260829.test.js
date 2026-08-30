#!/usr/bin/env node
/**
 * 判断の回答（2026-08-29）の文言の決定を固定する
 *
 * 出典 docs/lavoce-判断の回答-配布前の決定-20260829.md §3・§4・§6
 *
 * ★方針（§4）
 *   画面には事実だけを書く。評価語（リスク・注意・良い・悪い）を使わない。
 *   学術用語の正式名は、「学ぶ」の記事の中だけに置く。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");
const vtRaw = readRaw("components", "VocalTracker.jsx");
const tr = readRaw("lib", "translations.js");
const charter = readRaw("docs", "lavoce-設計憲章.md");

console.log("=== §3 「診断」を機能名に使わない ===");
assertTrue(!/>セットリスト診断</.test(vt), "★画面に「セットリスト診断」が無い");
assertTrue(/>曲順を組む</.test(vt), "「曲順を組む」になっている");
// ★「診断」が残ってよいのは、否定文の中だけ。
const shown = [...vt.matchAll(/[>「]([^<>「」{}\n]*診断[^<>「」{}\n]*)/g)].map((m) => m[1].trim()).filter(Boolean);
const bad = shown.filter((s) => !/ではありません|できません|しません|受けている|診断済み/.test(s));
assertTrue(bad.length === 0,
  `★「診断」は否定文の中だけ${bad.length ? "　★" + bad.slice(0, 3).join(" ／ ") : ""}`);
assertTrue(/「診断」を機能名・画面名に使わない/.test(charter), "★憲章 §2-1 に追記されている");

console.log("\n=== §4-1 PRI は略称だけ ===");
assertTrue(!/病的リスク指標/.test(vt), "★画面に「病的リスク指標」が無い");
assertTrue(/\{ name: "PRI", start: 10, end: 17 \}/.test(vt), "略称で出している");
assertTrue(/VFI|vfi/.test(vt), "★尺度そのものは残っている（名前だけの話）");

console.log("\n=== §4-2 「リスクは主に下側」 ===");
assertTrue(!/リスクは主に下側/.test(vt), "★古い言い方が無い");
assertTrue(/下側だけを見ています/.test(vt), "事実だけの言い方になっている");

console.log("\n=== §4-3 夕食から就寝まで：事実だけ・毎回計算 ===");
const dinner = (tr.match(/^  flagDinnerGap: \{(.*?)\},$/ms) || [])[1] || "";
const pairs = [...dinner.matchAll(/(\w+): "([^"]*)"/g)];
assertTrue(pairs.length === 9, `9言語ある（${pairs.length}）`);
const evaluative = pairs.filter(([, , v]) => /リスク|注意|risk|Risiko|rischio|riesgo|위험|риск/i.test(v));
assertTrue(evaluative.length === 0, "★どの言語にも評価語が無い");
assertTrue(pairs.every(([, , v]) => v.includes("{hours}")), "★9言語すべてに時間の差し込みがある");
// ★保存していないこと。毎回計算すること。
assertTrue(/computeTimeGapHours\(y\.dinnerTime, y\.bedtime\)/.test(vt), "★時刻の差を毎回計算している");
assertTrue(!/dinner_gap|dinnerGapHours:/.test(vt), "★時刻の差を保存していない");
assertTrue(/hours: Math\.round\(dinnerGap \* 10\) \/ 10/.test(vt), "その場で丸めて渡している");
assertTrue(/function flagText\(t, flagKey, values\)/.test(vt), "差し込みは1か所");

console.log("\n=== §6 同意文：用途を1つに絞る ===");
assertTrue(!/機能改善/.test(vt), "★「機能改善」が残っていない");
assertTrue((vt.match(/分析に使う定数の較正/g) || []).length >= 2, "★2か所とも書き換わっている");
assertTrue(!/サービス改善等|など、その他/.test(vt), "★「等」であいまいにしていない");

console.log("\n=== §5 記事の本文は対象外（憲章への追記） ===");
assertTrue(/記事の本文は、§2-1 の対象外とする/.test(charter), "★憲章に追記されている");
assertTrue(/記事から個人の記録へ数値を差し込まないこと/.test(charter), "★但し書きも入っている");
// 記事の本文は、意図して残していること
assertTrue(/器質的な異常がないのに生じる/.test(readRaw("lib", "healthInfoContent.js")),
  "★医学的定義はそのまま残っている（置き換えると意味が変わる）");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
