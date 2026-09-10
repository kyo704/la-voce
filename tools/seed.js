#!/usr/bin/env node

// ============================================================================
// テスト用アカウントに、★30日ぶんの 記録を 入れる
//
//   ★出どころ Fable の 新しい 決まり（★2026-09-11・坂本さん 経由）
//     「テストアカウントには、30日分の リアルな記録を、あらかじめ 入れる」
//
//   ★★入れるのは、★見本用の 作り物だけです。
//     ★★本物の 記録を 1件も 入れません（★坂本さんの お指図）。
//   ★★入れ先は、★テスト用の 使い捨てアカウントだけです。
//     ★id は .env.e2e の E2E_EMAIL の 方だけ。★ほかの 方には 触りません。
//
//   ★★どう 入れるか
//     ★アプリの 画面から 入れます。★裏口（service role）を 使いません。
//     ★★裏口を 使うと、★rowToEntry ／ entryToRow を 通りません。
//       ★実際の 保存の 道と ちがう ものが 入り、★見た目の 確かめに なりません。
//
//   使い方  node tools/seed.js          ★30日ぶん
//           node tools/seed.js 7        ★7日ぶん
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function readEnv() {
  const p = path.join(ROOT, ".env.e2e");
  if (!fs.existsSync(p)) {
    console.error("★.env.e2e が ありません。");
    process.exit(1);
  }
  const env = {};
  fs.readFileSync(p, "utf8").split("\n").forEach((line) => {
    const s = line.trim();
    if (!s || s.startsWith("#")) return;
    const i = s.indexOf("=");
    if (i > 0) env[s.slice(0, i).trim()] = s.slice(i + 1).trim();
  });
  return env;
}

/**
 * ★その日の 見本用の 中身。
 *
 *   ★★でたらめに しません。★日ごとに 決まった 値に します。
 *     ★★撮り直すたび 絵が 変わると、★くらべられません。
 *   ★★ありえない 値を 入れません（★睡眠 4〜9時間 ほか）。
 *     ★★「リアルな 記録」で ある ことが 大事です。
 */
function planFor(i) {
  const r = (n, m) => n + ((i * 7 + m * 13) % 5);
  return {
    // ★あさ ── むくみ（ない／すこし／ある）
    edema: ["ない", "すこし", "ある"][(i * 3) % 3],
    // ★よる ── のどの 調子／声の 出来
    throat: ["よい", "ふつう", "わるい"][(i * 5) % 3],
    deki: ["出た", "ふつう", "出づらい"][(i * 2) % 3],
    // ★ねむり（★札から 選びます）
    bed: ["22:30", "23:00", "23:30", "0:00"][(i * 3) % 4],
    wake: ["6:00", "6:30", "7:00", "7:30"][(i * 5) % 4],
    // ★こえ（★4つの 札）
    koe: ["15分", "30分", "1時間", "2時間以上"][(i * 7) % 4],
    // ★食べたもの
    tabe: [["揚げ物"], ["あっさり"], ["炭酸", "カフェイン"], []][(i * 11) % 4],
    // ★からだのこと
    karada: [["のどが 渇く"], [], ["乾燥", "せきばらい"], ["肩が こわばる"]][(i * 13) % 4],
    _r: r
  };
}

