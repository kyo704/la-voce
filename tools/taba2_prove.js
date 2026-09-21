#!/usr/bin/env node
// ★束2 の 確かめ（裁定164 W2・W1／裁定161 FX2）── 試しの 台帳だけ
//
//   ★★なりすまし（BEGIN／set role／set_config／ROLLBACK）は 使いません。
//     ★実在の 試しの 利用者で 入り直して 確かめます（★2026-09-15 の 一件）。
//
//   ★較正 …… できる はずの 人が できる ／ できない はずの 人が できない、の 両方。
//
//   ①W2 取り下げ …… 書いた 人が `withdrawn_at` を 入れられる（★較正・通る）
//   ②W2 中身 ……… 書いた 人でも `body` は 書き換えられない（★通らない）
//   ③W2 よその人 … 書いて いない 人は 取り下げられない（★0行）
//   ④W2 戻す ……… 取り下げた ものを null に 戻せない（★通らない）
//   ⑤W1 辞退 …… 応募した 人が 'withdrawn' に できる（★較正・通る）
//   ⑥W1 決まり … 応募した 人が 'chosen' に できない（★通らない）
//   ⑦FX2 直書き … `monka_read` を 持つ 人でも log に 直に 入れられない
//   ⑧FX2 道 ……… `open_monka_thread` は いままで どおり 1行 増やす
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));
const ORG = "11111111-1111-4111-8111-111111111111";
const 先生役 = "3edb38a1-9428-4656-a4f0-0b5f845e1408";

function env(p) {
  const o = {};
  fs.readFileSync(path.join(ROOT, p), "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return o;
}
const 数える = (sql) => {
  const out = execFileSync("python3", [path.join(ROOT, "tools/ask_ledger.py"), "--test", sql],
    { encoding: "utf8" });
  const m = /^\s*(\d+)\s*$/m.exec(out);
  return m ? Number(m[1]) : NaN;
};
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

  // ★この 人が 書いた 連絡を 2件 探します（★1件は 取り下げ、★1件は 触りません）。
  const { data: 連絡 } = await sb.from("org_messages")
    .select("id, author_id, body, withdrawn_at").eq("org_id", ORG).order("created_at");
  if (!連絡 || 連絡.length < 2) {
    console.error("★試しの 連絡が 2件 要ります。いま", (連絡 || []).length, "件");
    process.exit(1);
  }
  const 自分の = 連絡.filter((m) => m.author_id === 私のid);
  if (自分の.length < 2) { console.error("★自分が 書いた 連絡が 2件 要ります"); process.exit(1); }
  const [甲, 乙] = 自分の;

  // ② 中身は 書き換えられない
  const { error: e2 } = await sb.from("org_messages")
    .update({ body: (甲.body || "") + "★書き換え" }).eq("id", 甲.id).select("id");
  みる("②書いた 人でも body は 書き換えられない", !!e2, e2 ? String(e2.message).slice(0, 48) : "通って しまいました");

  // ① 取り下げは できる（★較正・通る 側）
  const { data: d1, error: e1 } = await sb.from("org_messages")
    .update({ withdrawn_at: new Date().toISOString() }).eq("id", 乙.id).select("id");
  みる("①書いた 人は 取り下げられる（較正）", !e1 && d1 && d1.length === 1,
    e1 ? String(e1.message).slice(0, 48) : `${(d1 || []).length}行`);

  // ④ 戻せない
  const { data: d4, error: e4 } = await sb.from("org_messages")
    .update({ withdrawn_at: null }).eq("id", 乙.id).select("id");
  みる("④取り下げを null に 戻せない", !!e4 || !d4 || d4.length === 0,
    e4 ? String(e4.message).slice(0, 48) : `${(d4 || []).length}行`);

  // ③ よその 人の 連絡は 取り下げられない ── ★ここでは「書いて いない 行」を 使います。
  const よその = 連絡.find((m) => m.author_id !== 私のid);
  if (よその) {
    const { data: d3 } = await sb.from("org_messages")
      .update({ withdrawn_at: new Date().toISOString() }).eq("id", よその.id).select("id");
    みる("③書いて いない 人は 取り下げられない", !d3 || d3.length === 0, `${(d3 || []).length}行`);
  } else {
    みる("③書いて いない 連絡が 試しの 台帳に ありません（★較正できず）", false, "SKIP ではなく FAIL に します");
  }

  // ⑤⑥ W1 ── 自分の 応募
  const { data: 応募 } = await sb.from("applications").select("id, status");
  if (!応募 || 応募.length === 0) {
    みる("⑤⑥自分の 応募が ありません（★較正できず）", false, "試しの 行が 要ります");
  } else {
    const a = 応募[0];
    const { error: e6 } = await sb.from("applications")
      .update({ status: "chosen" }).eq("id", a.id).select("id");
    みる("⑥応募した 人は 'chosen' に できない", !!e6, e6 ? String(e6.message).slice(0, 48) : "通って しまいました");
    const { data: d5, error: e5 } = await sb.from("applications")
      .update({ status: "withdrawn" }).eq("id", a.id).select("id");
    みる("⑤応募した 人は 'withdrawn' に できる（較正）", !e5 && d5 && d5.length === 1,
      e5 ? String(e5.message).slice(0, 48) : `${(d5 || []).length}行`);
  }

  // ⑦ FX2 ── 直に 入れられない
  const 前 = 数える("select count(*) from monka_read_log");
  const { error: e7 } = await sb.from("monka_read_log").insert({
    org_id: ORG, viewer_user_id: 私のid, teacher_id: 先生役, reason_kind: "jiko" });
  みる("⑦log に 直に 入れられない", !!e7, e7 ? String(e7.message).slice(0, 48) : "入って しまいました");
  みる("⑦-2 1行も 増えて いない", 数える("select count(*) from monka_read_log") === 前);

  // ⑧ 道は いままで どおり
  const { error: e8 } = await sb.rpc("open_monka_thread",
    { p_org_id: ORG, p_teacher_id: 先生役, p_reason_kind: "jiko", p_reason_note: null });
  const 後 = 数える("select count(*) from monka_read_log");
  みる("⑧open_monka_thread は 1行 増やす（較正）", !e8 && 後 === 前 + 1,
    e8 ? String(e8.message).slice(0, 48) : `${前} → ${後}`);

  console.log(`\n  ${数 - 落} / ${数}`);
  process.exit(落 ? 1 : 0);
})();
