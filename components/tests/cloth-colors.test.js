// ============================================================================
// 服のいろ 24色の見張り（2026-09-08）
//
//   ★★2枚方式（light + dark）と、★24色のパレットを見張ります。
//   ★出どころ assets/color-2layer/…（9月8日）.zip の README.md
//
//   node components/tests/cloth-colors.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { stripComments, readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let fail = 0;
function ok(cond, msg) {
  if (cond) console.log("  ✓ " + msg);
  else { console.log("  ✗ " + msg); fail++; }
}

async function load(rel) {
  // ★★@/ の借り先は、★file:// の形に直します。
  //   ★data: から読むので、★ただの絶対パスでは解けません。
  //   ★拡張子も付けます（★ESM は省略を許しません）。
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8")
    .replace(/from\s+"@\/([^"]+)"/g, (m, rel2) => {
      const abs = path.join(ROOT, /\.[a-z]+$/.test(rel2) ? rel2 : rel2 + ".js");
      return `from "${pathToFileURL(abs).href}"`;
    });
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

(async () => {
  const cc = await load("lib/clothColors.js");
  const items = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/assets/sheep-items-index.json"), "utf8"));
  const catalog = items.items || items;

  console.log("① パレット 24色");
  ok(cc.CLOTH_COLORS.length === 24, "24色ある（★実際 " + cc.CLOTH_COLORS.length + "）");
  ok(new Set(cc.CLOTH_COLOR_KEYS).size === 24, "鍵が重なっていない");
  const badHex = cc.CLOTH_COLORS.filter((c) => !/^#[0-9A-F]{6}$/i.test(c.hex) || !/^#[0-9A-F]{6}$/i.test(c.pre));
  ok(badHex.length === 0, "hex も pre も、6桁の色になっている");
  const noName = cc.CLOTH_COLORS.filter((c) => !c.name || !c.name.trim());
  ok(noName.length === 0, "24色すべてに、名前がある（★色だけで示さないため）");

  console.log("② README の逆算した値と、ずれていないか（★抜き取り）");
  // ★★README の「様式後に狙った色になる」表から、そのまま写した値です。
  //   ★ここが変わったら、★誰かが表を見ずに書き替えたということです。
  const FROM_README = {
    fukamidori: ["#447862", "#377C68"],
    kon: ["#2B3A5C", "#1F3965"],
    ao: ["#4A6FA5", "#3B6EB1"],
    mizuiro: ["#9BBFD9", "#8EC0E3"],
    mint: ["#A8CFC0", "#9CD2C6"],
    fukamori: ["#2F4A3C", "#244C42"],
    kuro: ["#1A1A1C", "#111A22"],
    kinari: ["#F2EDE3", "#EAEDE7"]
  };
  Object.entries(FROM_README).forEach(([k, [hex, pre]]) => {
    const c = cc.colorByKey(k);
    ok(!!c && c.hex === hex && c.pre === pre, k + " … 狙う色 " + hex + " ／ 塗る値 " + pre);
  });

  console.log("③ 見本は狙う色、塗るのは逆算した値");
  ok(cc.STYLE_APPLIED === true, "いまの絵は、あつ森様式を通してある");
  ok(cc.swatchHex("ao") === "#4A6FA5", "見本に出すのは、狙う色");
  ok(cc.paintHex("ao") === "#3B6EB1", "実際に塗るのは、逆算した値");
  ok(cc.swatchHex("ao") !== cc.paintHex("ao"), "2つは、別の値である（★1つにまとめないこと）");
  ok(cc.paintHex("そんな色はない") === null, "知らない色は、null を返す");

  console.log("④ 塗る式（★README のとおり）");
  //   out = (light − dark) × col / 255 + dark
  ok(cc.blendChannel(200, 50, 255) === 200, "col が 255 なら、light そのもの");
  ok(cc.blendChannel(200, 50, 0) === 50, "col が 0 なら、dark そのもの");
  ok(Math.abs(cc.blendChannel(200, 50, 128) - 125.29) < 0.01, "まん中は、その間");
  ok(cc.blendChannel(120, 120, 200) === 120, "light と dark が同じところは、色が乗らない（★柄が残る）");

  console.log("⑤ ★色を塗れる品 ── ★ふだん着166点すべて（★2026-09-08）");
  ok(cc.COLORABLE_KEYS.length === 166, "166点（★実際 " + cc.COLORABLE_KEYS.length + "）");
  const missing = cc.COLORABLE_KEYS.filter((k) => !catalog.some((i) => i.key === k));
  ok(missing.length === 0, "166点すべてが、着せかえの名簿にある" + (missing.length ? "：" + missing.join(",") : ""));
  // ★★上だけでは ありません。★靴も 目元も 入ります（★坂本さんのお決め）。
  const slots = [...new Set(cc.COLORABLE_KEYS.map((k) => {
    const it = catalog.find((i) => i.key === k);
    return it ? it.slot : null;
  }).filter(Boolean))].sort();
  ok(slots.length === 7, "★7つの置き場所（★" + slots.join("・") + "）");
  ok(!slots.includes("garment"), "★★全身ものは、1点も入っていない");
  // ★★記念のもの（箱1）は、★色を変えられません。★そこに1つも入っていないこと。
  const keepsake = cc.COLORABLE_KEYS.filter((k) => {
    const it = catalog.find((i) => i.key === k);
    return it && it.group !== "daily";
  });
  ok(keepsake.length === 0, "★記念のもの219点は、1つも入っていない");
  // ★★2026-09-08、★止めていたのを 外しました。
  //   ★新しい荷物（parts-v3-2026-09-08b）で、★裁ち方がそろったためです。
  const P = await load("lib/pausedFeatures.js");
  const on = P.CLOTH_COLORS_ENABLED;
  ok(on === true, "★服のいろを、出している");
  ok(!P.PAUSED_FEATURES.some((f) => f.key === "display.clothColors"),
    "★台帳から、外している");
  ok(cc.isColorable("top_01") === true, "塗れる品は true");
  ok(cc.isColorable("hat_01") === false, "もともと塗れない品は、いつでも false");
  // ★★全身ものは、★いつでも塗れません（★坂本さんの決め・2026-09-08）。
  ok(cc.NEVER_COLORABLE_SLOTS.includes("garment"), "全身ものは、色を変えられない");
  ok(cc.isColorable("top_01", "garment") === false, "★全身ものの置き場所なら、塗れない");

  console.log("⑤-2 ★柄の2色目（★67点）");
  const PC = await load("lib/patternColors.js");
  ok(Object.keys(PC.BURNED_SECOND).length === 67, "★67点（★manifest のとおり）");
  ok(PC.hasPattern("top_06") === true && PC.hasPattern("top_11") === false, "柄かどうかが分かる");
  ok(Array.isArray(PC.secondColor("top_06", null)), "2色目が出る");
  ok(PC.secondColor("top_11", null) === null, "★柄でない品は、null");

  console.log("⑤-3 ★1色目から2色目を出す表（★正本・2026-09-08）");
  // ★★お客さまには、選ばせません。★1色目から、表を引いて 決めます。
  ok(Object.keys(PC.SECOND_BY_FIRST).length === 24, "★24行（★24色すべて）");
  // ★★24色すべてに、行き先が在ること。★行き止まりを作らないこと。
  const noSecond = cc.CLOTH_COLOR_KEYS.filter((k) => !PC.SECOND_BY_FIRST[k]);
  ok(noSecond.length === 0, "★24色すべてに、2色目がある" + (noSecond.length ? "：" + noSecond.join(",") : ""));
  // ★★行き先も、24色の中であること。
  const outside = Object.values(PC.SECOND_BY_FIRST).filter((k) => !cc.CLOTH_COLOR_KEYS.includes(k));
  ok(outside.length === 0, "★2色目も、24色の中である" + (outside.length ? "：" + outside.join(",") : ""));
  // ★★自分自身を、返さないこと（★同じ色だと 柄が消えます）。
  const same = Object.entries(PC.SECOND_BY_FIRST).filter(([a2, b2]) => a2 === b2);
  ok(same.length === 0, "★★自分と同じ色を、返していない" + (same.length ? "：" + same.map((x) => x[0]).join(",") : ""));
  ok(PC.secondColorKey("ao") === "mizuiro", "あお → みずいろ");
  ok(PC.secondColorKey(null) === null, "★選んでいなければ、null");
  // ★★選んでいないときは、★焼かれた色のまま（★見える絵と同じ）。
  ok(Array.isArray(PC.secondColor("top_06", null)), "★もとの色のときは、焼かれた色");
  // ★★こちらでは、1つも計算していないこと（★決めを2か所に置かない）。
  const pcCode = readCode("lib", "patternColors.js");
  ok(!/contrast|WCAG|luminance|relativeLum/i.test(pcCode), "★対比を、こちらで計算していない");
  // ★★族（family）も、こちらで持たないこと。
  ok(!/むさい|families/.test(pcCode), "★族の分けを、こちらで持っていない");
  ok(PC.maskSrc("top_06") === "/sheep/mask/top_06.png", "★型の在りか");
  // ★★2色目は、★お客さまに選ばせません。
  const pcRaw = readRaw("lib/patternColors.js");
  ok(!/onChange|えらぶ|選ばせ/.test(pcRaw.replace(/★[^\n]*/g, "")),
    "★選ばせる作りに、なっていない");

  console.log("⑥ 絵が 34枚そろっているか");
  let noFile = [];
  cc.COLORABLE_KEYS.forEach((k) => {
    ["light", "dark"].forEach((w) => {
      const rel = cc.layerSrc(k, w);
      if (!fs.existsSync(path.join(ROOT, "public", rel.replace(/^\//, "")))) noFile.push(k + "_" + w);
    });
  });
  ok(noFile.length === 0, "166点 × 2枚 ＝ 332枚、すべてある" + (noFile.length ? "：" + noFile.slice(0,5).join(",") : ""));
  // ★★柄ものは、★3枚目（型）も要ります。
  const noMask = Object.keys(PC.BURNED_SECOND).filter(
    (k) => !fs.existsSync(path.join(ROOT, "public/sheep/mask", k + ".png")));
  ok(noMask.length === 0, "★柄67点の型が、すべてある" + (noMask.length ? "：" + noMask.join(",") : ""));

  console.log("⑦ 選んだ色の持ちかた（★列を足していない）");
  let eq = { wardrobe: { top: "top_01" } };
  eq = cc.setColor(eq, "top_01", "ao");
  ok(cc.colorOf(eq, "top_01") === "ao", "選べる");
  ok(eq.wardrobe.top === "top_01", "★着せかえを、消していない（★9月8日の不具合と同じ形）");
  eq = cc.setColor(eq, "top_01", "ao");
  ok(cc.colorOf(eq, "top_01") === null, "同じ色をもう一度押すと、もとの色に戻る");
  eq = cc.setColor(eq, "top_01", "kon");
  eq = cc.setColor(eq, "top_01", null);
  ok(cc.colorOf(eq, "top_01") === null, "null を渡すと、もとの色に戻る");
  ok(cc.colorsOf({}) && Object.keys(cc.colorsOf({})).length === 0, "何も無いときも、落ちない");
  ok(cc.colorsOf(null) && Object.keys(cc.colorsOf(null)).length === 0, "null でも、落ちない");

  console.log("⑧ 白っぽい色の縁取り");
  ok(cc.needsEdge("kinari") === true, "きなりは、縁が要る");
  ok(cc.needsEdge("kuro") === false, "くろは、縁が要らない");
  const e = cc.edgeHex("kinari");
  ok(/^#[0-9a-f]{6}$/i.test(e), "縁の色が出る：" + e);
  const [r0] = cc.hexToRgb(cc.swatchHex("kinari"));
  const [r1] = cc.hexToRgb(e);
  ok(r1 < r0, "縁の色は、もとより濃い");

  console.log("⑨ 数を、書いていないか");
  // ★★「24色あります」「17点あります」と出さない決めです。
  //   ★★コメントを外して見ます。★この検査自身の説明で落ちないためです。
  const rowCode = readCode("components/ClothColorRow.jsx");
  const NUM = /(24\s*色|17\s*点|２４色|あと\s*\d)/;
  ok(!NUM.test(rowCode), "色を選ぶところに、数を書いていない");

  console.log("⑩ つながっているか（★作った関数は、呼ばれているか）");
  const panel = readRaw("components/WardrobePanel.jsx");
  const tracker = readRaw("components/VocalTracker.jsx");
  const dressed = readRaw("components/SheepDressed.jsx");
  const clothImg = readRaw("components/ClothImage.jsx");
  ok(/<ClothColorRow/.test(panel), "色を選ぶところが、着せかえの画面から出る");
  ok(/onColorChange=\{/.test(tracker), "選んだ色が、VocalTracker に届く");
  ok(/itemSlot=\{/.test(panel), "★置き場所も渡している（★全身ものを止めるため）");
  ok(/setClothColor\(/.test(tracker), "選んだ色を、setColor で入れている（★丸ごと入れていない）");
  ok(/clothColors/.test(tracker), "character_equipped.clothColors に持つ（★列を足していない）");
  ok(/<ClothImage/.test(dressed), "羊が、塗った絵を出す");
  ok(/colors=\{colors\}/.test(panel), "見本の羊にも、同じ色が渡っている");
  ok(/paintCloth/.test(clothImg) && /paintedUrl/.test(clothImg), "塗る仕組みが、呼ばれている");

  console.log("⑪ 塗れないときも、消えないか");
  const imgCode = readCode("components/ClothImage.jsx");
  ok(/painted \|\| src/.test(imgCode), "塗れていないあいだは、もとの絵を出す（★空にしない）");
  ok(/catch\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/.test(imgCode.replace(/\s+/g, " ").replace(/ /g, "")) || /\.catch\(/.test(imgCode),
    "塗れなくても、落ちない");

  console.log("⑫ もとの色へ戻る道があるか");
  const rowRaw = readRaw("components/ClothColorRow.jsx");
  ok(/もとの色/.test(rowRaw), "「もとの色」に戻す押しどころがある");
  ok(rowRaw.indexOf("もとの色にする") < rowRaw.indexOf("CLOTH_COLORS.map"),
    "「もとの色」が、いちばん前にある");

  console.log("⑬ ★帯の形（★2026-09-08 夕・見本①②③のとおり）");
  // ★★開け閉めを、やめました。★帯は「きるもの」のとき いつも出ています。
  //   ★★出したり消したりすると、★下の一覧の位置が ずれます。
  //     ★見本②に「グリッドは そのまま。位置がずれません」と書いてあります。
  //   ★えらぶ前の灰色は、★HomeDrawer が受け持ちます。
  ok(!/aria-expanded/.test(rowRaw), "★開け閉めを、やめた");
  ok(/SIZES\.swatchPx/.test(rowRaw), "★見本の大きさを、lib から取っている");
  // ★★2026-09-08、★1.16倍と 太い枠を、やめました。
  //   ★★見本の大きさが変わると、★横に並んだもの全部が ずれます。
  //     ★帯が 揺れて見えます。★実機でご報告をいただきました。
  //   ★★しるしは boxShadow で出します。★場所を取りません。
  ok(!/scale\(1\.16\)/.test(rowRaw), "★大きさを、変えていない");
  ok(/boxShadow: on \?/.test(rowRaw), "★選んだしるしは、輪で出す");
  ok(!/border: on\s*\?/.test(rowRaw), "★枠の太さを、変えていない");
  ok(/height: SIZES\.swatchPx \+ 8/.test(rowRaw), "★帯の高さを、決めてある");
  ok(/aria-label=\{c\.name\}/.test(rowRaw), "★色の名前を、読み上げに残している");
  ok(/COPY\.colorPattern/.test(rowRaw), "★柄ものは「がら」と出す");
  ok(/hasPattern\(itemKey\)/.test(rowRaw), "★柄かどうかを、lib に聞いている");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
