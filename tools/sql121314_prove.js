#!/usr/bin/env node
// ★sql/12（公演の 核）・13（子ども）・14（管理の 操作の 記録）の 確かめ
//   ★試しの 台帳だけ。★なりすましは 使いません。
//
//   ①緊急の 連絡先の 表を、★直に 読めない
//   ②`set_kid_contact` で 入れられる（★較正・通る 側）
//   ③`read_kid_contact` …… 理由が 無いと 断る
//   ④`read_kid_contact` …… 理由を 付けると 返る。★見た 記録が **先に** 1行
//   ⑤`read_kid_contact` …… 断られた ときは 記録も 増えない
//   ⑥見た 記録に、★見た 人の **名前** が 残って いない（役割 だけ）
//   ⑦`ops_audit_log` に 直に 入れられない
//   ⑧管理の 操作を すると、★引き金で 1行 増える（★較正）
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));

const KOEN = "66666666-6666-4666-8666-666666666661";
const KID = "66666666-6666-4666-8666-666666666681";
const ORG = "11111111-1111-4111-8111-111111111111";

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

  台(`delete from public.koen_kid_contact_reads where koen_id = '${KOEN}'`, true);

  console.log("\n=== 一 子どもの 緊急の 連絡先（sql/13）===");
  {
    const { data, error } = await sb.from("koen_kid_contacts").select("contact");
    みる("①緊急の 連絡先を 直に 読めない", !!error || !data || data.length === 0,
      error ? String(error.message).slice(0, 46) : `${(data || []).length}行`);
  }
  {
    const { error } = await sb.rpc("set_kid_contact",
      { p_kid: KID, p_contact: "090-0000-0000（★ためし）" });
    みる("②保護者は 連絡先を 入れられる（較正）", !error,
      error ? String(error.message).slice(0, 46) : "入りました");
  }
  {
    const 前 = 数える(`select count(*) from public.koen_kid_contact_reads where koen_id = '${KOEN}'`);
    const { error } = await sb.rpc("read_kid_contact", { p_kid: KID, p_reason_kind: null });
    みる("③理由が 無いと 断る", !!error && /REASON_REQUIRED/.test(String(error.message)),
      error ? String(error.message).slice(0, 46) : "返って しまいました");
    みる("⑤断られた ときは 記録も 増えない",
      数える(`select count(*) from public.koen_kid_contact_reads where koen_id = '${KOEN}'`) === 前);
  }
  {
    const 前 = 数える(`select count(*) from public.koen_kid_contact_reads where koen_id = '${KOEN}'`);
    const { data, error } = await sb.rpc("read_kid_contact",
      { p_kid: KID, p_reason_kind: "emergency" });
    const 後 = 数える(`select count(*) from public.koen_kid_contact_reads where koen_id = '${KOEN}'`);
    みる("④理由を 付けると 返る・記録が 1行 増える", !error && !!data && 後 === 前 + 1,
      error ? String(error.message).slice(0, 46) : `${前} → ${後}`);
  }
  {
    const 中 = 台(`select viewer_role_at, reason_kind from public.koen_kid_contact_reads `
      + `where koen_id = '${KOEN}' order by 1 limit 3`);
    みる("⑥記録に 残るのは 役割 だけ（★名前が 無い）",
      !中.includes("くらべ用") && (中.includes("運営") || 中.includes("主催")),
      中.replace(/\s+/g, " ").slice(0, 70));
  }

  console.log("\n=== 二 管理の 操作の 記録（sql/14）===");
  {
    // ★★★列の 名を 台帳で 確かめて から 書きます。
    //   ★★2026-09-23、★`op` `table_name` と 書いて いました。★そんな 列は ありません。
    //     ★★「列が 無い」で 断られたのを、★「権限で 断られた」と 読んで いました。★偽の PASS です。
    //   ★★本当の 列 …… id / org_id / actor_id / actor_post_at / action /
    //                    target_kind / target_id / detail / created_at
    const { data, error } = await sb.from("ops_audit_log")
      .insert({ org_id: ORG, actor_id: 私のid, action: "★ためし", target_kind: "x" })
      .select("id");
    const 文 = error ? String(error.message) : "";
    みる("⑦直に 入れられない（★権限で）", (!!error && /permission denied|row-level security/i.test(文))
      || !data || data.length === 0,
      文 ? 文.slice(0, 50) : `${(data || []).length}行`);
  }
  {
    const 前 = 数える("select count(*) from public.ops_audit_log");
    // ★管理の 操作 …… ★行事の 題を 変えます（★引き金の ある 表）。
    const { data: ev } = await sb.from("org_events").select("id, title").eq("org_id", ORG).limit(1);
    if (!ev || ev.length === 0) {
      みる("⑧引き金で 1行 増える（較正）", false, "★試しの 行事が ありません");
    } else {
      await sb.from("org_events").update({ title: (ev[0].title || "") + "" })
        .eq("id", ev[0].id).select("id");
      const { error } = await sb.from("org_events")
        .update({ title: "★ためし " + Date.now() }).eq("id", ev[0].id).select("id");
      const 後 = 数える("select count(*) from public.ops_audit_log");
      みる("⑧引き金で 1行 増える（較正）", !error && 後 > 前, `${前} → ${後}`);
      await sb.from("org_events").update({ title: ev[0].title }).eq("id", ev[0].id).select("id");
    }
  }

  console.log(`\n  ${数 - 落} / ${数}`);
  process.exit(落 ? 1 : 0);
})();
