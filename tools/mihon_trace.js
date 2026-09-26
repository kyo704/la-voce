/**
 * ★見本を **実際に 動かして**、★その 画面に 着く 道を さがします（★2026-09-26）。
 *
 *   ★★★字で さがすのは 当てに なりません ── ★`push(変数)` で 開く 画面が あります
 *     （★`tools/mockup_orphans.py` が iPhone の 見本だけで 98件 出しました）。
 *   ★★だから 見本の 中で **札を 1つずつ 押して**、★どこへ 着くかを 数えます。
 *
 *   ★★★見つけられる もの ── ★1手・2手で 着く 道（★もっと → 束 → 行 まで）。
 *   ★★★見つけられない もの ── ★3手 より 深い 道。★入力が 要る 道。
 *     ★★条件（鍵・データ）で 出ない 行。★その ときは「見つからない」と 出ます。
 *
 *   ★使い方  node tools/mihon_trace.js 録画を足す 自分の門下 …
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const MIHON = path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html");

(async () => {
  const 的 = process.argv.slice(2);
  if (的.length === 0) { console.log("★画面の 名を ください"); process.exit(2); }
  const { chromium } = require("playwright");
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p.goto("file://" + MIHON, { waitUntil: "domcontentloaded" });

  // ★★どの 画面が あるか を 先に 数えます。
  const 画面 = await p.evaluate(() => Object.keys(SC).concat(Object.keys(SH || {})));
  console.log("MIHON_TRACE  ★見本の 画面 …… " + 画面.length);

  for (const 名 of 的) {
    if (!画面.includes(名)) { console.log(`\n★${名} …… ★見本に ありません`); continue; }
    // ★★その 画面を 開いた とき の 戻る 札 の 字（★`bk('…')`）を 読みます。
    const 戻り = await p.evaluate((n) => {
      S.stack = []; S.sheet = null;
      try { if (typeof SC[n] === "function") push(n); else openSheet(n); } catch (e) { return null; }
      const el = document.querySelector("#bd .back, #sh .back");
      return el ? (el.textContent || "").replace(/^‹\s*/, "").trim() : null;
    }, 名);
    // ★★★その 戻り先の 画面を 開き、★中の 札を 数えて、★この 画面へ 行く 行を さがします。
    const 親の中 = 戻り ? await p.evaluate((b2) => {
      S.stack = []; S.sheet = null;
      try { if (typeof SC[b2] === "function") push(b2); else openSheet(b2); } catch (e) { return null; }
      return [...document.querySelectorAll("#bd [onclick], #sh [onclick]")]
        .map((el) => ({ 字: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40),
                        手: el.getAttribute("onclick") }));
    }, 戻り) : null;
    const 当 = (親の中 || []).filter((x) => x.手 && x.手.includes("'" + 名 + "'"));
    console.log(`\n★${名}`);
    console.log(`  ★戻る 札の 字 …… ${戻り === null ? "★ありません" : 戻り}`);
    if (戻り && 親の中 === null) console.log("  ★戻り先を 開けません");
    if (戻り && 親の中) {
      console.log(`  ★戻り先「${戻り}」の 中の 押せる もの …… ${親の中.length}`);
      if (当.length) 当.forEach((x) => console.log(`    ★★この 画面へ 行く 行が あります …… 「${x.字}」`));
      else {
        console.log("    ★★戻り先の 中に、★この 画面へ 行く 行は ありません");
        console.log("    ★★戻り先に ある 押せる もの（★ぜんぶ）──");
        親の中.forEach((x) => console.log(`      「${x.字}」  →  ${String(x.手).slice(0, 60)}`));
      }
    }
  }
  await b.close();
})();
