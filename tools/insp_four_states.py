# -*- coding: utf-8 -*-
"""★検査 その3 ── ★4つの 状態の 走査（★2026-09-19・お決め D84）

  ★★★画面は 4つの 顔を 持ちます。★どれか 1つでも 欠けると、★人が 迷います。
    ①空 …… ★まだ 何も 無い
    ②読めない …… ★引けなかった（★①とは **別** です）
    ③途中 …… ★いま 書いて いる・送って いる
    ④満杯 …… ★上限に 当たった（★上限の ある 画面 だけ）

  ★★★この 蔵の 持病は ①と②を 混ぜる ことです。
    ★★「0件」と「読めなかった」を 同じ 顔で 出すと、
    ★★★「みんな 出して います」と 嘘を つきます。
    ★★だから、★②を 別に 持って いるかを いちばん きびしく 見ます。

  ★★較正 ── ★4つ 持って いる 画面と、★持って いない 画面で 試します。
"""

import io
import os
import re
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KOMP = os.path.join(ROOT, "components")

# ★★見分けの しるし（★字では なく 形 を 見ます）。
印 = {
  "空": [r"length === 0", r"length\s*<\s*1", r"EMPTY", r"ありません", r"いません"],
  "読めない": [r"=== null", r"!== null", r"NOT_READ", r"読めません",
             r"error\s*=", r"error \?", r"Err\b"],
  "途中": [r"\bbusy\b", r"loading", r"posting", r"saving", r"送って"],
  "満杯": [r"\bMAX\b", r"まで です", r"までです", r"上限", r"length >= ", r"満"],
}


def 読む(f):
  return io.open(os.path.join(KOMP, f), encoding="utf-8").read()


def 画面か(本):
  """★1枚の 画面か（★`ScreenHead` を 置いて いる もの）。"""
  return "<ScreenHead" in 本 or "ScreenHead" in 本


def 見る(本):
  出 = {}
  for な, ps in 印.items():
    出[な] = any(re.search(p, 本) for p in ps)
  return 出


def main():
  一覧 = sorted(f for f in os.listdir(KOMP) if f.endswith(".jsx"))

  # ★★較正 ── ★4つ 持って いる 画面と、★上限の 無い 画面。
  当 = 見る(読む("OpsMada.jsx"))
  assert 当["空"] and 当["読めない"] and 当["途中"], "★道具が 見つけられて いません"
  代 = 見る(読む("OpsDaihyo.jsx"))
  assert 代["満杯"], "★上限を 見つけられて いません"
  assert not 見る("const a = 1;")["読めない"], "★何でも 当てて います"

  行 = []
  欠け = {"空": [], "読めない": [], "途中": []}
  画面数 = 0
  for f in 一覧:
    本 = 読む(f)
    if not 画面か(本):
      continue
    画面数 += 1
    r = 見る(本)
    行.append((f, r))
    for な in 欠け:
      if not r[な]:
        欠け[な].append(f)

  今日 = datetime.date.today().isoformat()
  みち = os.path.join(ROOT, "docs", "reports", "%s-検査3-4つの状態.md" % 今日)
  with io.open(みち, "w", encoding="utf-8") as g:
    g.write("# ★検査 その3 ── ★4つの 状態の 走査\n\n")
    g.write("★%s ／ ★`tools/insp_four_states.py` が 書きました。\n\n" % 今日)
    g.write("★画面 **%d** 枚（★`ScreenHead` を 置いて いる もの）\n\n" % 画面数)
    g.write("| 画面 | 空 | 読めない | 途中 | 満杯 |\n|---|---|---|---|---|\n")
    for f, r in 行:
      g.write("| `%s` | %s | %s | %s | %s |\n"
              % (f, "○" if r["空"] else "―", "○" if r["読めない"] else "★",
                 "○" if r["途中"] else "―", "○" if r["満杯"] else "―"))
    g.write("\n## ★いちばん 大事な 欄 ──「読めない」\n\n")
    g.write("★★「空」と「読めない」を 混ぜると、★嘘を つきます。\n")
    g.write("★持って いない 画面 …… **%d**枚\n\n" % len(欠け["読めない"]))
    for f in 欠け["読めない"]:
      g.write("- `%s`\n" % f)
    g.write("\n## ★「空」を 持って いない 画面 …… %d枚\n\n" % len(欠け["空"]))
    for f in 欠け["空"]:
      g.write("- `%s`\n" % f)
    g.write("\n## ★「途中」を 持って いない 画面 …… %d枚\n\n" % len(欠け["途中"]))
    for f in 欠け["途中"]:
      g.write("- `%s`\n" % f)
    g.write("\n## ★この 検査が 見て いない こと\n\n")
    g.write("★★字の 形を 見て います。★実際に その 顔が 出るかは 見て いません。\n")
    g.write("★★「満杯」は 上限の ある 画面 だけ の 話 です。★欠けても 誤りでは ありません。\n")
    g.write("★★★○ は「持って いる らしい」です。★「正しい」では ありません。\n")
  print("REPORT: %s" % os.path.relpath(みち, ROOT))
  print("画面 %d ／ 読めない 無し %d ／ 空 無し %d ／ 途中 無し %d"
        % (画面数, len(欠け["読めない"]), len(欠け["空"]), len(欠け["途中"])))


if __name__ == "__main__":
  main()
