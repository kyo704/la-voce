// ============================================================================
// 重ね順（★2026-09-08・Opus の parts-v3 manifest）
//
//   ★★数の小さい順に描きます。★小さいほど、うしろです。
//     体0 ／ 上10 ／ 下20 ／ くつ30 ／ ながい上35 ／ 羽織り40
//     頭45 ／ 首元50 ／ 目元55 ／ かぶりもの60
//
//   ★★2026-09-08 まで、★固定の並び（LAYER_ORDER）で描いていました。
//     ★そこでは 下 → 上 の順で、★上が 下の前に来ていました。
//     ★実機で「うわぎが したぎの前に出る」とご報告をいただきました。
//
//   ★★羊も、★内装と同じ物差しに入れました。
//     ★もとは z=6 の決め打ちで、★窓（z=30）の後ろに隠れていました。
//
//   node components/tests/layer-z.test.js
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
  const V = await load("lib/sheepInteriorV2.js");

  console.log("① ★着るものの順（★Opus の決め）");
  const want = [["body", 0], ["top", 10], ["bottom", 20], ["shoes", 30],
                ["outer", 40], ["head", 45], ["neck", 50], ["eyes", 55], ["hat", 60]];
  want.forEach(([s, z]) => ok(W.slotZ(s) === z, s + " は " + z));
  // ★★これが、ご報告の中身です。
  ok(W.slotZ("top") < W.slotZ("bottom"), "★★上は、下より うしろ（★上10 ＜ 下20）");
  ok(W.slotZ("bottom") < W.slotZ("outer"), "下は、羽織りより うしろ");
  ok(W.slotZ("head") > W.slotZ("outer"), "頭は、羽織りより 手前");
  ok(W.slotZ("hat") > W.slotZ("head"), "かぶりものは、頭より 手前");
  ok(W.slotZ("そんな置き場所はない") === 50, "知らない置き場所でも、落ちない");

  console.log("② ★名簿の z を、使っているか");
  const items = I.SHEEP_ITEMS;
  const daily = items.filter((i) => i.group === "daily");
  ok(daily.every((i) => typeof i.z === "number"), "★ふだん着166点すべてに、z がある");
  // ★★「ながい上」は 35。★上（10）とは、別の値です。
  const longTops = daily.filter((i) => i.slot === "top" && i.z === 35);
  ok(longTops.length > 0, "★ながい上（z=35）が、ある（★" + longTops.length + "点）");
  const zs = [...new Set(daily.map((i) => i.z))].sort((a, b) => a - b);
  console.log("   （ふだん着の z：" + zs.join(", ") + "）");

  console.log("③ ★羊が、並べ替えているか");
  const sd = readCode("components", "SheepDressed.jsx");
  ok(/layers\.sort\(\(a, b\) => \(a\.z - b\.z\)\)/.test(sd), "★z で、並べ替えている");
  // ★★名簿には、★古い z（★1〜10 の別の物差し）が 残っています。
  //   ★かぶりもの74点のうち 61点が z=9 で、★帽子が 羊の後ろに隠れました。
  //   ★★だから、★新しい重ね順は zLayer に入れ、★そちらだけを見ます。
  ok(/typeof item\.zLayer === "number"/.test(sd), "★zLayer を、先に見ている");
  ok(!/typeof item\.z === "number"/.test(sd), "★★古い z を、読んでいない");
  ok(daily.every((i) => typeof i.zLayer === "number"), "★166点すべてに、zLayer がある");
  const hats = items.filter((i) => i.slot === "hat");
  ok(hats.filter((i) => i.z === 9).length > 0, "★古い z=9 の帽子が、名簿に残っている");
  ok(W.slotZ("hat") === 60, "★zLayer が無ければ、置き場所の既定（60）");
  ok(/slotZ\(slot\)/.test(sd), "★名簿に無ければ、置き場所の既定");
  ok(/z: slotZ\("body"\)/.test(sd) && /z: slotZ\("head"\)/.test(sd), "体と頭にも、z がある");

  console.log("④ ★羊と内装が、同じ物差しか");
  ok(V.SHEEP_Z_BAND === 70, "★羊は、床と同じ帯（70）");
  ok(V.zIndexOf(30, 0) < V.zIndexOf(70, 0), "★窓（30）より、羊（70）が 手前");
  ok(V.zIndexOf(70, 90) > V.zIndexOf(70, 20), "★同じ帯では、足もとが下のほうが 手前");
  ok(V.zIndexOf(70, 100) < V.zIndexOf(90, 0), "★床のものは、天井のものより うしろ");
  ok(V.sheepZIndex(66) === V.zIndexOf(70, 66), "羊も、同じ物差し");
  ok(V.zIndexOf(null, null) === 7000, "こわれた値でも、落ちない");
  const home = readCode("components", "CharacterHome.jsx");
  // ★★2026-09-09、★前後を「歩きの半ば」で 入れ替える形に しました。
  //   ★★足もとの y から 出すことは 変わりません。
  //     ★変わったのは「★いつ 入れ替えるか」だけです。
  //   ★y は 動き出す瞬間に 変わるのに、体は 3.2秒 かけて 進みます。
  //     ★だから 遅らせた y（zTop）から 出します。
  ok(/sheepZIndex\(zTop\)/.test(home), "★羊の重ね順を、足もとから出している");
  ok(/setZTop\(topPct\)/.test(home), "★遅らせているのは、足もとの y そのもの");
  ok(!/const frontZ = LAYER_CONFIG\.front\.z;$/m.test(home),
    "★★z=6 の決め打ちを、やめた");
  const layer = readCode("components", "InteriorLayer.jsx");
  ok(/zIndexOf\(zOf\(it\)/.test(layer), "★内装も、同じ物差し");
  ok(!/zIndex: 1,/.test(layer) && !/zIndex: 0,/.test(layer),
    "★決め打ちの z が、残っていない");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
