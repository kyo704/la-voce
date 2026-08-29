#!/usr/bin/env node
/**
 * 曲目の「同じ曲か」と、保存に失敗したときの知らせ（2026-08-29）
 *
 * ★2日ぶん原因が分からなかった不具合が、2つ重なっていました。
 *
 *   ① repertoire_tessitura.tessitura_note が NOT NULL でした。
 *      新しい曲で先に歌唱言語を押すと 23502 で弾かれます。
 *      画面は「（任意）」と書いてあるのに、DBが必須にしていました。
 *
 *   ② 失敗しても画面に何も出ませんでした（console.error だけ）。
 *      利用者からは「押しても反応しない」に見えます。
 *      ★①だけ直しても、次に何かが失敗したとき、また同じことになります。
 *
 *   ③ 記録を生の名前で引いていました。末尾の空白や全角半角の違いで
 *      別の曲になり、行が増えていました。
 *
 * ★「同じ曲か」と「似ているか」は別の問いです。
 *   似ている用（normalizeTitle）はかっこ書きまで落とすので、
 *   同一性に使うと「椿姫（第1幕）」と「椿姫（第2幕）」が1つになります。
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "repertoireTitle.js"), "utf-8");
  const R = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));

  console.log("=== ★同じ曲として引けること（報告された形） ===");
  const map = {
    "Son qual nave(Aのみ)": { tessituraNote: "G4", singingLanguage: "伊" },
    "蝶々夫人 ":            { topNote: "B4" },     // 末尾に空白
    "Ｚｕｅｉｇｎｕｎｇ":     { topNote: "A4" }      // 全角
  };
  assertEqual(R.findRepertoireName(map, "蝶々夫人"), "蝶々夫人 ", "★末尾の空白があっても引ける");
  assertEqual(R.findRepertoireName(map, "Zueignung"), "Ｚｕｅｉｇｎｕｎｇ", "★全角と半角の違いを吸収する");
  assertEqual(R.findRepertoireName(map, "ZUEIGNUNG"), "Ｚｕｅｉｇｎｕｎｇ", "大文字小文字の違いも吸収する");
  assertTrue(R.lookupRepertoire(map, "蝶々夫人").topNote === "B4", "記録そのものが引ける");
  assertEqual(R.findRepertoireName(map, "知らない曲"), null, "★無いものは null（打った名前を返さない）");
  assertEqual(R.lookupRepertoire(null, "x"), null, "表が無くても落ちない");
  assertEqual(R.lookupRepertoire(map, ""), null, "名前が空でも落ちない");

  console.log("\n=== ★書くときは、すでにある名前に寄せる（行を増やさない） ===");
  assertEqual(R.resolveRepertoireName(map, "蝶々夫人"), "蝶々夫人 ",
    "★すでにある行に書く（打った通りに書くと行が増える）");
  assertEqual(R.resolveRepertoireName(map, "新しい曲"), "新しい曲", "無い曲は、打った通りに作る");

  console.log("\n=== ★「似ている」を同一性に使わない ===");
  assertTrue(!R.isSameRepertoire("椿姫（第1幕）", "椿姫（第2幕）"),
    "★第1幕と第2幕は、別の曲のまま（かっこ書きを落とさない）");
  assertTrue(!R.isSameRepertoire("Son qual nave", "Son qual nave(Aのみ)"),
    "★Aのみ は別の曲のまま（まとめるかは本人が「レパートリーの整理」で決める）");
  assertTrue(R.isSameRepertoire("椿姫", "椿姫　"), "全角の空白だけの違いは、同じ曲");
  assertTrue(!R.isSameRepertoire("", ""), "空どうしを同じ曲にしない");

  const vt = readCode("components", "VocalTracker.jsx");
  console.log("\n=== ★画面が、生の名前で引いていないこと ===");
  assertTrue(!/repertoireTessituraMap\[name\]/.test(vt), "★record を生の名前で引いていない");
  assertTrue(!/repertoireTessituraMap\[repertoireName\] \|\| \{\}/.test(vt), "★existing も生の名前で引いていない");
  assertTrue(/lookupRepertoire\(repertoireTessituraMap, name\)/.test(vt), "record は lookupRepertoire を通る");
  assertTrue(/resolveRepertoireName\(repertoireTessituraMap, typedName\)/.test(vt),
    "★書く名前も、すでにある行に寄せている");
  assertTrue(!/repertoireUsageCounts\[normalizeTitle\(/.test(vt),
    "★使用回数も、似ている用の鍵で引いていない");
  assertTrue(/isSameRepertoire\(it\.repertoireName, name\)/.test(vt),
    "過去の記録をたどるときも、同じ曲かで比べる");
  // normalizeTitle は「似ているか」だけに残っていること
  const remaining = (vt.match(/normalizeTitle\(/g) || []).length;
  assertTrue(remaining <= 4, `normalizeTitle は「似ているか」の用途だけに残っている（${remaining}件）`);

  console.log("\n=== ★保存に失敗したら、画面に出す ===");
  assertTrue(/setRepertoireSaveError\(\{ name: repertoireName, message:/.test(vt),
    "★失敗したことを覚えている");
  assertTrue(/repertoireSaveError && isSameRepertoire\(repertoireSaveError\.name, name\)/.test(vt),
    "★その曲の欄に出す");
  // console.error だけで終わらせていないこと
  const langAt = vt.indexOf('console.error("歌唱言語の登録に失敗しました:"');
  assertTrue(langAt > 0 && /setRepertoireSaveError/.test(vt.slice(langAt, langAt + 320)),
    "★歌唱言語の失敗が、console だけで終わっていない");
  const repAt = vt.indexOf('console.error("レパートリーの登録に失敗しました:"');
  assertTrue(repAt > 0 && /setRepertoireSaveError/.test(vt.slice(repAt, repAt + 320)),
    "★曲目の登録の失敗も、console だけで終わっていない");
  // ★即時に保存するものは、すべて同じ扱いにすること。
  //   役と案件は console だけで終わっており、同じ事故の一歩手前でした。
  [["役マスタの登録に失敗しました", "役の情報"], ["案件マスタの登録に失敗しました", "案件の情報"]].forEach(([msg, label]) => {
    const at = vt.indexOf(`console.error("${msg}:"`);
    assertTrue(at > 0 && /setRepertoireSaveError/.test(vt.slice(at, at + 320)),
      `★${label}の失敗も、console だけで終わっていない`);
  });

  console.log("\n=== ★保存のタイミングの原則が、コードに書いてある ===");
  const raw = readRaw("components", "VocalTracker.jsx");
  assertTrue(/自由記述は、明示的な確定が要る/.test(raw), "原則①が書いてある");
  assertTrue(/離散的な選択は、タップで確定してよい/.test(raw), "原則②が書いてある");
  assertTrue((raw.match(/即時に書くものは、書けたこと／書けなかったことを必ず見せる/g) || []).length >= 2,
    "★原則③が、手が触れる場所（保存側とチップ側）の両方に書いてある");

  console.log("\n=== 移行のSQL（NOT NULL を外す） ===");
  const sql = readCode("supabase", "migration_repertoire_tessitura_nullable.sql");
  assertTrue(/alter column tessitura_note drop not null/.test(sql), "★tessitura_note の NOT NULL を外す");
  ["top_note", "singing_language", "d_override"].forEach((c) => {
    assertTrue(new RegExp(`alter column ${c} drop not null`).test(sql), `${c} も任意にする`);
  });
  assertTrue(!/set not null/i.test(sql), "★必須に戻す文が混ざっていない");
  // ★仮の値で通していないこと。テッシトゥーラは負荷の計算に使う数値。
  assertTrue(!/update public\.repertoire_tessitura/i.test(sql),
    "★仮の値を入れて通していない（入っていない事実を書き換えない）");
  assertTrue(!/tessitura_note: *"[^"]/.test(vt.replace(/tessitura_note: replace[^,]*,/, "")),
    "★画面側でも、テッシトゥーラに仮の値を入れていない");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
