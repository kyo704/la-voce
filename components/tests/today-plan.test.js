#!/usr/bin/env node

// ============================================================================
// きょうの よてい（★A01 ⑥）── ★見本 S_kyou 594〜606行
//
//   ★出どころ Opus の 裁定（★2026-09-11・その15）⑥⑦
//     「⑥きょうのよてい：枠（個人の予定）は作ってください。教室の札は、
//       後回しで構いません。」
//
//   ★★lib/todayBand.js とは 別の 帳面です。
//     ★★あちらは「ありません」を 書かない、という 決まりを 持って います。
//     ★★こちらは、★見本が「この教室の よていは ありません」と 書いて います。
//     ★★2つは 別の ものです。★1つに すると、★どちらかを ゆるめます。
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
    const src = fs.readFileSync(path.join(__dirname, "..", "..", rel), "utf-8")
      .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (mm, n) => `from "${
        "file://" + path.join(__dirname, "..", "..", "lib", n + ".js")}"`);
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const P = await load("lib/todayPlan.js");
  const mihon = fs.readFileSync(path.join(__dirname, "..", "..",
    "docs", "design", "pack-final", "00-動く見本（さわれる・全画面）.html"), "utf8");

  console.log("① 字が 見本の まま");
  Object.values(P.PLAN_COPY).forEach((w) => {
    t(mihon.includes(w), "「" + w.slice(0, 30) + "」が 見本に ある");
  });

  console.log("\n② 1件も 無い ときも、★枠を 出す");
  // ★★見本 600行 ── 無ければ 1行 置きます。★枠ごと 消しません。
  //   ★★枠が 消えると、★「時間割を 入れる」への 入口も 消えます。
  t(P.planToday([], "2026-09-11", "UTC").length === 0, "★0件なら 0行");
  const home = readCode("components", "HomeV2.jsx");
  t(/plan\.length > 0/.test(home) && /PLAN_COPY\.none/.test(home),
    "★0件でも 1行 置いて いる");
  t(/<Box>/.test(home), "★枠（.box）を 使って いる");

  console.log("\n③ その日の ぶんだけ");
  const L = [
    { id: "a", scheduled_at: "2026-09-11T01:00:00Z", title: "声楽A" },
    { id: "b", scheduled_at: "2026-09-12T01:00:00Z", title: "あした" }
  ];
  const got = P.planToday(L, "2026-09-11", "UTC");
  t(got.length === 1, "★その日 だけ（" + got.length + "）");
  t(got[0].id === "a", "★その日の もの");
  t(/声楽A/.test(got[0].label), "★名前が 入って いる");
  // ★★先生の 名前は、★入って いれば 出します。★作りません。
  t(!/先生/.test(got[0].label), "★先生の 名前が 無ければ 出さない");
  const T = P.planToday([{ id: "c", scheduled_at: "2026-09-11T01:00:00Z",
    title: "声楽A", teacher_name: "斎藤" }], "2026-09-11", "UTC");
  t(/斎藤 先生/.test(T[0].label), "★入って いれば 出す");

  console.log("\n④ 後回しに した もの（★はっきり させます）");
  // ★★教室の 札と「重なり ◯件」は、★裁定で 後回しです。
  t(!/ORGS|教室の 札|orgTag/.test(readCode("lib", "todayPlan.js")), "★教室の 札は まだ 作って いない");
  t(!/重なり/.test(home), "★「重なり ◯件」は まだ 出して いない");
  // ★★行き先の 無い ボタンを 置きません。
  t(/onTimetable \?/.test(home), "★時間割は 行き先が ある ときだけ 出す");

  console.log("\n⑤ 帯の 決まりを ゆるめて いないこと");
  // ★★lib/todayBand.js からは、★「ありません」を 出して いません。
  // ★★覚え書きと、★禁じ手の 一覧そのものは 外して 数えます。
  //   ★★決まりを 書いた 行に つまずかない ため です。
  //     ★★この 帳面で 3度 起きて いる 形です（★components/tests/_source.js）。
  const band = readCode("lib", "todayBand.js")
    .replace(/FORBIDDEN_WORDS[\s\S]*?\]\);/, "");
  t(!/ありません/.test(band), "★帯の 帳面に「ありません」を 書いて いない");
  t(/この教室の よていは ありません/.test(readCode("lib", "todayPlan.js")),
    "★よていの 帳面に だけ ある");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
