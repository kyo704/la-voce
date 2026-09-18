/**
 * ★配備が 届いたかを、★較正して から 見る（★2026-09-18）。
 *
 *   ★★きょう 3度、★測り方を 間違えました ──
 *     ① 新しい 字を 探した … ★運営の 画面でしか 降りて こない 束の 中 でした
 *     ② 手の 名を 探した … ★名前は 縮められます（★minify）。★消えます
 *     ③ 字を 探した …… ★もとから ある 字すら 見つからず、★道具が 届いて いません でした
 *   ★★「もとから ある もの」が 見つからない 時点で、★道具を 疑うべき でした。
 *
 *   ★★★だから、★**先に 較正**します ──
 *     ・束を 1本 取って、★中身が 空で ない ことを 確かめる
 *     ・もとから ある 字が 見つかる ことを 確かめる
 *   ★★そこが 通って から、★新しい 印を 探します。
 */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

// ★★探す 印 ── ★引数で 渡します。★無ければ 較正だけ します。
const MARK = process.argv[2] || null;
// ★★較正の 印 ── ★きょうより 前から ある 字。★必ず 見つかる はず です。
const CALIB = "きょうも 来てくれて";

(async () => {
  const { chromium, devices } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });
  const ctx = await b.newContext({ ...devices["iPhone 12"],
    viewport: { width: 390, height: 844 }, locale: "ja-JP", timezoneId: "Asia/Tokyo" });
  const page = await ctx.newPage();
  // ★★降りて きた 束を、★こちら側で 受け取ります。
  //   ★★画面の 中の `fetch` では 取れない ことが あります（★きょう それで 外しました）。
  const bodies = [];
  page.on("response", async (res) => {
    const u = res.url();
    if (!/\/_next\/static\/.*\.js$/.test(u)) return;
    try { bodies.push({ u, t: await res.text() }); } catch (e) { /* ★取れない ものは 飛ばします */ }
  });
  try {
    await page.goto("https://woolsong.app/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
    await page.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    await page.waitForTimeout(3500);

    const 総字数 = bodies.reduce((n, x) => n + x.t.length, 0);
    console.log("★受け取った 束 " + bodies.length + "本 ／ 合わせて " + 総字数 + " 字");

    console.log("\n★★較正 ── ★もとから ある 字が 見つかるか");
    const hit = bodies.filter((x) => x.t.includes(CALIB));
    if (bodies.length === 0 || 総字数 === 0) {
      console.log("  ★★NG ── ★束を 1本も 受け取れて いません。★道具が 届いて いません。");
      process.exitCode = 1; return;
    }
    if (hit.length === 0) {
      console.log("  ★★NG ── 「" + CALIB + "」が どこにも ありません。");
      console.log("  ★★道具が 届いて いません。★この まま 数を 読みません。");
      process.exitCode = 1; return;
    }
    console.log("  ok  「" + CALIB + "」が " + hit.length + "本の 中に あります");

    if (!MARK) { console.log("\n★印が 渡されて いません。★較正だけ しました。"); return; }
    console.log("\n★印 ── 「" + MARK + "」");
    const found = bodies.filter((x) => x.t.includes(MARK));
    console.log(found.length
      ? "  ★★届いて います（" + found.length + "本の 中）"
      : "  ★まだ 届いて いません");
    if (!found.length) process.exitCode = 2;
  } finally { await b.close(); }
})();
