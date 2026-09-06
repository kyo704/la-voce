// ============================================================================
// まだ使っていない荷物を、まちがって開いていないか（2026-09-06）
//
//   ★★坂本さんの決め：★166点と内装120点は、★4番を過ぎるまで開かない。
//     ★開いて public/sheep/ に混ぜると、
//     ★どちらが本物か分からなくなります。
//
//   ★★ただし、★足まわりの座標だけは、★もう使っています。
//     ★新しい靴12点は、★この座標に合わせて描かれています。
//     ★ここが変わると、★12点ぜんぶ描き直しになります。
//     ★★だから、★数字が動いたら、ここで止めます。
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  console.log("■ 荷物が、zip のまま置いてあるか");
  const packs = [
    ["assets/wardrobe-v2", "着せかえ166点"],
    ["assets/interior-v2", "内装120点"]
  ];
  for (const [dir, name] of packs) {
    const abs = path.join(ROOT, dir);
    ok(name + " の置き場がある", fs.existsSync(abs));
    if (!fs.existsSync(abs)) continue;
    const files = fs.readdirSync(abs);
    // ★★絵は、★zip の中にあること。★ほどいて置かないこと。
    //   ★仕様書（.md）は、★そのまま置いてよいことにしました。
    //     ★読むためのもので、★絵と混ざりません。
    const loose = files.filter((f) => !f.endsWith(".zip") && !f.endsWith(".md"));
    ok(name + " は zip のまま（絵をほどいていない）",
      files.some((f) => f.endsWith(".zip")) && loose.length === 0,
      "ほどかれているもの: " + (loose.join(", ") || "なし"));
    // ★念のため、★中に入れ子の置き場を作っていないことも見ます。
    const dirs = files.filter((f) => fs.statSync(path.join(abs, f)).isDirectory());
    ok(name + " の下に、置き場を作っていない", dirs.length === 0,
      dirs.join(", "));
  }
  ok("開かないでください、と書いてある",
    /開かないこと/.test(fs.readFileSync(path.join(ROOT, "assets/README.md"), "utf-8")));

  // ★★着せ替え画面のUI の仕様書も、★5番の段のものです。
  //   ★いまの画面を、★この仕様に合わせないこと。
  //   ★217点のまま画面だけ作り替えると、★実機で確かめている最中のものが
  //   ★動いてしまい、★どこで壊れたのか分からなくなります。
  ok("画面のUI の仕様書が、置いてある",
    fs.existsSync(path.join(ROOT,
      "assets/wardrobe-v2/lavoce-仕様-着せ替え画面のUI（9月6日）.md")));

  console.log("■ 絵が、いまの置き場に混ざっていないか");
  // ★166点の版だけにある名前。★これが public に在れば、開いて混ぜた印です。
  const live = path.join(ROOT, "public", "sheep", "items");
  const index = require(path.join(ROOT, "docs", "assets", "sheep-items-index.json"));
  // ★★一覧が指している絵を、★そのまま集めます。
  //   ★持ち物は _L / _R / _C の3枚あります。★鍵の名前＋.png ではありません。
  const known = new Set();
  for (const it of index.items) {
    if (it.file) known.add(path.basename(it.file));
    if (it.files) for (const v of Object.values(it.files)) known.add(path.basename(v));
  }
  const strays = fs.readdirSync(live).filter((f) => !known.has(f));
  ok("一覧に無い絵が、置き場に増えていない", strays.length === 0,
    strays.slice(0, 8).join(", "));
  ok("着せかえは、いまも217点", index.items.length === 217,
    "実際は " + index.items.length);
  // ★足の絵は使いません。★脚はコードで描いています。
  for (const f of ["foot_L.png", "foot_R.png", "foot_shadow_L.png", "foot_shadow_R.png"]) {
    ok("足の絵 " + f + " を、取りこんでいない", !fs.existsSync(path.join(live, f)));
  }

  console.log("■ 足まわりの座標が、仕様どおりか");
  const src = fs.readFileSync(path.join(ROOT, "lib", "sheepWardrobe.js"), "utf-8");
  const seg = src.slice(src.indexOf("export const LEGS"));
  const L = eval("(" + seg.slice(seg.indexOf("{"), seg.indexOf("});") + 1) + ")");
  // ★★v4 の仕様書の数字。★新しい靴12点が、これに合わせて描かれています。
  ok("足の中心x（左）が 421", L.leftX === 421, "実際は " + L.leftX);
  ok("足の中心x（右）が 601", L.rightX === 601, "実際は " + L.rightX);
  ok("足の下端が 1002", L.bottomY === 1002, "実際は " + L.bottomY);
  ok("足の幅が 114", L.footW === 114, "実際は " + L.footW);
  ok("接地線が 1006", L.groundY === 1006, "実際は " + L.groundY);

  console.log("■ 服の見た目を、脚のために動かしていないか");
  // ★★これが今日の失敗でした。★体を持ち上げて、★217点がぜんぶずれました。
  ok("体を、1ミリも持ち上げていない", L.lift === 0, "実際は " + L.lift);
  ok("脚のつけ根は、体（下端951）に隠れる", L.topY < 951, "実際は " + L.topY);
  ok("いまの靴8点を、動かしていない", L.shoeDy === 0, "実際は " + L.shoeDy);

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
