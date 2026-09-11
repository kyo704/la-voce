#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★レッスンを 消すと、★出席も 一緒に 消えるか（★④・今日 中）
#
#   ★出どころ 2026-09-11 の お尋ね ──
#     ★★「消して 作り直す やり方が、★いま 使われて いるか。
#       ★★使われて いるなら、★記録した 出席を 黙って 消して いないか」
#
#   ★★出席は lessons の **列** です。★行を 消せば、★必ず 一緒に 消えます。
#     ★そこは 尋ねる までも ありません。
#   ★★本当に 要るのは ──「★その 道が、★いま 使われて いるか」です。
#
#   ★★字を 並べます。★言い分は 足しません。
#
#   使い方  python3 tools/delete_recreate_risk.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
SRC = os.path.join(ROOT, "components", "VocalTracker.jsx")


def main():
  with open(SRC, encoding="utf-8") as f:
    src = f.read().split("\n")

  lines = []

  def say(t=""):
    print(t)
    lines.append(t)

  def quote(i, before=2, after=3):
    for k in range(max(0, i - before), min(len(src), i + after)):
      say("%5d  %s" % (k + 1, src[k].rstrip()[:96]))

  say("# ★レッスンを 消すと、★出席も 消えるか")
  say()
  say("★この 紙は tools/delete_recreate_risk.py が 書き出します。★手で 書いて いません。")
  say()
  say("## ★まず、★消える か どうか")
  say()
  say("★★出席は `lessons` の **attendance 列** です。★別の 表では ありません。")
  say("★★だから 行を 消せば、★出席は **必ず 一緒に 消えます**。")
  say("　★★台帳に 尋ねる までも ありません。★列は 行の 一部です。")
  say()
  say("★★問いは そこでは なく ──「★その 道が、★いま 使われて いるか」です。")
  say()

  # ① ★lessons を 消す 道が いくつ あるか
  dels = [i for i, l in enumerate(src)
          if re.search(r'from\("lessons"\)', "\n".join(src[max(0, i - 3):i + 1]))
          and ".delete(" in l]
  say("## ① ★lessons を 消す 道")
  say()
  say("★**" + str(len(dels)) + " か所** あります。")
  say()
  for i in dels:
    say("```")
    quote(i, 4, 3)
    say("```")
    say()

  # ② ★消した すぐ あとに 作り直して いないか
  say("## ② ★消して、★すぐ 作り直して いないか")
  say()
  recreate = []
  for i in dels:
    win = "\n".join(src[i:i + 25])
    if re.search(r'from\("lessons"\)[\s\S]{0,80}\.insert\(', win):
      recreate.append(i)
  if recreate:
    say("★**あります。** ★下の ところです。")
    for i in recreate:
      say("- " + str(i + 1) + " 行目")
  else:
    say("★**ありません。**")
    say()
    say("★★消した すぐ あとで `lessons` に 入れ直して いる ところは、")
    say("　★★1か所も ありません。")
    say("　★★`handleDeleteLesson` は、★消して 一覧を 読み直すだけ です。")
  say()

  # ③ ★消す 札は、★どの レッスンに 出るか
  say("## ③ ★消す 札は、★どの レッスンに 出るか")
  say()
  btn = [i for i, l in enumerate(src) if "handleDeleteLesson(" in l and "onClick" in l]
  for i in btn:
    say("```")
    quote(i, 4, 2)
    say("```")
    say()
  gated = any("new Date(l.scheduled_at) >= new Date()" in "\n".join(src[max(0, i - 6):i + 1])
              for i in btn)
  if gated:
    say("★★札が 出るのは、★`new Date(l.scheduled_at) >= new Date()` ──")
    say("　★★つまり **これから 先の レッスン だけ** です。")
    say("　★★過ぎた レッスンには、★消す 札が 出ません。")
  else:
    say("★★時刻の 絞り込みが 見当たりません。★過ぎた ぶんも 消せる おそれ。")
  say()

  # ④ ★出席を 付ける 札は、★どの レッスンに 出るか
  say("## ④ ★出席を 付ける 札は、★どの レッスンに 出るか")
  say()
  say("★★`lib/todayBand.js` の `buildBand` が `lessonsOn(…, todayISO, …)` を 使います。")
  say("　★★**その日の レッスン**が 並びます。★時刻では 絞って いません。")
  say()

  say("## ★★重なる ところ（★危ないのは ここだけ）")
  say()
  say("★★消す 札　……　これから 先の レッスン")
  say("★★出席の 札　……　その日の レッスン（★時刻を 問わない）")
  say()
  say("★★だから、★**その日の、★まだ 時刻の 来て いない レッスン**だけが、")
  say("　★★両方の 札を 同時に 持ちます。")
  say()
  say("★★そこで こう なり得ます ──")
  say("　★① 朝に、★10時の レッスンの 出席を 先に 付ける")
  say("　★② 9時半に、★その レッスンを ✕ で 消す")
  say("　★③ 付けた 出席は、★行ごと 消える。★何も 言われない。")
  say()
  say("★★過ぎた レッスンでは 起きません。★消す 札が 出ない ためです。")
  say()

  say("## ★いま 言える こと")
  say()
  if not recreate:
    say("★★「消して 作り直す」やり方は、★アプリの 中に **ありません**。")
    say("　★★だから「日程を 直す ために 消して いる」ことは、★起きて いません。")
    say("　★★お尋ねの「黙って 出席を 消して いる」形は、★この 道からは 出ません。")
  say()
  say("★★ただし、★**上の 重なりは 残ります**。")
  say("　★★✕ には 念押しが ありません。★何を 失うかも 出ません。")
  say("　★★`handleDeleteLesson` は 3行で、★出席が 入って いるか 見て いません。")
  say()
  say("★★人が 手で「消して、作り直す」ことも できます。")
  say("　★★その ときは、★同じ ことが 起きます。")
  say()
  say("## ★すぐ 打てる 手（★まだ 打って いません）")
  say()
  say("★㋐ ✕ を 押した とき、★出席が 入って いれば 念押しを 出す")
  say("　　★★`l.attendance` を 見るだけ です。★台帳を 触りません。")
  say("　　★★この家の 決め ──「★人が 書いた ものを 黙って 消さない」に 沿います。")
  say()
  say("★㋑ 出席の 入った レッスンには、★✕ を 出さない")
  say("　　★★消したい ときは、★先に 出席を 外して いただく。")
  say()
  say("★㋒ 当座の しのぎ ── ★消して 作り直す やり方を 使わない、と 申し合わせる")
  say("　　★★お尋ねに あった ものです。★ただ、★その やり方は")
  say("　　★★いま アプリの 中に 無いので、★申し合わせる 相手は 人の 手作業です。")
  say()
  say("★★どれも まだ して いません。★お決めを お待ちします。")

  p = os.path.join(OUT, "2026-09-11-レッスンを消すと出席も消えるか.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("\n★docs/reports/2026-09-11-レッスンを消すと出席も消えるか.md に 書きました。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
