/**
 * ★運営の 1画面を、★決まりどおりに 数え直す（★2026-09-18・Opus 裁定）。
 *
 *   ★★禁じ手 ── ★1枚 撮って 比べる。
 *   ★★決まり ── ★①高さを 測る（見本px／実装px）
 *               ★②上・中・下 の 3枚を 撮る
 *               ★③節の 数を 数える
 *
 *   ★★★なぜ ── ★2026-09-18、★見本の **上半分 だけ** を 撮って
 *     ★★「見本に 無い」と 申し上げました。★下に ありました。
 *     ★★その 報告で 裁定が 出て、★正しい カードを 消しました。
 *   ★★高さの ちがいは、★作りの ちがいでは なく **切れて いる しるし** です。
 *
 *   ★★この 道具は 数を 出すだけ です。★文は 書きません。
 *     ★★`tools/ops_recount_report.py` が、★この 数から 紙を 作ります。
 *
 *   ★使い方  node tools/ops_recount.js 設定 ご請求 学長
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "docs/design/compare/ops");
const MIHON = "file://" + path.join(ROOT, "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html");

const tab = process.argv[2] || "設定";
const st2 = process.argv[3] || "ご請求";
const post = process.argv[4] || "学長";
const W = 1280;

const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

/**
 * ★節を 数える ── ★小見出し・箱・行・押せる もの。
 *
 *   ★★★2度 数え違えました。★どちらも「数え方が 片方の 形」でした。
 *     ★一 ★見本の 押せる ものに、★**見本を 試す ための 札**が
 *       ★★21個 のうち 18個 入って いました
 *         （★パソコン1400×880／役職の 10個／状態の 5個）。
 *       ★★あれは 見本の 外の 仕掛け です。★品では ありません。
 *       ★★→ ★`#dev` の 中 だけ を 数えます。
 *     ★二 ★実装の 箱と 行が **0** と 出ました。
 *       ★★見本は `class="card"` `class="li"`。★実装は 字の 型（inline）です。
 *       ★★名前で 数えると、★実装は いつも 0 に なります。
 *       ★★→ ★**形** で 数えます（★枠が あって 角が 丸い もの＝箱）。
 *
 *   ★★数え方を 片方に 合わせると、★もう 片方が いつも 0 か 満点に なります。
 *     ★★どちらにも 当てはまる 数え方に します。
 */
const 数える = () => {
  // ★★★数えるのは「中身の ところ」だけ です。
  //   ★★見本 …… `#bodyEl`（★左の 帯も 上の 帯も 入りません）
  //   ★★実装 …… ★題（h2）を 抱えて いる ところ
  //   ★★★きょう 3度目の 数え違い ── ★実装の 押せる ものが 21個 と 出ました。
  //     ★★下の 帯（ホーム／日程／…）と 上の 帯が 入って いました。
  //     ★★見本の 左の 帯は `<div class="nv">` で、★札では ありません。
  //     ★★同じ ものを 数えて いない のに、★並べて 出して いました。
  const 見本の中身 = document.querySelector("#bodyEl");
  let 根 = 見本の中身;
  if (!根) {
    const h = document.querySelector("h2");
    根 = h ? (h.parentElement && h.parentElement.parentElement
      ? h.parentElement.parentElement : h.parentElement) : document.body;
  }
  if (!根) 根 = document.body;
  const 字 = (sel) => [...根.querySelectorAll(sel)]
    .map((e) => (e.textContent || "").trim().replace(/\s+/g, " "))
    .filter(Boolean);

  // ★★箱 ── ★形で 見ます。★枠が あって、★角が 丸くて、★中身が ある もの。
  const 箱 = [...根.querySelectorAll("div")].filter((e) => {
    const cs = getComputedStyle(e);
    const 角 = parseFloat(cs.borderTopLeftRadius) || 0;
    const 枠 = parseFloat(cs.borderTopWidth) || 0;
    return 角 >= 8 && 枠 > 0 && e.clientHeight > 24 && e.children.length > 0;
  });

  // ★★行 ── ★箱の 中の、★左右に 分かれた 1行。
  const 行 = 箱.reduce((n, b) => n + [...b.children].filter((c) => {
    const cs = getComputedStyle(c);
    return (cs.display === "flex" && cs.justifyContent.includes("between"))
      || c.classList.contains("li");
  }).length, 0);

  return {
    小見出し: 字(".h3, p.h3"),
    箱: 箱.length,
    行,
    押せるもの: 字("button, .btn, .pill").filter((x) => x.length < 26)
  };
};

