// 同意の門（2026-09-03）
//
//   ★撤回したあと、何が止まって、何が止まらないか。
//   ★止まらないもの（見る・書き出す・削除する）を、うっかり止めないための見張りです。
const { readCode } = require("./_source");
const fs = require("fs");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));

const src = fs.readFileSync(require("path").join(__dirname, "..", "..", "lib", "consentGate.js"), "utf8");

// ★このリポジトリのやり方にそろえます（data:text/javascript の動的 import）。
//   ★ソースをそのまま読むので、書き換えが必ず反映されます。
(async () => {
const G = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

console.log("\n① 門そのもの");
const 未撤回 = { consent_health_data_withdrawn_at: null };
const 撤回ずみ = { consent_health_data_withdrawn_at: "2026-09-03T10:00:00.000Z" };
ok("撤回していなければ、書ける", G.mayWriteRecords(未撤回) === true);
ok("★撤回したら、書けない", G.mayWriteRecords(撤回ずみ) === false);
ok("撤回していなければ、分析に使う", G.mayUseForAnalysis(未撤回) === true);
ok("★撤回したら、分析に使わない", G.mayUseForAnalysis(撤回ずみ) === false);
ok("profile が無くても落ちない", G.mayWriteRecords(null) === true && G.mayWriteRecords(undefined) === true);
ok("撤回の時刻を返す", G.withdrawnAt(撤回ずみ) === "2026-09-03T10:00:00.000Z");

console.log("\n② ★止めてはいけないものを、門に通していないこと");
const VT = readCode("components/VocalTracker.jsx");
// ★削除は、同意の状態に関わらずできます（公開中の約束）。
const 削除 = VT.slice(Math.max(0, VT.indexOf('from("entries").delete()') - 700), VT.indexOf('from("entries").delete()'));
ok("★記録の削除を、門で止めていない", !/mayWriteRecords/.test(削除));
// ★書き出しも同じです。
const 書出 = VT.indexOf("handleExportData");
const 書出本体 = 書出 === -1 ? "" : VT.slice(書出, VT.indexOf("\n  }", 書出));
ok("★書き出しを、門で止めていない", !/mayWriteRecords/.test(書出本体));

console.log("\n③ ★書き込み口が、門を見ていること");
const w = VT.indexOf("async function writeEntryRow");
const w本体 = w === -1 ? "" : VT.slice(w, VT.indexOf("\n}", w));
ok("★entries の書き込みが、門を見ている", /mayWriteRecords/.test(w本体));
const c = VT.indexOf("async function handleStartCycle");
const c本体 = c === -1 ? "" : VT.slice(c, VT.indexOf("\n  }", c));
ok("★周期の記録が、門を見ている", /mayWriteRecords/.test(c本体));

console.log("\n④ ★撤回と削除を、混ぜていないこと");
ok("★門のファイルに delete がない", !/\.delete\(/.test(src));
ok("★「消えます」と書いていない", !/消えます/.test(src));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
})();
