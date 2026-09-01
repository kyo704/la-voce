#!/usr/bin/env node
/**
 * 練習目標のタグは、隠す条件ではなく並べる順番（2026-09-01）
 *
 * ★何が起きていたか
 *   最長発声時間（MPT）を含む7つの指標が、
 *   ★練習目標のタグに選んだ人にしか見えませんでした。
 *     弱声の最高音／ルーティン後の音名／音域幅／CPPS／
 *     発声負荷バランス（ACWR）／最長発声時間（MPT）／音色の均一感
 *   さらに、枠そのものが「練習目標を書いた人」にしか出ませんでした。
 *
 *   MPT は詳細の折りたたみの中にあり、ACWR は誰でも記録する活動から出ます。
 *   ★記録しているのに、返ってこない状態でした（憲章 §10）。
 *
 * ★練習目標は「何に集中するか」であって、
 *   ★自分の記録を見てよいかの許可ではありません。
 */
const { readCode, readRaw, stripComments } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const raw = readRaw("components", "VocalTracker.jsx");
const vt = readCode("components", "VocalTracker.jsx");

const memoAt = raw.indexOf("const practiceGoalMetrics = useMemo");
const memo = raw.slice(memoAt, raw.indexOf("}, [profile.practice_goal_tags", memoAt));

// ★コメントを外した本文。禁止語の検査は必ずこちらで行うこと
//   （この repo では、自分の説明コメントに引っかかる失敗を何度もやっています。
//     今回も「準備中です」と書いた自分のコメントに引っかかりました）。
const memoCode = stripComments(memo);

(async () => {
console.log("=== ★選んでいない人にも、記録した指標が返る ===");
{
  // 以前：選んだタグが無ければ、空を返していた。
  // ★変数名を変えても効くように、形で見ます。
  //   （はじめ古い変数名（tags）で書いていて、chosen に変えた再発を
  //     見逃しました。わざと戻して気づきました）
  assertTrue(!/length === 0\)\s*return \[\];/.test(memoCode),
    "★「選んでいなければ、何も出さない」という早期の打ち切りが無い");
  assertTrue(/GOAL_TAGS\.map\(\(g\) => g\.key\)/.test(memo),
    "★7つすべてを対象にしている（選んだものだけではない）");
}

console.log("\n=== 選んだタグは、先頭に寄せる（順番だけ） ===");
{
  assertTrue(/filter\(\(k\) => chosen\.includes\(k\)\)/.test(memo), "選んだものを先に");
  assertTrue(/filter\(\(k\) => !chosen\.includes\(k\)\)/.test(memo), "選んでいないものをあとに");
  // ★順番を変えるだけで、出す・出さないの判断に使っていないこと
  assertTrue(!/if \(!chosen\.includes\(tag\)\) return;/.test(memo),
    "★選んでいないタグを、途中で捨てていない");
}

console.log("\n=== ★外側のゲートが外れている ===");
{
  assertTrue(!/\{profile\.practice_goal && !editingPracticeGoal && \(/.test(raw),
    "★「練習目標を書いた人だけ」の条件が消えている");
  assertTrue(/\{practiceGoalMetrics\.length > 0 && !editingPracticeGoal && \(/.test(raw),
    "★出すものがあるときだけ、枠を出す");
}

console.log("\n=== ★空の札を並べない ===");
{
  // 選んでいないタグで、データも無いものは出さないこと
  assertTrue(/metrics\.filter\(\(m\) => \(m\.data && m\.data\.length > 0\) \|\| chosen\.includes\(m\.tag\)\)/.test(memo),
    "★データがあるか、自分で選んだものだけを出す");
}

console.log("\n=== ★CPPS は止めたまま（記録がある人にだけ、記録として返す） ===");
{
  // ★CPPS_ENABLED は lib/pausedFeatures.js が持っていて、
  //   「止めている一覧」から導かれます（= !isPaused("measure.cpps")）。
  //   ★文字で探さず、実際の値を見ます。
  const pf = await import("../../lib/pausedFeatures.js");
  assertTrue(pf.CPPS_ENABLED === false, "★CPPS はいまも止まっている");
  assertTrue(/tag === "articulation" && !CPPS_ENABLED/.test(memo),
    "★止まっているあいだの扱いが書いてある");
  assertTrue(/hasHistory/.test(memo),
    "★止める前に記録された値があれば、記録として出す");
  assertTrue(/if \(!hasHistory\) return;/.test(memo),
    "★記録が無い人には出さない（「準備中です」を出さない）");
  // ★準備中の札を、この枠に足していないこと。
  //   （「準備中です」は AI の助言の文言として前からあります。別の機能です。
  //     ここで見るのは★練習目標の枠に持ち込んでいないかだけです。）
  assertTrue(!/準備中/.test(memoCode), "★練習目標の枠に「準備中です」を足していない");
  const cardAt = raw.indexOf("{practiceGoalMetrics.length > 0 && !editingPracticeGoal && (");
  assertTrue(cardAt > 0, "枠がある");
  assertTrue(!/準備中/.test(raw.slice(cardAt, cardAt + 1800)),
    "★枠の中にも「準備中です」が無い");
}

console.log("\n=== MPT が、選んでいない人にも返る ===");
{
  assertTrue(/tag === "breath_support"/.test(memo), "MPT の指標がある");
  assertTrue(/最長発声時間（MPT）の推移/.test(memo), "名前が出る");
  // 7つすべてが対象であること
  ["soft_high", "high_range", "range", "articulation", "stamina", "breath_support", "evenness"]
    .forEach((tag) => {
      assertTrue(new RegExp(`tag === "${tag}"`).test(memo), `${tag} が扱われている`);
    });
}

console.log("\n=== 記録そのものは、3重ゲートに掛けない ===");
{
  // ★この枠は「記録の推移」です。関係についての主張ではありません。
  assertTrue(!/evaluateGate|displayGates/.test(memo),
    "★推移の表示に、統計の門を掛けていない");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
})();
