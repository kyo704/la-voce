#!/usr/bin/env node

// ============================================================================
// A03「記録」を、★動く見本に そろえた ことの 見張り
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の S_kiroku()。★これが 唯一の 正です。
//
//   ★★2026-09-11、★静止画（screens/*.html）を 参照元から 外して
//     作り直しました（★正誤表 §1「24時間 古い。★裁定20本ぶん 反映なし」）。
//     ★★前の この見張りは、★その 静止画を 読んで 14/14 と 報告していました。
//       ★実機は まったく 違う 形でした。★同じ 誤りを 繰り返さないため、
//       ★★見本の HTML から 字を 取り出して 突き合わせます。★書き写しません。
//
//   ★★確かめること
//     ① 見出し（あさ／よる／足す）が 見本の 字と 1文字も 違わないこと
//     ② 3択 3つの 題と 選択肢が 見本と 一致すること
//     ③ しるし（部屋の しめり…／下の 3行）が 見本と 一致すること
//     ④ 3択の 行き先が、★別々の 列で あること（★上書きし合わない）
//     ⑤ 折りたたみ 5つ（古い見本）が 残っていないこと
//     ⑥ 数を 出していないこと（★「n/5」「あと◯」）
//     ⑦ 引っ越し先の 表に、★節が もれなく 載っていること
//     ⑧ ①消す の 2つが、★門の中でだけ 出ないこと（★38人には 出る）
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ng = 0;
function ok(cond, label) {
  if (cond) { console.log("  ✓ " + label); return; }
  ng += 1; console.log("  ✗ " + label);
}
function eq(a, b, label) {
  if (a === b) { console.log("  ✓ " + label); return; }
  ng += 1;
  console.log("  ✗ " + label);
  console.log("      見本 " + JSON.stringify(b));
  console.log("      実装 " + JSON.stringify(a));
}

const ROOT = path.join(__dirname, "..", "..");
const MIHON = path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html");

console.log("A03（記録）── 動く見本との 突き合わせ");

if (!fs.existsSync(MIHON)) {
  console.log("  ✗ 動く見本が ありません: " + MIHON);
  process.exit(1);
}
const mihon = fs.readFileSync(MIHON, "utf8");

// ★★見本の S_kiroku() だけを 切り出します。
const from = mihon.indexOf("function S_kiroku(){");
const to = mihon.indexOf("function tri(", from);
if (from < 0 || to < 0) {
  console.log("  ✗ 見本の S_kiroku() が 見つかりません");
  process.exit(1);
}
const kiroku = mihon.slice(from, to);

const recordV2 = readCode("lib", "recordV2.js");
const recordV2Raw = readRaw("lib", "recordV2.js");
const head = readCode("components", "RecordV2Head.jsx");
const tracker = readCode("components", "VocalTracker.jsx");
const sheets = readCode("lib", "recordSheets.js");

// ── ① 見出し ───────────────────────────────────────────────
console.log("\n① 見出し（★見本の .h3）");
const heads = [...kiroku.matchAll(/<div class="h3">([^<]+)<\/div>/g)].map((m) => m[1]);
eq(heads.length, 3, "見本の 見出しは 3つ");
heads.forEach((h) => {
  ok(recordV2.includes(`"${h}"`), `「${h}」が lib/recordV2.js に ある`);
});

// ── ② 3択 ─────────────────────────────────────────────────
console.log("\n② 3択（★見本の tri）");
const tris = [...kiroku.matchAll(/tri\('(\w+)','([^']+)',\[(.+?)\]\)/g)].map((m) => ({
  key: m[1],
  title: m[2],
  words: [...m[3].matchAll(/\['(?:◎|○|△)','([^']+)'\]/g)].map((x) => x[1])
}));
eq(tris.length, 3, "見本の 3択は 3つ");
tris.forEach((t) => {
  ok(recordV2.includes(`"${t.title}"`), `題「${t.title}」が ある`);
  t.words.forEach((w) => {
    ok(recordV2.includes(`"${w}"`), `　選択肢「${w}」が ある`);
  });
});
ok(/MARKS\s*=\s*Object\.freeze\(\["◎", "○", "△"\]\)/.test(recordV2),
  "印は ◎○△ の 順（★左が よいほう）");
