// 更新は、必ず何行変わったかを見る（2026-09-04）
//
//   ★RLS で弾かれた更新は、★エラーになりません。
//     0行が変わって、error は null です（PostgREST の仕様）。
//   ★見ていなければ、失敗したことに誰も気づけません。
//     ★実際に #004（招待が使用済みにならない）が、その形でした。
//       画面が先生の行を更新しようとして0行に当たり、★完全に無音でした。
//
//   ★この検査は、6つの更新すべてに .select() が付いていることを見張ります。
const { readCode } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const VT = readCode("components/VocalTracker.jsx");

// ★呼び出しの終わりまでを取り出します。窓の幅で決めません（目録の3番）。
function 呼び出し(表) {
  const out = [];
  const re = new RegExp('\\.from\\("' + 表 + '"\\)', "g");
  let m;
  while ((m = re.exec(VT)) !== null) {
    const 末 = VT.indexOf(";", m.index);
    out.push(末 === -1 ? VT.slice(m.index, m.index + 600) : VT.slice(m.index, 末));
  }
  return out;
}

console.log("\n★更新している呼び出しは、すべて .select() を付けていること");
// ★2026-09-04 に直した6つの操作が対象です。
//   ★profiles には .select() の無い更新が28件あります（enrollments と link_consents に各1件）。
//     ★あれは別の話で、まだ判断をいただいていません。
//     ★docs/reports/2026-09-04-rowcount-audit.md に、そのまま並べてあります。
//     ★判断が出たら、この一覧に足してください。
const 表たち = ["teacher_student_links", "assignments", "org_events", "lessons"];
let 更新数 = 0, 抜け = [];
for (const t of 表たち) {
  for (const 塊 of 呼び出し(t)) {
    if (!/\.update\(/.test(塊)) continue;
    更新数++;
    if (!/\.select\(/.test(塊)) 抜け.push(`${t}: ${塊.replace(/\s+/g, " ").slice(0, 90)}`);
  }
}
ok(`更新している呼び出しがある（${更新数}件）`, 更新数 > 0);
ok(`★.select() が抜けている更新が無い（見つかったもの: ${抜け.length}）`, 抜け.length === 0);
抜け.forEach((x) => console.log("      " + x));

console.log("\n★0行だったときに、黙って進まないこと");
for (const [名, 語] of [
  ["解除", "★解除が0行でした"],
  ["担当外し", "★担当外しが0行でした"],
  ["予定の日付変更", "★日付の変更が0行でした"],
  ["予定の取り下げ", "★取り下げが0行でした"],
  ["レッスンの実施記録", "★実施の記録が0行でした"]
]) {
  ok(`${名}：0行のときに気づける`, VT.includes(語));
}

console.log("\n★利用者に、黙って成功したように見せないこと");
// ★解除と担当外しは、0行のときに画面へ出します。
ok("解除：0行のとき、利用者に伝える", /解除できませんでした。画面を読み込み直して/.test(VT));
ok("担当外し：0行のとき、利用者に伝える", /担当を外す権限がありません/.test(VT));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
