#!/usr/bin/env node
/**
 * 「この分析を強くする」の出し方（記録と分析の順番設計.md §5.3）。
 *
 * ★この画面が、記録項目を増やす本体です。
 *   記録画面をいくら整えても、ユーザーは「なぜこれを入れるのか」を知りません。
 *   分析の側から、名指しで、理由つきで頼む。それがこのカードの役目です。
 *
 * 固定している規則:
 *   R1 1度に2枚まで      R2 何が良くなるかを必ず書く
 *   R3 該当セクションへ直行  R4 日数と項目の両方を書く
 *   R5 少ない手間で効果が大きいものを選ぶ
 *   R6 一度も使っていない項目は3枚目以降
 */
const fs = require("fs");
const path = require("path");
// ★コメント除去は components/tests/_source.js の1か所から使う。
//   各テストが自前で持つと、除去の仕方が少しずつずれていく。
const { stripComments } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const C = (o) => ({ body: "★★★★ になります", improvement: 0.6, ...o });

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "analysisBoost.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
    const ui = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");
  // ★禁止語の検査は、コメントを外してから行うこと。
  //   コメントには「こう書かないこと」という説明としてその語が出てくる。
  //   外さずに調べると、自分が書いた説明文で落ちる（CLAUDE.md に既出の罠）。
  const uiCode = stripComments(ui);

  console.log("=== R1: 1度に2枚まで ===");
  const many = m.selectBoostCandidates([1, 2, 3, 4, 5].map((i) => C({ id: "c" + i, daysNeeded: i })));
  assertEqual(many.length, 2, "★足りない項目を全部並べない");
  assertEqual(m.MAX_BOOST_CARDS, 2, "枚数の上限が定数で決まっている");

  console.log("\n=== R2: 何が良くなるかを書いていないものは出さない ===");
  assertEqual(m.statesBenefit("記録してください"), false, "★お願いだけの文言は不合格");
  assertEqual(m.statesBenefit("水分を入力してください"), false, "★「入力してください」も不合格");
  assertEqual(m.statesBenefit("★★★★ になります"), true, "何が良くなるか書いてあれば合格");
  assertEqual(m.statesBenefit("あと3日記録すると開きます"), true, "「開きます」も合格");
  assertEqual(m.statesBenefit(""), false, "空は不合格");
  const filtered = m.selectBoostCandidates([
    { id: "bad", body: "記録してください", daysNeeded: 1, improvement: 1.0 },
    C({ id: "good", daysNeeded: 5 })
  ]);
  assertEqual(filtered.map((c) => c.id), ["good"], "★文言が用意できていないものは、黙って出さない");

  console.log("\n=== R4: 日数の条件と項目の条件を、両方書く ===");
  assertEqual(m.describeUnlockCondition({ daysNeeded: 8, itemLabel: "水分", itemDaysNeeded: 5 }),
    "あと8日、または 水分を5日記録すると開きます", "★両方書く（待てば開くことを隠さない）");
  assertEqual(m.describeUnlockCondition({ daysNeeded: 8 }),
    "あと8日記録すると開きます", "★項目の条件が分からないときは、日数だけ（嘘の条件を書かない）");
  assertTrue(!/データ不足/.test(uiCode), "★灰色の「データ不足」表示が無い（§5.4・コメントを除いて検査）");

  console.log("\n=== R5: 少ない手間で効果が大きいものを選ぶ ===");
  assertEqual(m.scoreCandidate(1.0, 2), 0.5, "score = 改善量 / 必要日数");
  // 0.6/3 は二進小数で割り切れないので、値の比較には幅を持たせる。
  assertTrue(Math.abs(m.scoreCandidate(0.6, 3) - 0.2) < 1e-9, "★が1つ増える見込みは 0.6");
  assertEqual(m.scoreCandidate(1.0, 0), 1.0, "0日でも割り算が壊れない");
  const ranked = m.selectBoostCandidates([
    C({ id: "far", daysNeeded: 9, improvement: 1.0 }),
    C({ id: "near", daysNeeded: 2, improvement: 1.0 })
  ]);
  assertEqual(ranked[0].id, "near", "★届きやすいほうが先");
  assertEqual(m.IMPROVEMENT.unlock, 1.0, "ロック解除の見込みは 1.0");
  assertEqual(m.IMPROVEMENT.star, 0.6, "★が1つ増えるのは 0.6");
  assertEqual(m.IMPROVEMENT.threshold, 0.4, "しきい値超えは 0.4");

  console.log("\n=== ★遠すぎるものは出さない（動機にならない） ===");
  assertEqual(m.MAX_DAYS_NEEDED, 10, "上限は10日");
  assertEqual(m.selectBoostCandidates([C({ id: "x", daysNeeded: 11 })]).length, 0, "11日先は出さない");
  assertEqual(m.selectBoostCandidates([C({ id: "x", daysNeeded: 10 })]).length, 1, "10日ちょうどは出す");
  assertEqual(m.selectBoostCandidates([C({ id: "x", daysNeeded: 0 })]).length, 0, "もう足りているものは出さない");
  assertEqual(m.selectBoostCandidates([C({ id: "x", daysNeeded: -3 })]).length, 0, "負の日数も出さない");

  console.log("\n=== R6: ★一度も使っていない項目を、いきなり要求しない ===");
  const withNew = m.selectBoostCandidates([
    C({ id: "new", daysNeeded: 1, improvement: 1.0, neverUsed: true }),   // スコアは最高
    C({ id: "used", daysNeeded: 9, improvement: 0.6 })                     // スコアは低い
  ]);
  assertEqual(withNew[0].id, "used", "★スコアが高くても、未使用の項目は後ろに回る");
  assertEqual(withNew[1].id, "new", "3枚目以降扱い（2枚しか無ければ2枚目には出る）");
  const onlyNew = m.selectBoostCandidates([C({ id: "n1", daysNeeded: 3, neverUsed: true })]);
  assertEqual(onlyNew.length, 1, "他に候補が無ければ、未使用の項目でも出す");

  console.log("\n=== 空・壊れた入力でも落ちない ===");
  assertEqual(m.selectBoostCandidates([]).length, 0, "空配列");
  assertEqual(m.selectBoostCandidates(null).length, 0, "null");
  assertEqual(m.selectBoostCandidates([null, undefined]).length, 0, "中身が空でも落ちない");

  console.log("\n=== 画面側が、規則を自前で書いていないこと ===");
  assertTrue(/selectBoostCandidates\(candidates\)/.test(ui), "★選定はモジュールを通している");
  assertTrue(/describeUnlockCondition\(/.test(ui), "文言もモジュールを通している");
  assertTrue(!/\.slice\(0, 2\)/.test(ui.slice(ui.indexOf("analysisBoostCandidates"), ui.indexOf("analysisBoostCandidates") + 2000)),
    "★画面側に「2枚まで」を書いていない");
  assertTrue(/IMPROVEMENT\.star/.test(ui) && /IMPROVEMENT\.unlock/.test(ui),
    "改善量の値も、画面に直接書いていない");

  console.log("\n=== 見出しが1つにまとまっている ===");
  assertTrue(!/titleUpcomingAnalyses/.test(uiCode),
    "★「これから開く分析」の見出しが残っていない（同じ話が2回続かない）");
  const sec = ui.slice(ui.indexOf("この分析を強くする</h2>") - 3000, ui.indexOf("この分析を強くする</h2>") + 4000);
  assertTrue(sec.indexOf("analysisBoostCandidates.map") < sec.indexOf("analysisLocks.pending.map"),
    "★いま動けるものが先、待つしかないものが後");
  assertTrue(/jumpToRecordSection\(c\.section\)/.test(ui), "R3: 該当セクションへ直行する");

  console.log("\n=== ★中身の無い節は、見出しごと出さない（④） ===");
  console.log("     見出しだけ残ると、空のカードが上に居座っているように見えます。");
  // 本番・環境は、中身の条件で見出しを包んである
  assertTrue(/analysisLocks\.map\.peaking\.visible && analysisLocks\.map\.peaking\.unlocked && \(/.test(ui),
    "★本番の見出しが、中身があるときだけ出る");
  assertTrue(/analysisLocks\.map\.envComfort\.unlocked\)\s*\|\| locationStats/.test(ui.replace(/\s+/g, " ")),
    "★環境の見出しも、中身があるときだけ出る");
  // ロックされたカードは、上に残らず下へ集約されること
  assertTrue(/analysisLocks\.map\.peaking\.unlocked \? \(/.test(ui),
    "本番のカード自体は、ロック層を通っている");
  assertTrue(/analysisLocks\.pending\.map/.test(ui), "ロック中のものは下に集約されている");

  console.log("\n=== ★ロック中のカードは、1種類の型だけを使う ===");
  console.log("     片方だけボタン、進捗の点も日数も無し、という状態でした。");
  assertTrue(/analysisBoostCandidates\.map\(\(c\) => \(\s*<LockedCard/.test(ui.replace(/\s+/g, " ").replace(/ /g, " ")) ||
    /<LockedCard key=\{c\.id\}/.test(ui), "★強くするカードも LockedCard を使っている");
  assertTrue(/current=\{c\.current\}/.test(ui) && /required=\{c\.required\}/.test(ui),
    "★進捗の点が描けるよう、件数を渡している");
  assertTrue(/action=\{\{/.test(ui), "行き先は、型の中の action として渡している");
  // 独自のカード枠を作っていないこと
  const boostBlock = ui.slice(ui.indexOf("analysisBoostCandidates.map"), ui.indexOf("analysisBoostCandidates.map") + 900);
  assertTrue(!/rounded-2xl p-4 border/.test(boostBlock), "★独自のカード枠を作っていない");
  assertTrue(!/<button type="button"/.test(boostBlock), "★独自のボタンを直接書いていない");
  // LockedCard 側が action を受け取れること
  assertTrue(/function LockedCard\(\{ title, teaser, current, required, action \}\)/.test(ui),
    "LockedCard が action を受け取る");
  assertTrue(/ProgressDots current=\{current\} required=\{required\}/.test(ui),
    "★型のほうに進捗の点がある（1か所）");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