ok(head.includes("markOf("), "印を 組ごとに 書き写していない（★markOf で 出す）");

// ── ③ しるし ───────────────────────────────────────────────
console.log("\n③ しるし（★見本の .warn ／ .note）");
const warn = /<div class="warn"[^>]*>(.+?)<\/div>/.exec(kiroku);
ok(!!warn, "見本に しるしが ある");
if (warn) {
  const plain = warn[1].replace(/<[^>]+>/g, "");
  const askNote = /A03_ASK_NOTE\s*=\s*([\s\S]*?);/.exec(recordV2);
  const mine = askNote ? askNote[1].replace(/[\s"+\n]/g, "") : "";
  eq(mine, plain.replace(/[\s"+\n]/g, ""), "「この2つは 聞きません」の 一文が 一致する");
}
["n/5", "赤い印", "夜の3つ"].forEach((frag) => {
  ok(recordV2.includes(frag), `下の 3行に「${frag}」が ある`);
});

// ── ④ 行き先 ───────────────────────────────────────────────
console.log("\n④ 3択の 行き先（★別々の 列であること）");
ok(/applyEdemaWord[\s\S]*?morningEdema/.test(recordV2), "むくみ → morningEdema");
ok(/applyThroatWord[\s\S]*?throatCondition/.test(recordV2), "のどの調子 → throatCondition");
ok(/applyDekiWord[\s\S]*?voiceQuality/.test(recordV2), "声の出来 → voiceQuality");
// ★★同じ 列に 2つ 書くと、★片方を 押した とたん もう片方が 消えます。
const throatFn = /export function applyThroatWord[\s\S]*?\n}/.exec(recordV2)[0];
const dekiFn = /export function applyDekiWord[\s\S]*?\n}/.exec(recordV2)[0];
ok(!throatFn.includes("voiceQuality"), "のどの調子は 声の出来の 列に 触らない");
ok(!dekiFn.includes("throatCondition"), "声の出来は のどの列に 触らない");
ok(!throatFn.includes("quality:"), "のどの調子は quality に 触らない");
ok(!dekiFn.includes("bodyFeel"), "声の出来は bodyFeel に 触らない");

// ── ⑤ 古い 折りたたみ ─────────────────────────────────────
console.log("\n⑤ 9月9日の 折りたたみ 5つ が 残っていないこと");
["RECORD_FOLDS", "foldOfSection", "openFold"].forEach((name) => {
  ok(!recordV2.includes(name), `lib/recordV2.js に ${name} が ない`);
  ok(!head.includes(name), `RecordV2Head に ${name} が ない`);
  ok(!tracker.includes(name), `VocalTracker に ${name} が ない`);
});

// ── ⑥ 数を 出さない ───────────────────────────────────────
console.log("\n⑥ 数を 出していないこと");
// ★★下の 3行は「出しません」と 書いてある 行です。★先に 外してから 探します
//   （★これを 忘れると、★但し書き 自身に つまずきます）。
const headNoDisclaimer = head.replace(/A03_NOTES[\s\S]*?\}\)\}/g, "");
ok(!/あと\s*\{/.test(headNoDisclaimer), "「あと◯」を 出していない");
ok(!/\/\s*5/.test(headNoDisclaimer), "「◯/5」を 出していない");
ok(!/length\s*\+\s*"つ"|\$\{[^}]*length[^}]*\}つ/.test(head), "「◯つ」を 出していない");

// ── ⑦ 引っ越し先の 表 ─────────────────────────────────────
console.log("\n⑦ 節が もれなく 引っ越し先に 載っていること");
const folds = [...tracker.matchAll(/fold="([a-zA-Z_]+)"/g)].map((m) => m[1]);
const uniqueFolds = [...new Set(folds)];
const listed = [...recordV2.matchAll(/sections: Object\.freeze\(\[([^\]]*)\]\)/g)]
  .flatMap((m) => [...m[1].matchAll(/"([a-zA-Z_]+)"/g)].map((x) => x[1]));
