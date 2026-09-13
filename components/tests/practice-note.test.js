// ============================================================================
// ★稽古の メモの 見張り（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/裁定-9月10日夜の7点（役職名…）.md §1
//     「★『＋』を 押しても 同じ 白紙が 出ていました。
//       ★書くことが 違うので、聞く項目を 分けました」
//     「★稽古で『みた曲』を 選ぶと、
//       ★レパートリーの その曲にも 同じメモが 出ます」
//     「★どちらにも 判定欄は ありません」
//
//   ★★確かめること
//     ① 6つの 欄が あること。★裁定の 並びの まま。
//     ② 出来ばえ・点数の 欄が 無いこと。
//     ③ 「みた曲」は えらぶ もので、★打つ ものでは ないこと。
//     ④ 曲から、★その曲の 稽古の メモが 引けること。★写しを 作らないこと。
//     ⑤ 1つも 必須で ないこと。★空でも 残せること。
//     ⑥ 自動で 書く のが、★6つの 欄でも 効くこと。
//     ⑦ 足した 列を、★ぜんぶ 読んで、★ぜんぶ 書いていること。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "practiceNote.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const {
    PRACTICE_FIELDS, REPERTOIRE_FIELDS, REPERTOIRE_STATUS,
    isPractice, emptyPractice, pickFields, hasAnything,
    practiceTitle, practiceSub, notesForRepertoire
  } = m;

  console.log("① 6つの 欄");
  const want = ["lesson_on", "teacher_label", "repertoire_name", "said_text", "next_action", "gained_text"];
  ok(PRACTICE_FIELDS.length === 6, "★6つ ある");
  ok(JSON.stringify(PRACTICE_FIELDS.map((f) => f.key)) === JSON.stringify(want),
    "★裁定の 並びの まま");
  ["いつ", "だれに", "みた曲", "言われたこと", "次に 自分が すること", "できるように なったこと"]
    .forEach((w, i) => ok(PRACTICE_FIELDS[i].label === w, "★" + (i + 1) + "つ目は「" + w + "」"));

  console.log("② 判定欄が 無い");
  const all = PRACTICE_FIELDS.concat(REPERTOIRE_FIELDS).map((f) => f.key + " " + f.label).join(" ");
  ["点", "スコア", "出来ばえ", "評価", "score", "rating"].forEach((w) => {
    ok(!all.includes(w), "★「" + w + "」の 欄が 無い");
  });
  const ui = readCode("components", "NotesV2.jsx");
  ok(!/点数|出来ばえ|評価/.test(ui), "★画面にも 無い");

  console.log("③ 「みた曲」は えらぶ もの");
  ok(PRACTICE_FIELDS.find((f) => f.key === "repertoire_name").kind === "repertoire",
    "★えらぶ 形");
  ok(/<select id=\{"pf-" \+ f\.key\}/.test(readRaw("components", "NotesV2.jsx")),
    "★画面も えらぶ 形");
  ok(/repertoireNames/.test(readRaw("components", "VocalTracker.jsx")), "★台帳から 渡している");
  // ★★打たせると、★同じ曲が 2つの 名前で 増えます。
  ok(/自由に 打たせません/.test(src), "★なぜ 打たせないかが 書いてある");

  console.log("④ 曲から 引ける");
  const ns = [
    { id: 1, kind: "practice", repertoire_name: "フィガロ", lesson_on: "2026-09-01" },
    { id: 2, kind: "practice", repertoire_name: "フィガロ", lesson_on: "2026-09-08" },
    { id: 3, kind: "practice", repertoire_name: "椿姫", lesson_on: "2026-09-05" },
    { id: 4, kind: "repertoire", repertoire_name: "フィガロ" },
    { id: 5, kind: "practice", repertoire_name: "フィガロ", lesson_on: "2026-09-09", deleted_at: "x" }
  ];
  const got = notesForRepertoire(ns, "フィガロ");
  ok(got.length === 2, "★その曲の ものだけ（" + got.length + "）");
  ok(got[0].id === 2, "★新しい順");
  ok(!got.some((x) => x.deleted_at), "★消したものは 出ない");
  ok(notesForRepertoire(ns, "").length === 0, "★曲を 選んでいなければ 0");
  ok(notesForRepertoire(null, "フィガロ").length === 0, "★何も 無くても 落ちない");
  // ★★写しを 作っていないこと。★同じ 1件を 別の 入口から 見ます。
  const v = readCode("components", "VocalTracker.jsx");
  ok(/notesForRepertoire\(myNotes, it\.name\)/.test(v), "★同じ 一覧から 引いている");
  ok(!/from\("practice_notes"\)|practiceNotes/.test(v), "★別の 表を 作っていない");

  console.log("⑤ 1つも 必須で ない");
  ok(hasAnything({ lesson_on: "2026-09-11" }) === false, "★日だけなら、まだ 何も 書いていない");
  ok(hasAnything({ said_text: "あ" }) === true, "★1つでも 書けば ある");
  ok(pickFields({}).said_text === null, "★空は null に なる");
  ok(pickFields({ said_text: "   " }).said_text === null, "★空白だけも null");
  ok(pickFields({ nope: 1 }).nope === undefined, "★知らない 欄は 落ちる");
  ok(practiceTitle({}) === null, "★何も 無ければ 見出しも 無い");
  ok(practiceTitle({ repertoire_name: "フィガロ" }) === "フィガロ", "★曲だけでも 見出しに なる");
  ok(practiceSub({ repertoire_name: "フィガロ", teacher_label: "○○先生" }) === "フィガロ　○○先生",
    "★2行目は 曲と だれに");

  console.log("⑥ 自動で 書く のが、6つの 欄でも 効く");
  const raw = readRaw("components", "NotesV2.jsx");
  ok(/PRACTICE_FIELDS\.map\(\(f\) => editing\[f\.key\]\)\.join/.test(raw),
    "★6つの 欄の どれが 変わっても 書く");
  // ★★本文だけを 見ていると、★分けた とたん 1文字も 残りません。
  ok(/本文だけを 見ていると/.test(raw), "★なぜ そうしたかが 書いてある");

  console.log("⑦ 足した 列を、ぜんぶ 読んで、ぜんぶ 書いている");
  const vr = readRaw("components", "VocalTracker.jsx");
  want.forEach((k) => ok(vr.includes(k), "★" + k + " を 読んでいる"));
  ok(/\.update\(\{ body, kind, \.\.\.fields/.test(vr), "★直すとき、★6つも 一緒に 書く");
  ok(/\.insert\(\{ user_id: userId, kind, body, \.\.\.fields \}\)/.test(vr), "★はじめて 書くときも");
  ok(REPERTOIRE_STATUS.length === 4, "★ようすは 4つ");
  ok(REPERTOIRE_STATUS.join("／") === "はじめたばかり／さらい中／本番済み／しばらく置く",
    "★表の check と 1文字ずつ 同じ");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