async function main() {
  const env = readEnv();
  const base = env.E2E_BASE_URL || "https://woolsong.app";
  const days = Number(process.argv[2] || 30);
  const { chromium } = require("playwright");

  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true, hasTouch: true, locale: "ja-JP", timezoneId: "Asia/Tokyo"
  });
  const page = await ctx.newPage();

  await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
  await page.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
  await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 45000 });
  console.log("★入れました。★" + days + "日ぶん 入れます。");

  await page.locator("nav >> text=記録").first().click();
  await page.waitForTimeout(1200);

  const iso = (back) => {
    const d = new Date();
    d.setDate(d.getDate() - back);
    return d.toISOString().slice(0, 10);
  };

  /**
   * ★かぶさっている 1枚を 閉じます。
   *
   *   ★★2026-09-11、★記録を 保存すると、★「記録しました」の 1枚が
   *     ★かぶさり、★次の 押しどころに 手が 届きませんでした。
   *   ★★出るのが ふつうです。★消す のでは なく、★閉じてから 進みます。
   */
  const closeOverlay = async () => {
    for (let k = 0; k < 3; k++) {
      const ov = page.locator("div.fixed.inset-0.z-50");
      if ((await ov.count()) === 0) return;
      await ov.locator('button:has-text("閉じる")').first().click({ timeout: 3000 })
        .catch(async () => { await page.keyboard.press("Escape").catch(() => {}); });
      await page.waitForTimeout(500);
    }
  };

  let done = 0;
  for (let back = days - 1; back >= 0; back--) {
    const plan = planFor(back);
    try {
      // ★日を 選びます（★日付の 欄に 直に 入れます）
      await page.locator('input[type="date"]').first().fill(iso(back));
      // ★★日付の 欄を 触ると、★端末の 日付選びが 開くことが あります。
      //   ★開いたままだと、★後ろの 押しどころに 手が 届きません。
      await page.keyboard.press("Escape").catch(() => {});
      await page.locator("body").click({ position: { x: 5, y: 5 } }).catch(() => {});
      await page.waitForTimeout(900);

      // ★あさ・よる の 3択
      for (const w of [plan.edema, plan.throat, plan.deki]) {
        await page.locator(`button:has-text("${w}")`).first().click({ timeout: 4000 })
          .catch(() => {});
        await page.waitForTimeout(400);
        await closeOverlay();
      }

      // ★ねむり の 1枚
      await closeOverlay();
      await page.getByRole("button", { name: /昨夜の 睡眠/ }).first()
        .scrollIntoViewIfNeeded().catch(() => {});
      await page.getByRole("button", { name: /昨夜の 睡眠/ }).first().click({ timeout: 6000 });
      await page.waitForTimeout(500);
      await page.locator(`text="${plan.bed}"`).first().click({ timeout: 4000 }).catch(() => {});
      await page.locator(`text="${plan.wake}"`).first().click({ timeout: 4000 }).catch(() => {});
      await page.locator('button:has-text("これでいい")').first().click({ timeout: 4000 })
        .catch(() => {});
      await page.waitForTimeout(500);
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(300);

      // ★こえ の 1枚
      await closeOverlay();
      await page.getByRole("button", { name: /本番以外で 声を使った時間/ }).first().click({ timeout: 6000 });
      await page.waitForTimeout(500);
      await page.locator(`text="${plan.koe}"`).first().click({ timeout: 4000 }).catch(() => {});
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(300);

      // ★食べたもの
      if (plan.tabe.length) {
        await closeOverlay();
        await page.getByRole("button", { name: /食べたもの/ }).first().click({ timeout: 6000 });
        await page.waitForTimeout(500);
        for (const w of plan.tabe) {
          await page.locator(`text="${w}"`).first().click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(150);
        }
        await page.keyboard.press("Escape").catch(() => {});
        await page.waitForTimeout(300);
      }

      // ★からだのこと
      if (plan.karada.length) {
        await closeOverlay();
        await page.getByRole("button", { name: /からだのこと/ }).first().click({ timeout: 6000 });
        await page.waitForTimeout(500);
        for (const w of plan.karada) {
          await page.locator(`text="${w}"`).first().click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(150);
        }
        await page.keyboard.press("Escape").catch(() => {});
        await page.waitForTimeout(300);
      }

      // ★出す
      await closeOverlay();
      await page.locator('button:has-text("出す")').first().click({ timeout: 5000 })
        .catch(() => {});
      await page.waitForTimeout(900);
      await closeOverlay();
      done += 1;
      process.stdout.write("  " + iso(back) + " ✓\n");
    } catch (e) {
      process.stdout.write("  " + iso(back) + " ✗\n"
        + String(e.message).split("\n").slice(0, 12).map((x) => "      " + x).join("\n") + "\n");
    }
  }
  await browser.close();
  console.log("\n★入れた 日数: " + done + " / " + days);
}

main().catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
