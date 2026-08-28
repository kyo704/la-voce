#!/usr/bin/env node
/**
 * 職業と配合（職業を声の型で切り直す.md §7・§8・§9・§10・§12）のテスト。
 *
 * ★いちばん守りたいのは §8④「移行の前後で分析結果が動かない」。
 *   これは数字を比べて確かめる種類のものではありません。分析のコードが
 *   職業も配合も一切読んでいなければ、動きようがないからです。
 *   ここでは「読んでいないこと」そのものを固定します。
 *
 * ★次に守りたいのは、SQLとJSで移行の対応表がずれないこと。
 *   同じ決めごとが2か所にあると、片方だけ直されます。このリポジトリで
 *   繰り返し起きてきた壊れ方です。
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "occupation.js"), "utf-8");
  const O = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));

  console.log("=== テスト1: 型と配合の定義（§7） ===");
  assertEqual(O.OCCUPATIONS.length, 11, "職業は11個");
  assertTrue(O.OCCUPATIONS.includes("other"), "「その他」が必ずある（§3）");
  O.OCCUPATIONS.forEach((k) => {
    const m = O.DEFAULT_MIX[k];
    assertTrue(m && m.sing + m.speak + m.project === 10, `${k} の配合の合計が10`);
  });
  assertEqual(Object.keys(O.DEFAULT_MIX).sort(), [...O.OCCUPATIONS].sort(),
    "配合の表と職業の一覧が過不足なく一致");
  assertTrue(!O.isValidMix({ sing: 5, speak: 4, project: 0 }), "合計が10でない配合を受け付けない");
  assertTrue(!O.isValidMix({ sing: 9, speak: 1 }), "項目が足りない配合を受け付けない");
  assertTrue(!O.isValidMix({ sing: 9.5, speak: 0.5, project: 0 }), "整数でない配合を受け付けない");

  console.log("\n=== テスト2: 既存ユーザーの移行（§8①） ===");
  // ★いま実際に保存されうる5つの値。1つでも移行先が無いと、その人は職業を失う。
  const LEGACY = ["singer", "announcer", "voice_actor", "pop_musical", "other"];
  LEGACY.forEach((k) => {
    assertTrue(O.isOccupation(O.LEGACY_TO_OCCUPATION[k]), `${k} の移行先がある`);
    assertTrue(O.isValidMix(O.mixOf({ vocal_profession: k })), `${k} の配合が求まる`);
  });
  assertEqual(O.occupationOf({ vocal_profession: "singer" }), "classical",
    "singer は classical（ラベルが最初から「声楽家」だった）");
  assertEqual(O.occupationOf({ vocal_profession: "pop_musical" }), "pops",
    "pop_musical は pops");
  assertEqual(O.DEFAULT_MIX.announcer, O.DEFAULT_MIX.narrator,
    "announcer と narrator は配合が同一（どちらに寄せても数字が動かない）");

  console.log("\n=== テスト3: 辞書に無い職業は既定へ落ちる（§4・§12） ===");
  assertEqual(O.occupationOf(null), "classical", "プロフィールが無いとき");
  assertEqual(O.occupationOf({}), "classical", "職業が未設定のとき");
  assertEqual(O.occupationOf({ vocal_profession: "trombone" }), "classical", "知らない値のとき");
  assertEqual(O.occupationOf({ voice_occupation: "rakugo" }), "rakugo", "新しい列があればそれを使う");

  console.log("\n=== テスト4: ★本人が動かした配合を勝手に戻さない（§7） ===");
  const own = { sing: 4, speak: 4, project: 2 };
  assertEqual(O.mixOf({ voice_occupation: "classical", voice_mix: own }), own,
    "本人の配合が既定値に上書きされない");
  assertEqual(O.mixOf({ voice_occupation: "classical", voice_mix: { sing: 1, speak: 1, project: 1 } }),
    O.DEFAULT_MIX.classical, "壊れた配合は既定値に落ちる");

  console.log("\n=== テスト5: ★移行しても分析結果が動かない（§8④・§9） ===");
  // 分析の中核。ここが職業も配合も読んでいなければ、移行で数字は動かない。
  ["analysisFamilies.js", "displayGates.js", "vocalDose.js"].forEach((f) => {
    const p = path.join(ROOT, "lib", f);
    if (!fs.existsSync(p)) { console.log(`  ✓ ${f} は存在しない（対象外）`); passCount++; return; }
    const code = readCode("lib", f);
    assertTrue(!/occupation|voice_mix|voiceMix|vocal_profession|profession/i.test(code),
      `${f} が職業も配合も読んでいない`);
  });
  // 族を職業で増やしていないこと（§9「族の数を増やさない」）
  const famCode = readCode("lib", "analysisFamilies.js");
  assertTrue(!/sing|speak|project/.test(famCode.replace(/singleton/gi, "")),
    "族の定義に「歌う/話す/張る」が入っていない");

  console.log("\n=== テスト6: ★配合を日々の記録に持たせない（§7・§10-6） ===");
  const vt = readCode("components", "VocalTracker.jsx");
  const mappers = vt.slice(vt.indexOf("function entryToRow"), vt.indexOf("function entryToRow") + 12000);
  assertTrue(!/voice_mix|voiceMix/.test(mappers),
    "entryToRow のあたりに配合が入っていない");
  const mig = readRaw("supabase", "migration_occupation.sql");
  assertTrue(!/\bentries\b/.test(readCode("supabase", "migration_occupation.sql")),
    "移行のSQLが entries に触れていない");
  assertTrue(!/drop\s+column/i.test(readCode("supabase", "migration_occupation.sql")),
    "移行のSQLが列を消していない（数えるまで消さない／§10-9）");

  console.log("\n=== テスト7: SQLとJSで移行の対応表がずれていない ===");
  // ★同じ決めごとが2か所にある。片方だけ直されたときに、ここで落ちる。
  const caseBlock = mig.slice(mig.indexOf("set occupation = case"), mig.indexOf("where occupation is null"));
  assertTrue(caseBlock.length > 0, "移行のSQLに読み替えの表がある");
  Object.entries(O.LEGACY_TO_OCCUPATION).forEach(([from, to]) => {
    assertTrue(new RegExp(`when '${from}'\\s+then '${to}'`).test(caseBlock),
      `SQLも ${from} → ${to} と読み替えている`);
  });
  const sqlKeys = (caseBlock.match(/when '([a-z_]+)'/g) || []).map((s) => s.slice(6, -1));
  assertEqual(sqlKeys.sort(), Object.keys(O.LEGACY_TO_OCCUPATION).sort(),
    "SQLとJSで、読み替える職業の集合が一致");
  // 制約に並ぶ11個が、JSの一覧と一致していること
  const check = mig.slice(mig.indexOf("profiles_voice_occupation_check"), mig.indexOf("end $$;"));
  O.OCCUPATIONS.forEach((k) => assertTrue(check.includes(`'${k}'`), `SQLの制約に ${k} がある`));

  console.log("\n=== テスト8: ★他人と比べない・職業名で語らない（§10-3・§10-4） ===");
  const occCode = readCode("lib", "occupation.js");
  ["平均", "順位", "偏差値", "比べて", "ランキング"].forEach((w) => {
    assertTrue(!occCode.includes(w), `★「${w}」が本文に出ていない`);
  });

  console.log("\n=== テスト9: ★足してはいけない職業（§10-11・§10-12） ===");
  // 声帯を使わない職業と、第3層の職業。いまは「その他」で受ける。
  ["trumpet", "flute", "instrument", "teacher", "nursery", "callCenter"].forEach((k) => {
    assertTrue(!O.OCCUPATIONS.includes(k), `${k} を職業一覧に足していない`);
  });
  assertEqual(O.OCCUPATIONS.filter((k) => k === "other").length, 1,
    "「その他」は1つの受け皿のまま（11に細分していない）");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
