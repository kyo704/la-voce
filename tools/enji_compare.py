#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★えんじを 直す 前と 後を、★同じ 形の 上に 並べて 撮る。

  ★出どころ 2026-09-14、★坂本さん「比較画像を添付」

  ★★アプリ そのものは、★ここでは 動きません（★.env.local が ありません）。
    ★★だから 撮れるのは「色そのもの」だけです。★画面では ありません。
    ★★見本の CSS から 形（ぼたん・札・目盛り）を 写して 並べます。
"""

import io
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "design", "compare")
TMP = os.path.join(OUT, "_enji.html")

OLD = "#7A1F2B"
NEW = "#840C24"
LADDER = ["#E4D1CF", "#CCA9AA", "#B58185", "#9A545C"]


def block(title, enji, note):
  s = []
  s.append('<section><h2>' + title + '<span>' + enji + '</span></h2>')
  s.append('<p class="n">' + note + '</p>')
  s.append('<div class="row">')
  s.append('<button style="background:' + enji + '">出す</button>')
  s.append('<b class="pill" style="background:' + enji + '">えらんだ</b>')
  s.append('<b class="pill o" style="color:' + enji + ';border-color:' + enji
           + '">わく</b>')
  s.append('</div>')
  s.append('<div class="lad">')
  for h in LADDER:
    s.append('<i style="background:' + h + '"></i>')
  s.append('<i style="background:' + enji + ';color:#fff">5</i>')
  s.append('</div>')
  s.append('<p class="n">★5段の 目盛り。★いちばん 右が えんじ そのもの。</p>')
  s.append('</section>')
  return "\n".join(s)


html = """<!doctype html><meta charset="utf-8">
<style>
 body{margin:0;background:#F6F1E7;font:14px/1.7 -apple-system,"Hiragino Sans",sans-serif;
   color:#241914;padding:22px}
 h1{font-size:16px;margin:0 0 4px}
 .sub{font-size:12px;color:#6b5d52;margin:0 0 18px}
 .w{display:flex;gap:16px;align-items:flex-start}
 section{flex:1;background:#FFFDF8;border:1px solid #E4DCC9;border-radius:12px;padding:16px}
 h2{font-size:13px;margin:0 0 2px;display:flex;justify-content:space-between}
 h2 span{font-family:ui-monospace,monospace;color:#6b5d52;font-weight:400}
 .n{font-size:11px;color:#6b5d52;margin:6px 0 10px}
 .row{display:flex;gap:8px;align-items:center;margin-bottom:14px}
 button{border:0;border-radius:999px;color:#FFFDF8;padding:9px 20px;font-size:13px}
 .pill{border-radius:999px;color:#FFFDF8;padding:6px 14px;font-size:12px;
   display:inline-block;border:1px solid transparent}
 .pill.o{background:#FFFDF8}
 .lad{display:flex;gap:0;border-radius:8px;overflow:hidden;width:100%}
 .lad i{flex:1;height:42px;display:flex;align-items:center;justify-content:center;
   font-style:normal;font-size:11px}
</style>
<h1>えんじ ── 前と 後</h1>
<p class="sub">★左が いままで、★右が 見本の 値。★アプリの 画面では ありません。色だけです。</p>
<div class="w">
""" + block("まえ", OLD, "★画面の 写真から 拾った 値") \
    + block("あと", NEW, "★見本 4本の --enji（★4本 とも 同じ）") + """
</div>
"""

io.open(TMP, "w", encoding="utf-8").write(html)

JS = """
const { chromium } = require("playwright");
(async () => {
  // ★★この 機械（macOS 12）には、★playwright の chromium が 入りません。
  //   ★★入って いる Google Chrome を 借ります。
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 900, height: 420 },
    deviceScaleFactor: 2 });
  await p.goto("file://" + process.argv[2]);
  await p.screenshot({ path: process.argv[3], fullPage: true });
  await b.close();
})();
"""
js = os.path.join(OUT, "_shot.js")
io.open(js, "w", encoding="utf-8").write(JS)
png = os.path.join(OUT, "enji.png")
r = subprocess.run(["node", js, TMP, png], capture_output=True, text=True)
if r.returncode:
  print("ERR: " + r.stderr.strip()[:300])
else:
  os.remove(js)
  os.remove(TMP)
  print("PNG: " + png + "  " + str(os.path.getsize(png)) + " bytes")
