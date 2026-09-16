#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★見本と 実装の「色・大きさ・太さ」だけ を くらべます。

  ★★出どころ　坂本さん（★2026-09-16）
    「★今後の 突き合わせでは、★**構造の 差**と **トークンの 差**を
      ★別の 表で 報告する こと。
      ★色・大きさの 不一致は、★いまは 不具合として 数えない
      （★トークンが まだ 当たって いない ため。★想定どおり）。」

  ★★だから この 道具は、★合否を 出しません。★数えて 並べる だけ です。
    ★★組み立ての 差は `tools/screen_both_ways.py` が 見ます。
      ★こちらは 字が 同じ ものだけ を 相手に します。
      ★★字が ちがう ものを ここで 出すと、★2つの 表が 混ざります。

  ★★使い方　python3 tools/token_diff.py account 設定
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIHON = os.path.join(ROOT, "docs", "design", "compare", "mihon")
APP = os.path.join(ROOT, "docs", "design", "compare", "all", "frames")


def norm(t):
  t = re.sub(r"\s+", "", str(t or ""))
  return t.replace("›", "").replace("→", "").replace("‹", "").strip()


def app_path(n):
  """★画面（SC）と 1枚の 板（SH）、★どちらの 形でも 探します。"""
  for pre in ("SC-", "SH-"):
    q = os.path.join(APP, pre + n + "@390.json")
    if os.path.exists(q):
      return q
  return os.path.join(APP, "SC-" + n + "@390.json")


def px(v):
  try:
    return float(str(v).replace("px", ""))
  except Exception:
    return None


def rgb(v):
  m = re.findall(r"\d+", str(v or ""))
  return tuple(int(x) for x in m[:3]) if len(m) >= 3 else None


def main():
  names = sys.argv[1:]
  if not names:
    print("★どの 画面か、★名前を ください。　例）python3 tools/token_diff.py account")
    return 1

  # ★★足りない ものが あれば 止まります（★坂本さんの お決め・棚卸しの 決まり）。
  bad = []
  for n in names:
    for p in (os.path.join(MIHON, n + "@390.json"), app_path(n)):
      if not os.path.exists(p):
        bad.append(os.path.relpath(p, ROOT))
  if bad:
    print("★★撮った 書き出しが ありません:")
    for x in bad:
      print("   ", x)
    print("　★数えません。★止まります。")
    return 1

  for n in names:
    mi = json.load(open(os.path.join(MIHON, n + "@390.json"), encoding="utf-8"))
    ap = json.load(open(app_path(n), encoding="utf-8"))

    # ★★実装の 側は 倍率 3 で 撮って います。★見本は 2 です。
    #   ★★けれど `getBoundingClientRect` は どちらも CSS の px を 返します。
    #     ★★だから 大きさの 数は、★そのまま くらべられます。
    #     ★★絵の 画素だけが 倍率の 影響を 受けます（★compare_pair.py 側）。
    am = {}
    for x in ap:
      k = norm(x.get("text"))
      if k and k not in am:
        am[k] = x

    rows, same, nofield = [], 0, 0
    for m in mi:
      k = norm(m.get("text"))
      if not k:
        continue
      a = am.get(k)
      if a is None:
        continue                      # ★組み立ての 差。★あちらの 表で 見ます。
      if "size" not in a:
        nofield += 1
        continue
      d = []
      sm, sa = px(m.get("size")), px(a.get("size"))
      if sm is not None and sa is not None and abs(sm - sa) >= 0.5:
        d.append("大きさ %s → %s" % (m.get("size"), a.get("size")))
      wm, wa = str(m.get("weight")), str(a.get("weight"))
      if wm != wa:
        d.append("太さ %s → %s" % (wm, wa))
      cm, ca = rgb(m.get("color")), rgb(a.get("color"))
      if cm and ca and cm != ca:
        d.append("色 rgb%s → rgb%s" % (cm, ca))
      if d:
        rows.append((k, d))
      else:
        same += 1

    print("=" * 66)
    print("■ %s　★色・大きさ・太さ だけ（★組み立ては 別の 表）" % n)
    print("=" * 66)
    if nofield:
      print("★%d 件は、★実装の 書き出しに 大きさが ありません（★撮り直しが 要ります）" % nofield)
    print("★くらべられた %d 件 ── 一致 %d ／ ちがい %d" % (same + len(rows), same, len(rows)))
    print()
    for k, d in rows:
      print("  ・%s" % k[:24])
      for x in d:
        print("      %s" % x)
    if not rows:
      print("  ✓ ちがいは ありません")
    print()
    print("★★これは 合否では ありません。★トークンを 当てる 前の 数 です。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
