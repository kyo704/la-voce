#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""値段の 直書きを 洗い出す（2026-09-15）。

  ★出どころ 坂本さん ──「値段の 食い違いは、★実際の 課金・信頼に 直結する」

  ★★見つけ方
    ① `lib/plans.js` が 持つ 数（★正）を 読む
    ② 倉庫ぜんたいから「◯◯円」を 拾う
    ③ `plans.js` を 読んで いない ファイルの ものを 並べる
    ④ ★数が **食い違う** ものを、★いちばん 上に 出す

  ★★コメントは 外します。★注記の 中の 数は、★画面に 出ません。
"""

import io
import os
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ★★★共通の 下ごしらえを 使います（★2026-09-21・裁定135 の 5度目）。
#   ★★ここに 書いて いた 形は、★**行の 頭の 註 だけ** を 落として いました。
#     ★★`const a = 1; // 12,800円` の ような 行の 終わりの 註が 残り、
#       ★★「直書き」として 挙がって いました。
#   ★★正規表現リテラルも 読み飛ばせません でした。
#   ★★`tools/strip_common.py` は `lib/strip.js` と 同じ 決まり です。
from strip_common import strip_js as _strip_js


def strip(t):
  return _strip_js(t)


def _strip_old(t):
  t = re.sub(r"/\*[\s\S]*?\*/", "", t)
  t = re.sub(r"(?m)^\s*//.*$", "", t)
  t = re.sub(r"(?m)^\s*\*.*$", "", t)
  return t


def files():
  for d in ("components", "lib", "app"):
    base = os.path.join(ROOT, d)
    for root, dirs, fs in os.walk(base):
      dirs[:] = [x for x in dirs if x not in ("node_modules", "tests")]
      for f in sorted(fs):
        if f.endswith((".js", ".jsx")):
          rel = os.path.relpath(os.path.join(root, f), ROOT)
          yield rel, io.open(os.path.join(root, f), encoding="utf-8").read()


def main():
  plans = io.open(os.path.join(ROOT, "lib", "plans.js"), encoding="utf-8").read()
  truth = {}
  # ★★2026-09-15、★ここを 1度 まちがえました。
  #   ★★窓を 320文字に して いたので、★`annual` の 注記が 長く、
  #     ★★`monthly` しか 拾えません でした。
  #   ★★すると 4,800円 が「合わない 値段」に 見えます。★誤りです。
  #   ★★{ … } の 塊ごと 読みます。★窓の 幅で 決めません。
  for blk in re.findall(r"\{[^{}]*priceYen[^{}]*\}", plans, re.S):
    k = re.search(r'key: "(\w+)"', blk)
    y = re.search(r"priceYen: (\d+)", blk)
    lb = re.search(r'priceLabel: "([^"]+)"', blk)
    if k and y and lb:
      truth[k.group(1)] = (int(y.group(1)), lb.group(1))
  print("★lib/plans.js が 持つ 値段（★正）")
  for k, (yen, label) in truth.items():
    print("  %-8s %6d 円   %s" % (k, yen, label))
  yens = {v[0] for v in truth.values()}
  print()

  reads = set()
  hits = []
  for rel, raw in files():
    if rel.replace("\\", "/") == "lib/plans.js":
      continue
    code = strip(raw)
    if 'from "@/lib/plans"' in code:
      reads.add(rel)
    for m in re.finditer(r"([0-9][0-9,]{1,8})\s*円", code):
      n = int(m.group(1).replace(",", ""))
      if n < 100:
        continue
      line = code[:m.start()].count("\n") + 1
      hits.append({"file": rel, "yen": n, "text": m.group(0),
                   "line": line, "reads": rel in reads})

  print("★lib/plans.js を 読んで いる ファイル: %d" % len(reads))
  for r in sorted(reads):
    print("   ", r)
  print()

  # ★★`lib/learnContent.js` は 記事の 本文 です。
  #   ★★レッスン料・楽器の 値段など、★**私たちの 値段では ありません**。
  #   ★★混ぜると、★本当の 食い違いが 埋もれます。
  ARTICLE = ("lib/learnContent.js",)
  hits = [h for h in hits if h["file"].replace("\\", "/") not in ARTICLE]
  bad = [h for h in hits if h["yen"] not in yens]
  same = [h for h in hits if h["yen"] in yens]
  print("★★★ plans.js の どの 数とも 合わない 値段: %d 件" % len(bad))
  for h in bad:
    print("  ✗ %s:%d  %s" % (h["file"], h["line"], h["text"]))
  if not bad:
    print("  ✓ ありません")
  print()
  print("★plans.js と 同じ 数だが、★直書きして いる: %d 件" % len(same))
  for h in same:
    print("  ・%s:%d  %s%s" % (h["file"], h["line"], h["text"],
                               "" if h["reads"] else "　★plans.js を 読んで いません"))
  print()
  print("★★この 数えが 見て いない こと")
  print("　★コメントは 外して います。★注記の 中の 数は 画面に 出ません。")
  print("　★組み立てて 作る 数（★変数）は 見えません。")
  print("　★docs/ と supabase/ は 見て いません。★画面に 出ない から です。")
  return 1 if bad else 0


if __name__ == "__main__":
  raise SystemExit(main())
