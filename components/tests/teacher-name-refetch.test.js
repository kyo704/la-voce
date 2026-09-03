// 先生の名前を、つながりが変わったあとに読み直すこと（2026-09-04）
//
//   ★不具合の形：関数 get_my_teacher_names は本番で正しく名前を返していました。
//     壊れていたのは呼ぶ側です。処理が useEffect の中に直に書いてあり、
//     ★[userId] でしか走らない＝画面を開いたときの一度きりでした。
//     招待を受けてつながっても、名前の対応表は「つながる前」のまま＝空。
//     つながりの一覧だけが増えるので「名前未設定の先生と連携中」と出ました。
//
//   ★同じ形（画面を開いたときの一度きり）を、また作らないための見張りです。
const { readCode } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const VT = readCode("components/VocalTracker.jsx");

console.log("\n① 名前のある関数になっていること");
ok("fetchMyTeacherNames がある", /async function fetchMyTeacherNames\(\)/.test(VT));
// ★useEffect の中に直に rpc を書き戻さないこと。
const 直書き = /useEffect\(\(\) => \{[\s\S]{0,400}?rpc\("get_my_teacher_names"\)/.test(VT);
ok("★useEffect の中に直に書いていない", !直書き);

console.log("\n② ★つながりが変わる場所から、呼ばれていること");
const 回数 = (VT.match(/fetchMyTeacherNames\(\)/g) || []).length;
// 定義1・useEffect1・受け入れ1・解除1 ＝ 4回以上
ok(`fetchMyTeacherNames が4か所以上に出る（いま ${回数}）`, 回数 >= 4);

// ★招待を受け入れたあと。ここを落とすと、不具合がそのまま戻ります。
const a = VT.indexOf('rpc("accept_teacher_invitation"');
const 受け入れ後 = a === -1 ? "" : VT.slice(a, VT.indexOf("\n  function handleDeclineInvitation", a));
ok("★受け入れたあとに呼んでいる", /fetchMyTeacherNames\(\)/.test(受け入れ後));
ok("つながりの一覧も読み直している", /fetchTeacherLinks\(\)/.test(受け入れ後));

// ★解除したあと。対応表に、解除した先生を残さないため。
const r = VT.indexOf("async function handleRevokeLink");
const 解除 = r === -1 ? "" : VT.slice(r, VT.indexOf("\n  async function fetchTeacherLinks", r));
ok("★解除したあとにも呼んでいる", /fetchMyTeacherNames\(\)/.test(解除));

console.log("\n③ ★対応表は入れ替えること（積み増しにしないこと）");
const f = VT.indexOf("async function fetchMyTeacherNames()");
const 本体 = f === -1 ? "" : VT.slice(f, VT.indexOf("\n  }", f));
ok("★setMyTeacherNames に prev を渡していない", !/setMyTeacherNames\(\(prev\)/.test(本体));
ok("teacher_id を鍵にしている", /map\[t\.teacher_id\] = t/.test(本体));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
