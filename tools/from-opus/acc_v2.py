# -*- coding: utf-8 -*-
"""
帽子の直し v2（2026年9月8日・Opus）
★acc.py を置き換えるものではありません。★直した関数だけを集めたものです。
★acc.py から sh / li / new / bake_ears / orig / head / body を借ります。

直したところ
  ① bake_ears を「全部の帽子に一律」から「帽子ごとに選ぶ」へ
       耳を出す　  麦わら・中折れ・バケット・王冠・カチューシャ・ヘアバンド → bake_ears
       耳を覆う　  ニット帽・フード・コック帽 → ★ear_bumps（帽子の上に膨らみだけ描く）
  ② 形の特徴を作る
       キャップ  つば（chord）＋6枚パネルの縫い目＋トップボタン＋額のバンド
       ベレー    ★7度 傾ける。つまみを右上へ。ふちの影
       中折れ    ★クラウン中央のくぼみ＋左右のつまみ
       フード    外側の楕円から ★顔の楕円と首から下を引く
       コック帽  ふくらみを3つ・大きく
"""
from PIL import Image, ImageDraw
import numpy as np, math

W = H = 1024
CX = 511

def sh(c, d): return tuple(max(0, int(v * (1 - d))) for v in c)
def li(c, d): return tuple(min(255, int(v + (255 - v) * d)) for v in c)
def new(): return Image.new('RGBA', (W, H), (0, 0, 0, 0))

# ── 耳（acc.py と同じ抽出）────────────────────────────
def _make_ear_layer(orig):
    o = np.array(orig).astype(int)
    r, g, b, al = o[:, :, 0], o[:, :, 1], o[:, :, 2], o[:, :, 3]
    gold = (al > 60) & (r > 150) & (r < 240) & (g > 110) & (g < 200) & (b < 150)
    dark = (al > 60) & (r < 150) & (g < 130) & (b < 110)
    box = np.zeros((H, W), bool)
    box[70:240, 335:435] = True
    box[70:240, 590:690] = True
    m = (gold | dark) & box
    el = np.zeros((H, W, 4), 'uint8')
    el[m] = np.array(orig)[m]
    return Image.fromarray(el)

EARIMG = None   # 使う側で EARIMG = _make_ear_layer(orig) を1度だけ

def bake_ears(l):
    """★耳を帽子の上に描き戻す（つば・輪の帽子だけ）"""
    out = l.copy(); out.alpha_composite(EARIMG); return out

def ear_bumps(l, col, strong=0.13):
    """★耳を覆う帽子で、帽子の布ごしに耳の形を浮き出させる"""
    d = ImageDraw.Draw(l)
    for cx in (385, 640):
        d.ellipse([cx - 34, 88, cx + 34, 222], fill=(*sh(col, strong * 0.6), 255))
        d.ellipse([cx - 22, 106, cx + 22, 200], fill=(*sh(col, strong * 1.5), 255))
    return l

# ── 直した帽子 ────────────────────────────────────
def hat_cap(col=(44, 58, 92)):
    """キャップ。★つばは chord を1つだけにすること（2つ重ねると縁が二重に出ます）"""
    bill = sh(col, 0.26)
    l = new(); d = ImageDraw.Draw(l)
    d.chord([214, 206, 808, 372], 8, 172, fill=(*bill, 255))          # ★つばは1枚
    d.rounded_rectangle([292, 126, 730, 286], 136, fill=(*col, 255))
    d.rounded_rectangle([292, 126, 730, 214], 126, fill=(*li(col, 0.13), 255))
    for x in (404, 511, 618):
        d.line([(x, 136), (x, 280)], fill=(*sh(col, 0.16), 255), width=5)
    d.ellipse([496, 104, 526, 134], fill=(*sh(col, 0.20), 255))
    d.rounded_rectangle([292, 258, 730, 290], 16, fill=(*sh(col, 0.13), 255))
    return bake_ears(l)

def hat_beret(col=(132, 12, 36)):
    """ベレー。★7度 傾ける・つまみは右上"""
    l = new()
    layer = new(); dd = ImageDraw.Draw(layer)
    dd.ellipse([214, 58, 806, 282], fill=(*col, 255))
    dd.ellipse([246, 58, 806, 222], fill=(*li(col, 0.15), 255))
    dd.ellipse([250, 220, 760, 300], fill=(*sh(col, 0.26), 255))
    dd.ellipse([636, 64, 706, 134], fill=(*sh(col, 0.16), 255))
    layer = layer.rotate(-7, resample=Image.BICUBIC, center=(511, 190))
    l.alpha_composite(layer)
    return bake_ears(l)

