/**
 * ★運営の 帯を 1つ 開いて 撮ります（★汎用）。
 *
 *   ★★較正 ── ★狙った 見出しが 無ければ 止まります。★白い 絵を 残しません。
 *   ★使い方  node tools/ops_tab_shot.js 行事 [押す札] [幅]
 */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});
const TAB = process.argv[2] || "行事";
const PRESS = process.argv[3] || "";
const W = Number(process.argv[4] || 1280);

(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });
  const ctx = await b.newContext({
    viewport: { width: W, height: 1000 }, deviceScaleFactor: 2,
    locale: "ja-JP", timezoneId: "Asia/Tokyo"
  });
  const page = await ctx.newPage();
  try {
    await page.goto("https://woolsong.app/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
    await page.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    await page.waitForTimeout(3500);
    for (let i = 0; i < 4; i++) {
      if (!(await page.locator('[role="dialog"]').count())) break;
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(500);
    }
    const 札 = 'button:has-text("の運営"), button:has-text("の 運営")';
    if (!(await page.locator(札).count())) {
      const g = page.locator('button:has-text("⚙")').first();
      if (await g.count()) { await g.click({ force: true }).catch(() => {}); await page.waitForTimeout(1500); }
    }
    let ops = page.locator(札).filter({ hasText: "はじめの1人テスト" }).first();
    if (!(await ops.count())) ops = page.locator(札).first();
    if (!(await ops.count())) {
      console.error("★止まりました ── 運営に 入れません。");
      process.exitCode = 1; return;
    }
    await ops.click({ force: true });
    await page.waitForTimeout(2000);
    const 帯 = page.locator(`button:has-text("${TAB}")`).last();
    if (await 帯.count()) { await 帯.click({ force: true }).catch(() => {}); await page.waitForTimeout(1800); }

    const 見出し = await page.evaluate(() =>
      [...document.querySelectorAll("h2")].map((h) => h.textContent.trim()).filter(Boolean));
    console.log("★見出し: " + (見出し.join(" / ") || "（ありません）"));
    if (!見出し.some((h) => h.includes(TAB))) {
      console.error("★止まりました ── 「" + TAB + "」の 見出しが ありません。");
      process.exitCode = 1; return;
    }

    if (PRESS) {
      const p = page.locator(`button:has-text("${PRESS}")`).first();
      console.log("★「" + PRESS + "」の 札: " + (await p.count() ? "あります" : "★ありません"));
      if (await p.count()) { await p.click({ force: true }); await page.waitForTimeout(1500); }
    }
    const 名 = "jikki-" + TAB + (PRESS ? "-" + PRESS : "") + "-" + W + ".png";
    await page.screenshot({
      path: path.join(ROOT, "docs/design/compare/ops", 名), scale: "css", fullPage: true
    });
    console.log("★撮りました: docs/design/compare/ops/" + 名);
  } finally { await b.close(); }
})();
