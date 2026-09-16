#!/usr/bin/env node
// ============================================================================
// ★見本を 開いて、★画面の 中身を JSON に します。
//
//   ★★出どころ　坂本さん（★2026-09-16）──
//     「★見本は 文字列連結で 書かれて います。
//       ★DOM に 描画してから 読み取る 方が 確実かも しれません。
//       ★札・行・見出し・注記を 拾えますか。JSON に できますか」
//
//   ★★お答え ── ★拾えます。★文字列を 読み解かず、★**描かせてから 読みます**。
//     ★★見本の 中の `SC['設定']()` を 呼び、★返って きた HTML を
//       ★本物の DOM に 入れて、★`querySelectorAll` で 拾います。
//     ★★だから 書き方（連結・入れ子・変数）に 左右されません。
//
//   ★★使い方　node tools/mihon_extract.js 設定
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MIHON = path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html");
const OUT = path.join(ROOT, "docs", "design", "mihon-json");

(async () => {
  if (!fs.existsSync(MIHON)) {
    console.log("★★見本が ありません: " + MIHON);
    console.log("　★抜き出しません。★止まります。");
    process.exit(1);
  }
  const names = process.argv.slice(2);
  if (!names.length) {
    console.log("★どの 画面か、★名前を ください。　例）node tools/mihon_extract.js 設定");
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const { chromium } = require("playwright");
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto("file://" + MIHON, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);

  let bad = 0;
  for (const name of names) {
    const data = await page.evaluate((n) => {
      // ★★画面を 1つ 描かせます。★前の 画面が 残らない ように。
      if (typeof SC[n] !== "function") return { error: "SC['" + n + "'] が ありません" };
      S.stack = []; S.sheet = null;
      const host = document.createElement("div");
      // ★★★引数を とる 画面が あります（★2026-09-16）。
      //   ★★`SC['やめるとどうなるか'](i)` や `SC['通っているところの中身'](i)` は、
      //     ★どの 教室か を 番号で 受けます。
      //   ★★何も 渡さないと `o.n` で 落ちます。★見本の 誤りでは ありません。
      //   ★★見本 自身の 呼び方に 合わせます ── ★1つめ（0）を 渡します。
      //     ★★勝手な 値を 作りません。★見本の `ORGS` の 1つめ です。
      host.innerHTML = SC[n].length > 0 ? SC[n](0) : SC[n]();
      const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : null);

      // ★★★拾う ものを、★見本の 組み立ての 名前で 決めます。
      //   ★★`.pill` 札　`.li` 行　`.h3`/`.cap` 見出し　`.note`/`.wl`/`.warn` 注記
      const out = {
        screen: n,
        back: txt(host.querySelector(".back")),
        title: txt(host.querySelector(".hd h2")),
        pills: [...host.querySelectorAll(".pill")].map((e) => ({
          label: txt(e), on: e.classList.contains("on"),
          small: e.classList.contains("sm")
        })),
        heads: [...host.querySelectorAll(".h3, .cap, .sh3")].map(txt),
        rows: [...host.querySelectorAll(".li")].map((e) => {
          const right = e.querySelector("s");
          const sub = e.querySelector(".usu");
          return {
            left: txt(e.querySelector("span")),
            sub: txt(sub),
            right: txt(right),
            hasSwitch: !!e.querySelector(".sw"),
            switchOn: !!e.querySelector(".sw.on")
          };
        }),
        notes: [...host.querySelectorAll(".note")].map((e) => ({
          text: txt(e),
          // ★★太字は 決めの ことが 多い です。★別に 拾います。
          bold: [...e.querySelectorAll("b, strong")].map(txt)
        })),
        wl: [...host.querySelectorAll(".wl")].map(txt),
        warn: [...host.querySelectorAll(".warn")].map(txt),
        buttons: [...host.querySelectorAll(".btn")].map((e) => ({
          label: txt(e), ghost: e.classList.contains("g"),
          small: e.classList.contains("sm")
        }))
      };
      return out;
    }, name);

    // ★★★札を 1つずつ 選んで、★変わる ものを 拾います（★2026-09-16）。
    //   ★★1度 描くだけ では、★**選ばれて いる 1つ**の 姿しか 取れません。
    //     ★★「文字の 大きさ」の 5段は、★見本では
    //       `[12,13.5,15.5,18,21][S.fs-1]` と **選んだ ぶんだけ** 出ます。
    //   ★★だから、★S.fs を 1つずつ 変えて、★そのつど 読みます。
    //     ★★これが「描かせてから 読む」の 強い ところ です。
    //       ★配列の 字を 読み解かなくて よい。★出た ものを 見れば よい。
    if (!data.error && data.pills.length) {
      data.pillEffect = await page.evaluate((arg) => {
        const out = [];
        for (let i = 1; i <= arg.n; i++) {
          S.fs = i;
          const host = document.createElement("div");
          host.innerHTML = SC[arg.n2].length > 0 ? SC[arg.n2](0) : SC[arg.n2]();
          document.body.appendChild(host);
          // ★★見本の「ためしの 字」は、★札の すぐ下の 欄 です。
          const sample = host.querySelector(".card > div:not(.pills)");
          const px = sample ? (sample.style.fontSize || null) : null;
          const on = [...host.querySelectorAll(".pill")]
            .findIndex((e) => e.classList.contains("on"));
          out.push({ step: i, onIndex: on, samplePx: px });
          host.remove();
        }
        S.fs = 2;
        return out;
      }, { n: data.pills.length, n2: name });
    }

    if (data.error) {
      console.log("  ✗ " + name + " … " + data.error);
      bad++;
      continue;
    }
    const f = path.join(OUT, name + ".json");
    fs.writeFileSync(f, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log("  ✓ " + name
      + "　札" + data.pills.length
      + " 行" + data.rows.length
      + " 見出し" + data.heads.length
      + " 注記" + data.notes.length
      + " 押しどころ" + data.buttons.length);
  }
  await browser.close();
  console.log("");
  console.log("★出た 先: " + path.relative(ROOT, OUT) + "/");
  if (bad) {
    console.log("★★抜き出せなかった もの: " + bad + " 件");
    process.exit(1);
  }
})().catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