def hat_knit(col=(168, 52, 60)):
    """ニット帽。★耳は膨らみで表す（bake_ears しない）"""
    l = new(); d = ImageDraw.Draw(l)
    d.rounded_rectangle([262, 58, 760, 268], 152, fill=(*col, 255))
    for x in range(282, 744, 34):
        d.line([(x, 76), (x, 262)], fill=(*sh(col, 0.08), 255), width=10)
    l = ear_bumps(l, col); d = ImageDraw.Draw(l)
    d.rounded_rectangle([244, 206, 778, 312], 52, fill=(*sh(col, 0.15), 255))
    for x in range(258, 770, 30):
        d.line([(x, 216), (x, 304)], fill=(*sh(col, 0.24), 255), width=8)
    d.ellipse([446, 0, 576, 130], fill=(*li(col, 0.24), 255))
    d.ellipse([470, 16, 552, 98], fill=(*li(col, 0.36), 255))
    return l

def hat_fedora(col=(96, 68, 48), band=(48, 36, 28)):
    """中折れ。★クラウン中央のくぼみ＋左右のつまみ"""
    l = new(); d = ImageDraw.Draw(l)
    d.ellipse([158, 198, 864, 344], fill=(*sh(col, 0.10), 255))
    d.ellipse([158, 198, 864, 308], fill=(*col, 255))
    d.ellipse([182, 206, 840, 296], fill=(*li(col, 0.09), 255))
    d.rounded_rectangle([322, 74, 700, 262], 92, fill=(*col, 255))
    d.rounded_rectangle([322, 74, 700, 168], 86, fill=(*li(col, 0.13), 255))
    d.ellipse([432, 58, 590, 150], fill=(*sh(col, 0.20), 255))
    d.ellipse([446, 66, 576, 132], fill=(*sh(col, 0.30), 255))
    d.ellipse([318, 96, 392, 176], fill=(*sh(col, 0.14), 255))
    d.ellipse([630, 96, 704, 176], fill=(*sh(col, 0.14), 255))
    d.rectangle([322, 200, 700, 252], fill=(*band, 255))
    d.rectangle([322, 200, 700, 216], fill=(*li(band, 0.20), 255))
    return bake_ears(l)

def hat_hood(col=(96, 100, 108)):
    """フード。★外側の楕円から、顔の楕円と首から下を引く
       ★耳の膨らみが顔の穴に入るので、ear_bumps は穴を抜いた「あと」に描くこと"""
    l = new(); d = ImageDraw.Draw(l)
    d.ellipse([200, 60, 822, 556], fill=(*sh(col, 0.20), 255))
    d.ellipse([216, 48, 806, 520], fill=(*col, 255))
    d.ellipse([244, 64, 778, 430], fill=(*li(col, 0.11), 255))
    a = np.array(l)
    yy, xx = np.mgrid[0:H, 0:W]
    face = ((xx - 511) / 244.0) ** 2 + ((yy - 330) / 224.0) ** 2 <= 1.0
    below = yy > 556
    a[:, :, 3][face | below] = 0
    l = Image.fromarray(a)
    l = ear_bumps(l, col)                       # ★穴を抜いたあとに描く
    d = ImageDraw.Draw(l)
    d.arc([236, 52, 786, 530], 196, 344, fill=(*sh(col, 0.30), 255), width=22)
    return l

def hat_cook(col=(252, 250, 246)):
    """コック帽。★ふくらみ3つ・バンドは頭を覆いすぎない高さに"""
    l = new(); d = ImageDraw.Draw(l)
    for cx, cy, rr in ((352, 128, 132), (511, 74, 148), (672, 128, 132)):
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(*col, 255))
        d.ellipse([cx - rr + 16, cy - rr + 12, cx + rr - 30, cy + rr - 46],
                  fill=(*li(col, 0.55), 255))
    d.ellipse([286, 132, 738, 318], fill=(*col, 255))
    l = ear_bumps(l, col, 0.10); d = ImageDraw.Draw(l)
    d.rounded_rectangle([298, 236, 724, 330], 28, fill=(*sh(col, 0.07), 255))
    for x in range(314, 716, 24):
        d.line([(x, 248), (x, 322)], fill=(*sh(col, 0.13), 255), width=6)
    d.rounded_rectangle([298, 236, 724, 260], 14, fill=(*li(col, 0.5), 255))
    return l
