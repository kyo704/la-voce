#!/usr/bin/env node
// ★束3 の 確かめ（裁定165 §5 ／ 裁定163 §1 ／ 裁定164 W3）── 試しの 台帳だけ
//
//   ★★なりすまし（BEGIN／set role／set_config／ROLLBACK）は 使いません。
//     ★実在の 試しの 利用者で 入り直して 確かめます。
//
//   ★★★順が 決め手 です。★同じ 1人で 両側を 取ります ──
//     ★先に「組まれて いない 自分」で 試し、★あとで 組んでから もう 一度。
//     ★★試しの 台帳に 入れる 口は 1つ しか ありません（local2）。
//       ★★だから「よその 人」の 側は、★組む 前の 自分 で 代えます。
//
//   ①組まれて いない 人は 点を 入れられない          ②審査員の 一覧が 見えない
//   ③saiten を 持つ 人は 審査員を 組める（較正）      ④その 学校に 居ない 人は 組めない
//   ⑤組まれた 人は 点を 入れられる（較正）            ⑥confirmed_at は 入れられない
//   ⑦よその 行事の 組み合わせは 入らない              ⑧終えた印は 組まれて いれば 入る（較正）
//   ⑨同じ 終えた印の 2行目は 主キーで 断られる
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));

const ORG    = "11111111-1111-4111-8111-111111111111";
const EVENT  = "bbbbbbbb-0000-4000-8000-000000000001";
const EVENT2 = "bbbbbbbb-0000-4000-8000-000000000002";
const ITEM   = "ff000000-0000-4000-8000-000000000001";
const STUDENT = "dc8f0554-3aa1-496c-be26-d7c07ece8380";   // ★その 学校に 居る 方
const YOSO    = "6fdc5121-adab-4962-a202-6d7c340ea994";   // ★その 学校に 居ない 方（s1check）

