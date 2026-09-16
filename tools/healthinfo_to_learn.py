#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★健康情報の 5節を、★学ぶの 記事へ 引っ越します。

  ★★出どころ　裁定その69（★2026-09-16・坂本さん承認済み）──
    「★㋐採用。中間画面を 廃止する。
      ★健康情報は 7章の いずれかに 統合する。★新しい 章は 作らない」

  ★★引っ越し先は、★**すでに 決まって いました**。
    ★★`docs/learn-content/articles.json` に、★本文の 無い 指示が 5本 あります。
      ★★`lib/learnContent.js` の 頭に、★こう 書いて あります ──
        「67本のうち5本は『健康情報から移してくる』という指示で、本文を持って
          いません。… 入れていないもの: C2-1 / C2-2 / C4-1 / C4-6 / C4-7」
    ★★健康情報の 節も **5つ** です。★題が 1つずつ 合います。
      ★s1 → C2-1　★s2 → C2-2　★s3 → C4-1　★s4 → C4-6　★s5 → C4-7

  ★★★1つ、★裁定と 食い違う ところが あります。★先に 申します。
    ★★裁定は「LPRの 記事は 章5『守る』の『逆流と 声』に 該当する」と 言います。
    ★★けれど `C2-1` は **章2**（何が声を削るか）に 置かれて います。
      ★★題は「逆流性食道炎・咽喉頭逆流症（LPR）と 声」── ★ぴたりと 同じ です。
    ★★この 紙は、★この 引っ越しの ために 前もって 作られた ものです。
      ★★だから、★紙の ほうに 従います。★新しい 章は 作りません。
      ★★「章の いずれかに 統合する」は 守って います。
    ★★ご判断で 章5に 移す なら、★`chapter` を 1つ 直すだけ です。

  ★★★もう 1つ、★お伝えしなければ ならない ことが あります。
    ★★健康情報は **9つの ことば**を 持って います（ja en zh it de fr es ko ru）。
    ★★学ぶの 記事は **日本語だけ** です。
    ★★引っ越すと、★日本語 以外の 方には この 中身が 出なく なります。
      ★★だから `lib/healthInfoContent.js` は **消しません**。
        ★9つの ことばは、★そのまま 残ります。
      ★★入口だけを 移します。★中身は 消えて いません。
    ★★9つの ことばを どう するかは、★坂本さんの お決め です。

  ★★中身の 検証は しません（★お指図）。★写すだけ です。
