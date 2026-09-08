// ============================================================================
// 羊の しぐさ（第1段・2026-09-08 夜）
//
//   ★★守ること
//     ・★絵を 1枚も 増やさない（★CSS だけ）
//     ・★歩いている・すわっている・眠っている あいだは しない
//     ・★見えていないときは しない
//     ・★動きを 減らす設定の方には しない
//     ・★足もとを 動かさない（★床から 離れて 見えるため）
//     ・★体調にも 記録にも 関わらない
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "sheepGestures.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★しぐさ");
  ok("★4つ", m.GESTURES.length === 4);
  ok("★どれも 短い（〜2秒）", m.GESTURES.every((g) => g.ms > 0 && g.ms <= 2000));
  ok("★12〜25秒に1回",
    m.nextGestureMs(() => 0) === 12000 && m.nextGestureMs(() => 1) === 25000);
  ok("★2つ 続けて 同じは しない",
    m.pickGesture(["stretch"], () => 0).key !== "stretch");
  ok("★避けきれなくても、黙らない",
    m.pickGesture(m.GESTURES.map((g) => g.key), () => 0) !== null);

  console.log("■ ★するとき／しないとき");
  ok("★立ち止まっているとき だけ",
    m.mayGesture({ isWalking: false, isSitting: false, isLying: false }) === true);
  ok("★歩いているときは しない", m.mayGesture({ isWalking: true }) === false);
  ok("★すわっているときは しない", m.mayGesture({ isSitting: true }) === false);
  ok("★眠っているときは しない", m.mayGesture({ isLying: true }) === false);

  console.log("■ ★絵を 増やしていないこと");
  const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf-8");
  for (const g of m.GESTURES) {
    const name = "sheep" + g.key.charAt(0).toUpperCase() + g.key.slice(1);
    if (!css.includes("@keyframes " + name)) {
      failed++; console.log("  ✗ ★" + name + " の 動きが CSS に 無い");
    }
  }
  ok("★4つとも CSS に ある", true);
  // ★★足もとを 動かさないこと。
  ok("★★足もとを 動かさない（transform-origin: bottom center）",
    /\.sheep-gesture \{ transform-origin: bottom center; \}/.test(css));
  ok("★★動きを 減らす設定では しない",
    /\.sheep-gesture \{ animation: none !important; \}/.test(css));

  console.log("■ ★出し方");
  const ch = readCode("components", "CharacterHome.jsx");
  ok("★見えていないときは しない", /document\.hidden/.test(ch));
  ok("★離れたら 片づける", /clearTimeout\(t\); setGesture\(null\);/.test(ch));
  // ★★置き場所の transform と、★別の入れ物で かけること。
  //   ★同じ所に かけると、★translate(-50%,-100%) が 消えます。
  ok("★★置き場所の transform を 消していない",
    /className=\{gesture \? "sheep-gesture" : undefined\}/.test(ch));
  // ★★体調にも 記録にも 関わらないこと。
  ok("★★体調や 記録から しぐさを 決めていない",
    !/pickGesture\([^)]*(score|entries|condition|throat|voice)/.test(ch));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
