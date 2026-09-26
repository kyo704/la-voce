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
const 生 = 元[始].slice("const HONE = `".length) + "\n"
  + 元.slice(始 + 1, 終).join("\n") + "\n}";
// ★★★逃がし字を 戻します（★2026-09-26 に 見つけた 大きな 抜け）。
//   ★★あちらでは `HONE` は **字の 型（テンプレート）** です。
//     ★★JS が 読む とき `\\b` は `\b` に なります。
//   ★★★こちらは 紙を **そのまま** 読んで いました。★`\\b` の まま 渡して いました。
//     ★★だから `/\\bnote\\b/` は ★「¥b note ¥b」という 字 を 探し、★1つも 当たりません。
//     ★★★注（約束の 文）・題の class・札の class・文 ── ★**4つ とも 死んで いました**。
//       ★★見本の `div.note` `div.usu` が 1つも 注に なって いません でした。
//       ★★実機の `<button>` だけが 札に なり、★見本の `div.back` は 何にも なりません でした。
//   ★★だから 字の 型 として **一度 読ませて** から 渡します。★あちらと 同じ 字に なります。
const HONE = new Function("return `" + 生 + "`")();
// ★★★字の まま 渡すと Playwright は `undefined` を 返します
//   （★`tools/dom_compare.js` の 註・2026-09-20）。★本当の 関数に して から 渡します。
//   ★★2026-09-26 に ここで つまずきました ── ★あちらの 註を 読んで いれば 1度で 済みました。
const HONE_FN = new Function("return " + HONE)();

const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

// ★★★`HONE` が 返すのは **字の 並び** です（★「題｜…」「約｜…」の 形）。
//   ★★はじめ `{kind, text}` の 物だと 思い込み、★`undefined` を 並べて いました
//     （★2026-09-26）。★あちらの 中身を 読んで から 直しました。
// ★★★どの 画面にも 付いて 回る もの（★見本には 無い・2026-09-26）。
//   ★★★黙って 落としません ── ★落とした ものは 下に **必ず** 並べます
//     （★台帳「黙って 落とさない」・裁定 その124）。
//   ★★ここに 足すのは「画面の 中身では ない もの」だけ です。
//     ★★画面の 中身の 差を ここに 入れたら、★見張りの 意味が 無くなります。
const 共通に付くもの = [
  {
    型: /^注｜バージョン/,
    なぜ: "★版と 最終更新の 字。★どの 画面の 下にも 出ます。"
      + "★見本の html は 版を 持ちません（★1つの 紙 だから）。"
  }
];

// ★★★3つめ・4つめの 組（★坂本さんの お決め・2026-09-16）──
//   ★③見本に 在るが、★意図して 実装して いない もの …… `tools/excluded_by_design.json`
//   ★④実装に 在って、★見本に 無い もの（★わけ つき）…… その 紙の `__added__`
//   ★★2つの 組（①②）だけ で 出すと、★同じ 差が 毎回 蒸し返されます
//     （★あの 紙の `_readme` に そう 書いて あります）。
//   ★★★引き金（`trigger`）の 無い ものを ここで 落としません。
//     ★★引き金の 無い もの ＝ 二度と 見直されない もの、です。
const ワザト = JSON.parse(
  fs.readFileSync(path.join(__dirname, "excluded_by_design.json"), "utf8")
);

function わざとの字(名, 足したか) {
  const 棚 = 足したか ? (ワザト.__added__ || {})[名] : ワザト[名];
  if (!Array.isArray(棚)) return [];
  return 棚.filter((x) => x && x.text && (足したか || x.trigger))
    .map((x) => ({ 字: String(x.text), なぜ: String(x.why || "").slice(0, 120),
                   引き金: x.trigger ? String(x.trigger) : null }));
}

function わざと除く(列, 名, 足したか) {
  const 表 = わざとの字(名, 足したか);
  const 残 = [], 落 = [];
  列.forEach((x) => {
    const 当 = 表.find((k) => x.includes(k.字));
    if (当) 落.push({ x, なぜ: 当.なぜ, 引き金: 当.引き金 }); else 残.push(x);
  });
  return { 残, 落 };
}

function 除く(列) {
  const 残 = [], 落 = [];
  列.forEach((x) => {
    const 当 = 共通に付くもの.find((k) => k.型.test(x));
    if (当) 落.push({ x, なぜ: 当.なぜ }); else 残.push(x);
  });
  return { 残, 落 };
}

