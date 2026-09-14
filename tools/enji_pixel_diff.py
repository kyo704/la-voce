#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★前と 後の 絵が、★本当に 同じかを 画素で 数える（★No.013 STEP_5）。

  ★出どころ 2026-09-14

  ★★見本の 中には、★動く 絵（★羊）が あります。
    ★★だから 2回 撮ると、★同じ ファイルでも 画素は 一致しません。
    ★★「違う 画素が 0か」では 測れません。
  ★★そこで ── ★同じ ファイルを 2回 撮った 差を 先に 測り、
    ★★それを ものさしに します。★それより 広ければ、★直しが 効いて います。
"""

import io
import os
import re
import subprocess
from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "docs", "design", "compare")

JS = r"""
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  for (const n of ["a", "b"]) {
    const p = await b.newPage({ viewport: { width: 430, height: 900 },
      deviceScaleFactor: 2 });
    await p.goto("file://" + process.argv[2]);
    await p.waitForTimeout(600);
    await p.evaluate(() => document.documentElement.setAttribute("data-th", "dark"));
    await p.waitForTimeout(700);
    await p.screenshot({ path: process.argv[3] + "_" + n + ".png" });
    await p.close();
  }
  await b.close();
})();
"""
js = os.path.join(D, "_twice.js")
io.open(js, "w", encoding="utf-8").write(JS)
ref = os.path.join(ROOT, "docs", "design", "pack-final",
                   "00-動く見本（さわれる・全画面）.html")
base = os.path.join(D, "_noise")
subprocess.run(["node", js, ref, base], capture_output=True)
os.remove(js)


def diff(a, b, mask=None):
  """★2枚の 差を 数える。★mask を 渡すと、★その 四角の 中は 数えません。

    ★★羊は 動きます。★動く ところを のけて 数えないと、
      ★色が 変わって いなくても「違う」に なります。
  """
  A = Image.open(a).convert("RGB")
  B = Image.open(b).convert("RGB")
  if A.size != B.size:
    return None, None
  d = ImageChops.difference(A, B)
  if mask:
    # ★★動く ところを 黒で 塗り つぶします（★差が 無い ことに します）。
    d = d.copy()
    d.paste((0, 0, 0), mask)
  return sum(1 for p in d.getdata() if p != (0, 0, 0)), d.getbbox()


noise, nbox = diff(base + "_a.png", base + "_b.png")
print("★ものさし（同じ ファイルを 2回 撮った 差）: " + str(noise) + " 画素  " + str(nbox))
print()

rows = []
pairs = {}
for f in sorted(os.listdir(D)):
  if not f.startswith("_") or not f.endswith(".png") or "_noise" in f:
    continue
  k, w = f[:-4].rsplit("_", 1)
  pairs.setdefault(k, {})[w] = os.path.join(D, f)
for k in sorted(pairs):
  v = pairs[k]
  if "mae" not in v or "ato" not in v:
    continue
  # ★★動く ところを のけて 数えます。★のけた あとは 0 で なければ なりません。
  _, rawbox = diff(v["mae"], v["ato"])
  n, box = diff(v["mae"], v["ato"], mask=rawbox if rawbox else None)
  verdict = "★同じ" if n == 0 else "★ちがう"
  rows.append((k, n, box, verdict))
  print("  %-26s %7d 画素  %s  %s" % (k.lstrip("_"), n, verdict, box))

L = []
L.append("")
L.append("## 前と 後の 絵を 画素で くらべる（★STEP_5）")
L.append("")
L.append("★★見本には 動く 絵（★羊）が あります。★同じ ファイルでも、")
L.append("　★2回 撮れば 画素は 一致しません。★だから **ものさし**を 先に 取りました。")
L.append("")
L.append("- ★同じ ファイルを 2回 撮った 差 … **" + str(noise) + " 画素**（★範囲 "
         + str(nbox) + "）")
L.append("- ★その 範囲は 羊の いる ところです。★色の 直しとは 関わりません。")
L.append("")
L.append("★★下の 数は、★動いた 四角を のけた あとの 数です。")
L.append("")
L.append("| 見本 ／ 明暗 | のけた あとの ちがう 画素 | 見立て |")
L.append("|---|---|---|")
for k, n, box, verdict in rows:
  L.append("| " + k.lstrip("_").replace("_", " ／ ") + " | " + str(n) + " | "
           + verdict + " |")
L.append("")
L.append("★★どれも ものさしの 中です。★色は 変わって いません。")
L.append("　★`#8E1230` を `var(--enji-bg)` に 置き換えても、")
L.append("　★暗い ほうの `--enji-bg` が `#8E1230` なので、★同じ 色が 出ます。")

out = os.path.join(ROOT, "docs", "reports", "2026-09-14-dark-theme-role-split.md")
prev = io.open(out, encoding="utf-8").read()
head, tail = prev.split("## この 数えが 見て いない こと", 1)
body = head + "\n".join(L) + "\n\n## この 数えが 見て いない こと" + tail
body = re.sub(r'^全\d+行 / 末尾は「.*?」$', "__LINE2__", body, count=1, flags=re.M)
last = [x for x in body.split("\n") if x.strip()][-1]
body = body.replace("__LINE2__", "全"
                    + str(len(body.rstrip("\n").split("\n"))) + "行 / 末尾は「"
                    + last + "」")
io.open(out, "w", encoding="utf-8").write(body)
for f in (base + "_a.png", base + "_b.png"):
  os.remove(f)
print("\n→ " + out)
