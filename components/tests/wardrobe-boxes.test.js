// ============================================================================
// よそおいの3つの箱（2026-09-07）
//
//   ★出どころ docs/opus/woolsong-裁定-219点の分け方と、追加38項目の安全性（9月7日・夜）.md §6
//
//   ★★§6 がCodeに求めていること
//     ③ ★box=2 と box=3 が1点も重ならないこと
//     ④ ★box=1 に購入経路が存在しないこと
//     ⑤ ★どの箱かを、1か所で持つこと（画面ごとに書かない）
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
  // ★lib は @/ を使うので、そのままは読み込めません。★書き換えて読みます。
  const src = fs.readFileSync(path.join(ROOT, "lib", "wardrobeBoxes.js"), "utf-8")
    .replace('import { UNLOCKS } from "@/lib/sheepWardrobe";',
      "const UNLOCKS = " + JSON.stringify(
        (() => {
          const w = fs.readFileSync(path.join(ROOT, "lib", "sheepWardrobe.js"), "utf-8");
          const m = w.slice(w.indexOf("export const UNLOCKS"));
          const body = m.slice(m.indexOf("{"), m.indexOf("});") + 1);
          // ★鍵の名前だけを拾います。★評価はしません。
          const out = {};
          for (const line of body.split("\n")) {
            const mm = line.match(/^\s*([A-Za-z0-9_]+):\s*\[([^\]]*)\]/);
            if (mm) out[mm[1]] = mm[2].split(",").map((x) => x.trim().replace(/^"|"$/g, "")).filter(Boolean);
          }
          return out;
        })()
      ) + ";");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  const impl = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "assets", "sheep-items-index.json"), "utf-8")).items;
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "opus", "items.json"), "utf-8"));
  const byKey = {};
  cat.forEach((i) => { byKey[i.key] = i; });

  console.log("■ ⑤ どの箱かを、1か所で持っている");
  ok("箱の判定は lib/wardrobeBoxes.js だけにある", typeof m.boxOf === "function");
  // ★画面が、theme を見て自分で判定していないこと
  for (const f of ["WardrobePanel.jsx", "CharacterHome.jsx", "VocalTracker.jsx"]) {
    const code = readCode("components", f);
    ok(`${f} が theme で箱を決めていない`,
      !/theme\s*===\s*"(opera|stage)"/.test(code));
  }

  console.log("■ ③ 箱2と箱3が、1点も重ならない");
  const boxes = impl.map((i) => ({ key: i.key, box: m.boxOf(i, byKey[i.key]) }));
  const b2 = new Set(boxes.filter((x) => x.box === 2).map((x) => x.key));
  const b3 = new Set(boxes.filter((x) => x.box === 3).map((x) => x.key));
  const both = [...b2].filter((k) => b3.has(k));
  ok("重なりが無い", both.length === 0, both.join(", "));
  // ★★どの品も、必ずどれか1つの箱に入ること（数え落としを見つけます）。
  const noBox = boxes.filter((x) => ![1, 2, 3].includes(x.box));
  ok("箱の無い品が無い", noBox.length === 0, noBox.map((x) => x.key).join(", "));

  console.log("■ ④ 箱1に、買う道が無い");
  const b1 = boxes.filter((x) => x.box === 1).map((x) => x.key);
  ok("箱1が空ではない", b1.length > 0, "箱1: " + b1.length + "点");
  ok("箱1のものは、お金で買えない",
    b1.every((k) => !m.mayBuyWithMoney({ key: k }, byKey[k])));
  ok("箱1のものは、ポイントでも交換できない",
    b1.every((k) => !m.mayExchangeWithPoints({ key: k }, byKey[k])));
  // ★★達成で開く5点が、★theme に関わらず箱1であること。
  //   ★propMetronome は theme が "work" です。★theme だけで数えると漏れます。
  for (const k of m.unlockKeys()) {
    ok(`達成で開く「${k}」が箱1にある`, m.boxOf({ key: k }, byKey[k]) === 1);
  }

  console.log("■ 箱2は、いま空です（★zip を開けるまで作れません）");
  ok("箱2の一覧が空である", m.BOX2_KEYS.length === 0);
  // ★★空である理由が、★ファイルに書いてあること。
  //   ★理由の無い空欄は、★あとで「埋め忘れ」として埋められます。
  const raw = fs.readFileSync(path.join(ROOT, "lib", "wardrobeBoxes.js"), "utf-8");
  ok("空である理由が書いてある", /zip/.test(raw) && /top が0点/.test(raw));
  // ★★足りないことを、数で確かめます。★§3 の最低数に届かないこと。
  const MIN = { top: 15, bottom: 10, outer: 8, shoes: 6, hat: 12, neck: 4, hold: 8, eyes: 2, set: 5 };
  const have = {};
  impl.forEach((i) => { const c = byKey[i.key]; if (c) have[c.slot] = (have[c.slot] || 0) + 1; });
  const short = Object.keys(MIN).filter((k) => (have[k] || 0) < MIN[k]);
  ok("いまの品では、§3 の最低数に届かない（だから空でよい）", short.length > 0,
    "足りない部位: " + short.join(", "));

  console.log("■ 数を、出さない");
  // ★「あと13ポイント」を、どこにも出さないこと（坂本さんの決め・2026-09-07）。
  ok("配り方の言葉に、数字が入っていない",
    Object.values(m.DELIVERY_LINES).every((line) => !/[0-9０-９]/.test(line)));
  const vt = readCode("components", "VocalTracker.jsx");
  const wp = readCode("components", "WardrobePanel.jsx");
  for (const bad of ["あとポイント", "残りポイント", "まであと"]) {
    ok(`「${bad}」が画面に無い`, !vt.includes(bad) && !wp.includes(bad));
  }
  // ★★ポイントで、あと何点で買えるか、を出していないこと。
  ok("「あと◯ポイントで受け取れます」の形が無い",
    !/あと\s*\{[^}]*\}\s*ポイント/.test(vt) && !/ポイントで.{0,6}受け取れます/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
