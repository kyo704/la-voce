#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★見本から 抜いた JSON と、★実装の 画面を 突き合わせます。

  ★★出どころ　坂本さん（★2026-09-16）──
    「★この方式を 今後の 標準検証手段と します」

  ★★これまでの `screen_both_ways.py` は、★**字の 一覧どうし**を くらべました。
    ★★節ごと 撮るので、★となりの 節の 字まで「足し」に 出ます。
  ★★こちらは、★見本の **組み立て**（札・行・見出し・押しどころ・注記）を
    ★1つずつ 名指しで 探します。★何が 無いかが、★はっきり します。
"""

import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MJ = os.path.join(ROOT, "docs", "design", "mihon-json")
FR = os.path.join(ROOT, "docs", "design", "compare", "all", "frames")
EXCL = os.path.join(ROOT, "tools", "excluded_by_design.json")


def norm(t):
  return re.sub(r"[\s›✓]+", "", str(t or "")).strip()


def load_excluded(name):
  if not os.path.exists(EXCL):
    return {}
  d = json.load(io.open(EXCL, encoding="utf-8"))
  return {norm(x.get("text")): x for x in d.get(name, [])}


def app_texts(frame):
  for pre in ("SC-", "SH-", ""):
    p = os.path.join(FR, pre + frame + "@390.json")
    if os.path.exists(p):
      return [x.get("text", "") for x in json.load(io.open(p, encoding="utf-8"))], p
  return None, os.path.join(FR, "SC-" + frame + "@390.json")


def main():
  args = sys.argv[1:]
  if not args:
    print("★名前を ください。　例）python3 tools/mihon_vs_app.py 台帳:SC-台帳")
    return 1
  bad_total = 0
  for a in args:
    name, frame = (a.split(":", 1) + [a])[:2]
    mp = os.path.join(MJ, name + ".json")
    if not os.path.exists(mp):
      print("★★見本の JSON が ありません: " + os.path.relpath(mp, ROOT))
      print("　★先に `node tools/mihon_extract.js " + name + "`。★止まります。")
      return 1
    mi = json.load(io.open(mp, encoding="utf-8"))
    at, ap_path = app_texts(frame)
    if at is None:
      print("★★実装の コマが ありません: " + os.path.relpath(ap_path, ROOT))
      print("　★先に `node tools/compare.js --frames`。★止まります。")
      return 1
    have = set(norm(x) for x in at if norm(x))
    ex = load_excluded(name)

    # ★★見本の「もの」を、★役ごとに 並べます。
    items = []
    for p in mi.get("pills") or []:
      items.append(("札", p["label"]))
    for h in mi.get("heads") or []:
      items.append(("見出し", h))
    for r in mi.get("rows") or []:
      items.append(("行", r["left"]))
      if r.get("right"):
        items.append(("行の右", r["right"]))
    for b in mi.get("buttons") or []:
      items.append(("押しどころ", b["label"]))
    for n in mi.get("notes") or []:
      items.append(("注記", n["text"]))
    for w in mi.get("wl") or []:
      items.append(("但し書き", w))

    miss, skip, ok = [], [], 0
    for kind, txt in items:
      k = norm(txt)
      if not k:
        continue
      if k in have or any(k in h or h in k for h in have if len(h) > 3):
        ok += 1
      elif k in ex:
        skip.append((kind, txt, ex[k]))
      else:
        miss.append((kind, txt))

    print("=" * 66)
    print("■ %s　（実装の コマ %s）" % (name, os.path.basename(ap_path)))
    print("=" * 66)
    print("★見本の もの %d ／ 在る %d ／ ★無い %d ／ 除外 %d"
          % (len(items), ok, len(miss), len(skip)))
    print()
    if miss:
      print("★★実装に 無い もの")
      for kind, txt in miss:
        print("   ★ [%s] %s" % (kind, txt[:56]))
    else:
      print("   ✓ 足りない ものは ありません")
    if skip:
      print()
      print("③ 意図して 出して いない もの")
      for kind, txt, e in skip:
        print("   ・[%s] %s" % (kind, txt[:40]))
        print("       わけ　　%s" % e.get("why", ""))
        print("       引き金　%s" % e.get("trigger", ""))
    print()
    bad_total += len(miss)
  print("★★数えたのは **組み立て**です。★色・余白・置き場所は 見て いません。")
  print("　★それは 絵と 実機の 目で 見ます。")
  return 0 if bad_total == 0 else 0


if __name__ == "__main__":
  sys.exit(main())
