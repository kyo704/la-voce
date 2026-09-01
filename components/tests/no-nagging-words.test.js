#!/usr/bin/env node
/**
 * 画面の文言に、急かす言葉を使わない（2026-09-01）
 *
 * ★禁止する言葉
 *   まだ／忘れ／途切れ／連続／達成／頑張
 *
 * ★なぜ
 *   通知を作るときの決まりとして出た話ですが、坂本さんの判断で
 *   ★通知にかぎらず、画面のどこでも使いません。
 *
 *   「まだ記録していません」は、記録を続けている人を急かします。
 *   「連続◯日」「達成」は、途切れた日をなかったことにできなくします。
 *   ★この製品は、記録した行為に反応します。続いたかどうかではありません。
 *
 * ★コメントと検査の文字は対象外です。
 *   説明のために「まだ」と書くのは自由です。
 *   見るのは★利用者の目に入る文字だけ。
 *   （この repo では、自分の説明コメントに引っかかる失敗を何度もやっています）
 */
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
const NAGGING = ["まだ", "忘れ", "途切れ", "連続", "達成", "頑張"];

/**
 * ★測るための言葉としての例外。
 *
 *   「最長の連続発話ブロック」の「連続」は、★続けて話した長さのことです。
 *   何日続けて記録したか（連続記録）とは別のもので、急かす言葉ではありません。
 *   言い換えると、測っているものが分からなくなります。
 *
 *   ★ここに足すときは、必ず理由を書くこと。
 *     「言い換えにくい」は理由になりません。
 *     ★測定の名前であって、続けたことへの評価ではない、が条件です。
 */
const MEASUREMENT_EXCEPTIONS = [
  { text: "最長の連続発話ブロック", why: "続けて話した長さの名前。日数の連続ではない" },
  // ★声の負荷の言葉。何日続けて本番があったかは、声帯の回復に直に効きます。
  //   記録を続けたことへの評価ではありません。
  { text: "連続公演", why: "本番が続いた日数。声の負荷そのものの言葉" },
  { text: "連続する本数", why: "続けて歌う曲数。負荷の言葉" },
  // ★これは利用者が自分の気持ちとして選ぶ札です。アプリが褒める言葉ではありません。
  { text: "達成感", why: "気持ちタグ。本人が選ぶ言葉であって、アプリが与える評価ではない" },
  // ★ここの「まだ」は、外してはいけません。
  //   「まだはっきりした傾向が出ていません」から「まだ」を取ると、
  //   ★「関係がありません」と読めます。それは3重ゲートが防いでいる断定です。
  //   「見えていない」と「無い」は別のことです（viz-rules.test.js §5）。
  //   ★急かす言葉としての「まだ」ではなく、慎重さのための「まだ」です。
  { text: "まだはっきりした傾向が出ていません",
    why: "表示ゲートの文言。★外すと「関係なし」と断定したことになる（viz-rules §5）" }
];

/**
 * 利用者の目に入る文字だけを取り出す。
 *   ・JSX の地の文（>ここ<）
 *   ・翻訳の日本語（ja: "ここ"）
 * ★変数名・関数名・console・検査の文字は含めません。
 */
function userFacingStrings(src) {
  const code = stripComments(src);
  const out = [];
  // JSX の地の文
  (code.match(/>[^<>{}\n]{4,}</g) || []).forEach((m) => out.push(m.slice(1, -1).trim()));
  // 翻訳の日本語
  (code.match(/\bja:\s*"([^"]{2,})"/g) || []).forEach((m) => out.push(m.replace(/^\bja:\s*"/, "").slice(0, -1)));
  // 画面に出すことが分かっている関数の引数
  (code.match(/set\w*Error\("([^"]{4,})"\)/g) || []).forEach((m) => out.push(m));
  return out.filter((t) => /[ぁ-んァ-ヶ一-龯]/.test(t));
}

/**
 * ★判断待ち：連続記録（ストリーク）そのもの
 *
 *   「現在の連続記録」「最長連続記録」「連続で解放」は、
 *   ★言い換えの問題ではありません。★実際に動いている機能の名前です。
 *   羊とおうちの仕組みが、何日続けて記録したかを数えて見せています。
 *
 *   禁止語の理由は「途切れた日をなかったことにできなくする」でした。
 *   ★その理由は、言葉ではなく★仕組みそのものに向いています。
 *   名前だけ変えても、数えていることは変わりません。
 *
 *   憲章は「羊は記録した行為に反応し、記録の中身で人を並べない」と
 *   言っています。連続日数は中身ではありませんが、
 *   ★「続いたかどうか」で人を測る形ではあります。
 *
 *   ★だから、ここは坂本さんの判断待ちです。
 *     ① 連続記録という仕組みごとやめる
 *     ② 数え方を変える（累計の日数にする、など）
 *     ③ 測定の言葉として例外にする
 *   決まるまで、検査は落としません。★ただし、毎回名前を出します。
 */
const PENDING_NAGGING_DECISION = [
  { text: "現在の連続記録", why: "羊とおうちの機能そのもの。言い換えでは解けない" },
  { text: "最長連続記録", why: "同上" },
  { text: "連続で解放", why: "同上" },
  { text: "ポイントと連続記録はそのまま貯まります", why: "同上" }
];

const TARGETS = [
  ["components", "VocalTracker.jsx"],
  ["lib", "translations.js"],
  ["components", "CharacterHome.jsx"],
  ["components", "HealthInfo.jsx"]
];

console.log("=== ★急かす言葉が、画面に出ていない ===");
{
  let found = [];
  const pending = [];
  TARGETS.forEach(([dir, file]) => {
    const p = path.join(root, dir, file);
    if (!fs.existsSync(p)) return;
    const strings = userFacingStrings(fs.readFileSync(p, "utf8"));
    strings.forEach((txt) => {
      if (MEASUREMENT_EXCEPTIONS.some((e) => txt.includes(e.text))) return;
      if (PENDING_NAGGING_DECISION.some((e) => txt.includes(e.text))) { pending.push(txt.slice(0, 40)); return; }
      NAGGING.forEach((w) => {
        if (txt.includes(w)) found.push(`${file}「${txt.slice(0, 40)}」← ${w}`);
      });
    });
  });
  if (pending.length > 0) {
    console.log(`  ⚠ ★判断待ち（連続記録の仕組みそのもの）: ${[...new Set(pending)].length} 件`);
    [...new Set(pending)].forEach((t) => console.log(`      ${t}`));
    console.log("      言い換えでは解けません。仕組みをどうするかの判断が要ります。");
  }
  assertTrue(found.length === 0,
    found.length === 0
      ? `★${NAGGING.join("／")} が画面に出ていない`
      : `★急かす言葉: ${found.slice(0, 5).join(" ／ ")}${found.length > 5 ? ` ほか${found.length - 5}件` : ""}`);
}

console.log("\n=== 直した3つが、戻っていない ===");
{
  const vt = stripComments(fs.readFileSync(path.join(root, "components/VocalTracker.jsx"), "utf8"));
  assertTrue(!vt.includes("まだ読み込みが終わっていません"), "★読み込み中の案内から「まだ」が消えている");
  assertTrue(vt.includes("読み込み中です"), "言い換えが入っている");
  assertTrue(!vt.includes("まだ記録がありません"), "★空のときの案内から「まだ」が消えている");
  assertTrue(!vt.includes("まだ結論を出していません"), "★引き継ぎの断りから「まだ」が消えている");
  assertTrue(vt.includes("結論を出すには日数が足りません"), "言い換えが入っている");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
