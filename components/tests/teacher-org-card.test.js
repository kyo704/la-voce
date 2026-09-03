// 講師の役の人に出す、教室のカード（2026-09-04・案1）
//
//   ★見せるのは「自分が担当している生徒」だけです。
//     ★メンバー一覧・在籍の全体は出しません。読めませんし、要りません。
//     ★予定の作成・招待の発行・役割の変更は、オーナーと責任者だけのままです。
//   ★ポリシーは1本も変えていません。
const { readCode, readRaw } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const VT = readCode("components/VocalTracker.jsx");
const RAW = readRaw("components", "VocalTracker.jsx");

console.log("\n① 講師の役でもカードが出ること");
ok("teacher の役で絞る分岐がある", /myOrgs\.filter\(\(m\) => m\.role === "teacher"\)/.test(VT));
ok("オーナー・責任者の分岐は、そのまま残っている",
  /myOrgs\.filter\(\(m\) => m\.role === "owner" \|\| m\.role === "admin"\)/.test(VT));

console.log("\n② ★読むのは、自分の担当だけであること");
ok("fetchMyOrgAssignments がある", /async function fetchMyOrgAssignments/.test(VT));
// ★呼び出しの終わりまでを見ます。窓の幅で決めません。
const i = VT.indexOf('async function fetchMyOrgAssignments');
const 本体 = i === -1 ? "" : VT.slice(i, VT.indexOf("\n  }", i));
ok("★assignments を teacher_id = 自分 で絞っている",
  /\.eq\("teacher_id", userId\)/.test(本体));
ok("★org_id でも絞っている", /\.eq\("org_id", orgId\)/.test(本体));
ok("★終わった担当は出さない", /\.is\("ended_at", null\)/.test(本体));
ok("★memberships を読んでいない", !/from\("memberships"\)/.test(本体));
ok("★enrollments を読んでいない", !/from\("enrollments"\)/.test(本体));
ok("名前は関数から取る", /rpc\("get_org_member_names"/.test(本体));

console.log("\n③ ★別の入れ物に持つこと");
// ★orgAssignments はオーナーが教室ぜんぶを読んだ結果です。
//   ★講師には0行しか返らないので、混ぜると「担当がいない」と読み違えます。
ok("myOrgAssignments という別の state がある", /const \[myOrgAssignments, setMyOrgAssignments\]/.test(VT));
ok("★orgAssignments に書き込んでいない", !/setOrgAssignments/.test(本体));

console.log("\n④ ★運営の操作を、講師のカードに出していないこと");
// ★窓の幅で決めません。次の分岐（オーナー・責任者）までを、カードとします。
const j = RAW.indexOf('m.role === "teacher"');
const k = RAW.indexOf('m.role === "owner" || m.role === "admin"', j);
const カード = (j === -1 || k === -1) ? "" : RAW.slice(j, k);
ok("講師のカードを取り出せた（次の分岐まで）", カード.length > 500);
for (const [名, 語] of [
  ["招待コードの発行", "招待コードを発行"],
  ["★予定の作成", "handleCreateOrgEvent"],
  ["★予定の日付の変更", "handleMoveOrgEvent"],
  ["★予定の取り下げ", "handleWithdrawOrgEvent"],
  ["役割の変更", "handleChangeRole"],
  ["担当の割り当て", "handleAssignTeacherToStudent"],
  ["担当を外す", "handleUnassignTeacher"]
]) {
  ok(`★${名}を出していない`, !カード.includes(語));
}
// ★押しても通らないものを、画面に出さないこと。
//   org_events_write_admin は owner と admin だけです。
ok("★入力欄・ボタンを1つも置いていない",
  !/<input/.test(カード) && !/<button/.test(カード));

console.log("\n④-2 教室の予定は、読むだけで出すこと");
ok("予定の一覧を出している", /orgEvents\[orgId\]/.test(カード));
ok("開いたときに予定を読む", /fetchOrgEvents\(orgId\)/.test(カード));
ok("★取り下げずみも隠していない", /withdrawn_at/.test(カード));
ok("予定の追加は誰に頼むかを書いている", /オーナーか教室の責任者/.test(カード));

console.log("\n⑤ ★0件のときの言い方");
// ★「いません」と言い切らないこと。読み込めていないだけの場合と見分けがつきません。
ok("0件のときの文がある", /担当の生徒さんは、まだ登録されていません/.test(RAW));
ok("★「いません」と言い切っていない", !/担当の生徒はいません/.test(RAW));
ok("予定が0件のときの文がある", /予定は、まだ登録されていません/.test(カード));
ok("★「予定はありません」と言い切っていない", !/予定はありません。/.test(カード));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
