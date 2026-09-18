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

    // ★★★内がわの 巻きものを 伸ばして から 撮ります（★2026-09-18）。
    //
    //   ★★見本は、★決まった 高さの 器の 中で **中身が 巻いて** います。
    //     ★★そのまま 撮ると、★見えて いる ぶん だけ 写ります。
    //   ★★★2026-09-18、★それで 見落としました ──
    //     ★★設定・ご請求 の 下半分（★見られないもの の 箱・お支払いの 箱・
    //       ★支払い方法／宛先／領収書 の 3つの 札・注）が
    //       ★★1枚目の 突き合わせに **入って いません** でした。
    //     ★★「見本に 無い」と 申し上げかけた ものが、★見本に ありました。
    //   ★★同じ 罠が 2026-09-11 の 覚えに あります（★sheet の max-height）。
    //     ★★覚えて いたのに、★別の 形で 同じ ことを しました。
    const 伸ばした = await page.evaluate(() => {
      // ★★★見本の 作りが 分かりました（★tools/_dom_probe.js で 測りました）──
      //     BODY
      //       .zoomwrap   … ★倍率（transform: scale）が かかって います
      //         #dev      … ★端末の 枠。★高さ 878 の 決め打ち
      //           .main   … ★はみ出しを 隠す
      //             #bodyEl.body … ★★ここが 巻いて います
      //                           ★見えるのは 796／中身は 1396
      //
      //   ★★★「巻いて いる ものを ぜんぶ 伸ばす」だけ では 足りません でした。
      //     ★★#dev の 高さが 決め打ち で、★そこで 切られます。
      //     ★★倍率も かかって いて、★撮った 絵が 小さく なります。
      //   ★★★だから ── ★①倍率を 外す ②足りない ぶん だけ 枠を 高く する。
      const 中身 = document.querySelector("#bodyEl") || document.querySelector(".body");
      const dev = document.querySelector("#dev");
      const 足りない = 中身 ? Math.max(0, 中身.scrollHeight - 中身.clientHeight) : 0;

      // ★① 倍率を 外します。★外さないと、★撮った 絵が 縮みます。
      //   ★★★倍率は `.zoomwrap` では なく **`#dev` 自身** に かかって いました
      //     （★transform: matrix(0.886, …)）。★測って 分かりました。
      //     ★★包みの ほうを 外しても、★絵は 0.886倍の まま でした。
      const wrap = document.querySelector(".zoomwrap");
      if (wrap) { wrap.style.height = "auto"; wrap.style.maxHeight = "none";
        wrap.style.overflow = "visible"; }
      if (dev) { dev.style.transform = "none"; dev.style.zoom = "1"; }

      // ★② 巻いて いる ところを 伸ばします。
      let 変えた = 0;
      [中身, document.querySelector(".main"), dev].filter(Boolean).forEach((e) => {
        e.style.overflow = "visible"; e.style.maxHeight = "none"; 変えた += 1;
      });
      if (中身) 中身.style.height = "auto";

      // ★③ 枠を、★足りない ぶん だけ 高く します。
      //   ★★`auto` に しません。★端末の 枠の 形（幅・余白）を 保ちます。
      if (dev) dev.style.height = (dev.clientHeight + 足りない) + "px";

      document.body.style.height = "auto";
      document.documentElement.style.height = "auto";
      return { 変えた, 足りない, 高さ: dev ? dev.clientHeight : 0 };
    });
    console.log("★器を 伸ばしました: " + 伸ばした.変えた + "つ ／ 足りない ぶん "
      + 伸ばした.足りない + " ／ 高さ " + 伸ばした.高さ);
    // ★★較正 ── ★伸ばした あと、★まだ 巻いて いたら 止まります。
    const まだ巻いてる = await page.evaluate(() => {
      const e = document.querySelector("#bodyEl") || document.querySelector(".body");
      return e ? e.scrollHeight - e.clientHeight : 0;
    });
    if (まだ巻いてる > 4) {
      console.error("★止まりました ── まだ " + まだ巻いてる + "px 巻いて います。★下が 写りません。");
      process.exitCode = 1; return;
    }
    await page.waitForTimeout(400);

    const 名 = "mihon-" + tab + (st2 ? "-" + st2 : "") + "-" + post + "-" + dev + ".png";
    const dst = path.join(ROOT, "docs/design/compare/ops", 名);
    const el = await page.$("#dev");
    await (el || page).screenshot({ path: dst, scale: "css" });
    console.log("★撮りました: docs/design/compare/ops/" + 名);
  } finally { await b.close(); }
})();
