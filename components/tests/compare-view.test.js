#!/usr/bin/env node
// ============================================================================
// くらべる（見本⑫）の 見張り
//
//   ★出どころ docs/opus/woolsong-見本-くらべる・かぞえる（9月9日）.html ⑫⑬⑮
//     「★点数・順位・信号色・％・進捗は 1つも出しません。色は えんじの濃淡だけです。」
//
//   ★★確かめること
//     ① 群の 分け方（★よく出た／出なかった）。
//     ② §1 が 効いていること（★群Bだけ 初日に まとめる）。
//     ③ §2 が 効いていること（★時間差で 見る日が 変わる）。
//     ④ §7 が 効いていること（★あとから書いた点を 判定から 外す・消さない）。
//     ⑤ まんなかは 判定に 入れた点だけ から 出すこと。
//     ⑥ 画面が 点数・順位・％・進捗を 出さないこと。
//     ⑦ 本番の 前後は お休みに なること（★見本⑮）。
// ============================================================================

const fs = require("fs");
const path = require("path");
const os = require("os");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}
function eq(a, b, label) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  t(ja === jb, label + (ja === jb ? "" : `  期待:${jb} 実際:${ja}`));
}

(async () => {
  // ★本物を 読みます。★偽物を 置きません。
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cmp-"));
  // ★★2026-09-11、★3つの門を 足したので、★読む帳面が 増えました。
  //   ★偽物を 置きません。★displayGates も analysisCore も 本物を 読みます。
  ["lookBack", "timeGap", "compareGroups", "lagChoice", "entrySource", "mealMarks",
    "translations", "displayGates", "analysisCore", "compareView"]
    .forEach((n) => {
      const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", n + ".js"), "utf8")
        .replace(/@\/lib\/([a-zA-Z]+)/g, "./$1.js");
      fs.writeFileSync(path.join(dir, n + ".js"), src);
    });
  const m = await import("file://" + path.join(dir, "compareView.js"));

  const E = {};
  const mk = (d, tc, dinner, bed, source) => {
    E[d] = { date: d, voiceQuality: tc, dinnerTime: dinner, bedtime: bed, source };
  };

  console.log("=== ① 群の 分け方 ===");
  eq(m.isGoodDay({ voiceQuality: 5 }), true, "5 は よく出た日");
  eq(m.isGoodDay({ voiceQuality: 4 }), true, "4 も よく出た日");
  eq(m.isGoodDay({ voiceQuality: 3 }), false, "3 は どちらでもない");
  eq(m.isHardDay({ voiceQuality: 3 }), false, "3 は どちらでもない");
  eq(m.isHardDay({ voiceQuality: 2 }), true, "2 は 出なかった日");
  eq(m.isHardDay({ voiceQuality: 1 }), true, "1 も 出なかった日");
  eq(m.isGoodDay({}), false, "書いていなければ どちらでもない");
  eq(m.isHardDay(null), false, "無くても 落ちない");

  console.log("\n=== ③ 時間差で 見る日が 変わる ===");
  eq(m.sourceDateOf("2026-09-10", "prevNight"), "2026-09-09", "前の夜 → 前の日");
  eq(m.sourceDateOf("2026-09-10", "prevDay"), "2026-09-09", "前の日 → 前の日");
  eq(m.sourceDateOf("2026-09-10", "twoDaysAgo"), "2026-09-08", "2日まえ");
  eq(m.sourceDateOf("2026-09-10", "sameMorning"), "2026-09-10", "その日の朝 → その日");

  console.log("\n=== ② §1（群Bだけ 初日に まとめる） ===");
  Object.keys(E).forEach((k) => delete E[k]);
  mk("2026-09-01", 5, "19:00", "23:00", "live");
  mk("2026-09-02", 5, "20:00", "23:30", "live");
  mk("2026-09-03", 1, "22:00", "23:00", "live");
  mk("2026-09-04", 1, "21:00", "23:00", "live");
  mk("2026-09-05", 1, "20:00", "23:00", "live");
  const dates = Object.keys(E).sort();
  const a = m.buildCompare(E, dates, "dinnerToBed", null, { firstDayOnly: true });
  const b = m.buildCompare(E, dates, "dinnerToBed", null, { firstDayOnly: false });
  eq(a.hard.length, 1, "★つづいた3日は 初日だけ");
  eq(b.hard.length, 3, "★切ると 3日とも");
  eq(a.good.length, b.good.length, "★群Aは まとめない（よく出た日が つづくのは ふつう）");

  console.log("\n=== ④⑤ §7（あとから書いた点） ===");
  Object.keys(E).forEach((k) => delete E[k]);
  mk("2026-09-01", 5, "19:00", "23:00", "live");   // ★材料
  mk("2026-09-02", 5, "20:00", "23:00", "live");   // ★よく出た日（●）
  mk("2026-09-03", 5, "18:00", "23:00", "later");  // ★よく出た日（★あとから書いた → ○）
  const d2 = Object.keys(E).sort();
  const r = m.buildCompare(E, d2, "dinnerToBed", null);
  eq(r.good.length, 2, "★点は 2つとも 残る（★消さない）");
  eq(r.good.filter((p) => p.judged).length, 1, "★判定に 入るのは 1つだけ");
  eq(r.anyLater, true, "★○が あることを 知らせる");
  // ★★まんなかは、★判定に 入れた点だけ から
  eq(r.goodMedian, 4, "★まんなかは ● だけ から 出す（9/1 の 4時間）");
  eq(r.nGood, 1, "★数えた日も ● だけ");
  // ★★出た日の 側が あとから書きでも 外すこと（★両方 見る）
  Object.keys(E).forEach((k) => delete E[k]);
  mk("2026-09-01", 5, "19:00", "23:00", "live");
  mk("2026-09-02", 5, "20:00", "23:00", "later");  // ★出た日が あとから書き
  const r2 = m.buildCompare(E, Object.keys(E).sort(), "dinnerToBed", null);
  eq(r2.good.length, 1, "点は 残る");
  eq(r2.good[0].judged, false, "★出た日が あとから書きなら、★判定から 外す");
  t(/どちらか 片方でも/.test(readRaw("lib", "compareView.js")), "★両方 見る、と 書いてある");
  // ★★「含める」を 選べば 入ること
  const r3 = m.buildCompare(E, Object.keys(E).sort(), "dinnerToBed", null, { includeLater: true });
  eq(r3.good[0].judged, true, "★「含める」を 選べば 入る");

  console.log("\n=== まんなかは 平均で ない ===");
  eq(m.median([1, 2, 3]), 2, "奇数個");
  eq(m.median([1, 2, 3, 100]), 2.5, "★大きなぶれに 引きずられない");
  eq(m.median([]), null, "空は null");

  console.log("\n=== 寝た時刻は 日を またぐ ===");
  eq(m.EXTRACTORS.bedtime({ bedtime: "23:00" }), 23, "23時");
  eq(m.EXTRACTORS.bedtime({ bedtime: "00:50" }), 24.833333333333332, "★0時50分は 24時台として 扱う");
  t(m.EXTRACTORS.bedtime({ bedtime: "00:50" }) > m.EXTRACTORS.bedtime({ bedtime: "23:00" }),
    "★0時50分は 23時より あと");

  console.log("\n=== ⑥ 画面が 出さないもの ===");
  const ui = readCode("components", "CompareV2.jsx");
  ["点数", "順位", "％", "進捗", "スコア", "偏差"].forEach((w) => {
    t(!ui.includes(w), `★「${w}」を 出さない`);
  });
  {
    // ★★％は、★読み手に 見せる ものだけを 見ます（★line-up.test.js と 同じ形）。
    //   ★CSS の width:「50%」や、★分を 出す v % 60 は、★読み手に 見えません。
    //   ★一律に 弾くと、★点を 置くことも できません。
    const shown = ui
      .replace(/(width|height|top|left|right|bottom|borderRadius|flexBasis|translate)[^,;\n]*%/g, "")
      .replace(/\$\{[^}]*\}%/g, "")
      .replace(/%\s*60|%\s*44/g, "");
    t(!/%|パーセント/.test(shown), "★読み手に ％を 見せない");
  }
  t(!/あと\s*\d|あと\$\{/.test(ui), "★「あと◯日で 見えます」を 書かない（★査読 §8）");
  t(!/C\.(gold|sage|rose)/.test(ui), "★色は えんじ1色（★群で 色を 変えない）");
  t(/lib\/compareView|buildCompare/.test(ui), "★数は lib から もらう");
  t(!/throatCondition\s*[><=]/.test(ui), "★群の 分け方を 画面で 決めない");

  console.log("\n=== 見本⑫の 言葉（★1文字も 変えない） ===");
  const raw = readRaw("components", "CompareV2.jsx");
  t(/まだ、はっきりした差は 見えていません。/.test(raw), "「まだ、はっきりした差は 見えていません。」");
  // ★★2026-09-11、★動く見本の 字に そろえ直しました。
  //   ★★それまでの 字は、★9月9日の 見本（★静止画）の ものでした。
  //     ★「つづけて」→「続けて」、★○の 断りは 凡例の 1行に なりました。
  //   ★★正は docs/design/pack-final の kuraberu()（★git hash 7c7c720）です。
  t(/この形のまま 続けてください。/.test(raw), "「この形のまま 続けてください。」");
  t(/● 書いた日　○ あとから 書いた日　- - - まんなか/.test(raw), "★見本の 凡例");
  t(/あとから 書いた日は ○の 白抜き。判定からは 外します。/.test(raw), "○の 断り（★note）");
  t(/判定は「\{\(LAGS\.find/.test(raw) || /に 固定<\/b>です。ここは 見るだけ。/.test(raw),
    "★判定は 1つに 固定、の 断り");
  t(/（いま 1番目）/.test(raw), "★いま 何番目を 見ているか");
  t(/1文は、3つの門（10日以上／差の大きさ／q）を 通ったときだけ 出ます。/.test(raw),
    "★3つの門の 断り");
  t(/2番目から先の 結果は 出しません。止まった理由だけ 出します。/.test(raw),
    "★2番目から先の 断り");
  t(/まだ、くらべる ものが ありません。/.test(raw), "★空の 姿");
  t(/記録を 10日ぶん 書くと、点が 2つの 山に 分かれて 出ます。/.test(raw),
    "★何を すると 埋まるか");

  console.log("\n=== ⑦ 本番の 前後は お休み（見本⑮） ===");
  const lb = readRaw("components", "LookBackV2.jsx");
  t(/tabIsOpen\("kuraberu"/.test(lb), "★くらべるは、休みかどうかを lib に 尋ねる");
  t(/くらべる と かぞえる は、/.test(lb), "★見本⑮の 言葉");
  t(/本番の 翌々日から、また 出ます。/.test(lb), "★また 出る日を 書く");
  t(/ならべる と さかのぼる は、いつでも 見られます。/.test(lb), "★休まない2つを 案内する");
  t(/ならべる を見る/.test(lb) && /さかのぼる を見る/.test(lb), "★行き先を 押せる形で 置く");
  t(!/tabIsOpen\("narabe"|tabIsOpen\("sakanobore"/.test(lb), "★ならべる・さかのぼるは 休ませない");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
