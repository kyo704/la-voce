// ============================================================================
// 置き場所の写しを、持たない（2026-09-08）
//
//   ★★坂本さんのご報告
//     「上・下・羽織り・目元 の品物が、着せかえの画面に出てこない」
//
//   ★★原因は、★WardrobePanel が★置き場所の名前の写しを持っていたことです。
//     ★服・襟まき・くつ・かぶりもの・持ちもの の★5つだけでした。
//     ★2026-09-07 に足した4つ（top / bottom / outer / eyes）が、
//     ★その写しに入っていませんでした。
//   ★★特大窓ガラスのときと、★同じ形の不具合です。
//     ★同じ決めが、★2か所にありました。
//
//   ★★この見張りは、★また写しを持ったら落ちます。
//
//   node components/tests/wardrobe-slots-complete.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { readRaw, readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let fail = 0;
function ok(c, m) { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; }

async function load(rel) {
  let src = fs.readFileSync(path.join(ROOT, rel), "utf8")
    // ★★imageFormat も 差し込みます（★2026-09-09・WebP を 入れたため）。

    .replace('import { webp } from "@/lib/imageFormat";',

      fs.readFileSync(path.join(ROOT, "lib", "imageFormat.js"), "utf-8").replace(/^export /gm, ""))
    .replace(/from\s+"@\/([^"]+)"/g, (m, r) => {
      const abs = path.join(ROOT, /\.[a-z]+$/.test(r) ? r : r + ".js");
      return `from "${pathToFileURL(abs).href}"`;
    })
    .replace(/import\s+(\w+)\s+from\s+"([^"]+\.json)";/g,
      (m, n, p2) => `const ${n} = JSON.parse(__fs.readFileSync(new URL("${p2}"), "utf8"));`);
  return import("data:text/javascript;base64," + Buffer.from('import __fs from "fs";\n' + src).toString("base64"));
}

(async () => {
  const W = await load("lib/sheepWardrobe.js");
  const I = await load("lib/sheepItems.js");
  const items = I.SHEEP_ITEMS;

  console.log("① 品物が使っている置き場所を、1つも落としていないか");
  const used = [...new Set(items.map((i) => i.slot))].sort();
  console.log("   （品物の置き場所：" + used.join(", ") + "）");
  const missing = used.filter((s) => !W.SLOT_DISPLAY_ORDER.includes(s));
  ok(missing.length === 0,
    "★SLOT_DISPLAY_ORDER が、すべての置き場所を持っている" + (missing.length ? "：" + missing.join(",") : ""));
  const noLabel = used.filter((s) => !W.SLOT_LABELS[s]);
  ok(noLabel.length === 0,
    "★すべての置き場所に、名前がある" + (noLabel.length ? "：" + noLabel.join(",") : ""));
  // ★★2026-09-07 に足した4つ。★名指しで見張ります。
  ["top", "bottom", "outer", "eyes"].forEach((s) => {
    ok(W.SLOT_DISPLAY_ORDER.includes(s) && !!W.SLOT_LABELS[s],
      "★" + s + "（" + W.SLOT_LABELS[s] + "）が、入っている");
  });

  console.log("② 重ねる順にも、すべて入っているか");
  const noLayer = used.filter((s) => !W.LAYER_ORDER.includes(s));
  ok(noLayer.length === 0, "LAYER_ORDER が、すべての置き場所を持っている"
    + (noLayer.length ? "：" + noLayer.join(",") : ""));

  console.log("③ ★画面が、写しを持っていないか");
  const panel = readCode("components", "WardrobePanel.jsx");
  ok(!/const SLOT_LABELS\s*=/.test(panel), "★WardrobePanel が、名前の写しを持っていない");
  ok(!/const SLOT_DISPLAY_ORDER\s*=/.test(panel), "★並びの写しも、持っていない");
  ok(/SLOT_DISPLAY_ORDER/.test(panel) && /from "@\/lib\/sheepWardrobe"/.test(readRaw("components/WardrobePanel.jsx")),
    "lib から借りている");
  // ★ほかの画面も。
  ["components/CharacterHome.jsx", "components/SheepDressed.jsx"].forEach((f) => {
    ok(!/const SLOT_LABELS\s*=/.test(readCode(...f.split("/"))), f + " も、写しを持っていない");
  });

  console.log("④ いま着ているものが、すべての置き場所ぶん外せるか");
  const raw = readRaw("components/WardrobePanel.jsx");
  ok(/SLOT_DISPLAY_ORDER\.map\(\(slot\) =>/.test(raw), "★9つ ぜんぶを回している");
  ok(/\{slotLabel\(slot\)\}：\{it\.name\}/.test(raw), "名前も lib から取っている");

  console.log("⑤ レールに、4つが出るか（★ふだん着）");
  const daily = items.filter((i) => i.group === "daily");
  const rail = W.railSlotsWithItems(daily);
  ["top", "bottom", "outer", "eyes"].forEach((s) => {
    ok(rail.includes(s), "★" + W.SLOT_LABELS[s] + " の札が、ふだん着に出る（"
      + daily.filter((i) => i.slot === s).length + "点）");
  });

  console.log("⑥ ★絵が、そろっているか（★385点・全部）");
  // ★★2026-09-08、★i.file だけを見て「持ちもの47点の絵が無い」と申し上げました。
  //   ★★誤りでした。★持ちものは files（左・中・右の3枚）を使います。
  //     ★i.file は undefined ですが、★絵は3枚とも在りました。
  //   ★★見張りが、★同じ取り違えをしないようにします。
  //     ★file か files か、★どちらの形でも見ます。
  function imagePaths(it) {
    if (it && it.files) return Object.values(it.files);
    if (it && it.file) return [it.file];
    return [];
  }
  const noPath = items.filter((i) => imagePaths(i).length === 0);
  ok(noPath.length === 0, "★file も files も無い品が、1つも無い"
    + (noPath.length ? "：" + noPath.slice(0, 5).map((i) => i.key).join(",") : ""));
  let checked = 0;
  const gone = [];
  items.forEach((i) => imagePaths(i).forEach((f) => {
    checked++;
    if (!fs.existsSync(path.join(ROOT, "public/sheep", f))) gone.push(i.key + " → " + f);
  }));
  ok(gone.length === 0, "★" + items.length + "点／" + checked + "枚、すべて在る"
    + (gone.length ? "★無い：" + gone.slice(0, 5).join(", ") : ""));
  // ★★置き場所ごとにも、数えておきます。
  ["top", "bottom", "outer", "eyes", "prop"].forEach((s) => {
    const list = items.filter((i) => i.slot === s);
    const bad = list.filter((i) => imagePaths(i).some(
      (f) => !fs.existsSync(path.join(ROOT, "public/sheep", f))));
    ok(bad.length === 0, W.SLOT_LABELS[s] + " " + list.length + "点の絵が、そろっている");
  });
  // ★★持ちものは、★左・中・右の3枚そろっていること。
  //   ★1枚でも欠けると、★その向きに持ったときだけ消えます。
  const props = items.filter((i) => i.slot === "prop" && i.files);
  const halfProps = props.filter((i) => !(i.files.left && i.files.right && i.files.both));
  ok(halfProps.length === 0, "★3枚組の持ちもの " + props.length + "点が、左・中・右そろっている"
    + (halfProps.length ? "：" + halfProps.map((i) => i.key).join(",") : ""));

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
