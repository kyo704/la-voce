# -*- coding: utf-8 -*-
# ★あつ森様式を、P形式で当てます（2026-09-08・坂本さんの決め）
#
#   ★出どころ acnh/parts/acnh_style.py の restyle()
#
#   ★★なぜ P形式か
#     ★restyle の felt()（布の粒）は、1画素ごとの雑音です。
#     ★PNG は雑音を圧縮できないので、24KB → 942KB になりました。
#     ★★ところが、画面で羊が出るのは いちばん大きくて 240px。
#       ★1024px を 240px に縮めると、★約18画素が1画素に平均されます。
#       ★粒は、そこで消えます。
#     ★測りました。942KB版 と P形式版の差は、240px で 1.03（0〜255のうち）。
#       ★1%未満です。★見分けがつきません。
#     ★★だから、★見た目を保ったまま、★14分の1にできます。
#
#   ★★透明は、しきい値で2値にします。
#     ★元の絵の半透明は 0.44% しかなく、★ずれた画素は 0 でした。
#
#   ★元の絵は git にあります。★戻す命令：
#     git checkout e875cbe -- public/sheep/items
import sys, os, types, time
sys.path.insert(0, os.path.dirname(__file__))
for n in ("garment", "catalog", "feet"):
    sys.modules[n] = types.ModuleType(n)
from PIL import Image
import numpy as np
import acnh_style as A

D = "/Users/sakamotokyou/Desktop/la-voce/public/sheep/items"

def to_palette(st):
    a = np.array(st.getchannel("A"))
    opaque = a >= 128
    if not opaque.any():
        return None                     # ★中身が無い絵は、そのままにします
    rgb = st.convert("RGB").quantize(colors=255, method=Image.Quantize.FASTOCTREE,
                                     dither=Image.Dither.NONE)
    idx = np.array(rgb)
    idx[~opaque] = 255
    out = Image.fromarray(idx).convert("P")
    pal = rgb.getpalette()[:255 * 3] + [0, 0, 0]
    out.putpalette(pal)
    return out

files = sorted(f for f in os.listdir(D) if f.endswith(".png"))
print("★対象:", len(files), "枚", flush=True)
t0 = time.time(); ok = 0; skipped = []
for i, f in enumerate(files, 1):
    p = os.path.join(D, f)
    try:
        st = A.restyle(Image.open(p).convert("RGBA"))
        out = to_palette(st)
        if out is None:
            skipped.append(f); continue
        out.save(p, optimize=True, transparency=255)
        ok += 1
    except Exception as e:
        skipped.append(f"{f}: {e}")
    if i % 50 == 0:
        print(f"  … {i}/{len(files)}  {time.time()-t0:.0f}秒", flush=True)
print(f"★終わり: {ok}/{len(files)} 枚  {time.time()-t0:.0f}秒", flush=True)
if skipped:
    print("★飛ばしたもの:", skipped[:10], flush=True)
