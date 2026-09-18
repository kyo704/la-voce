/**
 * ★実機で「＋ 招く」を 押して、★合言葉が 出るかを 確かめます（★裁定 その82）。
 *
 *   ★★較正 ── ★押す 前に 合言葉が 出て いたら、★測りが 壊れて います。
 *   ★★★台帳に 1行 増えます。★試しの 教室 だけ です。★あとで 消せます。
 */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2,
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
    await ops.click({ force: true });
    await page.waitForTimeout(2000);
    const 名簿 = page.locator('button:has-text("名簿")').last();
    if (await 名簿.count()) { await 名簿.click({ force: true }).catch(() => {}); await page.waitForTimeout(1800); }

    // ★★較正 ── ★押す 前に 合言葉が 出て いないか。
    const 前 = await page.evaluate(() =>
      /^[A-Z0-9]{8}$/.test((document.body.innerText.match(/\b[A-Z0-9]{8}\b/) || [""])[0]));
    console.log("★押す 前に 合言葉: " + (前 ? "★★あります（測りが 壊れて います）" : "ありません"));
    if (前) { process.exitCode = 1; return; }

    const 招く = page.locator('button:has-text("招く")').first();
    console.log("★「＋ 招く」の 札: " + (await 招く.count() ? "あります" : "★ありません"));
    if (!(await 招く.count())) { process.exitCode = 1; return; }
    await 招く.click({ force: true });
    await page.waitForTimeout(2500);

    const 後 = await page.evaluate(() => {
      const t = document.body.innerText;
      const m = t.match(/\b[A-Z0-9]{8}\b/);
      return {
        合言葉: m ? m[0] : null,
        注記: ["招待中は、ご請求に 入りません", "同意は ご本人から",
          "18歳未満", "承知するまで"].filter((x) => t.includes(x)).length,
        メールの口: /メールアドレス/.test(t)
      };
    });
    console.log("★合言葉: " + (後.合言葉 || "★出ません"));
    console.log("★注記 4行の うち 出て いる: " + 後.注記);
    console.log("★メールの 口: " + (後.メールの口 ? "★あります（置かない はず です）" : "ありません"));
    await page.screenshot({
      path: path.join(ROOT, "docs/design/compare/ops", "jikki-招く.png"),
      scale: "css", fullPage: true
    });
    console.log("★撮りました: docs/design/compare/ops/jikki-招く.png");
  } finally { await b.close(); }
})();
