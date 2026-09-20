/**
 * ★段3a ── ★見本と 実機を、★絵では なく **骨組み（DOM）** で くらべます。
 *
 *   ★★★なぜ 絵で くらべないか（★Opus の 見立て・2026-09-20）。
 *     ★★見本の 中身は 作りもの、★実機は 本物の 記録 です。
 *     ★★★同じ 画面でも、★絵は 必ず ちがいます。★くらべても 何も 言えません。
 *   ★★★骨組みなら くらべられます ── ★見出し・札・行・表の **並び** です。
 *     ★★中身の 字（お名前・数）は 落とします。★そこは ちがって 当たり前 です。
 *
 *   ★★出す もの（★3つに 分けます）
 *     ①見本に あって 実機に 無い
 *     ②実機に あって 見本に 無い
 *     ③並びが ちがう
 *
 *   ★★★較正 ── ★自分で 自分を 試します。
 *     ★同じ 骨組み どうしを くらべて 0件、
 *     ★わざと 1つ 抜いた ものと くらべて 1件。★出なければ 止まります。
 *
 *   ★使い方  node tools/dom_compare.js [画面の 名 …]
 *   ★合言葉は `.env.e2e` から 道具が 読みます（★人の 目に 触れません）。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, "dom_ops_map.json"), "utf8"));
const MIHON = path.join(ROOT, "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html");

const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

/**
 * ★骨組みを 取り出す 式（★見本にも 実機にも、★同じ ものを 当てます）。
 *
 *   ★★★同じ 式で なければ、★くらべた ことに なりません。
 *     ★★2026-09-17 の 一件 ──「同じ 名前でも、★引数が ちがえば 別の 式」。
 */
const HONE = `(root) => {
  const out = [];
  const 字 = (el, n) => (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, n || 40);
  // ★★中身の 字は 落とします（★数・日づけ・お名前）。
  const 素 = (s) => s
    .replace(/[0-9０-９]+/g, "#")
    .replace(/[A-Za-z]{2,}/g, "@")
    .trim();
  const 見る = (el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "script" || tag === "style") return;
    const cls = (el.getAttribute("class") || "");
    // ★★★種を 細かく 分けません（★2026-09-20 に 直しました）。
    //   ★★見本は 行を div.li、★実機は button で 出して います。
    //     ★★同じ ものが、★別の 種に なって いました。★1つも 合いません。
    //   ★★くらべるのは「題か、そうでないか」だけ に します。
    // ★★★種を 細かく 分けません（★2026-09-20 に 直しました）。
    //   ★★見本は 行を \`div.li\`、★実機は \`button\` で 出して います。
    //     ★★同じ ものが、★別の 種に なって いました。★1つも 合いません。
    //   ★★くらべるのは「題か、そうでないか」だけ に します。
    let kind = null;
    // ★★★注記は 別に 取ります（★段階2・2026-09-20）。
    //   ★★注記は 約束 そのもの です。★いちばん 重い ところ です。
    //   ★★見本も 実機も、★同じ 名（note ／ warn ／ usu）を 使って います。
    if (/\\bnote\\b|\\bwarn\\b|\\busu\\b/.test(cls)) kind = "注";
    else if (tag === "h1" || tag === "h2" || tag === "h3"
        || /\\bh3\\b|\\bsh3\\b|\\bfl\\b/.test(cls)) kind = "題";
    else if (tag === "button" || tag === "th" || tag === "li"
             || /\\bbtn\\b|\\bpill\\b|\\bli\\b/.test(cls)) kind = "文";
    if (kind === "注") {
      // ★★★注記は **文**に 割ってから くらべます（★2026-09-20・坂本さんの お決め）。
      //   ★★見本は 1つの かたまりに 何行も 入れて います。
      //   ★★実機は 行ごとに 分けて 出して います。
      //   ★★★かたまり どうしを くらべると、★同じ 約束でも 別物に なります。
      //     ★★初回、★一致が **0件** でした。★それは 差では なく 割り方 でした。
      //   ★★短すぎる かけらは 落とします（★「です。」などが 並ばない ように）。
      const 全 = 字(el, 4000);
      全.split("。").map((s) => 素(s.trim()))
        .filter((s) => s.length >= 6)
        .forEach((s) => out.push("注｜" + s + "。"));
      return;
    }
    if (kind) {
      const t = 素(字(el));
      if (t) out.push(kind + "｜" + t);
      if (kind === "文") return;
    }
    for (const c of el.children) 見る(c);
  };
  for (const c of root.children) 見る(c);
  return out;
}`;

