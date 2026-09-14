#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★えんじを、★役で 2つに 分ける（★No.013 enji_role_split）。

  ★出どころ 2026-09-14、★坂本さん／Opus

  ★★決めた こと
    ★--enji     … 字・線     明 #840C24 ／ 暗 #E790A2
    ★--enji-bg  … 地・枠     明 #840C24 ／ 暗 #8E1230

  ★★分けた わけ
    ★★暗い ほうでは、★同じ「えんじ」でも 行き先が 逆です。
      ★字は 暗い 地の 上に 載るので、★明るく しないと 読めません。
      ★地は 白い 字を 載せるので、★暗く しないと 読めません。
    ★★1つの 名前では、★どちらかが 必ず 読めなく なります。

  ★★この 道具の 順番
    ①  暗い ほうの 紙の 値を 取り、★--enji（字）の 比を 測る
    ②  --enji-bg（地）と 白字の 比を 測る
    ③  38か所を var(--enji-bg) に 置き換える
    ④  役が 混ざって いないかを 確かめる
    ⑤  明るい ほうで 2つが 同じ 値かを 確かめる
    ⑧  ほかの 色にも 同じ 分かれ方が 隠れて いないかを 見る
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
MIHON = [f for f in sorted(os.listdir(PACK)) if f.startswith("00-動く見本")]

ENJI_LIGHT = "#840C24"
ENJI_DARK = "#E790A2"
BG_LIGHT = "#840C24"
BG_DARK = "#8E1230"


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


def dark_vars(raw):
  out = {}
  for m in re.finditer(r'html\[data-th="dark"\]\s*\{([^}]*)\}', raw):
    for k, v in re.findall(r'(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,6})', m.group(1)):
      out[k] = v
  return out


def light_vars(raw):
  out = {}
  for m in re.finditer(r'(?<!\])\:root\s*\{([^}]*)\}', raw):
    for k, v in re.findall(r'(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,6})', m.group(1)):
      out.setdefault(k, v)
  return out


RAW = {f: io.open(os.path.join(PACK, f), encoding="utf-8").read() for f in MIHON}

fail = []
print("① --enji（字）を、★暗い ほうの 紙の 上で 測る")
for f in MIHON:
  d = dark_vars(RAW[f])
  paper = d.get("--paper")
  card = d.get("--card")
  bg = d.get("--bg")
  rs = []
  for name, v in (("paper", paper), ("card", card), ("bg", bg)):
    if v:
      rs.append(name + " " + v + " %.2f" % ratio(ENJI_DARK, v))
  print("   " + f[:26] + "  " + " / ".join(rs))
  worst = min([ratio(ENJI_DARK, v) for v in (paper, card, bg) if v] or [0])
  if worst < 4.5:
    fail.append((f, worst))
if fail:
  print("   ★★4.5 を 割ります。★いちばん 低いのは %.2f" % min(x[1] for x in fail))
else:
  print("   ★4.5 を 越えて います")

print("\n② --enji-bg（地）を、★白い 字の 下で 測る")
print("   白字 / " + BG_DARK + " = %.2f" % ratio("#FFFFFF", BG_DARK) + "  （★見込み 9.21）")
print("   白字 / " + BG_LIGHT + " = %.2f" % ratio("#FFFFFF", BG_LIGHT))

if fail and "--force" not in sys.argv:
  print("\n★★STOP_AND_REPORT。★①が 通って いません。★③には 進みません。")
  print("　★進めるなら --force を 付けて ください。")
  sys.exit(2)

print("\n③ 38か所を var(--enji-bg) に 置き換える")
changed = []
for f in MIHON:
  raw = RAW[f]
  # ★★まず 名前を 足します。★明るい ほうと 暗い ほうの 両方。
  if "--enji-bg" not in raw:
    m = re.search(r'(\:root\s*\{[^}]*?--enji\s*:\s*#[0-9A-Fa-f]{6})', raw)
    if not m:
      print("   ★明るい ほうの :root が 見つかりません: " + f)
      sys.exit(3)
    raw = raw[:m.end()] + ";--enji-bg:" + BG_LIGHT + raw[m.end():]
    m2 = re.search(r'(html\[data-th="dark"\]\s*\{[^}]*?--enji\s*:\s*#[0-9A-Fa-f]{6})', raw)
    if not m2:
      print("   ★暗い ほうの 決まりが 見つかりません: " + f)
      sys.exit(3)
    raw = raw[:m2.end()] + ";--enji-bg:" + BG_DARK + raw[m2.end():]

  # ★★名前を 決めて いる ところは、★置き換えません。
  #   ★★ここを 置き換えると、★自分自身を 指して しまいます。
  dm = re.search(r'html\[data-th="dark"\]\s*\{[^}]*\}', raw)
  head, body = raw[:dm.end()], raw[dm.end():]

  n_before = len(re.findall(BG_DARK, body, re.I))
  lines_before = len([x for x in body.split("\n") if BG_DARK.lower() in x.lower()])

  # ★★地と 枠だけ。★字（color:）には 触りません。
  def swap(m):
    return m.group(1) + "var(--enji-bg)"
  body = re.sub(r'((?:background|background-color|border-color|border-left-color|'
                r'border-top-color|border-right-color|border-bottom-color)\s*:\s*)'
                + BG_DARK, swap, body, flags=re.I)

  left = len(re.findall(BG_DARK, body, re.I))
  io.open(os.path.join(PACK, f), "w", encoding="utf-8").write(head + body)
  RAW[f] = head + body
  changed.append((f, n_before, lines_before, n_before - left, left))
  print("   " + f[:26] + "  " + str(n_before) + "回/" + str(lines_before)
        + "行 → 置き換え " + str(n_before - left) + "、残り " + str(left))

tot = sum(c[3] for c in changed)
lines = sum(c[2] for c in changed)
print("   計 " + str(tot) + "回 / " + str(lines) + "行  （★見込み 38回 / 25行）")

print("\n④ 役が 混ざって いないこと")
ng = 0
for f in MIHON:
  raw = RAW[f]
  # ★字の 色に --enji-bg を 使って いないか
  a = re.findall(r'(?<!-)color\s*:\s*var\(--enji-bg\)', raw)
  # ★地に --enji を 使って いないか（★border-color は 枠なので 地の 側）
  b = re.findall(r'background(?:-color)?\s*:\s*var\(--enji\)', raw)
  if a or b:
    ng += 1
    print("   ✗ " + f + "  字に bg=" + str(len(a)) + " / 地に enji=" + str(len(b)))
if ng == 0:
  print("   ✓ 混ざって いません")

print("\n⑤ 明るい ほうでは 同じ 値")
for f in MIHON:
  lv = light_vars(RAW[f])
  same = lv.get("--enji") == lv.get("--enji-bg") == ENJI_LIGHT
  print("   " + ("✓" if same else "✗") + " " + f[:26] + "  --enji "
        + str(lv.get("--enji")) + " / --enji-bg " + str(lv.get("--enji-bg")))
