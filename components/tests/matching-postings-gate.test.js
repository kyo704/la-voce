#!/usr/bin/env node
/**
 * ★募集（postings）の 見張り（★裁定 その122・2026-09-21）。
 *
 *   ★★★守りたいのは 3つ ──
 *     ★① 門は「自分の 募集 だけ」。★よそは 関数 1本 を 通る。
 *     ★② その 関数は 3つで 絞る（ご本人・学校・切れて いない）。
 *     ★③ 載せない ものを **列に して いない**（★裁定 その94 §4g never_show）。
 *
 *   ★★数を 覚えません。★構えを 見ます。
 *   ★★較正 ── ★故意に 1件 該当を 作り、★見つける ことを 確かめます。
 */
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

/** ★画面や lib が、★募集の 表を 直に 引いて いないか。 */
function 直に引く(src) {
  const code = stripComments(src);
  return /from\(\s*["'`]postings["'`]\s*\)/.test(code)
    || /\bfrom\s+postings\b/.test(code);
}

function main() {
  const raw = fs.readFileSync(path.join(ROOT, "supabase", "migration_postings.sql"), "utf-8");
  const sql = stripComments(raw);
  const 表 = (sql.match(/create table if not exists public\.postings\s*\(([\s\S]*?)\n\);/) || ["", ""])[1];
  const 関数 = (sql.match(/create or replace function public\.get_postings[\s\S]*?\$\$;/) || [""])[0];

  console.log("=== 一 ★載せない もの（★裁定 その94 §4g） ===");
  // ★★時間・会場・合わせの 場所 ── ★列じたいが 無い こと。
  //   ★★「出し分け」では ありません。★持ちません。
  for (const 名 of ["start_time", "end_time", "venue", "place", "time"]) {
    t(!new RegExp(`^\\s*${名}\\s`, "m").test(表), `★${名} の 列が 無い`);
  }
  t(/days date\[\]/.test(表), "日にちは 持つ（★日だけ。時間は 無い）");

  console.log("=== 二 ★門（★裁定 その122 RLS_ON_POSTINGS） ===");
  t(/enable row level security/.test(sql), "門が 立って いる");
  const 決 = sql.match(/create policy "[^"]+" on public\.postings\s+for (\w+)/g) || [];
  const 種 = 決.map((x) => (x.match(/for (\w+)/) || [])[1]);
  t(["select", "insert", "update", "delete"].every((k) => 種.includes(k)), "4本 ある");
  t(!種.includes("all"), "★for all を 書いて いない");
  t(!/using\s*\(\s*true\s*\)/i.test(sql), "★using(true) を 書いて いない");
  const 自分だけ = (sql.match(/auth\.uid\(\) = owner_user_id/g) || []).length;
  t(自分だけ >= 5, `どの 門も 持ち主 だけ（${自分だけ}か所。★update は 2つ 数えます）`);
  // ★★書く 門は `using` と `with check` の 両方（★変えない原則）。
  const 直 = (sql.match(/for update using \(auth\.uid\(\) = owner_user_id\)\s*with check \(auth\.uid\(\) = owner_user_id\)/) || []).length;
  t(直 === 1, "★update に using と with check の 両方が ある");
  t(!/is_org_owner|has_can|teacher_student_links/.test(sql), "★運営・教師の 門が 無い");

  console.log("=== 三 ★権限 ===");
  const r = sql.indexOf("revoke all on public.postings");
  const g = sql.indexOf("grant select (");
  t(r >= 0 && g > r, "★取り上げが、★名指しより 先に ある");
  t(!/grant\s+(select|insert|update)\s+on\s+public\.postings/.test(sql),
    "★列を 名指しして いる（★表ごと 渡して いない）");

  console.log("=== 四 ★関数（★VERIFY Q5・Q6） ===");
  t(関数.length > 0, "get_postings が ある");
  t(/security definer/.test(関数), "security definer で ある");
  t(/set search_path = public, pg_temp/.test(関数), "★search_path を 留めて いる（★Q5）");
  t(!/select\s+\*/i.test(関数), "★select * を 書いて いない（★Q6）");
  t(/auth\.uid\(\)/.test(関数), "★ご本人で 絞って いる");
  t(/p\.org_id = p_org_id/.test(関数), "★学校で 絞って いる");
  t(/public\.matching_visible\(auth\.uid\(\), p\.owner_user_id\)/.test(関数),
    "★切れて いない ことで 絞って いる");
  // ★★★自分の 募集を 返さない（★裁定 その123・2026-09-21）。
  //   ★★画面で 絞ると 絞り忘れます。★「自分の 募集に 応募できる」姿を 作りません。
  t(/p\.owner_user_id <> auth\.uid\(\)/.test(関数), "★自分の 募集を 返さない（★裁定 その123）");
  t(/e\.student_id = auth\.uid\(\)/.test(関数),
    "★在籍は student_id で 見て いる（★enrollments に user_id は ありません）");
  t(/pr\.id = p\.owner_user_id/.test(関数),
    "★profiles の 鍵は id（★user_id は ありません）");
  t(/revoke all on function public\.get_postings\(uuid\) from public, anon/.test(sql),
    "★anon には 渡して いない");
  t(/grant execute on function public\.get_postings\(uuid\) to authenticated/.test(sql),
    "★画面から 呼べる（★authenticated）");
  // ★★`matching_visible` の execute は、★この 紙でも 渡しません（★裁定 その122 WHY_NOT_A）。
  t(!/grant execute on function public\.matching_visible/.test(sql),
    "★matching_visible の execute を 渡して いない");

  console.log("=== 四の二 ★自分が 出した 募集（★裁定 その123） ===");
  const 自分 = (sql.match(/create or replace function public\.get_my_postings[\s\S]*?\$\$;/) || [""])[0];
  t(自分.length > 0, "get_my_postings が ある");
  t(/security definer/.test(自分) && /set search_path = public, pg_temp/.test(自分),
    "★security definer ＋ search_path 固定");
  t(!/select\s+\*/i.test(自分), "★select * を 書いて いない");
  t(/p\.owner_user_id = auth\.uid\(\)/.test(自分), "★自分の ものだけ");
  // ★★こちらに `matching_visible` は 要りません。★自分を 切る ことは ありません。
  t(!/matching_visible/.test(自分), "★matching_visible を 通して いない（★裁定 その123）");
  // ★★★数を 0 で 埋めて いない こと。★「応募が 0件」は 嘘に なります。
  t(!/application_count/.test(自分),
    "★応募の 数を まだ 返して いない（★applications が 無い ため）");

  console.log("=== 五 ★画面が 直に 引いて いない（★裁定 その122） ===");
  const 見る = [];
  for (const dir of ["lib", "components", "app"]) {
    const walk = (d) => {
      for (const n of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, n.name);
        if (n.isDirectory()) { if (n.name !== "tests" && n.name !== "node_modules") walk(p); }
        else if (/\.(js|jsx)$/.test(n.name)) 見る.push(p);
      }
    };
    walk(path.join(ROOT, dir));
  }
  const あたり = 見る.filter((p) => 直に引く(fs.readFileSync(p, "utf-8")));
  t(あたり.length === 0,
    `★画面と lib が postings を 直に 引いて いない（${あたり.map((x) => path.relative(ROOT, x)).join(" ")}）`);

  console.log("=== 六 ★較正（★故意に 1件 作る） ===");
  t(直に引く('const { data } = await sb.from("postings").select("id");'),
    "★直に 引く 書き方を 見つける");
  t(!直に引く('const { data } = await sb.rpc("get_postings", { p_org_id: id });'),
    "★関数を 呼ぶ 書き方は 見つけない");
  t(!直に引く("// postings は get_postings から 引きます"), "★説明の 中の 字では 当たらない");
  const にせ = "create or replace function public.get_x() returns setof record language sql as $$ select * from postings $$;";
  t(/select\s+\*/i.test(にせ), "★select * を 見つける 目が 働いて いる");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
