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
  // ★★2026-09-08（夕）、★決めが また変わりました（坂本さんの決め）。
  //   ★もとは「2枚そろわなければ、1枚も出さない」でした。
  //   ★★片方だけ選ぶと、★窓が消えます。★壁に穴が空いたように見えます。
  //   ★★だから、★いつも1組にします。★選んでいないほうは、既定で埋めます。
  ok("★枠だけでも、1組 出る", m.windowLayers({ window: f.key }).length === 2);
  ok("★景色だけでも、1組 出る", m.windowLayers({ view: v.key }).length === 2);
  ok("★2枚そろえば、そのまま出る", m.windowLayers({ window: f.key, view: v.key }).length === 2);
  ok("★何も選んでいなくても、既定の窓が出る", m.windowLayers({}).length === 2);
  ok("★既定が、名簿に在る",
    !!m.interiorItemByKey(m.DEFAULT_WINDOW) && !!m.interiorItemByKey(m.DEFAULT_VIEW));
  ok("★選んだほうは、既定に上書きされない",
    m.windowLayers({ window: f.key })[1].key === f.key);
  ok("★いつも そろっている", m.windowReady({}) === true && m.windowReady({ window: f.key }) === true);
  // ★★いま出ている窓が、何かを言えること（★画面の印に使います）。
  ok("★いま出ている窓を、答えられる",
    m.currentWindow({}).window === m.DEFAULT_WINDOW
    && m.currentWindow({ view: v.key }).view === v.key);
  // ★★枠と景色は、縦横比が違うので、★同じ大きさで置けません。
  // ★★2026-09-08（夕）、★「割合を1つ」をやめました。
  //   ★13枚の穴を実測したら、★どれも違いました。
  //     ふつう 0.805〜0.867 ／ window_09 0.617 ／ window_11 高さ 0.302
  //   ★★「枠と景色が、まるで合っていない」というご指摘の、そのものでした。
  ok("★13枚すべてに、穴の場所が入っている",
    m.windowFrames().every((f) => Array.isArray(f.hole) && f.hole.length === 4));
  ok("★穴は、割合で持っている（0〜1）",
    m.windowFrames().every((f) => f.hole.every((v) => v >= 0 && v <= 1)));
  ok("★穴が、枠からはみ出していない",
    m.windowFrames().every((f) => f.hole[0] + f.hole[2] <= 1.0001 && f.hole[1] + f.hole[3] <= 1.0001));
  // ★★1つの割合では合わないこと自体を、見張ります。
  const ws = m.windowFrames().map((f) => f.hole[2]);
  const hs = m.windowFrames().map((f) => f.hole[3]);
  ok(Math.max(...ws) - Math.min(...ws) > 0.2, "★枠によって、穴の幅が大きく違う（★" +
    Math.min(...ws).toFixed(3) + "〜" + Math.max(...ws).toFixed(3) + "）");
  ok(Math.max(...hs) - Math.min(...hs) > 0.4, "★高さは、もっと違う（★" +
    Math.min(...hs).toFixed(3) + "〜" + Math.max(...hs).toFixed(3) + "）");
  ok(m.windowHole(m.interiorItemByKey("window_11"))[3] < 0.4,
    "★window_11 は、低くて横長の穴");
  ok(m.windowHole(null)[2] === 0.82, "★分からない枠でも、まん中に置く（★消さない）");
  ok(m.isFrostedWindow(m.interiorItemByKey("window_10")) === true,
    "★window_10 は、すりガラス（★穴ではない）");
  ok(m.isFrostedWindow(m.interiorItemByKey("window_01")) === false, "ふつうの枠は、違う");
  // ★★組み合わせの数を、画面に出さないこと（★数を見せない決め）。
  const libCode = readCode("lib", "sheepInteriorV2.js");
  ok("★169 を、文言として持っていない", !/"169|169通り/.test(libCode));

  console.log("■ 大きさ（★1024の1種類ではない）");
  const sizes = new Set(m.INTERIOR_ITEMS.map((i) => i.size.join("x")));
  // ★★2026-09-08、★窓の外が 480×320 → ★384×384 になりました。
  //   ★★まど枠と、同じ寸法です。★前は ずれていました（★荷物の note）。
  //   ★だから、★4種類になりました。
  ok(`4種類ある（いま ${sizes.size}）`, sizes.size === 4, [...sizes].join(" / "));
  for (const s of ["320x320", "384x384", "320x512", "256x256"]) {
    ok(`${s} がある`, sizes.has(s));
  }
  ok("★窓の外が、まど枠と同じ寸法になった", !sizes.has("480x320"));
  ok("★まど枠と、窓の外が、同じ大きさ",
    m.windowFrames()[0].size.join("x") === m.windowViews()[0].size.join("x"));
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
    // ★★2026-09-08、★縦の欄を2つに分けました。
    //   ★"top"  … 壁のものの、上端
    //   ★"feet" … 床のものの、足もと
    //   ★1つの欄に両方を入れると、★意味が割れます（★古い top は「浮いていた高さ」）。
    ok("★保存の形も、同じ", /onUpdatePosition\("interior", it\.key, nl, nt,/.test(layer));
    // ★★2026-09-08、★天井から下げるものが 加わりました。
    ok("★縦の欄を、分けている", /\(onWall \|\| onCeiling\) \? "top" : "feet"/.test(layer));
    ok("★置き場所を、名簿から取っている", /placementOf\(it\)/.test(layer));
    ok("★分類で判じるのを、やめた", !/it\.category === "wallart"/.test(layer));
    ok("★置きかたを直すときだけ、動かせる", /editMode && Draggable && onUpdatePosition/.test(layer));
    // ★★部屋の外へ出さないこと。★出ると、二度と掴めません。
    //   ★★帯は lib が持ちます（★2026-09-08 の直し）。★画面で数を書きません。
    ok("★部屋の外へ、出さない", /Math\.max\(6, Math\.min\(94/.test(home));
    ok("★上下も、帯の中に収める", /Math\.max\(lo, Math\.min\(hi/.test(home));
    ok("★帯は、lib が持っている", /FLOOR_BAND, WALL_BAND, LEFT_BAND, clampToBand/.test(layer));

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
    // ★★2026-09-08、★床の線を「どの絵も y300」としていました。
    //   ★実測すると、★家具 247/301/309、★庭 289〜311、★扉 503 でした。
    //   ★扉に 300 を当てると、2割ちかく浮きます（★実機のご指摘）。
    ok("★床の線を、1点ずつ実測した値で取っている", /floorLineOf\(/.test(layer));
    ok("★大きさも、絵の幅から出している", /widthPctOf\(/.test(layer));
    // ★★景色は、★穴に切り抜いてはめること。★引き伸ばさないこと。
    // ★★2026-09-08、★穴の「四角」で切るのを、やめました。
    //   ★丸い枠で、★四隅に はみ出していました。
    //   ★★「外から届かない、透けているところ」だけを白にした型を、13枚 作りました。
    ok("★穴だけの型を、使っている", /windowHoleMask\(frame\)/.test(layer));
    ok("★型は、名簿が持っている", m.INTERIOR_ITEMS.filter((i) => i.category === "window")
      .every((i) => typeof i.holeMask === "string"));
    ok("★四角で切っていない", !/windowHole\(frame\)/.test(layer));
    ok("★割合を1つで済ませていない", !/WINDOW_INNER_RATIO/.test(layer));
    ok("★はみ出しを切っている", /overflow: "hidden"/.test(layer));
    ok("★引き伸ばさず、はみ出しを切る（cover）", /objectFit: "cover"/.test(layer));
    ok("★枠の高さは、絵の縦横比から出す", /aspectRatio: `\$\{frame\.size\[0\]\}/.test(layer));
    ok("★分類ごとに、大きさを決め打ちしていない", !/width: 22|width: 15|width: 12|width: 16|width: 26/.test(layer));
    // ★★名簿に、実測値が入っていること。
    ok("★120点すべてに、床の線が入っている",
      m.INTERIOR_ITEMS.every((i) => typeof i.floorY === "number"));
    ok("★扉の床の線は 503（★300 ではない）",
      m.floorLineOf(m.interiorItemByKey("door_01")) === 503);
    // ★★扉は、★右の壁に ぴったり寄せること（★2026-09-08 のご指摘）。
    //   ★★縦は合っていました。★横でした。★絵の端ではなく、中身の端を合わせます。
    ok(m.INTERIOR_ITEMS.every((i) => Array.isArray(i.contentX) && i.contentX.length === 2),
      "★120点すべてに、中身の左右が入っている");
    {
      const door = m.interiorItemByKey("door_01");
      const w = m.widthPctOf(door);
      const left = m.flushRightLeftPct(door);
      const contentRight = left - w / 2 + (door.contentX[1] / door.size[0]) * w;
      ok(Math.abs(contentRight - 100) < 0.001,
        "★扉の中身の右端が、ちょうど 100%（★実際 " + contentRight.toFixed(3) + "）");
      ok(Math.abs(left - 89) > 0.5,
        "★決め打ちの 89% では、なくなっている（★" + left.toFixed(2) + "%）");
    }
    ok(/left: `\$\{flushRightLeftPct\(door\)\}%`/.test(layer), "★画面が、それを使っている");
    ok(!/door: \{ left: 89 \}/.test(layer), "★89% を、書き残していない");
    // ★★縦は、もともと合っていました。★念のため見張ります。
    {
      const door = m.interiorItemByKey("door_01");
      const [cw, ch] = door.size;
      const w = m.widthPctOf(door);
      const pad = (ch - m.floorLineOf(door)) / ch;
      ok(pad < 0.02, "★扉の、床より下の余白は わずか（★" + (pad * 100).toFixed(2) + "%）");
    }

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

  console.log("■ ★古い79点を、隠す（★2026-09-08・案あ）");
  {
    const home = readCode("components", "CharacterHome.jsx");
    // ★★2026-09-08、★決めを lib/oldHouseVisibility.js へ移しました。
    //   ★★「特大窓ガラスが、まだ部屋に出ている」というご報告が理由です。
    //     ★お店の側と部屋の側で、★別々に書いていたため、
    //     ★窓と庭の3行を、★書き忘れていました。
    //   ★★だから、★分類の一覧を見張る先も、★lib に移します。
    //     ★中身の見張りは components/tests/old-house-hidden.test.js が持ちます。
    const vis = readCode("lib", "oldHouseVisibility.js");
    // ★★隠すだけ。★消していないこと。
    ok("★隠す分類を、1か所で持っている", /HIDDEN_WHEN_NEW_INTERIOR/.test(vis));
    ok("★画面側で、持ち直していない", !/const HIDDEN_WHEN_NEW_INTERIOR\s*=/.test(home));
    ok("★背景（backdrop）は、隠していない",
      /HIDDEN_WHEN_NEW_INTERIOR = Object\.freeze\(\[[^\]]*\]/.test(vis)
      && !/HIDDEN_WHEN_NEW_INTERIOR = Object\.freeze\(\[[^\]]*backdrop/.test(vis));
    ok("★7つを隠している",
      /"wall", "floor", "window", "scenery", "furniture", "garden", "wallhang"/.test(vis));
    // ★★消していないこと。★持ち物にも、置いた記録にも、触らない。
    ok("★持ち物を、消していない", !/delete .*character_inventory/.test(home));
    ok("★置いた記録を、消していない", !/delete equipped\.(furniture|wall|floor)/.test(home));
    // ★★門の外の方には、★これまでどおり出ること。
    ok("★門の外では、隠さない", /!wardrobeOn \|\| !HIDDEN_WHEN_NEW_INTERIOR/.test(home));
    // ★★中身を隠した札は、出さないこと。
    ok("★空の札を、出していない",
      /\.filter\(\(cat\) => !wardrobeOn \|\| !HIDDEN_WHEN_NEW_INTERIOR\.includes\(cat\)\)/.test(home));
    // ★★部屋のほうも、隠すこと。
    //   ★★1行ずつ書くのを、やめました。★書き忘れが起きたためです。
    //     ★9か所すべてが、★同じ関数を通ります。
    ok("★部屋の家具も、隠している", /oldHouseList\(equipped, "furniture", wardrobeOn\)/.test(home));
    ok("★★窓も、隠している（★特大窓ガラスの件）",
      /oldHouseKey\(equipped, "window", wardrobeOn\)/.test(home));
    ok("★★庭も、隠している", /oldHouseList\(equipped, "garden", wardrobeOn\)/.test(home));
    ok("★壁・床・景色は、既定に戻している",
      /oldHouseKey\(equipped, "wall", wardrobeOn\)/.test(home)
      && /oldHouseKey\(equipped, "floor", wardrobeOn\)/.test(home)
      && /oldHouseKey\(equipped, "scenery", wardrobeOn\)/.test(home));
    // ★★null にしないこと（★色を引く先が引けなくなります）。
    ok("★null にしていない", !/OLD_HOUSE_DEFAULTS = Object\.freeze\(\{[^}]*null/.test(vis));
  }

  console.log("■ ★荷物は、zip のまま");
  const packs = fs.readdirSync(path.join(ROOT, "assets", "interior-v2"));
  ok("★内装の zip が、開かれていない", packs.some((f) => f.endsWith(".zip")));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