// ★★気候・滞在地（env）だけは、★わざと 表に 載せていません。
//   ★坂本さんの お決め 5-b ㋒「当面、そのまま、下に残す」。
const EXPECTED_OUT = ["env"];
uniqueFolds.forEach((f) => {
  if (EXPECTED_OUT.includes(f)) {
    ok(!listed.includes(f), `${f} は わざと 表に 載せていない（★お決め 5-b ㋒）`);
  } else {
    ok(listed.includes(f), `${f} が 引っ越し先の 表に ある`);
  }
});
listed.forEach((k) => {
  ok(uniqueFolds.includes(k), `表の ${k} は、実際に ある 節`);
});
// ★★2026-09-11、★お決め ㋐。★1枚に 節を 入れなく なりました。
//   ★★前は「差し込み口が 1つ あること」を 見ていました。
//     ★★その 仕組みごと 外したので、★見る ものが 変わります。
//   ★★いまは「1枚に 入る 節が、★門の中では 出ないこと」を 見ます。
// ★★注記を 外した 本文で 見ます（★components/tests/_source.js）。
//   ★★この 帳面の 註にも「SheetSlot」と 書いてあります。
//     ★生の 本文で 探すと、★自分の 説明に つまずきます。
//   ★★この 罠は、★この repo で 何度も 踏んでいます。
const sheetsCode = readCode("components", "RecordSheets.jsx");
ok(!/SheetSlot/.test(sheetsCode), "★節を 差し込む 口が 残っていない");
// ★★節の 差し込みで getElementById を 使っていないこと。
//   ★★画面には ほかにも 使う 所が あります（★節へ 送る 動き）。
//     ★★そちらは この話では ありません。★器の 中だけを 見ます。
ok(!/RecordSectionHost/.test(readCode("components", "VocalTracker.jsx")),
  "★節を 送る 器が 残っていない");
ok(!/createPortal/.test(readCode("components", "VocalTracker.jsx")),
  "★差し込みの 仕組みが 残っていない");
