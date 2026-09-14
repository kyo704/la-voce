#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★暗い ほうの えんじが、★1つの 名前に まとまるかを 確かめる。

  ★出どころ 2026-09-14、★No.013 STEP_1
    ★「38か所の 役が、★明るい ほうの --enji と 同じかを 確かめよ。
      ★違って いたら 止めて 報告せよ」

  ★★確かめる こと
    ★① 暗い ほうの :root は --enji を 何に して いるか
    ★② #8E1230 の 38か所は、★字の 色か、★地の 色か
    ★③ var(--enji) に 置き換えたら、★同じ 見た目に なるか
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
MIHON = [f for f in sorted(os.listdir(PACK)) if f.startswith("00-動く見本")]


def dark_root(raw):
  """★暗い ほうの :root が 決めて いる 値を 取る。"""
  out = {}
  for m in re.finditer(r'html\[data-th="dark"\]\s*\{([^}]*)\}', raw):
    for k, v in re.findall(r'(--[a-z0-9-]+)\s*:\s*([^;}]+)', m.group(1)):
      out[k] = v.strip()
  return out


rows = []
roots = {}
for name in MIHON:
  raw = io.open(os.path.join(PACK, name), encoding="utf-8").read()
  roots[name] = dark_root(raw)
  for i, line in enumerate(raw.split("\n")):
    if "8e1230" not in line.lower():
      continue
    sel = line.split("{")[0].strip()
    body = line[line.find("{") + 1:] if "{" in line else line
    # ★★どの 役で 使われて いるか。★地・線・字 の 3つに 分けます。
    roles = []
    for prop, val in re.findall(r'([a-z-]+)\s*:\s*([^;}]+)', body):
      if "8e1230" in val.lower():
        roles.append(prop)
    rows.append({"file": name, "line": i + 1, "sel": sel, "roles": roles,
                 "hasWhiteText": "color:#fff" in body.replace(" ", "")})

print("① 暗い ほうの :root が 決めて いる --enji")
vals = set()
for name in MIHON:
  v = roots[name].get("--enji", "（ありません）")
  vals.add(v)
  print("   " + v + "   " + name)
print("   ★4本 とも 同じ: " + ("はい" if len(vals) == 1 else "いいえ"))

print("\n② #8E1230 の 使われ方")
byrole = {}
for r in rows:
  for p in r["roles"]:
    byrole[p] = byrole.get(p, 0) + 1
for p in sorted(byrole, key=lambda k: -byrole[k]):
  print("   " + str(byrole[p]) + "回  " + p)
print("   計 " + str(sum(byrole.values())) + "回 / " + str(len(rows)) + "行")

print("\n③ 置き換えたら どう なるか")
enji_dark = list(vals)[0] if len(vals) == 1 else None
print("   いま 字／地 に 出て いる 値 : #8E1230")
print("   var(--enji) が 暗い ほうで 指す 値 : " + str(enji_dark))


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


white = len([r for r in rows if r["hasWhiteText"]])
if enji_dark and enji_dark.upper() != "#8E1230":
  print("   ★★合いません。★置き換えると 色が 変わります。")
  print("   ★★白い 字を 載せて いる 行: " + str(white) + " / " + str(len(rows)))
  print("   ★白字 / #8E1230 = %.2f" % ratio("#FFFFFF", "#8E1230"))
  print("   ★白字 / #E790A2 = %.2f" % ratio("#FFFFFF", "#E790A2"))

L = []
L.append("# 暗い ほうの えんじ ── 1つの 名前に まとまりません")
L.append("__LINE2__")
L.append("")
L.append("★出どころ 2026-09-14、★No.013 STEP_1（★ON_MISMATCH: STOP_AND_REPORT）")
L.append("")
L.append("## 止めた わけ")
L.append("")
L.append("★★見本の 暗い ほうは、★えんじを **2つ** 使い分けて います。")
L.append("")
L.append("| | 値 | 何に 使うか | 白字との 比 |")
L.append("|---|---|---|---|")
L.append("| `--enji`（暗） | `" + str(enji_dark) + "` | ★**字**・線の 色 | "
         + "%.2f" % ratio("#FFFFFF", enji_dark) + " |")
L.append("| 直に 書いた 値 | `#8E1230` | ★**地**・枠（★白字を 載せる） | "
         + "%.2f" % ratio("#FFFFFF", "#8E1230") + " |")
L.append("")
L.append("★★STEP_2 の とおり 38か所を `var(--enji)` に すると、")
L.append("　★地が `" + str(enji_dark) + "` に なります。")
L.append("　★★その 上の 白い 字は、★比 " + "%.2f" % ratio("#FFFFFF", enji_dark)
         + " に なります。★4.5 を 割ります。")
L.append("　★白い 字を 載せて いる 行が **" + str(white) + "行 / " + str(len(rows))
         + "行** あります。")
L.append("")
L.append("## 数え")
L.append("")
L.append("- `#8E1230` は **38回 / 25行**（★1行に `background` と `border-color` の 2回）")
L.append("- 内訳 … `background` " + str(byrole.get("background", 0)) + "回、"
         + "`border-color` " + str(byrole.get("border-color", 0)) + "回")
L.append("- ★**`color`（字の色）に 使って いる ところは 0回** です")
L.append("- どれも `html[data-th=\"dark\"]` の 中。★明るい ほうには 1件も ありません")
L.append("")
L.append("## お決めを お願いします")
L.append("")
L.append("★★どちらかを お選びください。")
L.append("")
L.append("- ㋐ **名前を 2つに 分ける**（★`--enji` は 字、★地は 別の 名前）")
L.append("  ★ただし 今回の ご指示は `NEW_TOKEN_NAME: FORBIDDEN` です。")
L.append("- ㋑ **明るい／暗いで 値を 変える ところを 増やす**")
L.append("  ★`--enji`（字）と、★`--enji-bg`（地）の 2つを、")
L.append("  ★明るい ほうでは 同じ 値、★暗い ほうでは 別の 値に します。")
L.append("  ★★これも 名前が 増えます。")
L.append("- ㋒ **38か所を そのままに する**")
L.append("  ★見本が 正です。★見本は いま この 形です。")
L.append("")
L.append("## この 数えが 見て いない こと")
L.append("")
L.append("- 字の 並びだけ を 見ます。★実際の 見た目は 見て いません。")
L.append("- 暗い ほうを 使う 人が いるかは、★別の 話です。")

body = "\n".join(L)
last = [x for x in body.split("\n") if x.strip()][-1]
body = body.replace("__LINE2__",
                    "全" + str(len(body.split("\n"))) + "行 / 末尾は「" + last + "」")
out = os.path.join(ROOT, "docs", "reports", "2026-09-14-暗いえんじ.md")
io.open(out, "w", encoding="utf-8").write(body + "\n")
print("\n→ " + out)
