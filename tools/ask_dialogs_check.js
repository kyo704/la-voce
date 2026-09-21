#!/usr/bin/env node
// ============================================================================
// ★お尋ねの 箱を、★実際に 押して 確かめます（★裁定 その142・2026-09-21）
//
//   ★★★読むだけ では 足りません。★押して 見ます。
//     ★★「押す 前に お尋ねする」は、★字が 在る ことでは なく、
//       ★★**押した とき に 出る** ことです。
//   ★★★やめる（取り消す）側も 見ます。★出す だけ なら 半分 です。
//     ★★やめたのに 消えて いた ── ★それが いちばん 怖い 誤り です。
//
//   ★入り方は tools/dom_compare.js と 同じ です（★手元の 台帳に 直に 尋ねます）。
// ============================================================================
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const { chromium } = require(path.join(ROOT, "node_modules/playwright"));
const base = "http://localhost:3000";
const 待ち = 60000;

function env(p) {
  const o = {};
  fs.readFileSync(path.join(ROOT, p), "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return o;
}

(async () => {
  const e2e = env(".env.e2e");
  const 台帳 = env(".env.local");
  const b = await chromium.launch({ channel: "chrome" });  // ★手元の Chrome を 借ります（★dom_compare.js と 同じ）
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  const ap = await ctx.newPage();
  await ap.goto(base + "/login", { waitUntil: "domcontentloaded", timeout: 待ち });
  const しるし = await ap.evaluate(async ([u, k, m, pw]) => {
    const r = await fetch(u + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: { apikey: k, "Content-Type": "application/json" },
      body: JSON.stringify({ email: m, password: pw })
    });
    return r.ok ? await r.json() : null;
  }, [台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    e2e.E2E_LOCAL_EMAIL, e2e.E2E_LOCAL_PASSWORD]);
  if (!しるし) { console.error("★入れません"); await b.close(); process.exit(1); }
  const ref = String(台帳.NEXT_PUBLIC_SUPABASE_URL).replace(/^https:\/\//, "").split(".")[0];
  const 生 = "base64-" + Buffer.from(JSON.stringify(しるし), "utf8").toString("base64");
  const 塊 = [];
  for (let i = 0; i < 生.length; i += 3180) 塊.push(生.slice(i, i + 3180));
  const url = new URL(base);
  await ctx.addCookies(塊.length === 1
    ? [{ name: "sb-" + ref + "-auth-token", value: 生, domain: url.hostname, path: "/" }]
    : 塊.map((v, i) => ({ name: `sb-${ref}-auth-token.${i}`, value: v,
      domain: url.hostname, path: "/" })));

  const 結果 = [];
  const みる = (名, ok, 註) => { 結果.push({ 名, ok, 註 }); console.log(`  ${ok ? "○" : "✗"} ${名}${註 ? "　── " + 註 : ""}`); };

  async function 運営へ() {
    await ap.goto(base + "/dashboard", { waitUntil: "domcontentloaded", timeout: 待ち });
    // ★★手元の サーバは 画面を はじめて 開く とき 組み立てます。★長く 待ちます
    //   （★tools/dom_compare.js と 同じ 待ち です）。
    await ap.waitForTimeout(12000);
    for (let i = 0; i < 4; i++) {
      if (!(await ap.locator('[role="dialog"]').count())) break;
      await ap.keyboard.press("Escape").catch(() => {});
      await ap.waitForTimeout(400);
    }
    const 歯車 = ap.locator('button:has-text("⚙")').first();
    if (await 歯車.count()) { await 歯車.click(); await ap.waitForTimeout(1800); }
    await ap.locator('button:has-text("A13たしかめ学科")').first().click({ timeout: 待ち });
    await ap.waitForTimeout(8000);
  }
  const 押す = async (字) => {
    await ap.locator(`button:has-text("${字}"), [role="button"]:has-text("${字}")`)
      .first().click({ timeout: 待ち });
    await ap.waitForTimeout(2500);
  };
  const 在る = async (字) => (await ap.locator(`text=${字}`).count()) > 0;

  // ------------------------------------------------------------------ ①やり直す
  await 運営へ();
  await 押す("日程");
  await 押す("日程を 組む");
  await 押す("この 先生の 分");
  const 前 = await ap.locator('button:has-text("やり直す"), [role="button"]:has-text("やり直す")').count();
  みる("①やり直す の 札が 出て いる（★置いた ものが ある とき）", 前 > 0);
  if (前 > 0) {
    await 押す("やり直す");
    const 箱 = await 在る("この 週に 置いた ものを、ぜんぶ 外しますか。");
    みる("②押すと お尋ねが 出る（★いきなり 外さない）", 箱);
    // ★★やめる 側 ── ★閉じて、★札が まだ ある こと（＝外れて いない）。
    const 閉 = ap.locator('button:has-text("やめる"), button:has-text("とじる"), button:has-text("いいえ")');
    if (await 閉.count()) { await 閉.first().click(); await ap.waitForTimeout(1000); }
    else { await ap.keyboard.press("Escape"); await ap.waitForTimeout(1000); }
    const 後 = await ap.locator('button:has-text("やり直す"), [role="button"]:has-text("やり直す")').count();
    みる("③やめた ら、★外れて いない（★札が まだ ある）", 後 > 0);
  }

  // -------------------------------------------------------- ②自分の予定だけ 全部外す
  const 予定 = await ap.locator('button:has-text("自分の予定だけ 全部外す")').count();
  みる("④自分の予定だけ 全部外す の 札が 出て いる", 予定 > 0);
  if (予定 > 0) {
    await 押す("自分の予定だけ 全部外す");
    みる("⑤押すと お尋ねが 出る",
      await 在る("ご自分の「来られない」の 印を、ぜんぶ 外しますか。"));
    みる("⑥よその 人に 触らない ことを 言って いる",
      await 在る("ほかの 方の 予定は 変わりません"));
    await ap.keyboard.press("Escape").catch(() => {});
    await ap.waitForTimeout(800);
  }

  // ------------------------------------------------------------------ ③未送信
  await 運営へ();
  await 押す("連絡");
  await 押す("未送信");
  みる("⑦下書きの 札は「つづきを 書く」", await 在る("つづきを 書く"));
  みる("⑧送れなかった 行 だけ「もう一度 出す」", await 在る("もう一度 出す"));
  みる("⑨直に「出す」札を 置いて いない",
    (await ap.locator('button', { hasText: /^出す$/ }).count()) === 0);
  await 押す("つづきを 書く");
  みる("⑩押すと 書く 画面が 開く", await 在る("おしらせを 書く"));
  みる("⑪書きかけの 字が 入って いる",
    (await ap.locator('textarea').first().inputValue()).length > 0);
  みる("⑫やめる の 札が ある", (await ap.locator('button:has-text("やめる")').count()) > 0);

  // ---------------------------------------------------- ④やめる ── ★残る ことを 見る
  // ★★★字を 1つ 足して から やめます。★残った か どうかを、★数で 見ます。
  const 印 = "★やめるの ためし";
  const 欄 = ap.locator("textarea").first();
  await 欄.fill((await 欄.inputValue()) + 印);
  await ap.waitForTimeout(400);
  await 押す("やめる");
  みる("⑬やめる と 未送信へ 戻る", await 在る("未送信"));
  // ★★★一覧の 字では 見ません（★2026-09-21 に 直しました）。
  //   ★★一覧は 題を 出します（`headOf`）。★中身は 出しません。
  //   ★★はじめ 一覧で 探し、★「捨てて いる」と 誤って 読みました。
  //     ★★台帳には 入って いました。★道具の 見る ところが ちがった だけ です。
  //   ★★★もう一度 開いて、★入力欄の 中を 見ます。
  await 押す("つづきを 書く");
  const 中 = await ap.locator("textarea").first().inputValue();
  みる("⑭書いた ものが 残って いる（★捨てて いない）", 中.includes(印),
    中.includes(印) ? "" : "★入力欄に ありません");
  // ★★あと片づけ ── ★ためしの 字を 戻します。★台帳を 汚しません。
  await ap.locator("textarea").first().fill(中.split(印).join(""));
  await ap.waitForTimeout(300);
  await 押す("やめる");

  // ★★★較正 ── ★在る はず の ない 字で 試します。
  //   ★★これが 「在る」と 出るなら、★この 道具は 何も 見て いません。
  const 較正 = await 在る("★この字は どこにも ありません 0921");
  みる("⑮較正 ── ★無い ものは「無い」と 出る", 較正 === false);

  console.log("\n★" + 結果.filter((x) => x.ok).length + " / " + 結果.length + " 通りました");
  await b.close();
  process.exit(結果.every((x) => x.ok) ? 0 : 1);
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
