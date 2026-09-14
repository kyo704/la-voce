#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★暗い ほうの 見本を、★前と 後で 撮って 並べる（★No.013 STEP_6）。

  ★出どころ 2026-09-14

  ★★前 … git の いまの 頭（★まだ 直して いない 見本）
  ★★後 … 直した あとの 見本（★#8E1230 → var(--enji-bg)）

  ★★明るい ほうも 撮ります。★「見た目が 変わって いない」ことを
    ★見るのが STEP_5 の 目的だからです。

  ★★この 機械（macOS 12）には playwright の chromium が 入りません。
    ★入って いる Google Chrome を 借ります。
"""

import io
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = "docs/design/pack-final"
OUT = os.path.join(ROOT, "docs", "design", "compare")
TMP = os.path.join(OUT, "_before")

MIHON = [f for f in sorted(os.listdir(os.path.join(ROOT, PACK)))
         if f.startswith("00-動く見本")]

os.makedirs(TMP, exist_ok=True)
for f in MIHON:
  r = subprocess.run(["git", "show", "HEAD:" + PACK + "/" + f],
                     cwd=ROOT, capture_output=True)
  if r.returncode:
    print("ERR: git show " + f + " / " + r.stderr.decode()[:120])
    sys.exit(1)
  io.open(os.path.join(TMP, f), "wb").write(r.stdout)

JS = r"""
const { chromium } = require("playwright");
const files = JSON.parse(process.argv[2]);
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  for (const job of files) {
    const p = await b.newPage({
      viewport: { width: job.w || 430, height: job.h || 900 },
      deviceScaleFactor: job.full ? 1 : 2 });
    await p.goto("file://" + job.src);
    // ★★見本は 読み込みの あとに 自分で th を 決め直す ことが あります。
    //   ★★だから 待ってから 立て、★立てた ことを 確かめます。
    await p.waitForTimeout(600);
    const got = await p.evaluate((th) => {
      document.documentElement.setAttribute("data-th", th);
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--enji").trim();
    }, job.theme);
    await p.waitForTimeout(700);
    console.log(job.theme + "  --enji=" + got + "  " + job.out.split("/").pop());
    await p.screenshot({ path: job.out, fullPage: !!job.full });
    await p.close();
  }
  await b.close();
})();
"""
js = os.path.join(OUT, "_shot.js")
io.open(js, "w", encoding="utf-8").write(JS)

jobs = []
shots = []
for f in MIHON:
  key = (f.replace("00-動く見本", "").replace(".html", "").strip("-（）")) or "全画面"
  for theme in ("dark", "light"):
    for when, base in (("mae", os.path.join(TMP, f)),
                       ("ato", os.path.join(ROOT, PACK, f))):
      png = os.path.join(OUT, "_%s_%s_%s.png" % (key, theme, when))
      jobs.append({"src": base, "out": png, "theme": theme})
  shots.append(key)

import json
r = subprocess.run(["node", js, json.dumps(jobs)], capture_output=True, text=True)
print(r.stdout.strip())
if r.returncode:
  print("ERR: " + r.stderr.strip()[:400])
  sys.exit(1)

# ★★並べた 1枚を 作ります。★左が 前、★右が 後。
rows = []
for key in shots:
  for theme in ("dark", "light"):
    a = "_%s_%s_mae.png" % (key, theme)
    o = "_%s_%s_ato.png" % (key, theme)
    rows.append('<section><h2>' + key + ' ／ '
                + ("くらい" if theme == "dark" else "あかるい")
                + '</h2><div class="p"><figure><figcaption>まえ</figcaption>'
                + '<img src="' + a + '"></figure>'
                + '<figure><figcaption>あと</figcaption>'
                + '<img src="' + o + '"></figure></div></section>')

html = """<!doctype html><meta charset="utf-8">
<style>
 body{margin:0;background:#F6F1E7;font:13px/1.6 -apple-system,"Hiragino Sans",sans-serif;
   color:#241914;padding:20px}
 h1{font-size:16px;margin:0 0 4px}
 .s{font-size:11px;color:#6b5d52;margin:0 0 16px}
 section{margin-bottom:22px}
 h2{font-size:12px;margin:0 0 6px}
 .p{display:flex;gap:12px}
 figure{margin:0;flex:1}
 figcaption{font-size:10px;color:#6b5d52;margin-bottom:3px}
 img{width:100%;border:1px solid #E4DCC9;border-radius:8px;display:block}
</style>
<h1>えんじ ── 役で 2つに 分けた 前と 後</h1>
<p class="s">★左が まえ（#8E1230 を 直に 書いた もの）、★右が あと（var(--enji-bg)）。
 ★あかるい ほうは 変わらない はずです。</p>
""" + "\n".join(rows)
page = os.path.join(OUT, "enji-dark.html")
io.open(page, "w", encoding="utf-8").write(html)

big = os.path.join(OUT, "enji-dark.png")
r2 = subprocess.run(["node", js, json.dumps(
  [{"src": page, "out": big, "theme": "light", "w": 1100, "h": 900,
    "full": True}])], capture_output=True, text=True)
if r2.returncode:
  print("ERR: " + r2.stderr.strip()[:300])
  sys.exit(1)
os.remove(js)
print("PNG: " + big + "  " + str(os.path.getsize(big)) + " bytes")
print("HTML: " + page)
