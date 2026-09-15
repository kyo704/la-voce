// ============================================================================
// ★見本の 1画面を、★そのまま 撮ります
//
//   ★出どころ [ACTION] 坂本さん（★2026-09-15）
//     「見本の SC['設定'] を ★ブラウザで 実際に 開き、★スクリーンショットを 撮る
//       （色・余白・フォントサイズ・並び順・区切り線・カードの 境界線など、
//        ★見た目の 情報を 全て 含めて）」
//
//   ★★`tools/compare.js` は、★実装の 側しか 撮って いませんでした。
//     ★★見本の 側を 撮る 道具が、★きょうまで ありませんでした。
//     ★★だから「字が あるか」しか 見られません でした。
//
//   ★★見本は 1枚の HTML で、★中に 自前の 画面遷移を 持って います。
//     `go(tab)`  … 下の 帯を 選ぶ
//     `push(名)` … その 画面を 重ねる
//     `draw()`   … 描き直す
//   ★★だから、★開いてから その 関数を 呼びます。
//
//   ★★使い方
//     node tools/mihon_shot.js 設定
//     node tools/mihon_shot.js 設定 書き出す 退会
//
//   ★★出る 先 … docs/design/compare/mihon/<名>@390.png（★と .json）
// ============================================================================

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const MIHON = path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html");
const OUT = path.join(ROOT, "docs", "design", "compare", "mihon");

(async () => {
  if (!fs.existsSync(MIHON)) {
    console.log("★★見本が ありません: " + MIHON);
    console.log("　★撮りません。★止まります。");
    process.exit(1);
  }
  const names = process.argv.slice(2);
  if (names.length === 0) {
    console.log("★どの 画面を 撮るか、★名前を ください。");
    console.log("　例）node tools/mihon_shot.js 設定");
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });
  const page = await ctx.newPage();
  await page.goto("file://" + MIHON, { waitUntil: "domcontentloaded" });

  let ng = 0;
  for (const name of names) {
    // ★★その 名前の 画面が 見本に あるか、★先に 確かめます。
    const exists = await page.evaluate((n) => typeof SC[n] === "function", name);
    if (!exists) {
      console.log("  ✗ " + name + " … ★見本に ありません（SC['" + name + "']）");
      ng++;
      continue;
    }
    // ★★一度 まっさらに してから 重ねます。★前の 画面が 残らない ように。
    await page.evaluate((n) => {
      S.stack = [];
      S.sheet = null;
      push(n);
    }, name);
    await page.waitForTimeout(250);

    // ★★★`fullPage: true` に しては いけません（★2026-09-15）。
    //   ★★見本の HTML は、★電話の 枠の **下にも** 長い 説明を 持って います。
    //     ★★body は 5286px、★画面の 中身（`#bd`）は ★728px でした。
    //     ★★fullPage で 撮ると、★ほとんどが 設定の 画面では ありません。
    //   ★★だから `#bd` だけを 切り取ります。★これが「その 画面」です。
    const png = path.join(OUT, name + "@390.png");
    const bd = await page.$("#bd");
    if (!bd) {
      console.log("  ✗ " + name + " … ★`#bd` が 見つかりません");
      ng++;
      continue;
    }
    await bd.screenshot({ path: png });

    // ★★見える 字も 書き出します。★絵だけでは 数えられません。
    const dump = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll("#bd *").forEach((el) => {
        if (el.children.length > 0) return;
        const t = (el.textContent || "").trim();
        if (!t) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        const cs = getComputedStyle(el);
        out.push({
          text: t, tag: el.tagName.toLowerCase(), cls: el.className || "",
          x: Math.round(r.x), y: Math.round(r.y),
          w: Math.round(r.width), h: Math.round(r.height),
          size: cs.fontSize, weight: cs.fontWeight, color: cs.color
        });
      });
      return out;
    });
    fs.writeFileSync(path.join(OUT, name + "@390.json"),
      JSON.stringify(dump, null, 1), "utf8");
    console.log("  ✓ " + name + "@390　（" + dump.length + " 塊）");
  }

  await browser.close();
  console.log("\n★出た 先: docs/design/compare/mihon/");
  if (ng > 0) {
    console.log("★★撮れなかった もの: " + ng + " 件");
    process.exit(1);
  }
})();
