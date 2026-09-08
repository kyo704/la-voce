// ============================================================================
// おうち画面の作り直しの見張り（2026-09-08）
//
//   ★出どころ docs/opus/woolsong-仕様-おうち画面の作り直し（9月8日）.md
//
//   ★★いちばん大事な決め
//     ★ふだんは、部屋と羊しか出しません。★「したく」を押したときだけ 開きます。
//   ★★言葉（§7-4）
//     ★「もようがえ」「マイコーデ」「きせかえ」を、★使いません。
//   ★★絵（§7-2）
//     ★アイコンを、★作りません。★字だけです。
//
//   node components/tests/home-drawer.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { readCode, readRaw } = require("./_source");

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
  const H = await load("lib/homeDrawer.js");
  const D = await load("lib/drawerItems.js");

  console.log("① 大分類は5つ（★ポケ森の6つでは ありません）");
  ok(H.CATEGORIES.length === 5, "5つ（★" + H.CATEGORIES.map((c) => c.label).join("・") + "）");
  ok(H.CATEGORIES.map((c) => c.label).join("／") === "きるもの／おくもの／かべ・ゆか／まど／しまう",
    "仕様 §3-2 のとおり");
  // ★★アイコンを、持たないこと（★§7-2・坂本さんのお決め）。
  ok(H.CATEGORIES.every((c) => !c.icon && !c.iconName), "★アイコンを、持っていない");

  console.log("② ★中分類の先頭3つは、いつも同じ");
  ok(H.FIXED_TABS.map((t) => t.label).join("") === "さいきんおきにいりぜんぶ", "3つ、この順");
  ["wear", "place", "surface", "window"].forEach((c) => {
    const t = H.subTabsFor(c);
    ok(t.slice(0, 3).map((x) => x.key).join(",") === "recent,fav,all",
      c + " でも、先頭3つが同じ");
  });
  ok(H.subTabsFor("wear").length > 3, "きるもの には、そのあとの札もある");
  // ★★219点（記念のもの）を、出さない形にしないこと。
  ok(H.SUB_TABS.wear.some((t) => t.key === "garment"), "★全身もの（記念のもの）の札が、ある");
  ok(H.SUB_TABS.wear.some((t) => t.key === "prop"), "★持ちものの札も、ある");

  console.log("③ ★並び順は、1つのチップで巡回する");
  ok(H.SORTS.length === 4, "4つ（★" + H.SORTS.map((s) => s.label).join("→") + "）");
  ok(H.nextSort("new") === "often" && H.nextSort("name") === "new", "★終わりから、先頭へ戻る");
  ok(H.nextSort("そんな順はない") === "new", "★知らない値なら、先頭へ戻る");
  ok(H.sortLabel("often") === "よく使う順" && H.sortLabel(null) === "あたらしい順", "名前が出る");

  console.log("④ ★色の帯は、きるもの のときだけ（★§8-4）");
  ok(H.colorBandApplies("wear") === true, "きるもの では、出す");
  ["place", "surface", "window", "store"].forEach((c) => {
    ok(H.colorBandApplies(c) === false, c + " では、出さない");
  });

  console.log("⑤ ★言葉（★§7-2・§7-4）");
  ok(H.COPY.open === "したく", "★「したく」（★「もようがえ」ではない）");
  ok(H.COPY.undo === "さっきに もどす" && H.COPY.done === "これでいい", "下の帯の言葉");
  ok(H.leftButtonLabel("store") === "しまう" && H.leftButtonLabel("wear") === "おわり",
    "★左だけ、場面で変わる");
  // ★★使ってはいけない言葉が、1つも出ていないこと。
  const files = ["lib/homeDrawer.js", "lib/drawerItems.js", "components/HomeDrawer.jsx"];
  files.forEach((f) => {
    let code = readCode(...f.split("/"));
    // ★★「使わない言葉の一覧」そのものは、★コメントではなく中身です。
    //   ★readCode では消えません。★ここで、その1か所だけ外します。
    //   ★★この取り違えは、この repo で何度も起きています。
    code = code.replace(/export const FORBIDDEN_WORDS[\s\S]*?\]\);/, "");
    H.FORBIDDEN_WORDS.forEach((w) => {
      ok(!code.includes(w), f + " に「" + w + "」が無い");
    });
  });

  console.log("⑥ ★数は、1か所で持つ");
  ok(H.SIZES.drawerPct === 60 && H.SIZES.gridColumns === 4 && H.SIZES.cellPx === 74,
    "§6 の数（引き出し60% ／ 4列 ／ 74px）");
  ok(H.SIZES.colorBandPx === 46 && H.SIZES.swatchPx === 25, "§8-5 の数（帯46 ／ 見本25）");
  const drawer = readCode("components", "HomeDrawer.jsx");
  ok(!/height: 60|gridTemplateColumns: "repeat\(4/.test(drawer), "★画面で、数を書いていない");
  ok(/SIZES\./.test(drawer), "★lib から取っている");

  console.log("⑦ 何を並べるか");
  const wear = [
    { key: "top_01", name: "シャツ", slot: "top" },
    { key: "hat_x", name: "ぼうし", slot: "hat" },
    { key: "g1", name: "きもの", slot: "garment" }
  ];
  const inter = [
    { key: "furniture_01", name: "いす", category: "furniture" },
    { key: "tile_01", name: "かべ", category: "tile", style: "壁" },
    { key: "tile_06", name: "ゆか", category: "tile", style: "床" },
    { key: "window_01", name: "まど", category: "window" },
    { key: "door_01", name: "とびら", category: "door" }
  ];
  const ctx = {
    wearItems: wear, interiorItems: inter,
    marks: { favorites: ["top_01"], wearCounts: { hat_x: { n: 5, last: "2026-09-07" }, top_01: { n: 1, last: "2026-09-01" } } },
    tileSurfaceOf: (i) => (i.style === "壁" ? "wallTile" : "floorTile")
  };
  ok(D.itemsFor("wear", "all", ctx).length === 3, "きるもの ぜんぶ");
  ok(D.itemsFor("wear", "top", ctx)[0].key === "top_01", "置き場所で分かれる");
  ok(D.itemsFor("wear", "fav", ctx).length === 1, "おきにいり");
  ok(D.itemsFor("wear", "recent", ctx)[0].key === "hat_x", "★さいきん は、新しい順");
  ok(D.itemsFor("place", "all", ctx).length === 1, "おくもの");
  ok(D.itemsFor("surface", "wallTile", ctx)[0].key === "tile_01", "★かべ と ゆか が、分かれる");
  ok(D.itemsFor("surface", "floorTile", ctx)[0].key === "tile_06", "ゆか");
  ok(D.itemsFor("window", "door", ctx)[0].key === "door_01", "★扉は「まど」の中");
  ok(D.itemsFor("store", "all", { placed: [1, 2] }).length === 2, "しまう は、置いてあるもの");
  ok(D.itemsFor("wear", "all", {}).length === 0, "何も渡さなくても、落ちない");
  ok(D.itemsFor("そんな分類はない", "all", ctx).length === 0, "知らない分類でも、落ちない");

  console.log("⑧ ★ほかの方の数を、混ぜていないか");
  const code = readCode("lib", "drawerItems.js");
  ["人気", "ランキング", "平均", "みんな", "上位", "順位"].forEach((w) => {
    ok(!code.includes(w), "★「" + w + "」が無い");
  });
  const sorted = D.sortItems(wear, "often", ctx);
  ok(sorted[0].key === "hat_x", "★よく使う順は、ご自身が着た数");

  console.log("⑨ ★ふだんは、道具を1つも出さない（★§0・§5）");
  const vt = readRaw("components/VocalTracker.jsx");
  ok(/HomeDrawer/.test(vt), "引き出しが、つながっている");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
