// ============================================================================
// 絵の 形 ── WebP を 先に、PNG に 戻せるように（2026-09-09）
//
//   ★★守ること
//     ・★PNG を 1枚も 消していないこと（★戻る先が 要ります）
//     ・★WebP が、★PNG と 同じだけ あること
//     ・★読めなかったら PNG に 戻ること（★1度だけ）
//     ・★画面で「.webp」と 書かないこと（★決めは lib に 1つ）
//     ・★一覧の 小さい絵は、★変えていないこと
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "imageFormat.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★みちすじ");
  ok("★png を webp に", m.webp("/sheep/items/a.png") === "/sheep/items/a.webp");
  ok("★webp を png に", m.png("/sheep/items/a.webp") === "/sheep/items/a.png");
  ok("★png 以外は そのまま", m.webp("/a.svg") === "/a.svg" && m.webp("") === "");
  ok("★null でも 落ちない", m.webp(null) === null && m.png(undefined) === undefined);

  console.log("■ ★絵が そろっていること");
  const dirs = ["", "face", "items", "cloth", "mask", "interior", "interior/tiles", "windowhole"];
  const lack = [];
  for (const d of dirs) {
    const dir = path.join(ROOT, "public", "sheep", d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".png")) continue;
      if (!fs.existsSync(path.join(dir, f.slice(0, -4) + ".webp"))) lack.push(d + "/" + f);
    }
  }
  ok(`★WebP が そろっている（★足りない ${lack.length}）`, lack.length === 0, lack.slice(0, 5).join(" "));
  // ★★PNG を 消していないこと。★戻る先が 無くなります。
  const items = fs.readdirSync(path.join(ROOT, "public", "sheep", "items"));
  ok("★★PNG を 消していない", items.filter((f) => f.endsWith(".png")).length > 400);
  // ★★一覧の 小さい絵は、変えていないこと。
  const thumbs = fs.readdirSync(path.join(ROOT, "public", "sheep", "thumbs"));
  ok("★一覧の 小さい絵は そのまま（★webp 0枚）",
    thumbs.filter((f) => f.endsWith(".webp")).length === 0);

  console.log("■ ★戻る道");
  ok("★1度だけ 戻す", /el\.dataset\.pngFallback/.test(src));
  const ci = readCode("components", "ClothImage.jsx");
  ok("★羊の絵に、戻る道が ある", /onError=\{painted \? undefined : fallbackToPng\}/.test(ci));
  const il = readCode("components", "InteriorLayer.jsx");
  ok("★内装の絵にも、戻る道が ある", /onError=\{fallbackToPng\}/.test(il));

  console.log("■ ★決めは lib に 1つ");
  for (const [name, code] of [["羊", readCode("components", "SheepDressed.jsx")],
                              ["内装", il], ["画面", readCode("components", "VocalTracker.jsx")]]) {
    ok(`★${name}に「.webp」と 書いていない`, !/\.webp/.test(code));
  }

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
