#!/usr/bin/env node
/**
 * 用語表の見張り（多言語対応（伊英中）.md §3）
 *
 * ★同じものを、2つの名前で呼ばないこと。
 *
 * 「声の調子」は、2か所に出ます。
 *   ① 今日の記録 → 声・喉カードの入力欄（1〜5で入れる）
 *   ② 分析 → 折れ線グラフ（0〜10で描く）
 * 目盛りは違いますが、★元は同じ1つの数字です
 * （voice_quality は resonance_score から導出される: 1 + q/10*4）。
 *
 * 2026-08-28 まで、①は「声の調子」、②は「声の出来」でした。
 * 中国語では両方とも「嗓音状态」で、★別々の2項目が同じ名前になっていました。
 * 列名を resonance_score のままにした改名が、途中で止まっていたものです。
 * 坂本さんの判断で「声の調子」に統一しました。
 *
 * ★このテストは、また分かれてしまうことを防ぐために置いています。
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "translations.js"), "utf-8");
  const { TRANSLATIONS: T } = await import(
    "data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));
  const LANGS = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];

  console.log("=== ★2つの表示場所が、同じ概念の語であること ===");
  // ① 入力欄 labelVoiceQuality ／ ② グラフ labelResonanceScore
  //
  // ★2026-08-30 改訂：完全一致ではなく「概念の語を含むこと」に変えました。
  //   もとは完全一致を要求していました。ところが「相関の強さ」の棒グラフには
  //   この2つが★両方並びます。同じ名前だと、棒が2本とも「声の調子」になり、
  //   自分自身との相関に見えます（実際に 0.67 と 0.72 の2本が観測されました）。
  //   坂本さんの判断で、目盛りだけを両方に付けました。用語表の改訂を参照。
  //   ★概念の語は揃ったままであることを、ここで見張り続けます。
  Object.entries({ ja: "声の調子", en: "Voice condition", zh: "嗓音状态", it: "Condizione della voce" }).forEach(([l, v]) => {
    assertTrue(String(T.labelVoiceQuality[l]).includes(v), `${l}: 入力欄が「${v}」を含む`);
    assertTrue(String(T.labelResonanceScore[l]).includes(v), `${l}: グラフが「${v}」を含む`);
  });
  // ★ただし、同一の文字列にはしないこと（図の上で区別が付かなくなります）。
  LANGS.forEach((l) => {
    assertTrue(String(T.labelResonanceScore[l]) !== String(T.labelVoiceQuality[l]),
      `${l}: ★2つが同じ文字列になっていない`);
  });

  console.log("\n=== 決めた語（用語表のとおりか） ===");
  // ★概念の語のあとに来てよいのは、目盛りの括弧だけです。
  //   別の語（「声の出来」など）を足して区別しないこと。
  const CANON = { ja: "声の調子", en: "Voice condition", zh: "嗓音状态", it: "Condizione della voce" };
  Object.entries(CANON).forEach(([l, v]) => {
    assertTrue(String(T.labelVoiceQuality[l]).startsWith(v), `${l} は「${v}」で始まる`);
    assertTrue(String(T.labelResonanceScore[l]).startsWith(v), `${l}（グラフ）も「${v}」で始まる`);
  });

  console.log("\n=== ★古い語が残っていないこと ===");
  const olds = Object.keys(T).filter((k) => /声の出来/.test(String(T[k].ja || "")));
  assertEqual(olds, [], "★「声の出来」を使っている翻訳キーが1つも無い");
  const itOld = Object.keys(T).filter((k) => /resa della voce/i.test(String(T[k].it || "")));
  assertEqual(itOld, [], "★イタリア語の「resa della voce」が残っていない");

  console.log("\n=== ★目盛りは、片方だけに付けないこと ===");
  // ★もとは「どちらにも付けない」でした。並ぶ場所ができたので
  //   「両方に付ける」に変えました。★片方だけ、は今も禁止です。
  //   片方にだけ付くと、また別の名前に見えます。
  const hasScale = (v) => /[（(]/.test(String(v));
  LANGS.forEach((l) => {
    assertEqual(hasScale(T.labelVoiceQuality[l]), hasScale(T.labelResonanceScore[l]),
      `${l}: 目盛りの有無が、2つで揃っている`);
    assertTrue(hasScale(T.labelResonanceScore[l]), `${l}: グラフ側に目盛りが付いている`);
  });

  console.log("\n=== ★計算と列名には触れていないこと ===");
  const vt = readCode("components", "VocalTracker.jsx");
  assertTrue(/resonance_score: numOrNull/.test(vt), "★列名 resonance_score はそのまま");
  assertTrue(/function quality10ToFiveScale/.test(vt), "★換算の関数はそのまま");
  assertTrue(/return 1 \+ \(q \/ 10\) \* 4;/.test(vt), "★換算の式はそのまま");

  console.log("\n=== ★別物の role_master.voice_quality に触れていないこと ===");
  // 同じ識別子だが、まったく別の概念（役の声質のチップ）。
  ["地声寄り", "高め", "低め", "特殊"].forEach((v) => {
    assertTrue(vt.includes(`"${v}"`), `役の声質「${v}」がそのまま残っている`);
  });

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
