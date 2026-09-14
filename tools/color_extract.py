#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★4本の 動く見本から、★実際に 使われて いる 色を 抜き出す
#   ★出どころ 2026-09-13 の お指図。
#   ★★正は 4本の 動く見本 HTML だけ です。★md でも js でも ありません。
#   使い方  python3 tools/color_extract.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
PACK = os.path.join(ROOT, "docs", "design", "pack-final")

FILES = [
  "00-動く見本（さわれる・全画面）.html",
  "00-動く見本-iPhoneで開く用.html",
  "00-動く見本-PC・iPad（個人）.html",
  "00-動く見本-PC・iPad（運営）.html",
]

DEF = re.compile(r"(--[a-zA-Z0-9_-]+)\s*:\s*(#[0-9A-Fa-f]{3,8}|rgba?\([^)]*\))")
HEX = re.compile(r"#[0-9A-Fa-f]{6}\b")
USE = re.compile(r"var\((--[a-zA-Z0-9_-]+)\)")


def norm(v):
  v = v.strip()
  if v.startswith("#") and len(v) == 4:
    v = "#" + "".join(c * 2 for c in v[1:])
  return v.upper()


def main():
  defs = {}     # file -> {name: value}
  uses = {}     # file -> set(name)
  raw = {}      # file -> [(line, hex, snippet)]
  for fn in FILES:
    p = os.path.join(PACK, fn)
    if not os.path.exists(p):
      print("★ありません: " + fn)
      return 1
    with open(p, encoding="utf-8") as f:
      rows = f.read().split("\n")
    src = "\n".join(rows)
    # ★★2026-09-13、★はじめ 後勝ちで 拾って いて、
    #   ★★**暗い 側（html[data-th="dark"]）の 値だけ**を 出して いました。
    #   ★★見本には 明るい 側（:root）と 暗い 側の 2組が あります。
    #   ★★どの かたまりの ものかを 見分けます。
    defs[fn] = {}
    for m in DEF.finditer(src):
      before = src[:m.start()]
      # ★直前の `{` の 手前に あるのが、★その かたまりの 名前
      br = before.rfind("{")
      head = before[max(0, br - 120):br]
      dark = 'data-th="dark"' in head
      key = ("dark:" if dark else "light:") + m.group(1)
      defs[fn][key] = norm(m.group(2))
    uses[fn] = set(USE.findall(src))
    raw[fn] = []
    # ★★直書き。★定義の 行は 除きます。
    for i, line in enumerate(rows):
      if DEF.search(line):
        continue
      for h in HEX.findall(line):
        raw[fn].append((i + 1, norm(h), line.strip()[:70]))

  lines = []

  def say(t=""):
    lines.append(t)

  say("# ★動く見本 4本の 色")
  say()
  say("★この 紙は tools/color_extract.py が 書き出します。★手で 書いて いません。")
  say()
  say("★★正は 4本の 動く見本 だけ です。★tokens.md でも lib/tokens.js でも ありません。")
  say()

  allnames = sorted({k for d in defs.values() for k in d})
  say("## ① 名前つきの 色　%d 本" % len(allnames))
  say()
  say("| 名前 | " + " | ".join(f.replace("00-動く見本", "").replace(".html", "")
                               for f in FILES) + " | 食い違い |")
  say("|---|" + "|".join(["---"] * (len(FILES) + 1)) + "|")
  clash = []
  for n in allnames:
    vals = [defs[f].get(n, "—") for f in FILES]
    seen = {v for v in vals if v != "—"}
    bad = len(seen) > 1
    if bad:
      clash.append((n, vals))
    say("| `%s` | %s | %s |" % (n, " | ".join("`%s`" % v for v in vals),
                                "★★ちがう" if bad else ""))
  say()

  say("## ★★4本の あいだで 食い違う 色　**%d 本**" % len(clash))
  say()
  if clash:
    for n, vals in clash:
      say("- `%s` … %s" % (n, " ／ ".join(vals)))
    say()
    say("★★ここで 止めます。★どれが 正かは 決めて いません。")
  else:
    say("★1本も ありません。★4本とも 同じ 値です。")
  say()

  say("## ② 直書きの `#XXXXXX`（★§11 の 禁じ手）")
  say()
  total = sum(len(v) for v in raw.values())
  say("★**%d 件**" % total)
  say()
  for fn in FILES:
    if not raw[fn]:
      continue
    say("### %s　%d 件" % (fn, len(raw[fn])))
    say()
    say("| 行 | 色 | その 行 |")
    say("|---|---|---|")
    for ln, h, sn in raw[fn][:40]:
      say("| %d | `%s` | `%s` |" % (ln, h, sn.replace("|", "\\|")))
    if len(raw[fn]) > 40:
      say("")
      say("★ほか %d 件。★全部は docs/reports/_colors_raw.txt に あります。" % (len(raw[fn]) - 40))
    say()

  # ★md の 17色と くらべる
  mdp = os.path.join(PACK, "tokens.md")
  md = set()
  if os.path.exists(mdp):
    with open(mdp, encoding="utf-8") as f:
      md = {norm(x) for x in HEX.findall(f.read())}
  found = {v for d in defs.values() for v in d.values()} \
      | {h for v in raw.values() for (_, h, _) in v}
  say("## ③ tokens.md の 色が 見本に あるか")
  say()
  say("★tokens.md **%d 色** ／ 見本から 抜き出した **%d 色**" % (len(md), len(found)))
  say()
  say("| tokens.md の 色 | 見本に あるか |")
  say("|---|---|")
  for h in sorted(md):
    say("| `%s` | %s |" % (h, "ある" if h in found else "★★見本に ありません"))
  say()
  gone = sorted(md - found)
  say("★★見本に 無い もの **%d 色** … %s" % (len(gone), ", ".join(gone) or "なし"))
  say()
  say("★★「使われて いない」のか「落ちた」のかは、★この 紙では 分かりません。")
  say("　★★色の 名前と 役が 分からない ため です。★お決めが 要ります。")
  say()

  say("## ④ えんじ（--enji）")
  say()
  enji = [n for n in allnames if "enji" in n]
  if enji:
    for n in enji:
      say("- `%s`" % n)
      for f in FILES:
        say("  - %s … `%s`" % (f.replace("00-動く見本", ""), defs[f].get(n, "—")))
  else:
    say("★`--enji` という 名前は、★4本の どこにも ありません。")
    say("★★近い 色（★赤みの 濃い もの）を 挙げます ──")
    for n in allnames:
      vs = [defs[f].get(n) for f in FILES if defs[f].get(n)]
      for v in vs:
        if v.startswith("#") and len(v) == 7:
          r, g, bl = int(v[1:3], 16), int(v[3:5], 16), int(v[5:7], 16)
          if r > 90 and r > g * 1.8 and r > bl * 1.5 and r < 200:
            say("  - `%s` … `%s`" % (n, v))
            break
  say()
  say("## ★この 紙が して いない こと")
  say()
  say("★★どれが 正かを 決めて いません。★並べただけ です。")
  say("★★色の 役（★何に 使うか）は 見て いません。★値だけ です。")

  p = os.path.join(OUT, "2026-09-13-見本の色.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  with open(os.path.join(OUT, "_colors_raw.txt"), "w", encoding="utf-8") as f:
    for fn in FILES:
      for ln, h, sn in raw[fn]:
        f.write("%s:%d\t%s\t%s\n" % (fn, ln, h, sn))
  print("docs/reports/2026-09-13-見本の色.md  全%d行" % len(lines))
  print("名前つき %d 本 ／ 食い違い %d 本 ／ 直書き %d 件"
        % (len(allnames), len(clash), total))
  return 0


if __name__ == "__main__":
  sys.exit(main())
