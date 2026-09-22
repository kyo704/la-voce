// STRIP: A（振る舞い）
//
// ★`.vercelignore` が、★ビルドに 要る ファイルを 除いて いないか。
//
//   ★★★2026-09-23、★`assets` と だけ 書いて `docs/assets/` まで 除き、
//     ★Vercel の ビルドを 壊しました。★見張りが ありません でした。
//   ★★数える ところは 1つ です …… `tools/vercelignore_check.py`。
//     ★★その 道具は `git check-ignore` に 聞きます。★自分で 合わせません。
const { execFileSync } = require("child_process");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

let 数 = 0, 落 = 0;
const t = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "✓" : "✗"} ${名}${註 ? "  -- " + 註 : ""}`); };

function 走らせる(args) {
  try {
    return { out: execFileSync("python3",
      [path.join(ROOT, "tools/vercelignore_check.py"), ...args], { encoding: "utf8" }), rc: 0 };
  } catch (e) {
    return { out: String((e.stdout || "") + (e.stderr || "")), rc: e.status == null ? 1 : e.status };
  }
}

console.log("=== 一 道具の 較正 ===");
const 較 = 走らせる(["--selftest"]);
t("★道具が 自分の 較正を 通る", 較.rc === 0 && /SELFTEST PASS/.test(較.out),
  (較.out.match(/SELFTEST .*/) || [""])[0]);

console.log("\n=== 二 いまの .vercelignore ===");
const 結 = 走らせる([]);
t("★ビルドが 読む ファイルを 1つも 除いて いない",
  結.rc === 0 && /RESULT: PASS/.test(結.out),
  (結.out.match(/RESULT: .*/) || [""])[0]);

console.log(`\n  ${数 - 落} / ${数}`);
process.exit(落 ? 1 : 0);
