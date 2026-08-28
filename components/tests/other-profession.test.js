#!/usr/bin/env node
/**
 * 「その他」職業の振る舞いのテスト。
 *
 * ★これは5つ目の職業ではない（統合実行ルートv4 §10 の凍結対象とは別物）。
 *   新しい記事・分析・プリセットを何も作らず、既に「共通」として用意して
 *   あるものだけを、職業に関わらず見られるようにするための選択肢。
 *
 * 守っていること:
 *   1. 学ぶ画面に、職業別記事（V- / A- / S- / P-）が1本も出ない
 *   2. 分析カードは "*" 指定のものだけが出る
 *   3. 職業固有の追加項目（叫びテイク数・音域・モニター環境など）が出ない
 *      ★未知の職業を声楽家にフォールバックしない
 *   4. 職業別のコンテンツを新しく作っていない
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const tracker = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");
  const learnSrc = fs.readFileSync(path.join(ROOT, "lib", "learnContent.js"), "utf-8");
  const learn = await import("data:text/javascript;base64," + Buffer.from(learnSrc, "utf-8").toString("base64"));
  const visSrc = fs.readFileSync(path.join(ROOT, "lib", "analysisCardVisibility.js"), "utf-8");
  const vis = await import("data:text/javascript;base64," + Buffer.from(visSrc, "utf-8").toString("base64"));

  console.log("=== テスト1: 学ぶ画面は共通記事だけ ===");
  const forOther = learn.getArticlesForProfession("other");
  const forSinger = learn.getArticlesForProfession("singer");
  assertTrue(forOther.length > 0, `「その他」でも読める記事がある（${forOther.length}本）`);
  assertTrue(forOther.every((a) => a.professions === "all"), "職業別記事が1本も混ざっていない");
  assertTrue(forSinger.length > forOther.length, "声楽家より少ない（職業別のぶんだけ差がある）");

  console.log("\n=== テスト2: 分析カードは全職業共通のものだけ ===");
  const { isAnalysisCardVisible, ANALYSIS_CARD_VISIBILITY } = vis;
  Object.entries(ANALYSIS_CARD_VISIBILITY).forEach(([card, allowed]) => {
    const expected = allowed.includes("*");
    assertEqual(isAnalysisCardVisible(card, ["other"]), expected,
      `${card} は「その他」に ${expected ? "出る" : "出ない"}`);
  });
  assertEqual(isAnalysisCardVisible("deviation-score", ["other"]), true, "表に無いカード（職業を問わないもの）は出る");

  console.log("\n=== テスト3: 職業固有の追加項目を出さない ===");
  // ★2026-08-28: LoadTracker ごと消しました（呼び出し0件・実データ0件を確認済み）。
  //   守りたいことは同じ（その他に職業別の項目を出さない）ですが、守り方が
  //   変わりました。いまは「職業別の負荷項目」という仕組み自体がありません。
  assertTrue(!/LOAD_FIELDS_BY_PROFESSION|LOAD_TYPE_BY_PROFESSION/.test(tracker),
    "★職業別の負荷項目という仕組みが、もう無い");
  assertTrue(!/function LoadTracker/.test(tracker),
    "★LoadTracker が消えている（呼び出し0件だった）");
  // いまの保証は lib/typeFields.js が持っている（type-fields.test.js テスト3-2）。
  assertTrue(/typeFieldsFor\(/.test(tracker),
    "★代わりに typeFieldsFor が出し分けを持っている");

  console.log("\n=== テスト4: 選択肢として選べる ===");
  assertTrue(/const OTHER_PROFESSION = "other"/.test(tracker), "OTHER_PROFESSION が定義されている");
  assertTrue(/SELECTABLE_PROFESSIONS = \[\.\.\.VOCAL_PROFESSIONS, OTHER_PROFESSION\]/.test(tracker),
    "選択肢の一覧に含まれている");
  const pickers = (tracker.match(/SELECTABLE_PROFESSIONS\.map/g) || []).length;
  assertTrue(pickers >= 2, `職業を選ぶ画面が全て新しい一覧を使っている（${pickers}箇所）`);
  assertTrue(!/VOCAL_PROFESSIONS\.map/.test(tracker), "旧い一覧で職業を並べている箇所が残っていない");
  assertTrue(/professionOtherNote/.test(tracker), "「その他」が何をするのかを画面で説明している");

  console.log("\n=== テスト4b: ラベルも1箇所から引いている ===");
  // ★一覧に「その他」を足しても、ラベルが三項演算子のままだと最後の枝
  //   （ポップス・ロック）に落ちて、同じ名前のボタンが2つ並ぶ。実際に起きた。
  assertTrue(!/professionSinger" ?: /.test(tracker),
    "職業名を三項演算子の連鎖で出している箇所が残っていない");
  assertTrue(/PROFESSION_LABEL_KEYS = \{[\s\S]{0,400}other: "professionOther"/.test(tracker),
    "ラベルの対応表に other が入っている");
  const labelUses = (tracker.match(/PROFESSION_LABEL_KEYS\[/g) || []).length;
  assertTrue(labelUses >= 5, `職業名を出す箇所が対応表を使っている（${labelUses}箇所）`);

  console.log("\n=== テスト4c: 職業を変えたら、出し分けに使う値も一緒に変わる ===");
  // ★職業別の出し分けは professions（配列）を見ている。プロフィール画面が
  //   vocal_profession しか更新していなかったため、職業を変えても記録画面の
  //   職業別項目が変わらなかった。2つを必ず揃えて更新すること。
  // ★2026-08-28: 選ぶ画面を「職業を声の型で切り直す」§3 の単一選択に作り替えた。
  //   確かめたいことは前と同じ（職業を変えたら出し分けに使う値も一緒に変わる）が、
  //   複数選択のときの書き方は無くなったので、新しい書き方で数える。
  // ★「最初の onChange({」ではなく、選ぶ画面のものを名指しで取り出す。
  //   ファイルには onChange({ が何十箇所もあるため。
  const at = tracker.indexOf("occupation: occ");
  const pickerOnChange = at < 0 ? "" : tracker.slice(at, at + 200);
  assertTrue(at >= 0, "選ぶ画面が occupation を保存する");
  assertTrue(/professions: \[legacy\]/.test(pickerOnChange)
    && /vocal_profession: legacy/.test(pickerOnChange),
    "選ぶ画面が professions と vocal_profession も一緒に更新する");
  assertTrue(/professions: \(profile\.professions && profile\.professions\.length > 0\)/.test(tracker),
    "保存時にも professions を含めている");
  // ★§10-5「職業を複数選ばせない」。単一選択なので、空になる道がそもそも無い。
  assertTrue(!/currentProfessions\.filter\(\(x\) => x !== p\)/.test(tracker),
    "★複数選択の外し方が残っていない（1つだけ選ぶ／§10-5）");
  assertTrue(/OCCUPATIONS\.map\(\(occ\)/.test(tracker),
    "11職業の一覧から選ばせている（§3）");
  assertTrue(/currentProfessions = \(value\.professions && value\.professions\.length > 0\)/.test(tracker),
    "professions が空の古いデータは、単一値から補っている");

  console.log("\n=== テスト5: 職業別のコンテンツを新しく作っていない ===");
  assertTrue(!/"other":/.test(visSrc), "分析カードの対応表に other 向けの指定を足していない");
  const others = (learnSrc.match(/"other"/g) || []).length;
  assertEqual(others, 0, "学ぶの記事に other 向けの指定を足していない");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