function env(p) {
  const o = {};
  fs.readFileSync(path.join(ROOT, p), "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return o;
}
const 台 = (sql, write) => execFileSync("python3",
  [path.join(ROOT, "tools/ask_ledger.py"), "--test", ...(write ? ["--write", "--ok"] : []), sql],
  { encoding: "utf8" });
const 数える = (sql) => { const m = /^\s*(\d+)\s*$/m.exec(台(sql)); return m ? Number(m[1]) : NaN; };

let 数 = 0, 落 = 0;
const みる = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${名}${註 ? "  -- " + 註 : ""}`); };

(async () => {
  const 台帳 = env(".env.local"), e2e = env(".env.e2e");
  const sb = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { error: e0 } = await sb.auth.signInWithPassword({
    email: e2e.E2E_LOCAL_EMAIL, password: e2e.E2E_LOCAL_PASSWORD });
  if (e0) { console.error("入れません --", e0.message); process.exit(1); }
  const { data: 私 } = await sb.auth.getUser();
  const 私のid = 私 && 私.user && 私.user.id;
  console.log("★入った 人 ……", e2e.E2E_LOCAL_EMAIL, 私のid);

  // ★★走る たびに、★前の 走りの 跡を 片づけます。
  //   ★★片づけないと、★2度目から 主キーに 当たった だけ で PASS に 見えます。
  台("delete from public.evaluation_scores where org_id = '" + ORG + "'", true);
  台("delete from public.evaluation_reviews where org_id = '" + ORG + "'", true);
  台("delete from public.evaluation_judge_done where org_id = '" + ORG + "'", true);
  // ★★表が まだ 無い ことが あります（★当てる 前の 較正を 走らせる とき）。
  //   ★★無い まま 落ちると、★「穴が 開いて いる」を 確かめられません。
  台("do $$ begin if to_regclass('public.evaluation_judges') is not null then "
    + "delete from public.evaluation_judges where org_id = '" + ORG + "'; end if; end $$", true);
  台("update public.org_posts set perms = perms - 'saiten' where org_id = '" + ORG + "'", true);

  const 点を入れる = (中身) => sb.from("evaluation_scores").insert(中身).select("id");

  console.log("\n=== 一 組まれて いない とき ===");
  // ① 組まれて いない 人は 点を 入れられない
  {
    const { data, error } = await 点を入れる({
      org_id: ORG, event_id: EVENT, student_id: STUDENT, item_id: ITEM,
      judge_id: 私のid, points: 5 });
    みる("①組まれて いない 人は 点を 入れられない", !!error || !data || data.length === 0,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  // ② 審査員の 一覧が 見えない（saiten も 無く、組まれても いない）
  {
    const { data, error } = await sb.from("evaluation_judges")
      .select("event_id, judge_id").eq("org_id", ORG);
    // ★★表が まだ 無い ときは、★この 試験は 成り立ちません。★FAIL に します。
    //   ★★「見えない」と「表が 無い」を 同じに しません。
    みる("②審査員の 一覧が 見えない", !error && (data || []).length === 0,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }

  console.log("\n=== 二 saiten を 渡して から ===");
  台("update public.org_posts set perms = perms || '{\"saiten\": true}'::jsonb "
    + "where org_id = '" + ORG + "' and name = '学部長'", true);

  // ③ 審査員を 組める（較正・通る 側）
  {
    const { data, error } = await sb.from("evaluation_judges")
      .insert({ org_id: ORG, event_id: EVENT, judge_id: 私のid, added_by: 私のid })
      .select("judge_id");
    みる("③saiten を 持つ 人は 審査員を 組める（較正）", !error && data && data.length === 1,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  // ④ その 学校に 居ない 人は 組めない
  {
    const { data, error } = await sb.from("evaluation_judges")
      .insert({ org_id: ORG, event_id: EVENT, judge_id: YOSO, added_by: 私のid })
      .select("judge_id");
    みる("④その 学校に 居ない 人は 組めない", !!error || !data || data.length === 0,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }

  console.log("\n=== 三 組まれた あと ===");
  // ⑤ 点を 入れられる（較正・通る 側）
  {
    const { data, error } = await 点を入れる({
      org_id: ORG, event_id: EVENT, student_id: STUDENT, item_id: ITEM,
      judge_id: 私のid, points: 5 });
    みる("⑤組まれた 人は 点を 入れられる（較正）", !error && data && data.length === 1,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  // ⑥ confirmed_at は 入れられない
  {
    const { data, error } = await 点を入れる({
      org_id: ORG, event_id: EVENT, student_id: STUDENT, item_id: ITEM,
      judge_id: 私のid, points: 6, confirmed_at: new Date().toISOString() });
    みる("⑥confirmed_at は 入れられない", !!error || !data || data.length === 0,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  // ⑦ よその 行事の 組み合わせ（★行事 2 に 組まれて いない・項目も 行事 1 の もの）
  {
    const { data, error } = await 点を入れる({
      org_id: ORG, event_id: EVENT2, student_id: STUDENT, item_id: ITEM,
      judge_id: 私のid, points: 7 });
    みる("⑦よその 行事の 組み合わせは 入らない", !!error || !data || data.length === 0,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  // ⑧ 終えた印（較正・通る 側）
  {
    const { data, error } = await sb.from("evaluation_judge_done")
      .insert({ org_id: ORG, event_id: EVENT, judge_id: 私のid }).select("judge_id");
    みる("⑧組まれて いれば 終えた印は 入る（較正）", !error && data && data.length === 1,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  // ⑨ 2行目は 主キーで 断られる（★裁定164 W3 ── ★本番に もう あります）
  {
    const { data, error } = await sb.from("evaluation_judge_done")
      .insert({ org_id: ORG, event_id: EVENT, judge_id: 私のid }).select("judge_id");
    const 数2 = 数える("select count(*) from evaluation_judge_done where org_id = '" + ORG + "'");
    みる("⑨同じ 終えた印の 2行目は 断られる", !!error && 数2 === 1,
      error ? `${String(error.message).slice(0, 34)} ／ ${数2}行` : `${数2}行`);
  }

  // ★片づけ ── saiten を 戻します（★試しの 台帳の もとの 形）。
  台("update public.org_posts set perms = perms - 'saiten' where org_id = '" + ORG + "'", true);

  console.log(`\n  ${数 - 落} / ${数}`);
  process.exit(落 ? 1 : 0);
})();
