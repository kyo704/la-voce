// ============================================================================
// 栄養の合計の見張り（2026-09-08・Opus の再点検 2b）
//
//   ★★戻したのは「合計」だけです。
//     ★目標線・基準線・判定・色分けは、★戻していません。
//   ★★並べてよいのは、★ご自身のふだん（中央値）だけです。
//     ★ほかの方の数は、★1つも混ぜません。
//
//   node components/tests/nutrition-totals.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { readRaw, readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let fail = 0;
function ok(c, m) { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; }

async function load(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8")
    .replace(/from\s+"@\/([^"]+)"/g, (m, r) => {
      const abs = path.join(ROOT, /\.[a-z]+$/.test(r) ? r : r + ".js");
      return `from "${pathToFileURL(abs).href}"`;
    });
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

const meal = (c, p, f, fi) => ({ carbs: c, protein: p, fat: f, fiber: fi });
const day = (d, ms) => ({ date: d, meals: ms });

(async () => {
  const N = await load("lib/nutritionTotals.js");

  console.log("① 合計");
  const t = N.mealMacroTotals([meal(50, 10, 5, 3), meal(30, 8, 4, 2)]);
  ok(t.carbs === 80 && t.protein === 18 && t.fat === 9 && t.fiber === 5, "書いたものを、足すだけ");
  ok(t.energy === 80 * 4 + 18 * 4 + 9 * 9, "エネルギーは 4/4/9 で出す（★" + t.energy + "kcal）");
  ok(N.KCAL_PER_G.carbs === 4 && N.KCAL_PER_G.protein === 4 && N.KCAL_PER_G.fat === 9,
    "係数を、1か所で持っている");

  console.log("② ★書いていないときは、0 を出さない");
  ok(N.mealMacroTotals([]) === null, "1つも書かれていなければ、null");
  ok(N.mealMacroTotals(null) === null, "null でも、落ちない");
  ok(N.mealMacroTotals([{}, {}]) === null, "中身が空でも、null");
  // ★★「0g 食べた」と「書いていない」は、違うことです。
  const zero = N.mealMacroTotals([meal(0, 0, 0, 0)]);
  ok(zero && zero.carbs === 0, "★0 と書いてあれば、0 を出す");

  console.log("③ 中央値");
  ok(N.median([1, 2, 3]) === 2, "奇数");
  ok(N.median([1, 2, 3, 4]) === 2.5, "偶数");
  ok(N.median([]) === null, "空なら null");
  ok(N.median([1, "x", null, 3]) === 2, "数でないものは、落とす");

  console.log("④ ★あなたのふだん（★ご自身の記録だけ）");
  const few = [1, 2, 3].map((i) => day("2026-09-0" + i, [meal(10 * i, i, i, i)]));
  ok(N.usualTotals(few, "2026-09-09") === null,
    "★少なすぎるときは、出さない（★" + N.USUAL_MIN_DAYS + "日に満たない）");
  const many = Array.from({ length: 9 }, (_, i) =>
    day("2026-09-" + String(i + 1).padStart(2, "0"), [meal((i + 1) * 10, i + 1, 2, 1)]));
  const u = N.usualTotals(many, "2026-09-20");
  ok(u && u.carbs === 50, "9日ぶんの中央値（★" + (u && u.carbs) + "g）");
  ok(u && u.days === 9, "何日ぶんかを、持っている");
  // ★★今日は、入れません。
  const withToday = many.concat([day("2026-09-20", [meal(9999, 9999, 9999, 9999)])]);
  const u2 = N.usualTotals(withToday, "2026-09-20");
  ok(u2 && u2.carbs === u.carbs, "★いま書いている日は、ふだんに入れない");
  // ★★書いていない日は、数えません。
  const withBlank = many.concat([day("2026-09-19", [])]);
  ok(N.usualTotals(withBlank, "2026-09-20").days === 9, "書いていない日は、数えない");
  ok(N.usualTotals({ a: many[0] }, null) === null, "入れ物の形でも、落ちない");

  console.log("⑤ ★判定と色を、返していない");
  const rows = N.macroRows(t, u);
  ok(rows.length === 5, "5つ（炭水化物・たんぱく質・脂質・食物繊維・エネルギー）");
  const keys = new Set(rows.flatMap((r) => Object.keys(r)));
  ["status", "judgement", "color", "target", "goal", "level", "ok"].forEach((k) => {
    ok(!keys.has(k), "★" + k + " を、返していない");
  });
  ok(rows.every((r) => r.value != null), "値の無い行は、出さない");
  const noUsual = N.macroRows(t, null);
  ok(noUsual.every((r) => r.usual === null), "★ふだんが出せないときは、null（★「―」も出さない）");
  ok(N.macroRows(null, u).length === 0, "合計が無ければ、1行も出さない");

  console.log("⑥ ★目標・基準・文献の語が、混じっていないか");
  const code = readCode("lib", "nutritionTotals.js");
  ["目安", "推奨", "基準値", "不足", "足りて", "RDA", "Mifflin"].forEach((w) => {
    ok(!code.includes(w), "★「" + w + "」を、書いていない");
  });

  console.log("⑦ ★ほかの方の数を、混ぜていないか");
  ["平均", "全体", "みんな", "順位", "ランキング", "上位", "パーセンタイル"].forEach((w) => {
    ok(!code.includes(w), "★「" + w + "」を、書いていない");
  });

  console.log("⑧ 画面につながっているか");
  const vt = readRaw("components/VocalTracker.jsx");
  ok(/mealMacroTotals\(formData/.test(vt), "書かれた食べものだけを、足している");
  ok(/usualTotals\(entries, selectedDate\)/.test(vt), "ふだんは、ご自身の記録から出している");
  ok(/macroRows\(recordedMacroTotals, usualMacroTotals\)/.test(vt), "行を作っている");
  // ★★はじめは閉じていること。
  const blk = vt.slice(vt.indexOf("+ 栄養の合計を見る") - 900, vt.indexOf("+ 栄養の合計を見る") + 200);
  ok(/<details/.test(blk) && !/<details open/.test(blk), "★はじめは閉じている");
  // ★★推し量りを、混ぜていないこと。
  const vtCode = readCode("components", "VocalTracker.jsx");
  ok(!/簡易|3択と目標値から推定/.test(vtCode.slice(vtCode.indexOf("栄養の合計を見る") - 1500,
    vtCode.indexOf("栄養の合計を見る") + 2500)), "★3択からの推し量りを、出していない");
  ok(!vtCode.includes("目標値から推定した参考値"), "★「目標値から推定した参考値」を、消した");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
