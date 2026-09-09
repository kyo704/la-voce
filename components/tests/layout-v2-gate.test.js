// ============================================================================
// 新しい画面づくりの 門（2026-09-09）
//
//   ★出どころ 2026-09-09・坂本さんの お指図
//     ★「レイアウト改修は、★坂本さんの アカウントだけに 限定した 試験として。
//       ★★一般の 38人の 画面は、★一切 変えないこと。」
//
//   ★★守ること
//     ・★名簿が 空なら、★どなたにも 出ないこと
//     ・★一般の方の 帯は 6つ（★レッスンを 含む）
//     ・★名簿の方の 帯は 5つ（★レッスンを 外す）
//     ・★決めは lib に 1つ。★画面で 判じないこと
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, "lib", "layoutV2.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★門");
  // ★★名簿が 空なら、★どなたにも 出さないこと。★勝手に 開けません。
  ok("★★名簿が 空なら、誰にも 出さない",
    m.mayUseLayoutV2("abc", {}) === false
    && m.mayUseLayoutV2("abc", { NEXT_PUBLIC_LAYOUT_V2_USER_IDS: "" }) === false);
  ok("★名簿に ある方だけ",
    m.mayUseLayoutV2("abc", { NEXT_PUBLIC_LAYOUT_V2_USER_IDS: "abc,def" }) === true
    && m.mayUseLayoutV2("zzz", { NEXT_PUBLIC_LAYOUT_V2_USER_IDS: "abc,def" }) === false);
  ok("★人が 分からなければ 出さない",
    m.mayUseLayoutV2(null, { NEXT_PUBLIC_LAYOUT_V2_USER_IDS: "abc" }) === false);
  ok("★環境変数の 名前を 1か所に 置いている",
    m.LAYOUT_V2_ENV === "NEXT_PUBLIC_LAYOUT_V2_USER_IDS");

  console.log("■ ★帯");
  const vt = readCode("components", "VocalTracker.jsx");
  // ★★一般の方の 帯は、★これまでどおり 6つ（★レッスンを 含む）。
  const tabs = vt.slice(vt.indexOf("const TABS = ["), vt.indexOf("const TABS_V2"));
  const keys = [...tabs.matchAll(/key: "([a-z]+)"/g)].map((x) => x[1]);
  ok(`★★一般の方は 6つ（いま ${keys.length}）`, keys.length === 6, keys.join(","));
  ok("★★一般の方には、レッスンが 残っている", keys.includes("lesson"));
  // ★★名簿の方の 帯は 5つ。
  ok("★名簿の方は、レッスンを 外す",
    /const TABS_V2 = TABS\.filter\(\(tb\) => tb\.key !== "lesson"\);/.test(vt));
  ok("★門で 切り替えている",
    /\(layoutV2 \? TABS_V2 : TABS\)/.test(vt));
  // ★★画面で 判じないこと。
  ok("★★画面で 名簿を 見ていない",
    !/NEXT_PUBLIC_LAYOUT_V2_USER_IDS: process\.env\.NEXT_PUBLIC_LAYOUT_V2_USER_IDS[\s\S]{0,40}split/.test(vt)
    && /mayUseLayoutV2\(userId, \{/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
