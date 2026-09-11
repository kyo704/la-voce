// ============================================================================
// 部屋の 場面は、画面いっぱい（★2026-09-11・実機の ご報告）
//
//   ★★何が 起きていたか。
//     ★したく（★4：3 の 箱）では 正しく、★閉じると 崩れました。
//       ・天井が 異常に 高く なる
//       ・窓が すごく 上の ほうへ 行く
//     ★★ふだんの 箱は 100vw ×（100dvh − 210px）です。
//       ★iPhone で およそ 414 × 686 ── ★縦横比 0.60。
//       ★したくの 4：3（1.33）とは 2倍以上 ちがいます。
//     ★★中の 置き場所は ぜんぶ ％です。★％は 箱の 形に ついていきます。
//
//   ★★以前の「きょうの 羊の 大きさ」も 同じ 形でした（★寸法が 連なって ずれる）。
//     ★坂本さんが「同じ 種類では ないか」と 言われ、★そのとおりでした。
//
//     ★★直し方 ── ★箱も場面も画面いっぱいにし、
//     ★床を下34%、壁を上66%として部屋を広げます。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

const home = readCode("components", "CharacterHome.jsx");
const layer = readCode("components", "InteriorLayer.jsx");

console.log("① 場面は画面いっぱい");
ok(/\<div style=\{\{ position: "absolute", inset: 0 \}\}/.test(home),
  "★画面いっぱいの箱を使っている");

console.log("② 縦横比の 決め打ちが、どこに あるか");
ok(/ROOM_FLOOR_BOTTOM_PCT = 34/.test(layer), "★床は 高さの 34%");
// ★★CharacterHome の 床も 同じ 34% で あること。★2か所に ある 数です。
ok(/height: "34%", background: floorColor/.test(home), "★部屋の 床も 34%");

console.log("③ 画面いっぱいの 箱は そのまま");
// ★★裁定 9/10夜 §3「画面ぜんぶが おうちに」。★箱は 狭めません。
ok(/width: "100vw", marginLeft: "calc\(50% - 50vw\)"/.test(home), "★箱は 画面の 端まで");
ok(/height: "calc\(100dvh - 210px - env\(safe-area-inset-bottom\)\)"/.test(home),
  "★高さも 画面から 取る");

console.log("④ 画面を広げる理由が書いてある");
const raw = readRaw("components", "CharacterHome.jsx");
ok(/全画面の箱いっぱいに広げます/.test(raw), "★全画面に広げる");
ok(/壁の高さと床の長さが画面全体に追従/.test(raw), "★壁と床が追従する");

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
