// 他人の profiles を、直に引いていないこと（2026-09-03・緊急）
//
//   ★何が起きたか
//     ポリシー profiles_connected_display_name（手で当てられたもの）が、
//     名前は「display_name だけ」と読めるのに、★行ごと読ませていました。
//     RLS は行単位で、列は絞れません。
//     ★allergies / regular_medications / conditions（既往症）/
//       health_notes / is_under_18 / line_user_id … 全部が読めていました。
//     ★lessons・entries に続く、今日3件目の同じ誤解です。
//
//   ★この検査が見張るのは、コードの側です。
//     「他人の profiles を直に引く書き方」が戻ってこないことを見ます。
const { readCode } = require("./_source");
const fs = require("fs");
const path = require("path");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const 根 = path.join(__dirname, "..", "..");
const VT = readCode("components/VocalTracker.jsx");
const SQL = readCode("supabase/migration_get_connected_names.sql");

console.log("\n① ★他人の行を直に引いていないこと");
// from("profiles") のあと、次に来る eq が id, userId であること。
// ★複数行に分かれるので、from から 200 文字ぶんを見ます（同じ呼び出しの中）。
const 呼び出し = [...VT.matchAll(/\.from\("profiles"\)/g)].map((m) => m.index);
ok("profiles を触る場所がある", 呼び出し.length > 0);
let 違反 = [];
for (const i of 呼び出し) {
  // ★窓の幅で決めません。その呼び出しが終わる「;」までを見ます。
  //   update の本体は長く、260文字では .eq まで届きませんでした
  //   （「窓の幅で境界を決める」— くり返す失敗の形の3番です）。
  const 末 = VT.indexOf(";", i);
  const 窓 = 末 === -1 ? VT.slice(i, i + 900) : VT.slice(i, 末);
  // update は自分の行だけ。select も自分の行だけ。
  if (!/\.eq\("id",\s*userId\)/.test(窓) && !/\.eq\("id",\s*user\.id\)/.test(窓)) {
    違反.push(VT.slice(i, i + 90).replace(/\s+/g, " "));
  }
}
ok(`★他人の行を引く書き方が無い（見つかったもの: ${違反.length}）`, 違反.length === 0);
if (違反.length) 違反.forEach((v) => console.log("      ", v));
ok("★.in(\"id\", …) で profiles を引いていない",
  !/from\("profiles"\)[\s\S]{0,200}\.in\("id"/.test(VT));

console.log("\n② 置き換えた3か所");
const rpc = [...VT.matchAll(/rpc\("get_connected_names"/g)];
ok("get_connected_names を3か所で呼んでいる", rpc.length === 3);

console.log("\n③ 関数が、決めごとを書き写していないこと");
ok("are_connected を呼んでいる", /public\.are_connected\(auth\.uid\(\), p\.id\)/.test(SQL));
// ★書き写していたら、つながりの表の名前が出るはずです。
ok("★つながりの判定を書き写していない",
  !/teacher_student_links|assignments|memberships|enrollments/.test(SQL));

console.log("\n④ 返す列が3つだけであること");
ok("戻り値の宣言が3列",
  /returns table\(id uuid, display_name text, vocal_profession text\)/.test(SQL));
for (const 列 of ["allergies", "regular_medications", "conditions", "health_notes",
                  "is_under_18", "line_user_id", "occupation", "email"]) {
  ok(`★${列} を返していない`, !new RegExp("p\\." + 列).test(SQL));
}

console.log("\n⑤ 関数の守り");
ok("security definer である", /security definer/.test(SQL));
ok("★search_path を固定している", /set search_path = public/.test(SQL));
ok("★ログインしていなければ0行", /if auth\.uid\(\) is null then\s*return;/.test(SQL));
ok("★自分自身は返さない（道を2つにしない）", /p\.id <> auth\.uid\(\)/.test(SQL));
ok("anon から実行できない", /revoke all on function public\.get_connected_names\(uuid\[\]\) from public, anon/.test(SQL));
ok("authenticated にだけ許す", /grant execute on function public\.get_connected_names\(uuid\[\]\) to authenticated/.test(SQL));

console.log("\n⑥ get_org_member_names と混ぜていないこと");
// ★別の問いです。「同じ教室にいるか」と「つながっているか」は違います。
ok("別のファイルにある", fs.existsSync(path.join(根, "supabase", "migration_org_member_names.sql")));
ok("★get_connected_names の中で org を見ていない", !/org_id/.test(SQL));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
