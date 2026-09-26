/**
 * ★個人の 画面へ ★人が 押す のと 同じ 道で 行きます（★2026-09-26）。
 *
 *   ★★★`tools/dom_compare_personal.js`（見本と くらべる）と
 *     ★`tools/baseline_shot.js`（基準画を 撮る）が ★**同じ 道** を 使います。
 *     ★★道が 2つ あると、★片方だけ 直って ★別の 画面を 撮る ことに なります。
 *     ★★だから 行き方は ここ 1つ に 置きます。
 *
 *   ★★行き先は `tools/dom_personal_map.json` が 持ちます。
 */
const fs = require("fs");
const path = require("path");

// ★★★`.env.e2e` は 秘密の 紙 です（★git に 入りません）。
//   ★★作業用の 別の 木（`la-voce-sub3` など）には 無い ことが あります。
//   ★★`LAVOCE_E2E_ENV` で 紙の 場所を 渡せます。★写しは 作りません。
function 紙を読む(root) {
  const p = process.env.LAVOCE_E2E_ENV || path.join(root, ".env.e2e");
  const env = {};
  fs.readFileSync(p, "utf8").split("\n").forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  });
  return env;
}

// ★★口は `.env.e2e` の `E2E_LOCAL_URL` が 正 です（★`next dev` は 空いて いる 口を 選びます）。
function 口(env) {
  return process.env.E2E_LOCAL_URL || env.E2E_LOCAL_URL || "http://localhost:3000";
}

// ★★入り方は `tools/compare.js` と 同じ 形 です（★あちらは 通って います）。
//   ★★★着けなければ false を 返します。★白い 絵を 撮る かどうかは ★呼ぶ 側が 決めます。
async function 入る(page, env, base) {
  await page.goto(base + "/login");
  await page.locator('input[type="email"]').first().fill(env.E2E_LOCAL_EMAIL || env.E2E_EMAIL);
  await page.locator('input[type="password"]').first().fill(env.E2E_LOCAL_PASSWORD || env.E2E_PASSWORD);
  await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
  // ★★★`waitForURL` は「読み終わる」まで 待ちます。★門の 中の 画面は 台帳を
  //   ★何度も 引く ので、★`load` が 立たない ことが あります（★2026-09-26 に 見ました）。
  //   ★★だから **場所だけ** を 見ます。★着いて いれば 進みます。
  for (let n = 0; n < 60; n += 1) {
    if (/\/dashboard/.test(page.url())) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

async function 開く(page, 道) {
  await page.waitForTimeout(2500);
  // ★★★もっと は **帯に ありません**（★帯は 5つ です）。
  //   ★★入口は「きょう」の 右上の 歯車 です（★`HeadRound` の `aria-label`）。
  //   ★★2026-09-26 に ここで 30秒 待って 落ちました ── ★字で 探して いた から です。
  await page.getByLabel("もっとを開く").first().click({ timeout: 20000 });
  await page.waitForTimeout(900);
  // ★★★行は「名 ＋ 添える 字」が **1つの 札の 中** に あります。
  //   ★★だから `exact: true` では 当たりません（★2026-09-26 に 30秒 待って 落ちました）。
  //   ★★札（`button`）の 中の 字で 探します。★人が 押す のと 同じ 道 です。
  //   ★★★**見えて いる** 札 だけ から 選びます（★2026-09-26）。
  //     ★★もっとの 行は 束を 開いても `display:none` で 残ります（★`inMore(節)`）。
  //     ★★隠れた 札が 先に 当たると ★見える まで 待って 落ちます
  //       （★「プラン」「毎日、聞いてほしいこと」は 束の 外にも 同じ 字の 行が あります）。
  const 押す = async (字) => {
    const 札 = page.locator("main button:visible", { hasText: 字 }).first();
    await 札.click({ timeout: 20000 });
  };
  if (道.bundle) { await 押す(道.bundle); await page.waitForTimeout(900); }
  await 押す(道.row);
  await page.waitForTimeout(1500);
}

module.exports = { 紙を読む, 口, 入る, 開く };
