#!/usr/bin/env node

// ============================================================================
// 画面を 撮る ── ★見た目を、こちらでも 確かめられるように する
//
//   ★出どころ 坂本さんの ご提案（★2026-09-11）
//     「スクリーンショットを、手動で 撮らなくても、Code が 自分で
//       確認できる 方法は ないか」
//
//   ★★なぜ 要るか
//     ★★見張りは コードの 文字を 読みます。★画面を 見ていません。
//     ★★実機の 写真で 初めて 見つかった ものが、★1日で 6件 ありました
//       （★気温の「25」が「2」に 切れていた、★くらべるの 字の 重なり ほか）。
//     ★どれも「文字を 読む 見張り」では 永久に 見つかりません。
//
//   ★★できること／できないこと（★先に 書きます）
//     ◯ 明らかに 壊れている ものを、★お手を わずらわせる 前に 見つける
//     ✕ iPhone の 実機と 同じ 字の 出方　　★ちがいます
//     ✕ セーフエリア・指の 当たり　　　　 ★分かりません
//     ★★坂本さんの 写真の 代わりには なりません。★前さばきです。
//
//   ★★鍵について
//     ★.env.e2e から 読みます。★.gitignore に 入れてあります。
//     ★★このファイルに 鍵を 書かないこと。★撮った 絵も git に 入れません。
//     ★★使うのは 使い捨ての テスト用アカウントだけです。
//       ★本番の 鍵も、★坂本さんの 記録も、★1つも 触りません。
//
//   使い方
//     node tools/shot.js                 ★ぜんぶ 撮る
//     node tools/shot.js 記録             ★1画面だけ
//     node tools/shot.js --whoami        ★入れるかだけ 確かめる
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "artifacts", "shots");

/** ★.env.e2e を 読みます。★値は 表に 出しません。 */
function readEnv() {
  const p = path.join(ROOT, ".env.e2e");
  if (!fs.existsSync(p)) {
    console.error("★.env.e2e が ありません。★テスト用の 鍵を 置いてください。");
    process.exit(1);
  }
  const env = {};
  fs.readFileSync(p, "utf8").split("\n").forEach((line) => {
    const s = line.trim();
    if (!s || s.startsWith("#")) return;
    const i = s.indexOf("=");
    if (i < 0) return;
    env[s.slice(0, i).trim()] = s.slice(i + 1).trim();
  });
  return env;
}

/**
 * ★撮る 画面。
 *
 *   ★tab　 … 下の 帯の どれを 押すか
 *   ★steps … 押す 順（★札の 名前で 探します）
 *
 *   ★★押しどころは「見える 字」で 探します。★class 名で 探しません。
 *     ★見た目を 変えたら 壊れる、という 探し方に しないためです。
 */
const SCREENS = [
  { key: "きょう", tab: "きょう" },
  { key: "記録", tab: "記録" },
  { key: "記録-ねむり", tab: "記録", steps: ["昨夜の 睡眠"] },
  { key: "記録-こえ", tab: "記録", steps: ["本番以外で 声を使った時間"] },
  { key: "記録-ほんばん", tab: "記録", steps: ["本番・レッスン"] },
  { key: "記録-たべ", tab: "記録", steps: ["食べたもの"] },
  { key: "記録-からだ", tab: "記録", steps: ["からだのこと"] },
  { key: "記録-ひとこと", tab: "記録", steps: ["ひとこと"] },
  { key: "ふりかえる-ならべる", tab: "ふりかえる", steps: ["並べる"] },
  { key: "ふりかえる-さかのぼる", tab: "ふりかえる", steps: ["さかのぼる"] },
  { key: "ふりかえる-くらべる", tab: "ふりかえる", steps: ["くらべる"] },
  { key: "ふりかえる-かぞえる", tab: "ふりかえる", steps: ["かぞえる"] },
  { key: "ノート", tab: "ノート" },
  { key: "ひつじ", tab: "ひつじ" }
];

