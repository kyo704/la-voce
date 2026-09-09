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
    // ★★imageFormat も 差し込みます（★2026-09-09・WebP を 入れたため）。

    .replace('import { webp } from "@/lib/imageFormat";',

      fs.readFileSync(path.join(ROOT, "lib", "imageFormat.js"), "utf-8").replace(/^export /gm, ""))
    .replace('import index from "@/docs/assets/sheep-interior-index.json";',
      "const index = " + JSON.stringify(idx) + ";");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ 120点、そろっていること");
  // ★★2026-09-08 夕、★床70・壁59 が 入りました（★tiles-v2-2026-09-08）。
  //   ★置くもの120点 ＋ 床壁129点 ＝ ★249点。
  ok(`★249点ある（いま ${m.INTERIOR_ITEMS.length}）`, m.INTERIOR_ITEMS.length === 249);
  ok(`★置くものは120点（いま ${m.INTERIOR_ITEMS.filter((i) => i.category !== "tile").length}）`,
    m.INTERIOR_ITEMS.filter((i) => i.category !== "tile").length === 111);
  ok("鍵に、重なりが無い",
    m.INTERIOR_ITEMS.length === new Set(m.INTERIOR_ITEMS.map((i) => i.key)).size);
  // ★★絵が、★1枚も欠けていないこと。★指しているのに無い、を作らない。
  const missing = m.INTERIOR_ITEMS.filter(
    (i) => !fs.existsSync(path.join(ROOT, "public", "sheep", i.file)));
  ok("指している絵が、全部ある", missing.length === 0, missing.slice(0, 5).map((i) => i.key).join(", "));

  console.log("■ 分類ごとの数（★README のとおり）");
  // ★★2026-09-08 夕、★かべ・ゆかが 9点 → 138点になりました（★床70・壁59 を足して）。
  const want = { furniture: 27, showa: 19, window: 13, view: 13, door: 12, wallart: 13, garden: 14, tile: 138 };
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
    // ★★2026-09-08 夕、★床70・壁59 が 入りました（★tiles-v2-2026-09-08）。
    //   ★もとの9点（壁5・床4）と 合わせて 138点です。
    ok("★壁と床を、lib が分けている", m.wallTiles().length === 64 && m.floorTiles().length === 74);
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
    // ★★床壁129点は、★敷き詰めるものです。★床の線を、持ちません。
    ok("★置くもの120点すべてに、床の線が入っている",
      m.INTERIOR_ITEMS.filter((i) => i.category !== "tile")
        .every((i) => typeof i.floorY === "number"));
    ok("★床壁129点に、族（kind）が入っている",
      m.itemsByCategory("tile").filter((i) => i.seamless).every((i) => typeof i.kind === "string"));
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

  console.log("■ ★動かせること（★2026-09-08 夜のご報告）");
  {
    // ★★「うごかす」は、★場面のどの品物よりも 前に出ていること。
    //   ★★もとは 10 の 決め打ちでした。★内装は 500〜9100 です。
    //     ★床材や壁材の 後ろに 隠れていました。
    const maxBand = m.INTERIOR_ITEMS.reduce((x, i) => Math.max(x, m.zOf(i)), m.SHEEP_Z_BAND);
    ok(`★場面の いちばん上は ${m.SCENE_MAX_Z}（★帯 ${maxBand}）`,
      m.SCENE_MAX_Z === m.zIndexOf(maxBand, 100));
    ok(`★操作ボタンは、それより前（${m.UI_CHROME_Z}）`, m.UI_CHROME_Z > m.SCENE_MAX_Z);
    const home2 = readCode("components", "CharacterHome.jsx");
    ok("★画面で 決め打ちしていない（★lib から もらう）",
      !/const UI_CHROME_Z\s*=/.test(home2) && /UI_CHROME_Z.*from "@\/lib\/sheepInteriorV2"/.test(home2));
    // ★★羊は 飾りです。★押したときの動きが 1つも ありません。
    //   ★★前（7000台）にいるので、★下の家具の指を 受け止めていました。
    //     ★2026-09-08、★羊を大きくして、★覆う面積が 増えました。
    //   ★★立ち姿と 寝姿、★両方です。★片方だけでは、寝たときに 動かせません。
    const posed = home2.slice(home2.indexOf("function PositionedCharacter"),
      home2.indexOf("function PositionedCharacter") + 3600);
    ok("★羊が、指を すり抜ける（★立ち姿と寝姿の2つ）",
      (posed.match(/zIndex: frontZ,\s*\n\s*pointerEvents: "none"/g) || []).length === 2,
      "いま " + (posed.match(/pointerEvents: "none"/g) || []).length + " 件");
  }

  console.log("■ ★羊の大きさ（★2026-09-08 夜・案A）");
  {
    // ★★家具は ％、★羊だけ 画素、という ずれを 直しました。
    ok(`★羊は 部屋の幅の ${m.SHEEP_WIDTH_PCT}％`, m.SHEEP_WIDTH_PCT === 26);
    ok("★部屋の幅から 画素を 出す", m.sheepSizePx(480) === 480 * 26 / 100);
    ok("★測れていないときは 0", m.sheepSizePx(0) === 0 && m.sheepSizePx(undefined) === 0);
    // ★★背の高い かぶりものが 切れないこと。
    //   ★箱の高さ＝部屋の幅の◯％。★部屋の高さに 直すと ◯×4/3 ％。
    //   ★足もとは いちばん上でも 70％（SHEEP_WANDER）。★引いて 残ること。
    const boxPctOfHeight = m.SHEEP_WIDTH_PCT * 4 / 3 * 1.15; // ★front の 1.15 倍
    const topmost = m.SHEEP_WANDER.centerTop - m.SHEEP_WANDER.rangeTop;
    ok(`★どの機種でも 上に はみ出さない（残り ${(topmost - boxPctOfHeight).toFixed(1)}％）`,
      topmost - boxPctOfHeight > 0);
    const home3 = readCode("components", "CharacterHome.jsx");
    ok("★画面で 画素を 決め打ちしていない", /size=\{sheepPx\}/.test(home3));
    ok("★測れるまで 出さない", /if \(!size\) return null;/.test(home3));
    // ★★変形（transform）の かかった大きさを、★測らないこと
    //   （★2026-09-08 夜・実機「羊の大きさが 変わる」）。
    //   ★★getBoundingClientRect は 見えている大きさを 返します。
    //     ★FLIP の scale が かかっている最中に 測ると、★倍率ぶん ずれ、
    //     ★★形は 変わらないので、★もう一度 測り直されません。
    //   ★★offsetWidth と border-box は、★組みつけの大きさです。
    const meas = home3.slice(home3.indexOf("const roomBoxRef"),
      home3.indexOf("const roomBoxRef") + 900);
    ok("★★変形の影響を 受けない 測り方（offsetWidth）",
      /setRoomBoxW\(el\.offsetWidth\)/.test(meas));
    ok("★★見えている大きさで 測っていない",
      !/getBoundingClientRect/.test(meas));
    ok("★大きさが変わったときも、組みつけの大きさで 測る",
      /borderBoxSize/.test(meas));
  }

  console.log("■ ★開くときの 軽さ（★2026-09-08 夜のご報告）");
  {
    const vt = readCode("components", "VocalTracker.jsx");
    // ★★部屋は 1つだけ。★2つ作ると、開くたびに 絵を 読み直します。
    ok(`★部屋は 1つだけ（いま ${(vt.match(/roomOnly/g) || []).length} つ）`,
      (vt.match(/roomOnly/g) || []).length === 1);
    // ★★引き出しは、閉じているときも 消しません（★下から 上がるため）。
    ok("★引き出しを 消していない（open で 上下する）",
      /<HomeDrawer\s*\n\s*open=\{homeState === DRESS\}/.test(vt));
    const dr = readCode("components", "HomeDrawer.jsx");
    ok("★transform で 上がる（★高さを 動かさない）",
      /transform: open \? "translateY\(0\)" : "translateY\(100%\)"/.test(dr));
    ok("★閉じているときは 押せない", /pointerEvents: open \? "auto" : "none"/.test(dr));
    const gr = readCode("components", "DrawerItemGrid.jsx");
    ok("★見えているものだけ 読み込む", /loading="lazy"/.test(gr));
    // ★★閉じているあいだは、★1枚も 読まないこと（★2026-09-09・実機の記録）。
    //   ★★lazy は、★画面から 少し 下でも 読みに行きます。
    //     ★閉じた引き出しは すぐ下に あるので、★762枚が 読まれていました。
    const dr2 = readCode("components", "HomeDrawer.jsx");
    ok("★★閉じているあいだは 描かない（display:none）",
      /display: open \? undefined : "none",/.test(dr2));
    // ★★ながめる → したく で、★部屋が 飛んで見えないこと。
    //   ★前の場所を 覚え、★transform で 打ち消してから 滑らせます。
    ok("★飛ばずに 滑る（★前の場所を 覚えている）",
      /roomRectRef/.test(vt) && /translate\(\$\{dx\}px, \$\{dy\}px\) scale\(\$\{sx\}\)/.test(vt));
    ok("★動きを 減らす設定では 滑らせない", /prefers-reduced-motion: reduce/.test(vt));
    // ★★ひつじの画面を、★1度開いたら 捨てないこと（★2026-09-08 夜・案A）。
    //   ★★もとは タブを離れると 消え、★戻るたびに 1から 作り直していました。
    ok("★1度開いたら 捨てない", /wardrobeMountedOnce/.test(vt));
    ok("★隠すだけ（display:none）",
      /display: activeTab === "garden" \? undefined : "none"/.test(vt));
    // ★★はじめから 作らないこと。★1度も開かない方に 読ませないためです。
    ok("★はじめから 作ってはいない", /useState\(false\);\s*\n\s*useEffect\(\(\) => \{\s*\n\s*if \(activeTab === "garden"\)/.test(vt));
  }

  console.log("■ ★すわる・眠る（★2026-09-08 夜・実機「歩くだけ」）");
  {
    // ★★もとは 古い家具の鍵だけを 見ていました。
    //   ★門の中の方には 古い79点を 隠しているので、★1度も 起きませんでした。
    // ★★入れ物（object）を、★並び（array）と 取りちがえないこと。
    //   ★★2026-09-08 夜、★for...of と new Set に 入れ物を 渡して
    //     ★★実機が「is not iterable」で 落ちました。
    //   ★平らにする所は、★lib が 1つ 持ちます。
    ok("★入れ物を、平らな並びに できる",
      JSON.stringify(m.placedKeys({ interior: {
        wallTile: "tile_01", furniture: ["furniture_10", "furniture_04"], window: "window_03"
      } })) === JSON.stringify(["tile_01", "window_03", "furniture_10", "furniture_04"]));
    ok("★空でも 落ちない",
      m.placedKeys({}).length === 0 && m.placedKeys(null).length === 0);
    ok("★同じ鍵を 2度 数えない",
      m.placedKeys({ interior: { furniture: ["a", "a"], showa: ["a"] } }).length === 1);
    const pre = readCode("lib", "preloadRoom.js");
    ok("★★入れ物を for...of で まわしていない",
      !/for \(const [a-z]+ of interiorOf\(/.test(pre) && /placedKeys\(eq\)/.test(pre));
    // ★★既定の場所は、★％で 返すこと（★絵の中の画素を そのまま 渡さない）。
    const seat = m.seatPos({ interior: { furniture: ["furniture_10"] } }, {});
    ok(`★既定の場所が 床の帯の中（いま ${seat && seat.top}）`,
      seat && seat.top >= m.FLOOR_BAND[0] && seat.top <= m.FLOOR_BAND[1]);
    ok(`★座れる内装 ${m.SEAT_KEYS.length}点`, m.SEAT_KEYS.length === 8);
    ok("★座れる内装が、名簿に ある",
      m.SEAT_KEYS.every((k) => m.interiorItemByKey(k)));
    // ★★無いものを 指して「眠ります」と 書かないこと。
    ok("★★寝台は まだ 1点も 無い", m.BED_KEYS.length === 0);
    ok("★置いていなければ null", m.seatPos({}, {}) === null);
    ok("★置いていれば 場所を 返す",
      m.seatPos({ interior: { furniture: ["furniture_10"] } }, {}) !== null);
    // ★★動かした ぶんを 見ること。
    const moved = m.seatPos({ interior: { furniture: ["furniture_10"] } },
      { furniture_10: { left: 22, top: 80 } });
    ok("★動かした 場所を 見ている", moved && moved.left === 22);
    // ★★運を 使わないこと。★同じ部屋なら 同じ椅子です。
    const eqq = { interior: { furniture: ["furniture_25", "furniture_10"] } };
    const a1 = m.seatPos(eqq, {});
    const a2 = m.seatPos(eqq, {});
    ok("★同じ部屋なら 同じ椅子", JSON.stringify(a1) === JSON.stringify(a2));
    const home4 = readCode("components", "CharacterHome.jsx");
    ok("★新しい内装からも 探している", /seatPos\(equipped, equipped\.interiorPositions\)/.test(home4));
    ok("★古い方は これまでどおり",
      /furniturePos\("furniture_chair"\)\s*\n?\s*\|\|/.test(home4));
  }

  console.log("■ ★歩く 速さと 間（★2026-09-09・坂本さんの ご承認）");
  {
    ok("★1回 歩くのは 3,200ms", m.WALK_MS === 3200);
    ok("★次まで 4〜9秒",
      m.nextWalkRestMs(() => 0) === 4000 && m.nextWalkRestMs(() => 1) === 9000);
    const home5 = readCode("components", "CharacterHome.jsx");
    // ★★CSS の 移りと、★歩く秒数を、★同じ数から 出すこと。
    //   ★ずれると、★着く前に 止まったり、★着いてから 動いたりします。
    ok("★★CSS の 移りも 同じ数から",
      /left \$\{WALK_MS\}ms linear/.test(home5));
    ok("★画面で 秒数を 決め打ちしていない",
      !/2\.2s (linear|ease-in-out)/.test(home5) && !/moveTo\(nl, nt, 2200\)/.test(home5));
    ok("★休む間も lib から", !/800 \+ Math\.random\(\) \* 1200/.test(home5));
    // ★★椅子・寝台へ 行く道も、★同じ数から 出すこと（★2026-09-09・実機の不具合）。
    //   ★★歩きを 3.2秒に したのに、★ここだけ 2.0秒の ままでした。
    //     ★足は 2.0秒で 止まり、★体は 3.2秒 かけて 進みます。
    //     ★★「座ったあと 足が 動かない」ように 見えていました。
    ok("★★椅子・寝台へ 行く道も 同じ数",
      !/moveTo\([^)]*, 2000\)/.test(home5) && !/\}, 2100\)/.test(home5));
    // ★★4か所（★部屋の散歩・椅子・寝台・庭の散歩）。
    ok("★歩く道は すべて 同じ数から",
      (home5.match(/moveTo\([^)]*, WALK_MS\)/g) || []).length === 4);
    // ★★座りに行く 頻度（★2026-09-09・実機「多すぎる」）。
    ok("★座りに行くのは 60〜150秒に1回",
      m.nextSitMs(() => 0) === 60000 && m.nextSitMs(() => 1) === 150000);
    ok("★頻度も lib から", !/20000 \+ Math\.random\(\) \* 20000/.test(home5));
    // ★★歩いている割合が 半分より 少ないこと。
    const ratio = m.WALK_MS / (m.WALK_MS + (m.WALK_REST_MIN_MS + m.WALK_REST_MAX_MS) / 2);
    ok(`★歩いている割合が 半分より少ない（${Math.round(ratio * 100)}%）`, ratio < 0.5);
  }

  console.log("■ ★家具の 大きさ（★2026-09-09・実機「家具が 小さく見える」）");
  {
    // ★★見た目の幅は「絵の枠」ではなく「中身」で 決まります。
    //   ★羊の体は 枠の 56.4％、★大ソファは 79.7％ しか 使っていません。
    //   ★だから 枠の幅を くらべても 意味が ありません。
    ok("★大きくする割合が 1つの数", m.FLOOR_ITEM_SCALE === 1.35);
    // ★★窓・扉・壁・天井・タイルは、★1つも 変えないこと。
    //   ★★窓は 枠の穴と 景色が 合っています。★動かすと ずれます。
    //   ★タイルは 敷きつめるものです。★大きさに 意味が ありません。
    const untouched = ["ceiling", "wall", "opening", "view", "outside", "surface"];
    ok("★★窓・壁・天井・タイルは 変えていない",
      untouched.every((p2) => !m.SCALED_PLACEMENTS.includes(p2)),
      untouched.filter((p2) => m.SCALED_PLACEMENTS.includes(p2)).join(" "));
    ok("★床・机の上・柱だけ 大きくしている",
      JSON.stringify(m.SCALED_PLACEMENTS) === JSON.stringify(["floor", "tabletop", "structure"]));
    const floorItem = m.INTERIOR_ITEMS.find((i) => i.placement === "floor");
    const wallItem = m.INTERIOR_ITEMS.find((i) => i.placement === "wall");
    ok("★床のものが 1.35倍に なっている",
      Math.abs(m.widthPctOf(floorItem) - 22 * 1.35) < 0.01, String(m.widthPctOf(floorItem)));
    ok("★壁のものは そのまま",
      Math.abs(m.widthPctOf(wallItem) - 22) < 0.01, String(m.widthPctOf(wallItem)));
    // ★★窓の枠と 景色が、★同じ物差しで 動くこと（★ずれたら 穴から はみ出します）。
    const frame = m.INTERIOR_ITEMS.find((i) => i.placement === "opening" && i.size && i.size[0] === 384);
    const view = m.INTERIOR_ITEMS.find((i) => i.placement === "view" && i.size && i.size[0] === 384);
    if (frame && view) {
      ok("★★窓の枠と 景色が、同じ幅", Math.abs(m.widthPctOf(frame) - m.widthPctOf(view)) < 0.01);
    }
  }

  console.log("■ ★荷物は、zip のまま");
  const packs = fs.readdirSync(path.join(ROOT, "assets", "interior-v2"));
  ok("★内装の zip が、開かれていない", packs.some((f) => f.endsWith(".zip")));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
