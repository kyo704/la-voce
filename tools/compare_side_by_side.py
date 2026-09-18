#!/usr/bin/env python3
"""★見本と 実装を 並べて、★1枚に します（★2026-09-18）。

  ★★左が 見本、★右が 実装。★同じ 幅に そろえます。
  ★★★背の 高さは そろえません。★引き伸ばすと、★余白の ちがいが 消えます。
    ★★余白こそ、★きょう 見たい ものです。

  ★使い方  python3 tools/compare_side_by_side.py <見本.png> <実装.png> <出す.png>
"""
import sys
from PIL import Image, ImageDraw

def 帯(img, 字):
  h = 56
  out = Image.new("RGB", (img.width, img.height + h), (250, 248, 244))
  out.paste(img, (0, h))
  d = ImageDraw.Draw(out)
  d.rectangle([0, 0, img.width, h], fill=(90, 26, 32))
  d.text((18, 18), 字, fill=(255, 255, 255))
  return out

if __name__ == "__main__":
  左 = Image.open(sys.argv[1]).convert("RGB")
  右 = Image.open(sys.argv[2]).convert("RGB")
  幅 = 1200
  左 = 左.resize((幅, round(左.height * 幅 / 左.width)), Image.LANCZOS)
  右 = 右.resize((幅, round(右.height * 幅 / 右.width)), Image.LANCZOS)
  左 = 帯(左, "MIHON  (mockup)")
  右 = 帯(右, "JIKKI  (implementation / production)")
  溝 = 24
  h = max(左.height, 右.height)
  out = Image.new("RGB", (幅 * 2 + 溝, h), (226, 220, 210))
  out.paste(左, (0, 0))
  out.paste(右, (幅 + 溝, 0))
  out.save(sys.argv[3])
  print("★出しました: " + sys.argv[3] + "  " + str(out.size))
