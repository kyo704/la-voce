#!/usr/bin/env node
/**
 * 曲目に添える欄を、職業ごとに決める（2026-08-29）
 *
 * ★何が起きていたか
 *   ポップスの人には、歌唱言語の欄が出ませんでした。ボタンごと出ません。
 *   「その他」「落語」の人には、曲目まわりの追加項目が何も出ませんでした。
 *
 * ★原因は、このリポジトリで繰り返している形そのものです。
 *   職業の判定が lib/occupation.js とは別に、画面の中で
 *   professions.includes("singer") と書き直されていました。
 *   旧い professions は歌う人を singer と pop_musical に分けているので、
 *   singer だけを見ると、ポップスが丸ごと抜け落ちます。
 *
 * ★「その他」に何も足さないのは、意図した通りです（設計憲章）。
 *   「その他」には、みんなに共通の内容だけを出します。
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "occupation.js"), "utf-8");
  const O = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));

  console.log("=== ★歌う職業には、すべて歌唱言語を出す ===");
  ["classical", "musical", "pops"].forEach((occ) => {
    assertEqual(O.repertoireExtraFor(occ), O.EXTRA_SINGING_LANGUAGE, `${occ} に歌唱言語`);
  });
  // ★これが今回の不具合そのもの。旧い professions では pops だけ別の値になる。
  assertEqual(O.OCCUPATION_TO_LEGACY.pops, "pop_musical",
    "★pops の旧い呼び名は pop_musical（singer ではない）");
  assertEqual(O.OCCUPATION_TO_LEGACY.classical, "singer", "classical の旧い呼び名は singer");
  assertTrue(O.OCCUPATION_TO_LEGACY.pops !== O.OCCUPATION_TO_LEGACY.classical,
    "★旧い呼び名では、歌う人が2つに割れている（だから片方だけ見てはいけない）");

  console.log("\n=== 役を演じる職業には、役の情報 ===");
  ["voiceActor", "actorStage", "actorScreen"].forEach((occ) => {
    assertEqual(O.repertoireExtraFor(occ), O.EXTRA_ROLE, `${occ} に役の情報`);
  });

  console.log("\n=== 原稿を読む職業には、案件の情報 ===");
  ["narrator", "announcer", "mc"].forEach((occ) => {
    assertEqual(O.repertoireExtraFor(occ), O.EXTRA_PROJECT, `${occ} に案件の情報`);
  });

  console.log("\n=== ★「その他」には足さない（設計憲章：共通の内容だけ） ===");
  assertEqual(O.repertoireExtraFor("other"), null, "★その他 には追加の欄を出さない");
  assertEqual(O.repertoireExtraFor("rakugo"), null, "落語にも、いまは出さない（当てはまる欄が無い）");
  assertEqual(O.repertoireExtraFor("nope"), null, "知らない値では、何も出さない");
  assertEqual(O.repertoireExtraFor(null), null, "null でも落ちない");

  console.log("\n=== ★11職業すべてに、答えがある ===");
  O.OCCUPATIONS.forEach((occ) => {
    assertTrue(occ in O.REPERTOIRE_EXTRA_BY_OCCUPATION, `${occ} の行がある`);
  });
  assertEqual(Object.keys(O.REPERTOIRE_EXTRA_BY_OCCUPATION).sort(), [...O.OCCUPATIONS].sort(),
    "★表と職業の一覧が、ぴったり一致する（増えたら気づける）");

  console.log("\n=== ★画面が、自分で職業を判定し直していない ===");
  const vt = readCode("components", "VocalTracker.jsx");
  // 曲目まわりの2つの部品（RepertoireItemRow / ActivityBlockEditor）を見ます。
  ["function RepertoireItemRow(", "function ActivityBlockEditor("].forEach((head) => {
    const at = vt.indexOf(head);
    const body = vt.slice(at, at + 12000);
    assertTrue(!/const isSinger = \(professions \|\| \[\]\)\.includes/.test(body),
      `${head.slice(9, -1)}：★singer を直に見ていない`);
    assertTrue(!/const isVoiceActor = \(professions \|\| \[\]\)\.includes/.test(body),
      `${head.slice(9, -1)}：★voice_actor を直に見ていない`);
    assertTrue(/repertoireExtraFor\(occupation\)/.test(body),
      `${head.slice(9, -1)}：lib/occupation.js を通している`);
  });
  // モニター環境は、ポップスの本番だけ。★広げてしまっていないこと。
  assertTrue(/const isPopMusical = OCCUPATION_TO_LEGACY\[occupation\] === "pop_musical";/.test(vt),
    "★モニター環境は、これまでと同じ範囲のまま（対応表から引いている）");
  assertTrue(/\{isPopMusical && activity\.kind === "本番" && \(/.test(vt),
    "モニター環境は、本番のときだけ");
  // RepertoireItemRow に professions を渡していないこと（手が伸びないように）
  const rir = vt.slice(vt.indexOf("function RepertoireItemRow("), vt.indexOf("function RepertoireItemRow(") + 900);
  assertTrue(!/^\s*handleSaveRepertoire, tessituraSaving, professions,/m.test(rir),
    "★RepertoireItemRow は professions を受け取らない");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
