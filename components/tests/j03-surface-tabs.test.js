// ============================================================================
// J03「かべ・ゆか・まど」── 札の 並べ替え（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/screens/J03-かべゆかまど.html
//     ★札は「かべ／ゆか／外の けしき」の 3つ。★まど は 別の 札。
//
//   ★★引っ越しです。★消していません（★4分類の ③）。
//     ★★見張る のは、★どの 品も どこかの 札から 出ること です。
//       ★「隠した つもりが、どこからも 出ない」が いちばん こわい 形です
//       （★notOutDates と 同じ 穴）。
//
//   ★★色（24色）は、★まだ ありません。★見送りです（★坂本さんの お決め ③㋒）。
//   ★★J02（7か所）も 見送りです（★同 ①㋒）。★座標は 消していません。
// ============================================================================

const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const load = async (...parts) => {
    const src = readRaw(...parts)
      .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (m, n) => `from "${
        "file://" + path.join(__dirname, "..", "..", "lib", n + ".js")}"`);
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const H = await load("lib", "homeDrawer.js");
  const D = await load("lib", "drawerItems.js");
  const items = require("../../docs/assets/sheep-interior-index.json").items;

  console.log("① 見本の 3つ");
  ok(H.SUB_TABS.surface.map((t) => t.label).join("／") === "かべ／ゆか／外の けしき",
    "★かべ・ゆか の 札が、見本の 3つ");
  ok(!H.SUB_TABS.window.some((t) => t.key === "view"), "★まど から 外れている");
  ok(H.SUB_TABS.window.some((t) => t.key === "door"), "★とびら は 消していない");

  console.log("② どの 品も、どこかの 札から 出る");
  const ctx = {
    interiorItems: items,
    tileSurfaceOf: (i) => (i.surfaceKind === "wall" ? "wallTile"
      : i.surfaceKind === "floor" ? "floorTile" : null)
  };
  const seen = new Set();
  ["place", "surface", "window"].forEach((cat) => {
    D.itemsFor(cat, "all", ctx).forEach((i) => seen.add(i.key));
  });
  const missing = items.filter((i) => !seen.has(i.key)).map((i) => i.category);
  const byCat = {};
  missing.forEach((c) => { byCat[c] = (byCat[c] || 0) + 1; });
  // ★★「ぜんぶ」から こぼれる 品が、★1つも 無いこと。
  ok(missing.length === 0,
    "★どこからも 出ない 品が ない" + (missing.length ? "（" + JSON.stringify(byCat) + "）" : ""));

  console.log("③ 外の けしき が、かべ・ゆか の 中に ある");
  const views = items.filter((i) => i.category === "view");
  ok(views.length === 13, "★外の けしき は 13点");
  const inSurface = D.itemsFor("surface", "view", ctx);
  ok(inSurface.length === 13, "★「外の けしき」の 札で 13点 出る");
  ok(D.itemsFor("window", "view", ctx).length === 0, "★まど の 側には 出ない");

  console.log("④ かべ・ゆか の 中で、混ざっていない");
  const wall = D.itemsFor("surface", "wallTile", ctx);
  const floor = D.itemsFor("surface", "floorTile", ctx);
  ok(wall.every((i) => i.category === "tile"), "★かべ に 外の けしき が 混ざらない");
  ok(floor.every((i) => i.category === "tile"), "★ゆか にも 混ざらない");
  ok(wall.length === 59 && floor.length === 70, "★かべ 59 ／ ゆか 70（★これまでどおり）");

  console.log("⑤ J02 は 見送り ── 座標を 消していない");
  const vt = readCode("components", "VocalTracker.jsx");
  // ★★見送りの あいだ、★これまでどおり 置けること。
  ok(/function handleUpdatePosition/.test(vt), "★置いた 場所を 覚える 道が 残っている");
  ok(/furniturePositions|\$\{category\}Positions/.test(vt), "★座標の 欄が 残っている");
  // ★★これは 注記そのものを 見る 確かめです。★readRaw を 使います
  //   （★禁じた語 の 検査では ありません）。
  const homeRaw = readRaw("lib", "homeDrawer.js");
  ok(/J02（おくスロット・7か所）は、★見送りです/.test(homeRaw),
    "★見送りの わけが 書いてある");
  // ★★7か所を 作りかけて いないこと。★中途半端が いちばん こわいです。
  ok(!/ROOM_SLOTS|SLOT_RECTS/.test(readCode("lib", "homeDrawer.js") + readCode("lib", "sheepInteriorV2.js")),
    "★7か所の 仕組みを、作りかけていない");

  console.log("⑥ 色は まだ 出さない");
  const panel = readCode("components", "InteriorPanel.jsx");
  ok(!/CLOTH_COLORS|clothColors/.test(panel), "★内装に 色の 帯を 出していない");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
