// ============================================================================
// 家具の置きかた ── 誤り①②の見張り（2026-09-08）
//
//   ★坂本さんのご報告「置きかたが、とてもむずかしい」
//
//   ★★誤り① 指に、品物が付いてこない
//     ★部屋に対する％を、★CSS の translate に渡していました。
//     ★★CSS の％は、★その要素じしんの大きさに対する割合です。
//       ★家具は部屋の22％なので、★指が10％動いても2.2％しか動きません。
//     ★★そのうえ、★離すと指の位置を保存していました。★だから跳びました。
//
//   ★★誤り② 一度動かすと、床から浮く
//     ★top が入ると、★床の線を見なくなっていました。
//
//   node components/tests/interior-drag.test.js
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
    .replace(/from\s+"@\/([^"]+)"/g, (m, r) => {
      const abs = path.join(ROOT, /\.[a-z]+$/.test(r) ? r : r + ".js");
      return `from "${pathToFileURL(abs).href}"`;
    })
    .replace(/import\s+(\w+)\s+from\s+"([^"]+\.json)";/g,
      (m, n, p2) => `const ${n} = JSON.parse(__fs.readFileSync(new URL("${p2}"), "utf8"));`);
  return import("data:text/javascript;base64," + Buffer.from('import __fs from "fs";\n' + src).toString("base64"));
}

(async () => {
  const M = await load("lib/sheepInteriorV2.js");
  const home = readCode("components", "CharacterHome.jsx");
  const layer = readCode("components", "InteriorLayer.jsx");
  const vt = readCode("components", "VocalTracker.jsx");

  console.log("① ★指に、1対1で付いてくるか");
  // ★★％の translate を、やめたこと。★これが誤りの本体でした。
  ok(!/translate\(\$\{l - 50\}%, \$\{t - 50\}%\)/.test(home),
    "★部屋の％を、CSS の translate に渡していない");
  ok(/translate\(\$\{px\}px, \$\{py\}px\)/.test(home), "★画素で動かしている");
  ok(/g\.w/.test(home) && /g\.h/.test(home), "★部屋の大きさを、掴んだときに覚えている");

  console.log("② ★見た目と、置かれる場所が、同じか");
  // ★★同じ関数から出すこと。★2つに分けると、また食い違います。
  ok(/function nextPos\(e\)/.test(home), "★行き先を出す関数が、1つある");
  ok((home.match(/nextPos\(e\)/g) || []).length >= 2, "★見た目も保存も、同じ関数を使う");
  ok(!/onDragEnd\(l, t\)/.test(home), "★指の位置を、そのまま保存していない");
  ok(/onDragEnd\(n\.left, n\.top\)/.test(home), "★もとの位置＋動かした分を、保存している");
  ok(/typeof startLeft === "number"/.test(home), "★もとの位置を、受け取っている");

  console.log("③ ★動かしていないなら、保存しない");
  ok(/Math\.abs\(n\.dx\) > 2 \|\| Math\.abs\(n\.dy\) > 2/.test(home),
    "★押しただけでは、位置を書き替えない");
  ok(/onPointerCancel=\{up\}/.test(home), "★途中でやめても、掴んだままにしない");

  console.log("④ ★床から、浮かないか");
  ok(Array.isArray(M.FLOOR_BAND) && M.FLOOR_BAND[0] >= 60, "床の帯がある（" + M.FLOOR_BAND.join("〜") + "）");
  ok(Array.isArray(M.WALL_BAND) && M.WALL_BAND[1] <= 66, "壁の帯がある（" + M.WALL_BAND.join("〜") + "）");
  ok(M.FLOOR_BAND[0] > M.WALL_BAND[1], "★床の帯と壁の帯が、重なっていない");
  ok(M.clampToBand(10, M.FLOOR_BAND) === M.FLOOR_BAND[0], "★天井へ落としても、床に戻す");
  ok(M.clampToBand(99, M.FLOOR_BAND) === M.FLOOR_BAND[1], "★下へ落としても、部屋の中に残す");
  ok(M.clampToBand(80, M.FLOOR_BAND) === 80, "帯の中は、そのまま");
  ok(M.clampToBand(null, M.FLOOR_BAND) === null, "無いものは、null のまま");
  ok(M.clampToBand("x", M.FLOOR_BAND) === null, "数でなければ、null");
  ok(/clampToBand\(s\.feet, FLOOR_BAND\)/.test(layer), "★床のものは、床の帯に収める");
  ok(/clampToBand\(.*WALL_BAND\)/.test(layer), "★壁のものは、壁の帯に収める");
  ok(/clampToBand\(s\.left \+ shift, LEFT_BAND\)/.test(layer), "★左右も、部屋の外へ出さない");
  ok(/bottomForFeet\(it, wpct, feet\)/.test(layer), "★足もとの高さから、置き場所を出している");

  console.log("⑤ ★縦の意味を、1つの欄に混ぜていないか");
  // ★★古い top は「浮いていた高さ」。★足もととして読み替えないこと。
  ok(/feet: p && typeof p\.feet === "number"/.test(layer), "★足もとは、別の欄で持つ");
  ok(!/feet: p && typeof p\.top/.test(layer), "★古い top を、足もとに読み替えていない");
  ok(/onWall \? "top" : "feet"/.test(layer), "★どちらの欄かを、渡している");
  ok(/topField = "top"/.test(vt), "★受け取る側も、欄を選べる");
  ok(/\.\.\.base,/.test(vt), "★古い値を、消していない");

  console.log("⑥ ★門の外の方には、1枚も出さないまま");
  ok(/if \(!wardrobeOn\) return null;/.test(readRaw("components/InteriorLayer.jsx")),
    "門の外では、新しい内装を出さない");

  console.log("⑦ ★遅れの大きさ（★直す前は、どれだけ動かなかったか）");
  // ★★22％の品物では、★指の10％に対して 2.2％。★4.5倍の遅れでした。
  const wpct = 22, finger = 10;
  ok(Math.abs(finger / (finger / 100 * wpct) - 4.5454) < 0.01,
    "★もとの作りでは、家具は4.5倍の遅れになる計算だった");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
