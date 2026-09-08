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
# ★名簿の言い方 → 動くときの言い方（★lib/thumbs.js と 同じ表です）
SIDE_FROM_FILES = {"left": "L", "both": "C", "right": "R"}

def targets():
    out = []
    w = json.load(open("docs/assets/sheep-items-index.json"))
    for i in (w if isinstance(w, list) else w.get("items", [])):
        if i.get("file"): out.append((i["key"], "public/sheep/" + i["file"]))
        # ★★持ちものの「置き場所」の 言い方は、★2つ あります。
        #   ★名簿（files）　left ／ right ／ both
        #   ★動くとき　　　 L ／ C ／ R（lib/sheepWardrobe.js の PROP_SIDES）
        # ★★2026-09-09、★名簿の言い方で 作っていて、★実機で 404 が 出ました。
        #   ★画面が 探すのは 動くときの言い方です。★そちらに そろえます。
        for side, ff in (i.get("files") or {}).items():
            code = SIDE_FROM_FILES.get(side, side)
            out.append((i["key"] + "__" + code, "public/sheep/" + ff))
        # ★★面を 持たない 持ちもの（★食器2点）にも、★面の名前で 置きます。
        #   ★★2026-09-09、★実機で __R が 404 でした。
        #     ★呼ぶ側は 直しましたが、★古い束を 読んでいる方には まだ 出ます。
        #   ★★どの面から 見ても 同じ絵なので、★3つとも 同じものを 置きます。
        #     ★ごまかしでは ありません。★1枚しか無い品は、どの面でも その1枚です。
        if i.get("slot") == "prop" and not i.get("files") and i.get("file"):
            for code in ("L", "C", "R"):
                out.append((i["key"] + "__" + code, "public/sheep/" + i["file"]))
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
