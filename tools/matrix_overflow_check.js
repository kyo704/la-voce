/**
 * ★表が 横に すべらないかを、★実機で 測る（★裁定 その75 修正・VERIFY）。
 *
 *   ★★測る のは 3つ です。
 *     ★① 1194（iPad よこ）で 表が 出るか ／ 横に すべらないか
 *     ★② 834（iPad たて）で 表が **出ない** か
 *     ★③ 930（境目 ちょうど）で 足りるか ── ★2px の 余白の 実測
 *
 *   ★★較正 ── ★運営に 入れなければ 止まります。★白い 絵を 残しません。
 */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

const 幅たち = [933, 936, 940];

(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });
  try {
    for (const W of 幅たち) {
      const ctx = await b.newContext({
        viewport: { width: W, height: 1000 }, deviceScaleFactor: 2,
        locale: "ja-JP", timezoneId: "Asia/Tokyo"
      });
      const page = await ctx.newPage();
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
        const 歯車 = page.locator('button:has-text("⚙")').first();
        if (await 歯車.count()) { await 歯車.click({ force: true }).catch(() => {}); await page.waitForTimeout(1500); }
      }
      let ops = page.locator(札).filter({ hasText: "はじめの1人テスト" }).first();
      if (!(await ops.count())) ops = page.locator(札).first();
      if (!(await ops.count())) {
        console.error("★止まりました ── 運営に 入れません（幅 " + W + "）。");
        process.exitCode = 1; await ctx.close(); return;
      }
      await ops.click({ force: true });
      await page.waitForTimeout(2000);
      const 設定 = page.locator('button:has-text("設定")').last();
      if (await 設定.count()) { await 設定.click({ force: true }).catch(() => {}); await page.waitForTimeout(1800); }

      const 出た = await page.evaluate(() => {
        const t = [...document.querySelectorAll("table")]
          .find((x) => (x.textContent || "").includes("この役職で 出るナビ"));
        if (!t) return { 表: false };
        const w = t.parentElement;
        return {
          表: true,
          表の幅: Math.round(t.getBoundingClientRect().width),
          包みの見える幅: w ? w.clientWidth : null,
          包みの中身の幅: w ? w.scrollWidth : null,
          すべる: w ? (w.scrollWidth - w.clientWidth) : null
        };
      });
      console.log("幅 " + W + " … " + JSON.stringify(出た));
      if (出た.表) {
        await page.screenshot({
          path: path.join(ROOT, "docs/design/compare/ops", "jikki-役職の表-" + W + ".png"),
          scale: "css", fullPage: true
        });
      }
      await ctx.close();
    }
  } finally { await b.close(); }
})();
