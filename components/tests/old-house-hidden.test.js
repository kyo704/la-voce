// ============================================================================
// 古い79点が、門の中の方に出ていないかの見張り（2026-09-08）
//
//   ★★2026-09-08、★「特大窓ガラスが、まだ部屋に出ている」と
//     ★ご報告をいただきました。★そのとおりでした。
//     ★お店の一覧からは隠していましたが、
//     ★★すでに置いてあるものを、★部屋を描く側で見ていませんでした。
//   ★★原因は、★「隠す」の決めが2か所に分かれていたことです。
//     ★お店の側と、★部屋の側で、★別々に書いていました。
//   ★★この見張りは、★また分かれたら落ちます。
//
//   node components/tests/old-house-hidden.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let fail = 0;
function ok(c, m) { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; }

async function load(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

(async () => {
  const V = await load("lib/oldHouseVisibility.js");

  console.log("① 隠す分類");
  ok(V.HIDDEN_WHEN_NEW_INTERIOR.length === 7, "7分類（★実際 " + V.HIDDEN_WHEN_NEW_INTERIOR.length + "）");
  ["wall", "floor", "window", "scenery", "furniture", "garden", "wallhang"].forEach((c) => {
    ok(V.isHiddenCategory(c), c + " は隠す");
  });
  // ★★背景10点は、★隠しません。★新しい側に当たるものがありません。
  ok(!V.isHiddenCategory("backdrop"), "背景（backdrop）は、隠さない");

  console.log("② 門の中では、既定に戻る（★特大窓ガラスの件）");
  const eq = {
    window: "window_grand", scenery: "scenery_night", wall: "wall_brick", floor: "floor_tatami",
    furniture: ["furniture_bed", "furniture_piano"], garden: ["garden_pond"], wallhang: ["wallhang_clock"],
    backdrop: "backdrop_room_expand"
  };
  ok(V.oldHouseKey(eq, "window", true) === "window_default", "★特大窓ガラスは、部屋に出ない");
  ok(V.oldHouseKey(eq, "scenery", true) === "scenery_default", "窓の外の色も、既定に戻る");
  ok(V.oldHouseKey(eq, "wall", true) === "wall_default", "壁も、既定に戻る");
  ok(V.oldHouseKey(eq, "floor", true) === "floor_default", "床も、既定に戻る");
  ok(V.oldHouseList(eq, "furniture", true).length === 0, "古い家具は、出ない");
  ok(V.oldHouseList(eq, "garden", true).length === 0, "★古い庭も、出ない");
  ok(V.oldHouseList(eq, "wallhang", true).length === 0, "古い壁かけも、出ない");
  // ★★既定は null にしないこと。★色を引く先が引けなくなります。
  ["wall", "floor", "window", "scenery"].forEach((c) => {
    ok(typeof V.oldHouseKey(eq, c, true) === "string", c + " の既定は、null ではない");
  });

  console.log("③ 門の外では、これまでどおり出る（★取り上げていない）");
  ok(V.oldHouseKey(eq, "window", false) === "window_grand", "特大窓ガラスは、門の外では出る");
  ok(V.oldHouseList(eq, "garden", false).length === 1, "庭も、門の外では出る");
  ok(V.oldHouseKey(eq, "backdrop", true) === null || eq.backdrop === "backdrop_room_expand",
    "背景は、門の中でも、そのまま");

  console.log("④ 選んだ値そのものを、書き替えていない");
  const before = JSON.stringify(eq);
  V.oldHouseKey(eq, "window", true); V.oldHouseList(eq, "garden", true);
  ok(JSON.stringify(eq) === before, "★character_equipped は、1文字も変わっていない");

  console.log("⑤ 何も置いていなくても、落ちない");
  ok(V.oldHouseKey({}, "window", true) === "window_default", "空でも、既定が出る");
  ok(V.oldHouseKey(null, "window", false) === "window_default", "null でも、落ちない");
  ok(V.oldHouseList(null, "garden", false).length === 0, "null の一覧でも、落ちない");
  ok(V.oldHouseList({ garden: "こわれた値" }, "garden", false).length === 0, "配列でない値でも、落ちない");

  console.log("⑥ ★決めが、また2か所に分かれていないか");
  const home = readRaw("components/CharacterHome.jsx");
  // ★★分類の一覧は、lib にしか無いこと。
  ok(!/const HIDDEN_WHEN_NEW_INTERIOR\s*=/.test(home),
    "分類の一覧を、画面側で持ち直していない");
  ok(/from "@\/lib\/oldHouseVisibility"/.test(home), "画面は、lib から借りている");
  // ★★門を通さずに equipped から直に読んでいないこと。★これが今回の不具合の形です。
  const RAW = /equipped\.(window|garden|scenery|wall|floor|furniture|wallhang)\b(?!Positions)/g;
  const leaks = (home.match(RAW) || []);
  ok(leaks.length === 0,
    "★門を通さずに読んでいるところが、1つも無い" + (leaks.length ? "：" + [...new Set(leaks)].join(", ") : ""));
  // ★★1行ずつ書く形に、戻っていないこと。
  ok(!/hideOldHouse\s*\?/.test(home), "★1行ずつ hideOldHouse ? … と書く形に、戻っていない");

  console.log("⑦ 新しい窓は、2枚そろって はじめて出る");
  const layer = readRaw("components/InteriorLayer.jsx");
  ok(/if \(!wardrobeOn\) return null;/.test(layer), "門の外の方には、新しい内装を1枚も出さない");
  const inter = readRaw("lib/sheepInteriorV2.js");
  ok(/if \(!frame \|\| !view\) return \[\];/.test(inter), "枠と景色が そろわなければ、1枚も出さない");
  const panel = readRaw("components/InteriorPanel.jsx");
  ok(/そろうと出ます/.test(panel), "★そろっていないときは、黙らずに、そう伝える");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
