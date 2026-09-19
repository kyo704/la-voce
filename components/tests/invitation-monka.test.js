// ============================================================================
// ★見張り ── ★合言葉に 門下を 持たせる（★裁定 その83 訂正・2026-09-18）
//
//   ★★★きょう、★私が 欠けを 作りました。
//     ★★名簿の「＋ 招く」は `teacher_id` に **押した 方**（学長など）を 入れます。
//     ★★受け取りの 道は、★その `teacher_id` で 受け持ちを 作って いました。
//     ★★★つまり ── ★学長が 招いた 生徒の 先生が、★学長に なります。
//   ★★「誰が 出したか」と「どの 門下か」は 別の こと です。★分けました。
//
//   ★★測る のは 4つ です（★裁定 その83 の VERIFY）。
//     ★一 ★受け持ちは `monka_teacher_id` から 作る（★`teacher_id` から では ない）
//     ★二 ★Q1 ── ★その 先生が、★その 学校に いるか を 見て いる
//     ★三 ★Q2 ── ★二重に 作らない
//     ★四 ★出す 側 ── ★先生の 道は 自分、★名簿の 道は 未定
// ============================================================================

const assert = require("assert");
const { readCode, readRaw } = require("./_source");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

const 道 = readCode("app", "api", "enrollment", "accept", "route.js");
const 生道 = readRaw("app", "api", "enrollment", "accept", "route.js");
const 本体 = readCode("components", "VocalTracker.jsx");
const 紙 = readCode("supabase", "migration_invitation_monka.sql");

// ------------------------------------------------------------------------
// ★一 ★受け持ちの 先生
// ------------------------------------------------------------------------
ok(/monka_teacher_id/.test(道), "受け取りの 道が monka_teacher_id を 読む");
// ★★★2026-09-19 ── ★招く ときの 学年・学科も 読む ように なりました。
//   ★★取る 列を 字 そのままで 見て いたので、★増えた 日に 落ちました。
//   ★★★「どの 列を 取って いるか」を 1つずつ 見ます。
ok(/\.select\("code, teacher_id, org_id, monka_teacher_id/.test(道),
  "招待を 引く ときに、★門下の 先生も 取る");
["grade_year", "division_id"].forEach((c) => {
  ok(new RegExp('\\.select\\("[^"]*' + c).test(道),
    "★招く ときの " + c + " も 取る（★2026-09-19）");
});
ok(/teacher_id: assignTo/.test(道), "受け持ちは assignTo で 作る");
ok(!/teacher_id: invitation\.teacher_id/.test(道),
  "★出した 方を、★受け持ちの 先生に して いない");

// ★★門下が 無い ときは 作らない。
ok(/reason: "no_monka"/.test(道), "門下が 無ければ 受け持ちを 作らない");

// ------------------------------------------------------------------------
// ★二 ★Q1 ── ★その 学校に いるか
// ------------------------------------------------------------------------
ok(/from\("memberships"\)[\s\S]{0,200}eq\("org_id", orgId\)[\s\S]{0,120}eq\("user_id", monkaTeacher\)/.test(道),
  "★門下の 先生が、★その 学校に いるかを 見て いる");
ok(/reason: "monka_not_in_org"/.test(道),
  "いない ときの わけを 返す（★黙って 作らない、では ない）");

// ------------------------------------------------------------------------
// ★三 ★Q2 ── ★二重に 作らない
// ------------------------------------------------------------------------
ok(/existingAssignment/.test(道), "先に ある かを 見て いる");
ok(/is\("ended_at", null\)/.test(道), "閉じた 受け持ちは 数に 入れない");

// ------------------------------------------------------------------------
// ★四 ★出す 側
// ------------------------------------------------------------------------
//   ★★先生の 道 …… ★門下は ご自分。
//   ★★名簿の 道 …… ★門下は 未定（null）。
const 先生の道 = 本体.slice(本体.indexOf("handleGenerateTeacherInvite"),
  本体.indexOf("handleGenerateTeacherInvite") + 1600);
ok(/monka_teacher_id: userId/.test(先生の道),
  "先生が 招く ときは、★門下は ご自分");
const 名簿の道 = 本体.slice(本体.indexOf("handleInviteStudentToOrg"),
  本体.indexOf("handleInviteStudentToOrg") + 1600);
ok(/monka_teacher_id: null/.test(名簿の道),
  "★名簿から 招く ときは、★門下を 決めない");

// ------------------------------------------------------------------------
// ★紙 ── ★昔の 行の 扱い
// ------------------------------------------------------------------------
ok(/add column if not exists monka_teacher_id/.test(紙), "列を 足して いる");
ok(/references auth\.users\(id\)/.test(紙),
  "★先生の 番号（auth.users）を 指して いる");
ok(!/assignments_group/.test(紙),
  "★無い 表（assignments_group）を 指して いない");
ok(/where monka_teacher_id is null\s*\n\s*and used_at is null/.test(紙),
  "★まだ 使って いない 行 だけ 埋める（済んだ ことを 書き換えない）");

// ★★わけが、★その 場に 書いて ある。
ok(/学長が 生徒の 先生に なります/.test(生道),
  "なぜ 分けたかが、★受け取りの 道に 書いて ある");

console.log("\n★" + 数 + "件 通りました ── 合言葉に 門下を 持たせる");
