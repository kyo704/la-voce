#!/usr/bin/env node
/**
 * その日を代表する活動の選び方（2026-09-01）
 *
 * ★何があったか
 *   声の高さの推移グラフは、点の色を entries.activity_type（旧列）から
 *   作っていました。あの列は★いちばん長い活動しか残しません。
 *   90分の自主練習のあとに20分の本番があった日は「自主練習」の色になり、
 *   ★いちばん体に効いた出来事がグラフから消えていました。
 *
 * ★同じ形の間違いを、1日に3回見つけました
 *   ① voiceEntries[0]（並び順の先頭を朝だと思っていた）
 *   ② このグラフ（旧列の「いちばん長い」をそのまま色にしていた）
 *   ③ 曜日ごとの傾向（activities[0] で活動を決めていた）
 *   どれも「正しい新しい関数はあるのに、古い呼び出し側が移っていない」形です。
 *
 * ★保存と表示は別の問い（憲章 §10）
 *   保存（activity_type）は「いちばん長い活動」のままにします。
 *   意味を変えると、これまでの行とこれからの行で同じ列の意味が変わり、
 *   ★読む側からは見分けがつきません。
 */
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
const vt = readCode("components", "VocalTracker.jsx");
const W = { "休養": 0, "自主練習": 1.0, "レッスン": 1.2, "リハーサル": 1.3, "本番": 1.6 };

(async () => {
  const ap = await import("../../lib/activityPrecedence.js");

  console.log("=== ★負荷の大きい活動が代表になる ===");
  {
    const day = { activities: [{ kind: "自主練習", minutes: 90 }, { kind: "本番", minutes: 20 }] };
    assertTrue(ap.representativeActivityKind(day, W) === "本番",
      "★90分の自主練習より、20分の本番が勝つ（これが直した不具合）");
    const day2 = { activities: [{ kind: "本番", minutes: 20 }, { kind: "自主練習", minutes: 90 }] };
    assertTrue(ap.representativeActivityKind(day2, W) === "本番",
      "★並び順を変えても、同じ答えになる");
    const day3 = { activities: [{ kind: "レッスン", minutes: 30 }, { kind: "リハーサル", minutes: 30 }] };
    assertTrue(ap.representativeActivityKind(day3, W) === "リハーサル", "リハーサル＞レッスン");
  }

  console.log("\n=== 同じ重みのときは、長いほう ===");
  {
    const day = { activities: [{ kind: "自主練習", minutes: 30 }, { kind: "自主練習", minutes: 60 }] };
    const rep = ap.pickRepresentativeActivity(day.activities, W);
    assertTrue(rep && rep.minutes === 60, "重みが同じなら長いほう");
  }

  console.log("\n=== 記録が無い日・休養の日 ===");
  {
    assertTrue(ap.representativeActivityKind({ activities: [], recovery: {} }, W) === "休養",
      "休養だけの日は 休養");
    assertTrue(ap.representativeActivityKind({ activities: [] }, W) === null, "何も無ければ null");
    assertTrue(ap.representativeActivityKind(null, W) === null, "entry が無くても落ちない");
    assertTrue(ap.pickRepresentativeActivity([{ kind: "知らない種類", minutes: 10 }], W).kind === "知らない種類",
      "★知らない種類でも落ちない（重み0として扱う）");
  }

  console.log("\n=== ★順位表を、この中に書き写していない ===");
  {
    const src = readCode("lib", "activityPrecedence.js");
    // ★重みは引数で受け取ること。書き写すと、2つが食い違います。
    assertTrue(!/自主練習"\s*:\s*1\.0|本番"\s*:\s*1\.6/.test(src),
      "★重みの値を書き写していない（引数で受け取る）");
    assertTrue(/weights/.test(src), "重みを引数で受け取っている");
  }

  console.log("\n=== ★保存の側は、意味を変えていない ===");
  {
    assertTrue(/function deriveActivityTypeForStorage/.test(vt),
      "★保存用の関数は、名前で用途が分かる");
    assertTrue(!/derivePrimaryActivityLegacy/.test(vt), "古い名前が残っていない");
    // 中身は「いちばん長い」のままであること
    const at = vt.indexOf("function deriveActivityTypeForStorage");
    const body = vt.slice(at, at + 260);
    assertTrue(/minutes\)\s*\|\|\s*0\)\s*>=/.test(body),
      "★保存は『いちばん長い活動』のまま（意味を変えない）");
    // ★呼び出しは1か所だけ（保存の経路）であること
    const calls = (vt.match(/deriveActivityTypeForStorage\(/g) || []).length;
    assertTrue(calls === 2, `★定義1つと呼び出し1つだけ（いまは ${calls}）`);
  }

  console.log("\n=== ★表示は、旧列から色を作っていない ===");
  {
    assertTrue(/activityColor: ACTIVITY_CHART_COLORS\[representativeActivityKind/.test(vt),
      "★グラフの色は、負荷の重みで選んでいる");
    assertTrue(!/activityColor: ACTIVITY_CHART_COLORS\[e\.activityType\]/.test(vt),
      "★旧列をそのまま色にしていない");
    assertTrue(!/\(entry\.activities \|\| \[\]\)\[0\] && entry\.activities\[0\]\.kind/.test(vt),
      "★曜日ごとの傾向が activities[0] で決めていない");
  }

  console.log("\n=== ★凡例に、決まりが書いてある ===");
  {
    assertTrue(/MULTI_ACTIVITY_LEGEND_NOTE/.test(vt), "凡例に説明を出している");
    assertTrue(ap.MULTI_ACTIVITY_LEGEND_NOTE.includes("いちばん負荷の大きい活動"),
      "★何で選んでいるかを言っている");
  }

  console.log("\n=== 憲章に、列の意味が書いてある ===");
  {
    const charter = readRaw("docs", "lavoce-設計憲章.md");
    assertTrue(/その日最も長く続いた活動/.test(charter), "★activity_type の意味が書いてある");
    assertTrue(/長さだけで決まる/.test(charter), "★長さだけ、と明記してある");
    assertTrue(/保存のための判定と、表示のための判定は、似ていても別の問い/.test(charter),
      "★2つの判定を混ぜない、と書いてある");
    assertTrue(/書けるのに、本人に返らない項目を作らない/.test(charter),
      "★返す場所を同時に作る、と書いてある");
  }

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
