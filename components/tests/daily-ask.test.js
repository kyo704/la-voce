// ============================================================================
// ★「毎日、聞いてほしいこと」の 見張り（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html:1281
//            docs/design/pack-final/screens/A10-歯車もっと.html:102
//            坂本さんの お決め（2026-09-11）
//
//   ★★確かめること
//     ① 5つまで。★6つ目は 入らないこと。
//     ② 0でも かまわないこと（★中核を ぜんぶ 外せる）。
//     ③ 「あと◯項目」を、★どこにも 出していないこと。
//     ④ 見送った 2つ（肩の こわばり・鼻の つまり）を、★選べないこと。
//     ⑤ 選べる ものが、★ぜんぶ いまの 記録に ある こと。
//     ⑥ 壊れた 値でも 落ちないこと。
//     ⑦ 枠8（記録する項目）を 消していないこと。
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "dailyAsk.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const {
    DAILY_ASK_MAX, DAILY_ASK_ITEMS, DAILY_ASK_DEFAULT,
    normalizeAsk, addAsk, removeAsk, restOf, canAdd, isAsked, readAsk, writeAsk
  } = m;

  console.log("① 5つまで");
  ok(DAILY_ASK_MAX === 5, "★上限は 5");
  ok(DAILY_ASK_DEFAULT.length === 5, "★既定は 5つ");
  let v = [...DAILY_ASK_DEFAULT];
  ok(canAdd(v) === false, "★5つ あるので、もう 足せない");
  const before = v.length;
  v = addAsk(v, "humidity");
  ok(v.length === before, "★6つ目は 入らない（★黙って 落とさず、そのまま 返す）");
  ok(!v.includes("humidity"), "★入っていない");
  // ★1つ 外せば 足せます。
  v = removeAsk(v, "voiceQuality");
  ok(canAdd(v) === true, "★1つ 外すと 足せる");
  v = addAsk(v, "humidity");
  ok(v.length === 5 && v[4] === "humidity", "★足すと いちばん 後ろに 入る（★並びが ある）");

  console.log("② 0でも かまわない");
  let z = [...DAILY_ASK_DEFAULT];
  DAILY_ASK_DEFAULT.forEach((k) => { z = removeAsk(z, k); });
  ok(z.length === 0, "★中核を ぜんぶ 外せる");
  ok(normalizeAsk(z).length === 0, "★0の ままで よい（★既定に 戻さない）");

  console.log("③ 「あと◯項目」を 出していない");
  const ui = readCode("components", "DailyAskPicker.jsx");
  ok(!/あと\s*\{|あと\s*\d|残り\s*\{|\{[^}]*MAX[^}]*-\s*/.test(ui), "★残りを 数えて 出していない");
  ok(!/\/\s*5\b|5\s*つ中/.test(ui), "★「◯/5」の 形も 出していない");
  ok(/足りない項目を 責めません/.test(readRaw("components", "DailyAskPicker.jsx")),
    "★見本の 註が、1文字も 変わらずに ある");

  console.log("④ 見送った 2つは 選べない");
  ["肩", "こわばり", "鼻", "つまり"].forEach((w) => {
    ok(!DAILY_ASK_ITEMS.some((x) => x.label.includes(w)), "★「" + w + "」が 一覧に ない");
  });
  // ★★見送った ことを、★どこかに 残していること。
  ok(/肩の こわばり/.test(src) && /見送/.test(src), "★見送った ことが 書いてある");

  console.log("⑤ 選べる ものは、ぜんぶ いまの 記録に ある");
  // ★★無い ものを 選ばせては いけません。★選んでも 出ないからです。
  const v2 = readCode("components", "VocalTracker.jsx");
  DAILY_ASK_ITEMS.forEach((it) => {
    const hit = new RegExp("\\b" + it.key + "\\b").test(v2)
      || new RegExp("\\b" + it.key + "\\b").test(readCode("lib", "compareView.js"))
      || new RegExp("\\b" + it.key + "\\b").test(readCode("lib", "recordedDay.js"))
      || it.key === "cycle" || it.key === "exercise" || it.key === "medication";
    ok(hit, "★「" + it.label + "」（" + it.key + "）は 記録に ある");
  });
  // ★★中核 以外は、★どの 折りたたみに あるかを 持っていること。
  DAILY_ASK_ITEMS.filter((x) => !x.core).forEach((it) => {
    ok(!!it.fold, "★「" + it.label + "」は 開く先を 持っている（" + it.fold + "）");
  });

  console.log("⑥ 壊れた 値でも 落ちない");
  [null, undefined, "あ", 7, {}, [1, 2], ["knownNothing"]].forEach((bad) => {
    const got = normalizeAsk(bad);
    ok(Array.isArray(got), "★" + JSON.stringify(bad) + " → 一覧が 返る");
  });
  ok(normalizeAsk(["throatCondition", "throatCondition"]).length === 1, "★同じ ものは 1つに");
  ok(normalizeAsk(new Array(20).fill("throatCondition")).length === 1, "★多すぎても 落ちない");
  ok(Array.isArray(readAsk()), "★端末が 無くても 読める");
  ok(Array.isArray(writeAsk(["throatCondition"])), "★端末が 無くても 書ける");
  ok(isAsked(["throatCondition"], "throatCondition") === true, "★入っているか 分かる");

  console.log("⑦ 枠8（記録する項目）を 消していない");
  // ★★別のものです。★置き換えでは ありません。★どちらも 残します。
  ok(/showFieldGroupManager/.test(readRaw("components", "VocalTracker.jsx")),
    "★枠8は 残っている");
  ok(/isFieldGroupVisible/.test(readRaw("components", "VocalTracker.jsx")),
    "★まとまりの 出し分けも 残っている");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
