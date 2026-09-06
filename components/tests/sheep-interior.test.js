// ============================================================================
// おうちの内装（壁・床のタイル）— 2026-09-06
//
//   ★★確かめること
//     ・★index が指す絵が、★すべて public に在ること
//       （★無い絵を指したまま出すと、★壁が白く抜けます）
//     ・★絵の無い材質は、★null が返ること
//       ★★これまでの色塗りが、★そのまま生き続けるためです。
//       ★取り上げません。
//     ・★動きの名前が、★動きごとに分かれていること
//       ★★分けないと、★画面に2匹いるとき、★片方の定義が消えます。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  // ★★"@/" は、Next のときだけ通る書き方です。★ここでは通りません。
  //   ★だから、★一覧をその場に埋めてから読みます。
  //   ★★写しを作らないこと。★読むのは、本物の JSON です。
  const json = fs.readFileSync(
    path.join(ROOT, "docs", "assets", "sheep-tiles-index.json"), "utf-8");
  const src = fs.readFileSync(path.join(ROOT, "lib", "sheepInterior.js"), "utf-8")
    .replace(
      'import tiles from "@/docs/assets/sheep-tiles-index.json";',
      "const tiles = " + json + ";"
    );
  if (/^import /m.test(src)) {
    console.log("  ✗ 読み込みの行が、思っていた形と違います");
    process.exit(1);
  }
  const mod = await import(
    "data:text/javascript;base64," + Buffer.from(src).toString("base64")
  );

  console.log("■ タイルの絵が、そろっているか");
  const walls = mod.wallTiles();
  const floors = mod.floorTiles();
  ok("壁が10種ある", walls.length === 10, "実際は " + walls.length);
  ok("返ってくるのは、鍵の名前", walls.every((k) => typeof k === "string"));
  ok("見せる名前は tileName が持つ", typeof mod.tileName(walls[0]) === "string");
  ok("床が9種ある", floors.length === 9, "実際は " + floors.length);

  const missing = [];
  for (const key of walls.concat(floors)) {
    const style = mod.tileStyle(key);
    const m = /url\("([^"]+)"\)/.exec(style.backgroundImage);
    if (!m) { missing.push(key + "（url が読めません）"); continue; }
    if (!fs.existsSync(path.join(ROOT, "public", m[1].replace(/^\//, "")))) {
      missing.push(key + " → " + m[1]);
    }
  }
  ok("指している絵が、すべて在る", missing.length === 0, missing.join("\n      "));

  console.log("■ 絵の無い材質を、取り上げていないか");
  // ★これまでの色だけの材質。★絵はまだありません。
  ok("wall_washi は null（色塗りのまま）", mod.tileFor("wall_washi") === null);
  ok("floor_default は null（色塗りのまま）", mod.tileFor("floor_default") === null);
  ok("知らない名前も null", mod.tileFor("wall_ないもの") === null);
  ok("null のときは style も null", mod.tileStyle("wall_washi") === null);

  console.log("■ 敷きつめる形になっているか");
  const st = mod.tileStyle(walls[0], { sizePx: 96 });
  ok("くり返す", st.backgroundRepeat === "repeat");
  ok("大きさを指定している", st.backgroundSize === "96px 96px", st.backgroundSize);

  console.log("■ 画面に2匹いても、動きが消えないか");
  const dressed = readRaw("components", "SheepDressed.jsx");
  // ★動きの名前に motion が混ざっていること。★混ざっていないと、
  //   ★あとから描かれたほうの定義が、★先のものを上書きします。
  const bareBob = /@keyframes sheepBob(?!\$\{motion\})/.test(dressed);
  const bareTravel = /@keyframes sheepTravel(?!\$\{motion\})/.test(dressed);
  ok("はずみの名前に、動きが混ざっている", !bareBob);
  ok("歩く道のりの名前に、動きが混ざっている", !bareTravel);

  console.log("■ 内装が、おうちの画面につながっているか");
  const home = readRaw("components", "CharacterHome.jsx");
  ok("壁と床が tileStyle を呼んでいる",
    (home.match(/tileStyle\(/g) || []).length >= 2);
  ok("着せかえの羊を出している", /<SheepDressed/.test(home));
  // ★★門の判定は、★VocalTracker に1つだけ。★ここでは判定しません。
  ok("おうちの画面が、門を自分で判定していない", !/mayUseWardrobe/.test(home));

  // ★★門が閉じている方には、★内装を出しません（2026-09-06）。
  //   ★まだ坂本さんだけにお見せしています。
  //   ★★店に並べて、敷けない、を作らないこと。
  const calls = (home.match(/tileStyle\(/g) || []).length;
  const gated = (home.match(/wardrobeOn (\? tileStyle|&& tileStyle)/g) || []).length;
  ok("タイルを出すところは、すべて門の内側", calls === gated,
    "呼ぶ回数 " + calls + " ／ 門の内側 " + gated);
  ok("店にも、門の内側でだけ並べる", /wardrobeOn \|\| !isNewMaterial/.test(home));

  console.log("■ もとからある品を、取り上げていないか");
  ok("american は、新しいものに数えない",
    !mod.isNewMaterial("wall_american") && !mod.isNewMaterial("floor_american"));
  ok("新しいのは17点", mod.NEW_MATERIAL_KEYS.length === 17,
    "実際は " + mod.NEW_MATERIAL_KEYS.length);

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件、直してください");
  process.exit(failed === 0 ? 0 : 1);
})();
