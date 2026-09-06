// ============================================================================
// 着せ替え画面のUI ── 第1段（シート）と第3段（コーデ）
//
//   出どころ assets/wardrobe-v2/lavoce-仕様-着せ替え画面のUI（9月6日）.md
//
//   ★★§0 の「いまの問題」を、直せているかを見ます。
//     ① 一覧が羊を隠している　　→ シートにした
//     ③ 前の組み合わせに戻せない → コーデを保存できるようにした
//
//   ★★仕様書 §12 の「やってはいけないこと」も見ます。
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "wardrobeOutfits.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ シートの高さ（§2）");
  ok("3段ある", m.SHEET_SNAPS.length === 3);
  ok("既定は「半分」", m.SHEET_DEFAULT === "half");
  // ★★いちばん上げても、全画面にしないこと。★羊が隠れます。
  const highest = Math.min(...m.SHEET_SNAPS.map((s) => s.topPct));
  ok("いちばん上げても、上に場所が残る（0%にしない）", highest > 20,
    "いちばん上 " + highest + "%");
  ok("いちばん下げると、羊が全部見える", Math.max(...m.SHEET_SNAPS.map((s) => s.topPct)) >= 80);
  console.log("■ 吸い付き");
  ok("60% は「半分」に吸い付く", m.nearestSnap(60).key === "half");
  ok("95% は「少しだけ」に吸い付く", m.nearestSnap(95).key === "peek");
  ok("10% は「全部」に吸い付く", m.nearestSnap(10).key === "full");

  console.log("■ コーデ（§6）");
  ok("上限は20", m.OUTFIT_LIMIT === 20);
  const full = Array.from({ length: 20 }, (_, i) => ({ id: String(i), worn: { hat: "h" } }));
  const res = m.addOutfit(full, { id: "new", worn: { hat: "x" } });
  ok("いっぱいなら、足せない", res.ok === false);
  // ★★ここが、いちばん大事です。★古いものを黙って落とさないこと。
  ok("★いっぱいでも、1着も消えない", res.list.length === 20,
    "実際は " + res.list.length);
  ok("同じ中身が返る", res.list[0].id === "0" && res.list[19].id === "19");
  ok("「消してください」と伝える", /消してください/.test(res.message));
  ok("あと何着かが分かる", m.outfitsLeft(full) === 0 && m.outfitsLeft([]) === 20);

  console.log("■ 保存する中身");
  const w = { garment: "g", hat: "h", propSide: "L", ないもの: "x", nested: { a: 1 } };
  const saved = m.wornForSave(w);
  ok("知らない鍵を、持たない", !("ないもの" in saved) && !("nested" in saved));
  ok("置き場所は持つ", saved.garment === "g" && saved.hat === "h" && saved.propSide === "L");
  ok("何も着ていなければ、保存しない",
    m.addOutfit([], { id: "a", worn: { propSide: "L" } }).ok === false);
  // ★★着替えるときは、まるごと置きかえること。★混ぜると前の帽子が残ります。
  ok("呼び戻しは、まるごと置きかえ",
    Object.keys(m.outfitToWearing({ worn: { hat: "h" } })).join() === "hat");

  console.log("■ 時計と乱数を、lib の中で引いていないか");
  // ★★引くと、★試験で確かめられなくなります。★呼ぶ側が渡します。
  const code = readCode("lib", "wardrobeOutfits.js");
  ok("Date を使っていない", !/new Date\(|Date\.now\(/.test(code));
  ok("乱数を使っていない", !/Math\.random|randomUUID/.test(code));

  console.log("■ 画面（§12 やってはいけないこと）");
  const panel = readCode("components", "WardrobePanel.jsx");
  const sheet = readCode("components", "WardrobeSheet.jsx");
  ok("一覧を、シートに入れている", /WardrobeSheet/.test(panel));
  ok("羊は、シートの外（上）に出している", /header=\{sheep\}/.test(panel));
  // ★★数を、画面に書き写さないこと。★2か所になります。
  ok("上限20を、画面に書いていない", !/\b20\b/.test(panel.replace(/OUTFIT_[A-Z_]+/g, "")));
  ok("「消してください」を、画面に書いていない", !/消してください/.test(panel));
  ok("高さの数字を、画面に書いていない", !/\b(83|56|30)\b/.test(sheet.replace(/SHEET_SNAPS\[\d\]/g, "")));
  // ★★急かさないこと。
  ok("急かす言葉がない", !/残り\d|今だけ|お急ぎ|あと\d+日/.test(panel));
  // ★★出口のない画面を作らないこと。
  ok("閉じられる", /onClose/.test(sheet) && /aria-label="着せかえを閉じる"/.test(sheet));
  ok("Esc でも閉じられる", /Escape/.test(sheet));
  // ★★おすすめを自動で作らないこと（★自律性を削ります）。
  ok("おすすめを自動で作っていない", !/recommend|おすすめ|自動でコーデ/.test(panel));

  console.log("■ 実際に描いて、羊が隠れていないか");
  // ★★読むだけでは足りません。★今日、それで2度まちがえました。
  //   ★本物を描かせて、★シートの上端と、羊の場所を見ます。
  {
    const Module = require("module");
    const babel = require("next/dist/compiled/babel/core");
    const React = require("react");
    const { renderToStaticMarkup } = require("react-dom/server");
    const orig = Module._resolveFilename;
    Module._resolveFilename = function (req, ...rest) {
      if (req.startsWith("@/")) {
        const p2 = path.join(ROOT, req.slice(2));
        for (const ext of ["", ".js", ".jsx", ".json"]) {
          if (fs.existsSync(p2 + ext) && fs.statSync(p2 + ext).isFile()) return p2 + ext;
        }
      }
      return orig.call(this, req, ...rest);
    };
    for (const ext of [".jsx", ".js"]) {
      const prev = require.extensions[ext];
      require.extensions[ext] = function (mod, filename) {
        if (filename.includes("node_modules")) return prev(mod, filename);
        mod._compile(babel.transformSync(fs.readFileSync(filename, "utf-8"), {
          filename, babelrc: false, configFile: false,
          presets: [[require.resolve("next/dist/compiled/babel/preset-react"),
                     { runtime: "automatic" }]],
          plugins: [require.resolve("next/dist/compiled/babel/plugin-transform-modules-commonjs")]
        }).code, filename);
      };
    }
    const Sheet = require(path.join(ROOT, "components/WardrobeSheet.jsx")).default;
    const html = renderToStaticMarkup(React.createElement(
      Sheet,
      {
        header: React.createElement("div", { id: "sheep-here" }, "羊"),
        onClose: () => {}
      },
      React.createElement("div", null, "一覧")
    ));
    ok("羊の場所が、描かれている", /sheep-here/.test(html));
    // ★シートの上端が、0% ではないこと（★全画面にしない）。
    const tops = [...html.matchAll(/top:\s*([0-9.]+)%/g)].map((x) => Number(x[1]));
    ok("シートの上端が 0% ではない", tops.length > 0 && Math.min(...tops) > 0,
      "見つかった top: " + tops.join(", "));
    // ★羊の場所が、シートより前に出ていること（★HTML の順＝下が上に来る）。
    ok("羊が、シートより先に描かれている（後ろ）",
      html.indexOf("sheep-here") < html.lastIndexOf("borderTopLeftRadius") ||
      html.indexOf("sheep-here") < html.indexOf("一覧"));
    ok("閉じるボタンがある", /aria-label="着せかえを閉じる"/.test(html));
  }

  console.log("■ 保存先");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("character_equipped の中に入れている", /outfits: nextOutfits/.test(vt));
  ok("いま着ているものとは、別の鍵", /\.\.\.characterEquipped, outfits:/.test(vt));
  ok("失敗したら、黙らない", /着せ方を保存できませんでした/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
