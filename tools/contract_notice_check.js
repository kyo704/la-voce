#!/usr/bin/env node
// ============================================================================
// ★契約者の 知らせ ── ★試しの 台帳で、★ほんとうに 出る／出ない を 見ます
//   （★裁定 その116 の 直し・2026-09-21）
//
//   ★★★退会の 画面を 自動で 押しません。
//     ★★あの 画面の 先は「消す」です。★取り違えると 消えます。
//     ★★知らせを 出すか 決める ところ（`classifyOwnedOrgs`）を、
//       ★★**本物の 台帳に つないで** 呼びます。★偽の 行では ありません。
//
//   ★★★見るのは 2つ の 側 です ──
//     ★くらべ用 たろう … 役割は owner。★でも 契約者では ありません
//       → ★知らせは **出ない** のが 正しい（★直す 前は 出て いました）
//     ★先生 はなこ ……… 役割は staff。★でも 契約者 です
//       → ★知らせが **出る** のが 正しい（★直す 前は 出ません でした）
// ============================================================================
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function env(p) {
  const o = {};
  fs.readFileSync(path.join(ROOT, p), "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return o;
}

(async () => {
  const 台帳 = env(".env.local");
  const e2e = env(".env.e2e");
  const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));
  const sb = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data: 入, error: e1 } = await sb.auth.signInWithPassword({
    email: e2e.E2E_LOCAL_EMAIL, password: e2e.E2E_LOCAL_PASSWORD
  });
  if (e1 || !入 || !入.user) { console.error("★入れません ──", e1 && e1.message); process.exit(1); }
  const me = 入.user.id;
  console.log("★入りました …… " + me);

  // ★★源を そのまま 読みます（★写しを 作りません）。
  const src = fs.readFileSync(path.join(ROOT, "lib/orgClosure.js"), "utf8")
    .replace(/from "(\.\/[^"]+?)(\.js)?"/g, (m, 名) => {
      const 先 = path.join(ROOT, "lib", 名.replace("./", "") + ".js");
      if (!fs.existsSync(先)) return m;
      return 'from "data:text/javascript;base64,'
        + Buffer.from(fs.readFileSync(先, "utf8")).toString("base64") + '"';
    });
  const oc = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  const r = await oc.classifyOwnedOrgs(sb, me);
  console.log("  solo    …… " + JSON.stringify(r.solo));
  console.log("  blocked …… " + (r.blocked || []).map((x) => x.name).join(", "));
  console.log("  payer   …… " + ((r.payer || []).map((x) => x.name).join(", ") || "（なし）"));

  // ★★台帳が 言う ところ の 契約者。
  const { data: org } = await sb.from("organizations")
    .select("id, name, contract_owner_user_id").limit(1).maybeSingle();
  const 契約者 = org && org.contract_owner_user_id;
  const 私が契約者 = String(契約者) === String(me);
  console.log("  台帳の 契約者 …… " + 契約者 + (私が契約者 ? "（★私）" : "（★私では ない）"));

  // ★★★どの 枝を 通ったかを 言います（★2026-09-21）。
  //   ★★`blocked` に 入った 学校は、★**契約者の 枝を 通って いません**。
  //     ★★「知らせが 出なかった」のは、★直した 行の おかげ では なく、
  //       ★★その 手前で 止まった から かも しれません。
  //   ★★★通って いない のに「確かめた」と 言わない ため の 1行 です。
  const 止まった = (r.blocked || []).length > 0;
  if (止まった) {
    console.log("\n  ★★注意 …… " + (r.blocked || []).map((x) => x.name).join(", ")
      + " は `blocked` に 入りました。");
    console.log("    ★★運営できる 方が ほかに 残らない ため です。");
    console.log("    ★★★この 学校では、★直した 行（契約者を 見る ところ）を");
    console.log("      ★★**通って いません**。★確かめた ことに なりません。");
  }

  const 出た = (r.payer || []).length > 0;
  const 正しい = 出た === 私が契約者;
  console.log(`\n  ${正しい ? "○" : "✗"} 知らせは ${出た ? "出ました" : "出ません でした"}`
    + ` ── ★私は ${私が契約者 ? "契約者 です" : "契約者では ありません"}`);
  if (!私が契約者) {
    console.log("  ★★これが 直した ところ です。★役割は owner ですが、");
    console.log("    ★★契約者では ありません。★直す 前は、★ここで 出て いました。");
  }
  process.exit(正しい ? 0 : 1);
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
