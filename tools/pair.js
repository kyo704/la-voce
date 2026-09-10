#!/usr/bin/env node

// ============================================================================
// 見本（左）と 実装（右）を 並べる ── ★くらべる 絵
//
//   ★出どころ Fable の 決まり（★2026-09-11・坂本さん 経由）
//     「docs/design/compare/<screen>.png ── mockup on the left,
//       implementation on the right」
//   ★坂本さんの お指図（★同日）
//     ①iPhone の 幅（390px）だけ　②見本 左・実装 右
//     ③画面の 全体を 省略せず　　 ④1ページ 8枚ほど・読める 大きさ
//     ⑤ページが 増えても かまわない。★正確さを 最優先
//
//   ★★切り取りません。★どの 絵も 上から 下まで 入れます。
//     ★★前は 高さ 300px で 切っていました。★それでは 突き合わせに なりません。
//
//   ★出るもの
//     docs/design/compare/<画面>.png　　★1画面 1枚（★これが 証拠です）
//     docs/design/compare/all/sheet-NN.png ★8枚ずつの 一覧（★✗ を つける 紙）
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const COMPARE = path.join(ROOT, "docs", "design", "compare");
const MIHON = path.join(COMPARE, "all", "mihon");
const FRAMES = path.join(COMPARE, "all", "frames");
const SHEETS = path.join(COMPARE, "all");

/** ★1つの 絵の、★並べたときの 幅。★これ以上 小さく しません。 */
const CELL_W = 360;

function b64(p) { return fs.readFileSync(p).toString("base64"); }

/** ★絵の 大きさ（★png の 頭から 読みます）。 */
function pngSize(p) {
  const b = fs.readFileSync(p);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function pairs() {
  if (!fs.existsSync(MIHON) || !fs.existsSync(FRAMES)) return [];
  const mihon = fs.readdirSync(MIHON).filter((f) => f.endsWith(".png"));
  const out = [];
  mihon.forEach((f) => {
    const key = f.replace(/\.png$/, "");
    const impl = path.join(FRAMES, key + "@390.png");
    out.push({
      key,
      mihon: path.join(MIHON, f),
      impl: fs.existsSync(impl) ? impl : null
    });
  });
  // ★実装だけ ある もの（★見本に 無い 画面）も 出します。★黙って 落としません。
  fs.readdirSync(FRAMES).filter((f) => f.endsWith("@390.png")).forEach((f) => {
    const key = f.replace(/@390\.png$/, "");
    if (out.some((x) => x.key === key)) return;
    out.push({ key, mihon: null, impl: path.join(FRAMES, f) });
  });
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

/** ★1枚ぶんの HTML。★どちらも 幅 CELL_W に そろえ、★高さは そのまま。 */
function cardHtml(p) {
  const side = (file, label, tone) => {
    if (!file) {
      return `<div class="side"><div class="lab ${tone}">${label}<b>★ありません</b></div>
        <div class="none">この 画面は 撮れていません</div></div>`;
    }
    const s = pngSize(file);
    const h = Math.round(s.h * (CELL_W / s.w));
    return `<div class="side"><div class="lab ${tone}">${label}<b>${s.w}×${s.h}</b></div>
      <img src="data:image/png;base64,${b64(file)}" style="width:${CELL_W}px;height:${h}px">
      </div>`;
  };
  return `<figure>
    <figcaption><span class="k">${p.key}</span><span class="x">✗</span></figcaption>
    <div class="two">
      ${side(p.mihon, "見本", "m")}
      ${side(p.impl, "実装", "i")}
    </div>
  </figure>`;
}

const CSS = `
  body{margin:0;padding:20px;background:#F6F1E7;
       font-family:-apple-system,"Hiragino Sans",system-ui,sans-serif}
  h1{font-size:16px;margin:0 0 14px;color:#241914}
  .g{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;align-items:start}
  figure{margin:0;background:#FFFDF8;border:1px solid #E4DCC9;border-radius:12px;padding:10px}
  figcaption{display:flex;justify-content:space-between;align-items:center;
             font-size:13px;color:#241914;margin-bottom:8px;font-weight:600}
  .x{color:#E4DCC9;font-size:18px;font-weight:700;border:1px solid #E4DCC9;
     border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center}
  .two{display:flex;gap:10px;align-items:flex-start}
  .side{flex:0 0 auto}
  .lab{font-size:11px;color:#6b5d52;margin-bottom:4px;display:flex;
       justify-content:space-between;gap:8px;width:${CELL_W}px}
  .lab b{font-weight:400;color:#A79684}
  .lab.m{color:#4F7562}.lab.i{color:#7A1F2B}
  img{display:block;border:1px solid #E4DCC9;border-radius:8px;background:#fff}
  .none{width:${CELL_W}px;padding:24px 0;text-align:center;font-size:12px;color:#A79684;
        border:1px dashed #E4DCC9;border-radius:8px}
`;

(async () => {
  const { chromium } = require("playwright");
  const list = pairs();
  if (!list.length) { console.log("★絵が ありません。"); return; }
  fs.mkdirSync(COMPARE, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({
    viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1
  });
  const page = await ctx.newPage();

  // ── ① 1画面 1枚（★これが 証拠です）
  for (const p of list) {
    await page.setContent(`<style>${CSS}
      .g{grid-template-columns:1fr}</style>
      <h1>${p.key}　★見本（左）と 実装（右）</h1>
      <div class="g">${cardHtml(p)}</div>`, { waitUntil: "load" });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(COMPARE, p.key + ".png"), fullPage: true });
  }
  console.log("★1画面 1枚: " + list.length + " 枚（docs/design/compare/）");

  // ── ② 8枚ずつの 一覧（★✗ を つける 紙）
  const per = 8;
  const pages = Math.ceil(list.length / per);
  for (let i = 0; i < pages; i++) {
    const group = list.slice(i * per, (i + 1) * per);
    await page.setContent(`<style>${CSS}</style>
      <h1>Woolsong ★見本（左）と 実装（右）　${i + 1} / ${pages}
      ★ちがう ところに ✗ を つけてください</h1>
      <div class="g">${group.map(cardHtml).join("")}</div>`, { waitUntil: "load" });
    await page.waitForTimeout(300);
    const out = path.join(SHEETS, "sheet-" + String(i + 1).padStart(2, "0") + ".png");
    await page.screenshot({ path: out, fullPage: true });
    const s = pngSize(out);
    console.log("  ✓ " + path.basename(out) + "（" + group.length + "枚 / "
      + s.w + "×" + s.h + "）");
  }
  await browser.close();
})().catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
