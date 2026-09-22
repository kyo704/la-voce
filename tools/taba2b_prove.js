#!/usr/bin/env node
// ★束2b ① の 確かめ（裁定167 A3・5列）── 試しの 台帳だけ
//
//   ★★なりすまし（set role／set_config／ROLLBACK）は 使いません。
//     ★実在の 試しの 利用者で 入り直して 確かめます。
//
//   ★★★較正 …… ★守る 列は 断られる／★守らない 列は いままで どおり 書ける。
//     ★片方だけ だと、★「ぜんぶ 断って いる」だけ かも しれません。
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));

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

let 数 = 0, 落 = 0;
const みる = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${名}${註 ? "  -- " + 註 : ""}`); };

// ★守る 列（★断られる はず）
//   ★★★引き金は「**変わった とき**」だけ 断ります（`is distinct from`）。
//     ★★同じ 値を 書くと、★変わって いない ので 通ります。★それは 正しい 姿 です。
//   ★★だから、★いまの 値と **ちがう** 値を 作って から 試します。
//     ★★2026-09-22、★ここを 見落として 3/8 に なりました。★書いて おきます。
const 守る列 = ["consent_health_data_at", "reflux_care_consent_at",
  "guardian_consent_declared_at", "is_under_18", "created_at"];
function ちがう値(列, いま) {
  if (列 === "is_under_18") return !(いま === true);
  const t = いま ? Date.parse(いま) : Date.parse("2026-01-01T00:00:00Z");
  return new Date((Number.isFinite(t) ? t : 0) + 86400000).toISOString();
}
// ★守らない 列（★通る はず・較正）
const 通る = [
  ["display_name", "★ためし-2026-09-22"],
  ["garden_theme", "rose"]
];

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

  // ★★もとの 姿を 控えます。★終わりに 戻します。
  const { data: 前 } = await sb.from("profiles")
    .select("display_name, garden_theme, " + 守る列.join(", "))
    .eq("id", 私のid).maybeSingle();

  console.log("\n=== 一 守る 列（★断られる はず）===");
  for (const 列 of 守る列) {
    const 値 = ちがう値(列, 前 && 前[列]);
    const { data, error } = await sb.from("profiles")
      .update({ [列]: 値 }).eq("id", 私のid).select("id");
    const 断られた = !!error || !data || data.length === 0;
    const 文 = error ? String(error.message) : "";
    みる(`★${列}`, 断られた && /SERVER_ONLY_COLUMN/.test(文),
      文 ? 文.slice(0, 52) : `${(data || []).length}行`);
  }

  console.log("\n=== 二 守らない 列（★通る はず・較正）===");
  for (const [列, 値] of 通る) {
    const { data, error } = await sb.from("profiles")
      .update({ [列]: 値 }).eq("id", 私のid).select("id");
    みる(`★${列}`, !error && data && data.length === 1,
      error ? String(error.message).slice(0, 52) : `${(data || []).length}行`);
  }

  console.log("\n=== 三 もとに 戻す ===");
  const { error: e3 } = await sb.from("profiles")
    .update({ display_name: (前 && 前.display_name) || null,
              garden_theme: (前 && 前.garden_theme) || "rose" })
    .eq("id", 私のid).select("id");
  みる("★戻せた", !e3, e3 ? String(e3.message).slice(0, 52) : "");

  console.log(`\n  ${数 - 落} / ${数}`);
  process.exit(落 ? 1 : 0);
})();
