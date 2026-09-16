/**
 * ★教室を やめる ── ★決まり では なく、関数で 閉じる。
 *
 *   ★★2026-09-16。★実機で、★やめた はずの 教室が 一覧に 残りました。
 *     ★★PostgREST の `update` は、★0行に 当たっても 誤りを 返しません。
 *
 *   ★★私は はじめ「UPDATE の 決まりを 足す」と 書きました。★誤り でした。
 *     ★★RLS は **行**に 効きます。★**列**には 効きません。
 *       ★決まりを 足すと、★在籍行の ぜんぶの 列が 書けます。
 *   ★★`leave_enrollment`（security definer）に 閉じます。
 *
 *   ★★この 見張りが 守る こと ──
 *     ① 画面が `enrollments` を **直に** 書き換えて いない
 *     ② `leave_enrollment` を 呼んで いる
 *     ③ 返り値（行数）を 見て いる ── ★0を 失敗に して いる
 *     ④ `enrollments` に UPDATE の 決まりを 足して いない
 *     ⑤ 入り直しの とき `left_at` を 戻して いる
 */
const { stripComments, readCode, readRaw } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

const vt = readCode("components/VocalTracker.jsx");
const vtRaw = readRaw("components/VocalTracker.jsx");
const sql = readRaw("supabase/migration_leave_enrollment.sql");
const accept = readCode("app/api/enrollment/accept/route.js");

