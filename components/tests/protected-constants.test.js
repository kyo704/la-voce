#!/usr/bin/env node
/**
 * ★坂本さんの承認なしに動かしてはいけない定数を、値そのもので固定する。
 *
 * ★なぜ「値そのもの」なのか
 *   2026-08-29、guard-display-gate.test.js が閾値を★自分自身と比べていました。
 *   「NARRATIVE_MIN_N_PER_GROUP - 1 なら通らない」という書き方だったため、
 *   閾値を 10 から 1 に下げても通ってしまいます。実際に試して、そうなりました。
 *   表示ゲートを骨抜きにしても、全テストが緑のままでした。
 *
 *   ★仕組みが動くことと、線が正しい位置にあることは、別です。
 *     このファイルは「線の位置」だけを見ます。
 *
 * ★どれか1つでも落ちたら、それは事故です。直す前に坂本さんに確認してください。
 *   値を変えるのが正しい場合もありますが、★黙って変わっていてはいけません。
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
  // ★displayGates は translations を import しているため、そのままでは
  //   data: URL から読み込めません。guard-display-gate.test.js と同じ差し替えをします。
  const load = async (f) => {
    let src = fs.readFileSync(path.join(ROOT, "lib", f), "utf-8");
    src = src.replace(/import \{ createTranslator \} from "@\/lib\/translations";/,
      "const createTranslator = () => (key) => key;");
    return import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  };
  const vt = readCode("components", "VocalTracker.jsx");

  console.log("=== 3つの門（表示ゲート） ===");
  const G = await load("displayGates.js");
  assertEqual(G.NARRATIVE_MIN_N_PER_GROUP, 10, "各群 n ≥ 10");
  assertEqual(G.NARRATIVE_MIN_EFFECT_SIZE, 0.4, "|Hedges' g| ≥ 0.4");
  assertEqual(G.NARRATIVE_FDR_Q, 0.10, "BH-FDR q < 0.10");
  // 相関のときの下限（|ρ| ≥ 0.3）
  const gatesSrc = readCode("lib", "displayGates.js");
  assertTrue(/0\.3/.test(gatesSrc), "相関の下限 0.3 が定義に在る");

  console.log("\n=== EWMA のλ（★2026-09-07 に、まるごとやめました） ===");
  // ★★比（急性÷慢性、ACWR）を出すのをやめたので、★λも要らなくなりました。
  //   ★★これは事故ではありません。★坂本さんが決められた変更です（2026-09-07）。
  //     ★出どころ Opus の文献の見直し（Impellizzeri 2021）。
  //       ★分母を乱数に取り替えても同じ結果になり、
  //       ★c統計量が 0.5 ＝ コイン投げと変わらない、と示されています。
  //   ★★否定されたのは「比」です。★「数えること」ではありません。
  //     ★日ごとの量と、7日ぶんの合計は、そのまま残っています。
  //
  //   ★★これからは「在ること」ではなく「無いこと」を守ります。
  //     ★戻ってきたら、★ここで止めます。
  assertEqual((vt.match(/const lambdaA = /g) || []).length, 0,
    "★λa は、もう定義されていない");
  assertEqual((vt.match(/const lambdaC = /g) || []).length, 0,
    "★λc は、もう定義されていない");
  assertEqual((vt.match(/acwr: C > 0 \? A \/ C/g) || []).length, 0,
    "★比（A/C）を、もう計算していない");
  // ★1.4 のような線も、引かないこと。
  assertTrue(!/value <= 1\.[35]\) return \{ key:/.test(vt),
    "★比に線を引く判定が、もう無い");
  // ★数えるほうは、★残っていること（★消しすぎていないか）。
  assertTrue(/computeDailyLoad\(/.test(vt), "★日ごとの量は、残っている");
  assertTrue(/week: recent\.reduce/.test(vt), "★7日ぶんの合計は、残っている");

  console.log("\n=== 曲の負荷（レパートリー負荷パッチ） ===");
  assertTrue(/const REPERTOIRE_GAMMA = 1\.7;/.test(vt), "★GAMMA = 1.7");
  assertTrue(/const REPERTOIRE_KAPPA = 0\.6;/.test(vt), "★KAPPA = 0.6（下向きのときの掛け率）");
  assertTrue(/Math\.pow\(Math\.abs\(d\) \/ 0\.85, REPERTOIRE_GAMMA\)/.test(vt), "★base = 0.85");
  assertTrue(/Math\.max\(0, Math\.min\(1\.5, strain\)\)/.test(vt), "★strain の上限 = 1.5");
  assertTrue(/return 1\.0 \+ 1\.5 \* strain;/.test(vt), "★係数 = 1.5");

  console.log("\n=== 絶対湿度の式 ===");
  const A = await load("analysisFamilies.js");
  const famSrc = readCode("lib", "analysisFamilies.js");
  assertTrue(/6\.112 \* Math\.exp\(\(17\.67 \* tempC\) \/ \(tempC \+ 243\.5\)\)/.test(famSrc),
    "★6.112 / 17.67 / 243.5（飽和水蒸気圧）");
  assertTrue(/216\.7 \* es \* rhPercent \/ 100\) \/ \(273\.15 \+ tempC\)/.test(famSrc),
    "★216.7 / 273.15（絶対湿度）");
  // 値としても確かめる（式を書き換えたのに定数だけ残る、を防ぐ）
  const ah = A.absoluteHumidityOf(20, 50);
  assertTrue(Math.abs(ah - 8.65) < 0.05, `20℃・50% で約8.65 g/m³（実際 ${ah && ah.toFixed(2)}）`);
  assertEqual(A.absoluteHumidityOf(null, 50), null, "気温が無ければ null");

  console.log("\n=== 中核の5項目（族の定義） ===");
  assertEqual(A.CORE_FAMILY, ["sleepHours", "offStageVoiceMinutes", "absoluteHumidity",
    "dayAfterPerformance", "morningEdema"], "★5項目・この順");
  assertEqual(A.CORE_SPLIT.sleepHours, "median", "① 睡眠時間は中央値で二分");
  assertEqual(A.CORE_SPLIT.offStageVoiceMinutes, "median", "② 本番外の発話時間は中央値で二分");
  assertEqual(A.CORE_SPLIT.absoluteHumidity, "median", "③ 絶対湿度は中央値で二分");
  assertEqual(A.CORE_SPLIT.dayAfterPerformance, "binary", "④ 本番・レッスンの翌日は二値");
  assertEqual(A.CORE_SPLIT.morningEdema, "binary", "⑤ 起きたときのむくみは二値");
  assertEqual(A.CORE_LAG_DAYS.offStageVoiceMinutes, 1, "★②だけ前日の値を見る");

  console.log("\n=== ★曲目の重複判定が、その曲自身を拾わないこと ===");
  // 2026-08-29 の実データ喪失。歌唱言語などを先に登録すると、その曲の行が
  // 既にできています。自分自身は includes も距離0も必ず満たすため、
  // 重複の警告が出て★保存されずに抜けていました。
  // 利用者には「最高音だけ保存されない」と見えます。
  assertTrue(/if \(existingNorm === norm\) return false;/.test(vt),
    "★自分自身を、似ている別の曲と見なしていない");
  const dupBlock = vt.slice(vt.indexOf("const nearMatch = Object.keys(repertoireTessituraMap)"),
                            vt.indexOf("const nearMatch = Object.keys(repertoireTessituraMap)") + 600);
  assertTrue(dupBlock.indexOf("existingNorm === norm") < dupBlock.indexOf("existingNorm.includes(norm)"),
    "★自分自身の除外を、似ている判定より先に行う");
  assertTrue(/levenshteinDistance\(existingNorm, norm\) <= 2/.test(dupBlock),
    "本物の重複の判定は残っている");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
