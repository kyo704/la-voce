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
const { readCode, loadLib } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

(async () => {
  // ★★`@/lib/…` の 別名を 解いて から 読み込みます（★`loadLib`・1か所）。
  const mod = await loadLib("lib", "classroomShell.js");
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
  // ★★★2026-09-18、★数える 場所を 直しました。
  //   ★★もと ── ★「`lessons` の 決まりを 作る 紙に、★`enrollments` の 字が あるか」。
  //   ★★★紙 まるごと を 見て いました。★裁定 その86 の 紙は、
  //     ★★同じ 紙の 中で **門の 関数**（在籍を 見ます）も 作ります。
  //     ★★それで 落ちました。★生徒の 枝は 1文字も 変わって いません。
  //   ★★★守りたい のは「**生徒 自身の 枝**に 在籍を 足さない」こと です。
  //     ★★レッスンの 記録は その方の もの です（★2026-09-16 の 裁定）。
  //     ★★やめた あとも、★済んだ 分は 見られます。
  //   ★★だから、★決まりの **式** を 見ます。★紙 まるごと では ありません。
  const 枝 = [];
  sqls.forEach((x) => {
    const b = fs.readFileSync(path.join(dir, x), "utf8").replace(/--[^\n]*/g, "");
    [...b.matchAll(/create policy[^;]*?on public\.lessons[^;]*;/gis)].forEach((m) => {
      const 式 = m[0];
      if (!/auth\.uid\(\) = student_id/.test(式)) return;
      // ★★生徒の 枝の まわり 120字 に、★在籍の 字が ないこと。
      const i = 式.search(/auth\.uid\(\) = student_id/);
      const 近く = 式.slice(Math.max(0, i - 120), i + 120);
      if (/enrollments|status = 'active'/.test(近く)) 枝.push(x);
    });
  });
  t("★★生徒 自身の 枝に 在籍を 足して いない"
    + (枝.length ? "（" + 枝.join(",") + "）" : ""), 枝.length === 0);
  // ★★道具の 較正 ── ★わざと 足した 1件が 見つかる こと。
  const 悪い = "create policy x on public.lessons for select using (auth.uid() = student_id"
    + " and exists (select 1 from enrollments));";
  const j = 悪い.search(/auth\.uid\(\) = student_id/);
  t("★わざとの 1件を 見つけられる（★較正）",
    /enrollments/.test(悪い.slice(Math.max(0, j - 120), j + 120)));

  console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
  process.exit(落ち === 0 ? 0 : 1);
})();
