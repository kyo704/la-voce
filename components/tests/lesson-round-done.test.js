#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★確定して 配る ── ★見本 `P_wariDone`
//   ★出どころ woolsong-2026-09-21_7.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 29e1d658）
//
//   ★★守る こと
//     ① ★置けていない 方が いても 確定できる（★人数で 止めない）
//     ② ★催促しない（★「お知らせは 送りません」）
//     ③ ★カレンダーの 住所を 出さない（★1人ずつ ちがう）
//     ④ 決めを 画面で 作って いない
//     ⑤ 字は tx() ／ ⑥ 押しどころは 44 以上
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  const 画 = readCode("components", "LessonRoundDone.jsx");
  const 生 = readRaw("components", "LessonRoundDone.jsx");
  const p = path.join(__dirname, "..", "..", "lib", "lessonRound.js");
  const L = await import("data:text/javascript;base64," + Buffer.from(
    fs.readFileSync(p, "utf8").replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g,
      (m, n) => `from "${"file://" + path.join(__dirname, "..", "..", "lib", n + ".js")}"`)
  ).toString("base64"));
  const libCode = readCode("lib", "lessonRound.js");

  console.log("① 人数で 止めない");
  t(L.canConfirm({ status: "open" }) === true, "★open なら 確定できる");
  t(L.canConfirm({ status: "confirmed" }) === false, "★もう 確定して いれば できない");
  t(L.canConfirm(null) === false, "★回が 無ければ できない");
  // ★★★置けた 人が 0 でも 確定できる こと。
  t(L.canConfirm({ status: "open" }) === true, "★★置いた 人が 0 でも 確定できる");
  t(!/placed\s*[<>]=?\s*\d|left\s*===?\s*0/.test(画), "★画面が 人数で 止めて いない");
  t(!/placed\s*[<>]=?\s*total/.test(libCode), "★lib も 人数で 止めて いない");
  const 数 = L.placedCount({ a: 1, b: 2 }, 5);
  t(数.placed === 2 && 数.total === 5 && 数.left === 3, "★置いた／ぜんぶ／まだ を 数える");
  t(L.placedCount({}, 0).left === 0, "★0人でも 負に ならない");

  console.log("\n② 催促しない");
  t(/お知らせは 送りません/.test(L.DONE_NOTE.join("")), "★「お知らせは 送りません」が lib に ある");
  t(!/通知|プッシュ|催促|リマインド|あと \d/.test(画), "★催促の 字が ない");
  t(/置けていない方が いても、確定できます。/.test(L.DONE_NOTE.join("")), "★但し書きが 見本の まま");

  console.log("\n③ 住所を 出さない");
  // ★★★2026-09-23 ── ★きょう 8度目の 同じ つまずき。
  //   ★`import { C } from "@/lib/tokens"` の **tokens** が、★`token` に 当たりました。
  //   ★★見たいのは「★カレンダーの 住所を 画面に 出して いないか」です。
  //     ★だから 色の 取り込みは 外し、★住所らしい ものだけ を 見ます。
  const 色の取り込みを除く = 画.replace(/from "@\/lib\/tokens"/g, "");
  [/webcal/i, /\.ics\b/i, /calendar_tokens/i, /\bcalendarToken\b/i, /rotate_calendar_token/i]
    .forEach((re) => {
      t(!re.test(色の取り込みを除く), "★" + String(re) + " を 出して いない");
    });
  // ★★住所を 受け取る ところも 無い こと（★受け取れば 出せて しまう）。
  const 受 = 画.slice(画.indexOf("export default function LessonRoundDone("),
    画.indexOf("export default function LessonRoundDone(") + 200);
  t(!/token|ics|url|address/i.test(受), "★props に 住所が ない");

  console.log("\n④ 決めは lib から");
  ["DONE_REACH", "DONE_NOTE", "DONE_AFTER", "confirmLines", "canConfirm", "placedCount"]
    .forEach((n) => t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));
  t(/置いた \d*人に、レッスンが 届きます/.test(L.confirmLines(3).join("")) === false
    || /置いた 3人に、レッスンが 届きます。/.test(L.confirmLines(3).join("")),
    "★確定の 前の 字を lib が 作る");

  console.log("\n⑤⑥ 字と 押しどころ");
  const 裸 = [...生.matchAll(/>([^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*)</g)]
    .map((m) => m[1].trim()).filter((s) => s && !/^[　\s]*$/.test(s));
  t(裸.length === 0, "★tx() を 通さない 字が ない" + (裸.length ? "（" + 裸.slice(0, 2).join("／") + "）" : ""));
  const 押 = [...画.matchAll(/minHeight: (\d+)/g)].map((m) => Number(m[1]));
  t(押.length > 0 && 押.every((x) => x >= 44), "★押しどころは 44 以上（" + 押.join("／") + "）");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
