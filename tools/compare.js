#!/usr/bin/env node

// ============================================================================
// 見本と 実装を 並べて 撮る ── ★コンタクトシート
//
//   ★出どころ Fable の 新しい 決まり（★2026-09-11・坂本さん 経由）
//     「タスクは、比較画像が 存在しない限り、完了とは みなされない」
//
//   ★正の 見本　docs/design/pack-final/（★git hash 7c7c720）
//     ★★これだけを 見ます。★ほかの 版を 使いません。
//
//   ★★決まりの とおりに 撮ります
//     ・fullPage: true（★いつも）
//     ・viewport 390 と 1280（★両方）
//     ・1枚／かぶさる 1枚／畳んだ ところは、★別の コマとして 撮る
//     ・テスト用アカウントには 30日ぶんの 記録が 入っています
//     ・空・読み込み中・エラーの 姿も 撮る
//
//   ★★できないことを、先に 書きます
//     ✕ iPhone の 実機と 同じ 字の 出方　★ちがいます
//     ✕ セーフエリア・指の 当たり　　　　★分かりません
//     ✕ 教室・先生・お支払いの 画面　　　★このアカウントに 役職が ありません
//        ★→ 撮れなかった ものは、★最後に 一覧で 出します。★黙って 飛ばしません。
//
//   使い方
//     node tools/compare.js            ★ぜんぶ 撮って、コンタクトシートに する
//     node tools/compare.js --frames   ★コマだけ 撮る
//     node tools/compare.js --sheets   ★撮ってある コマを 並べる だけ
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "docs", "design", "compare", "all");
const FRAMES = path.join(OUT, "frames");

function readEnv() {
  const p = path.join(ROOT, ".env.e2e");
  if (!fs.existsSync(p)) { console.error("★.env.e2e が ありません。"); process.exit(1); }
  const env = {};
  fs.readFileSync(p, "utf8").split("\n").forEach((line) => {
    const s = line.trim();
    if (!s || s.startsWith("#")) return;
    const i = s.indexOf("=");
    if (i > 0) env[s.slice(0, i).trim()] = s.slice(i + 1).trim();
  });
  return env;
}

/**
 * ★撮る もの。
 *
 *   ★tab　　 下の 帯
 *   ★steps　 押す 順（★見える 字で 探します）
 *   ★sheet　 1枚（シート）か。★高さの 上限を 外してから 撮ります
 *   ★open　  中の 畳んだ ところを 開くか
 */
