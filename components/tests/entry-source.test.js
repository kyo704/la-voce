#!/usr/bin/env node
// ============================================================================
// 「あとから書いた」印（査読 §7）の 見張り
//
//   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §7
//   ★坂本さんのお決め（2026-09-09）★境目は「翌日23:59まで」
//
//   ★★確かめること
//     ① 境目が「翌日23:59まで」であること。★SQL と 同じであること。
//     ② 判定から 既定で 外れること。★import は 選んでも 入らないこと。
//     ③ ★null（分からない）を、★あとから書いた と 決めつけないこと。
//     ④ ★画面から source を 送っていないこと（★直しても 印が 変わらないこと）。
//     ⑤ ★これまでの行を 埋める SQL が 無いこと。
//     ⑥ 消すのでは なく、★区別すること（★表示には 出す）。
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
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "entrySource.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const sql = readRaw("supabase", "2026-09-09-あとから書いた印（source）.sql");

  console.log("=== ① 境目は「翌日23:59まで」 ===");
  eq(m.classify("2026-09-09", "2026-09-09T00:00:00+09:00"), "live", "その日の 0時");
  eq(m.classify("2026-09-09", "2026-09-09T23:59:59+09:00"), "live", "その日の 終わり");
  eq(m.classify("2026-09-09", "2026-09-10T23:59:00+09:00"), "live", "★翌日の 23:59");
  // ★★ここは 私の 書き間違いでした（★2026-09-09）。
  //   ★9/10 の 記録にとって、★9/11 は「翌日」です。★だから live が 正しい。
  //   ★「翌々日」は 9/12 です。★日付を 変えたのに、★期待だけ 写して いました。
  eq(m.classify("2026-09-10", "2026-09-11T00:00:00+09:00"), "live", "★9/10 の 記録に、9/11 は 翌日");
  eq(m.classify("2026-09-10", "2026-09-12T00:00:00+09:00"), "later", "★9/12 は 翌々日");
  eq(m.classify("2026-09-09", "2026-09-11T00:00:00+09:00"), "later", "★翌々日の 0時は later");
  eq(m.classify("2026-09-09", "2026-09-15T10:00:00+09:00"), "later", "★何日も あとは later");
  eq(m.classify("でたらめ", "2026-09-09T10:00:00+09:00"), null, "★おかしい日付は null");
  eq(m.classify("2026-09-09", "でたらめ"), null, "★おかしい時刻は null");
  // ★月・年を またぐ
  eq(m.classify("2026-09-30", "2026-10-01T23:59:00+09:00"), "live", "★月を またいでも 翌日は live");
  eq(m.classify("2026-12-31", "2027-01-01T23:59:00+09:00"), "live", "★年を またいでも 翌日は live");

  console.log("\n=== SQL と 同じ 境目か ===");
  t(/\(new\.date \+ 2\)::timestamp/.test(sql), "★SQL も date + 2 の 0時で 切っている");
  t(/Asia\/Tokyo/.test(sql), "★SQL は 日本時間で くらべている");
  t(/9 \* 60 \* 60 \* 1000/.test(readCode("lib", "entrySource.js")), "★lib も 日本時間で くらべている");
  eq(m.LIVE_WITHIN_DAYS, 1, "★翌日まで（1日）");

  console.log("\n=== ② 判定から 既定で 外れる ===");
  eq(m.JUDGING_SOURCES, ["live"], "★既定で 判定に 入るのは live だけ");
  eq(m.countsForJudging("live"), true, "live は 入る");
  eq(m.countsForJudging("later"), false, "★later は 既定で 外れる");
  eq(m.countsForJudging("later", true), true, "★「含める」を 選べば 入る");
  eq(m.countsForJudging("import"), false, "import は 外れる");
  eq(m.countsForJudging("import", true), false, "★import は 選んでも 入らない（★試すためのもの）");

  console.log("\n=== ③ null を 決めつけない ===");
  eq(m.countsForJudging(null), true, "★null（分からない）は 判定に 入れる");
  eq(m.countsForJudging(null, true), true, "★「含める」でも 変わらない");
  eq(m.isLaterWritten(null), false, "★null に ○を つけない");
  eq(m.sourceNote(null), null, "★null に 言葉を 添えない");
  t(/決めつけません/.test(readRaw("lib", "entrySource.js")), "★決めつけない、と 書いてある");

  console.log("\n=== ④ 画面から source を 送らない ===");
  const vt = readCode("components", "VocalTracker.jsx");
  // ★entryToRow の 中だけを 見ます
  const i = vt.indexOf("function entryToRow");
  const j = vt.indexOf("\n}\n", i);
  const toRow = vt.slice(i, j);
  t(i > 0 && !/(^|\s)source:/m.test(toRow.replace(/weather_source:/g, "")),
    "★entryToRow が source を 送っていない");
  // ★rowToEntry では 読んでいること
  t(/source: row\.source \?\? null/.test(vt), "★rowToEntry では 読んでいる");
  // ★★引き金は insert のときだけ（★直しても 変わらない）
  t(/before insert on public\.entries/.test(sql), "★SQL の 引き金は insert のときだけ");
  t(!/before update|after update/.test(sql), "★update の 引き金が 無い（★直しても 変わらない）");
  t(/if new\.source is not null then[\s\S]{0,60}return new/.test(sql),
    "★入っているものを 上書きしない（★取り込みの ぶん）");

  console.log("\n=== ⑤ これまでの行を 埋めない ===");
  t(!/update\s+public\.entries\s+set\s+source/i.test(sql), "★まとめて 埋める SQL が 無い");
  t(/NULL のままに します/.test(sql) || /埋めません/.test(sql), "★埋めない、と 書いてある");
  t(/entries_source_check/.test(sql), "★決まった言葉しか 入らない");
  t(/source is null or source in \('live', 'later', 'import'\)/.test(sql),
    "★null も 許している（★これまでの行）");

  console.log("\n=== ⑥ 消すのでは なく、区別する ===");
  eq(m.isLaterWritten("later"), true, "★later には ○");
  eq(m.isLaterWritten("import"), true, "★import にも ○");
  eq(m.isLaterWritten("live"), false, "live には つけない");
  eq(m.sourceNote("later"), "あとから書いた", "★見本⑫の 言葉");
  eq(m.sourceNote("import"), "取り込んだ記録", "★取り込みは そう書く");
  // ★★禁じた語は、★必ず 注記を 外した本文で 調べること（★_source.js）。
  //   ★注記に「『遅い』『未入力』と 書きません」と 書いてあり、
  //   ★readRaw だと、★その 説明そのものに 当たります。★今日 3度目です。
  t(!/未入力|遅い|忘れ/.test(readCode("lib", "entrySource.js")), "★責める言葉を 使っていない");
  // ★書いてあるか を 見るときは readRaw（★注記も 位置のうち）。
  t(/取り上げません|消すのでは なく/.test(readRaw("lib", "entrySource.js")),
    "★取り上げない、と 書いてある");

  console.log("\n=== ⑦ 画面（★見本⑫の ○） ===");
  {
    const ui = readCode("components", "LookBackV2.jsx");
    t(/isLaterWritten\(/.test(ui), "★画面は lib に 尋ねている");
    t(!/=== "later"|=== "import"/.test(ui), "★画面で 印を 見分けていない（★決めは lib 1か所）");
    // ★★消していないこと。★同じ長さで 出ること。
    //   ★★棒を 描くのは、★いまは components/UiV2.jsx の BarRow です（★design.zip）。
    //     ★44画面が 同じ 形を 使うので、★1か所に 出しました。
    //   ★★前は LookBackV2 の 中の 書き方を 見ていました。★出した とたん 落ちました。
    //     ★中身は 何も 悪く なっていません。★見張りの 向きを 変えます。
    t(/hollow=\{isLaterWritten\(/.test(ui), "★画面は「あとから書いた日か」を 棒に 渡している");
    const bar = readCode("components", "UiV2.jsx");
    const widths = (bar.match(/width: `\$\{Math\.round\(ratio \* 100\)\}%`/g) || []).length;
    t(widths === 2, `★あとから書いた日も、★同じ長さで 出る（${widths}か所）`);
    t(/border: `1\.4px solid \$\{tint\}`/.test(bar), "★中を 抜いて 見せている（★○）");
    t(!/hollow \? null/.test(bar), "★あとから書いた日を 消していない");
    const raw = readRaw("components", "LookBackV2.jsx");
    t(/○は あとから書いた日です。目では見えますが、判定には 入れていません。/.test(raw),
      "★見本⑫の 凡例を、1文字も 変えずに 出している");
    t(/anyLater \?/.test(raw), "★あとから書いた日が 無ければ、凡例を 出さない");
  }

  console.log("\n=== SQL の 作法 ===");
  t(!/\bbegin;|\brollback;/i.test(sql), "★BEGIN / ROLLBACK に 頼っていない");
  t(/add column if not exists/.test(sql), "★何度 実行しても 安全");
  t(/create or replace function/.test(sql), "★引き金も 何度 実行しても 安全");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
