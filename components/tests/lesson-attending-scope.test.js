/**
 * ★やめた 教室の「これからの レッスン」を 出さない（★Opus の 裁定・2026-09-16）。
 *
 *   ★★3つの うち、★予定 だけが 残って いました ──
 *     ★行事  … `org_events_select_member` が 在籍（active）を 見る → ★消える
 *     ★連絡  … `org_messages_select` が 受け持ち（ended_at is null）を 見る → ★止まる
 *     ★予定  … `Ops-visible lessons (org-based)` の 生徒の 枝は
 *              `auth.uid() = student_id` だけ → ★残って いた
 *
 *   ★★★台帳の 決まりは 変えません（★裁定）。
 *     ★★レッスンの 記録は **その方の もの** です。
 *       「11月20日に 高橋先生と レッスンを 受けた」は 担当の 話では ありません。
 *     ★★見本「あなたの 記録・ノート・レパートリー・ひつじは、1つも 消えません」。
 *   ★★隠すのは **これからの 分**だけ、★それも **画面の 絞り**で。
 *
 *   ★★この 見張りは **動かして** 確かめます。★字を 読むだけに しません。
 *     ★★較正 ── ★当たる はずの ものが 出る ことも 見ます（★2026-09-16 の 決まり）。
 */
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

(async () => {
  const src = fs.readFileSync(
    path.join(__dirname, "..", "..", "lib", "classroomShell.js"), "utf8");
  const mod = await import(
    "data:text/javascript;base64," + Buffer.from(src, "utf8").toString("base64"));
  const f = mod.lessonsInAttendingOrgs;

  const 未来 = new Date(Date.now() + 7 * 864e5).toISOString();
  const 過去 = new Date(Date.now() - 7 * 864e5).toISOString();
  const rows = [
    { id: "a", org_id: "org-通っている", scheduled_at: 未来 },
    { id: "b", org_id: "org-通っている", scheduled_at: 過去 },
    { id: "c", org_id: "org-やめた",   scheduled_at: 未来 },
    { id: "d", org_id: "org-やめた",   scheduled_at: 過去 },
    { id: "e", org_id: null,           scheduled_at: 未来 },  // ★個人指導
    { id: "f", org_id: "org-やめた",   scheduled_at: null }   // ★時刻が 無い
  ];
  const ids = (list) => list.map((r) => r.id).join("");

  console.log("\n=== ★較正 ── ★当たる ものが 出るか ===");
  const 絞った = f(rows, ["org-通っている"]);
  t("★★やめた 教室の これからの 分が 1件 落ちる（★較正）",
    rows.length - 絞った.length === 1);
  t("★落ちたのは c（★やめた・これから）だけ", !ids(絞った).includes("c"));

  console.log("\n=== ★通って いる 教室 ===");
  t("★これからの 分は 出る", ids(絞った).includes("a"));
  t("★済んだ 分も 出る", ids(絞った).includes("b"));

  console.log("\n=== ★やめた 教室 ===");
  t("★★これからの 分は 出ない", !ids(絞った).includes("c"));
  t("★★済んだ 分は 残る（★その方の 記録）", ids(絞った).includes("d"));
  t("★時刻の 無い 行は 残す（★消す 根拠が ない）", ids(絞った).includes("f"));

  console.log("\n=== ★個人指導（org_id が null）===");
  t("★★教室を やめても 残る", ids(f(rows, [])).includes("e"));
  t("★在籍が 0件 でも 残る", ids(f(rows, [])).includes("e"));

  console.log("\n=== ★「分からない」を「在籍が 無い」に しない ===");
  t("★null を 渡したら 何も 絞らない", f(rows, null).length === rows.length);
  t("★渡さなくても 何も 絞らない", f(rows).length === rows.length);
  t("★★これが 効かないと、★通って いる方の 予定が 黙って 消える",
    f(rows, null).length !== f(rows, []).length);

  console.log("\n=== ★呼ぶ 側 ===");
  const vt = readCode("components/VocalTracker.jsx");
  t("★VocalTracker が 使って いる", /lessonsInAttendingOrgs\(/.test(vt));
  t("★在籍を 読んで から 渡して いる",
    /from\("enrollments"\)[\s\S]{0,140}\.eq\("status", "active"\)/.test(vt));
  t("★★読めなかった ときは null を 渡す",
    /enrolled\.error\s*\n?\s*\?\s*null/.test(vt));
  t("★mergeLessons の 結果に 掛けて いる",
    /lessonsInAttendingOrgs\(\s*\n?\s*mergeLessons\(/.test(vt));

  console.log("\n=== ★台帳の 決まりを 変えて いない ===");
  const dir = path.join(__dirname, "..", "..", "supabase");
  const sqls = fs.readdirSync(dir).filter((x) => x.endsWith(".sql"));
  t("★SQL を 読めて いる（★立ち会い）", sqls.length > 0);
  const 触った = sqls.filter((x) => {
    const b = fs.readFileSync(path.join(dir, x), "utf8").replace(/--[^\n]*/g, "");
    return /create policy[\s\S]{0,200}on public\.lessons/i.test(b)
      && /enrollments/.test(b);
  });
  t("★★lessons の 決まりに 在籍を 足して いない"
    + (触った.length ? "（" + 触った.join(",") + "）" : ""), 触った.length === 0);

  console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
  process.exit(落ち === 0 ? 0 : 1);
})();
