#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# A5 ★4つの 状態 × 画面
#
#   ★出どころ functions.md §1-3「4つの状態（★どの画面にも 要ります）」
#     ★空／読み込み中／失敗／オフライン
#
#   ★★これは **表を 作る だけ** です。
#     ★★実際に 確かめるのは 人です。★1つずつ 画面を 開いて いただきます。
#     ★★近道は ありません。★ただし、★黙って 飛ばされる ことは 無くなります。
#
#   ★★すでに 印の 付いた 表が あれば、★その 印を 引き継ぎます。
#     ★★回し直す たびに 白紙に 戻ると、★誰も 使わなく なります。
#
#   使い方  python3 tools/state_sweep_checklist.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
FUNCS = os.path.join(ROOT, "docs", "design", "pack-final", "functions.md")
DEST = os.path.join(OUT, "2026-09-13-A5-4つの状態.md")

STATES = ["空", "読み込み中", "失敗", "オフライン"]


def read_states():
  with open(FUNCS, encoding="utf-8") as f:
    src = f.read()
  i = src.find("## 1-3")
  if i < 0:
    return STATES
  block = src[i:src.find("\n## ", i + 4)]
  found = re.findall(r"\|\s*\*\*(.+?)\*\*\s*\|", block)
  return found or STATES


def read_screens():
  screens = []
  group = None
  with open(FUNCS, encoding="utf-8") as f:
    for line in f:
      m = re.match(r"^## ([A-J]) ── (.+)$", line.strip())
      if m:
        group = "%s ── %s" % (m.group(1), m.group(2))
        continue
      m2 = re.match(r"^### ([A-J]\d+(?:-\d+)?)\s+(.+)$", line.strip())
      if m2:
        screens.append({"id": m2.group(1), "name": m2.group(2), "group": group or "—"})
  return screens


def read_marks():
  """★前に 付けた 印を 引き継ぎます。"""
  marks = {}
  if not os.path.exists(DEST):
    return marks
  with open(DEST, encoding="utf-8") as f:
    for line in f:
      m = re.match(r"^\|\s*([A-J][\w-]*)\s*\|[^|]*\|\s*([^|]+?)\s*\|\s*(✓| )\s*\|\s*(.*?)\s*\|$", line)
      if m:
        marks[(m.group(1), m.group(2))] = (m.group(3) == "✓", m.group(4))
  return marks


def main():
  states = read_states()
  screens = read_screens()
  marks = read_marks()
  if not screens:
    print("★画面が 読めません: " + FUNCS)
    return 1

  lines = []

  def say(t=""):
    lines.append(t)

  done = sum(1 for v in marks.values() if v[0])
  total = len(screens) * len(states)

  say("# A5 ★4つの 状態 × 画面")
  say()
  say("★この 表は tools/state_sweep_checklist.py が 作ります。")
  say("★★印（✓）は 人が 付けます。★回し直しても 印は 消えません。")
  say()
  say("★出どころ `docs/design/pack-final/functions.md` §1-3")
  say()
  say("★画面 **%d** × 状態 **%d** ＝ **%d マス**　／ 済み **%d**"
      % (len(screens), len(states), total, done))
  say()
  say("## ★状態の 決め（★見本の まま）")
  say()
  say("| 状態 | どう するか |")
  say("|---|---|")
  say("| 空 | ★白紙に しない。★何を すると 埋まるかを 1行 |")
  say("| 読み込み中 | ★灰色の 形を 置く（★ぐるぐるを 使わない）。★0.3秒 未満なら 何も 出さない |")
  say("| 失敗 | ★「いま つながりません。書いたものは 端末に 残っています」＋「もう一度」 |")
  say("| オフライン | ★上に 細い帯 1本。★★書けます。★あとで 送ります |")
  say()
  say("★★**書いたものを、失敗で 消さないで ください。**★いちばん 重い 決まりです。")
  say()

  group = None
  for s in screens:
    if s["group"] != group:
      group = s["group"]
      say()
      say("## %s" % group)
      say()
      say("| 画面 | 名前 | 状態 | 済み | 覚え書き |")
      say("|---|---|---|---|---|")
    for st in states:
      ok, note = marks.get((s["id"], st), (False, ""))
      say("| %s | %s | %s | %s | %s |"
          % (s["id"], s["name"], st, "✓" if ok else " ", note))
  say()
  say("## ★この 表が して いない こと")
  say()
  say("★★**確かめて いません。** ★表を 作った だけ です。")
  say("　★★1つずつ 画面を 開いて、★済みの 欄に ✓ を 入れて ください。")
  say("★★4つの 状態を どう 起こすか ──")
  say("　★空　　　… ★記録の 無い 使い捨ての アカウントで 開く")
  say("　★読み込み中… ★開発者ツールで 通信を 遅くする（Slow 3G）")
  say("　★失敗　　… ★通信を 切って 開く（Offline）／台帳を 一時的に 止める")
  say("　★オフライン… ★機内モード")

  with open(DEST, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("docs/reports/2026-09-13-A5-4つの状態.md  全%d行" % len(lines))
  print("画面 %d × 状態 %d = %d マス／済み %d" % (len(screens), len(states), total, done))
  return 0


if __name__ == "__main__":
  sys.exit(main())
