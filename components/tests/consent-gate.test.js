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

console.log("\n⑤ ★門が読む列が、select に入っていること");
// ★2026-09-03 の不具合：撤回の列を select に入れ忘れていました。
//   ★取ってこない列は undefined で、★undefined || null は null です。
//   ★つまり「撤回していない」と同じ形になり、★読み込み直すと門が開きました。
//   ★「書いた値は読まれているか」の★裏返しです。
//     ★読む値は、どこかで取ってこられているか。
const cols = (VT.match(/const PROFILE_BASE_COLUMNS = "([^"]+)"/) || [])[1] || "";
const consentCols = (VT.match(/const PROFILE_CONSENT_COLUMNS = "([^"]+)"/) || [])[1] || "";
const 全列 = (cols + ", " + consentCols).split(",").map((x) => x.trim());
// ★lib/consentGate.js が読む profile の列を、そのまま拾います。
const 門が読む列 = [...new Set(
  (src.match(/profile(?:\s*&&\s*profile)?\.(\w+)/g) || []).map((m) => m.split(".")[1])
)];
ok(`門が読む列を拾えた（${門が読む列.join(", ")}）`, 門が読む列.length > 0);
門が読む列.forEach((c) => {
  ok(`★${c} が select に入っている`, 全列.includes(c));
});
// ★足すときは本体に直に足さないこと。列が無い環境で全部読めなくなります。
ok("★同意の列は、別の組にしてある", /PROFILE_CONSENT_COLUMNS/.test(VT));
ok("★列が無いときに読み直す道がある", /プロフィール（同意の列を除く）の取得/.test(VT));
ok("★読めなかったことを覚えている", /consent_column_missing/.test(VT));

console.log("\n⑥ ★フォームの保存が、同意の状態を巻き戻さないこと");
const i2 = VT.indexOf("async function handleSaveProfile");
const 保存 = i2 === -1 ? "" : VT.slice(i2, VT.indexOf("\n  }", VT.indexOf("setProfileDraft(null)", i2)));
ok("★draft を丸ごと画面へ戻していない", !/setProfile\(\(p\) => \(\{ \.\.\.p, \.\.\.draft \}\)\)/.test(保存));
ok("★同意の列を除いてから戻している", /consent_health_data_withdrawn_at,/.test(保存));

console.log("\n⑦ ★再同意の結果が、画面に出ること");
const i3 = VT.indexOf("async function handleRegrantHealthConsent");
const 再同意 = i3 === -1 ? "" : VT.slice(i3, VT.indexOf("\n  }", i3));
ok("★失敗を画面に出す", /setRegrantMessage\("同意できませんでした/.test(再同意));
ok("★成功も画面に出す", /setRegrantMessage\("同意しました/.test(再同意));
ok("★二度押しを止める", /if \(regrantBusy\) return/.test(再同意));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
})();
