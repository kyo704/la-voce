/**
 * ★運営の 入口が 出ない わけを、★画面の 中から 測ります（★2026-09-18）。
 *
 *   ★★紙（SQL）では「役職は 付いて いる」。★画面には 札が 出ない。
 *   ★★食い違って います。★★測るのは **画面が 実際に 受け取る もの** です。
 *
 *   ★★試しの 口（+forcode）が、★自分の 行を 読むだけ です。
 *     ★★人の 記録は 1行も 読みません。
 *
 *   ★★較正 ── ★memberships が 0件なら、★測りが 壊れて います（★口が 違う）。
 *     ★★その ときは 止まります。
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
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, locale: "ja-JP", timezoneId: "Asia/Tokyo" });
  const page = await ctx.newPage();
  // ★★anon の 鍵は、★画面が 自分で 出す 要求から 借ります。
  //   ★★束の 中を 探して いました。★見つかりません でした（★別の 塊に あります）。
  //   ★★画面が 実際に 付けて いる もの ── ★それが いちばん 確かです。
  let anon = null;
  page.on("request", (r) => {
    if (!anon && r.url().includes(".supabase.co/rest/")) anon = r.headers()["apikey"] || null;
  });
  try {
    await page.goto("https://woolsong.app/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
    await page.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    await page.waitForTimeout(3500);

    if (!anon) { console.error("★止まりました ── anon の 鍵を 借りられません でした。"); process.exitCode = 1; return; }
    const out = await page.evaluate(async (anon) => {
      // ★★合言葉は 画面が すでに 持って いる もの を 借ります。★私は 作りません。
      let tok = null, url = null, key = null;
      // ★★@supabase/ssr は **切符（cookie）** に 置きます。★localStorage では ありません。
      //   ★★はじめ localStorage を 見て いました。★較正で 止まって 分かりました。
      //   ★★長い ときは `.0` `.1` に 割られます。★番の 順に つなぎます。
      const 切符 = {};
      document.cookie.split(";").forEach((c) => {
        const i = c.indexOf("=");
        if (i > 0) 切符[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1));
      });
      const 名 = Object.keys(切符).filter((k) => /^sb-.*-auth-token(\.\d+)?$/.test(k))
        .sort((a, b) => (Number((a.split(".")[1] || 0)) - Number((b.split(".")[1] || 0))));
      if (名.length) {
        let v = 名.map((k) => 切符[k]).join("");
        if (v.startsWith("base64-")) { try { v = atob(v.slice(7)); } catch (e) {} }
        try { tok = JSON.parse(v).access_token; } catch (e) {}
        const ref = 名[0].replace(/^sb-/, "").replace(/-auth-token(\.\d+)?$/, "");
        url = "https://" + ref + ".supabase.co";
      }
      const 引く = async (q) => {
        const r = await fetch(url + "/rest/v1/" + q, { headers: { apikey: key, Authorization: "Bearer " + tok } });
        return { 番: r.status, 中: (await r.text()).slice(0, 900) };
      };
      const me = await 引く("memberships?select=org_id,role,post_id");
      let posts = { 番: "―", 中: "（役職の番号が ありません）" };
      let ids = [];
      try { ids = JSON.parse(me.中).map((x) => x.post_id).filter(Boolean); } catch (e) {}
      if (ids.length) posts = await 引く("org_posts?select=id,name,perms&id=in.(" + ids.join(",") + ")");
      return { 束: url, 在籍: me, 役職: posts, 番号の数: ids.length };
    }, anon);

    console.log("★台帳: " + out.束);
    console.log("★【一】自分の 在籍  番=" + out.在籍.番);
    console.log("   " + out.在籍.中);
    console.log("★【二】その 役職    番=" + out.役職.番 + " / 番号の数=" + out.番号の数);
    console.log("   " + out.役職.中);

    // ★★較正 ── ★0件なら 測りが 壊れて います。
    if (out.在籍.番 !== 200 || out.在籍.中 === "[]") {
      console.error("★止まりました ── 在籍が 読めません。★測りの ほうを 疑って ください。");
      process.exitCode = 1;
    }
  } finally { await b.close(); }
})();
