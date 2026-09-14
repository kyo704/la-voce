#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★「時間割を 入れる」を、★見本と 突き合わせる（★2026-09-14）。

  ★出どころ 2026-09-14、★坂本さんの ご指摘 4点
    ★① 説明は 既定で 閉じる
    ★② 表を 画面いっぱいに
    ★③「自分のコマ」の ぼたんは 要らない
    ★④ 見本と 合って いない 疑い

  ★★見本は SC['時間割']（★00-動く見本（さわれる・全画面）.html）。
  ★★字の 有無を、★1つずつ 機械で 数えます。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MI = os.path.join(ROOT, "docs", "design", "pack-final",
                  "00-動く見本（さわれる・全画面）.html")
raw = io.open(MI, encoding="utf-8").read()
i = raw.index("SC['時間割']=function(){")
j = raw.index("SC['授業を入れる']", i)
mihon = raw[i:j]

ui = io.open(os.path.join(ROOT, "components", "MyTimetable.jsx"),
             encoding="utf-8").read()
lib = io.open(os.path.join(ROOT, "lib", "myTimetable.js"),
              encoding="utf-8").read()
both = ui + lib

# ★★見本に ある もの。★(名前, 見本での 手がかり, アプリでの 手がかり)
ITEMS = [
  ("説明を 閉じられる", r"S\.jkH=0", r"setHelp\(false\)"),
  ("説明の 既定は 開く", r"if\(S\.jkH===undefined\)S\.jkH=1", r"useState\(true\)"),
  ("閉じるのは 丸い ✕", r"border-radius:50%[^']*✕|✕</span>", r"✕"),
  ("表を 横に 送れる", r"overflow-x:auto", r"overflowX"),
  ("あきの マスに「あき」と 書く", r">あき<", r'"あき"|>あき<'),
  ("来られないと 書く", r"来られない", r"来られない"),
  ("先生に 見える あき の 数", r"先生に 見える あき", r"先生に 見える あき"),
  ("押すと 直せます", r"押すと 直せます", r"押すと 直せます"),
  ("色の 凡例", r"あきだが 来られない", r"あきだが 来られない"),
  ("去年と 同じ", r"去年と 同じ", r"去年と 同じ"),
  ("全部 消す", r"全部 消す", r"全部 消す"),
  ("出す ぼたん", r">出す<", r'"出す"|>出す<'),
  ("自分の コマ の ぼたん", r"自分の コマ", r"periodsTitle"),
  ("時間の 割り方は 学校が 決める", r"時間の 割り方（コマ）は 学校が 決めます",
   r"時間の 割り方"),
]

print("★見本 SC['時間割'] と くらべる")
print()
print("  %-30s %-8s %-8s" % ("もの", "見本", "アプリ"))
rows = []
for name, pm, pa in ITEMS:
  inm = bool(re.search(pm, mihon))
  ina = bool(re.search(pa, both))
  rows.append((name, inm, ina))
  print("  %-30s %-8s %-8s %s"
        % (name, "あり" if inm else "なし", "あり" if ina else "なし",
           "" if inm == ina else "★ちがう"))

diff = [r for r in rows if r[1] != r[2]]
print()
print("★食い違い: " + str(len(diff)) + "件")

# ★★見本の note（4行）と、★アプリの note を くらべます。
mn = re.findall(r"'([^']*?)(?:<br>|')", mihon[mihon.index("class=\"note\""):])
print()
print("★見本の note（★下の 断り）")
tail = mihon[mihon.index('class="note"'):]
for line in re.split(r"<br>|\\n", tail):
  t = re.sub(r"<[^>]*>", "", line).replace("'", "").replace("+", "").strip()
  if t and "return h" not in t and len(t) > 4:
    print("  ・" + t[:76])
print()
print("★アプリの note（★TT_COPY.notes）")
for m in re.finditer(r'"([^"]{10,})"', lib[lib.index("notes: Object.freeze"):
                                           lib.index("periodsTitle")]):
  print("  ・" + m.group(1)[:76])

print()
print("★★この 数えが 見て いない こと")
print("　★字の 有無だけ を 見ます。★見た目の 広さ・大きさは 見て いません。")
print("　★見本の note は 4本の 見本の うち 1本だけを 読んで います。")