console.log("\n=== ① 画面から enrollments を 直に 書き換えない ===");
// ★★`grade_label` の 書き込みは 残します（★名簿・引き金で 守って います）。
//   ★★禁じるのは **やめる**の 2列 だけ です。
t("★★status を 画面から 直に 書いて いない",
  !/\.from\(\s*"enrollments"\s*\)[\s\S]{0,200}\.update\(\s*\{[^}]*status:/.test(vt));
t("★★left_at を 画面から 直に 書いて いない",
  !/\.from\(\s*"enrollments"\s*\)[\s\S]{0,200}\.update\(\s*\{[^}]*left_at:/.test(vt));
t("★enrollments を 画面から 消して いない",
  !/\.from\(\s*"enrollments"\s*\)[\s\S]{0,200}\.delete\(/.test(vt));

console.log("\n=== ② 関数を 呼んで いる ===");
t("★rpc('leave_enrollment') を 呼んで いる",
  /rpc\(\s*"leave_enrollment"\s*,\s*\{\s*p_org_id/.test(vt));

console.log("\n=== ③ 返り値（行数）を 見て いる ===");
const 体 = (() => {
  const 始 = vt.indexOf("async function leaveOrgNow");
  if (始 < 0) return "";
  return vt.slice(始, 始 + 1400);
})();
t("leaveOrgNow が ある", 体.length > 0);
t("★誤りを 見て いる", /if\s*\(\s*error\s*\)/.test(体));
t("★★0行を 失敗に して いる", /if\s*\(\s*!data\s*\)/.test(体));
t("★0行の とき false を 返す",
  体.indexOf("if (!data)") >= 0 &&
  体.indexOf("return false", 体.indexOf("if (!data)")) >= 0);

console.log("\n=== ④ enrollments に UPDATE の 決まりを 足して いない ===");
const fs = require("fs");
const path = require("path");
const sqlDir = path.join(__dirname, "..", "..", "supabase");
const sqlFiles = fs.readdirSync(sqlDir).filter((f) => f.endsWith(".sql"));
t("★SQL の ファイルを 読めて いる（★立ち会い）", sqlFiles.length > 0);
const 決まりを足したファイル = sqlFiles.filter((f) => {
  const body = fs.readFileSync(path.join(sqlDir, f), "utf8")
    .replace(/--[^\n]*/g, "");
  return /create policy[\s\S]{0,300}on public\.enrollments[\s\S]{0,120}for update/i.test(body)
    || /create policy[\s\S]{0,300}on public\.enrollments[\s\S]{0,120}for all/i.test(body);
});
t("★★enrollments に UPDATE の 決まりを 足して いない"
  + (決まりを足したファイル.length ? "（" + 決まりを足したファイル.join(",") + "）" : ""),
  決まりを足したファイル.length === 0);
t("★決まりを足す案の ファイルは 消えて いる",
  !sqlFiles.includes("migration_enrollments_leave_policy.sql"));

console.log("\n=== ⑤ 関数の 形 ===");
t("★security definer", /security definer/i.test(sql));
t("★★返り値は 行数（integer）── void では ない",
  /returns integer/i.test(sql) && !/returns void/i.test(sql));
t("★student_id で 絞る（★user_id では ない）",
  /student_id = auth\.uid\(\)/.test(sql));
// ★★注記を 外して から 見ます ── ★この ファイルの 注記は
//   ★「user_id では ない」と **書いて** います。★素の まま 探すと、
//   ★自分の 説明に 引っかかります（★この 蔵で 2度 やりました）。
const sqlCode = sql.replace(/--[^\n]*/g, "");
t("★★実行される SQL に user_id が 出て こない", !/user_id/.test(sqlCode));
t("★active の 行だけ 直す", /status = 'active'/.test(sql));
t("★anon から 取り上げて いる", /revoke all on function public\.leave_enrollment/.test(sql));
t("★authenticated にだけ 渡して いる",
  /grant execute on function public\.leave_enrollment\(uuid\) to authenticated/.test(sql));
t("★★この ファイルで UPDATE の 決まりを 作って いない",
  !/create policy/i.test(sql));

console.log("\n=== ⑥ 入り直し ── left_at を 戻す ===");
t("★upsert で left_at を null に 戻して いる",
  /upsert\(\s*\{[^}]*left_at:\s*null/.test(accept));
t("★org_id,student_id で 束ねて いる",
  /onConflict:\s*"org_id,student_id"/.test(accept));

console.log("\n=== ⑦ 受け持ちも 同じ 取引で 閉じる（★裁定 第2版）===");
t("★assignments を 閉じて いる", /update public\.assignments[\s\S]{0,120}set ended_at = now\(\)/.test(sql));
t("★自分の 行だけ", /update public\.assignments[\s\S]{0,200}student_id = auth\.uid\(\)/.test(sql));
t("★その 教室だけ", /update public\.assignments[\s\S]{0,240}org_id = p_org_id/.test(sql));
t("★開いて いる 分だけ", /update public\.assignments[\s\S]{0,280}ended_at is null/.test(sql));
t("★★行を 消して いない", !/delete from public\.assignments/i.test(sqlCode));
// ★★数えるのは 在籍の ほう。★`get diagnostics` は 直前の 文を 見ます。
//   ★★受け持ちの update の あとに 置くと、★受け持ちの 数に なります。
//     ★★先生が 付いて いない 方で 0 が 返り、★やめられたのに 失敗に 見えます。
t("★★行数は 在籍の すぐ あとで 取って いる",
  sqlCode.indexOf("get diagnostics") > sqlCode.indexOf("update public.enrollments")
  && sqlCode.indexOf("get diagnostics") < sqlCode.indexOf("update public.assignments"));
t("★★1つの 取引（★関数の 中で ひと続き）",
  !/commit|begin;/i.test(sqlCode));

console.log("\n=== ⑧ 入り直し ── 閉じた 受け持ちを 数に 入れない ===");
t("★★ended_at is null で しらべて いる",
  /\.eq\("student_id", user\.id\)[\s\S]{0,900}\.is\("ended_at", null\)[\s\S]{0,60}\.limit\(1\)/.test(accept));

console.log("\n=== ⑨ 写しが 残って いない ===");
t("★handleLeaveOrg は 消えて いる", !/function handleLeaveOrg/.test(vt));
t("★消した ことを 書き残して いる", /handleLeaveOrg/.test(vtRaw));

console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
process.exit(落ち === 0 ? 0 : 1);
