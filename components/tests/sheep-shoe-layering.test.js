// ============================================================================
// 靴が、脚に隠れていないか（2026-09-06）
//
//   ★★この試験は、★本物の SheepDressed を描かせて確かめます。
//     ★コードを読んで「たぶん前に出る」と判じるのでは、足りませんでした。
//     ★実際、★軸を直したあとも、★靴は隠れたままでした。
//     ★★原因は別で、★重なりの順でした。
//       ★靴を脚の絵の中(z=0)へ移していたが、
//       ★体と服の束は、★その上(z=1)にある。
//       ★体の絵は 490〜951 が不透明、★靴は 844〜976。
//       ★だから靴のほとんどが、★体に塗りつぶされていた。
//
//   ★★だから、★描いた結果を見ます。
// ============================================================================

const fs = require("fs"), path = require("path"), Module = require("module");
const babel = require("next/dist/compiled/babel/core");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

// ★"@/..." を、本物のファイルに向けます。★差し替えはしません。
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (req, ...rest) {
  if (req.startsWith("@/")) {
    const p = path.join(ROOT, req.slice(2));
    for (const ext of ["", ".js", ".jsx", ".json"]) {
      if (fs.existsSync(p + ext) && fs.statSync(p + ext).isFile()) return p + ext;
    }
  }
  return origResolve.call(this, req, ...rest);
};
for (const ext of [".jsx", ".js"]) {
  const prev = require.extensions[ext];
  require.extensions[ext] = function (m, filename) {
    if (filename.includes("node_modules")) return prev(m, filename);
    const out = babel.transformSync(fs.readFileSync(filename, "utf-8"), {
      filename, babelrc: false, configFile: false,
      presets: [[require.resolve("next/dist/compiled/babel/preset-react"),
                 { runtime: "automatic" }]],
      plugins: [require.resolve("next/dist/compiled/babel/plugin-transform-modules-commonjs")]
    }).code;
    m._compile(out, filename);
  };
}

const Sheep = require(path.join(ROOT, "components/SheepDressed.jsx")).default;
const draw = (wearing, motion) => renderToStaticMarkup(
  React.createElement(Sheep, { wearing, size: 220, motion: motion || "walk" }));

console.log("■ 靴が、体より前に出ているか");
// ★本物の靴で試します。★8点ぜんぶ。
const shoes = require(path.join(ROOT, "docs/assets/sheep-items-index.json"))
  .items.filter((i) => i.slot === "shoes");
ok("靴は20点ある", shoes.length === 20, "実際は " + shoes.length);
const behind = [];
for (const sh of shoes) {
  const html = draw({ shoes: sh.key, garment: "coatWinterDuffle" });
  const iShoe = html.indexOf(sh.key + ".png");
  const iBody = html.indexOf("sheep_body.png");
  const iHead = html.indexOf("sheep_head.png");
  if (iShoe < 0 || iShoe < iBody || iShoe < iHead) {
    behind.push(sh.key + "（靴 " + iShoe + " / 体 " + iBody + " / 頭 " + iHead + "）");
  }
}
ok("20点とも、体と頭より前に描かれている", behind.length === 0,
  behind.join("\n      "));

console.log("■ 脚は、体より後ろか");
{
  const html = draw({ garment: "coatWinterDuffle" });
  // ★脚の絵（rect）は、★体の絵より先に出てくること＝後ろに描かれる。
  const iLeg = html.indexOf("<rect");
  const iBody = html.indexOf("sheep_body.png");
  ok("脚は、体より先に描かれている（＝後ろ）", iLeg >= 0 && iLeg < iBody,
    "脚 " + iLeg + " / 体 " + iBody);
}

console.log("■ 靴を履いたら、はだしの足を出さないか");
{
  const shod = draw({ shoes: "shoesBoots" });
  const bare = draw({});
  ok("はだしのときは、ひづめがある", /<ellipse/.test(bare));
  ok("靴のときは、ひづめを描かない", !/<ellipse/.test(shod));
}

console.log("■ 切り抜きの名前が、重なっていないか");
{
  const html = draw({ shoes: "shoesBoots" });
  const ids = [...html.matchAll(/<clipPath id="([^"]+)"/g)].map((x) => x[1]);
  ok("同じ名前を、2回定義していない", ids.length === new Set(ids).size,
    ids.join(", "));
  ok("左右ぶん、2つある", ids.length === 2, ids.join(", "));
}

console.log("■ 脚と靴が、同じ軸で回っているか");
{
  const html = draw({ shoes: "shoesBoots" });
  // ★体のはずみにも軸があります（50% 92%）。★脚のぶんだけ拾います。
  const origins = [...html.matchAll(/transform-origin:\s*([^;"]+)/g)]
    .map((x) => x[1].trim()).filter((v) => v.includes("px"));
  // ★左右2本 × （脚・靴）＝ 4つ。★左は左どうし、右は右どうし、同じであること。
  ok("軸は4つ（脚2・靴2）", origins.length === 4, origins.join(" / "));
  ok("左の脚と左の靴が、同じ軸", origins[0] === origins[2], origins.join(" / "));
  ok("右の脚と右の靴が、同じ軸", origins[1] === origins[3], origins.join(" / "));
  ok("かたまりの箱を軸にしていない", !/fill-box/.test(html));
}

console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
process.exit(failed === 0 ? 0 : 1);