"""

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HC = os.path.join(ROOT, "lib", "healthInfoContent.js")
AJ = os.path.join(ROOT, "docs", "learn-content", "articles.json")

for p in (HC, AJ):
  if not os.path.exists(p):
    print("★★ありません: " + os.path.relpath(p, ROOT))
    print("　★書きません。★止まります。")
    sys.exit(1)

# ★★★字を 正規表現で 拾うのを やめました（★2026-09-16）。
#
#   ★★はじめ `鍵: { ja: "…" }` を 正規表現で 探して いました。
#     ★★2つ 取りこぼしました ── `s1Para4Intro` と `s2Note`。
#     ★★あの 2つは `cautionAfter()` / `cautionWith()` で **組み立て**られます。
#       ★★`lib/medicalCaution.js` が、★お医者さまに かかる ことの 但し書きを
#         ★うしろ（または 前）に 足します。
#       ★★字は ファイルの 中に **そのままの 形では 在りません**。
#   ★★取りこぼした ままなら、★**但し書きの ない 健康の 記事**が できて いました。
#     ★★見張り（読めなかった 鍵が あれば 止める）が 止めました。
#   ★★だから、★**動かして 読みます**。★組み立てた あとの 字を 取ります。
import subprocess
_dump = subprocess.run(
  ["node", "--input-type=module", "-e",
   "const m=await import('./lib/healthInfoContent.js');"
   "process.stdout.write(JSON.stringify(m.HEALTH_INFO_CONTENT));"],
  cwd=ROOT, capture_output=True, text=True)
if _dump.returncode != 0:
  print("★★健康情報を 読めません:")
  print(_dump.stderr[:400])
  print("　★書きません。★止まります。")
  sys.exit(1)
H = json.loads(_dump.stdout)


def ja(key):
  """★その 鍵の 日本語を、★そのまま 取り出します。★書き換えません。"""
  v = H.get(key)
  if not isinstance(v, dict):
    return None
  return v.get("ja")


# ★★画面（HealthInfo.jsx）が 並べて いる 順を、★そのまま 写します。
#   ★★並べ替えません。★節ごとに、★段落・箇条書き・但し書きの 順 です。
LAYOUT = {
  "C2-1": ["s1Para1", "s1Para2Intro",
           ("ul", ["s1List1", "s1List2", "s1List3", "s1List4"]),
           "s1Para3", "s1Para4Intro",
           ("ul", ["s1List5", "s1List6", "s1List7", "s1List8"]),
           ("note", "s1Note")],
  "C2-2": [("dl", [("s2Item1Term", "s2Item1Desc"), ("s2Item2Term", "s2Item2Desc"),
                   ("s2Item3Term", "s2Item3Desc"), ("s2Item4Term", "s2Item4Desc")]),
           ("note", "s2Note")],
  "C4-1": [("ul", ["s3List1", "s3List2", "s3List3", "s3List4", "s3List5", "s3List6"])],
  "C4-6": [("h", "s4Sub1"),
           ("dl", [("s4Item1Term", "s4Item1Desc"), ("s4Item2Term", "s4Item2Desc"),
                   ("s4Item3Term", "s4Item3Desc")]),
           ("h", "s4Sub2"),
           ("dl", [("s4Item4Term", "s4Item4Desc"), ("s4Item5Term", "s4Item5Desc"),
                   ("s4Item6Term", "s4Item6Desc")]),
           ("h", "s4Sub3"),
           ("dl", [("s4Item7Term", "s4Item7Desc")])],
  "C4-7": [("dl", [("s5Item1Term", "s5Item1Desc"), ("s5Item2Term", "s5Item2Desc")]),
           ("note", "s5Note")],
}
# ★★C2-1 の 指示に 書いて ある、★本文の 末に 足す 1段落（★そのまま）。
RSI_TAIL = ("Woolsong の 質問票に ある RSI（逆流症状インデックス）は、"
            "この LPR の スクリーニングに 使われている 尺度です。"
            "喉の 違和感が 続いていて 心当たりが ある 場合は、"
            "月に 一度ほど 記録して おくと、変化を 追いやすく なります。")

# ★★指示に 書いて ある 並び ──
#   ★C4-1「この章の 先頭に 置いて ください」
#   ★C4-7「C4-6 の 直後に 置いて ください」
ORDER = {"C4-1": 1, "C4-6": 6, "C4-7": 7}

LEAD = {"C2-1": "s1Para1", "C2-2": "s2Item1Desc", "C4-1": "s3List1",
        "C4-6": "s4Sub1", "C4-7": "s5Item1Desc"}

missing = []


def build(aid):
  out = []
  for part in LAYOUT[aid]:
    if isinstance(part, str):
      v = ja(part)
      if v is None:
        missing.append(part)
        continue
      out.append(v)
    elif part[0] == "ul":
      for k in part[1]:
        v = ja(k)
        if v is None:
          missing.append(k)
          continue
        out.append("・" + v)
    elif part[0] == "dl":
      for kt, kd in part[1]:
        a, b = ja(kt), ja(kd)
        if a is None or b is None:
          missing.append(kt + "/" + kd)
          continue
        out.append("・**" + a + "**　" + b)
    elif part[0] == "h":
      v = ja(part[1])
      if v is None:
        missing.append(part[1])
        continue
      out.append("### " + v)
    elif part[0] == "note":
      v = ja(part[1])
      if v is None:
        missing.append(part[1])
        continue
      out.append("※ " + v)
  return "\n\n".join(out)


DRY = "--write" not in sys.argv
d = json.load(io.open(AJ, encoding="utf-8"))
arts = d["articles"]
by = {a["id"]: a for a in arts}

rows = []
for aid in LAYOUT:
  a = by.get(aid)
  if a is None:
    print("★★`articles.json` に ありません: " + aid)
    print("　★書きません。★止まります。")
    sys.exit(1)
  body = build(aid)
  lead = ja(LEAD[aid]) or ""
  rows.append((aid, a.get("chapter"), a.get("status"), len(a.get("body") or ""), len(body)))
  if not DRY:
    # ★★★いまの 本文は、★**実装者あての 指示**です。★記事では ありません。
    #   ★★消さずに 別の 欄へ 移します。★何を 頼まれたかが 残ります。
    #     ★★`build-learn-content.js` は `_` で 始まる 欄を 見ません。
    if a.get("body") and not a.get("_instruction"):
      a["_instruction"] = a["body"]
    body2 = body
    # ★★C2-1 の 指示に、★本文の 末に 足す 1段落が 書いて あります ──
    #   「Woolsong の 質問票に ある RSI（逆流症状インデックス）は …」
    #   ★★これを 落とすと、★記録と 記事が 繋がりません。
    if aid == "C2-1":
      body2 = body + "\n\n" + RSI_TAIL
    a["body"] = body2
    a["summary"] = lead
    # ★★本文を 持つ ように なりました。★取り込みが 拾える 状態に します。
    a["status"] = "new"
    # ★★C4-1「この章の 先頭に 置いて ください」／C4-7「C4-6 の 直後に」。
    if aid in ORDER:
      a["order"] = ORDER[aid]

# ★★取りこぼしが あれば 止めます。★空の まま 書きません。
if missing:
  print("★★読めなかった 鍵が あります:")
  for k in sorted(set(missing)):
    print("   " + k)
  print("　★書きません。★止まります。")
  sys.exit(1)

if not DRY:
  io.open(AJ, "w", encoding="utf-8").write(json.dumps(d, ensure_ascii=False, indent=2) + "\n")

print("%-6s %-4s %-18s %8s %8s" % ("id", "章", "status", "前(字)", "後(字)"))
for aid, ch, st, b0, b1 in rows:
  print("%-6s ch%-3s %-18s %8d %8d" % (aid, ch, st, b0, b1))
print("MODE: %s" % ("dry-run（★--write で 書きます）" if DRY else "書きました"))
print("MISSING_KEYS: 0")
