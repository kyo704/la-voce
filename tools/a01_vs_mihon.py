#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★A01「きょう」を、★見本と 突き合わせる（★2026-09-14）。

  ★出どころ 見本 `S_kyou()`（★00-動く見本（さわれる・全画面）.html）

  ★★A03 で 学んだ こと ──
    ★★見本に 無い ものを 見つけたら、★**まず 出どころを 見る**。
      ★① 遅れて いる（★直す）
      ★② わざと 良く した（★残す）
      ★③ 見本が そもそも 描かない もの（★一度きりの 知らせ など）
    ★★画面を 見ただけでは 見分けられません。★`git log -S` で 見ます。
"""

import io
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MI = os.path.join(ROOT, "docs", "design", "pack-final",
                  "00-動く見本（さわれる・全画面）.html")
raw = io.open(MI, encoding="utf-8").read()
i = raw.index("function S_kyou(")
mihon = raw[i:raw.index("\nfunction ", i + 10)]

# ★★どの ファイルに 言葉が あるかは、★決め打ちでは 当たりません。
#   ★★2026-09-14、★4語を「無い」と 出しました。★実は 3語は ありました。
#     ★`lib/todayPlan.js` を 読んで いません でした。
#   ★★だから `components` と `lib` を まるごと 読みます。
app = ""
WHERE = {}
for d in ("components", "lib"):
  base = os.path.join(ROOT, d)
  for root, dirs, fs in os.walk(base):
    dirs[:] = [x for x in dirs if x != "tests"]
    for f in sorted(fs):
      if not f.endswith((".js", ".jsx")):
        continue
      rel = os.path.relpath(os.path.join(root, f), ROOT)
      body = io.open(os.path.join(root, f), encoding="utf-8").read()
      app += "\n" + body
      WHERE[rel] = body

WORDS = [
  "きょうを 記録する",
  "きょうの よてい",
  "この教室の よていは ありません",
  "時間割を 入れる",
  "時間割の あいている ところが、先生に 伝わります（中身は 伝わりません）。",
  "近い 行事",
  "行事の 出欠は 集めません。知らせるだけです。",
  "きょうも 来てくれて ありがとう",
  "きょうの ぶんを 書いてくれて ありがとう",
  "羊は「記録した行為」に 反応します。中身には 反応しません",
  "点数も、きょうの調子の 判定も 出しません。",
  "羊を 押しても 何も 起きません",
  "「連続◯日」を 出しません。",
  "前に あなたが 書いた ことばです",
  "重なり",
]

print("① 見本の 字が あるか")
miss = [w for w in WORDS if w not in app]
print("  " + str(len(WORDS) - len(miss)) + " / " + str(len(WORDS)))
for w in WORDS:
  if w in miss:
    print("    ✗ 「" + w + "」")
  else:
    where = [k for k, v in WHERE.items() if w in v]
    print("    ✓ 「" + w[:26] + "」　" + ", ".join(where[:2]))

print("\n② 見本に 無い ものが 出て いないか")
# ★★見本の 中を 探す 範囲に 気を つけます。
#   ★★`foldNotes` は S_kyou の 中に ありません。★画面を 描いた あと、
#     ★`foldNotes($('#bd'))` で まとめて 掛けます（★:4114）。
#   ★★だから「S_kyou に 無い ＝ 見本に 無い」は 誤りです。
#     ★2026-09-14、★一度 そう 読み違えました。
WHOLE = raw
EXTRA = [
  ("「くわしい 決まりを 見る」（畳み）", r"くわしい 決まりを 見る", WHOLE),
  ("教室で しぼる 札（全部／教室名）", r"S\.of=|orgFilter|教室で しぼる", mihon),
  ("近い 行事 の 節", r"近い 行事", mihon),
]
# ★★A01 の 画面を 作って いる ファイルだけ を、★別に 用意します。
#   ★★「近い 行事」は `components/OpsHome.jsx` に あります。
#     ★★それは **運営の 画面**です。★A01 では ありません。
#     ★★丸ごと 探すと「ある」と 出ます。★画面には 出て いません。
A01_FILES = ["components/HomeV2.jsx", "lib/todayPlan.js", "lib/todayCard.js",
             "components/TodayBand.jsx", "lib/todayBand.js"]
a01 = "\n".join(WHERE.get(f, "") for f in A01_FILES)
for name, pat, scope in EXTRA:
  inm = bool(re.search(pat, scope))
  # ★★A01 の 画面の 中に あるか、で 見ます。★ほかの 画面では ありません。
  ina = bool(re.search(pat, a01))
  elsewhere = [k for k, v in WHERE.items() if re.search(pat, v)
               and k not in A01_FILES]
  print("  " + ("✓" if inm == ina else "★ちがう") + " " + name
        + "　見本 " + ("あり" if inm else "なし")
        + " ／ A01 " + ("あり" if ina else "なし")
        + ("　（ほかの 画面には あり: " + ", ".join(elsewhere[:2]) + "）"
           if elsewhere else ""))

print("\n③ 足りない ものの 出どころ（★git）")
for w in miss:
  r = subprocess.run(["git", "log", "--oneline", "-S", w, "--", "components", "lib"],
                     cwd=ROOT, capture_output=True, text=True)
  n = len([x for x in r.stdout.split("\n") if x.strip()])
  print("  「" + w[:28] + "」… 触れた 便 " + str(n) + " 件"
        + ("（★一度も 書かれて いません）" if n == 0 else ""))

print("\n★★この 数えが 見て いない こと")
print("　★字が あるか だけ です。★色・大きさ・並びは 別に 測ります。")
