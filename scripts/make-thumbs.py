# ============================================================================
# 一覧のための、小さい絵を 作ります（2026-09-08 夜）
#
#   ★★もとの絵は 1024×1024。★72px の1マスに描くために、
#     ★1枚ごとに 100万画素を 展開していました。★これが「遅い」の 正体です。
#   ★★144×144（2万画素、★もとの50分の1）を、★別に 作ります。
#   ★★中身の枠で 切り抜いてから 縮めます。
#     ★一覧の切り抜きは よい、というご指示です（★着ているときは 切りません）。
#
#   ★使い方  python3 scripts/make-thumbs.py
#   ★★もうある絵は、作り直しません。★作り直したいときは thumbs/ を消します。
# ============================================================================
from PIL import Image
import json, os, sys

SIZE = 144
OUT = "public/sheep/thumbs"

def targets():
    out = []
    w = json.load(open("docs/assets/sheep-items-index.json"))
    for i in (w if isinstance(w, list) else w.get("items", [])):
        if i.get("file"): out.append((i["key"], "public/sheep/" + i["file"]))
        for side, ff in (i.get("files") or {}).items():
            out.append((i["key"] + "__" + side, "public/sheep/" + ff))
    n = json.load(open("docs/assets/sheep-interior-index.json"))
    for i in n.get("items", []):
        if i.get("file"): out.append((i["key"], "public/sheep/" + i["file"]))
    return out

os.makedirs(OUT, exist_ok=True)
made = skip = miss = 0
for key, path in targets():
    dst = os.path.join(OUT, key + ".png")
    if not os.path.exists(path): miss += 1; continue
    if os.path.exists(dst): skip += 1; continue
    im = Image.open(path).convert("RGBA")
    bb = im.split()[3].getbbox() or im.getbbox()
    if bb: im = im.crop(bb)
    im.thumbnail((SIZE, SIZE), Image.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2))
    # ★★色数を 128 に 落とします。★1枚 3.4KB ほどに なります。
    canvas.quantize(colors=128, method=Image.FASTOCTREE).save(dst, optimize=True)
    made += 1
print("★作った %d ／ もとから有り %d ／ 絵が無い %d" % (made, skip, miss))
