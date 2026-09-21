#!/usr/bin/env node
// ============================================================================
// 段3a ── まだ比べていない画面への道を探します（2026-09-21）
//
//   見本の地図（docs/design/pack-final/見本の地図.md）が言うとおり、
//   運営の画面は「手前の画面で1つ押してから」開くものが多くあります。
//   どの札を押せばよいかを、当てずっぽうで書きません。開いて数えます。
//
//   読むだけです。押して、出てきた札の名前を並べるだけで、何も書きません。
// ============================================================================
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const { chromium } = require(path.join(ROOT, "node_modules/playwright"));
const base = "http://localhost:3000";
const 待ち = 90000;

function env(p) {
  const o = {};
  fs.readFileSync(path.join(ROOT, p), "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return o;
}

// 手前の画面 → そこで押してみる札
const 的 = JSON.parse(process.argv[2] || '[]');

(async () => {
  const 台帳 = env(".env.local"), e2e = env(".env.e2e");
  const b = await chromium.launch({ channel: "chrome" });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1100 } });
  const ap = await ctx.newPage();
  await ap.goto(base + "/login", { waitUntil: "domcontentloaded", timeout: 待ち });
  const し = await ap.evaluate(async ([u, k, m, pw]) => {
    const r = await fetch(u + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: { apikey: k, "Content-Type": "application/json" },
      body: JSON.stringify({ email: m, password: pw }) });
    return r.ok ? await r.json() : null;
  }, [台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    e2e.E2E_LOCAL_EMAIL, e2e.E2E_LOCAL_PASSWORD]);
  if (!し) { console.error("入れません"); await b.close(); process.exit(1); }
  const ref = String(台帳.NEXT_PUBLIC_SUPABASE_URL).replace(/^https:\/\//, "").split(".")[0];
  const 生 = "base64-" + Buffer.from(JSON.stringify(し), "utf8").toString("base64");
  const 塊 = []; for (let i = 0; i < 生.length; i += 3180) 塊.push(生.slice(i, i + 3180));
  const url = new URL(base);
  await ctx.addCookies(塊.length === 1
    ? [{ name: "sb-" + ref + "-auth-token", value: 生, domain: url.hostname, path: "/" }]
    : 塊.map((v, i) => ({ name: `sb-${ref}-auth-token.${i}`, value: v, domain: url.hostname, path: "/" })));

  const 札を数える = () => ap.$$eval('button, [role="button"]', (els) => els
    .map((e) => (e.textContent || "").replace(/\s+/g, " ").trim())
    .filter((t) => t && t.length <= 40));

  const 運営へ = async () => {
    await ap.goto(base + "/dashboard", { waitUntil: "domcontentloaded", timeout: 待ち });
    await ap.waitForTimeout(12000);
    for (let i = 0; i < 4; i++) {
      if (!(await ap.locator('[role="dialog"]').count())) break;
      await ap.keyboard.press("Escape").catch(() => {});
      await ap.waitForTimeout(400);
    }
    const g = ap.locator('button:has-text("⚙")').first();
    if (await g.count()) { await g.click(); await ap.waitForTimeout(1600); }
    await ap.locator('button:has-text("A13たしかめ学科")').first().click({ timeout: 待ち });
    await ap.waitForTimeout(6000);
  };
  const 押す = async (字) => {
    const l = ap.locator(`button:has-text("${字}"), [role="button"]:has-text("${字}")`).first();
    if (!(await l.count())) return false;
    await l.click({ timeout: 待ち });
    await ap.waitForTimeout(2200);
    return true;
  };

  for (const t of 的) {
    await 運営へ();
    let ok = true;
    for (const st of t.steps) { if (!(await 押す(st))) { ok = false; break; } }
    const 題 = await ap.$$eval("h1, h2, h3", (e) => e.map((x) =>
      (x.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 6));
    console.log("\n### " + t.key + (ok ? "" : "  ← 途中で 札が ありません"));
    console.log("  題 …… " + 題.join(" / "));
    const 札 = [...new Set(await 札を数える())];
    console.log("  札 …… " + 札.slice(0, 26).join(" · "));
  }
  await b.close();
})().catch((e) => { console.error("止まりました --", e.message); process.exit(1); });
