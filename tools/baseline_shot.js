/**
 * ★実装の 画面 **だけ** を ★毎回 同じ 撮り方で 撮ります（★基準画 ・ 2026-09-26）。
 *
 *   ★★★見本とは くらべません。★くらべる 相手は ★実装 自身の「前の 絵」です
 *     （`tools/pixel_gate.py --baseline`）。
 *
 *   ★★撮り方は `tools/shoot.js` と 同じ 止め方 を します ──
 *     ★時計を 止める ／ ★動きを 止める ／ ★点滅を 止める ／ ★倍・大きさ・言葉・時刻帯 を 決める。
 *     ★★1つでも 違えば、★前の 絵と くらべる 意味が ありません。
 *   ★★行き方は `tools/personal_nav.js`（★見本と くらべる 道具と 同じ 道）。
 *
 *   ★★`MASK: […]` …… ★くらべない ところ（★版の 字）。
 *   ★★★最後の 行に `ENV: {…}` を 出します ── ★撮った 環境の 名札 です。
 *     ★★`pixel_gate.py` は 名札が 違う 2枚 を くらべません（★Opus Q5）。
 *
 *   ★使い方  node tools/baseline_shot.js 届いたもの 出す.png
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const NAV = require("./personal_nav");

const ROOT = path.join(__dirname, "..");
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, "dom_personal_map.json"), "utf8"));

// ★★★撮り方（★ここを 変えたら ★今ある 基準画は 全部 無効 です）。
//   ★★`pixel_gate.py` の `環境` と 同じ 値 です。
const 撮り方 = {
  横: 390, 縦: 844, 倍: 3,
  時計: "2026-09-26T10:00:00+09:00",
  言葉: "ja-JP", 時刻帯: "Asia/Tokyo", 色: "light",
  切る: "main"
};

(async () => {
  const [名, 出す] = process.argv.slice(2);
  if (!名 || !出す || !MAP[名] || 名.startsWith("★")) {
    console.log("★使い方  node tools/baseline_shot.js <画面の 名> <出す.png>");
    console.log("★名は `tools/dom_personal_map.json` に ある もの です ──", 名);
    process.exit(2);
  }
  const env = NAV.紙を読む(ROOT);
  const base = NAV.口(env);
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });
  const c = await b.newContext({
    viewport: { width: 撮り方.横, height: 撮り方.縦 },
    deviceScaleFactor: 撮り方.倍,
    colorScheme: 撮り方.色,
    locale: 撮り方.言葉,
    timezoneId: 撮り方.時刻帯,
    reducedMotion: "reduce"
  });
  // ★★時計を 止めます ── ★これが 無いと「きょう」の 字や 日付が 変わるだけで 差が 出ます。
  await c.clock.setFixedTime(new Date(撮り方.時計));
  const p = await c.newPage();
  if (!(await NAV.入る(p, env, base))) {
    // ★★★入れなかった ときは **止まります**。★白い 絵を 基準に しません。
    console.log("★入れませんでした ── ", p.url());
    await b.close();
    process.exit(3);
  }
  await NAV.開く(p, MAP[名]);
  await p.addStyleTag({ content:
    "*,*::before,*::after{animation:none!important;transition:none!important;"
    + "caret-color:transparent!important}" });
  await p.waitForTimeout(700);
  fs.mkdirSync(path.dirname(path.resolve(出す)), { recursive: true });
  const 本体 = await p.$(撮り方.切る);
  if (!本体) { console.log("★`main` が ありません"); await b.close(); process.exit(4); }
  await 本体.screenshot({ path: 出す });
  // ★★★覆い（★くらべない ところ）── ★撮る たびに 変わる 字 だけ です。
  //   ★★「バージョン … 最終更新 …」は ★`next.config.mjs` の `NEXT_PUBLIC_BUILD_AT` ──
  //     ★★立ち上げ 直す たびに 変わります（★時計を 止めても 止まりません）。
  //   ★★★覆った ところは `pixel_gate.py` が **必ず** 並べて 出します（★黙って 落とさない）。
  //   ★★ここに 足すのは「画面の 中身では ない もの」だけ です。
  const 覆い = await p.$eval(撮り方.切る, (root, dsf) => {
    const r0 = root.getBoundingClientRect();
    const 出 = [];
    root.querySelectorAll("p").forEach((el) => {
      const 字 = (el.textContent || "").trim();
      if (!/^バージョン\s/.test(字)) return;
      const st = window.getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden") return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      出.push({
        なぜ: "版と 最終更新（★立ち上げ ごとに 変わる）",
        箱: [Math.floor((r.left - r0.left) * dsf), Math.floor((r.top - r0.top) * dsf),
             Math.ceil((r.right - r0.left) * dsf), Math.ceil((r.bottom - r0.top) * dsf)]
      });
    });
    return 出;
  }, 撮り方.倍);
  const 名札 = {
    台: `${os.platform()} ${os.release()}`,
    見るもの: `chrome ${b.version()}`,
    ...撮り方
  };
  await b.close();
  console.log("SHOT", 出す);
  console.log("MASK: " + JSON.stringify(覆い));
  console.log("ENV: " + JSON.stringify(名札));
})().catch((e) => { console.log("★撮れません ──", String(e).slice(0, 300)); process.exit(5); });
