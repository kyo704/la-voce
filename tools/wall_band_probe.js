/**
 * ★壁の ものが、★どこまで 下げられるか を 実機で 確かめる（★2026-09-18）。
 *
 *   ★★`WALL_BAND` を [5, 40] → [0, 52] に 広げました。
 *   ★★字を 読むだけ では、★本当に 下がるか 分かりません。★動かして 測ります。
 *
 *   ★★較正 ── ★掴む 前の 位置と、★掴んだ あとの 位置が
 *     ★同じ なら、★掴めて いません。★そこで 止めます。
 */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

const topOf = (page, key) => page.evaluate((k) => {
  const el = document.querySelector(`[data-item-id="${k}"]`);
  if (!el) return null;
  const m = /top:\s*([\d.]+)%/.exec(el.getAttribute("style") || "");
  const r = el.getBoundingClientRect();
  return { top: m ? Number(m[1]) : null, y: +r.y.toFixed(1), h: +r.height.toFixed(1) };
}, key);

(async () => {
  const { chromium, devices } = require("playwright");
  const base = process.env.E2E_BASE_URL || env.E2E_BASE_URL || "https://woolsong.app";
  console.log("★測る 先: " + base);
  const b = await chromium.launch({ channel: "chrome" });
  const ctx = await b.newContext({ ...devices["iPhone 12"],
    viewport: { width: 390, height: 844 }, locale: "ja-JP", timezoneId: "Asia/Tokyo" });
  const page = await ctx.newPage();
  try {
    await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
    await page.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    // ★★★1枚（dialog）が 出て いる ことが あります。★先に 閉じます。
    //   ★★出る のが 遅い ことも ある ので、★押す たびに 見ます。
    const 閉じる = async () => {
      for (let i = 0; i < 5; i++) {
        if (!(await page.locator('[role="dialog"]').count())) return;
        const 札 = await page.evaluate(() =>
          [...document.querySelectorAll('[role="dialog"] button')]
            .map((e) => (e.textContent || "").trim()).filter(Boolean).slice(0, 8));
        console.log("★1枚が 出て います。★札: " + (札.join(" / ") || "（無し）"));
        await page.keyboard.press("Escape").catch(() => {});
        await page.waitForTimeout(500);
        if (await page.locator('[role="dialog"] button').count()) {
          await page.locator('[role="dialog"] button').last().click({ force: true }).catch(() => {});
          await page.waitForTimeout(600);
        }
      }
    };
    const 押す = async (sel) => {
      await 閉じる();
      const el = page.locator(sel).first();
      if (!(await el.count())) return false;
      await el.click({ force: true, timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1200);
      return true;
    };
    await 閉じる();
    await 押す('button:has-text("ひつじ")');
    await 閉じる();
    if (!(await 押す('button:has-text("したく")'))) {
      throw new Error("★「したく」の 札が ありません");
    }
    await 押す('button:has-text("配置"), [role="button"]:has-text("配置")');
    await 閉じる();

    const keys = await page.evaluate(() =>
      [...document.querySelectorAll("[data-item-id]")]
        .map((e) => e.getAttribute("data-item-id"))
        .filter((k) => /wallart|window|wallhang/.test(k)));
    console.log("★掴める 壁の もの: " + (keys.join(" / ") || "（見つかりません）"));
    if (!keys.length) throw new Error("★壁の ものが 見つかりません（★配置の 用意が 未了かも）");

    const key = keys[0];
    // ★★「うごかす」に なって いるか を、★先に 見ます。
    //   ★★なって いなければ、★引いても 動きません。★掴めて いない のとは 別 です。
    const 編集 = await page.evaluate(() => {
      const dashed = [...document.querySelectorAll("div")]
        .filter((e) => (e.getAttribute("style") || "").includes("dashed")).length;
      const 札 = [...document.querySelectorAll("button, [role=button]")]
        .map((e) => (e.textContent || "").trim())
        .filter((t) => t && t.length < 14 && /配置|うごか|終わ/.test(t));
      return { dashed, 札 };
    });
    console.log("★破線の 札 " + 編集.dashed + "枚 ／ 押しどころ: "
      + (編集.札.join(" / ") || "（無し）"));
    const before = await topOf(page, key);
    console.log("★掴む 前 … top " + (before && before.top) + "%");

    // ★★うんと 下へ 引きます。★帯が 効いて いれば、★そこで 止まります。
    // ★★★掴む ところは、★別の 札 です（★`data-hitpad`）。
    //   ★★2026-09-18、★包み（`data-item-id`）を 引いて 動きません でした。
    //   ★★包みは `pointerEvents: "none"` です（★CharacterHome.jsx の InteriorDraggable）。
    //     ★★見た目の 札と、★掴む 札が 別 です。★掴む ほうを 引きます。
    const padSel = `[data-hitpad="${key}"]`;
    const hasPad = await page.locator(padSel).count();
    console.log("★掴む ところ … " + (hasPad ? padSel : `[data-item-id="${key}"]（★hitpad が 無い）`));
    const box = await page.locator(hasPad ? padSel : `[data-item-id="${key}"]`).boundingBox();
    if (!box) throw new Error("★掴む ところが 取れません");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + i * 22);
      await page.waitForTimeout(40);
    }
    await page.mouse.up();
    await page.waitForTimeout(900);
    const after = await topOf(page, key);
    console.log("★引いた あと … top " + (after && after.top) + "%");

    if (!before || !after || before.top === null || after.top === null) {
      console.log("★★top を 読めません でした。★見分け方を 直します。");
    } else if (before.top === after.top) {
      console.log("★★動いて いません。");
      console.log("★★ここまでは 分かって います ──");
      console.log("　★「うごかす」に なって いる（★『配置を決定』が 出て います）");
      console.log("　★掴む 札（`data-hitpad`）も あります");
      console.log("　★★それでも 動きません。★道具の 引き方が 届いて いません。");
      console.log("★★これ以上は 見当に なります。★止めます。");
      console.log("★★坂本さんに、★実機で 壁の ものを 下へ 引いて いただく のが 確かです。");
    } else {
      console.log("★★下がった ぶん … " + (after.top - before.top).toFixed(2) + " ％");
      console.log(after.top > 40
        ? "★★★40％ より 下に 行けました。★帯は 広がって います。"
        : "★★40％ より 下に 行けません。★帯が まだ 効いて います。");
    }
  } finally {
    await b.close();
  }
})();
