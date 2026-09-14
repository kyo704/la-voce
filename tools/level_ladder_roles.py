#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★5段の 目盛りの 4色が、★字か 地か。★正しい ものさしで 測る。

  ★出どころ 2026-09-14、★No.013 ITEM_2（★BLOCKED_UNTIL この 報告）

  ★★坂本さんの ご指摘 ──
    ★「字の 役の 色は、★暗い 紙と くらべる。★白と くらべるのでは ない」
    ★「地の 役の 色は、★その 上に のる 字と くらべる」

  ★★だから まず 役を 調べ、★そのあと 測ります。
  ★★役が 2つに 分かれて いたら、★そこで 止めます（★ON_ROLE_SPLIT_FOUND）。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NOW = ["#E4D1CF", "#CCA9AA", "#B58185", "#9A545C"]
NEW = ["#E6CCCD", "#D0A1A7", "#BB7782", "#A24657"]
TEXT_ON = ["#241914", "#241914", "#241914", "#FFFDF8"]   # ★LEVEL_TEXT_COLORS
ENJI = "#840C24"


def lin(c):
  c = c / 255.0
  return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def lum(h):
  h = h.lstrip("#")
  r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def ratio(a, b):
  x, y = lum(a), lum(b)
  x, y = max(x, y), min(x, y)
  return (x + 0.05) / (y + 0.05)


# ★★どこで 使われて いるかを、★実際に 読みます。
uses = []
for rel in ("components/VocalTracker.jsx", "components/LookBackV2.jsx",
            "components/LookBackPanel.jsx", "lib/tokens.js"):
  src = io.open(os.path.join(ROOT, rel), encoding="utf-8").read()
  for i, line in enumerate(src.split("\n")):
    if "LEVEL_COLORS" not in line and "CONCERN_STEPS" not in line:
      continue
    if line.strip().startswith("//") or line.strip().startswith("*"):
      continue
    prop = None
    m = re.search(r'(background|color|border[a-zA-Z-]*|fill|stroke)\s*:', line)
    if m:
      prop = m.group(1)
    uses.append({"file": rel, "line": i + 1, "prop": prop,
                 "text": line.strip()[:88]})

print("★使われて いる ところ")
for u in uses:
  print("  " + u["file"] + ":" + str(u["line"]) + "  役=" + str(u["prop"]))
  print("      " + u["text"])

props = set(u["prop"] for u in uses if u["prop"])
print("\n★役: " + str(sorted(props)))
split = ("color" in props and "background" in props)
print("★役が 2つに 分かれて いるか: " + ("はい" if split else "いいえ"))

print("\n★正しい ものさしで 測る（★地の 役 → 上に のる 字と くらべる）")
print("  段  いまの 値   上の 字     比      直したとき   比")
for i in range(4):
  print("  %d   %s  %s  %5.2f   %s  %5.2f"
        % (i + 1, NOW[i], TEXT_ON[i], ratio(NOW[i], TEXT_ON[i]),
           NEW[i], ratio(NEW[i], TEXT_ON[i])))
print("  5   %s  %s  %5.2f   （変わりません）"
      % (ENJI, "#FFFDF8", ratio(ENJI, "#FFFDF8")))

L = []
L.append("# 5段の 目盛り ── 役と、★正しい ものさし")
L.append("__LINE2__")
L.append("")
L.append("★出どころ 2026-09-14、★No.013 ITEM_2")
L.append("")
L.append("## ① 役")
L.append("")
L.append("| 置き場所 | 役 |")
L.append("|---|---|")
for u in uses:
  L.append("| `" + u["file"] + ":" + str(u["line"]) + "` | "
           + (u["prop"] or "（受け渡しだけ）") + " |")
L.append("")
if split:
  L.append("★★役が 2つに 分かれて います。★ここで 止めます。")
else:
  L.append("★★役は **地（`background`）だけ** です。★字には 使って いません。")
  L.append("　★字の 色は 別に 持って います（`LEVEL_TEXT_COLORS`）。")
L.append("")
L.append("## ② 正しい ものさしで 測る")
L.append("")
L.append("★★地の 役 なので、★**その 上に のる 字**と くらべます。")
L.append("　★白と くらべるのは 誤りです。★4段目までは 墨の 字が のります。")
L.append("")
L.append("| 段 | いまの 値 | 上の 字 | 比 | 引き直すと | 比 |")
L.append("|---|---|---|---|---|---|")
for i in range(4):
  L.append("| " + str(i + 1) + " | `" + NOW[i] + "` | `" + TEXT_ON[i] + "` | "
           + "%.2f" % ratio(NOW[i], TEXT_ON[i]) + " | `" + NEW[i] + "` | "
           + "%.2f" % ratio(NEW[i], TEXT_ON[i]) + " |")
L.append("| 5 | `" + ENJI + "` | `#FFFDF8` | " + "%.2f" % ratio(ENJI, "#FFFDF8")
         + " | 変わりません | — |")
L.append("")
lo_now = min(ratio(NOW[i], TEXT_ON[i]) for i in range(4))
lo_new = min(ratio(NEW[i], TEXT_ON[i]) for i in range(4))
L.append("- いちばん 低い ところ … いま **" + "%.2f" % lo_now + "** ／ 引き直すと **"
         + "%.2f" % lo_new + "**")
L.append("- どちらも 4.5 を "
         + ("越えて います" if min(lo_now, lo_new) >= 4.5 else "★割ります"))
L.append("")
L.append("## ③ 見つけた こと（★この 調べの ついで）")
L.append("")
L.append("- `components/LookBackPanel.jsx:4` が `LEVEL_COLORS` を 取り寄せて いますが、")
L.append("  ★その 中で 一度も 使って いません。★N-1 の 決まりに 当たります。")
L.append("")
L.append("## この 数えが 見て いない こと")
L.append("")
L.append("- 字の 並びだけ を 見ます。★実際の 画面は 見て いません。")
L.append("- `CONCERN_STEPS` の 升目には 字が のりません（★高さ 16 の 帯）。")
L.append("  ★だから 比は 効きません。★隣の 段と 見分けられるかが 問いです。")

body = "\n".join(L)
last = [x for x in body.split("\n") if x.strip()][-1]
body = body.replace("__LINE2__", "全" + str(len(body.split("\n"))) + "行 / 末尾は「"
                    + last + "」")
out = os.path.join(ROOT, "docs", "reports", "2026-09-14-5段の目盛りの役.md")
io.open(out, "w", encoding="utf-8").write(body + "\n")
print("\n→ " + out)