// ★★★字の まま 渡すと、★Playwright は `undefined` を 返しました（★2026-09-20）。
//   ★★本当の 関数に してから 渡します。★中身は 1つ の まま です。
const HONE_FN = new Function("return " + HONE)();

/** ★並びを くらべます（★いちばん 長い 共通の 並びを 取ります）。 */
function kuraberu(a, b) {
  const n = a.length, m = b.length;
  const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      d[i][j] = a[i] === b[j] ? d[i + 1][j + 1] + 1 : Math.max(d[i + 1][j], d[i][j + 1]);
    }
  }
  const 同 = [];
  let i = 0, j = 0;
  const 見本のみ = [], 実機のみ = [];
  while (i < n && j < m) {
    if (a[i] === b[j]) { 同.push(a[i]); i++; j++; }
    else if (d[i + 1][j] >= d[i][j + 1]) { 見本のみ.push(a[i]); i++; }
    else { 実機のみ.push(b[j]); j++; }
  }
  while (i < n) 見本のみ.push(a[i++]);
  while (j < m) 実機のみ.push(b[j++]);
  // ★★★「並びが ちがう」── ★どちらにも 在るのに、★片側にしか 残らなかった もの。
  const 順ちがい = 見本のみ.filter((x) => 実機のみ.includes(x));
  return {
    same: 同.length,
    onlyMihon: 見本のみ.filter((x) => !順ちがい.includes(x)),
    onlyImpl: 実機のみ.filter((x) => !順ちがい.includes(x)),
    order: [...new Set(順ちがい)]
  };
}

function calibrate() {
  // ★★★題だけ の くらべも 試します（★2026-09-20）。
  //   ★★行を 落として、★題の 差 だけ が 残る こと。
  const 題 = (x) => x.filter((s) => s.startsWith("題｜"));
  const m1 = ["題｜あ", "文｜作りもの#", "題｜い"];
  const i1 = ["題｜あ", "文｜本物@", "題｜い"];
  const t1 = kuraberu(題(m1), 題(i1));
  if (t1.onlyMihon.length !== 0 || t1.onlyImpl.length !== 0 || t1.same !== 2) return false;
  const t2 = kuraberu(題(m1), 題(["題｜あ"]));
  if (t2.onlyMihon.length !== 1) return false;

  const a = ["題｜あ", "札｜い", "行｜う"];
  const 同 = kuraberu(a, a.slice());
  const 欠 = kuraberu(a, ["題｜あ", "行｜う"]);
  const 順 = kuraberu(a, ["札｜い", "題｜あ", "行｜う"]);
  return 同.same === 3 && 同.onlyMihon.length === 0
    && 欠.onlyMihon.length === 1 && 欠.onlyMihon[0] === "札｜い"
    && 順.order.length >= 1;
}

