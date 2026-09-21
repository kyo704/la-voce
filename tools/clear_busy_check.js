#!/usr/bin/env node
// clear_my_busy_slots を、本人の鍵で実際に呼んで確かめます（裁定142・2026-09-21）
//   管理の鍵は使いません。使うと決まりを飛び越え、何も確かめられません。
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const { createClient } = require(path.join(ROOT, "node_modules/@supabase/supabase-js"));
const HANAKO = "4b027d0a-11de-4acc-ae63-f240300c78aa";

function env(p) {
  const o = {};
  fs.readFileSync(path.join(ROOT, p), "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return o;
}
let 数 = 0, 落 = 0;
const みる = (名, ok, 註) => {
  数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${名}${註 ? "  -- " + 註 : ""}`);
};
const 数える = (out) => {
  const m = /^\s*(\d+)\s*$/m.exec(out);
  return m ? Number(m[1]) : NaN;
};
const 台帳に聞く = (sql) => require("child_process").execFileSync("python3",
  [path.join(ROOT, "tools/ask_ledger.py"), "--test", sql], { encoding: "utf8" });

(async () => {
  const 台帳 = env(".env.local"), e2e = env(".env.e2e");
  const sb = createClient(台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { error: e1 } = await sb.auth.signInWithPassword({
    email: e2e.E2E_LOCAL_EMAIL, password: e2e.E2E_LOCAL_PASSWORD });
  if (e1) { console.error("入れません --", e1.message); process.exit(1); }

  const 前 = 数える(台帳に聞く("select count(*) from my_timetable where unavailable"));
  みる("仕込みが入っている（2件）", 前 === 2, String(前));

  const { data, error } = await sb.rpc("clear_my_busy_slots");
  みる("道を呼べた（authenticated に execute がある）", !error,
    error ? error.message : "removed=" + JSON.stringify(data));

  const 後 = 数える(台帳に聞く("select count(*) from my_timetable where unavailable"));
  みる("自分の印が外れた", 後 === 1, "残り " + 後);

  const 他 = 数える(台帳に聞く(
    `select count(*) from my_timetable where unavailable and user_id = '${HANAKO}'`));
  みる("よその方の印は残っている（引数で人を指せない）", 他 === 1, "はなこ " + 他);

  const { data: d2, error: e2 } = await sb.rpc("clear_my_busy_slots");
  みる("2度目は 0件（何度呼んでも同じ）", !e2 && JSON.stringify(d2).includes("0"),
    e2 ? e2.message : JSON.stringify(d2));

  console.log(`\n${数 - 落} / ${数} 通りました`);
  process.exit(落 === 0 ? 0 : 1);
})().catch((e) => { console.error("止まりました --", e.message); process.exit(1); });
