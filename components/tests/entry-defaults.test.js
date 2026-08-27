#!/usr/bin/env node
/**
 * 「触っていない値を保存しない」ことを守るテスト。
 *
 * 【背景】新しい日のフォーム初期値が 3 や 7 で始まっていたため、その欄に一度も
 * 触れずに保存した日にも「喉3・声3・睡眠7時間・心の余裕3」が、本人の申告と
 * 区別できない形でデータベースに保存されていた。保存されてしまうと、読み取り側から
 * 本物の記録と見分ける手段はない。平均・相関・声の予報・偏差値のすべてが、
 * 作られた値を含んだまま計算されることになる。
 *
 * このテストは、その既定値が戻ってこないことだけを見張る。
 */
const fs = require("fs");
const path = require("path");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const src = fs.readFileSync(path.join(__dirname, "..", "VocalTracker.jsx"), "utf-8");

// buildFormData の「新しい日」の既定値（2つ目の return { ... };）を取り出す
const fnStart = src.indexOf("function buildFormData");
const fnBody = src.slice(fnStart, src.indexOf("\nfunction ", fnStart + 10));
const returns = [...fnBody.matchAll(/return \{/g)].map((m) => m.index);
const blank = fnBody.slice(returns[1], fnBody.indexOf("\n  };", returns[1]));

console.log("=== 新しい日の初期値に、作られた値が入っていないこと ===");
// 未記入は null / 空文字 / 空配列で持つこと。数値や前日の値を初期値にしない。
const MUST_BE_EMPTY = {
  throatCondition: "喉のコンディション",
  voiceQuality: "声の出来",
  sleepHours: "睡眠時間",
  sleepQuality: "睡眠の質",
  ease: "心の余裕"
};
Object.entries(MUST_BE_EMPTY).forEach(([field, label]) => {
  const m = blank.match(new RegExp(`\\n\\s*${field}:\\s*([^,\\n]+)`));
  assertTrue(!!m, `${field} が初期値の一覧にある`);
  if (m) assertTrue(m[1].trim() === "null", `${label}（${field}）の初期値は null（実際: ${m[1].trim()}）`);
});

const loc = blank.match(/\n\s*location:\s*([^,\n]+)/);
assertTrue(!!loc && loc[1].trim() === '""', `滞在地は前日の値を引き継がない（実際: ${loc ? loc[1].trim() : "なし"}）`);

const ve = blank.match(/\n\s*voiceEntries:\s*([^,\n]+)/);
assertTrue(!!ve && ve[1].trim() === "[]", `声の記録は0件で始まる（実際: ${ve ? ve[1].trim() : "なし"}）`);

console.log("\n=== 集計側が null を除外できること ===");
const overall = src.slice(src.indexOf("function computeOverallScore"), src.indexOf("function computeOverallScore") + 400);
assertTrue(/typeof v === "number"/.test(overall), "総合スコアは typeof で数値だけを拾っている");
assertTrue(/parts\.length === 0/.test(overall), "1件も数値が無ければ null を返す");

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。作られた値がデータベースに入るため、必ず直してください。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
