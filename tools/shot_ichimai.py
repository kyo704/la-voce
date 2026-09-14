#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★ノート →「1枚」の 画面を 撮る。

  ★出どころ 2026-09-14

  ★★見本（`nJushin`）の 形に 合わせた あとの 姿を 見ます。
    ★① 何も 足して いない とき
    ★② いくつか 足した とき（★「本人の ことば」を 含む）
    ★③ 期間の「選ぶ」を 押して、★暦が 出た とき
"""

import io
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "design", "compare", "ichimai")
os.makedirs(OUT, exist_ok=True)

JS = r"""
const { chromium } = require("playwright");
const [, , base, email, pass, out] = process.argv;
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 430, height: 900 },
    deviceScaleFactor: 2 });
  const log = [];
  p.on("console", (m) => { if (m.type() === "error") log.push(m.text()); });
  p.on("pageerror", (e) => log.push("pageerror: " + String(e)));
  await p.goto(base + "/login");
  await p.waitForTimeout(800);
  await p.getByRole("textbox").first().fill(email);
  await p.locator('input[type="password"]').first().fill(pass);
  await p.locator('button[type="submit"], form button').first().click();
  await p.waitForTimeout(9000);
  const c = p.getByText("同意して続ける", { exact: true }).first();
  if (await c.count()) { await c.click(); await p.waitForTimeout(4000); }
  await p.getByRole("button", { name: "ノート", exact: true }).first().click();
  await p.waitForTimeout(2000);
  // ★★「1枚」は 札です。★役割で 引けない ことが あります。
  const ichi = p.getByText("1枚", { exact: true }).first();
  await ichi.waitFor({ timeout: 15000 });
  await ichi.click();
  await p.waitForTimeout(2500);
  await p.screenshot({ path: out + "/01-はじめ.png", fullPage: true });

  // ★★いくつか 足します。
  //   ★★字で 引くと、★添え字の ある 行に 当たりません。
  //     ★行（role=button）ごと 押します。
  for (const label of ["昨夜の 睡眠", "本人の ことば", "名前を 入れる"]) {
    const el = p.getByRole("button", { name: new RegExp("^" + label) }).first();
    if (await el.count()) { await el.click(); await p.waitForTimeout(600); }
  }
  await p.screenshot({ path: out + "/02-足したあと.png", fullPage: true });

  // ★期間の「選ぶ」
  const pick = p.getByRole("button", { name: "選ぶ", exact: true }).first();
  if (await pick.count()) { await pick.click(); await p.waitForTimeout(1200); }
  await p.screenshot({ path: out + "/03-期間をえらぶ.png", fullPage: true });

  // ★★レッスンに 持っていく 1枚（★別の 画面）
  const les = p.getByText("レッスンに 持っていく 1枚", { exact: true }).first();
  if (await les.count()) { await les.click(); await p.waitForTimeout(1500); }
  await p.screenshot({ path: out + "/04-レッスン.png", fullPage: true });

  const txt = await p.evaluate(() =>
    document.body.innerText.replace(/\n{2,}/g, "\n").slice(0, 1400));
  await b.close();
  console.log("TEXT:" + JSON.stringify({ txt, log }));
})();
"""
js = os.path.join(OUT, "_shot.js")
io.open(js, "w", encoding="utf-8").write(JS)
r = subprocess.run(["node", js, "http://localhost:3000",
                    "kyo0703opera+localtest@gmail.com", "LocalTest-2026-0914!",
                    OUT], capture_output=True, text=True, cwd=ROOT)
os.remove(js)
line = [x for x in r.stdout.split("\n") if x.startswith("TEXT:")]
if not line:
  print("ERR: " + (r.stderr or r.stdout).strip()[:600])
  sys.exit(1)
import json
d = json.loads(line[0][5:])
print(d["txt"])
print("\n★誤りの 言づて: " + str(len(d["log"])))
for x in d["log"]:
  print("  " + x[:180])
print("\n→ " + OUT)
