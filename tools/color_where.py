#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★ある 色が、★見本の どこで 使われて いるかを 数える。

  ★出どころ 2026-09-14、★坂本さん ──「#8E1230 の38件の一覧。どの画面のどの部分か」

  ★★見本の HTML は、★まず 決まり（<style>）が 並び、★そのあと 画面が 並びます。
    ★★だから「どの画面か」は、★2通りの 答えに なります。
      ★① 決まりの 中 … 画面では なく、★部品の 名前（.btn など）で 答える
      ★② 画面の 中   … その 画面の 名前で 答える
    ★★どちらかを、★行ごとに 見分けて 書き出します。

  ★★暗い ほうの 決まり（html[data-th="dark"]）は、★別に 数えます。
    ★★これが 分かれて いないと、
      ★「38か所も 直すのか」と 読めて しまいます。
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")

MIHON = [
  "00-動く見本（さわれる・全画面）.html",
  "00-動く見本-iPhoneで開く用.html",
  "00-動く見本-PC・iPad（個人）.html",
  "00-動く見本-PC・iPad（運営）.html",
]

# ★★画面の 名前が 出る ところ。★見本は この 形で 画面を 書いて います。
SCREEN = re.compile(r"""(?:SC|SH|SCREENS?|VIEWS?)\s*\[\s*['"]([^'"]+)['"]\s*\]""")


def scan(path, needle):
  """1本の 見本を 読み、★色の 出どころを 1行ずつ 返す。"""
  raw = io.open(path, encoding="utf-8").read()
  lines = raw.split("\n")
  # ★★<style> の 範囲を 先に 取ります。★決まりか 画面かの 見分けに 使います。
  style = []
  for m in re.finditer(r"<style[^>]*>", raw, re.I):
    e = raw.find("</style>", m.end())
    if e < 0:
      e = len(raw)
    style.append((raw[:m.start()].count("\n"), raw[:e].count("\n")))

  def in_style(i):
    return any(a <= i <= b for a, b in style)

  out = []
  screen = None
  low = needle.lower()
  for i, line in enumerate(lines):
    hit = SCREEN.search(line)
    if hit:
      screen = hit.group(1)
    if low not in line.lower():
      continue
    dark = 'data-th="dark"' in line or "data-th='dark'" in line
    if in_style(i):
      # ★★決まりの 中。★どの 部品かを、★選び方（セレクタ）から 取ります。
      sel = line.split("{")[0].strip()
      where = sel if sel else line.strip()[:60]
      kind = "決まり"
    else:
      where = screen or "（画面の 外）"
      kind = "画面"
    out.append({
      "file": os.path.basename(path),
      "line": i + 1,
      "kind": kind,
      "dark": dark,
      "where": where,
      # ★★1行に 2回 出る ことが あります（★background と border-color）。
      #   ★★数え方を 分けないと、★「38か所 直す」と 読めて しまいます。
      "times": line.lower().count(low),
      "text": line.strip()[:110],
    })
  return out


def main():
  needle = sys.argv[1] if len(sys.argv) > 1 else "#8E1230"
  rows = []
  for name in MIHON:
    p = os.path.join(PACK, name)
    if not os.path.exists(p):
      print("★ありません: " + name)
      continue
    rows += scan(p, needle)

  dark = [r for r in rows if r["dark"]]
  light = [r for r in rows if not r["dark"]]

  L = []
  L.append("# " + needle + " ── 見本の どこで 使われて いるか")
  L.append("__LINE2__")
  L.append("")
  L.append("★出どころ 2026-09-14、★坂本さん「#8E1230 の38件の一覧。どの画面のどの部分か」")
  L.append("")
  L.append("## 答え")
  L.append("")
  times = sum(r["times"] for r in rows)
  L.append("- 字としては **" + str(times) + "回**。★ただし **" + str(len(rows))
           + "行** です")
  L.append("  （★1行に `background` と `border-color` の 2回 出る 行が あります）")
  L.append("- そのうち **" + str(len(dark)) + "件が「暗い ほうの 決まり」**"
           "（`html[data-th=\"dark\"]`）")
  L.append("- 明るい ほうは **" + str(len(light)) + "件**")
  L.append("")
  if not light:
    L.append("★★画面の 中には **1件も ありません**。")
    L.append("　★どれも `<style>` の 中の、★暗い ほうの 決まりです。")
    L.append("　★★つまり「どの画面のどの部分か」の 答えは、")
    L.append("　　★**画面では なく 部品**で、★**暗い ほうの ときだけ** です。")
    L.append("")

  # ★★部品ごとに まとめます。★同じ 部品が 4本に 出ます。
  byname = {}
  for r in rows:
    key = r["where"]
    byname.setdefault(key, []).append(r)

  L.append("## 部品ごと（★同じ 部品が 見本 4本に 出ます）")
  L.append("")
  L.append("| 部品（選び方） | 行 | 回 | 見本 | 何の 色か |")
  L.append("|---|---|---|---|---|")
  MEAN = {
    ".btn": "押しぼたんの 地",
    ".pill.on": "入って いる 札の 地",
    ".mini .mg b.t": "小さい 暦の 「きょう」",
    ".seg .on": "選ばれて いる 区切り",
    ".sw.on": "入って いる つまみ",
    ".tri div.on": "3つから 選ぶ ときの 選ばれた ほう",
  }
  for key in sorted(byname, key=lambda k: -len(byname[k])):
    rs = byname[key]
    short = key.replace('html[data-th="dark"] ', "").split(",")[0].strip()
    files = len(set(r["file"] for r in rs))
    mean = MEAN.get(short, "")
    L.append("| `" + short + "` | " + str(len(rs)) + " | "
             + str(sum(r["times"] for r in rs)) + " | " + str(files) + "本 | "
             + mean + " |")
  L.append("")

  L.append("## 全件（★" + str(len(rows)) + "行）")
  L.append("")
  L.append("| # | 見本 | 行 | 暗い | 部品／画面 |")
  L.append("|---|---|---|---|---|")
  for i, r in enumerate(rows, 1):
    f = r["file"].replace("00-動く見本", "").replace(".html", "").strip("-（）")
    L.append("| " + str(i) + " | " + (f or "全画面") + " | " + str(r["line"]) + " | "
             + ("★" if r["dark"] else "") + " | `"
             + r["where"].replace('html[data-th="dark"] ', "") + "` |")
  L.append("")
  L.append("## この 数えが 見て いない こと")
  L.append("")
  L.append("- 字の 並びだけ を 見ます。★実際に その 色が 出るかは 見て いません。")
  L.append("- 暗い ほうを 使って いる 人が いるかは、★別の 話です。")

  body = "\n".join(L)
  last = [x for x in body.split("\n") if x.strip()][-1]
  body = body.replace("__LINE2__",
                      "全" + str(len(body.split("\n"))) + "行 / 末尾は「" + last + "」")
  # ★★入れ替えで 行数は 変わりません（★1行を 1行に 置き換え）。
  out = os.path.join(ROOT, "docs", "reports", "2026-09-14-8E1230の38件.md")
  io.open(out, "w", encoding="utf-8").write(body + "\n")
  print(needle + " = " + str(times) + "回 / " + str(len(rows)) + "行（暗い "
        + str(len(dark)) + " / 明るい " + str(len(light)) + "）")
  for key in sorted(byname, key=lambda k: -len(byname[k])):
    print("  " + str(len(byname[key])) + "  "
          + key.replace('html[data-th="dark"] ', ""))
  print("→ " + out)


main()
