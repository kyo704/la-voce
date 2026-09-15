#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""招待の 流れを、★本物の ブラウザで 通す（2026-09-15）。

  ★出どころ 坂本さん ──「実ブラウザで 自動実行。★次に 同じ 確認が
    要る ときの ため、★再利用できる 形で tools/ に」

  ★★通す 道（★No.020 ②の 実機の 確かめ）
    ① 先生役で ログイン
    ② レッスン →「生徒を招待する」→ コードを 出す（★在れば 使い回す）
    ③ ★別の 入れ物で 生徒役で ログイン
    ④ もっと →「先生とつながる」→ コードを 入れる
    ⑤「つながる」を 押して、★できた ことを 見る

  ★★2つの 口座を **別の 入れ物**で 開きます。
    ★同じ 入れ物だと、★あとの ログインが 前の ものを 追い出します。

  ★★合いことばは `.env.e2e` から 読みます。★ここには 書きません。

  ★使い方
    python3 tools/invitation_flow_e2e.py [--base URL] [--code CODE]
      --code … ★出さずに、その コードを 使います
"""

import argparse
import io
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "design", "compare", "invitation")

JS = r"""
const { chromium } = require("playwright");
const [, , base, tEmail, tPass, sEmail, sPass, out, fixedCode] = process.argv;

const shots = [];
async function shot(p, name) {
  const f = out + "/" + name + ".png";
  await p.screenshot({ path: f, fullPage: false });
  shots.push(name);
}

// ★★見える 字で 押します。★この 倉庫の 道具は みな そう して います。
//   ★★字を 変える ときは、★道具も grep する 決め です（★2026-09-11）。
async function login(ctx, base, email, pass, tag, errs) {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(tag + " pageerror: " + String(e).slice(0, 160)));
  p.on("console", (m) => {
    if (m.type() === "error") errs.push(tag + " console: " + m.text().slice(0, 160));
  });
  await p.goto(base + "/login");
  await p.waitForTimeout(2500);
  for (let i = 0; i < 8; i++) {
    await p.getByRole("textbox").first().fill(email);
    await p.locator('input[type="password"]').first().fill(pass);
    await p.waitForTimeout(700);
    if ((await p.getByRole("textbox").first().inputValue()) === email) break;
  }
  await p.locator('button[type="submit"], form button').first().click();
  await p.waitForTimeout(9000);
  const c = p.getByText("同意して続ける", { exact: true }).first();
  if (await c.count()) { await c.click(); await p.waitForTimeout(4000); }
  for (let i = 0; i < 120; i++) {
    if (!(await p.getByText("読み込み中").count())) break;
    await p.waitForTimeout(500);
  }
  await p.waitForTimeout(2000);
  return p;
}

async function tabs(p) {
  return await p.evaluate(() => {
    const nav = [...document.querySelectorAll("div")].reverse().find((d) => {
      const t = (d.textContent || "");
      return t.includes("きょう") && t.includes("ひつじ") && d.children.length <= 8;
    });
    return nav ? [...nav.querySelectorAll("button")]
      .map((b) => (b.textContent || "").trim()).filter(Boolean) : [];
  });
}

