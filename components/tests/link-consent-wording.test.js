// 先生とつながる画面の文言（2026-09-03・v2）
//
//   ★なぜ要るか
//     v1 の「あなたの記録の中身は、先生には見えません」は、
//     ★範囲が書かれていないため、読む人は「体調のこと全部」と受け取ります。
//     ところが profiles の行（既往症・常用薬・health_notes ほか）は、
//     ポリシーの誤りにより、つながっている相手から読める状態でした。
//     ★約束は破れます。無い仕組みは破れません。
//     だから「見えません」ではなく「仕組みは、ありません」と書きます。
const { readCode, readRaw } = require("./_source");
const fs = require("fs");
const path = require("path");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const 根 = path.join(__dirname, "..", "..");
const 取込 = (p) => import("data:text/javascript;base64," +
  Buffer.from(fs.readFileSync(path.join(根, p), "utf8")).toString("base64"));

(async () => {
  const L = await 取込("lib/linkConsent.js");
  // ★画面の文はコメントではないので、生のまま見ます。
  const VT = readRaw("components", "VocalTracker.jsx");
  // ★禁じた言い回しの検査は、コメントを外してから。
  //   説明のためのコメントに、その言葉が出てくるからです（6回かかった罠）。
  const VTcode = readCode("components/VocalTracker.jsx");

  console.log("\n① 版が上がっていること");
  ok("版は link-2026-09-03", L.LINK_AGREEMENT_VERSION === "link-2026-09-03");
  // ★v1 を消していないこと。誰が何に同意したかを答えるために要ります。
  const 記録 = readRaw("lib", "linkConsent.js");
  ok("★v1 の文面が残っている", /v1（2026-09-01）/.test(記録) &&
    /あなたの記録の中身は、先生には見えません/.test(記録));
  ok("★v2 の文面も記録されている", /v2（2026-09-03）/.test(記録));
  ok("★再同意を求めない判断が書かれている", /再同意は求めません/.test(記録));

  console.log("\n② 画面に、案A の文が出ていること");
  ok("渡るものを先に書いている", /先生に伝わるのは、あなたの表示名と職業だけです/.test(VT));
  ok("★「仕組みは、ありません」と書いている",
    /日々の記録（体調・声・睡眠・食事・メモなど）を先生が見る仕組みは、ありません/.test(VT));
  ok("周期にも触れている", /周期の記録も同じです/.test(VT));
  ok("解除できることを書いている", /つながりの解除は、いつでもできます/.test(VT));

  console.log("\n③ ★強すぎる言い回しを使っていないこと");
  ok("禁じた一覧がある", Array.isArray(L.FORBIDDEN_LINK_PHRASES) &&
    L.FORBIDDEN_LINK_PHRASES.length >= 5);
  // ★この画面の文だけを切り出して見ます。ファイル全体では、
  //   ほかの機能の正しい文（「はっきりした関係は見えませんでした」など）に当たります。
  const 始 = VTcode.indexOf("つながると、この先生とレッスンの予定を一緒に見られるようになります");
  ok("画面の文を取り出せた", 始 !== -1);
  const 画面 = 始 === -1 ? "" : VTcode.slice(始, 始 + 400);
  for (const 語 of L.FORBIDDEN_LINK_PHRASES) {
    ok(`★この画面で「${語}」を使っていない`, !画面.includes(語));
  }

  console.log("\n④ ★古い文が残っていないこと");
  ok("v1 の文が画面に出ていない",
    !new RegExp("<p[^>]*>[^<]*あなたの記録の中身は、先生には見えません").test(VT));

  console.log("\n⑤ ★文と仕組みが、いっしょに動くこと");
  // 「先生が見る仕組みは、ありません」は、いま事実です。
  // ★どちらかを戻したら、この検査が落ちて気づけます。
  ok("★get_student_entries を呼んでいない", !/get_student_entries/.test(VTcode));
  ok("★他人の entries を読んでいない",
    !/from\("entries"\)[\s\S]{0,200}\.neq\("user_id"|from\("entries"\)[\s\S]{0,200}\.in\("user_id"/.test(VTcode));
  ok("★他人の profiles を直に読んでいない", !/from\("profiles"\)[\s\S]{0,200}\.in\("id"/.test(VTcode));
  ok("★profiles への埋め込み結合が無い", !/select\("[^"]*profiles!/.test(VTcode));

  console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
  process.exit(否 ? 1 : 0);
})();
