#!/usr/bin/env node

// ============================================================================
// 見本の 画面を 撮る ── ★くらべる 絵の 左半分
//
//   ★出どころ Fable の 決まり（★2026-09-11・坂本さん 経由）
//     「mockup on the left, implementation on the right」
//
//   ★正の 見本　docs/design/pack-final/（★git hash 7c7c720）
//
//   ★★2026-09-11、★坂本さんの ご指摘。
//     ★★それまでの コンタクトシートは、★実装だけを 2つの 幅で 撮っていました。
//       ★見本が 1枚も 入っていませんでした。★決まりに 従っていません。
//
//   ★★見本の 動かし方
//     ★go('記録')／setFk('くらべる')／openSheet('ねむり')／push('もっと')
//     ★★見本自身が 持っている 関数を 呼びます。★画面を 押しません。
//       ★押す 場所を 探すより、★確かで 速いからです。
//   ★★電話の 枠（.ph）は 高さ 812px で、★中（.bd）が 自分で 送ります。
//     ★★上限を 外してから 撮ります。★下が 写らない のを 防ぎます。
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MIHON = path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html");
const OUT = path.join(ROOT, "docs", "design", "compare", "all", "mihon");

/**
 * ★見本の どの 画面を 撮るか。
 *
 *   ★key　 実装の コマと 同じ 名前（★並べる ときに 突き合わせます）
 *   ★run　 見本の 中で 呼ぶ こと
 */
const SCREENS = [
  { key: "A01-きょう", run: "go('きょう')" },
  { key: "A03-記録", run: "go('記録')" },
  { key: "A03-記録-ねむり", run: "go('記録');openSheet('ねむり')" },
  { key: "A03-記録-こえ", run: "go('記録');openSheet('こえ')" },
  { key: "A03-記録-ほんばん", run: "go('記録');openSheet('honban')" },
  { key: "A03-記録-たべ", run: "go('記録');openSheet('tabe')" },
  { key: "A03-記録-からだ", run: "go('記録');openSheet('karada')" },
  { key: "A03-記録-ひとこと", run: "go('記録');openSheet('hito')" },
  { key: "A04-ならべる", run: "go('ふりかえる');setFk('並べる')" },
  { key: "A04-ならべる-4週", run: "go('ふりかえる');setFk('並べる');setSpan(28)" },
  { key: "A04-ならべる-3か月", run: "go('ふりかえる');setFk('並べる');setSpan(90)" },
  { key: "A05-さかのぼる", run: "go('ふりかえる');setFk('さかのぼる')" },
  { key: "B01-くらべる", run: "go('ふりかえる');setFk('くらべる')" },
  { key: "B01-くらべる-前の日", run: "go('ふりかえる');setFk('くらべる');S.lag=1;draw()" },
  { key: "B03-かぞえる", run: "go('ふりかえる');setFk('かぞえる')" },
  { key: "A06-ノート", run: "go('ノート')" },
  { key: "A06-ノート-レパートリー", run: "go('ノート');S.note='レパートリー';draw()" },
  { key: "A06-ノート-連絡", run: "go('ノート');S.note='連絡';draw()" },
  { key: "A06-ノート-受診用", run: "go('ノート');S.note='受診用';draw()" },
  // ★★「＋」を 押した ときの 画面（★2026-09-11・坂本さんの ご要望）。
  //   ★★Fable の 決まりの「every sheet / modal / collapsible opened」
  //     ★に あたる ぶんです。★一覧だけでは、★突き合わせに なりません。
  { key: "A06-ノート-稽古-書く", run: "go('ノート');S.note='稽古';draw();push('稽古を書く')" },
  { key: "A06-ノート-レパートリー-足す", run: "go('ノート');S.note='レパートリー';draw();openSheet('newrep')" },
  { key: "A06-ノート-新しく書く", run: "go('ノート');S.note='稽古';draw();openSheet('newnote')" },
  { key: "A06-ノート-日付と先生", run: "go('ノート');S.note='稽古';draw();openSheet('notemeta')" },
  { key: "J01-ひつじ-ながめる", run: "go('ひつじ');S.hj='ながめる';draw()" },
  { key: "J02-ひつじ-おうち", run: "go('ひつじ');S.hj='おうち';draw()" },
  { key: "A08-ひつじ-したく", run: "go('ひつじ');S.hj='したく';S.k1='きるもの';S.k2='全部';draw();openSheet('したく')" },
  { key: "J04-ひつじ-たな", run: "go('ひつじ');S.hj='たな';draw()" },
  { key: "A10-もっと", run: "push('もっと')" }
];

(async () => {
  const { chromium } = require("playwright");
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({
    // ★★実機と 同じ 倍率で 撮ります（★iPhone 12 は 3）。
    //   ★★見本の 電話の 枠は 360px です。★実装は 390px です。
    //     ★★並べる ときに 同じ 幅へ そろえるので、★倍率だけ 合わせます。
    viewport: { width: 460, height: 1000 }, deviceScaleFactor: 3,
    locale: "ja-JP", timezoneId: "Asia/Tokyo"
  });
  const page = await ctx.newPage();
  const missed = [];

  for (const sc of SCREENS) {
    try {
      await page.goto("file://" + MIHON, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      await page.evaluate(sc.run);
      await page.waitForTimeout(500);
      // ★★電話の 枠の 高さの 上限を 外します。★下まで 写すため。
      //   ★★見本を 変えていません。★撮るときだけ、★この 場で ゆるめます。
      await page.evaluate(() => {
        const ph = document.querySelector(".ph");
        const bd = document.querySelector("#bd");
        if (ph) { ph.style.height = "auto"; ph.style.overflow = "visible"; }
        if (bd) { bd.style.overflow = "visible"; bd.style.height = "auto"; }
        const sheet = document.querySelector("#sheet");
        if (sheet && sheet.classList.contains("on")) {
          sheet.style.position = "static";
          sheet.style.transform = "none";
          sheet.style.maxHeight = "none";
          const mask = document.querySelector("#mask");
          if (mask) mask.style.display = "none";
        }
        // ★見出しと 説明は、★見本の ページの ものです。★画面では ありません。
        document.querySelectorAll("h1, p.lead").forEach((e) => { e.style.display = "none"; });
      });
      await page.waitForTimeout(400);
      const el = await page.locator(".ph").first();
      await el.screenshot({ path: path.join(OUT, sc.key + ".png") });
      console.log("  ✓ " + sc.key);
    } catch (e) {
      missed.push(sc.key + "  " + String(e.message).split("\n")[0].slice(0, 70));
      console.log("  ✗ " + sc.key + "  " + String(e.message).split("\n")[0].slice(0, 60));
    }
  }
  await browser.close();
  if (missed.length) {
    fs.writeFileSync(path.join(OUT, "撮れなかった見本.txt"),
      "★見本で 撮れなかった もの（" + missed.length + "件）\n\n" + missed.join("\n") + "\n", "utf8");
  }
  console.log("\n★見本で 撮れなかった もの: " + missed.length + " 件");
})().catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
