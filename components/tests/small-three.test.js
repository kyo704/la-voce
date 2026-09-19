#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★小口 3件（★2026-09-19）
//
//   ★① 招く ときの 学年・学科 …… ★台帳に 写る こと（★画面だけ の 飾りに しない）
//   ★② 開いた 記録 …… ★学校ぜんぶ を 表に する。★中身は 残さない
//   ★③ 確かめ …… ★誰が いつ 確かめたかを 残す
//
//   ★★★較正 ── ★わざと 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

const ROOT = path.join(__dirname, "..", "..");
const SQL = path.join(ROOT, "supabase", "migration_small_three.sql");
if (!fs.existsSync(SQL)) {
  console.log("★★ありません: supabase/migration_small_three.sql");
  console.log("　★数えません。★止まります。");
  process.exit(1);
}
const 素 = fs.readFileSync(SQL, "utf8")
  .split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
const 蔵 = readCode("components", "VocalTracker.jsx");
const 名簿 = readCode("components", "OpsRoster.jsx");
const 連絡 = readCode("components", "Renraku.jsx");
const ひと = readCode("components", "OpsPeople.jsx");
const 受け = readCode("app/api/enrollment/accept", "route.js");

見る("道具の 較正", () => {
  assert.ok(/grade_year/.test(素), "★道具が 壊れて います");
  assert.ok(!/ありえない列/.test(素), "★道具が 壊れて います");
});

見る("① 招く ときの 学年・学科 ── ★台帳に 列が ある", () => {
  assert.ok(/teacher_invitations add column if not exists grade_year int/.test(素),
    "★学年の 列が ありません");
  assert.ok(/add column if not exists division_id uuid references public\.org_divisions/
    .test(素), "★学科の 列が ありません");
});

見る("① 招く ときの 決めが、★入った ときに 写る", () => {
  // ★★読んで いる こと。★読まないと 写せません。
  assert.ok(/grade_year, division_id/.test(受け), "★招待から 読んで いません");
  // ★★写して いる こと。
  assert.ok(/grade_year: invitation\.grade_year/.test(受け), "★学年を 写して いません");
  assert.ok(/division_id: invitation\.division_id/.test(受け), "★学科を 写して いません");
  // ★★★決めて いない ときは 触らない こと（★入り直しで 消さない）。
  assert.ok(/invitation\.grade_year != null \?/.test(受け),
    "★決めて いない ときに 空で 上書き します");
});

見る("① 合言葉は、★決めた あとに 作る（★2026-09-19・実機の ご報告）", () => {
  // ★★★きょうまで、★決める 前から 合言葉が 出て いました。
  //   ★★前に 作った ものが、★画面に 残った まま だった からです。
  //   ★★★開く → 決める → 作る の 順に しました。
  assert.ok(/inviteOpen/.test(名簿), "★開いて いるかを 持って いません");
  assert.ok(/setInviteOpen\(true\); if \(onCloseInvite\) onCloseInvite\(\)/.test(名簿),
    "★開く ときに 前の 合言葉を 消して いません");
  // ★★選び直したら 消す こと（★その 合言葉は 古い 決めを 持って います）。
  const i = 名簿.indexOf("setInviteAim((v) =>");
  assert.ok(/onCloseInvite\(\)/.test(名簿.slice(i, i + 700)),
    "★選び直しても 合言葉が 残ります");
  // ★★★両方 選んで から 作ります（★2026-09-19・2度目の ご報告）。
  //   ★★片方 だけ でも 作れて いました。
  assert.ok(/disabled=\{!\(inviteAim\.gradeYear && inviteAim\.divisionId\)\}/.test(名簿),
    "★片方 だけ でも 作れます");
  // ★★決めずに 作る 道は 残します（★決めなくて よい、は 変えません）。
  assert.ok(/決めずに 作る/.test(名簿), "★決めずに 作る 道が ありません");
  assert.ok(/onInvite\(\s*\{ gradeYear: null, divisionId: null \}\)/.test(名簿),
    "★決めずに 作る が、★選んだ ものを 持って いきます");
  // ★★いま 何が 決まって いるかを 出す。
  assert.ok(/いま …… 学年/.test(名簿), "★いまの 決めを 出して いません");
  // ★★合言葉の 札は、★1枚を 開いて いる ときだけ 出す。
  assert.ok(/\(inviteCode \|\| inviteError\) && inviteOpen/.test(名簿),
    "★閉じて いても 合言葉が 出ます");
});

見る("① 画面から 決めを 渡して いる", () => {
  assert.ok(/onInvite\(inviteAim\)/.test(名簿), "★画面が 決めを 渡して いません");
  assert.ok(/grade_year: \(決め && 決め\.gradeYear\) \|\| null/.test(蔵),
    "★蔵が 決めを 書いて いません");
  assert.ok(/division_id: \(決め && 決め\.divisionId\) \|\| null/.test(蔵),
    "★学科を 書いて いません");
});

見る("② 開いた 記録 ── ★学校ぜんぶ を 出す", () => {
  assert.ok(/readsAll/.test(連絡), "★画面に ありません");
  assert.ok(/fetchRenrakuReadsAll/.test(蔵), "★読んで いません");
  assert.ok(/\.eq\("org_id", orgId\)/.test(
    蔵.slice(蔵.indexOf("fetchRenrakuReadsAll"), 蔵.indexOf("fetchRenrakuReadsAll") + 800)),
    "★学校で 絞って いません");
  // ★★★何を 読んだかは 残しません。★列ごと ありません。
  assert.ok(!/what_read|read_body|content/.test(連絡), "★中身を 出して います");
  assert.ok(/何を読んだかは 残しません/.test(連絡), "★その 断りが ありません");
});

見る("③ 確かめ ── ★誰が いつ を 残す", () => {
  assert.ok(/memberships add column if not exists verified_at timestamptz/.test(素),
    "★いつ の 列が ありません");
  assert.ok(/add column if not exists verified_by uuid/.test(素), "★誰が の 列が ありません");
  assert.ok(/onVerify/.test(ひと), "★画面に ありません");
  const i = 蔵.indexOf("async function handleVerifyMembership");
  const 手 = 蔵.slice(i, i + 1200);
  assert.ok(/verified_by: userId/.test(手), "★誰が を 書いて いません");
  assert.ok(/data\.length === 0/.test(手), "★0行を 成功に して います");
  // ★★役職の できことを 持つ 方 だけ。
  assert.ok(/onVerify=\{canOps\(gate, "post"\)/.test(蔵), "★門が ちがいます");
});

見る("③ 確かめて いない ときだけ 出す", () => {
  assert.ok(/!target\.verified_at/.test(ひと), "★いつも 出して います");
  assert.ok(/確かめました/.test(ひと), "★確かめた あとの 字が ありません");
});

console.log("\n★" + 数 + "つ 通りました。");
