// ============================================================================
// ★見張り ── ★渡し忘れが 増えて いないか（★N-1 の 決まり）
//
//   ★★★2026-09-18、★7件 ありました。★0件に しました。
//     ★★どれも「札は 書いて あるのに、★呼ぶ 側が 渡して いない」形 です。
//     ★★画面は 黙って 死にます。★誤りも 出ません。★見た方は「無い」と 思います。
//
//   ★★★この 見張りは、★**増えた ことを 教える** ため の もの です。
//     ★★道具（`tools/prop_not_passed.py`）を、★見張りから 呼びます。
//     ★★★0件で ない とき、★誰が いつ 気づくか ── ★ここで 気づきます。
//
//   ★★わざと 渡して いない ものは、★紙に 書いて あります
//     （`tools/prop_not_passed_excluded.json`）。★わけと 引き金の 両方が 要ります。
// ============================================================================

const assert = require("assert");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const 道具 = path.join(ROOT, "tools", "prop_not_passed.py");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

if (!fs.existsSync(道具)) {
  console.error("★止まりました ── 道具が ありません: " + 道具);
  process.exit(1);
}

let 出力 = "";
try {
  出力 = execFileSync("python3", [道具], { cwd: ROOT, encoding: "utf8" });
} catch (e) {
  // ★★道具が 止まった とき（★較正に 失敗した とき など）も、★ここで 落とします。
  console.error("★止まりました ── 道具が 止まりました:\n" + (e.stdout || e.message));
  process.exit(1);
}

// ★★較正 ── ★道具が ちゃんと 走った か。
ok(/★較正 ── ok/.test(出力), "道具の 較正が 通って いる");

const m = /★渡して いない もの ── (\d+)件/.exec(出力);
assert.ok(m, "★止まりました ── 道具の 出力を 読めません。");
const 件 = Number(m[1]);
ok(件 === 0,
  "渡し忘れが 0件（いま " + 件 + "件）"
  + (件 > 0 ? "\n" + 出力.split("\n").slice(1, 1 + 件 + 1).join("\n") : ""));

// ★★わざと 渡して いない ものは、★紙に 書いて ある もの だけ。
const 除き = JSON.parse(fs.readFileSync(
  path.join(ROOT, "tools", "prop_not_passed_excluded.json"), "utf8"));
ok(Array.isArray(除き["除く"]) && 除き["除く"].length > 0, "紙に 除きが 書いて ある");
除き["除く"].forEach((x) => {
  数 += 1;
  assert.ok(x.why && x.trigger,
    "★落ちました ── わけか 引き金が ありません: " + x["部品"] + "." + x.prop);
});
console.log("  ok  どの 除きにも、★わけと 引き金が ある（" + 除き["除く"].length + "件）");

// ★★★「もう 渡して いる のに 除きに 残って いる」も、★道具が 教えます。
ok(!/除きに ある のに、★いまは 渡されて います/.test(出力),
  "直った ものが 除きに 残って いない");

console.log("\n★" + 数 + "件 通りました ── 渡し忘れ 0件");
