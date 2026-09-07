// ============================================================================
// 試していただく方には、鍵を出さない（2026-09-08・坂本さんの決め）
//
//   ★★「ご自分の画面では、何でも選んで着られるようにしてほしい」
//   ★★これは、★その方だけの扱いです。★門（wardrobeOn）とは別の名簿です。
//     ★一般の方は、★§9 の「試着」のままです。
//     ★鍵の付いた品も、★押して見られます。★持てないだけです。
//
//   node components/tests/wardrobe-all-items.test.js
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

(async () => {
  const W = await load("lib/sheepWardrobe.js");
  const ME = "99b695d8-ae90-43a5-9767-a8d073a4003d";

  console.log("① 名簿");
  ok(W.mayWearEverything(ME, { NEXT_PUBLIC_WARDROBE_ALL_ITEMS_USER_IDS: ME }) === true,
    "名簿に載っている方には、鍵を出さない");
  ok(W.mayWearEverything("だれか", { NEXT_PUBLIC_WARDROBE_ALL_ITEMS_USER_IDS: ME }) === false,
    "★ほかの方には、これまでどおり鍵が出る");

  console.log("② ★空のときは、誰にも出さない（★出さない側が安全）");
  ok(W.mayWearEverything(ME, {}) === false, "設定が無ければ、false");
  ok(W.mayWearEverything(ME, { NEXT_PUBLIC_WARDROBE_ALL_ITEMS_USER_IDS: "" }) === false, "空文字でも、false");
  ok(W.mayWearEverything(ME, { NEXT_PUBLIC_WARDROBE_ALL_ITEMS_USER_IDS: " , , " }) === false, "空白だけでも、false");
  ok(W.mayWearEverything(null, { NEXT_PUBLIC_WARDROBE_ALL_ITEMS_USER_IDS: ME }) === false, "誰か分からなければ、false");
  ok(W.mayWearEverything(ME, null) === false, "env が null でも、落ちない");
  ok(W.wardrobeAllItemsUserIds({ NEXT_PUBLIC_WARDROBE_ALL_ITEMS_USER_IDS: " a , b " }).length === 2,
    "前後の空白を落として読む");

  console.log("③ ★門とは、別の名簿である");
  ok(W.mayWearEverything(ME, { NEXT_PUBLIC_WARDROBE_USER_IDS: ME }) === false,
    "★門の名簿に載っているだけでは、鍵は外れない");
  const lib = readCode("lib", "sheepWardrobe.js");
  ok(/NEXT_PUBLIC_WARDROBE_ALL_ITEMS_USER_IDS/.test(lib)
    && /NEXT_PUBLIC_WARDROBE_USER_IDS/.test(lib), "2つの名簿を、別々に読んでいる");

  console.log("④ 画面につながっているか");
  const tracker = readRaw("components/VocalTracker.jsx");
  const panel = readRaw("components/WardrobePanel.jsx");
  ok(/mayWearEverything\(userId/.test(tracker), "VocalTracker が、名簿を見ている");
  ok(/allOwned=\{wardrobeAllItems\}/.test(tracker), "着せかえの画面へ、渡している");
  ok(/allOwned = false,/.test(panel), "★渡さない呼び方では、false（★一般の方はこれまでどおり）");
  ok(/const have = allOwned \|\| \(owned \|\| \[\]\)\.includes\(it\.key\) \|\| openedYet;/.test(panel),
    "持っている扱いに、なる");

  console.log("⑤ ★持ち物そのものを、書き替えていない");
  ok(!/setOwnedItemKeys/.test(readCode("components", "WardrobePanel.jsx")),
    "着せかえの画面は、持ち物を書き替えない");
  ok(!/character_inventory/.test(readCode("components", "WardrobePanel.jsx")),
    "持ち物の表にも、触っていない");

  console.log("⑥ ★一般の方の「試着」は、そのまま（★§9）");
  const raw = readRaw("components/WardrobePanel.jsx");
  // ★★鍵が付いていても、★押せること。★押せない形にしないこと。
  ok(!/disabled=\{!have\}/.test(raw), "★鍵が付いていても、押せる（★試着）");
  ok(/これは まだ です/.test(raw) || /まだ/.test(raw), "★持っていない品には、そう伝える");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
