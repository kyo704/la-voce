// 統計の計算を lib/ へ切り出した（2026-09-03）
//
//   ★切り出す前に値を控え、切り出したあと★同じ値が出ることを確かめます。
//   ★「見つかるまでの日数」を測る道具と、画面が、★同じコードを見るためです。
//     ★書き写すと、片方だけが古くなります。
//     ★このリポジトリで、いちばん多く繰り返してきた失敗です。
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const 同じ = (名, a, b) => ok(`${名}（${JSON.stringify(a)}）`, JSON.stringify(a) === JSON.stringify(b));

const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "analysisCore.js"), "utf8");

(async () => {
const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

console.log("\n① ★切り出す前と同じ値が出ること");
// ★この値は、切り出す前の VocalTracker.jsx で実際に出した値です。
//   ★手で計算し直したものではありません。★写した記録です。
const xs = [1,2,3,4,5,6,7,8,9,10], ys = [2,1,4,3,6,5,8,7,10,9];
同じ("pearson", m.pearson(xs, ys), 0.9393939393939394);
同じ("spearman", m.spearman(xs, ys), 0.9393939393939394);
同じ("rankArray（同値は平均順位）", m.rankArray([3,1,1,2]), [4,1.5,1.5,3]);
同じ("benjaminiHochberg", m.benjaminiHochberg([0.001,0.02,0.3,0.9], 0.10), [true,true,false,false]);
同じ("tDistPValue", m.tDistPValue(2.5, 8), 0.03694203771358127);
同じ("effectSortWeight", m.effectSortWeight({ g: -0.62 }), 0.62);
const h = m.computeHedgesG([5,6,7,8,9], [1,2,3,4,5]);
同じ("computeHedgesG の g", h.g, 2.285000631863603);
同じ("computeHedgesG の下限", h.ciLow, 0.6914092624550316);
ok("★点を全部返している（棒2本にしない）",
  Array.isArray(h.values1) && h.values1.length === 5 && Array.isArray(h.values0));

console.log("\n② 少なすぎるときは、答えを出さないこと");
ok("pearson は n<3 で null", m.pearson([1,2],[1,2]) === null);
ok("spearman も n<3 で null", m.spearman([1,2],[1,2]) === null);
ok("★ばらつきが0なら null（0で割らない）", m.pearson([1,1,1],[1,2,3]) === null);
ok("computeHedgesG は n<2 で null", m.computeHedgesG([1],[1,2]) === null);
ok("★ばらつきが0なら null", m.computeHedgesG([2,2,2],[2,2,2]) === null);

console.log("\n③ ★しきい値を、ここに書かないこと");
// ★n や |g| や q の線は lib/displayGates.js が持ちます。
//   ★ここは「計算するだけ」で、「言ってよいか」は決めません。
for (const 語 of ["0.4", "0.3", "0.10", "n >= 10", "n>=10"]) {
  // ★0.10 は benjaminiHochberg の引数として渡されるもので、
  //   ★この中に書いてあってはいけません。
  ok(`★しきい値「${語}」を持っていない`, !src.includes("const " + 語) && !new RegExp("=\\s*" + 語.replace(".", "\\.") + "\\s*[;,)]").test(src));
}
ok("★displayGates を読み込んでいない", !/from ["']\.\/displayGates|require\(.*displayGates/.test(src));

console.log("\n④ ★画面に書き戻していないこと");
const VT = readCode("components/VocalTracker.jsx");
for (const 名 of ["pearson", "rankArray", "spearman", "incompleteBeta",
                  "logGamma", "tDistPValue", "benjaminiHochberg",
                  "computeHedgesG", "effectSortWeight"]) {
  ok(`★VocalTracker に function ${名} が無い`,
    !new RegExp("^function " + 名 + "\\s*\\(", "m").test(VT));
}
ok("★lib から読み込んでいる", /from "@\/lib\/analysisCore"/.test(VT));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
})();
