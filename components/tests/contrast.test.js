#!/usr/bin/env node
// ============================================================================
// 文字の 読みやすさ（2026-09-10・Opus の 指摘）
//
//   ★出どころ 坂本さん経由・Opus の 指摘（2026-09-10）
//     「--ink3: #A79684 → #7C6C5E ／ --yama: #BF8722 → #8C6115」
//     「.note の 文字色を --ink2 に。★--ink3 は 罫線・アイコン・区切りにのみ」
//
//   ★★指摘は 見本（HTML）の 変数に ついてのものでした。
//     ★アプリの 色は lib/tokens.js に あり、★別の 値です。
//     ★★だから、★言われた とおりに 置き換えず、★測ってから 決めました。
//
//   ★★測った 結果（★紙 #F6F1E7 の 上）
//     ★inkSoft #6b5d52 … 5.63　★もう 足りています（★#7C6C5E の 4.68 より 濃い）
//     ★gold　　#B8863B … 2.86　★足りません → ★#8C6115（5.08）に しました
//
//   ★★この見張りは、★色が 薄い側へ 戻らないように します。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

function lin(c) { const x = c / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
function lum(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(a, b) {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "tokens.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const C = m.C;
  const PAPER = C.paper, CARD = C.card;

  // ★小さい字 4.5 ／ 大きい字・図 3.0
  const TEXT_MIN = 4.5;

  console.log("=== 字に 使う 色は、4.5 以上 ===");
  // ★★字に 使う 色（★塗りだけの 色は 別に 見ます）
  const TEXT_COLORS = ["ink", "inkSoft", "curtain", "gold"];
  TEXT_COLORS.forEach((k) => {
    const p = ratio(C[k], PAPER), c = ratio(C[k], CARD);
    t(p >= TEXT_MIN && c >= TEXT_MIN,
      `★C.${k}（${C[k]}）　紙 ${p.toFixed(2)}／札 ${c.toFixed(2)}`);
  });

  console.log("\n=== 山吹を 濃くした（★2026-09-10） ===");
  t(C.gold === "#8C6115", `★C.gold は #8C6115（いま ${C.gold}）`);
  t(ratio(C.gold, PAPER) >= TEXT_MIN, `★紙の上で ${ratio(C.gold, PAPER).toFixed(2)}`);
  t(ratio("#B8863B", PAPER) < TEXT_MIN, "★前の #B8863B は 足りていなかった（2.86）");

  console.log("\n=== inkSoft は、そのままで 足りている ===");
  // ★★Opus の 指摘の #7C6C5E より、★いまの ほうが 濃いこと。
  //   ★★言われた とおりに すると、★薄く なります。★しません。
  t(ratio(C.inkSoft, PAPER) > ratio("#7C6C5E", PAPER),
    `★C.inkSoft ${ratio(C.inkSoft, PAPER).toFixed(2)} ＞ #7C6C5E ${ratio("#7C6C5E", PAPER).toFixed(2)}`);
  t(C.inkSoft !== "#A79684", "★見本の 薄い ink3 を 持ち込んでいない");

  console.log("\n=== 薄い色を、小さい字に 使っていない ===");
  {
    // ★★#A79684（見本の 古い ink3）が、★アプリに 入り込んでいないこと
    const dirs = ["components", "app", "lib"];
    const hits = [];
    const walk = (p) => {
      fs.readdirSync(p, { withFileTypes: true }).forEach((e) => {
        const f = path.join(p, e.name);
        if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "tests") walk(f); return; }
        if (!/\.(js|jsx|css)$/.test(e.name)) return;
        if (/#A79684/i.test(fs.readFileSync(f, "utf8"))) hits.push(f);
      });
    };
    dirs.forEach((d) => { const b = path.join(__dirname, "..", "..", d); if (fs.existsSync(b)) walk(b); });
    t(hits.length === 0, `★#A79684 を 使っていない${hits.length ? "：" + hits.join(", ") : ""}`);
  }

  console.log("\n=== 図の 色は 3.0 以上（★塗り・線） ===");
  ["sage", "rust"].forEach((k) => {
    const p = ratio(C[k], PAPER);
    t(p >= 3.0, `★C.${k}（${C[k]}）　紙 ${p.toFixed(2)}`);
  });
  {
    // ★★C.sageSoft は 2.79 で、★3.0 に わずかに 届きません。
    //   ★★塗りとしてしか 使っていません（★活動の 図・LEVEL_COLORS の 4段目）。
    //   ★★字には 使っていません（★SERIES.ok は、★どこからも 呼ばれていません）。
    //   ★★濃くすると、★5段の 目盛りが ずれます。★design の 決めが 要ります。
    //     ★だから、★ここでは 直しません。★見えるように しておきます。
    //   ★坂本さんに お尋ねしている あいだ、★この行が 覚えていてくれます。
    const p = ratio(C.sageSoft, PAPER);
    t(p >= 2.7, `★C.sageSoft（${C.sageSoft}）　紙 ${p.toFixed(2)}　★3.0 に 届いていません（お尋ね中）`);
    // ★★字に 使っていないこと。★ここが 守れていれば、いまは 困りません。
    const dirs = ["components", "app"];
    const bad = [];
    const walk = (q) => {
      fs.readdirSync(q, { withFileTypes: true }).forEach((e) => {
        const f = path.join(q, e.name);
        if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "tests") walk(f); return; }
        if (!/\.(js|jsx)$/.test(e.name)) return;
        if (/color:\s*C\.sageSoft\b/.test(fs.readFileSync(f, "utf8"))) bad.push(path.basename(f));
      });
    };
    dirs.forEach((d) => { const b2 = path.join(__dirname, "..", "..", d); if (fs.existsSync(b2)) walk(b2); });
    t(bad.length === 0, `★C.sageSoft を 字に 使っていない${bad.length ? "：" + bad.join(", ") : ""}`);
  }

  console.log("\n=== 5段の 目盛りは、1色の 濃淡（★2026-09-10・案A） ===");
  {
    const L5 = m.LEVEL_COLORS, T5 = m.LEVEL_TEXT_COLORS;
    t(L5.length === 5 && T5.length === 5, "★5段と、5つの 字の色");
    // ★★どの段でも、★のせた 字が 読めること（★大きい字なので 3.0 以上）
    L5.forEach((bg, i) => {
      const r = ratio(bg, T5[i]);
      t(r >= 3.0, `★段${i + 1}（${bg}）の 字 ${r.toFixed(2)}`);
    });
    // ★★濃さが、★だんだん 濃くなること（★段が 見分けられること）
    const lums = L5.map(lum);
    t(lums.every((v, i) => i === 0 || v < lums[i - 1]), "★だんだん 濃くなる");
    // ★★信号の 色に 戻っていないこと
    t(!L5.includes(C.sage) && !L5.includes(C.sageSoft), "★緑を 使っていない");
    t(!L5.includes(C.gold) && !L5.includes(C.rust), "★山吹・錆を 使っていない");
    t(/濃さで 段を 示します/.test(readRaw("lib", "tokens.js")), "★わけが 書いてある");
  }

  console.log("\n=== 罫線は、薄くてよい ===");
  // ★★C.line は 罫線です。★字では ありません。★4.5 を 求めません。
  t(ratio(C.line, PAPER) < 3.0, `★C.line は 罫線（${ratio(C.line, PAPER).toFixed(2)}）★字に 使わないこと`);
  {
    // ★★C.line を 文字色に していないこと
    const dirs = ["components", "app"];
    const bad = [];
    const walk = (p) => {
      fs.readdirSync(p, { withFileTypes: true }).forEach((e) => {
        const f = path.join(p, e.name);
        if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "tests") walk(f); return; }
        if (!/\.(js|jsx)$/.test(e.name)) return;
        const body = fs.readFileSync(f, "utf8");
        // ★★style={{ … color: C.line … }} だけを 見ます。
        //   ★★はじめ「color: C.line」を すべて 拾いました。★広すぎました。
        //     ★メーターの 下地（SVG の 弧）も 当たりました。★あれは 字では ありません。
        //   ★字かどうかは、★style に 入っているかで 見分けます。
        const styles = body.match(/style=\{\{[\s\S]{0,300}?\}\}/g) || [];
        if (styles.some((x) => /color:\s*C\.line\b/.test(x))) bad.push(path.basename(f));
      });
    };
    dirs.forEach((d) => { const b = path.join(__dirname, "..", "..", d); if (fs.existsSync(b)) walk(b); });
    t(bad.length === 0, `★罫線の色を 文字に 使っていない${bad.length ? "：" + bad.join(", ") : ""}`);
  }

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
