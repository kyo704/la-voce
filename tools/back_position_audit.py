#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★戻る 道が、★本当に 左上に あるか。★撮った 絵から 測ります。

  ★★出どころ　坂本さん（★2026-09-16・実機の ご指摘）──
    「★戻るボタンが 左上に 無い ページが まだ ある」

  ★★前の 棚おろし（`back_link_audit.py`）は、★**字を 読んで** 数えました。
    ★★「在るか」は 分かりますが、★「★どこに 在るか」は 分かりません。
    ★★実際、★`もっているもの` は `ScreenHead` の **右**に 置いて いました ──
      `<ScreenHead title="…" right={<HeadRound mark="‹" …/>} />`
      ★★在ります。★けれど **右上**です。
  ★★だから こんどは、★撮った 絵の 座標を 測ります。
    ★★「読んで 確かめた」で 何度も 間違えて います。

  ★★見本の `.back` は、★題より **上**に、★左端に 置かれます。
    ★★だから ── ★① x が 左に 寄って いる　★② y が 題より 上
"""

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(ROOT, "docs", "design", "compare", "all", "frames")
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-戻る道の位置.md")

if not os.path.isdir(FRAMES):
  print("★★ありません: " + os.path.relpath(FRAMES, ROOT))
  print("　★測れません。★止まります。")
  sys.exit(1)

BACK = re.compile(r"^\s*[‹<←]|もどる|戻る")
LEFT_MAX = 40      # ★左端から この 内側なら「左」
NAV = {"きょう", "記録", "ふりかえる", "ノート", "ひつじ"}

rows = []
files = sorted(f for f in os.listdir(FRAMES) if f.endswith("@390.json"))
if not files:
  print("★★コマが ありません。★`node tools/compare.js --frames` を 先に。")
  sys.exit(1)

for f in files:
  d = json.load(io.open(os.path.join(FRAMES, f), encoding="utf-8"))
  name = f.replace("@390.json", "")
  # ★★題（いちばん 大きい 字）を 探します。★戻るは その 上に あるはず です。
  titles = [x for x in d if x.get("size") and float(str(x["size"]).replace("px", "")) >= 16]
  title = min(titles, key=lambda x: x["y"]) if titles else None
  cand = [x for x in d
          if BACK.search(x.get("text", "")) and x.get("text", "").strip() not in NAV]
  if not cand:
    rows.append((name, None, None, None, title["y"] if title else None, "★ありません"))
    continue
  b = min(cand, key=lambda x: x["y"])
  ok = []
  if b["x"] > LEFT_MAX:
    ok.append("★左でない（x=%d）" % b["x"])
  if title and b["y"] > title["y"]:
    ok.append("★題より下（y=%d > %d）" % (b["y"], title["y"]))
  rows.append((name, b["text"][:22], b["x"], b["y"],
               title["y"] if title else None, "／".join(ok) if ok else "左上"))

L = []
A = L.append
A("# 戻る道の 位置 ── 撮った 絵から 測りました")
A("")
A("★出どころ　坂本さん（2026-09-16・実機の ご指摘）")
A("")
A("★★前の 棚おろしは **字を 読んで** 数えました。★「在るか」は 分かります。")
A("　★★「★どこに 在るか」は 分かりません でした。")
A("★★こんどは、★撮った 絵の 座標を 測って います。")
A("")
A("| 画面 | 戻るの 字 | x | y | 題の y | どう か |")
A("|---|---|---|---|---|---|")
for n, txt, x, y, ty, st in rows:
  A("| %s | %s | %s | %s | %s | %s |" % (
    n, txt or "──", x if x is not None else "──",
    y if y is not None else "──", ty if ty is not None else "──", st))
A("")
bad = [r for r in rows if r[5] != "左上"]
A("## ★直す ところ（%d）" % len(bad))
A("")
if not bad:
  A("★ありません。")
for n, txt, x, y, ty, st in bad:
  A("・**%s** …… %s" % (n, st))
A("")
A("★★`──` は、★その コマに 戻る 字が 見つからなかった ものです。")
A("　★下の 帯だけ の 画面（きょう・記録 など）は、★もともと 要りません。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
b = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
io.open(OUT, "w", encoding="utf-8").write(
  b[0] + "\n全%d行 / 末尾は「%s」\n" % (len(b) + 1, b[-1]) + "\n".join(b[1:]) + "\n")

print("OUT: " + os.path.relpath(OUT, ROOT))
print("FRAMES: %d" % len(files))
for n, txt, x, y, ty, st in rows:
  if st != "左上":
    print("  %-26s %-14s x=%-5s y=%-5s 題y=%-5s %s" % (n, txt or "──", x, y, ty, st))
