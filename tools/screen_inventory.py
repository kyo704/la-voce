#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★A群・B群・J群の 21画面が、★どこまで できて いるかを 数える。

  ★出どころ 2026-09-14（★前から お求めの あった 棚おろし）

  ★★数え方。★「あるか」を、★2つの ものさしで 見ます。
    ★① **入れ物**が あるか … その 画面を 描く 札（コンポーネント）が あるか
    ★② **見本の 字**が 出て いるか … 見本の 見出しが、★コードに あるか

  ★★②が 大事です。★入れ物が あっても、★中身が 見本と ちがう ことが あります。
    ★★きょう、★かぞえるが そうでした（★.kv と .li の ちがい）。

  ★★門（★38人に 出すか）も 並べます。
    ★★門の 中の 画面は、★坂本さんだけが 見て います。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FN = os.path.join(ROOT, "docs", "design", "pack-final", "functions.md")

# ★★画面 … （番号, 名前, 描いて いる 札, 見本の 字）
#   ★★「見本の 字」は functions.md から 取らず、★1つずつ 選びます。
#     ★★見出しの 字だけ 探すと、★どの 画面も「ある」に なって しまいます。
SCREENS = [
  ("A01", "きょう（生徒）", ["HomeV2.jsx"], ["きょうを 記録する", "きょうの よてい"]),
  ("A02", "きょう（先生・出欠の帯）", ["HomeV2.jsx"], ["出欠"]),
  ("A03", "記録（2タップで完成）", ["RecordV2Head.jsx"],
   ["きょうは 書かない", "足す（どれも 任意）"]),
  ("A04", "ふりかえる／ならべる", ["LookBackV2.jsx", "LineUpV2.jsx"], ["並べる"]),
  ("A05", "ふりかえる／さかのぼる", ["LookBackV2.jsx"], ["さかのぼる"]),
  ("A06", "ノート", ["NotesV2.jsx"], ["稽古", "レパートリー", "連絡", "1枚"]),
  ("A07", "ひつじ／ながめる", ["CharacterHome.jsx"], ["ながめる"]),
  ("A08", "ひつじ／したく", ["CharacterHome.jsx"], ["したく"]),
  ("A09", "さがす", ["NotesV2.jsx"], ["ことばで さがす"]),
  ("A09-2", "空きコマ", ["MyTimetable.jsx"], ["時間割を 入れる", "この時間は 来られません"]),
  ("A10", "もっと（歯車）", ["VocalTracker.jsx"], ["もっているもの", "ここから区切りをつける"]),
  ("B01", "くらべる（まだ 出ていない）", ["CompareV2.jsx"], ["調べていることの 順番"]),
  # ★★2026-09-14、★探す 字を 直しました。
  #   ★★はじめ「一緒に 出て」で 探して いました。★私が 考えた 言い方です。
  #     ★見本にも コードにも ありません。★「無い」と 出ました。
  #   ★★見本の 文は こちらです ──「声が 出づらいことが 多いようです。」
  ("B02", "くらべる（1文が 出た）", ["CompareV2.jsx"],
   ["声が 出づらいことが 多いようです。"]),
  ("B03", "かぞえる", ["CountV2.jsx"], ["あなたの 普段", "詳しく 数える"]),
  ("B04", "くらべる（本番の前後）", ["CompareV2.jsx"], ["本番の 前"]),
  ("J01", "おうち／ながめる", ["CharacterHome.jsx"], ["おうち"]),
  ("J02", "おく（スロット）", ["InteriorLayer.jsx"], ["置きかた", "並べかえる"]),
  ("J03", "かべ・ゆか・まど", ["CharacterHome.jsx"], ["かべ", "ゆか"]),
  ("J04", "たな", ["SheepShelf.jsx"], ["たな"]),
  ("J05", "台帳", ["NotesV2.jsx"], ["はじめて 記録した日", "記録した 日"]),
  ("J06", "まだ 見えていないもの", ["CharacterHome.jsx"], ["まだ"]),
]

