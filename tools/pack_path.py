# -*- coding: utf-8 -*-
"""★いま 正の 荷（見本の パック）は どこか ── ★1か所 だけ（★2026-09-19）

  ★★★2026-09-19、★荷が `visual-2026-09-19/` に 移りました。
    ★★道具は `visual-2026-09-18/` を 名指しで 持って いました。
    ★★★名指しが いくつも あると、★荷が 動いた 日に 片方だけ 古く なります。
    ★★だから、★**いちばん 新しい 日付の 荷** を ここで 選びます。

  ★★止まる 決まり ── ★荷が 1つも 無い／4本 そろって いない なら 止まります。
"""

import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OPUS = os.path.join(ROOT, "docs", "opus")
見本 = ["00-動く見本-PC・iPad（個人）.html", "00-動く見本-PC・iPad（運営）.html",
       "00-動く見本-iPhoneで開く用.html", "00-動く見本（さわれる・全画面）.html"]


def 荷():
  if not os.path.isdir(OPUS):
    raise SystemExit("★止まりました ── docs/opus が ありません")
  日付 = re.compile(r"^visual-(\d{4}-\d{2}-\d{2})$")
  候補 = sorted((d for d in os.listdir(OPUS) if 日付.match(d)), reverse=True)
  if not 候補:
    raise SystemExit("★止まりました ── `visual-YYYY-MM-DD` の 荷が ありません")
  p = os.path.join(OPUS, 候補[0], "pack")
  if not os.path.isdir(p):
    raise SystemExit("★止まりました ── pack が ありません: " + p)
  足りない = [f for f in 見本 if not os.path.exists(os.path.join(p, f))]
  if 足りない:
    raise SystemExit("★止まりました ── 4本 そろって いません: " + " ".join(足りない))
  return p


def 運営():
  return os.path.join(荷(), "00-動く見本-PC・iPad（運営）.html")


if __name__ == "__main__":
  print(荷())
  # ★★★較正 ── ★荷の 中の「6文字」を 数えます（★README の 確かめ方）。
  #   ★★1件でも あれば 古い 版 です。
  合 = 0
  for f in 見本:
    合 += open(os.path.join(荷(), f), encoding="utf-8").read().count("6文字")
  print("合言葉「6文字」…… %d件（★0 が 正）" % 合)
  if 合:
    sys.exit(2)
