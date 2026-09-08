// ============================================================================
// 一覧の 小さい絵（2026-09-08 夜）
//
//   ★★「一覧が 遅い」への 答えです。
//     ★もとの絵は 1024×1024。★72px に描くために 100万画素を 展開していました。
//     ★小さい絵は 144×144（2万画素）です。
//
//   ★★守ること
//     ・★一覧は 小さい絵を 使うこと（★もとの絵を 直に 使わないこと）
//     ・★着ているときの絵は、★もとの絵の まま であること
//     ・★名簿に ある品は、★小さい絵も あること
//     ・★大きさは 1辺 144px であること
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "thumbs.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★数と みちすじ");
  ok("★1辺は 144px（★1マス72px の2倍）", m.THUMB_PX === 144);
  ok("★みちすじ", m.thumbSrc("hats_01") === "/sheep/thumbs/hats_01.png");
  ok("★持ちものは 置き場所つき",
    m.thumbSrc("propBook", "left") === "/sheep/thumbs/propBook__left.png");
  ok("★鍵が 無ければ null", m.thumbSrc(null) === null);

  console.log("■ ★絵が そろっていること");
  const dir = path.join(ROOT, "public", "sheep", "thumbs");
  const have = new Set(fs.readdirSync(dir).filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4)));
  const w = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "assets", "sheep-items-index.json"), "utf-8"));
  const wear = Array.isArray(w) ? w : w.items;
  const missing = [];
  for (const i of wear) {
    if (i.file && !have.has(i.key)) missing.push(i.key);
    for (const side of Object.keys(i.files || {})) {
      if (!have.has(i.key + "__" + side)) missing.push(i.key + "__" + side);
    }
  }
  const n = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "assets", "sheep-interior-index.json"), "utf-8"));
  for (const i of n.items) if (i.file && !have.has(i.key)) missing.push(i.key);
  ok(`★名簿の品すべてに 小さい絵がある（★いま ${have.size} 枚）`,
    missing.length === 0, missing.slice(0, 6).join(" "));

  console.log("■ ★使い分け");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★一覧は 小さい絵を 使う", /srcOf=\{\(it\) => thumbSrc\(/.test(vt));
  ok("★無いときの 戻り先が ある", /fallbackSrcOf=\{\(it\) =>/.test(vt));
  // ★★着ているときの絵は、★もとの絵の ままであること。
  //   ★羊の重ねに、★小さい絵を 使わないこと。
  const sd = readCode("components", "SheepDressed.jsx");
  ok("★★羊が着る絵に、小さい絵を 使っていない", !/thumbs/.test(sd) && !/thumbSrc/.test(sd));
  const ch = readCode("components", "CharacterHome.jsx");
  ok("★★部屋の絵にも、小さい絵を 使っていない", !/thumbSrc/.test(ch));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