(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const R = { steps: [], errors: [], code: null, linked: null };
  const errs = R.errors;

  // ===================== ① 先生役 =====================
  const ctxT = await b.newContext({ viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2 });
  const T = await login(ctxT, base, tEmail, tPass, "先生", errs);
  await shot(T, "01-先生-ログイン直後");
  const tTabs = await tabs(T);
  R.steps.push({ step: "① 先生役で ログイン", tabs: tTabs, ok: tTabs.length > 0 });

  // ===================== ② コードを 出す =====================
  let code = fixedCode || null;
  const lesson = T.getByRole("button", { name: "レッスン", exact: true }).first();
  R.steps.push({ step: "★レッスンの 札が ある", ok: (await lesson.count()) > 0 });
  if (await lesson.count()) {
    await lesson.click();
    await T.waitForTimeout(3000);
    await shot(T, "02-先生-レッスン");
    const inv = T.getByText("生徒を招待する", { exact: false }).first();
    R.steps.push({ step: "★「生徒を招待する」が ある", ok: (await inv.count()) > 0 });
    if (await inv.count()) {
      await inv.click();
      await T.waitForTimeout(1500);
      await shot(T, "03-先生-招待をひらく");
      if (!code) {
        const issue = T.getByRole("button", { name: /招待コードを (発行|作)/ }).first();
        if (await issue.count()) {
          await issue.click();
          await T.waitForTimeout(3500);
        }
      }
      await shot(T, "04-先生-コード");
      // ★★画面から コードを 拾います（★8文字の 大文字＋数字）。
      code = code || await T.evaluate(() => {
        const t = document.body.innerText;
        const m = t.match(/\b[A-Z0-9]{8}\b/g) || [];
        return m.length ? m[m.length - 1] : null;
      });
    }
  }
  R.code = code;
  R.steps.push({ step: "② コードを 得た", value: code, ok: !!code });

  // ===================== ③ 生徒役（★別の 入れ物） =====================
  const ctxS = await b.newContext({ viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2 });
  const S = await login(ctxS, base, sEmail, sPass, "生徒", errs);
  await shot(S, "05-生徒-ログイン直後");
  const sTabs = await tabs(S);
  R.steps.push({ step: "③ 生徒役で ログイン", tabs: sTabs, ok: sTabs.length > 0 });

  // ===================== ④ もっと →「先生とつながる」 =====================
  // ★★門の 中（5札）では、★歯車から もっとへ 行きます。
  let reached = false;
  const more = S.getByRole("button", { name: "もっと", exact: true }).first();
  if (await more.count()) { await more.click(); await S.waitForTimeout(2500); }
  else {
    // ★★`button:has(svg)` は 広すぎました（★2026-09-15）。
    //   ★★丸い「レッスンモード」の ボタンに 当たり、★30秒 待って 落ちました。
    //   ★★歯車は 字の「⚙」です。★それで 探します。
    const gear = S.locator('button:has-text("⚙"), [aria-label*="設定"], [aria-label*="もっと"]').first();
    if (await gear.count()) { await gear.click({ timeout: 8000 }); await S.waitForTimeout(3000); }
  }
  await shot(S, "06-生徒-もっと");
  const link = S.getByText("先生とつながる", { exact: false }).first();
  reached = (await link.count()) > 0;
  R.steps.push({ step: "④「先生とつながる」に 届く", ok: reached });
  if (reached) {
    await link.click();
    await S.waitForTimeout(1500);
    await shot(S, "07-生徒-つながる欄");
    if (code) {
      const box = S.locator('input[type="text"], input:not([type])').last();
      await box.fill(code);
      await S.waitForTimeout(600);
      const check = S.getByRole("button", { name: /確認|さがす|調べる/ }).first();
      if (await check.count()) { await check.click(); await S.waitForTimeout(3500); }
      await shot(S, "08-生徒-コード確認");
    }
  }

  // ===================== ⑤「つながる」 =====================
  const go = S.getByRole("button", { name: /^つながる$/ }).first();
  R.steps.push({ step: "★「つながる」の ボタンが ある", ok: (await go.count()) > 0 });
  if (await go.count()) {
    await go.click();
    await S.waitForTimeout(5000);
    await shot(S, "09-生徒-つながった");
    const body = (await S.locator("body").innerText()).slice(0, 400).replace(/\n+/g, " | ");
    R.linked = !/失敗|できません|見つかりません|使えません/.test(body);
    R.steps.push({ step: "⑤ つながった", body: body.slice(0, 200), ok: R.linked });
  }

  R.shots = shots;
  console.log(JSON.stringify(R, null, 1));
  await b.close();
})().catch(async (e) => {
  console.log(JSON.stringify({ error: String(e.message).slice(0, 300), shots }, null, 1));
  process.exit(1);
});
"""


def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--base", default="https://woolsong.app")
  ap.add_argument("--code", default="")
  a = ap.parse_args()

  os.makedirs(OUT, exist_ok=True)
  env = {}
  for line in io.open(os.path.join(ROOT, ".env.e2e"), encoding="utf-8"):
    if "=" in line and not line.strip().startswith("#"):
      k, v = line.strip().split("=", 1)
      env[k] = v
  need = ["E2E_TEACHER_EMAIL", "E2E_TEACHER_PASSWORD", "E2E_EMAIL", "E2E_PASSWORD"]
  miss = [k for k in need if not env.get(k)]
  if miss:
    print("★.env.e2e に ありません:", ", ".join(miss))
    return 1

  js = os.path.join(ROOT, "node_modules", ".cache", "invitation_flow.js")
  os.makedirs(os.path.dirname(js), exist_ok=True)
  io.open(js, "w", encoding="utf-8").write(JS)
  p = subprocess.run(
    ["node", js, a.base,
     env["E2E_TEACHER_EMAIL"], env["E2E_TEACHER_PASSWORD"],
     env["E2E_EMAIL"], env["E2E_PASSWORD"], OUT, a.code],
    cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
  err = p.stderr.decode("utf-8", "replace").strip()
  out = p.stdout.decode("utf-8", "replace").strip()
  if err:
    print("★stderr:", err[:400])
  if not out:
    print("★何も 返りません でした")
    return 1
  print(out)
  io.open(os.path.join(OUT, "result.json"), "w", encoding="utf-8").write(out + "\n")
  return 0


if __name__ == "__main__":
  sys.exit(main())
