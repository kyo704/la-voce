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
const lib2 = readRaw("lib", "sheepInteriorV2.js");
const layer = readCode("components", "InteriorLayer.jsx");

console.log("① 場面は画面いっぱい");
ok(/\<div style=\{\{ position: "absolute", inset: 0 \}\}/.test(home),
  "★画面いっぱいの箱を使っている");

console.log("② 縦横比の 決め打ちが、どこに あるか");
// ★★2026-09-13、★床の 割合を 1か所に まとめました。
//   ★★それまで 3か所に 書いて ありました ──
//     ★InteriorLayer の 42／CharacterHome の "42%"／同 "58%"。
//   ★★この 見張りは「2か所が そろって いるか」を 見て いました。
//     ★★そろえる のでは なく、★1つに します。
//   ★★値は lib/sheepInteriorV2.js の FLOOR_BOTTOM_PCT（★2026-09-13 に 48）。
ok(/export const FLOOR_BOTTOM_PCT = \d+/.test(lib2), "★床の 割合は lib が 持つ");
ok(/const ROOM_FLOOR_BOTTOM_PCT = FLOOR_BOTTOM_PCT/.test(layer),
  "★InteriorLayer は lib から 取る");
ok(/height: `\$\{FLOOR_BOTTOM_PCT\}%`, background: floorColor/.test(home),
  "★CharacterHome の 床も lib から 取る");
ok(!/height: "42%"|height: "58%"|= 42;/.test(home + layer), "★数を 直書きして いない");

console.log("③ 画面いっぱいの 箱");
// ★★裁定 9/10夜 §3 は「画面ぜんぶが おうちに」でした。
//
//   ★★2026-09-14、★坂本さんの お決めで **縦は 比で 決める** ことに しました。
//     ★★わけ。★ながめると したくで、★箱の 比が ちがい、
//       ★家具の ％が 同じでも、★見える 場所が ずれて いました。
//     ★★比の 決まった 舞台に 載せると、★形で そろいます。
//       ★そのためには、★箱の 比も そろえる ほか ありません。
//     ★★実際に 測りました ──
//       ★箱を 端末しだいの ままに すると、★舞台が 箱を 覆い、
//       ★部屋の 横 44％ しか 見えません でした（★窓だけが 画面いっぱい）。
//
//   ★★だから 縦は 7:5 で 決めます。★横は これまでどおり 画面の 端まで。
//     ★★「画面ぜんぶ」では なくなりました。★これは お決めです。
//       ★坂本さん ──「画面が 狭く なる 代償は 許容する」。
ok(/width: "100vw", marginLeft: "calc\(50% - 50vw\)"/.test(home), "★箱は 画面の 端まで");
// ★★2026-09-14 夕、★§3 の とおりに 戻しました。
//   ★★箱は 画面ぜんぶ。★舞台は その 中に 収め、★余りを 色で 伸ばします。
//   ★★家具の ％は 舞台に 対する ％なので、★箱の 比は 関わりません。
ok(/height: "calc\(100dvh - 210px - env\(safe-area-inset-bottom\)\)"/.test(home),
  "★高さも 画面から 取る（★§3 の とおり）");

console.log("④ 画面を広げる理由が書いてある");
const raw = readRaw("components", "CharacterHome.jsx");
ok(/全画面の箱いっぱいに広げます/.test(raw), "★全画面に広げる");
ok(/壁の高さと床の長さが画面全体に追従/.test(raw), "★壁と床が追従する");

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
