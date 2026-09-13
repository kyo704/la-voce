#!/usr/bin/env node
// ============================================================================
// かぞえる（見本⑭）の 見張り
//
//   ★出どころ docs/opus/woolsong-見本-くらべる・かぞえる（9月9日）.html ⑭
//     「★まんなかの値です。★くらべる先は、あなた自身です。
//      　★よその目安は 出しません。」
//
//   ★★確かめること
//     ① まんなかの値であること（★平均で ないこと）。
//     ② 足りないときは 出さないこと。★「データ不足」と 書かないこと。
//     ③ ★よそと くらべる ことばが、★1つも 無いこと。
//     ④ 7日に 満たなければ、★1週間あたりを 出さないこと。
//     ⑤ 11月の項目を 置いていないこと。
//     ⑥ 取り出し方を 2か所に 書いていないこと（★compareView と 同じもの）。
//     ⑦ 本番の 前後は お休みに なること。
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cnt-"));
  ["lookBack", "timeGap", "compareGroups", "lagChoice", "entrySource", "mealMarks",
    "translations", "displayGates", "analysisCore",
   "compareView", "todayCard", "recordedDay", "countView"].forEach((n) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", n + ".js"), "utf8")
      .replace(/@\/lib\/([a-zA-Z]+)/g, "./$1.js");
    fs.writeFileSync(path.join(dir, n + ".js"), src);
  });
  const m = await import("file://" + path.join(dir, "countView.js"));

  // ★20日ぶん。★食→寝 は 4時間、★1日だけ 大きく ぶらします。
  const E = {}; const D = [];
  for (let i = 1; i <= 20; i++) {
    const d = `2026-08-${String(i).padStart(2, "0")}`;
    D.push(d);
    E[d] = {
      date: d, throatCondition: 3, voiceQuality: 3, nonPerformanceSpeechMinutes: 120,
      dinnerTime: "19:00", bedtime: i === 1 ? "09:00" : "23:00",
      mealMarks: i % 4 === 0 ? ["fat", "alcohol"] : []
    };
  }

  console.log("=== ① まんなかの値（★平均で ない） ===");
  const u = m.usualOf(E, D, "dinnerToBed", null);
  eq(u.value, 4, "★1日 大きくぶれても、まんなかは 動かない");
  eq(u.n, 20, "何日ぶんかも 返る");
  // ★平均なら 4 に ならないこと（★14時間の日が 1つ ある）
  const avg = D.map((d) => (d === "2026-08-01" ? 14 : 4)).reduce((a, b) => a + b, 0) / 20;
  t(Math.abs(avg - 4) > 0.4, `★平均なら ${Math.round(avg * 100) / 100} で、まんなかと ちがう`);

  console.log("\n=== ② 足りないときは 出さない ===");
  eq(m.usualOf(E, D.slice(0, 4), "dinnerToBed", null), null, `★${m.USUAL_MIN_DAYS}日 未満なら null`);
  eq(m.usualOf(E, D.slice(0, 5), "dinnerToBed", null).n, 5, `★${m.USUAL_MIN_DAYS}日 あれば 出る`);
  eq(m.usualOf(E, D, "しらない項目", null), null, "★知らない項目は null");
  // ★★きょうの日を 混ぜないこと
  eq(m.usualOf(E, D, "dinnerToBed", "2026-08-20").n, 19, "★きょうは 混ぜない");
  const lib = readCode("lib", "countView.js");
  t(!/データ不足|足りません|記録が少/.test(lib), "★「データ不足」と 書かない");
  const ui = readCode("components", "CountV2.jsx");
  t(!/データ不足|足りません/.test(ui), "★画面にも 書かない");

  console.log("\n=== ③ よそと くらべない ===");
  t(!/まんなかの値です。くらべる先は、あなた自身です。よその目安は 出しません。/.test(ui),
    "★実機では 但し書きを 出さない");
  {
    // ★★見本⑭の 但し書き そのものには「目安」が 入っています。
    //   ★「★よその目安は 出しません」という、★出さないと 言う 文です。
    //   ★★だから、★その1文を 外してから 調べます。
    //   ★言葉が あるか、では なく、★出しているか、を 見ること。
    const DISCLAIMER = "まんなかの値です。くらべる先は、あなた自身です。よその目安は 出しません。";
    const body = ui.split(DISCLAIMER).join("");
    ["平均", "目安", "基準", "同年代", "ほかの方", "みんな", "一般的"].forEach((w) => {
      t(!body.includes(w), `★「${w}」を 出さない`);
    });
    t(!ui.includes(DISCLAIMER), "★但し書きは、★実機から 消している");
  }
  t(!/点数|順位|進捗|スコア/.test(ui), "★点数・順位・進捗・スコアを 出さない");

  console.log("\n=== ④ 1週間あたり ===");
  eq(m.marksPerWeek(E, D.slice(0, 6)), null, "★7日 未満なら 出さない");
  const mk = m.marksPerWeek(E, D);
  t(mk && mk.rows.length === 2, "★あった印だけ 出る（脂・酒）");
  t(mk && mk.rows.every((r) => r.perWeek > 0), "★0回の 印を 並べない");
  eq(m.marksPerWeek({}, D), null, "★記録が 無ければ null");

  console.log("\n=== 分布 ===");
  const h = m.histogramOf(E, D, "dinnerToBed");
  eq(h.n, 20, "★何日ぶんか");
  eq(h.bars.length, 8, "★0〜6 と 7+ の 8段");
  eq(h.bars[h.bars.length - 1].label, "7+", "★いちばん上は 7+");
  eq(m.histogramOf({}, D, "dinnerToBed"), null, "★1日も 無ければ null（★空の柱を 並べない）");

  console.log("\n=== ⑤ 11月の項目を 置かない ===");
  // ★★禁じた語は、★必ず 注記を 外した本文で（★CLAUDE.md・_source.js）。
  //   ★注記に「★11月の項目は 置きません」と 名前を 並べて 書いてあります。
  //   ★★今日 4度目です。★readRaw と readCode を、★用で 使い分けること。
  ["週ごとに まとめる", "去年の 今ごろ", "季節の 1枚", "しらべる"].forEach((w) => {
    t(!ui.includes(w), `★「${w}」を 置いていない（★11月の 項目）`);
  });

  console.log("\n=== ⑥ 取り出し方を 2か所に 書かない ===");
  t(/from "@\/lib\/compareView"/.test(readRaw("lib", "countView.js")),
    "★取り出し方は compareView から もらう");
  t(!/dinnerTime[\s\S]{0,40}bedtime[\s\S]{0,40}timeGap/.test(lib),
    "★食→寝 を 自分で 数え直していない");
  t(/from "@\/lib\/todayCard"/.test(readRaw("lib", "countView.js")),
    "★何日で 出すかは todayCard から もらう（★きょうの画面と 同じ線）");
  t(!/USUAL_MIN_DAYS\s*=\s*\d/.test(lib), "★日数を ここで 決め直していない");

  console.log("\n=== ⑦ 本番の 前後は お休み ===");
  const lb = readRaw("components", "LookBackV2.jsx");
  t(/tabIsOpen\("kazoeru"/.test(lb), "★かぞえるも、休みかどうかを lib に 尋ねる");
  t(/<CountV2/.test(lb), "★帯と 中身が そろっている");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
