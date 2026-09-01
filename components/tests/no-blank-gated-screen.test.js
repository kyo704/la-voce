#!/usr/bin/env node
/**
 * 権限が無いときに、白い画面を出さない（2026-09-01）
 *
 * ★何が起きていたか
 *   「受診用サマリー」のボタンは誰にでも出ていましたが、行き先は
 *     {activeTab === "clinicSummary" && can(viewer, "export.doctorSheet") && (…)}
 *   でした。権限が無いと、この式は false になり、
 *   ★React は黙って何も描きません。
 *   押せるボタンの先が、真っ白の画面になっていました。
 *   説明も、鍵の絵も、戻る道もありません。
 *
 *   坂本さんが自分で開いて気づきました。★検査は1つも鳴りませんでした。
 *
 * ★この形の間違いは、1日に3回見つかりました
 *   ① 並び順を仮定した [0]
 *   ② 移行し忘れた古い判定（活動の色）
 *   ③ 入口と行き先で、権限の条件が食い違う（これ）
 *   どれも「静かに間違う」形です。落ちも、警告も出ません。
 *
 * ★だから、形で見張ります。
 *   画面まるごとを権限で囲んだら、ここで落とします。
 */
const { readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const raw = readRaw("components", "VocalTracker.jsx");

console.log("=== ★画面まるごとを権限で囲んでいない ===");
{
  // {activeTab === "X" && can(…) && ( … の形を探します。
  // ★この形は、権限が無いと何も描きません。
  const bad = [];
  const re = /\{activeTab === "(\w+)"[^\n]*?&&\s*(can\(viewer|canSee\w+\()/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const line = raw.slice(0, m.index).split("\n").length;
    bad.push(`${m[1]}（${line}行）`);
  }
  assertTrue(bad.length === 0,
    bad.length === 0
      ? "★権限で囲まれた画面が無い"
      : `★権限が無いと白くなる画面: ${bad.join(", ")}（説明を出すか、ゲートを外してください）`);
}

console.log("\n=== 受診用サマリーは、誰でも使える ===");
{
  const ent = readRaw("lib", "entitlements.js");
  const preview = (ent.match(/PREVIEW_FEATURES = \[([\s\S]*?)\]/) || [])[1] || "";
  const never = (ent.match(/NEVER_GATED = \[([\s\S]*?)\]/) || [])[1] || "";
  assertTrue(!/"export\.doctorSheet"/.test(preview), "★先行公開の一覧に入っていない");
  assertTrue(/"export\.doctorSheet"/.test(never), "★ゲートしない一覧に入っている");
  assertTrue(!/can\(viewer, "export\.doctorSheet"\)/.test(raw),
    "★画面に権限の確認が残っていない");
  // ★理由を残すこと
  assertTrue(/診断も治療もしません|お金を置くのは/.test(ent),
    "★なぜ無料にしたのかが書いてある");
}

console.log("\n=== 止めている機能は、行き先で説明する ===");
{
  // AI の助言は止まっていますが、行き先で「準備中です」と説明しています。
  // ★これが正しい形です。入口を消すのではなく、行き先で言う。
  const at = raw.indexOf('{activeTab === "advice" && (');
  assertTrue(at > 0, "AIアドバイスの画面がある");
  assertTrue(/!AI_ADVICE_ENABLED \?/.test(raw.slice(at, at + 900)),
    "★止まっているときの分岐がある");
  assertTrue(/labelAdviceComingSoon/.test(raw.slice(at, at + 900)),
    "★止まっていることを、行き先で説明している");
}

console.log("\n=== 憲章に、決まりが書いてある ===");
{
  const charter = readRaw("docs", "lavoce-設計憲章.md");
  assertTrue(/権限が無いときに「何も描かない」画面を作らない/.test(charter),
    "★§10 に書いてある");
  assertTrue(/説明・案内・戻る道のどれかを必ず出す/.test(charter),
    "★何を出すべきかも書いてある");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