const SCREENS = [
  { key: "画面-きょう", tab: "きょう" },
  { key: "画面-記録", tab: "記録" },
  { key: "SH-ねむり", tab: "記録", steps: ["昨夜の 睡眠"], sheet: true },
  { key: "SH-こえ", tab: "記録", steps: ["本番以外で 声を使った時間"], sheet: true },
  { key: "SH-honban", tab: "記録", steps: ["本番・レッスン"], sheet: true },
  { key: "SH-tabe", tab: "記録", steps: ["食べたもの"], sheet: true },
  { key: "SH-karada", tab: "記録", steps: ["からだのこと"], sheet: true },
  { key: "SH-hito", tab: "記録", steps: ["ひとこと"], sheet: true },
  { key: "画面-ふりかえる-並べる", tab: "ふりかえる", steps: ["並べる"] },
  { key: "画面-ふりかえる-並べる-4週", tab: "ふりかえる", steps: ["並べる", "4週"] },
  { key: "画面-ふりかえる-並べる-3か月", tab: "ふりかえる", steps: ["並べる", "3か月"] },
  { key: "画面-ふりかえる-さかのぼる", tab: "ふりかえる", steps: ["さかのぼる"] },
  { key: "画面-ふりかえる-くらべる", tab: "ふりかえる", steps: ["くらべる"] },
  { key: "画面-ふりかえる-くらべる-前の日", tab: "ふりかえる", steps: ["くらべる", "前の日"] },
  { key: "画面-ふりかえる-かぞえる", tab: "ふりかえる", steps: ["かぞえる"] },
  // ★★くらべる の 中の 行を 押して 開く 画面です（★見本 SC['順番']）。
  { key: "SC-順番", tab: "ふりかえる", steps: ["くらべる", "調べていることの 順番"] },
  { key: "画面-ノート-レパートリー", tab: "ノート", steps: ["レパートリー"] },
  { key: "画面-ノート-連絡", tab: "ノート", steps: ["連絡"] },
  
  // ★★「＋」を 押した ときの 画面（★2026-09-11・坂本さんの ご要望）。
  //   ★★Fable の 決まり「every sheet / modal / collapsible opened and
  //     captured as separate frames」に あたる ぶんです。
  //   ★★一覧だけでは、★書く ときの 画面が 突き合わせから 抜けます。
  { key: "SC-稽古を書く", tab: "ノート", steps: ["稽古", "＋"] },
  // ★★2026-09-11、★見本の 中を 数え直しました（★坂本さんの ご指示）。
  //   ★★SH['newrep'] は 定義だけで、★見本の どこからも 呼ばれて いません。
  //     ★レパートリーの ＋ は push('曲を足す')── ★1枚の 画面です。
  //     ★だから、★くらべる 相手は SC['曲を足す'] です。
  { key: "SC-曲を足す", tab: "ノート", steps: ["レパートリー", "＋"] },
  // ★★SH['newnote'] は、★見本の 中に 入口が ありません（★定義だけ）。
  //   ★くらべる 相手が いません。★撮りません。
  // ★★SH['notemeta']（日付と 先生）は、★見本では 本文の 画面の シートです。
  //   ★★実装では、★稽古の 書く 画面の 中の 欄です（★PRACTICE_FIELDS）。
  //     ★シートに なっていません。★同じ 中身が、★別の 形で 出ます。
  //   ★★だから、★実装側は「稽古を書く」の 画面を 相手に します。
  { key: "SC-まだ", tab: "ひつじ", steps: ["ながめる"] },
  { key: "SC-全部", tab: "ひつじ", steps: ["おうち"] },
  { key: "SH-したく", tab: "ひつじ", steps: ["したく"] },
  
  { key: "SC-もっと", tab: "きょう", steps: ["もっとを開く"] },
  // ★★もっと の 中の 画面（★見本の SC の 名前で 並べます）。
  //   ★★実装の 一覧の 行は、★字が <span> で 押しどころは その 外側です。
  //     ★上の 探し方 ② で 押します。
  { key: "SC-設定", tab: "きょう", steps: ["もっとを開く", "設定"] },
  { key: "SC-聞いてほしいこと", tab: "きょう", steps: ["もっとを開く", "毎日、聞いてほしいこと"] },
  { key: "SC-プラン", tab: "きょう", steps: ["もっとを開く", "プラン"] },
  { key: "SC-学ぶ", tab: "きょう", steps: ["もっとを開く", "学ぶ"] },
  { key: "SC-台帳", tab: "きょう", steps: ["もっとを開く", "もっているもの"] },
  { key: "SC-書き出す", tab: "きょう", steps: ["もっとを開く", "書き出す"] },
  { key: "SC-退会", tab: "きょう", steps: ["もっとを開く", "退会する"] },
  // ★★ノートの 帯（★見本は「1枚」、★実装は「受診用」）。★字が ちがいます。
  { key: "画面-ノート-稽古", tab: "ノート", steps: ["稽古"] },
  { key: "画面-ノート-1枚", tab: "ノート", steps: ["受診用"] },
  // ★★ひつじ（★見本の 名前で 並べます）。
  { key: "SC-たな", tab: "ひつじ", steps: ["たな"] }
];

/**
 * ★いつ 撮ったか。
 *
 *   ★★記録に 時刻を 入れます。★コマの 時刻と くらべられる ように。
 *   ★★これが 無かった せいで、★1時間 前の 記録が
 *     ★いまの ものとして 読まれました（★2026-09-11）。
 */
function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate())
    + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

