#!/usr/bin/env node
// ============================================================================
// 「ならべる」（見本④）と、「さかのぼる」の 日の選び方（見本⑤）の 見張り
//
//   ★出どころ Woolsong 画面の見本（2026年9月9日）④⑤
//
//   ★★確かめること
//     ① 但し書きが、★1文字も 変わっていないこと。
//     ② 統計を 1つも 持たないこと（★相関・p値・FDR・割合・順位）。
//     ③ 書いていない日を 0 に しないこと。
//     ④ 色を 値で 変えないこと（★一色の 濃淡だけ）。
//     ⑤ 「さかのぼる」を 作り直していないこと（★C1 を そのまま 使う）。
//     ⑥ 見本の 無い「くらべる」「かぞえる」を 置いていないこと。
//     ⑦ 門の 中でだけ 出ること。
// ============================================================================

const fs = require("fs");
const path = require("path");
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
  const load = async (rel) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", rel), "utf8")
      .replace(/from "@\/lib\/([a-zA-Z]+)"/g, 'from "./$1.js"');
    const tmp = path.join(require("os").tmpdir(), path.basename(rel));
    fs.writeFileSync(tmp, src);
    fs.copyFileSync(path.join(__dirname, "..", "..", "lib", "lookBack.js"),
      path.join(require("os").tmpdir(), "lookBack.js"));
    return import("file://" + tmp + "?v=" + src.length);
  };
  const lu = await load("lib/lineUp.js");
  const lb = await load("lib/lookBack.js");

  console.log("=== ① 但し書き（★1文字も 変えない） ===");
  eq(lu.LINE_UP_NOTE,
    "ここに出るのは、あなたが書いたことの並びです。\n原因かどうかは、分かりません。疑いながら 見てください。",
    "見本④の とおり");

  console.log("\n=== ② 統計を 1つも 持たない ===");
  const luCode = readCode("lib", "lineUp.js");
  const uiCode = readCode("components", "LookBackV2.jsx");
  ["spearman", "pearson", "benjamini", "pValue", "fdr", "効果量", "相関", "確率", "割合", "順位"]
    .forEach((w) => {
      t(!new RegExp(w, "i").test(luCode), `lineUp に「${w}」が 無い`);
      t(!new RegExp(w, "i").test(uiCode), `画面に「${w}」が 無い`);
    });
  t(!/gateAllows|displayGates/.test(uiCode), "★表示ゲートを 通していない（★何も 言っていないため）");
  {
    // ★★％は、★読み手に 見せる ものだけを 見ます。
    //   ★CSS の width:「50%」は、★帯の 長さです。★読み手は 数を 見ません。
    //   ★はじめ 一律に 弾いていましたが、★それでは 帯そのものが 書けません。
    const shown = uiCode
      .replace(/(width|height|top|left|right|bottom|flexBasis|translate)[^,;\n]*%/g, "")
      .replace(/\$\{[^}]*\}%/g, "");
    t(!/%|パーセント/.test(shown), "★読み手に ％を 見せない");
    t(!/\d+\s*日中|\d+\s*回中/.test(uiCode), "★「7日中5日」と 数えない");
  }

  console.log("\n=== ③ 書いていない日を 0 に しない ===");
  const dates = lu.datesBack("2026-09-09", 3);
  eq(dates, ["2026-09-07", "2026-09-08", "2026-09-09"], "日付は 古い順");
  {
    const E = { "2026-09-07": { throatCondition: 5 }, "2026-09-09": { throatCondition: 1 } };
    const s = lu.seriesOf(E, dates, (e) => e.throatCondition);
    eq(s[1], { date: "2026-09-08", value: null, density: null }, "★書いていない日は null（★0 に しない）");
    eq(s[0].density, 1, "いちばん濃い日は 1");
    eq(s[2].density, 0.25, "いちばん薄い日でも 0.25（★見えなくしない）");
  }
  eq(lu.seriesOf({}, dates, (e) => e.throatCondition), null, "★1日も 無ければ null（★空の枠を 置かない）");
  eq(lu.minutesWord(0), null, "★0分は null（★書かなかった と 同じ形に しない）");
  eq(lu.minutesWord(200), "3時間20分", "3時間20分");
  eq(lu.sungMinutes({ activities: [{ minutes: 60 }, { minutes: 20 }] }), 80, "歌った時間は 合計");
  eq(lu.sungMinutes({ activities: [] }), null, "書いていなければ null");

  console.log("\n=== ④ 色を 値で 変えない ===");
  const barBlock = uiCode.slice(uiCode.indexOf("function Bars"), uiCode.indexOf("function Symptoms"));
  t(!/(C\.(gold|rose|red)|#[0-9a-fA-F]{3,6})/.test(barBlock), "★帯の中で 色を 選び分けていない");
  t(/tint/.test(barBlock), "★色は 外から 1つ 渡すだけ");

  console.log("\n=== ⑤ さかのぼるを 作り直していない ===");
  t(/LookBackPanel/.test(uiCode), "★前からの C1 を そのまま 使っている");
  t(/LOOK_BACK_FIELDS/.test(uiCode), "★項目の表も 前からのもの");
  t(!/buildLookBack/.test(luCode), "★lineUp が 組み立てを 持っていない（★写しを 作らない）");
  {
    const E = { "2026-09-06": { throatCondition: 2 }, "2026-09-08": { throatCondition: 1 },
                "2026-09-09": { throatCondition: 4 } };
    eq(lb.hardDays(E, "2026-09-09", 14), ["2026-09-08", "2026-09-06"], "「出づらい」と書いた日（新しい順）");
    eq(lb.hardDays(E, "2026-09-09", 0), [], "期間が 0 なら 空");
    eq(lb.lookBackableDays(["2026-09-08", "2026-09-01"], lb.hardDays(E, "2026-09-09", 14)),
      ["2026-09-08", "2026-09-06", "2026-09-01"], "★同じ日を 2回 出さない");
  }
  // ★前からの 決めが 生きていること
  t(lb.LOOK_BACK_FIELDS.length === 24, "★項目は 24 のまま（★増やしても 減らしてもいない）");
  lb.FORBIDDEN_FIELDS.forEach((f) => {
    t(!lb.LOOK_BACK_FIELDS.some((x) => x.key === f), `★置いてはいけない欄が 無い（${f}）`);
  });

  console.log("\n=== ⑥ 見本の無いものを 置かない ===");
  t(!/くらべる|かぞえる/.test(uiCode), "★「くらべる」「かぞえる」を 置いていない");

  console.log("\n=== ⑦ 門 ===");
  const vt = readRaw("components", "VocalTracker.jsx");
  t(/activeTab === "analysis" && layoutV2 &&[\s\S]{0,200}<LookBackV2/.test(vt),
    "★LookBackV2 は 門の 中でだけ 出る");
  t(vt.includes('activeTab === "analysis" && !layoutV2 && ('),
    "★これまでの 分析画面が 門の外に 残っている");
  t(/mayUseForAnalysis\(profile\)/.test(vt.slice(vt.indexOf('activeTab === "analysis" && layoutV2'),
    vt.indexOf('activeTab === "analysis" && layoutV2') + 200)),
    "★同意を撤回された方には 出さない");
  t(!/NEXT_PUBLIC/.test(uiCode), "★画面じしんは 環境変数を 読まない");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
