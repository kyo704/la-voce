// STRIP: A（振る舞い）
//
// ★`select('*')` と 引数の 無い `select()` を 見つけたら 止まります。
//   ★★実行ルート 5-1 の「済みの目安」③ …… 同じ 検索を CI に 入れ、1件でも 出たら 止まる。
//
//   ★★★数える ところは 1つ だけ です。★`tools/select_star_scan.py` を 呼びます。
//     ★★ここで もう 1つ 書くと、★2つの 数えが ずれます（★台帳 08-1 の 形）。
//   ★★その 道具は 自分の 較正を 持って います（`--selftest`）。★先に 通します。
const { execFileSync } = require("child_process");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

let 数 = 0, 落 = 0;
const t = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "✓" : "✗"} ${名}${註 ? "  -- " + 註 : ""}`); };

function 走らせる(args) {
  try {
    return { out: execFileSync("python3",
      [path.join(ROOT, "tools/select_star_scan.py"), ...args], { encoding: "utf8" }), rc: 0 };
  } catch (e) {
    return { out: String((e.stdout || "") + (e.stderr || "")), rc: e.status == null ? 1 : e.status };
  }
}

console.log("=== 一 道具の 較正 ===");
const 較 = 走らせる(["--selftest"]);
t("★道具が 自分の 較正を 通る", 較.rc === 0 && /SELFTEST PASS/.test(較.out),
  較.out.trim().split("\n").slice(-1)[0]);

console.log("\n=== 二 探す ===");
const 結 = 走らせる([]);
t("★`select('*')`・`select()` が 0件（★わざと の ぶんを 除く）",
  結.rc === 0 && /RESULT: PASS/.test(結.out),
  (結.out.match(/RESULT: .*/) || [""])[0]);
t("★わざと の 一覧が 古く なって いない", !/わざと の 一覧が 古い/.test(結.out));

console.log(`\n  ${数 - 落} / ${数}`);
process.exit(落 ? 1 : 0);
