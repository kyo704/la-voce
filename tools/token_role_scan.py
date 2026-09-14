#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★ほかの 色にも、★同じ 分かれ方が 隠れて いないか（★No.013 STEP_8）。

  ★出どころ 2026-09-14

  ★★えんじで 起きた こと
    ★1つの 名前が、★字にも 地にも 使われて いました。
    ★★暗い ほうで、★字は 明るく、★地は 暗く したい。★向きが 逆です。
    ★★だから 1つの 名前では 足りません でした。

  ★★同じ 形が ほかにも あるかを 見ます。
    ★① 字（color）にも 地（background / border-color）にも 使われて いる 名前
    ★② その 名前が、★暗い ほうで 値を 変えて いるか
    ★★両方 当てはまる 名前が、★えんじと 同じ 危なさを 持ちます。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
MIHON = [f for f in sorted(os.listdir(PACK)) if f.startswith("00-動く見本")]

TEXTP = re.compile(r'(?<![-\w])color\s*:\s*var\((--[a-z0-9-]+)\)')
BGP = re.compile(r'(?:background|background-color|border-color|'
                 r'border-(?:left|right|top|bottom)-color)\s*:\s*var\((--[a-z0-9-]+)\)')


def lin(c):
  c = c / 255.0
  return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def lum(h):
  h = h.lstrip("#")
  if len(h) == 3:
    h = "".join(x * 2 for x in h)
  r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def ratio(a, b):
  x, y = lum(a), lum(b)
  x, y = max(x, y), min(x, y)
  return (x + 0.05) / (y + 0.05)


text_use, bg_use = {}, {}
light, dark = {}, {}
for f in MIHON:
  raw = io.open(os.path.join(PACK, f), encoding="utf-8").read()
  for m in re.finditer(r'(?<!\])\:root\s*\{([^}]*)\}', raw):
    for k, v in re.findall(r'(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,6})', m.group(1)):
      light.setdefault(k, v)
  for m in re.finditer(r'html\[data-th="dark"\]\s*\{([^}]*)\}', raw):
    for k, v in re.findall(r'(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,6})', m.group(1)):
      dark[k] = v
  for k in TEXTP.findall(raw):
    text_use[k] = text_use.get(k, 0) + 1
  for k in BGP.findall(raw):
    bg_use[k] = bg_use.get(k, 0) + 1

both = sorted(set(text_use) & set(bg_use))
print("★字にも 地にも 使われて いる 名前: " + str(len(both)))
print()
risky = []
for k in both:
  lv, dv = light.get(k), dark.get(k)
  shifts = bool(lv and dv and lv.upper() != dv.upper())
  mark = ""
  if shifts and dv:
    # ★★暗い ほうで、★白い 字を 載せられる 明るさか。
    white = ratio("#FFFFFF", dv)
    onpaper = ratio(dv, dark.get("--paper", "#1C1712"))
    mark = "  白字%.1f / 紙上%.1f" % (white, onpaper)
    if white < 4.5 or onpaper < 4.5:
      risky.append((k, lv, dv, white, onpaper, text_use[k], bg_use[k]))
  print("  %-12s 字%3d 地%3d  明 %-8s 暗 %-8s %s%s"
        % (k, text_use[k], bg_use[k], lv or "—", dv or "—",
           "★値が 変わる" if shifts else "同じ", mark))

print()
print("★えんじと 同じ 危なさ（★暗い ほうで 片方が 4.5 を 割る）: " + str(len(risky)))
for r in risky:
  print("  " + r[0] + "  暗 " + r[2] + "  白字 %.2f / 紙上 %.2f" % (r[3], r[4]))

L = []
L.append("## ほかの 色にも 同じ 分かれ方が あるか（★STEP_8）")
L.append("")
L.append("★★見た 名前 … 字（`color`）にも 地（`background`／`border-color`）にも")
L.append("　★使われて いる もの **" + str(len(both)) + "件**。")
L.append("")
L.append("| 名前 | 字 | 地 | 明 | 暗 | 暗い ほうで |")
L.append("|---|---|---|---|---|---|")
for k in both:
  lv, dv = light.get(k) or "—", dark.get(k) or "—"
  shifts = lv != "—" and dv != "—" and lv.upper() != dv.upper()
  note = ""
  if shifts and dv != "—":
    note = "白字 %.1f ／ 紙上 %.1f" % (
      ratio("#FFFFFF", dv), ratio(dv, dark.get("--paper", "#1C1712")))
  L.append("| `" + k + "` | " + str(text_use[k]) + " | " + str(bg_use[k]) + " | `"
           + lv + "` | `" + dv + "` | " + (note if shifts else "値は 同じ") + " |")
L.append("")
if risky:
  L.append("★★えんじと 同じ 形（★暗い ほうで どちらかが 4.5 を 割る）: **"
           + str(len(risky)) + "件**")
  for r in risky:
    L.append("- `" + r[0] + "` … 暗 `" + r[2] + "`。★白字 %.2f ／ 紙上 %.2f" % (r[3], r[4]))
else:
  L.append("★★えんじと 同じ 形の ものは、★ほかに ありません でした。")
L.append("")
L.append("★★ただし これは **名前の ある 色** だけの 話です。")
L.append("　★名前の 無い 直書きは、★別の 数え（★999件・126色）に あります。")

out = os.path.join(ROOT, "docs", "reports", "2026-09-14-dark-theme-role-split.md")
prev = io.open(out, encoding="utf-8").read()
# ★★「この 数えが 見て いない こと」の 前に 差し込みます。
head, tail = prev.split("## この 数えが 見て いない こと", 1)
body = head + "\n".join(L) + "\n\n## この 数えが 見て いない こと" + tail
body = re.sub(r'^全\d+行 / 末尾は「.*?」$', "__LINE2__", body, count=1, flags=re.M)
last = [x for x in body.split("\n") if x.strip()][-1]
body = body.replace("__LINE2__",
                    "全" + str(len(body.rstrip("\n").split("\n"))) + "行 / 末尾は「"
                    + last + "」")
io.open(out, "w", encoding="utf-8").write(body)
print("\n→ " + out)