(async () => {
  if (!calibrate()) {
    console.error("★止まりました ── ★道具の 較正に 落ちました");
    process.exit(1);
  }
  const 選 = process.argv.slice(2).filter((x) => !x.startsWith("--"));
  const 的 = MAP.screens.filter((s) => 選.length === 0 || 選.includes(s.key));
  const { chromium } = require(path.join(ROOT, "node_modules/playwright"));
  const b = await chromium.launch({ channel: "chrome" });
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 1000 }, locale: "ja-JP", timezoneId: "Asia/Tokyo"
  });

  // ── ★見本 ──
  const mp = await ctx.newPage();
  await mp.goto("file://" + MIHON, { waitUntil: "domcontentloaded" });
  await mp.waitForTimeout(600);

  // ── ★実機 ──
  const ap = await ctx.newPage();
  // ★★★手元の 開発サーバも 見られます（★2026-09-20・坂本さんの お決め D112）。
  //   ★★`node tools/dom_compare.js --local` ── ★http://localhost:3000
  //   ★★★配備を 待たずに 測れます。★きょう、★印を 足しても 測れません でした。
  //     ★★本番は「出た もの」、★手元は「いま 書いた もの」。★別の ものを 見ます。
  //   ★★どちらを 見たかを、★報告の 頭に 必ず 書きます。★取り違えない ため です。
  const ローカル = process.argv.includes("--local");
  const base = ローカル ? (process.env.E2E_LOCAL_URL || "http://localhost:3000")
    : (env.E2E_BASE_URL || "https://woolsong.app");
  // ★★★手元の サーバは、★はじめの 1回だけ 組み立てに 時間が かかります。
  //   ★★先に 開いて 温めて おきます。★待ち時間も 長めに します。
  const 待ち = ローカル ? 180000 : 45000;
  if (ローカル) {
    await ap.goto(base + "/dashboard", { waitUntil: "domcontentloaded", timeout: 180000 })
      .catch(() => {});
    await ap.waitForTimeout(2000);
  }
  await ap.goto(base + "/login", { waitUntil: "domcontentloaded", timeout: 待ち });
  await ap.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
  await ap.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
  await ap.locator('button[type="submit"], button:has-text("ログイン")').first().click();
  await ap.waitForURL(/\/dashboard/, { timeout: 待ち });
  await ap.waitForTimeout(3000);
  for (let i = 0; i < 4; i++) {
    if (!(await ap.locator('[role="dialog"]').count())) break;
    await ap.keyboard.press("Escape").catch(() => {});
    await ap.waitForTimeout(400);
  }
  // ★★★運営の 入口は、★⚙ の 中に あります（★2026-09-20 に 測りました）。
  //   ★★はじめ「きょう」の 画面で 探して いました。★見つかりません でした。
  const 歯車 = ap.locator('button:has-text("⚙")').first();
  if (await 歯車.count()) { await 歯車.click(); await ap.waitForTimeout(1800); }
  // ★★★どの 学校に 入るか（★2026-09-20）。
  //   ★★★見本は いつも 中身が 入って います。★実機は 空の 節を 出しません。
  //     ★★中身の 無い 学校で くらべると、★「見本のみ」が 中身の 数 だけ 出ます。
  //     ★★★それは ちがい では ありません。★記録が 無い だけ です。
  //   ★★だから、★記録の ある 学校を 名で 選びます。
  const 学校 = process.env.E2E_ORG || MAP.org || "★実機テスト";
  const 運営札 = `button:has-text("${学校}")`;
  if (!(await ap.locator(運営札).count())) {
    console.error(`★止まりました ── ★「${学校}」の 運営の 入口が ありません`);
    await b.close();
    process.exit(1);
  }
  await ap.locator(運営札).first().click();
  await ap.waitForTimeout(3000);

  /** ★運営の 入口に 戻ります（★1画面ごとに、★まっさらから）。 */
  const もどる = async () => {
    await ap.goto(base + "/dashboard", { waitUntil: "domcontentloaded" });
    await ap.waitForTimeout(2500);
    for (let i = 0; i < 3; i++) {
      if (!(await ap.locator('[role="dialog"]').count())) break;
      await ap.keyboard.press("Escape").catch(() => {});
      await ap.waitForTimeout(400);
    }
    const g = ap.locator('button:has-text("⚙")').first();
    if (await g.count()) { await g.click(); await ap.waitForTimeout(1500); }
    await ap.locator(運営札).first().click({ timeout: 10000 });
    await ap.waitForTimeout(2500);
  };

  const 出 = [];
  for (const sc of 的) {
    let mihon = null, impl = null, err = "";
    try {
      // ★★★`push` に 引数の 要る 画面が あります（★れい 役職の 中身）。
      //   ★★渡さないと、★見本の 側で 落ちます（★2026-09-20 に 落ちました）。
      await mp.evaluate(([tab, push, arg]) => {
        if (tab) window.go(tab);
        if (push) window.push(push, arg);
      }, [sc.tab || null, sc.push || null,
        sc.pushArg === undefined ? null : sc.pushArg]);
      await mp.waitForTimeout(350);
      mihon = await mp.$eval("#bodyEl", HONE_FN).catch(async () =>
        mp.$eval("body", HONE_FN));
    } catch (e) {
      err += "見本:" + String(e.message).replace(/\s+/g, " ").slice(0, 70) + " ";
    }
    try {
      const t = sc.impl.tab;
      await もどる();
      await ap.locator(`nav button:has-text("${t}"), button:has-text("${t}")`)
        .first().click({ timeout: 8000 });
      await ap.waitForTimeout(1500);
      for (const s of (sc.impl.steps || [])) {
        await ap.locator(`button:has-text("${s}"), [role="button"]:has-text("${s}")`)
          .first().click({ timeout: 8000 });
        await ap.waitForTimeout(1200);
      }
      // ★★★`data-ops-body` は 2026-09-20 に 足した 目じるし です。
      //   ★★本番に 出るまでは 無い ので、★そのときは 入れもの ごと 取り、
      //     ★★外がわ の 札（帯・もどる・たたむ）を 落とします。
      const 印あり = await ap.locator("[data-ops-body]").count();
      impl = await ap.$eval(印あり ? "[data-ops-body]" : "main, body", HONE_FN);
      if (!印あり) {
        const 外 = ["‹ もどる", "たたむ", "ひろげる", "あ ふつう", "あ 大きい",
          "ホーム", "名簿", "日程", "門下", "行事", "連絡", "設定"];
        impl = impl.filter((s) => !外.includes(s.split("｜")[1]));
      }
    } catch (e) {
      err += "実機:" + String(e.message).replace(/\s+/g, " ").slice(0, 70);
    }

    if (!mihon || !impl) {
      出.push({ key: sc.key,
        err: err || `取れませんでした（見本 ${mihon ? mihon.length : "なし"}`
          + ` ／ 実機 ${impl ? impl.length : "なし"}）` });
      console.log(`  --  ${sc.key} … ${err}`);
      continue;
    }
    const r = kuraberu(mihon, impl);
    // ★★★題（見出し）だけ でも くらべます（★2026-09-20・坂本さんの お決め）。
    //   ★★見本の 中身は 作りもの です。★行を くらべると、★架空の お名前が
    //     ★★そのまま「見本のみ」に 並びます。★本当の 差が 埋もれます。
    //   ★★題は 作りもの では ありません。★書いた 字 その もの です。
    //     ★★だから「節が ある か」「順に 並んで いるか」を、★ここで 見ます。
    // ★★★画面 じたいの 名（★見本の `h2`）は 落とします。
    //   ★★実機では、★名は 上の 帯に 出て います（★中身の 外）。
    //   ★★残すと、★どの 画面でも「見本のみ … 名簿」が 並びます。★差では ありません。
    const 名たち = [sc.key, sc.tab, sc.push, (sc.impl || {}).tab].filter(Boolean);
    const 題 = (a) => a
      .filter((s) => s.startsWith("題｜"))
      .filter((s) => !名たち.includes(s.replace("題｜", "").trim()));
    const rt = kuraberu(題(mihon), 題(impl));
    // ★★★段階2 ── ★注記だけ（★裁定 その111）。
    //   ★★注記は 約束 その もの です。★いちばん 重い ところ です。
    const 注 = (a) => a.filter((s) => s.startsWith("注｜"));
    const rn = kuraberu(注(mihon), 注(impl));
    出.push({ key: sc.key, ...r, title: rt, note: rn,
      n: { mihon: mihon.length, impl: impl.length } });
    console.log(`  ok  ${sc.key} … 題 ${rt.same}/${rt.onlyMihon.length}/${rt.onlyImpl.length}`
      + `　注記 ${rn.same}/${rn.onlyMihon.length}/${rn.onlyImpl.length}`
      + `　｜　ぜんぶ ${r.same}/${r.onlyMihon.length}/${r.onlyImpl.length}`
      + "　（同じ/見本のみ/実機のみ）");
  }
  await b.close();

  const L = [];
  L.append = (s) => L.push(s);
  L.push("# ★段3a ── ★見本と 実機の 骨組み くらべ\n");
  L.push("★この 紙は `tools/dom_compare.js` が 書きました。★手で 足して いません。");
  L.push(`★見た 先 …… ${base}`
    + `（${ローカル ? "★手元の 開発サーバ ── いま 書いた もの"
      : "★本番 ── 出た もの"}）`);
  L.push("★道具の 較正 …… ○（★同じ もので 0件、★1つ 抜くと 1件、★並べ替えで 1件）\n");
  L.push(`★くらべた 画面 ${出.filter((x) => !x.err).length} ／ `
    + `★道が 無くて くらべて いない 画面 ${MAP.skip.length}\n`);
  L.push("\n## ★一 ★題（見出し）だけ の くらべ ── ★本当の 差\n");
  L.push("★★見本の 中身は 作りもの です。★行を くらべると、★架空の お名前が"
    + " そのまま 差に なります。★題は 書いた 字 その もの なので、★ここが 本当の 差 です。\n");
  L.push("| 画面 | 同じ | ★見本に あって 実機に 無い | ★実機に あって 見本に 無い | 並び |");
  L.push("|---|---|---|---|---|");
  出.forEach((x) => {
    if (x.err) { L.push(`| ${x.key} | — | — | — | ★${x.err} |`); return; }
    const a = x.title;
    L.push(`| ${x.key} | ${a.same} | ${a.onlyMihon.length} | ${a.onlyImpl.length} | ${a.order.length} |`);
  });

  L.push("\n### ★題の 中身（★差の ある 画面 だけ）\n");
  出.forEach((x) => {
    if (x.err) return;
    const a = x.title;
    if (!a.onlyMihon.length && !a.onlyImpl.length && !a.order.length) return;
    L.push(`**★${x.key}**\n`);
    a.onlyMihon.forEach((s) => L.push(`- ★見本のみ … ${s.replace("題｜", "")}`));
    a.onlyImpl.forEach((s) => L.push(`- ★実機のみ … ${s.replace("題｜", "")}`));
    a.order.forEach((s) => L.push(`- ★並びちがい … ${s.replace("題｜", "")}`));
    L.push("");
  });

  L.push("\n## ★二 ★注記だけ の くらべ ── ★約束 その もの（★段階2）\n");
  L.push("★★注記は、★私たちが 書いた 約束 です。★いちばん 重い ところ です。\n");
  L.push("| 画面 | 同じ | ★見本に あって 実機に 無い | ★実機に あって 見本に 無い |");
  L.push("|---|---|---|---|");
  出.forEach((x) => {
    if (x.err) { L.push(`| ${x.key} | — | — | — |`); return; }
    L.push(`| ${x.key} | ${x.note.same} | ${x.note.onlyMihon.length} | ${x.note.onlyImpl.length} |`);
  });
  L.push("\n### ★注記の 中身（★差の ある 画面 だけ）\n");
  出.forEach((x) => {
    if (x.err) return;
    const a = x.note;
    if (!a.onlyMihon.length && !a.onlyImpl.length) return;
    L.push(`**★${x.key}**\n`);
    a.onlyMihon.forEach((s) => L.push(`- ★見本のみ … ${s.replace("注｜", "")}`));
    a.onlyImpl.forEach((s) => L.push(`- ★実機のみ … ${s.replace("注｜", "")}`));
    L.push("");
  });

  L.push("\n## ★三 ★ぜんぶ（★行も 含む）── ★参考\n");
  L.push("| 画面 | 同じ | 見本のみ | 実機のみ | 並び |");
  L.push("|---|---|---|---|---|");
  出.forEach((x) => {
    if (x.err) L.push(`| ${x.key} | — | — | — | ★${x.err} |`);
    else L.push(`| ${x.key} | ${x.same} | ${x.onlyMihon.length} | ${x.onlyImpl.length} | ${x.order.length} |`);
  });
  出.forEach((x) => {
    if (x.err) return;
    if (!x.onlyMihon.length && !x.onlyImpl.length && !x.order.length) return;
    L.push(`\n### ★${x.key}（★行も 含む）\n`);
    if (x.onlyMihon.length) {
      L.push("★見本に あって 実機に 無い");
      x.onlyMihon.slice(0, 25).forEach((s) => L.push(`- ${s}`));
    }
    if (x.onlyImpl.length) {
      L.push("\n★実機に あって 見本に 無い");
      x.onlyImpl.slice(0, 25).forEach((s) => L.push(`- ${s}`));
    }
    if (x.order.length) {
      L.push("\n★並びが ちがう");
      x.order.slice(0, 15).forEach((s) => L.push(`- ${s}`));
    }
  });
  L.push("\n## ★道が 無くて くらべて いない 画面\n");
  MAP.skip.forEach((s) => L.push(`- ${s.key} …… ${s.why}`));

  const p = path.join(ROOT, "docs/reports/2026-09-20-段3a-骨組みくらべ.md");
  fs.writeFileSync(p, L.join("\n") + "\n", "utf8");
  console.log("\nREPORT: " + p);
})();
