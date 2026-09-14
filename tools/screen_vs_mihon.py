#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★1つの 画面を、★見本と 突き合わせる（★どの 画面でも 使えます）。

  ★出どころ 2026-09-14。★A03・A01 で 同じ 道具を 3回ずつ 直しました。
    ★★毎回 同じ ところで つまずきました ──
      ★① 読む ファイルを 決め打ちし、★言葉の ある lib を 読み落とす
      ★② 見本を 関数の 中だけ 探し、★外に ある 仕掛け（foldNotes）を 落とす
      ★③ アプリ側を 丸ごと 探し、★**別の 画面**の 字を「ある」と 数える
    ★★だから、★1本に まとめます。★次の 画面から 直さずに 済みます。

  ★★使い方
      python3 tools/screen_vs_mihon.py <画面の 名前>

  ★★数え方は 3つ。
    ★① 見本の 字が、★**その 画面の ファイル**に あるか
    ★② 見本に 無い ものが、★その 画面に 出て いないか
    ★③ 足りない ものの 出どころ（★git）── ★遅れか、★わざとか
"""

import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MI = os.path.join(ROOT, "docs", "design", "pack-final",
                  "00-動く見本（さわれる・全画面）.html")
RAW = io.open(MI, encoding="utf-8").read()

# ★★画面ごとの 決め（★1か所）。
#   ★fn    … 見本の 関数の 名前
#   ★files … **その 画面を 作って いる** ファイル。★ほかは 入れません
#   ★words … 見本の 字（★1文字も 変えない もの）
#   ★extra … 見本に 無い ものの 手がかり
SCREENS = {
  "A04": {
    "fn": "narabe",
    "files": ["components/LineUpV2.jsx", "components/LookBackV2.jsx",
              "lib/lineUp.js", "components/LineUpChart.jsx"],
    "words": [],
    "extra": [],
  },
  "A05": {
    "fn": "sakanobo",
    "files": ["components/LookBackV2.jsx", "lib/lookBack.js"],
    "words": [],
    "extra": [],
  },
}


def mihon_of(fn):
  i = RAW.index("function " + fn + "(")
  return RAW[i:RAW.index("\nfunction ", i + 10)]


def read_all():
  """★components と lib を まるごと。★どこに 言葉が あるか 分からない ためです。"""
  out = {}
  for d in ("components", "lib"):
    base = os.path.join(ROOT, d)
    for root, dirs, fs in os.walk(base):
      dirs[:] = [x for x in dirs if x != "tests"]
      for f in sorted(fs):
        if f.endswith((".js", ".jsx")):
          rel = os.path.relpath(os.path.join(root, f), ROOT)
          out[rel] = io.open(os.path.join(root, f), encoding="utf-8").read()
  return out


def jp_strings(seg):
  """★見本の 中の、★人に 見える 日本語を 抜き出す。

    ★★手で 選ぶと、★自分の 造語を 混ぜます（★B02 で やりました）。
      ★だから 機械で 抜きます。
  """
  out = []
  for m in re.finditer(r"'([^']{4,60})'", seg):
    t = m.group(1)
    if not re.search(r'[ぁ-んァ-ヶ一-龥]', t):
      continue
    if re.search(r'[<>{}\\]|onclick|function|class=|style=', t):
      continue
    out.append(t)
  # ★★タグの 間の 字も 拾います。
  for m in re.finditer(r'>([^<>\'"]{3,60})<', seg):
    t = m.group(1).strip()
    if t and re.search(r'[ぁ-んァ-ヶ一-龥]', t) and "+" not in t:
      out.append(t)
  seen = []
  for t in out:
    if t not in seen:
      seen.append(t)
  return seen


def main():
  key = sys.argv[1] if len(sys.argv) > 1 else ""
  if key not in SCREENS:
    print("★画面の 名前: " + ", ".join(sorted(SCREENS)))
    sys.exit(1)
  spec = SCREENS[key]
  seg = mihon_of(spec["fn"])
  ALL = read_all()
  mine = "\n".join(ALL.get(f, "") for f in spec["files"])
  missing_files = [f for f in spec["files"] if f not in ALL]

  words = spec["words"] or jp_strings(seg)
  print("★" + key + "　見本 `" + spec["fn"] + "()`")
  if missing_files:
    print("　★★見あたらない ファイル: " + ", ".join(missing_files))
  print("　★見る ファイル: " + ", ".join(spec["files"]))
  print()
  print("① 見本の 字（★機械で 抜きました・" + str(len(words)) + "語）")
  miss = []
  for w in words:
    if w in mine:
      print("  ✓ " + w[:46])
    else:
      elsewhere = [k for k, v in ALL.items() if w in v]
      miss.append((w, elsewhere))
      print("  ✗ " + w[:46]
            + ("　（ほかの 画面には: " + elsewhere[0] + "）" if elsewhere else ""))
  print()
  print("  ★足りない: " + str(len(miss)) + " / " + str(len(words)))

  print("\n② 足りない ものの 出どころ（★git）")
  for w, _ in miss:
    r = subprocess.run(["git", "log", "--oneline", "-S", w, "--",
                        "components", "lib"], cwd=ROOT,
                       capture_output=True, text=True)
    n = len([x for x in r.stdout.split("\n") if x.strip()])
    print("  「" + w[:34] + "」… " + ("★一度も 書かれて いません"
                                     if n == 0 else str(n) + " 便が 触れて います"))

  print("\n★★この 数えが 見て いない こと")
  print("　★字が あるか だけ です。★色・大きさ・並びは 描いて 測ります。")
  print("　★見本の 字は 機械で 抜きます。★組み立てて 作る 字は 落とします。")


main()