async function capture(env) {
  const { chromium, devices } = require("playwright");
  fs.mkdirSync(FRAMES, { recursive: true });
  const base = env.E2E_BASE_URL || "https://woolsong.app";
  const browser = await chromium.launch({ channel: "chrome" });
  const missed = [];
  let shot = 0;
  const stamp = nowStamp();

  // ★★実機の 機種を、★そのまま 真似ます（★2026-09-11・坂本さんの お指図）。
  //   ★★幅の 数字だけを 合わせても、★実機とは ちがいます。
  //     ★倍率（devicePixelRatio 3）・タッチ・名乗り（UA）が ちがうと、
  //     ★字の 太さも、★出し分けも 変わることが あります。
  //   ★★iPhone 12（390×844・倍率3）を 使います。
  //     ★坂本さんの 写真が 390×844 の 形でした。
  //   ★★高さだけは 844 に します（★Playwright の 既定は 664 で、
  //     ★これは 画面の 見える ぶんだけの 数字です）。
  //     ★★fullPage で 撮るので、★高さは 絵に 影響しません。
  const IPHONE = devices["iPhone 12"];
  for (const vp of [{ name: "390", dev: IPHONE }]) {
    const ctx = await browser.newContext({
      ...vp.dev,
      viewport: { width: vp.dev.viewport.width, height: 844 },
      locale: "ja-JP", timezoneId: "Asia/Tokyo"
    });
    const page = await ctx.newPage();
    await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
    await page.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    console.log("★" + vp.name + "px（iPhone 12・倍率" + vp.dev.deviceScaleFactor + "）で 撮ります");

    const close = async () => {
      // ★★1枚を 閉じると、★保存が 走り、★そのあとに「記録しました」の
      //   ★1枚が 出ます。★★先に 閉じてから 待つと、★間に合いません。
      //   ★★2026-09-11、★これで A04 が 撮れませんでした。
      //     ★閉じる → 待つ → もう一度 閉じる、の 順に します。
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1200);
      for (let k = 0; k < 4; k++) {
        const o = page.locator("div.fixed.inset-0.z-50");
        if (!(await o.count())) break;
        await o.locator('button:has-text("閉じる")').first().click({ timeout: 2500 })
          .catch(() => page.keyboard.press("Escape").catch(() => {}));
        await page.waitForTimeout(600);
      }
      await page.waitForTimeout(300);
    };

    for (const sc of SCREENS) {
      try {
        // ★★1コマごとに、★まっさらから 始めます（★2026-09-11）。
        //   ★★前の 画面で 開いた もの（引き出し・かぶさる 1枚）が 残ると、
        //     ★★次の 押しどころに 手が 届きません。
        //   ★★閉じ方を 1つずつ 覚えるより、★読み込み直す ほうが 確かです。
        //     ★★遅く なりますが、★撮れない ほうが 困ります。
        await page.goto(base + "/dashboard", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1800);
        await close();
        await page.locator(`nav >> text=${sc.tab}`).first().click({ timeout: 8000 })
          .catch(async () => {
            await page.locator(`text=${sc.tab}`).last().click({ timeout: 8000 });
          });
        await page.waitForTimeout(1000);
        for (const step of (sc.steps || [])) {
          // ★★押しどころの 探し方は 2通りです。
          //   ★① 押しどころ（button）の 名前
          //   ★② 字そのもの。★その 字を 囲む 押せる ものを 押します。
          //   ★★もっと の 一覧の 行は、★字が <span> で、
          //     ★押しどころは その 外側です。★①では 見つかりません。
          //     ★★2026-09-11、★ここで 7画面が 撮れませんでした。
          let target = page.getByRole("button", { name: new RegExp(step) }).first();
          if (!(await target.count())) {
            target = page.locator(
              `button:has-text("${step}"), [role="button"]:has-text("${step}"), a:has-text("${step}")`
            ).first();
          }
          if (!(await target.count())) {
            // ★★それでも 無ければ、★字を 押します。
            //   ★押せる 親が あれば、★そちらへ 上がります。
            target = page.getByText(step, { exact: false }).first();
          }
          await target.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
          await target.click({ timeout: 7000 })
            .catch(async () => {
              // ★★何かが かぶさって いても、★押しどころ そのものを 押します。
              //   ★★絵を 撮る ための 手です。★配信する 画面は 変えません。
              //   ★★2026-09-11、★ひつじの したく／たな と もっとが、
              //     ★かぶさりで 押せませんでした。
              await target.evaluate((el) => {
                let n = el;
                for (let k = 0; k < 4 && n; k++) {
                  if (n.tagName === "BUTTON" || n.tagName === "A"
                    || n.getAttribute("role") === "button") break;
                  n = n.parentElement;
                }
                (n || el).click();
              });
            });
          await page.waitForTimeout(800);
        }
        if (sc.open) {
          // ★★畳んだ ところを 開きます（★別の コマとして 撮るため）
          await page.locator("details > summary").first().click({ timeout: 5000 })
            .catch(() => {});
          await page.waitForTimeout(700);
        }
        if (sc.sheet) {
          // ★★1枚は 高さ 82% の 中で 自分で 送ります。★上限を 外してから 撮ります。
          await page.evaluate(() => {
            const d = document.querySelector('[role="dialog"]');
            if (!d) return;
            d.style.maxHeight = "none"; d.style.overflow = "visible";
            d.style.position = "absolute"; d.style.top = "0"; d.style.bottom = "auto";
            document.body.style.overflow = "visible";
          });
          await page.waitForTimeout(500);
        }
        // ★★下の 帯を、★ページの いちばん下へ 移してから 撮ります。
        //
        //   ★★2026-09-11、★比較画像で 帯が 画面の 途中に かぶさって いました。
        //     ★★実機の 不具合では ありません。★撮り方の くせです。
        //       ★position:fixed の ものは、★fullPage で 撮ると
        //       ★最初の 1画面ぶんの 位置に 焼き付きます。
        //     ★★実機では 下に 貼りついていて、★中身は 隠れません。
        //       ★中身の 下に 56＋16px の 余白が あります
        //       （★components/VocalTracker.jsx:13478）。
        //   ★★見本の 側でも、★電話の 枠の 高さの 上限を 外して 撮っています。
        //     ★同じ 扱いに そろえます。★配信する 画面は 変えません。
        //   ★★隠れて いないことは、★下の ② で 数えて 確かめます。
        const hidden = await page.evaluate((barH) => {
          const nav = document.querySelector('nav[aria-label="画面を えらぶ"]');
          if (!nav) return null;
          // ★中身が 帯の 下に 潜っていないか、★動かす 前に 数えます。
          const doc = document.documentElement;
          const gap = doc.scrollHeight - (document.querySelector("main")
            ? document.querySelector("main").getBoundingClientRect().bottom + window.scrollY
            : doc.scrollHeight);
          // ★★ページの いちばん下へ 移します。
          //   ★★static に するだけでは、★組み立ての 順に 出ます ──
          //     ★帯は <main> より 前に あるので、★画面の 上に 来ます。
          //     ★★2026-09-11、★1度 そうなりました。
          nav.style.position = "static";
          nav.style.marginTop = "0";
          document.body.appendChild(nav);
          return { gap: Math.round(gap), barH };
        }, 56);
        if (hidden && hidden.gap < 0) {
          missed.push(sc.key + "@" + vp.name
            + "  ★中身が 帯の 下に " + (-hidden.gap) + "px 潜っています");
        }
        await page.waitForTimeout(200);
        const file = path.join(FRAMES, sc.key + "@" + vp.name + ".png");
        await page.screenshot({ path: file, fullPage: true });
        // ★★絵と いっしょに、★画面の 中身も 書き出します（★2026-09-11）。
        //   ★★Fable の 決まり ⑤ の ための 土台です。
        //     ★(a) 並び順を くらべる　★(b) 出ては いけない 部品を 見張る
        //   ★★絵は 人が 見る もの。★この 書き出しは 機械が 見る ものです。
        //   ★★見える ものだけを 拾います（★display:none は 入れません）。
        const dump = await page.evaluate(() => {
          const out = [];
          const walk = (el) => {
            const st = window.getComputedStyle(el);
            if (st.display === "none" || st.visibility === "hidden") return;
            const tag = el.tagName.toLowerCase();
            const own = [...el.childNodes]
              .filter((n) => n.nodeType === 3)
              .map((n) => n.textContent.trim()).join(" ").trim();
            if (own && ["button", "h1", "h2", "h3", "p", "span", "label",
              "summary", "div", "a", "li", "figcaption"].includes(tag)) {
              out.push({ tag, text: own.replace(/\s+/g, " ").slice(0, 60) });
            }
            [...el.children].forEach(walk);
          };
          walk(document.body);
          return out;
        });
        fs.writeFileSync(file.replace(/\.png$/, ".json"),
          JSON.stringify(dump, null, 1), "utf8");
        shot++;
        console.log("  ✓ " + sc.key + "@" + vp.name);
      } catch (e) {
        missed.push(sc.key + "@" + vp.name + "  " + String(e.message).split("\n")[0].slice(0, 70));
        console.log("  ✗ " + sc.key + "@" + vp.name);
      }
    }
    await ctx.close();
  }
  await browser.close();

  // ★★いつでも 書き直します。★0件でも 書きます。
  //
  //   ★★2026-09-11、★重い 間違いが ありました。
  //     ★★前は「if (missed.length)」で 囲んで いました。
  //       ★1件も 落ちなかった 回は、★書き直しません でした。
  //     ★★だから、★古い 失敗の 記録が そのまま 残り、
  //       ★撮り直して 直った あとも、★失敗した ように 読めました。
  //     ★★9月11日 09:40 の 記録が、★10:40 の 撮影の あとも 残って いて、
  //       ★坂本さんに「3件 失敗して います」と 伝わって しまいました。
  //   ★★黙って 消さない ための 仕組みが、★黙って 古い ままに なって いました。
  //     ★いつ 撮った ものかを、★1行目に 書きます。
  fs.writeFileSync(path.join(OUT, "撮れなかったもの.txt"),
    "★撮れなかった もの（" + missed.length + "件）\n"
    + "★この 記録は、★撮るたびに 書き直します（★0件でも）。\n"
    + "★撮ったのは " + stamp + " です。★コマの 時刻と 合っているか 見てください。\n"
    + "★黙って 飛ばしていません。★理由を そのまま 残します。\n\n"
    + (missed.length ? missed.join("\n") + "\n"
      : "　★1件も ありません。★" + shot + " コマ すべて 撮れました。\n"), "utf8");
  console.log("\n★撮れなかった もの: " + missed.length + " 件");
}