function 差(a, b) {
  const 無 = a.filter((x) => !b.includes(x));
  const 余 = b.filter((x) => !a.includes(x));
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
  // ★★口は `.env.e2e` の `E2E_LOCAL_URL` が 正 です（★`next dev` は 空いて いる 口を 選びます）。
  const base = process.env.E2E_LOCAL_URL || env.E2E_LOCAL_URL || "http://localhost:3000";
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });

  // ── ★見本の 側 ───────────────────────────────────────────
  const p1 = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p1.goto("file://" + MIHON, { waitUntil: "domcontentloaded" });
  // ★★★開き方は `tools/mihon_shot.js` と 同じ 形に します（★あちらは 通って います）。
  //   ★`SC[名]`（1枚の 画面）と `SH[名]`（下から 上がる 板）の 2つ が あります。
  const 種 = await p1.evaluate((n) => {
    if (typeof SC[n] === "function") return "SC";
    if (typeof SH[n] === "function") return "SH";
    return null;
  }, 名);
  if (!種) { console.log("★見本に ありません（SC[] にも SH[] にも）──", 名); await b.close(); process.exit(4); }
  await p1.evaluate(({ n, k }) => {
    S.stack = []; S.sheet = null;
    if (k === "SH") openSheet(n); else push(n);
  }, { n: 名, k: 種 });
  await p1.waitForTimeout(400);
  // ★★★`fullPage` に しません ── ★見本の HTML は 枠の **下にも** 長い 説明を 持って います
  //   （★`tools/mihon_shot.js` の 註・2026-09-15）。★`#bd`／`#sh` だけ を 切り取ります。
  const 枠 = 種 === "SH" ? "#sh" : "#bd";
  const 見本 = await p1.$eval(枠, HONE_FN).catch(() => null);
  if (!見本) { console.log("★見本の 骨組みを 取れません ──", 枠); await b.close(); process.exit(4); }
  const 箱 = await p1.$(枠);
  await 箱.screenshot({ path: path.join(OUT, `${名}-見本.png`) });

  // ── ★実機の 側 ───────────────────────────────────────────
  const p2 = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p2.goto(base + "/login");
  // ★★入り方は `tools/compare.js` と 同じ 形に します（★あちらは 通って います）。
  await p2.locator('input[type="email"]').first().fill(env.E2E_LOCAL_EMAIL || env.E2E_EMAIL);
  await p2.locator('input[type="password"]').first().fill(env.E2E_LOCAL_PASSWORD || env.E2E_PASSWORD);
  await p2.locator('button[type="submit"], button:has-text("ログイン")').first().click();
  // ★★★`waitForURL` は「読み終わる」まで 待ちます。★門の 中の 画面は 台帳を
  //   ★何度も 引く ので、★`load` が 立たない ことが あります（★2026-09-26 に 見ました）。
  //   ★★だから **場所だけ** を 見ます。★着いて いれば 進みます。
  let 着いた = false;
  for (let n = 0; n < 60; n += 1) {
    if (/\/dashboard/.test(p2.url())) { 着いた = true; break; }
    await p2.waitForTimeout(1000);
  }
  if (!着いた) {
    // ★★★入れなかった ときは **止まります**。★白い 絵を 残しません。
    const 字 = (await p2.textContent("body").catch(() => "") || "").replace(/\s+/g, " ").slice(0, 200);
    await p2.screenshot({ path: path.join(OUT, `${名}-入れません.png`), fullPage: true });
    console.log("★入れませんでした ── ", p2.url());
    console.log("★画面の 字 …… ", 字);
    await b.close();
    process.exit(3);
  }
  await p2.waitForTimeout(2500);
  // ★★★もっと は **帯に ありません**（★帯は 5つ です）。
  //   ★★入口は「きょう」の 右上の 歯車 です（★`HeadRound` の `aria-label`）。
  //   ★★2026-09-26 に ここで 30秒 待って 落ちました ── ★字で 探して いた から です。
  await p2.getByLabel("もっとを開く").first().click({ timeout: 20000 });
  await p2.waitForTimeout(900);
  // ★★★行は「名 ＋ 添える 字」が **1つの 札の 中** に あります。
  //   ★★だから `exact: true` では 当たりません（★2026-09-26 に 30秒 待って 落ちました）。
  //   ★★札（`button`）の 中の 字で 探します。★人が 押す のと 同じ 道 です。
  const 押す = async (字) => {
    const 札 = p2.locator("main button", { hasText: 字 }).first();
    await 札.click({ timeout: 20000 });
  };
  if (道.bundle) { await 押す(道.bundle); await p2.waitForTimeout(900); }
  await 押す(道.row);
  await p2.waitForTimeout(1500);
  // ★★★先に 絵を 撮ります ── ★絵は **見た まま** で なければ 意味が ありません。
  //   ★★★撮る ところを 狭めました（★2026-09-26・坂本さんの ご指示）。
  //     ★★前は `fullPage` で 紙 ぜんたい を 撮って いました。
  //       ★★見本は `#bd`（枠の 中）だけ です ── ★大きさが 揃わず、
  //         ★★`tools/pixel_lint.py` が 1枚目で 止まって いました。
  //     ★★だから 実機も **同じ ところ**（`main`）だけ を 撮ります。
  //   ★★★`fullPage` の 絵も 残します（`-実機-全体.png`）── ★見落としを 防ぐ ため。
  const 本体 = await p2.$("main");
  if (本体) await 本体.screenshot({ path: path.join(OUT, `${名}-実機.png`) });
  else await p2.screenshot({ path: path.join(OUT, `${名}-実機.png`) });
  await p2.screenshot({ path: path.join(OUT, `${名}-実機-全体.png`), fullPage: true });
  // ★★★`main` の 中には もっとの 行が **残って います**（★`display:none` で 隠すだけ）。
  //   ★★`inMore(節)` が そう して います ── ★書きかけを 残す ため の 作り です
  //     （★`components/VocalTracker.jsx`「消しません。隠すだけです」）。
  //   ★★★字を 取ると、★隠れた 行まで 数えます（★2026-09-26 に 24件 出ました）。
  //     ★★だから 取る 前に、★見えて いない ところを **落とします**。
  //     ★★`KEEP_HIDDEN=1` を 付けると 落としません（★診立ての ため の 口）。
  //   ★★★`new Function` を 画面の 中で 組み立てるのは やめました ──
  //     ★2026-09-26 に そこで 2度 つまずきました。★関数は そのまま 渡します。
  if (!process.env.KEEP_HIDDEN) {
    await p2.$eval("main", (root) => {
      const 見えぬ = [];
      root.querySelectorAll("*").forEach((el) => {
        const st = window.getComputedStyle(el);
        if (st.display === "none" || st.visibility === "hidden") 見えぬ.push(el);
      });
      見えぬ.forEach((el) => el.remove());
    });
  }
  const 実機 = await p2.$eval("main", HONE_FN)
    .catch((e) => { console.log("★取れません ──", String(e).slice(0, 140)); return null; });

  await b.close();

  if (process.env.DUMP) {
    console.log("--- 見本 ---"); 見本.forEach((x) => console.log("   ", x));
    console.log("--- 実機 ---"); 実機.forEach((x) => console.log("   ", x));
  }
  const d0 = 差(見本, 実機);
  const 無 = 除く(d0.無), 余 = 除く(d0.余);
  const 三 = わざと除く(無.残, 名, false);
  const 四 = わざと除く(余.残, 名, true);
  const d = { 無: 三.残, 余: 四.残 };
  const 落ちた = 無.落.concat(余.落);
  console.log(`DOM_PERSONAL  ${名}`);
  console.log(`  見本 …… ${見本.length} 塊 ／ 実機 …… ${実機.length} 塊`);
  console.log(`\n■ ① 見本に あって 実機に 無い（${d.無.length}）`);
  d.無.forEach((x) => console.log(`    ${x}`));
  console.log(`\n■ ② 実機に あって 見本に 無い（${d.余.length}）`);
  d.余.forEach((x) => console.log(`    ${x}`));
  console.log(`\n■ ③ 見本に 在るが、★わざと 出して いない（${三.落.length}）`);
  三.落.forEach((k) => console.log(`    ${k.x}\n      ${k.なぜ}\n      ★戻す 引き金 …… ${k.引き金}`));
  console.log(`\n■ ④ 実装に 在って 見本に 無い ── ★わけ あり（${四.落.length}）`);
  四.落.forEach((k) => console.log(`    ${k.x}\n      ${k.なぜ}`));
  console.log(`\n■ ★共通に 付く もの として 落としました（${落ちた.length}）`);
  落ちた.forEach((k) => console.log(`    ${k.x}\n      ${k.なぜ}`));
  console.log(`\n★絵 …… ${path.relative(ROOT, OUT)}/${名}-{見本,実機}.png`);
  // ★★★①と② の **両方** を 見ます（★2026-09-26）。
  //   ★★前は ① だけ を 見て いました。★②に 1件 あっても「OK」と 出て いました。
  //     ★★較正で それを 見ました ── ★故意の 差が ②に 出たのに RESULT は OK でした。
  const 計 = d.無.length + d.余.length;
  console.log(`RESULT: ${計 === 0 ? "OK" : `DIFF（①${d.無.length}・②${d.余.length}）`}`);
})();
