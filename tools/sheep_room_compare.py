#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""羊の おうち ── 直す 前と 後を、★1枚に 並べる（2026-09-14）。

  ★出どころ 坂本さんの お決め（2026-09-11）──
    「★くらべる 絵が 無ければ、★その 画面の 仕事は 終わって いません」
    「★『合って います』『できました』とは 書かない。★ちがいを 並べる」

  ★左が 前、★右が 後 です。
  ★床の 線と、★窓の 上端に、★横の 目盛りを 引きます。
    ★★目で くらべられる ように する ため です。
"""

import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BEFORE = os.path.join(ROOT, "docs", "design", "compare", "sheep-room-before")
AFTER = os.path.join(ROOT, "docs", "design", "compare", "sheep-room")
OUT = os.path.join(AFTER, "くらべる-ながめる.png")

GAP = 24
PAD = 16
LABEL_H = 0


def load(d, name):
  p = os.path.join(d, name)
  if not os.path.exists(p):
    return None
  return Image.open(p).convert("RGB")


def main():
  a = load(BEFORE, "01-ながめる.png")
  b = load(AFTER, "01-ながめる.png")
  if a is None or b is None:
    print("★絵が そろって いません")
    return 1
  h = max(a.height, b.height)
  w = a.width + GAP + b.width + PAD * 2
  canvas = Image.new("RGB", (w, h + PAD * 2), (250, 248, 243))
  canvas.paste(a, (PAD, PAD))
  canvas.paste(b, (PAD + a.width + GAP, PAD))

  d = ImageDraw.Draw(canvas)
  # ★★真ん中に 仕切りの 線。★どちらが どちらか、★迷わない ため です。
  x = PAD + a.width + GAP // 2
  d.line([(x, 0), (x, h + PAD * 2)], fill=(160, 145, 127), width=2)

  # ★★横の 目盛り。★測った 値から 引きます（★見当では ありません）。
  #   ★倍率 2（deviceScaleFactor）なので、★CSS の px を 2倍 します。
  #   ★床の 線 … 前 462 / 後 492（★stageOffsetY の ぶん 下がる）
  for y_css, color, label in [(462, (200, 60, 60), "前の 床の 線"),
                              (492, (40, 110, 200), "後の 床の 線")]:
    y = y_css * 2 + PAD
    d.line([(0, y), (w, y)], fill=color, width=2)

  canvas.save(OUT)
  print("★書き出しました:", OUT, canvas.size)
  return 0


if __name__ == "__main__":
  sys.exit(main())
