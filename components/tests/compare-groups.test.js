#!/usr/bin/env node
// ============================================================================
// くらべる ── §1「初日だけ」と §2「時間差は1項目1つ」の 見張り
//
//   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §1・§2
//
//   ★★確かめること
//     ① 「初日だけ」が ★既定であること（★有料の切替に していないこと）。
//     ② かたまりの 切れ目が 正しいこと。
//     ③ 時間差は 4種 表示し、★判定は 1つだけ であること。
//     ④ 既定が 一律でなく、★項目の性質で 決まること。
//     ⑤ 変えたら 数え直すこと。
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
  // ★@/lib の 書き方を 直して 読み込みます（★本物を 読みます。偽物を 置きません）。
  const load = async (rel) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", rel), "utf8")
      .replace(/from "@\/lib\/([a-zA-Z]+)"/g, 'from "./$1.js"');
    const tmp = path.join(os.tmpdir(), path.basename(rel));
    fs.writeFileSync(tmp, src);
    fs.copyFileSync(path.join(__dirname, "..", "..", "lib", "lookBack.js"),
      path.join(os.tmpdir(), "lookBack.js"));
    return import("file://" + tmp + "?v=" + src.length);
  };
  const g = await load("lib/compareGroups.js");
  const l = await load("lib/lagChoice.js");

  console.log("=== ① 「初日だけ」は 既定。★売り物では ない ===");
  eq(g.FIRST_DAY_ONLY_DEFAULT, true, "★既定は true");
  eq(g.FIRST_DAY_ONLY_LABEL, "つづいた日は、初日だけで くらべる", "★見本⑬の 言葉のまま");
  // ★★有料の 鍵を 作っていないこと（★§1「置く場所を 間違えていました」）
  const ent = readRaw("lib", "entitlements.js");
  t(!/firstDayOnly|E3|初日だけ/.test(ent), "★entitlements に 鍵を 作っていない");
  const code = readCode("lib", "compareGroups.js");
  t(!/can\(|viewer|tier|entitle/i.test(code), "★module が 有料の判定を 呼んでいない");

  console.log("\n=== ② かたまりの 切れ目 ===");
  eq(g.streaksOf(["2026-09-01", "2026-09-02", "2026-09-03"]),
    [["2026-09-01", "2026-09-02", "2026-09-03"]], "つづく3日は 1つ");
  eq(g.streaksOf(["2026-09-01", "2026-09-03"]),
    [["2026-09-01"], ["2026-09-03"]], "★1日 空けば 別のかたまり");
  eq(g.streaksOf(["2026-09-03", "2026-09-01", "2026-09-02"]),
    [["2026-09-01", "2026-09-02", "2026-09-03"]], "★順が ばらばらでも まとまる");
  eq(g.streaksOf(["2026-09-01", "2026-09-01"]), [["2026-09-01"]], "★同じ日を 2回 数えない");
  eq(g.streaksOf([]), [], "空は 空");
  eq(g.streaksOf(null), [], "無くても 落ちない");
  // ★月・年を またぐ
  eq(g.streaksOf(["2026-09-30", "2026-10-01"]), [["2026-09-30", "2026-10-01"]], "★月を またいで つながる");
  eq(g.streaksOf(["2026-12-31", "2027-01-01"]), [["2026-12-31", "2027-01-01"]], "★年を またいで つながる");

  console.log("\n=== 群B と、その代償 ===");
  const d = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-06", "2026-09-09", "2026-09-10"];
  eq(g.groupBDates(d), ["2026-09-01", "2026-09-06", "2026-09-09"], "★既定は 初日だけ");
  eq(g.groupBDates(d, false).length, 6, "★切ると つづいた日も 全部");
  eq(g.firstDayOnlyCost(d), { all: 6, first: 3, dropped: 3 }, "★どれだけ 減るかを 数えられる");
  // ★★代償の数は、画面に 出さないこと
  t(!/あと\s*\d|残り/.test(readRaw("lib", "compareGroups.js")), "★「あと◯」を 作らない");

  console.log("\n=== ③ 時間差は 4種 見せ、判定は 1つ ===");
  eq(l.LAGS.map((x) => x.label), ["前の夜", "前の日", "2日まえ", "その日の朝"],
    "★見本⑫の 4種、その並びのまま");
  eq(l.testsPerItem(), 1, "★★1項目につき 1つ（★§2 の 芯）");
  // ★★20回 → 5回。★項目数 × 1 に なっていること
  eq(l.ITEMS.length * l.testsPerItem(), l.ITEMS.length, "★検定の総数は 項目数と 同じ");
  t(l.ITEMS.length * 4 !== l.ITEMS.length * l.testsPerItem(), "★4種 全部では 検定していない");

  console.log("\n=== ④ 既定は 一律でなく、項目の性質で ===");
  eq(l.defaultLagOf("markAlcohol"), "prevNight", "★お酒は 前の夜");
  eq(l.defaultLagOf("dinnerToBed"), "prevNight", "★食べ終えてから 寝るまでも 前の夜");
  eq(l.defaultLagOf("sungMinutes"), "prevDay", "★歌った時間は 前の日");
  eq(l.defaultLagOf("humidity"), "sameMorning", "★湿度は その日の朝");
  eq(l.defaultLagOf("しらない項目"), null, "★知らない項目は null");
  // ★★一律に していないこと
  const defaults = new Set(l.ITEMS.map((i) => l.defaultLagOf(i.key)));
  t(defaults.size >= 3, `★既定が 一律で ない（★${defaults.size}種類 使っている）`);
  // ★★すべての項目に 性質が 付いていること（★決めないまま 足さない）
  l.ITEMS.forEach((i) => {
    t(l.defaultLagOf(i.key) != null, `★「${i.label}」に 既定が ある`);
  });

  console.log("\n=== 選んだものと、でたらめ ===");
  eq(l.judgingLagOf("markAlcohol", "twoDaysAgo"), "twoDaysAgo", "★選んだものを 使う");
  eq(l.judgingLagOf("markAlcohol", "でたらめ"), "prevNight", "★知らない値は 既定に 戻す");
  eq(l.judgingLagOf("markAlcohol", null), "prevNight", "★選んでいなければ 既定");

  console.log("\n=== ⑤ 変えたら 数え直す ===");
  eq(l.needsRecount("prevNight", "prevDay"), true, "★変えたら 数え直し");
  eq(l.needsRecount("prevNight", "prevNight"), false, "同じなら そのまま");
  t(/数え直/.test(readRaw("lib", "lagChoice.js")), "★数え直す、と 書いてある");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
