#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★A03「記録」を、★見本と 突き合わせる（★2026-09-14）。

  ★出どころ 見本 `S_kiroku()`（★00-動く見本（さわれる・全画面）.html:617）

  ★★字が あるかだけ 見ても 足りません（★きょう 3件 それで 見落としました）。
    ★★だから 3つの ものさしで 見ます。
      ★① 見本に ある 字が、★アプリに あるか
      ★② 見本に **無い** ものが、★アプリに 出て いないか
      ★③ 並びが 同じか（★上から 下へ）
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MI = os.path.join(ROOT, "docs", "design", "pack-final",
                  "00-動く見本（さわれる・全画面）.html")
raw = io.open(MI, encoding="utf-8").read()
i = raw.index("function S_kiroku(){")
j = raw.index("function tri(", i)
mihon = raw[i:j]

# ★★アプリ側。★記録の 画面と、★その 言葉を 持つ lib。
files = ["components/RecordV2Head.jsx", "components/VocalTracker.jsx",
         "lib/recordV2.js", "lib/fieldGroups.js"]
app = ""
for f in files:
  p = os.path.join(ROOT, f)
  if os.path.exists(p):
    app += "\n" + io.open(p, encoding="utf-8").read()

# ★① 見本の 字（★1文字も 変えない もの）
WORDS = [
  "あさ", "起きたときの むくみ", "昨夜の 睡眠",
  "よる", "のどの 調子", "声の 出来", "本番以外で 声を使った時間",
  "部屋の しめり は こちらで 取ります。",
  "この2つは 聞きません。",
  "足す（どれも 任意）", "本番・レッスン", "食べたもの", "からだのこと", "ひとこと",
  "きょうは 書かない", "出す",
  "書かなかった行に 赤い印を つけません。必須は 1つも ありません。",
]
# ★三つ選びの 言葉
WORDS += ["ない", "すこし", "ある", "よい", "ふつう", "わるい",
          "出た", "出づらい"]

print("① 見本の 字が あるか")
miss = []
for w in WORDS:
  ok = w in app
  if not ok:
    miss.append(w)
print("  " + str(len(WORDS) - len(miss)) + " / " + str(len(WORDS)))
for w in miss:
  print("    ✗ 「" + w + "」")

# ★② 見本に 無い もの
print("\n② 見本に 無い ものが 出て いないか")
NOT_IN_MIHON = [
  ("日付を 変える 仕掛け", r'type="date"|＜|‹.{0,40}›'),
  ("「呼び方をお仕事に合わせました」", r'呼び方をお仕事に合わせました'),
  ("「くわしい 決まりを 見る」", r'くわしい 決まりを 見る'),
]
for name, pat in NOT_IN_MIHON:
  inm = bool(re.search(pat, mihon))
  ina = bool(re.search(pat, app))
  mark = "✓" if inm == ina else "★ちがう"
  print("  " + mark + " " + name + "　見本 " + ("あり" if inm else "なし")
        + " ／ アプリ " + ("あり" if ina else "なし"))

# ★③ 並び
print("\n③ 並び（★見本の 上から）")
order = ["あさ", "起きたときの むくみ", "昨夜の 睡眠", "よる", "のどの 調子",
         "声の 出来", "本番以外で 声を使った時間", "この2つは 聞きません。",
         "足す（どれも 任意）", "本番・レッスン", "食べたもの", "からだのこと",
         "ひとこと", "きょうは 書かない"]
pos = []
for w in order:
  k = app.find(w)
  pos.append((w, k))
bad = [w for (w, k) in pos if k < 0]
seq = [k for (w, k) in pos if k >= 0]
print("  見つからない: " + (", ".join(bad) if bad else "なし"))
print("  ★並びは 字の 出てくる 順では 決められません（★1つの 大きな 札の 中）。")
print("  ★描いた 絵で 見ます → docs/design/compare/tanaoroshi/A03-記録.png")

print("\n★★この 数えが 見て いない こと")
print("　★見本の 頭（`?` の 丸）と 日付の 出し方は、★②で 見て います。")
print("　★色と 大きさは 見て いません。★描いて 測る 必要が あります。")
