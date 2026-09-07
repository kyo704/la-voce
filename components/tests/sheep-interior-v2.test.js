// ============================================================================
// おうちの内装 120点 と、169通りの窓（2026-09-08）
//
//   ★出どころ zip の中の acnh/interior/README.md
//
//   ★★守ること
//     ・★120点、★1点も欠けていないこと
//     ・★窓は「枠」と「景色」の2枚。★13×13＝169通り
//     ・★重ね順は 景色 → 枠（★枠が上。逆にすると枠が隠れます）
//     ・★片方だけでも、成り立つこと
//     ・★大きさは5種類（★1024の1種類ではありません）
//     ・★新しい列を、作らないこと（character_equipped の中に持つ）
//     ・★いまの101点と、混ぜないこと（★鍵が1つも重なりません）
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
  const idx = JSON.parse(fs.readFileSync(
    path.join(ROOT, "docs", "assets", "sheep-interior-index.json"), "utf-8"));
  const src = fs.readFileSync(path.join(ROOT, "lib", "sheepInteriorV2.js"), "utf-8")
    .replace('import index from "@/docs/assets/sheep-interior-index.json";',
      "const index = " + JSON.stringify(idx) + ";");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ 120点、そろっていること");
  ok(`120点ある（いま ${m.INTERIOR_ITEMS.length}）`, m.INTERIOR_ITEMS.length === 120);
  ok("鍵に、重なりが無い",
    m.INTERIOR_ITEMS.length === new Set(m.INTERIOR_ITEMS.map((i) => i.key)).size);
  // ★★絵が、★1枚も欠けていないこと。★指しているのに無い、を作らない。
  const missing = m.INTERIOR_ITEMS.filter(
    (i) => !fs.existsSync(path.join(ROOT, "public", "sheep", i.file)));
  ok("指している絵が、全部ある", missing.length === 0, missing.slice(0, 5).map((i) => i.key).join(", "));

  console.log("■ 分類ごとの数（★README のとおり）");
  const want = { furniture: 27, showa: 19, window: 13, view: 13, door: 12, wallart: 13, garden: 14, tile: 9 };
  for (const [k, n] of Object.entries(want)) {
    const got = m.itemsByCategory(k).length;
    ok(`${m.categoryLabel(k)} が ${n}点（いま ${got}）`, got === n);
  }

  console.log("■ ★窓は、枠と景色の2枚（★169通り）");
  ok("枠13 × 景色13 ＝ 169", m.windowCombinationCount() === 169);
  // ★★重ね順。★景色 → 枠。★枠が上です。
  ok("★重ね順が 景色 → 枠", JSON.stringify(m.WINDOW_LAYER_ORDER) === JSON.stringify(["view", "window"]));
  const f = m.windowFrames()[0], v = m.windowViews()[0];
  const two = m.windowLayers({ window: f.key, view: v.key });
  ok("2枚 返る", two.length === 2);
  ok("★景色が先、枠があと", two[0].category === "view" && two[1].category === "window");
  // ★★2026-09-08、★決めが変わりました（坂本さんの決め）。
  //   ★もとは「片方だけでも出す」でした。
  //   ★★枠は 384×384、景色は 480×320 で、★縦横比が違います。
  //     ★片方だけ置くと、★大きさが合わず、おかしく見えます。
  //   ★★2枚そろって、はじめて1つの窓とします。
  ok("★枠だけでは、出さない", m.windowLayers({ window: f.key }).length === 0);
  ok("★景色だけでも、出さない", m.windowLayers({ view: v.key }).length === 0);
  ok("★2枚そろえば、出る", m.windowLayers({ window: f.key, view: v.key }).length === 2);
  ok("どちらも無ければ、空", m.windowLayers({}).length === 0);
  // ★★黙って出さないのではなく、★足りないほうを言えること。
  ok("★そろっているか、答えられる",
    m.windowReady({ window: f.key, view: v.key }) === true && m.windowReady({ window: f.key }) === false);
  ok("★どちらが足りないか、答えられる",
    m.windowMissing({ window: f.key }) === "view" && m.windowMissing({ view: v.key }) === "window");
  // ★★枠と景色は、縦横比が違うので、★同じ大きさで置けません。
  ok("★景色を、枠の内側に収める割合がある", typeof m.WINDOW_INNER_RATIO === "number");
  // ★★組み合わせの数を、画面に出さないこと（★数を見せない決め）。
  const libCode = readCode("lib", "sheepInteriorV2.js");
  ok("★169 を、文言として持っていない", !/"169|169通り/.test(libCode));

  console.log("■ 大きさが5種類（★1024の1種類ではない）");
  const sizes = new Set(m.INTERIOR_ITEMS.map((i) => i.size.join("x")));
  ok(`5種類ある（いま ${sizes.size}）`, sizes.size === 5, [...sizes].join(" / "));
  for (const s of ["320x320", "384x384", "320x512", "480x320", "256x256"]) {
    ok(`${s} がある`, sizes.has(s));
  }
  // ★★床の線は、★lib が1か所で持つこと。
  ok("★床の線を、lib が持っている", m.FLOOR_LINE_Y === 300);

  console.log("■ 置く・外す（★列を、作らない）");
  const fur = m.itemsByCategory("furniture")[0];
  const fur2 = m.itemsByCategory("furniture")[1];
  const w2 = m.windowFrames()[1];
  let e = {};
  e = m.toggleInterior(e, f);
  ok("窓枠が、置ける", m.isPlaced(e, f));
  e = m.toggleInterior(e, w2);
  ok("★1つだけの分類は、置き換わる", m.isPlaced(e, w2) && !m.isPlaced(e, f));
  e = m.toggleInterior(e, w2);
  ok("★同じものを押すと、外れる", !m.isPlaced(e, w2));
  e = m.toggleInterior(e, fur);
  e = m.toggleInterior(e, fur2);
  ok("★家具は、いくつでも置ける", m.isPlaced(e, fur) && m.isPlaced(e, fur2));
  // ★★元の入れ物を、書き替えないこと。
  const before = {};
  m.toggleInterior(before, fur);
  ok("★元の入れ物を、書き替えていない", Object.keys(before).length === 0);
  // ★★新しい列を、作らないこと。
  //   ★★2026-09-08、★注釈の中の character_equipped を探して落ちました。
  //     ★readCode は、★注釈を剥がします。★今日6度目の、同じ罠です。
  //   ★見るのは、★実際の形です。★equipped.interior に入れていること。
  ok("★equipped の中の interior に持っている", /equipped\.interior/.test(libCode));
  ok("★SQL を、作っていない", !/alter table/i.test(libCode));
  // ★★そのための SQL ファイルも、作っていないこと。
  const sqls = fs.readdirSync(path.join(ROOT, "supabase"))
    .filter((f) => /interior|内装|窓/.test(f));
  ok("★内装のための SQL が、無い", sqls.length === 0, sqls.join(", "));

  console.log("■ ★いまの101点と、混ぜていないこと");
  const character = fs.readFileSync(path.join(ROOT, "lib", "character.js"), "utf-8");
  const shopKeys = [...character.matchAll(/key: "([a-z_0-9]+)"/g)].map((x) => x[1]);
  const overlap = m.INTERIOR_ITEMS.filter((i) => shopKeys.includes(i.key));
  ok("★鍵が、1つも重なっていない", overlap.length === 0, overlap.slice(0, 5).map((i) => i.key).join(", "));

  console.log("■ 部屋に描く側（★2026-09-08）");
  {
    const layer = readCode("components", "InteriorLayer.jsx");
    const home = readCode("components", "CharacterHome.jsx");
    const panel = readCode("components", "InteriorPanel.jsx");
    const vt = readCode("components", "VocalTracker.jsx");

    // ★★門の外の方には、1枚も出さないこと。
    ok("★門の外では、1枚も出さない", /if \(!wardrobeOn\) return null;/.test(layer));
    ok("★部屋に置いている", /<InteriorLayer equipped=\{equipped\} wardrobeOn=\{wardrobeOn\}/.test(home));
    // ★★動かせること（★2026-09-08・坂本さんの決め）。
    //   ★いまの101点と、★同じ仕組み（onUpdatePosition）に乗せます。
    ok("★動かす仕組みに、乗せている", /onUpdatePosition=\{onUpdatePosition\}/.test(home));
    ok("★保存の形も、同じ", /onUpdatePosition\("interior", it\.key, nl, nt\)/.test(layer));
    ok("★置きかたを直すときだけ、動かせる", /editMode && Draggable && onUpdatePosition/.test(layer));
    ok("★部屋の外へ、出さない", /Math\.max\(4, Math\.min\(96/.test(home));

    // ★★窓は2枚。★決めは lib から取ること。
    ok("★窓の2枚を、lib から取っている", /windowLayers\(placed\)/.test(layer));
    ok("★重ね順を、画面で決めていない", !/["']view["']\s*,\s*["']window["']/.test(layer));

    // ★★大きさが5種類なので、★1つずつ高さを見ること。
    ok("★絵の高さから、置き場所を出している", /const \[w, h\] = size;/.test(layer));
    // ★★壁と床を、★別のところに敷くこと（★2026-09-08 の直し）。
    //   ★もとは部屋ぜんぶに敷いていて、★床の柄が壁まで変えていました。
    ok("★壁のタイルは、壁のところだけ", /wallTile && \(/.test(layer));
    ok("★床のタイルは、床のところだけ", /floorTile && \(/.test(layer));
    ok("★1枚で部屋ぜんぶを覆っていない", !/placed\.tile\b/.test(layer));
    ok("★壁と床を、lib が分けている", m.wallTiles().length === 5 && m.floorTiles().length === 4);
    ok("★床の線を、lib から取っている", /FLOOR_LINE_Y/.test(layer));

    // ★★いまの101点を、壊していないこと。
    ok("★いまの壁の絵は、そのまま", /<WallTexture material=\{wallKey\}/.test(home));
    ok("★いまの床の絵も、そのまま", /<FloorTexture material=\{floorKey\}/.test(home));
    ok("★いまのお店を、触っていない", /SHOP_ITEMS\.filter\(\(i\) => i\.category === shopCategory\)/.test(home));

    // ★★選ぶ画面。
    ok("★分類の札がある", /INTERIOR_CATEGORIES\.filter/.test(panel));
    ok("★中身のない分類は、出さない", /itemsByCategory\(c\.key\)\.length > 0/.test(panel));
    ok("★1つだけ置ける分類は、そう書いている", panel.includes("ひとつだけ置けます"));
    ok("★選んでいるものは、わくを太くしている", /\$\{on \? 3 : 1\}px solid/.test(panel));
    // ★★数を、書かないこと。
    for (const pat of [/[0-9０-９]{2,3}\s*点/, /あと\s*[0-9０-９{]/]) {
      ok(`★数を書いていない（${pat}）`, !pat.test(panel));
    }

    // ★★丸ごと入れないこと（★2026-09-08 の不具合の教訓）。
    const blk = vt.slice(vt.indexOf("<InteriorPanel"), vt.indexOf("<InteriorPanel") + 600);
    ok("★変えた1つだけを、いまの形に重ねている",
      /setCharacterEquipped\(\(prev\) => \(\{ \.\.\.prev, interior: next\.interior \}\)\)/.test(blk));
    ok("★丸ごと入れていない", !/setCharacterEquipped\(next\)/.test(blk));
    ok("★門の中だけに出している", /wardrobeOn && \(\s*<InteriorPanel/.test(vt));
  }

  console.log("■ ★荷物は、zip のまま");
  const packs = fs.readdirSync(path.join(ROOT, "assets", "interior-v2"));
  ok("★内装の zip が、開かれていない", packs.some((f) => f.endsWith(".zip")));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