(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });
  const 結果 = { tab, st2, post, 見本: null, 実装: null };
  try {
    // ------------------------------------------------------------------
    // ★一 ★見本
    // ------------------------------------------------------------------
    const p1 = await b.newPage({ viewport: { width: W, height: 1000 }, deviceScaleFactor: 2 });
    await p1.goto(MIHON, { waitUntil: "load" });
    await p1.waitForTimeout(600);
    await p1.evaluate(([t, s, po]) => {
      S.dev = "pc"; S.post = po; S.stack = []; S.tab = t; if (s) S.st2 = s; draw();
    }, [tab, st2, post]);
    await p1.waitForTimeout(500);

    const m = await p1.evaluate(() => {
      const 中身 = document.querySelector("#bodyEl") || document.querySelector(".body");
      const dev = document.querySelector("#dev");
      const 見える = 中身 ? 中身.clientHeight : 0;
      const ぜんぶ = 中身 ? 中身.scrollHeight : 0;
      const 足りない = Math.max(0, ぜんぶ - 見える);
      const wrap = document.querySelector(".zoomwrap");
      if (wrap) { wrap.style.height = "auto"; wrap.style.maxHeight = "none"; wrap.style.overflow = "visible"; }
      if (dev) { dev.style.transform = "none"; dev.style.zoom = "1"; }
      [中身, document.querySelector(".main"), dev].filter(Boolean).forEach((e) => {
        e.style.overflow = "visible"; e.style.maxHeight = "none";
      });
      if (中身) 中身.style.height = "auto";
      if (dev) dev.style.height = (dev.clientHeight + 足りない) + "px";
      document.body.style.height = "auto";
      return { 見える, ぜんぶ, 足りない };
    });
    await p1.waitForTimeout(300);

    // ★★較正 ── ★まだ 巻いて いたら 止まります。★半分の 絵を 残しません。
    const 残り = await p1.evaluate(() => {
      const e = document.querySelector("#bodyEl") || document.querySelector(".body");
      return e ? e.scrollHeight - e.clientHeight : 0;
    });
    if (残り > 4) {
      console.error("★止まりました ── 見本が まだ " + 残り + "px 巻いて います。");
      process.exitCode = 1; return;
    }

    const 見本の数 = await p1.evaluate(数える);
    const dev = await p1.$("#dev");
    const box = await dev.boundingBox();
    結果.見本 = { 高さ: Math.round(box.height), 見える: m.見える, ぜんぶ: m.ぜんぶ, ...見本の数 };
    await 三枚(p1, dev, "mihon-" + tab + "-" + st2);
    await p1.close();

    // ------------------------------------------------------------------
    // ★二 ★実装
    // ------------------------------------------------------------------
    const ctx = await b.newContext({
      viewport: { width: W, height: 1000 }, deviceScaleFactor: 2,
      locale: "ja-JP", timezoneId: "Asia/Tokyo"
    });
    const p2 = await ctx.newPage();
    await p2.goto("https://woolsong.app/login", { waitUntil: "domcontentloaded" });
    await p2.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
    await p2.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
    await p2.locator('button[type="submit"], button:has-text("ログイン")').first().click();
    await p2.waitForURL(/\/dashboard/, { timeout: 45000 });
    await p2.waitForTimeout(3500);

    // ★★1枚（dialog）が 出て いたら 閉じます。★出て いると 歯車を 押せません。
    for (let i = 0; i < 4; i++) {
      if (!(await p2.locator('[role="dialog"]').count())) break;
      await p2.keyboard.press("Escape").catch(() => {});
      await p2.waitForTimeout(500);
      if (await p2.locator('[role="dialog"] button').count()) {
        await p2.locator('[role="dialog"] button').last().click({ force: true }).catch(() => {});
        await p2.waitForTimeout(600);
      }
    }
    // ★★★札の 字が 2とおり あります ──
    //   ★「きょう」の 歯車の 中 … 「○○ の運営」（空き 無し）
    //   ★「もっと」の 一覧の 中 … 「○○ の 運営」（空き あり）
    //   ★★片方 だけ 探して、★「入れません」と 止まって いました。
    const 運営の札 = 'button:has-text("の運営"), button:has-text("の 運営")';
    if (!(await p2.locator(運営の札).count())) {
      const 歯車 = p2.locator('button:has-text("⚙")').first();
      if (await 歯車.count()) { await 歯車.click({ force: true }).catch(() => {}); await p2.waitForTimeout(1500); }
    }
    console.log("★見えて いる 札: " + (await p2.evaluate(() =>
      [...document.querySelectorAll("button")].map((e) => (e.textContent || "").trim())
        .filter((x) => x && x.length < 24).slice(0, 30).join(" / "))));
    let ops = p2.locator(運営の札).filter({ hasText: "はじめの1人テスト" }).first();
    if (!(await ops.count())) ops = p2.locator(運営の札).first();
    if (!(await ops.count())) {
      console.error("★止まりました ── 運営に 入れません。");
      process.exitCode = 1; return;
    }
    await ops.click({ force: true });
    await p2.waitForTimeout(2000);
    const 帯 = p2.locator(`button:has-text("${tab}")`).last();
    if (await 帯.count()) { await 帯.click({ force: true }).catch(() => {}); await p2.waitForTimeout(1600); }

    const 見出し = await p2.evaluate(() =>
      [...document.querySelectorAll("h2")].map((h) => h.textContent.trim()).filter(Boolean));
    if (!見出し.length) {
      console.error("★止まりました ── 見出しが ありません。");
      process.exitCode = 1; return;
    }
    const 実装の数 = await p2.evaluate(数える);
    const 高さ = await p2.evaluate(() => document.body.scrollHeight);
    結果.実装 = { 高さ, 見える: 高さ, ぜんぶ: 高さ, ...実装の数 };
    await 三枚(p2, null, "jikki-" + tab + "-" + st2);
    await ctx.close();
  } finally { await b.close(); }

  const 道 = path.join(OUT, "recount-" + tab + "-" + st2 + ".json");
  fs.writeFileSync(道, JSON.stringify(結果, null, 2));
  console.log("★数を 出しました: " + path.relative(ROOT, 道));
})();

/** ★上・中・下 の 3枚（★1枚で 比べない）。 */
async function 三枚(page, el, 名) {
  const 的 = el || page;
  const h = el ? (await el.boundingBox()).height
    : await page.evaluate(() => document.body.scrollHeight);
  const 窓 = 1000;
  const 位置 = [0, Math.max(0, Math.round(h / 2 - 窓 / 2)), Math.max(0, Math.round(h - 窓))];
  const 札 = ["上", "中", "下"];
  for (let i = 0; i < 3; i++) {
    const dst = path.join(OUT, 名 + "-" + 札[i] + ".png");
    await 的.screenshot({
      path: dst, scale: "css",
      clip: el ? undefined : { x: 0, y: 位置[i], width: 1280, height: Math.min(窓, h - 位置[i]) }
    }).catch(async () => {
      await page.screenshot({ path: dst, scale: "css", fullPage: true });
    });
  }
  console.log("★3枚 撮りました: " + 名 + "-上／中／下");
}
