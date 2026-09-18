/**
 * ★運営の 実装を 撮る（★2026-09-18・第2群）。
 *
 *   ★★較正 ── ★運営に 入れて いるか、★狙った 帯に 居るかを 先に 見ます。
 *     ★★入れて いなければ 止まります。★白い 絵を 残しません。
 *
 *   ★使い方  node tools/ops_impl_shot.js 設定
 */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});
const TAB = process.argv[2] || "設定";
// ★★どの 教室の 運営かを 選びます。★はじめ 先頭を 押して いて、
//   ★★学長では なく 事務長の 教室を 撮って いました（★できことが 9つ）。
const KYOSHITSU = process.env.ORG || "はじめの1人テスト";
const W = Number(process.argv[3] || 1280);
const H = Number(process.argv[4] || 1000);

(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });
  const ctx = await b.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 2,
    locale: "ja-JP", timezoneId: "Asia/Tokyo"
  });
  const page = await ctx.newPage();
  // ★★画面が 出した 言葉を 拾います（★きょう 足した「★役職を読めませんでした」など）。
  page.on("console", (m) => {
    const t = m.text();
    if (/★|error|Error/.test(t)) console.log("  ［画面］" + t.slice(0, 200));
  });
  try {
    await page.goto("https://woolsong.app/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
    await page.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    await page.waitForTimeout(3000);

    // ★★1枚（dialog）が 出て いたら 閉じます。
    for (let i = 0; i < 4; i++) {
      if (!(await page.locator('[role="dialog"]').count())) break;
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(500);
      if (await page.locator('[role="dialog"] button').count()) {
        await page.locator('[role="dialog"] button').last().click({ force: true }).catch(() => {});
        await page.waitForTimeout(600);
      }
    }

    // ★★何が 出て いるかを、★そのまま 書き出します（★見当で 押しません）。
    const 札 = await page.evaluate(() =>
      [...document.querySelectorAll("button, a, [role=button]")]
        .map((e) => (e.textContent || "").trim())
        .filter((x) => x && x.length < 24).slice(0, 40));
    console.log("★見えて いる 札: " + 札.join(" / "));
    // ★★入口は「きょう」の 右上の **歯車の 中** です（★VocalTracker.jsx:17125 の 注）。
    //   ★★はじめ、★きょうの 表だけ 見て「入口が 無い」と 申し上げました。
    //     ★★★開けずに 無いと 申し上げました。★私の 測り違い です。
    if (!(await page.locator('button:has-text("の運営")').count())) {
      const 歯車 = page.locator('button:has-text("⚙")').first();
      if (await 歯車.count()) { await 歯車.click({ force: true }).catch(() => {}); await page.waitForTimeout(1500); }
    }
    let ops = page.locator('button:has-text("の運営"), button:has-text("の 運営")')
      .filter({ hasText: KYOSHITSU }).first();
    if (!(await ops.count())) ops = page.locator('button:has-text("の運営"), button:has-text("の 運営")').first();
    console.log("★運営の 札: " + (await ops.count() ? "あります" : "★ありません"));
    if (!(await ops.count())) {
      console.error("★止まりました ── 運営に 入れません。★役職を お確かめください。");
      process.exitCode = 1; return;
    }
    await ops.click({ force: true });
    await page.waitForTimeout(2000);

    const 帯 = page.locator(`button:has-text("${TAB}")`).last();
    if (await 帯.count()) { await 帯.click({ force: true }).catch(() => {}); await page.waitForTimeout(1600); }

    // ★★較正 ── ★狙った 画面が 出て いるか。
    const 見出し = await page.evaluate(() =>
      [...document.querySelectorAll("h2")].map((h) => h.textContent.trim()).filter(Boolean));
    console.log("★出て いる 見出し: " + (見出し.join(" / ") || "（ありません）"));
    if (見出し.length === 0) {
      console.error("★止まりました ── 見出しが ありません。★白い 絵を 残しません。");
      process.exitCode = 1; return;
    }

    const 名 = "jikki-" + TAB + "-" + W + ".png";
    console.log("★教室: " + KYOSHITSU);
    const dst = path.join(ROOT, "docs/design/compare/ops", 名);
    await page.screenshot({ path: dst, fullPage: true });
    console.log("★撮りました: docs/design/compare/ops/" + 名);
  } finally { await b.close(); }
})();
