/**
 * ★運営の 見本を 撮る（★2026-09-18・第2群）。
 *
 *   ★★見本は `file://` で 開けます。★中の `S` を 動かして、★画面を 選びます。
 *     S.post … ★どの 役職として 見るか（★見え方が 変わります）
 *     S.tab  … ★どの 帯か（★設定 は '設定'）
 *     S.st2  … ★設定の 中の どの 節か
 *     S.dev  … 'pc' / 'tab' / 'ph'
 *
 *   ★★★較正 ── ★撮る 前に、★狙った 画面が 本当に 出て いるかを 見ます。
 *     ★★見出しの 字が ちがえば、★そこで 止まります。★白い 絵を 残しません。
 *
 *   ★使い方
 *     node tools/ops_mihon_shot.js 設定 ご請求
 */
const path = require("path");
const ROOT = path.join(__dirname, "..");
const MIHON = "file://" + path.join(ROOT, "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html");

const tab = process.argv[2] || "設定";
const st2 = process.argv[3] || null;
const post = process.argv[4] || "学長";
const dev = process.argv[5] || "pc";

(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });
  const page = await b.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  try {
    await page.goto(MIHON, { waitUntil: "load" });
    await page.waitForTimeout(600);
    await page.evaluate(([t, s2, p, d]) => {
      S.dev = d; S.post = p; S.stack = []; S.tab = t;
      if (s2) S.st2 = s2;
      draw();
    }, [tab, st2, post, dev]);
    await page.waitForTimeout(500);

    // ★★較正 ── ★狙った 画面が 出て いるか。
    const 見出し = await page.evaluate(() => {
      const h = document.querySelector("#bodyEl h2, .dev h2");
      return h ? h.textContent.trim() : "";
    });
    console.log("★出て いる 見出し: " + (見出し || "（ありません）"));
    if (!見出し) {
      console.error("★止まりました ── 見出しが ありません。★白い 絵を 残しません。");
      process.exitCode = 1; return;
    }

    const 名 = "mihon-" + tab + (st2 ? "-" + st2 : "") + "-" + post + "-" + dev + ".png";
    const dst = path.join(ROOT, "docs/design/compare/ops", 名);
    const el = await page.$("#dev");
    await (el || page).screenshot({ path: dst });
    console.log("★撮りました: docs/design/compare/ops/" + 名);
  } finally { await b.close(); }
})();
