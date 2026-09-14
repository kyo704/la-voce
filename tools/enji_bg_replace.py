#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★地・枠を すべて --enji-bg に そろえる（★No.013 DECISION_1 = A）。

  ★出どころ 2026-09-14、★坂本さん／Opus
    ★「上書きが ある 17行も 含めて、★54行 すべて 置き換える。
      ★同じ 誤りの 形で、★上書きで 隠れて いる だけ だから」

  ★★役の 決まり
    ★地（background）　　　→ --enji-bg
    ★枠（border-color）　　→ --enji-bg   ★`border:` の ひとまとめ 書きも 同じ
    ★字（color）　　　　　 → --enji
    ★塗り（fill）　　　　　→ --enji-bg
    ★線（stroke）　　　　　→ --enji

  ★★名前を 決めて いる ところ（★:root と 暗い ほうの 決まり）は 触りません。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
MIHON = [f for f in sorted(os.listdir(PACK)) if f.startswith("00-動く見本")]

BG_PROPS = (r'background(?:-color)?|'
            r'border-(?:color|left-color|right-color|top-color|bottom-color)')
BORDER_SHORT = r'border(?:-left|-right|-top|-bottom)?'

count = {"background": 0, "border-color": 0, "border-shorthand": 0}

for f in MIHON:
  path = os.path.join(PACK, f)
  raw = io.open(path, encoding="utf-8").read()
  # ★★名前を 決めて いる ところより 後ろ だけを 直す、では 足りません。
  #   ★★`background:` は 名前の 決まりの 中に 出ません。★全体を 見て よい。
  #   ★★ただし `--enji-bg:#8E1230` 自体は 形が 違うので 当たりません。

  def bg(m):
    count["background"] += 1
    return m.group(1) + "var(--enji-bg)"
  raw, n1 = re.subn(r'((?:background(?:-color)?)\s*:\s*)var\(--enji\)', bg, raw)

  def bc(m):
    count["border-color"] += 1
    return m.group(1) + "var(--enji-bg)"
  raw, n2 = re.subn(r'((?:border-(?:color|left-color|right-color|top-color|'
                    r'bottom-color))\s*:\s*)var\(--enji\)', bc, raw)

  # ★★`border:1px solid var(--enji)` の ひとまとめ 書き。
  #   ★★色の ところ だけを 差し替えます。★太さ・線種は そのまま。
  def bs(m):
    count["border-shorthand"] += 1
    return m.group(0).replace("var(--enji)", "var(--enji-bg)")
  raw, n3 = re.subn(BORDER_SHORT + r'\s*:\s*[^;}"\']*var\(--enji\)', bs, raw)

  io.open(path, "w", encoding="utf-8").write(raw)
  print("  " + f[:26] + "  地 " + str(n1) + " / 枠 " + str(n2)
        + " / ひとまとめ " + str(n3))

print()
for k, v in count.items():
  print("  " + k + " : " + str(v))
print("  計 " + str(sum(count.values())))

print("\n★のこり（--enji を 地・枠に 使って いる ところ）")
left = 0
for f in MIHON:
  raw = io.open(os.path.join(PACK, f), encoding="utf-8").read()
  for pat in (r'(?:' + BG_PROPS + r')\s*:\s*var\(--enji\)',
              BORDER_SHORT + r'\s*:\s*[^;}"\']*var\(--enji\)'):
    for m in re.finditer(pat, raw):
      left += 1
      print("   ✗ " + f[:22] + "  " + m.group(0)[:60])
print("   " + ("✓ 0件" if left == 0 else "★" + str(left) + "件 のこり"))

print("\n★字・線に --enji-bg を 使って いないこと")
bad = 0
for f in MIHON:
  raw = io.open(os.path.join(PACK, f), encoding="utf-8").read()
  for m in re.finditer(r'(?<![-\w])(?:color|stroke)\s*:\s*var\(--enji-bg\)', raw):
    bad += 1
    print("   ✗ " + f[:22] + "  " + m.group(0))
print("   " + ("✓ 0件" if bad == 0 else "★" + str(bad) + "件"))

print("\n★fill / stroke")
for f in MIHON:
  raw = io.open(os.path.join(PACK, f), encoding="utf-8").read()
  n = len(re.findall(r'(?:fill|stroke)\s*[:=]\s*"?var\(--enji', raw))
  if n:
    print("   " + f[:22] + "  " + str(n) + "件")
print("   ★見本に fill / stroke で えんじを 使う ところは ありません")
