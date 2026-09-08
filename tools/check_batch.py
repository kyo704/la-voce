# -*- coding: utf-8 -*-
# ★★届いた166点を、★入れ替える前に確かめます（2026-09-08）
#
#   ★★入れ替えは、★フォルダごとです（★1点ずつではありません・坂本さんの決め）。
#     ★だから、★入れる前に、★まとめて確かめます。
#
#   ★★9月8日に起きたことを、★二度と起こさないための検査です。
#     ★17点だけが別の裁ち方で焼かれていて、★上着が下を覆いました。
#
#   使い方
#     python3 tools/check_batch.py <届いたフォルダ>
#
#   ★何も書き替えません。★見るだけです。

import sys, os, json
from PIL import Image
import numpy as np
import statistics as st

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else None
if not SRC or not os.path.isdir(SRC):
    print("★フォルダを渡してください： python3 tools/check_batch.py <フォルダ>"); sys.exit(2)

idx = json.load(open(os.path.join(ROOT, "docs/assets/sheep-items-index.json"), encoding="utf-8"))
daily = [i for i in idx["items"] if i["group"] == "daily"]
keys = [i["key"] for i in daily]
fail = 0
def ok(c, m):
    global fail
    print(("  ○ " if c else "  ✗ ") + m)
    if not c: fail += 1

def find(key, kind):
    for pat in ("%s_%s.png" % (key, kind), os.path.join(kind, "%s.png" % key)):
        p = os.path.join(SRC, pat)
        if os.path.exists(p): return p
    return None

def bbox(p):
    a = np.array(Image.open(p).convert("RGBA")); m = a[:, :, 3] > 10
    if not m.any(): return None
    ys, xs = np.nonzero(m)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())

print("★① そろっているか（★ふだんぎ %d点）" % len(daily))
missL = [k for k in keys if not find(k, "light")]
missD = [k for k in keys if not find(k, "dark")]
ok(not missL, "light が %d点ぶん ある" % (len(keys) - len(missL)) + (("★足りない：" + ",".join(missL[:6])) if missL else ""))
ok(not missD, "dark が %d点ぶん ある" % (len(keys) - len(missD)) + (("★足りない：" + ",".join(missD[:6])) if missD else ""))
masks = [k for k in keys if find(k, "mask")]
print("   （★柄の3枚目 mask：%d点）" % len(masks))

print("★② 大きさと、形")
bad = []
for k in keys:
    for kind in ("light", "dark"):
        p = find(k, kind)
        if not p: continue
        im = Image.open(p)
        if im.size != (1024, 1024): bad.append("%s_%s %s" % (k, kind, im.size))
ok(not bad, "すべて 1024×1024" + (("★違う：" + ", ".join(bad[:4])) if bad else ""))
# ★★light と dark は、★同じ形（アルファ）でなければなりません。
diffA = []
for k in keys:
    pl, pd = find(k, "light"), find(k, "dark")
    if not (pl and pd): continue
    al = np.array(Image.open(pl).convert("RGBA"))[:, :, 3]
    ad = np.array(Image.open(pd).convert("RGBA"))[:, :, 3]
    if not np.array_equal(al, ad): diffA.append(k)
ok(not diffA, "light と dark の形が、同じ" + (("★違う：" + ",".join(diffA[:6])) if diffA else ""))
# ★★mask は、灰色階調であること。
notGray = []
for k in masks:
    a = np.array(Image.open(find(k, "mask")).convert("RGBA")).astype(int)
    m = a[:, :, 3] > 10
    if not m.any(): continue
    s = (a[:, :, :3][m].max(1) - a[:, :, :3][m].min(1)).max()
    if s > 2: notGray.append("%s(%d)" % (k, s))
ok(not notGray, "mask が灰色階調" + (("★違う：" + ",".join(notGray[:6])) if notGray else ""))

print("★③ ★裁ち方が、166点でそろっているか（★9月8日の不具合）")
for slot in ("top", "bottom", "outer"):
    ks = [i["key"] for i in daily if i["slot"] == slot]
    tops, hems = [], []
    for k in ks:
        p = find(k, "light")
        if not p: continue
        b = bbox(p)
        if b: tops.append(b[1]); hems.append(b[3])
    if not hems: continue
    print("   %-7s 肩 %d〜%d（中央 %d） 裾 %d〜%d（中央 %d）"
          % (slot, min(tops), max(tops), int(st.median(tops)),
             min(hems), max(hems), int(st.median(hems))))

print("★④ ★上を着たとき、下が見えるか")
th = [bbox(find(k, "light"))[3] for k in [i["key"] for i in daily if i["slot"] == "top"] if find(k, "light")]
bh = [(bbox(find(k, "light"))[1], bbox(find(k, "light"))[3])
      for k in [i["key"] for i in daily if i["slot"] == "bottom"] if find(k, "light")]
if th and bh:
    hem = int(st.median(th)); bot = int(st.median([b[1] for b in bh])); end = int(st.median([b[1] for b in bh]))
    end = int(st.median([b[1] for b in bh])); low = int(st.median([b[1] for b in bh]))
    low = int(st.median([b[1] for b in bh]))
    bend = int(st.median([b[1] for b in bh]))
    bbot = int(st.median([b[1] for b in bh]))
    bbot = int(st.median([b[1] for b in bh]))
    lowend = int(st.median([b[1] for b in bh]))
    bfin = int(st.median([b[1] for b in bh]))
    bfinal = int(st.median([b[1] for b in bh]))
    bl = int(st.median([b[1] for b in bh]))
    visible = bl - hem
    print("   上の裾 y%d ／ 下の裾 y%d → ★見えている高さ %d 画素" % (hem, bl, visible))
    ok(visible >= 90, "★下が じゅうぶん見えている（★いまは 136 画素）")

print("\n" + ("★すべて通りました" if fail == 0 else "★%d件、確かめてください" % fail))
sys.exit(0 if fail == 0 else 1)