async function main() {
  const env = readEnv();
  const base = env.E2E_BASE_URL || "https://woolsong.app";
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const whoami = process.argv.includes("--whoami");

  const { chromium } = require("playwright");
  fs.mkdirSync(OUT, { recursive: true });

  // ★★この機械は macOS 12 です。★いまの Playwright は、
  //   ★★mac12 用の ブラウザを 落としてくれません
  //     （★"Playwright does not support chromium on mac12"）。
  //   ★★だから、★すでに 入っている Google Chrome を 借ります。
  //     ★落とし物が 増えません。★機械が 新しく なれば channel を 外せます。
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch (e) {
    console.error("★Chrome を 開けませんでした: " + String(e.message).split("\n")[0]);
    console.error("★Google Chrome が 入っているか お確かめください。");
    process.exit(1);
  }
  // ★★iPhone に 近い 大きさに します。★実機と 同じでは ありません。
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo"
  });
  const page = await ctx.newPage();

  console.log("★入ります: " + base);
  await page.goto(base + "/login", { waitUntil: "domcontentloaded" });

  // ★★入り口の 欄を、★見える 字で 探します。
  await page.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
  await page.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
  await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 45000 });
  console.log("★入れました。");

  // ★★この方の id を 取り出します（★門の 名簿に 足していただくため）。
  //   ★★Supabase の 覚え書きから 読みます。★合言葉は 読みません。
  //   ★★この家は @supabase/ssr です。★覚え書きは クッキーに 入ります
  //     （★localStorage では ありません）。★2026-09-11 に そう 分かりました。
  //   ★★取り出すのは id だけです。★合言葉も 鍵も 読みません。
  const who = await (async () => {
    try {
      const cookies = await ctx.cookies();
      const parts = cookies
        .filter((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => c.value)
        .join("");
      if (!parts) return null;
      const raw = parts.startsWith("base64-")
        ? Buffer.from(parts.slice(7), "base64").toString("utf8")
        : decodeURIComponent(parts);
      const v = JSON.parse(raw);
      const u = v && (v.user || (v.currentSession && v.currentSession.user));
      if (u && u.id) return { id: u.id, email: u.email || null };
      // ★★中身の 形が ちがっても、★入場券から 取り出せます。
      const jwt = v && (v.access_token || (v.currentSession && v.currentSession.access_token));
      if (jwt) {
        const body = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
        if (body && body.sub) return { id: body.sub, email: body.email || null };
      }
    } catch (e) { /* ★読めなくても 撮れます */ }
    return null;
  })();
  if (who) {
    console.log("★この方の id : " + who.id);
    console.log("★★これを NEXT_PUBLIC_LAYOUT_V2_USER_IDS に 足していただくと、");
    console.log("　★新しい 画面（門の中）が 見えるように なります。");
  } else {
    console.log("★id を 読めませんでした（★撮ることは できます）。");
  }
  // ★★門の中に 居るかどうかを、★画面の 字から 見ます。
  //   ★★記録の 画面に 行ってから 見ます（★2026-09-11 の 直し）。
  //     ★入った 直後は「きょう」なので、★この字は そこに ありません。
  await page.locator("nav >> text=記録").first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const inGate = await page.locator("text=足す（どれも 任意）").count()
    .catch(() => 0);
  console.log("★門の中か : " + (inGate > 0 ? "はい" : "いいえ（★38人の 画面です）"));

  if (whoami) { await browser.close(); return; }

  const list = only.length ? SCREENS.filter((s) => only.includes(s.key)) : SCREENS;
  for (const sc of list) {
    try {
      // ★★前の 1枚を 閉じてから 進みます（★2026-09-11）。
      //   ★★開いたままだと、★後ろの 押しどころに 手が 届きません。
      //   ★BottomSheet は Esc で 閉じます（★出口を 3つ 置いた うちの 1つ）。
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(400);
      await page.locator(`nav >> text=${sc.tab}`).first().click({ timeout: 8000 })
        .catch(async () => { await page.locator(`text=${sc.tab}`).last().click({ timeout: 8000 }); });
      await page.waitForTimeout(900);
      for (const step of (sc.steps || [])) {
        await page.locator(`text=${step}`).first().click({ timeout: 8000 });
        await page.waitForTimeout(700);
      }
      // ★★1枚（シート）は、★下まで 見えるように してから 撮ります。
      //   ★★2026-09-11、★坂本さんの ご指摘。
      //     ★★見えている ぶんだけ 撮って、「確かめました」と 申し上げていました。
      //     ★★1枚は max-height 82% の 中で 自分で 送ります。
      //       ★だから 下の ほうは 写っていませんでした。
      //   ★★高さの 上限を 外し、★はみ出しても 見えるように してから 撮ります。
      //     ★見た目の 確かめの ための 細工です。★配信する 画面は 変えません。
      if (sc.steps) {
        await page.evaluate(() => {
          const d = document.querySelector('[role="dialog"]');
          if (!d) return;
          d.style.maxHeight = "none";
          d.style.overflow = "visible";
          d.style.position = "absolute";
          d.style.top = "0";
          d.style.bottom = "auto";
          document.body.style.overflow = "visible";
        });
        await page.waitForTimeout(500);
      }
      const file = path.join(OUT, sc.key + ".png");
      await page.screenshot({ path: file, fullPage: true });
      console.log("  ✓ " + sc.key);
    } catch (e) {
      console.log("  ✗ " + sc.key + "  " + String(e.message).split("\n")[0].slice(0, 90));
    }
  }
  await browser.close();
  console.log("\n★撮った 先: artifacts/shots/（★git には 入りません）");
}

main().catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
