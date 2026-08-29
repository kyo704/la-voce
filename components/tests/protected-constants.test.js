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

  console.log("\n=== EWMA のλ（ACWR） ===");
  // ★式で書かれています。値としても正しいことを確かめます。
  // ★λは2か所で定義されています（ACWRの計算が2つある）。
  //   1か所だけ直しても落ちない、という状態にしないため、
  //   ★「正しい書き方の数」と「その他の書き方が無いこと」の両方を見ます。
  //   実際、片方だけ変えたときにテストが通ってしまいました（2026-08-29）。
  const lambdaAs = (vt.match(/const lambdaA = 2 \/ \(7 \+ 1\);/g) || []).length;
  const lambdaCs = (vt.match(/const lambdaC = 2 \/ \(28 \+ 1\);/g) || []).length;
  const lambdaAAll = (vt.match(/const lambdaA = /g) || []).length;
  const lambdaCAll = (vt.match(/const lambdaC = /g) || []).length;
  assertEqual(lambdaAs, lambdaAAll, `★λa の定義すべてが 2/(7+1)（${lambdaAAll}箇所）`);
  assertEqual(lambdaCs, lambdaCAll, `★λc の定義すべてが 2/(28+1)（${lambdaCAll}箇所）`);
  assertTrue(lambdaAAll >= 1 && lambdaCAll >= 1, "λの定義が存在する");
  assertEqual(Number((2 / (7 + 1)).toFixed(3)), 0.250, "★λa = 0.250");
  assertEqual(Number((2 / (28 + 1)).toFixed(3)), 0.069, "★λc = 0.069");

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
