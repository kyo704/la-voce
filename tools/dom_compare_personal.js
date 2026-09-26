/**
 * ★個人の 画面を、★絵では なく **骨組み（DOM）** で くらべます（★2026-09-26）。
 *
 *   ★★★`tools/dom_compare.js` は 運営の 画面 専用 です（★見本も 運営の html）。
 *     ★★D群・C群の 多くは **個人の 画面** です。★あちらでは 当てられません。
 *   ★★★だから 同じ 判じを、★個人の 見本（iPhone の html）と
 *     ★手元の 実機（`localhost`）に 当てる 道具を 別に 作りました。
 *
 *   ★★骨組みの 取り出しは `tools/dom_compare.js` の `HONE` を **そのまま** 使います。
 *     ★★同じ 式で なければ、★くらべた ことに なりません（★2026-09-17 の 一件）。
 *
 *   ★★行き方は `tools/dom_personal_map.json` が 持ちます ──
 *     ★`bundle` …… もっとの どの 束を 開くか
 *     ★`row` …… その 束の どの 行を 押すか（★見える 字）
 *
 *   ★★出す もの ── ①見本に あって 実機に 無い ②実機に あって 見本に 無い ③並びが ちがう
 *     ★★絵も 残します（★`docs/design/compare/personal/<名>-{見本,実機}.png`）。
 *
 *   ★使い方  node tools/dom_compare_personal.js 届いたもの
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MIHON = path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html");
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, "dom_personal_map.json"), "utf8"));
const OUT = path.join(ROOT, "docs/design/compare/personal");

// ★★★骨組みの 式は あちらから 借ります。★2つ 書きません（★同じ 式で なければ
//   ★くらべた ことに なりません ── ★2026-09-17 の 一件）。
//   ★★行で 切り出します ── ★`const HONE = \`` の 次の 行から、
//     ★`\`;` だけ の 行の 前 まで。
//   ★★終わりは `}\`;` の 行 です（★`\`;` だけ の 行では ありません）。
const 元 = fs.readFileSync(path.join(__dirname, "dom_compare.js"), "utf8").split("\n");
const 始 = 元.findIndex((l) => l.startsWith("const HONE = `"));
const 終 = 元.findIndex((l, n) => n > 始 && l.trim() === "}`;");
if (始 < 0 || 終 < 0) { console.log("★骨組みの 式を 読めません"); process.exit(2); }
const HONE = 元[始].slice("const HONE = `".length) + "\n"
  + 元.slice(始 + 1, 終).join("\n") + "\n}";

const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

function 差(a, b) {
  const き = (x) => `${x.kind}|${x.text}`;
  const A = a.map(き), B = b.map(き);
  const 無 = a.filter((x) => !B.includes(き(x)));
  const 余 = b.filter((x) => !A.includes(き(x)));
  return { 無, 余 };
}

(async () => {
  const 名 = process.argv[2];
  if (!名 || !MAP[名]) {
    console.log("★その 画面の 行き方が ありません ──", 名);
    console.log("★`tools/dom_personal_map.json` に 足して ください。");
    process.exit(2);
  }
  const 道 = MAP[名];
  const base = process.env.E2E_LOCAL_URL || "http://localhost:3002";
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });

  // ── ★見本の 側 ───────────────────────────────────────────
  const p1 = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p1.goto("file://" + MIHON);
  await p1.evaluate((n) => { window.push(n); window.draw(); }, 名);
  await p1.waitForTimeout(300);
  const 見本 = await p1.$eval(".bd", HONE);
  await p1.screenshot({ path: path.join(OUT, `${名}-見本.png`), fullPage: true });

  // ── ★実機の 側 ───────────────────────────────────────────
  const p2 = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p2.goto(base + "/login");
  // ★★入り方は `tools/compare.js` と 同じ 形に します（★あちらは 通って います）。
  await p2.locator('input[type="email"]').first().fill(env.E2E_LOCAL_EMAIL || env.E2E_EMAIL);
  await p2.locator('input[type="password"]').first().fill(env.E2E_LOCAL_PASSWORD || env.E2E_PASSWORD);
  await p2.locator('button[type="submit"], button:has-text("ログイン")').first().click();
  try {
    await p2.waitForURL(/\/dashboard/, { timeout: 45000 });
  } catch (e) {
    // ★★★入れなかった ときは **止まります**。★白い 絵を 残しません。
    const 字 = (await p2.textContent("body").catch(() => "") || "").replace(/\s+/g, " ").slice(0, 200);
    await p2.screenshot({ path: path.join(OUT, `${名}-入れません.png`), fullPage: true });
    console.log("★入れませんでした ── ", p2.url());
    console.log("★画面の 字 …… ", 字);
    await b.close();
    process.exit(3);
  }
  await p2.waitForTimeout(2500);
  // ★もっと の 帯
  await p2.getByText("もっと", { exact: true }).last().click();
  await p2.waitForTimeout(700);
  // ★束 → 行
  if (道.bundle) {
    await p2.getByText(道.bundle, { exact: true }).first().click();
    await p2.waitForTimeout(700);
  }
  await p2.getByText(道.row, { exact: true }).first().click();
  await p2.waitForTimeout(1200);
  const 実機 = await p2.$eval("main", HONE);
  await p2.screenshot({ path: path.join(OUT, `${名}-実機.png`), fullPage: true });
  await b.close();

  const d = 差(見本, 実機);
  console.log(`DOM_PERSONAL  ${名}`);
  console.log(`  見本 …… ${見本.length} 塊 ／ 実機 …… ${実機.length} 塊`);
  console.log(`\n■ ① 見本に あって 実機に 無い（${d.無.length}）`);
  d.無.forEach((x) => console.log(`    ${x.kind}  ${x.text}`));
  console.log(`\n■ ② 実機に あって 見本に 無い（${d.余.length}）`);
  d.余.forEach((x) => console.log(`    ${x.kind}  ${x.text}`));
  console.log(`\n★絵 …… ${path.relative(ROOT, OUT)}/${名}-{見本,実機}.png`);
  console.log(`RESULT: ${d.無.length === 0 ? "OK" : `DIFF（${d.無.length}件）`}`);
})();
