#!/usr/bin/env node

// ============================================================================
// きょう（A01）── ★見本の 字と 並びの 見張り
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の S_kyou（★575〜614行・git hash 7c7c720）
//
//   ★★2026-09-11、★坂本さんの ✗ を 受けて 作りました。
//     ★比較画像で 見つかった もの ──
//       ★① 羊の ひとことに 句点が 2つ（「…ありがとう。。」）
//       ★② 見本に 句点は ない
//       ★③ 下の 1行（羊は「記録した行為」に…）が 出ていない
//       ★④ いちばん下の 3行（.note）が 出ていない
//       ★⑤ 羊の 地（.stage）が ない
//
//   ★★実装は、★取り下げられた 見本（docs/design/pack/screens/A01-…）から
//     ★作られて いました。★正は 4本の 動く見本 だけです。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

(async () => {
  const load = async (rel) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", rel), "utf-8");
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const tc = await load("lib/todayCard.js");
  const mihon = fs.readFileSync(path.join(__dirname, "..", "..",
    "docs", "design", "pack-final", "00-動く見本（さわれる・全画面）.html"), "utf8");

  console.log("① 羊の ひとこと（★見本の 字の まま）");
  [tc.SHEEP_THANKS_YET, tc.SHEEP_THANKS_DONE, tc.SHEEP_SUB].forEach((w) => {
    t(mihon.includes(w), "「" + w.slice(0, 28) + "」が 見本に ある");
  });
  // ★★句点を 付けません。★見本に ありません。
  t(!/。$/.test(tc.SHEEP_THANKS_YET), "★まだの 文に 句点を 付けない");
  t(!/。$/.test(tc.SHEEP_THANKS_DONE), "★書いた 文に 句点を 付けない");

  console.log("\n② 書いたか どうかで 変わる こと");
  // ★★見本は S.R.nodo か S.R.deki の どちらかで 変わります。
  t(tc.sheepThanks(null) === tc.SHEEP_THANKS_YET, "★何も 無ければ「来てくれて」");
  t(tc.sheepThanks({}) === tc.SHEEP_THANKS_YET, "★空でも「来てくれて」");
  t(tc.sheepThanks({ throatCondition: 3 }) === tc.SHEEP_THANKS_DONE,
    "★のどの調子が あれば「書いてくれて」");
  t(tc.sheepThanks({ voiceQuality: 2 }) === tc.SHEEP_THANKS_DONE,
    "★声の出来が あれば「書いてくれて」");
  // ★★中身を 見ません。★「わるい」でも 同じ 文です。
  t(tc.sheepThanks({ voiceQuality: 2 }) === tc.sheepThanks({ voiceQuality: 5 }),
    "★中身で 文を 変えない（★行為にだけ 応える）");

  console.log("\n③ いちばん下の 3行（★見本 .note）");
  t(tc.TODAY_NOTE.length === 3, "★3行（" + tc.TODAY_NOTE.length + "）");
  tc.TODAY_NOTE.forEach((w) => {
    t(mihon.includes(w), "「" + w.slice(0, 24) + "」が 見本に ある");
  });

  console.log("\n④ 画面が 使っている こと");
  const home = readCode("components", "HomeV2.jsx");
  const band = readCode("components", "TodayBand.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  t(/TODAY_NOTE\.map/.test(home), "★きょうの 画面が 3行を 出している");
  t(/<Note fold>/.test(home), "★3行を 畳んでいる（★見本 foldNotes）");
  t(/SHEEP_SUB/.test(band), "★羊の 下の 1行を 出している");
  t(/sheepThanks\(entries\[realTodayDate\]\)/.test(vt), "★門の中は 見本の 文を 使う");
  // ★★門の外（38人）は、★これまでどおりです。
  t(/SHEEP_LINE \+ "。"/.test(vt), "★門の外は これまでどおり");
  // ★★羊の 地（.stage）。
  t(/linear-gradient\(#F6EEDC,#EFE4CC\)/.test(home), "★羊の 地が 見本の 色");
  t(mihon.includes("linear-gradient(#F6EEDC,#EFE4CC)"), "★その 色が 見本に ある");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