# ★★`components` だけでは 足りません。
#   ★★この 製品は、★画面の 言葉を `lib/` に 置く 決まりです。
#     ★★はじめ `components` だけ 読み、★「時間割を 入れる」を 見落としました
#       （★本当は lib/myTimetable.js の TT_COPY.title に あります）。
COMP = os.path.join(ROOT, "components")
LIB = os.path.join(ROOT, "lib")
SRC = {}
for f in sorted(os.listdir(COMP)):
  if f.endswith(".jsx"):
    SRC[f] = io.open(os.path.join(COMP, f), encoding="utf-8").read()
LIBSRC = "\n".join(
  io.open(os.path.join(LIB, f), encoding="utf-8").read()
  for f in sorted(os.listdir(LIB)) if f.endswith(".js"))

# ★★門の 中か。★layoutV2 で 出し分けて いる 札を 探します。
# ★★門の 中か。★`layoutV2 &&` の 枝の 中で 描かれて いる 札を 探します。
#   ★★はじめ 120字だけ 見て いました。★注記が 長いので 届きません でした。
#     ★★calibration ── ★NotesV2 と CountV2 は 門の 中の はずです。
#       ★そこが「外」に 出たら、★この 数えは 誤って います。
vt = SRC.get("VocalTracker.jsx", "")
gated = set()
for m in re.finditer(r'layoutV2[\s\S]{0,900}?<([A-Z][A-Za-z0-9]*)[\s>]', vt):
  gated.add(m.group(1) + ".jsx")
# ★★中で 呼ばれる 札も、★門の 中です。
for _ in range(3):
  for f, body in SRC.items():
    if f not in gated:
      continue
    for m in re.finditer(r'from "@/components/([A-Za-z0-9]+)"', body):
      gated.add(m.group(1) + ".jsx")

rows = []
for num, name, comps, words in SCREENS:
  here = [c for c in comps if c in SRC]
  # ★★札の 中と、★lib の 言葉を あわせて 見ます。
  body = "\n".join(SRC.get(c, "") for c in here) + "\n" + LIBSRC
  found = [w for w in words if w in body]
  miss = [w for w in words if w not in body]
  g = any(c in gated for c in here)
  rows.append({"num": num, "name": name, "comps": here, "missing": comps and
               [c for c in comps if c not in SRC],
               "found": found, "miss": miss, "gated": g})

print("★A群・B群・J群　" + str(len(rows)) + "画面")
print()
print("%-6s %-26s %-4s %-7s %s" % ("番号", "名前", "札", "見本の字", "門"))
for r in rows:
  ok = len(r["found"])
  tot = ok + len(r["miss"])
  print("%-6s %-26s %-4s %-7s %s"
        % (r["num"], r["name"][:24],
           "○" if r["comps"] else "✗",
           str(ok) + "/" + str(tot),
           "中" if r["gated"] else "外"))

full = [r for r in rows if r["comps"] and not r["miss"]]
part = [r for r in rows if r["comps"] and r["miss"]]
none = [r for r in rows if not r["comps"]]
print()
print("★見本の 字が そろって いる　" + str(len(full)))
print("★一部だけ　　　　　　　　　 " + str(len(part)))
print("★札が ない　　　　　　　　　" + str(len(none)))
print()
if part:
  print("★足りない 字")
  for r in part:
    print("  " + r["num"] + "　" + "、".join(r["miss"]))
if none:
  print("★札が ない 画面")
  for r in none:
    print("  " + r["num"] + " " + r["name"])

print()
print("★★この 数えが 見て いない こと")
print("　★字が あるか だけ です。★画面に 出るか、★形が 合って いるかは 見て いません。")
print("　★探す 字は 1つずつ 選んだ ものです。★見本 ぜんぶを 突き合わせて いません。")