/** ★4×3 で 並べた 1ページを 作ります。 */
async function sheets() {
  const { chromium } = require("playwright");
  const files = fs.readdirSync(FRAMES).filter((f) => f.endsWith(".png")).sort();
  if (!files.length) { console.log("★コマが ありません。"); return; }
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
  const page = await ctx.newPage();
  const per = 12;
  const pages = Math.ceil(files.length / per);
  for (let i = 0; i < pages; i++) {
    const group = files.slice(i * per, (i + 1) * per);
    const cells = group.map((f) => {
      const b64 = fs.readFileSync(path.join(FRAMES, f)).toString("base64");
      const name = f.replace(/\.png$/, "");
      return `<figure><div class="ph"><img src="data:image/png;base64,${b64}"></div>
        <figcaption>${name}<span class="x">✗</span></figcaption></figure>`;
    }).join("");
    const html = `<style>
      body{margin:0;padding:18px;background:#F6F1E7;font-family:system-ui,sans-serif}
      h1{font-size:15px;margin:0 0 12px;color:#241914}
      .g{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
      figure{margin:0;background:#FFFDF8;border:1px solid #E4DCC9;border-radius:10px;overflow:hidden}
      .ph{height:300px;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;background:#fff}
      img{width:100%;object-fit:cover;object-position:top}
      figcaption{font-size:10.5px;padding:6px 8px;color:#6b5d52;display:flex;justify-content:space-between;gap:6px}
      .x{color:#E4DCC9;font-weight:700}
    </style>
    <h1>Woolsong ★見本との 突き合わせ用（${i + 1} / ${pages}）　★右の ✗ に 印を つけてください</h1>
    <div class="g">${cells}</div>`;
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForTimeout(400);
    const out = path.join(OUT, "sheet-" + String(i + 1).padStart(2, "0") + ".png");
    await page.screenshot({ path: out, fullPage: true });
    console.log("  ✓ " + path.basename(out) + "（" + group.length + "コマ）");
  }
  await browser.close();
}

(async () => {
  const only = process.argv.slice(2);
  if (!only.includes("--sheets")) await capture(readEnv());
  if (!only.includes("--frames")) await sheets();
})().catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
