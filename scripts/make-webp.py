# ============================================================================
# 大きい絵を WebP にします（2026-09-09）
#
#   ★★1024×1024 の PNG が、★いちばん 重いところです。
#     ★羊の土台 94KB → 13KB（86%減）／着せかえ 52KB → 11KB（79%減）
#     ★床壁 69KB → 5KB（93%減）
#   ★★絵は 作り直しません。★形を 変えるだけです。
#   ★★PNG は 消しません。★読めない端末のために 残します。
#     ★画面は WebP を 先に 出し、★読めなければ PNG に 戻します。
#
#   ★使い方  python3 scripts/make-webp.py
#   ★もうある .webp は 作り直しません。
# ============================================================================
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import os, sys

# ★★一覧の 小さい絵（thumbs）は 入れません。★1枚 3.4KB で、変える意味が 薄いためです。
DIRS = [
    "public/sheep",
    "public/sheep/face",
    "public/sheep/items",
    "public/sheep/cloth",
    "public/sheep/mask",
    "public/sheep/interior",
    "public/sheep/interior/tiles",
    "public/sheep/windowhole",
]
QUALITY = 86
# ★★1枚ずつ 順に 変えると、★2時間 かかりました（★2026-09-09 に 測りました）。
#   ★★同時に 8枚 進めます。★method も 6 → 4 に します。
#   ★大きさは ほとんど 変わりません（★数％）。★速さが 何倍にも なります。
jobs = []
skip = 0
for d in DIRS:
    if not os.path.isdir(d):
        continue
    for f in sorted(os.listdir(d)):
        if not f.endswith(".png"):
            continue
        src = os.path.join(d, f)
        dst = src[:-4] + ".webp"
        if os.path.exists(dst):
            skip += 1
            continue
        jobs.append((src, dst))

def one(job):
    src, dst = job
    im = Image.open(src).convert("RGBA")
    im.save(dst, "WEBP", quality=QUALITY, method=4)
    return os.path.getsize(src), os.path.getsize(dst)

before = after = 0
made = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    for a2, b2 in ex.map(one, jobs):
        before += a2
        after += b2
        made += 1
print("★作った %d ／ もとから有り %d" % (made, skip))
if made:
    print("★%.1f MB → %.1f MB（★%.0f%% 減）"
          % (before / 1048576, after / 1048576, (1 - after / before) * 100))
