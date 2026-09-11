// ★1回だけ 使う 道具。★JavaScript の まま 残します。
//   ★★道具は Python で 書く 決まり（★2026-09-11）ですが、
//     ★★この 家に 入って いる Playwright は Node の ほうだけ です
//     （★python の playwright は 入って いません）。
//   ★★拾った 鍵は .env.e2e に 控えるので、★以後 Python 側だけで 回ります。
// ★1回だけ 使う 道具。★みんなに 配られて いる 鍵を 拾って、.env.e2e に 控えます。
//   ★★この 鍵は、★どなたの ブラウザにも 配られて いる 公開の ものです。
//   ★★これが あれば、★Python 側は ブラウザ 無しで 動けます。
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const s = l.trim(); if (!s || s.startsWith("#")) return;
  const i = s.indexOf("="); if (i > 0) env[s.slice(0, i).trim()] = s.slice(i + 1).trim();
});
(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });
  const c = await b.newContext({ locale: "ja-JP" });
  const p = await c.newPage();
  let anon = null, url = null;
  p.on("request", (r) => {
    if (anon) return;
    if (!/\.supabase\.co\/(rest|auth)\/v1\//.test(r.url())) return;
    const h = r.headers(); if (h.apikey) { anon = h.apikey; url = r.url().split("/rest")[0].split("/auth")[0]; }
  });
  await p.goto((env.E2E_BASE_URL || "https://woolsong.app") + "/login", { waitUntil: "domcontentloaded" });
  await p.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
  await p.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
  await p.locator('button[type="submit"], button:has-text("ログイン")').first().click();
  await p.waitForURL(/\/dashboard/, { timeout: 45000 });
  for (let i = 0; i < 40 && !anon; i++) await p.waitForTimeout(500);
  await b.close();
  if (!anon) { console.log("★拾えません でした"); process.exit(1); }
  let txt = fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8");
  txt = txt.replace(/\nE2E_SUPABASE_URL=.*/g, "").replace(/\nE2E_SUPABASE_ANON=.*/g, "");
  txt = txt.replace(/\n*$/, "\n") +
    "# ★みんなに 配られて いる 鍵（★公開の もの）。★Python の 道具が 使います。\n" +
    "E2E_SUPABASE_URL=" + url + "\nE2E_SUPABASE_ANON=" + anon + "\n";
  fs.writeFileSync(path.join(ROOT, ".env.e2e"), txt, "utf8");
  console.log("★.env.e2e に 控えました（" + url + "）");
})();