// ★★2026-09-11 夜の 訂正。★隠さず、★畳みます。
//   ★詳しくは components/tests/section-fold.test.js
ok(/export function sectionIsFolded\(/.test(readCode("lib", "recordV2.js")),
  "★1枚に 入る 節は、門の中では 畳んで 出す");

// ── ⑧ ①消す が 門の中だけ ────────────────────────────────
console.log("\n⑧ ①消す の 2つ（★門の外の 38人には 残る）");
ok(tracker.includes("{!layoutV2 && yesterdayContext && ("),
  "前日からのコンディション背景は 門の中で 出さない");
ok(/\{!layoutV2 && \(\s*<NumberField label=\{t\("labelHumidity"\)\}/.test(tracker),
  "湿度の 入力欄は 門の中で 出さない");
ok(tracker.includes("labelHumidity"), "湿度の 欄そのものは 消していない（★38人には 出る）");
ok(recordV2Raw.includes("morningEdema") && !recordV2Raw.includes("delete "),
  "列を 1つも 落としていない");

// ── ⑨ 引っ越し（お決め 10） ───────────────────────────────
console.log("\n⑨ ここから区切りをつける の 引っ越し（★お決め 10 ㋑）");
const more = readCode("lib", "moreMenu.js");
ok(more.includes("ここから区切りをつける"), "もっと の 行に ある");
ok(tracker.includes('moreSection === "区切り"'), "もっと で 開ける");
ok(/\{!layoutV2 && \(\s*<PeriodMarkerButton/.test(tracker),
  "記録の 画面には 門の外だけ 出る");

// ── ⑩ 足す の 行 ─────────────────────────────────────────
console.log("\n⑩ 足す の 行（★見本 4つ ＋ お決め 2 ㋐ の 1つ）");
const rowIns = [...kiroku.matchAll(/rowIn\('([^']+)'/g)].map((m) => m[1]);
eq(rowIns.length, 6, "見本の ＋の行は 6つ");
rowIns.forEach((label) => {
  ok(sheets.includes(`"${label}"`), `「${label}」が lib/recordSheets.js に ある`);
});
ok(sheets.includes('"お仕事に合わせた記録"'), "7つめ（お決め 2 ㋐）が ある");

// ── ⑪ 1枚の 中の 重なり（★お決め C ㋐） ────────────────────
console.log("\n⑪ 1枚の 中で、同じ 列を 2度 聞いていないこと");
{
  // ★★節の 側の 欄を、★門の中では 出しません。
  //   ★★見本の 札と 重なると、★片方で 書いて もう片方で 上書きされます。
  //   ★出どころ docs/reports/2026-09-11-A03シートの精査.md §4
  const pairs = [
    ['t("labelSleepHours")', "睡眠時間（★ねむり の 1枚）"],
    ['t("labelBedtime")', "就寝時刻（★ねむり の 1枚）"],
    ['t("labelDinnerTime")', "夕食の 時刻（★たべ の 1枚）"],
    ['t("labelDinnerTags")', "夕食の 札（★たべ の 1枚）"]
  ];
  const lines = readRaw("components", "VocalTracker.jsx").split("\n");
  pairs.forEach(([needle, name]) => {
    let found = false;
    lines.forEach((l, i) => {
      if (!l.includes(needle)) return;
      // ★★その 上 12行に !layoutV2 が あること。
      const above = lines.slice(Math.max(0, i - 12), i).join("\n");
      if (/!layoutV2/.test(above)) found = true;
    });
    ok(found, `${name} は 門の中で 出さない`);
  });
  // ★★場面ごとの 印の 欄も 同じです（★からだのこと の 1枚と 取り合っていました）。
  ok(/hideSymptoms=\{layoutV2\}/.test(tracker), "場面ごとの 印の 欄は 門の中で 出さない");
  ok(/hideSymptoms = false/.test(tracker), "★既定は 出す（★38人の 画面を 変えない）");
}

// ── ⑫ きのうの 値（★お決め D-1） ────────────────────────────
console.log("\n⑫ 「きのうの値を 入れています」が 本当か");
{
  const sheets = readCode("components", "RecordSheets.jsx");
  ok(/prevBedtime/.test(sheets) && /prevSleepHours/.test(sheets),
    "1枚が きのうの 値を 受け取る");
  ok(/const carried = /.test(sheets), "きのうから 持ってきたかを 見分けている");
  ok(/\{carried \? <SheetNote>\{NEMURI\.note\}<\/SheetNote> : null\}/.test(sheets),
    "★持ってきていない 日には、その 但し書きを 出さない");
  ok(/prevBedtime=\{\(entries\[addDays\(selectedDate, -1\)\]/.test(tracker),
    "呼ぶ側が、前の日の 記録を 渡している");
}

// ── ⑬ 見本に あって 出ていなかった もの（★F-1・F-2） ──────────
console.log("\n⑬ 見本の ボタンが、実際に 出ること");
{
  const sheets = readCode("components", "RecordSheets.jsx");
  // ★★F-1。★前は 呼ぶ側が onDetail を 渡さず、★1度も 出ませんでした。
  ok(!/onDetail/.test(sheets), "★「詳しく 書く（分で）」は 外から 渡してもらわない");
  ok(/setDetail\(true\)/.test(sheets), "★1枚の 中だけで 開ける（★渡し忘れが 起きない）");
  ok(/KOE\.minuteLabel/.test(sheets), "★分で 書く 欄が ある");
  // ★★F-2。★本番の かたち。
  const pf = readCode("lib", "performanceForm.js");
  ok(/"ソロ"/.test(pf) && /"合唱・アンサンブル"/.test(pf), "★本番の かたちが 2つ ある");
  ok(/performanceFormOf/.test(tracker), "★書いた かたちを、画面が 読んでいる");
  ok(!/performance_form/.test(readRaw("components", "VocalTracker.jsx")),
    "★新しい 列を 作っていない（★activities の 中に しまう）");
}

console.log(ng === 0
  ? "\n★すべて 通りました。"
  : `\n★${ng} 件 落ちました。`);
process.exit(ng === 0 ? 0 : 1);
