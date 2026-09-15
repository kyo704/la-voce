#!/usr/bin/env python3
# ============================================================================
# ★見本と 実装を、★横に 並べて 1枚に します
#
#   ★出どころ 坂本さんの お決め（★2026-09-11・決まり②）
#     「docs/design/compare/<screen>.png、★見本が 左・実装が 右」
#   ★出どころ [ACTION] 坂本さん（★2026-09-15）
#     「★差分を 画像で 示し、★実装を 見本に 合わせて 修正する」
#
#   ★★きょうまで、★この 1枚が ありませんでした。
#     ★★だから「字が あるか」しか 見られず、
#       ★★レイアウトが 崩れて いることに 気づけません でした。
#
#   ★★使い方
#     python3 tools/compare_pair.py 設定
#
#   ★★出る 先 … docs/design/compare/<名>.png
# ============================================================================

import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIHON = os.path.join(ROOT, "docs", "design", "compare", "mihon")
APP = os.path.join(ROOT, "docs", "design", "compare", "all", "frames")
OUT = os.path.join(ROOT, "docs", "design", "compare")

GAP = 24
PAD = 16
BG = (246, 241, 231)
LINE = (228, 220, 201)


def main():
  if len(sys.argv) < 2:
    print("★どの 画面か、★名前を ください。　例）python3 tools/compare_pair.py 設定")
    return 1
  name = sys.argv[1]
  a = os.path.join(MIHON, name + "@390.png")
  b = os.path.join(APP, "SC-" + name + "@390.png")

  missing = [p for p in (a, b) if not os.path.exists(p)]
  if missing:
    print("★★ありません:")
    for p in missing:
      print("   ", os.path.relpath(p, ROOT))
    print("　★作りません。★止まります。")
    print("　★見本 … node tools/mihon_shot.js " + name)
    print("　★実装 … node tools/compare.js --frames")
    return 1

  ima, imb = Image.open(a).convert("RGB"), Image.open(b).convert("RGB")
  # ★★高さを そろえません。★伸ばすと、★余白の 比べが 壊れます。
  #   ★★上を そろえて、★下は そのまま。★長いほうが そのまま 長い と 分かります。
  h = max(ima.height, imb.height)
  w = PAD + ima.width + GAP + imb.width + PAD
  out = Image.new("RGB", (w, h + PAD * 2 + 40), BG)
  out.paste(ima, (PAD, PAD + 40))
  out.paste(imb, (PAD + ima.width + GAP, PAD + 40))

  d = ImageDraw.Draw(out)
  d.text((PAD, 14), "MIHON (left)   /   APP (right)", fill=(36, 25, 20))
  # ★★真ん中に 線。★どちらが どちらか、★迷わない ように。
  x = PAD + ima.width + GAP // 2
  d.line([(x, PAD + 40), (x, h + PAD + 40)], fill=LINE, width=2)
  # ★★100px ごとの 目盛り。★どこが ずれて いるか 測れる ように。
  for y in range(PAD + 40, h + PAD + 40, 100):
    d.line([(PAD, y), (w - PAD, y)], fill=(228, 220, 201), width=1)
    d.text((2, y - 6), str((y - PAD - 40) // 2), fill=(160, 145, 127))

  os.makedirs(OUT, exist_ok=True)
  dst = os.path.join(OUT, name + ".png")
  out.save(dst)
  print("★作りました: %s" % os.path.relpath(dst, ROOT))
  print("　★左が 見本、★右が 実装。★左の 目盛りは CSS の px です。")
  print("　★高さを そろえて いません ── ★長いほうが、★そのまま 長い です。")
  print("　　見本 %dpx ／ 実装 %dpx（★%.1f 倍）"
        % (ima.height // 2, imb.height // 2, imb.height / ima.height))
  return 0


if __name__ == "__main__":
  sys.exit(main())
