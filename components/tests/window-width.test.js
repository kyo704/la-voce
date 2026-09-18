// ============================================================================
// ★幅を 見る 仕掛けは 1本（★2026-09-18）
//
//   ★★★同じ ものが 4か所に ありました ──
//     ★`OpsSchedule.jsx` ／ `Renraku.jsx` ／ `OpsRoster.jsx` ／ `OpsPosts.jsx`
//   ★★しかも 揃って いません でした ──
//     ★★2つは `orientationchange` を 聞き、★2つは 聞いて いません でした。
//     ★★★iPad を 横に すると、★片方だけ 見せ方が 変わる、という こと です。
//   ★★これが この 蔵で 繰り返して いる 形 です。★写しを 作らせません。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw, ROOT } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

// ---------------------------------------------------------------------------
// 【一】★1本 だけ が 測って いる
//
//   ★★`components/` を ぜんぶ 数えます。★一覧を 書き写しません。
//     ★★書き写すと、★新しい 画面が 増えた 日に 見落とします。
// ---------------------------------------------------------------------------
console.log("【一】`window.innerWidth` を 読むのは 1本 だけ");
const 全部 = fs.readdirSync(path.join(ROOT, "components"))
  .filter((f) => /\.(jsx|js)$/.test(f));
t(全部.length > 20, "画面を " + 全部.length + " 本 数えた");

const 測る本 = 全部.filter((f) => readCode("components", f).includes("window.innerWidth"));
t(測る本.length === 1 && 測る本[0] === "useWindowWidth.js",
  "測るのは `useWindowWidth.js` だけ（★いま: " + 測る本.join("/") + "）");

// ★★道具の 較正 ── ★わざと 1本 増やした ことに して、★見つかる こと。
const 仮 = 測る本.concat(["わざとの画面.jsx"]);
t(!(仮.length === 1), "★わざとの 1件（2本目）を 見つけられる");

// ---------------------------------------------------------------------------
// 【二】★その 1本が、★向きの 変化も 聞いて いる
// ---------------------------------------------------------------------------
console.log("【二】1本が 向きの 変化も 聞いて いる");
const 本体 = readRaw("components", "useWindowWidth.js");
t(本体.includes('addEventListener("resize"'), "大きさの 変化を 聞く");
t(本体.includes('addEventListener("orientationchange"'), "向きの 変化を 聞く");
t((本体.match(/removeEventListener/g) || []).length === 2, "どちらも 外す（★残しません）");
t(本体.includes("useState(null)"), "★はじめは null（★「まだ 分からない」を 0 と 分けます）");
t(本体.includes('typeof window === "undefined"'), "組み上げの ときに 触らない");

// ---------------------------------------------------------------------------
// 【三】★使う 側は、★1本を 呼んで いる
// ---------------------------------------------------------------------------
console.log("【三】使う 側");
["OpsSchedule.jsx", "Renraku.jsx", "OpsRoster.jsx", "OpsPosts.jsx", "OpsShell.jsx"]
  .forEach((f) => {
    const 本文 = readCode("components", f);
    t(本文.includes("useWindowWidth"), f + " ── 1本を 呼んで いる");
    t(!本文.includes("function useWidth"), f + " ── 自分の 写しを 持って いない");
  });

console.log(`\n○ ${ok}　✗ ${ng}`);
process.exit(ng === 0 ? 0 : 1);
