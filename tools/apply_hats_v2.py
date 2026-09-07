# -*- coding: utf-8 -*-
# ★帽子3点を acc_v2 で作り直します（2026-09-08・坂本さんの決め）
#
#   ★★入れ替えるのは3点だけです。★ニット帽・ベレー・中折れ。
#     ★キャップ・フード・コック帽は、★いまの絵のままにします。
#       ★acc_v2 のフードは輪だけが浮き、★コック帽は白に白で見えません。
#       ★キャップは、いまの丸い形のほうがきれいです。
#
#   ★★様式は tools/acnh_style.py の restyle を、そのまま通します。
#     ★他の200点あまりと、★同じ通り道でなければ、★3点だけ質感が違います。
#   ★★形式も P形式です。★他と同じにします。
#
#   ★★耳は、頭の絵から取ります。
#     ★acc.py が読む orig_sheep.png は、この repo にありません。
#     ★体＋頭 を重ねたもので代えました。
#     ★★体は、耳の画素を1つも出しません（★0画素と確かめました）。
#       ★だから、★頭だけから取ったものと、★色まで まったく同じです。
#
#   ★戻し方
#     git checkout 30957aa -- public/sheep/items
#
#   使い方
#     python3 tools/apply_hats_v2.py            … 作って、見比べる紙だけ出す
#     python3 tools/apply_hats_v2.py --write    … 実際に入れ替える

import sys, os, types, importlib.util
sys.path.insert(0, os.path.dirname(__file__))
for n in ("garment", "catalog", "feet"):
    sys.modules[n] = types.ModuleType(n)
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import acnh_style as A

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "public/sheep/items")

head = Image.open(os.path.join(ROOT, "public/sheep/sheep_head.png")).convert("RGBA")
body = Image.open(os.path.join(ROOT, "public/sheep/sheep_body.png")).convert("RGBA")
W, H = head.size
orig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
orig.alpha_composite(body); orig.alpha_composite(head)

spec = importlib.util.spec_from_file_location("accv2", os.path.join(ROOT, "tools/from-opus/acc_v2.py"))
v2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(v2)
v2.EARIMG = v2._make_ear_layer(orig)     # ★使う側で1度だけ、と書いてあります

# ★★入れ替える3点だけ。★これ以上 増やさないこと。
REPLACE = [
    ("hats_02", "ニット帽",   v2.hat_knit),
    ("hats_03", "ベレー",     v2.hat_beret),
    ("hats_04", "中折れハット", v2.hat_fedora),
]

def to_palette(st):
    """★apply_pal.py と同じ手です。★2つに分かれないよう、同じ値を使います。"""
    a = np.array(st.getchannel("A"))
    opaque = a >= 128
    if not opaque.any():
        return None
    rgb = st.convert("RGB").quantize(colors=255, method=Image.Quantize.FASTOCTREE,
                                     dither=Image.Dither.NONE)
    idx = np.array(rgb)
    idx[~opaque] = 255
    out = Image.fromarray(idx).convert("P")
    pal = rgb.getpalette()[:255 * 3] + [0, 0, 0]
    out.putpalette(pal)
    return out

write = "--write" in sys.argv
befores, afters = [], []
for key, name, fn in REPLACE:
    p = os.path.join(D, key + ".png")
    befores.append(Image.open(p).convert("RGBA"))
    raw = fn()                                  # ★acc_v2 の生の絵（RGBA）
    st = A.restyle(raw)                         # ★他の200点と、同じ様式
    out = to_palette(st)
    assert out is not None, key + " が空です"
    # ★★透明の目印は、保存のときだけでなく、★見比べる紙にも要ります。
    #   ★これを入れずに RGBA へ直すと、★255番が真っ黒になります。
    prev = out.copy(); prev.info["transparency"] = 255
    afters.append(prev.convert("RGBA"))
    if write:
        out.save(p, optimize=True, transparency=255)
        print("★入れ替えました %s（%s）  %.1fKB" % (key, name, os.path.getsize(p)/1024))
    else:
        print("★作りました（まだ書いていません） %s（%s）" % (key, name))

# ── 見比べる紙 ──────────────────────────────────
def onsheep(img):
    p = Image.new("RGBA", (W, H), (255, 253, 248, 255))
    p.alpha_composite(body); p.alpha_composite(head); p.alpha_composite(img)
    return p

try: font = ImageFont.truetype("/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc", 22)
except Exception: font = ImageFont.load_default()
S, G, LB = 300, 22, 34
sheet = Image.new("RGB", (G+(S+G)*3, G+(S+LB+G)*2+20), (247, 242, 230))
d = ImageDraw.Draw(sheet)
for ri, (title, imgs) in enumerate([("いまの絵", befores), ("★入れ替えたあと（様式ずみ・P形式）", afters)]):
    y = G + (S+LB+G)*ri
    d.text((G, y-4), title, fill=(60, 50, 40), font=font)
    for ci, im in enumerate(imgs):
        x = G + (S+G)*ci
        sheet.paste(onsheep(im).convert("RGB").resize((S, S), Image.LANCZOS), (x, y+LB))
        d.text((x, y+LB+S+4), "%s  %s" % (REPLACE[ci][0], REPLACE[ci][1]), fill=(90, 80, 70), font=font)
dest = sys.argv[-1] if sys.argv[-1].endswith(".png") else os.path.join(ROOT, "帽子3点-入れ替え.png")
sheet.save(dest)
print("★見比べる紙:", dest)
