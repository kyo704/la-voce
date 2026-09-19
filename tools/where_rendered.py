# -*- coding: utf-8 -*-
"""★その 部品は、★門（`layoutV2`）の 中か 外か（★2026-09-19）

  ★★★坂本さんの お問い ──「38人にも 出る、とは どういう 意味か」。
    ★★数えて 答えます。★見立てでは なく、★行を 見ます。

  ★★★やり方
    ★置いて ある 行から 上へ たどり、★いちばん 近い `layoutV2` の 印を 見ます。
    ★`layoutV2 &&` ／ `layoutV2 ?` …… ★門の 中
    ★`!layoutV2` …… ★門の 外（★38人に 出ます）
    ★見つからなければ「印が 無い」── ★門を 通らない ので、★38人にも 出ます。

  ★★較正 ── ★必ず 当たる 行と、★当たらない 行で 試します。
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VT = os.path.join(ROOT, "components", "VocalTracker.jsx")
註 = re.compile(r"^\s*(//|\*|/\*)")
外 = re.compile(r"!layoutV2")
# ★★`className={layoutV2 ? …}` は 門では ありません（★2026-09-19）。
中 = re.compile(r"(?<!className=\{)layoutV2\s*(&&|\?)")


def 印(本, i, 幅=400):
  for j in range(i, max(-1, i - 幅), -1):
    l = 本[j]
    if 註.match(l):
      continue
    if 外.search(l):
      return ("門の外", j + 1, l.strip()[:60])
    if 中.search(l):
      return ("門の中", j + 1, l.strip()[:60])
  return ("印が無い", None, "")


def main():
  本 = io.open(VT, encoding="utf-8").read().split("\n")
  assert 印(["if (!layoutV2) {", "x"], 1)[0] == "門の外", "★道具が 壊れて います"
  assert 印(["if (layoutV2 && a) {", "x"], 1)[0] == "門の中", "★道具が 壊れて います"
  assert 印(["const a = 1;", "x"], 1)[0] == "印が無い", "★道具が 壊れて います"
  # ★★探し方の 較正 ── ★行の 終わりで 切れる 置き方も 見つけます。
  あたり = re.compile(r"<%s(?![A-Za-z0-9_])" % "OwnedLedger")
  assert あたり.search("        <OwnedLedger"), "★探し方が 壊れて います"
  assert あたり.search("<OwnedLedger rows={x}"), "★探し方が 壊れて います"
  assert not あたり.search("<OwnedLedgerX rows={x}"), "★よその 名まで 拾って います"

  部品 = sys.argv[1:] or ["MyTimetable", "DailyAskPicker", "LookBackPanel",
                          "OwnedLedger", "RangeCalendar", "SheepShelf",
                          "RecordV2Head"]
  for c in 部品:
    # ★★★`<Name` の あとに 何も 無い 行（★行の 終わり）を 落として いました。
    #   ★★`<OwnedLedger` が「置いて いません」と 出ました。★置いて あります。
    #   ★★★較正を 探し方にも かけます（★下の 当たり・外れ）。
    さがす = re.compile(r"<%s(?![A-Za-z0-9_])" % re.escape(c))
    見つけ = [i for i, l in enumerate(本) if not 註.match(l) and さがす.search(l)]
    if not 見つけ:
      print("%-16s ★置いて いません" % c)
      continue
    for i in 見つけ:
      ど, 行, 字 = 印(本, i)
      print("%-16s %5d行 …… %-8s %s" % (c, i + 1, ど, ("← %d行 `%s`" % (行, 字)) if 行 else ""))


if __name__ == "__main__":
  main()
