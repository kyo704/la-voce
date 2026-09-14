#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★entries の 列ぜんぶで、★名前と 中身が ずれて いないかを 見る。

  ★出どころ 2026-09-14、★C1（★Opus）

  ★★なぜ 要るか。★分析の 拡張(2)では、★使う 人が **名前で** 項目を 選びます。
    ★★「のどの 様子」を 選んだ 人に「からだの 感じ」が 返ったら、
      ★その 人は 気づけません。

  ★★見分け方。★`entryToRow`（★書く ところ）で、
    ★列に 入れて いる 値の **もとの 名前** を 読みます。
      `voice_quality: ... quality10ToFiveScale(rep.quality)`
      ★列は voice_quality、★もとは quality → ★名前が ちがいます。

  ★★字だけ 見ても、★「合って いる」とは 言えません。
    ★★だから 3つに 分けます ── ★同じ ／ ちがう ／ 読めない。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
vt = io.open(os.path.join(ROOT, "components", "VocalTracker.jsx"),
             encoding="utf-8").read()

i = vt.index("function entryToRow(")
j = vt.index("\n}", vt.index("return {", i))
block = vt[i:j]

rows = []
for m in re.finditer(r'^\s{4}([a-z_0-9]+):\s*(.+?),?\s*$', block, re.M):
  col, expr = m.group(1), m.group(2).rstrip(",")
  if col in ("user_id", "date"):
    continue
  rows.append((col, expr))

# ★★もとの 名前を 拾います。★`e.○○` `rep.○○` `voiceLegacy.○○` など。
SRC = re.compile(r'\b(?:e|rep|voiceLegacy|legacy|primary)\.([A-Za-z0-9_]+)')


def camel(s):
  out = ""
  up = False
  for ch in s:
    if ch == "_":
      up = True
      continue
    out += ch.upper() if up else ch
    up = False
  return out


# ★★もう 1つ 下の 層も 読みます。
#   ★★`throat_condition: voiceLegacy.throatCondition` は、★ここでは 合って 見えます。
#     ★★ずれて いるのは その **中**です ──
#       `throatCondition: intOrNull(rep.bodyFeel)`
#     ★★だから、★導き出す 関数の 中も 読みます。
#   ★★2026-09-14、★はじめ ここを 読まず、★3件を 1件も 見つけられません でした。
DERIVE = {}
for fn in ("deriveLegacyVoiceFieldsFromEntries", "derivePrimaryActivityLegacy"):
  k = vt.find("function " + fn + "(")
  if k < 0:
    continue
  seg = vt[k:vt.index("\n}", vt.index("return {", k))]
  for m in re.finditer(r'^\s{4}([A-Za-z0-9_]+):\s*(.+?),?\s*$', seg, re.M):
    DERIVE[m.group(1)] = m.group(2).rstrip(",")

# ★★概念の 名前（★ずれを 見分ける ため）。★入れ物の 名前では ありません。
CONCEPT = re.compile(r'\b(?:rep|wakeEntry|lastEntry|routineEntry|e)\.'
                     r'([A-Za-z0-9_]+)')

same, diff, unknown, deep = [], [], [], []
for col, expr in rows:
  names = SRC.findall(expr)
  if not names:
    unknown.append((col, expr[:70]))
    continue
  want = camel(col)
  if want in names:
    # ★★合って 見えます。★けれど 1つ 下も 見ます。
    inner = DERIVE.get(want)
    if inner:
      src = CONCEPT.findall(inner)
      # ★★導き出す 中で、★別の 名前から 作って いないか。
      if src and want not in src and camel(col) not in src:
        deep.append((col, want, inner.strip()[:76], src[:3]))
        continue
    same.append((col, want))
  else:
    diff.append((col, want, names[:3], expr[:70]))

print("★entryToRow が 書く 列: " + str(len(rows)))
print("  名前と もとが 同じ　: " + str(len(same)))
print("  ★ちがう　　　　　　 : " + str(len(diff)))
print("  ★★名前は 合うが、★中で 別の ものから 作って いる: " + str(len(deep)))
print("  読めない（式が 複雑）: " + str(len(unknown)))
print()
print("★★★名前と 中身が ずれて いる 列（★これが 探して いた もの）")
for col, want, inner, src in deep:
  print("  ✗✗ " + col + "　もとは 「" + ", ".join(src) + "」")
  print("       " + inner)
print()
print("★★名前と もとの 形が ちがう 列（★多くは 足し算です。★ずれでは ありません）")
for col, want, got, expr in diff:
  print("  ✗ " + col + "　（名前なら " + want + "／もとは " + ", ".join(got) + "）")
  print("      " + expr)
print()
print("★★読めなかった 列（★式が 複雑。★手で 見る 要あり）")
for col, expr in unknown:
  print("  ? " + col + "　" + expr)
