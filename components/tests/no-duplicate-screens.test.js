#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★1つの 見本に、★画面は 1つ
//
//   ★出どころ 2026-09-24 ──
//     ★私は `点を入れる`（見本 `P_tenIreru`）を **2つ 作りました**。
//     ★★`components/OpsTenIreru.jsx` は 前から あり、★もう つながって いました。
//       ★そこへ `components/ScoreEntry.jsx` を 作りました。
//     ★★★「18画面」の 一覧から 作りはじめ、★**もう ある か** を 見ませんでした。
//       ★この 家の くり返す 不具合 ── ★同じ 決めが 2か所に ある ── ★その もの です。
//     ★★どちらも 見張りが 緑 でした。★1枚ずつ しか 見て いなかった からです。
//
//   ★★この 見張りが 見る こと
//     ① 1つの 見本の 名（`P_なんとか`）を、★2つ 以上の 画面が 名のって いない
//     ② `tools/screen_impl.json` の 1つの 鍵に、★画面が 2つ 以上 並んで いない
//     ③ 逆も ── ★1つの 画面が、★2つの 鍵の 持ち物に なって いない
//        （★`KoenDayFlow` は 見本 2つ ぶん です。★それは 正しい ので 除きます）
// ============================================================================
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

// ★★1つの 画面が 見本 2つ ぶん で よい もの（★わけを 書きます）。
const 兼ねてよい = {
  "components/KoenDayFlow.jsx":
    "★出演者と スタッフで 出る ものが ちがう だけ です。★決めるのは 台帳（`my_runsheet`）で、"
    + "★画面は 見せ方を 変える だけ。★2つ 作ると、★台帳と ずれる 日が 来ます。",
  "lib/myKoenDay.js": "★上の 画面の 決めを 持ちます。",
  "lib/orgSummary.js": "★半年の まとめ と はじめの 1週間 は、★どちらも 学校の ようす です。",
  "lib/lessonRound.js": "★レッスン割の 4画面が 1つの 決めを 分け合います。",
  "lib/koenExport.js": "★書き出す と 前の 公演から 写す は、★どちらも 出し入れ です。",
  "lib/monkaWay.js": "★門下の 決め方 と 担当の 先生を 選ぶ は、★同じ 決めの 表と 裏 です。",
  "lib/koenInvite.js": "★出演者を 招く と 公演の 料金 は、★同じ 段の 決めを 使います。",
  "lib/koenCast.js": "★配役 と 香盤表 は、★同じ 役・マスの 決めを 使います。",
  "lib/koenArea.js": "★公演の 運営（まとめ役）と 公演を 作る は、★同じ 公演の 決めです。"
};

// ★★★`VocalTracker.jsx` は **殻** です。★たくさんの 画面を 出します。
//   ★その 註は「どこへ 行くか」の 覚え書き で、★名のりでは ありません。
const 殻 = ["VocalTracker.jsx"];
const 部品 = fs.readdirSync(path.join(ROOT, "components"))
  .filter((f) => f.endsWith(".jsx") && !殻.includes(f));

console.log("① 1つの 見本の 名を、★2つの 画面が 名のって いない");
const 名 = {};
部品.forEach((f) => {
  const s = fs.readFileSync(path.join(ROOT, "components", f), "utf8");
  // ★★★**名のる** ところ だけ を 見ます ── ★頭の 註（`export default` より 前で、
  //   ★行の 頭から 始まる 註）です。
  //   ★★「→ `P_daihyo` へ」の ような **行き先の 話** は、★中ほどに あり、
  //     ★字下げされて います。★あれは 名のりでは ありません。
  //     ★★（★2026-09-24、★それを 数えて 5件 赤に なりました）
  const 頭 = s.slice(0, Math.max(0, s.indexOf("export default")) || s.length);
  (頭.match(/^\/\/[^\n]*見本\s+`(P_\w+)`[^\n]*/gm) || []).forEach((m) => {
    // ★★★「…の 節」は **中の 1節** です。★画面 そのもの では ありません。
    //   ★`OpsPeople` は `P_settei` の 節 11（`stPeople`）── ★設定の 中の 1つ。
    //   ★★見本の 1画面に 節が いくつも ある ことは ふつう です。
    //     ★★2つの 画面が 同じ 節を 名のって いたら、★そこが 重なり です。
    if (/の\s*節/.test(m)) return;
    const k = m.match(/`(P_\w+)`/)[1];
    (名[k] = 名[k] || []).push(f);
  });
});
t(Object.keys(名).length > 0, "★見本の 名を 名のる 画面が ある（" + Object.keys(名).length + "）");
Object.keys(名).sort().forEach((k) => {
  const 組 = Array.from(new Set(名[k]));
  t(組.length === 1, "★" + k + " ── 画面は 1つ" + (組.length > 1 ? "（" + 組.join("／") + "）" : ""));
});

console.log("\n② 1つの 鍵に、★画面が 2つ 以上 並んで いない");
const 対 = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "screen_impl.json"), "utf8"));
const 鍵 = Object.keys(対).filter((k) => !k.startsWith("_"));
t(鍵.length > 0, "★鍵が ある（" + 鍵.length + "）");
鍵.forEach((k) => {
  const 画 = (対[k] || []).filter((p) => /^components\/.*\.jsx$/.test(p));
  t(画.length <= 1, "★" + k + " ── 画面は 多くて 1つ"
    + (画.length > 1 ? "（" + 画.join("／") + "）" : ""));
});

console.log("\n③ 1つの 紙が、★2つの 鍵の 持ち物に なって いない");
const 持 = {};
鍵.forEach((k) => (対[k] || []).forEach((p) => { (持[p] = 持[p] || []).push(k); }));
Object.keys(持).sort().forEach((p) => {
  if (持[p].length <= 1) return;
  const わけ = 兼ねてよい[p];
  t(Boolean(わけ), "★" + p + " ── 2つ 以上の 鍵（" + 持[p].join("／") + "）★わけが 書いて ある");
});

console.log("\n④ 消した ものが 残って いない");
鍵.forEach((k) => (対[k] || []).forEach((p) => {
  t(fs.existsSync(path.join(ROOT, p)), "★" + k + " …… " + p + " が ある");
}));

console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
process.exit(落ち === 0 ? 0 : 1);
