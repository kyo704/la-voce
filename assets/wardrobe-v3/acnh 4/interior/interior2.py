# -*- coding: utf-8 -*-
"""おうちの内装 v2 ── 家具・窓・扉・景色・庭・壁掛け
   規約：家具/庭の置物/壁掛け 320×320 ／ 窓枠 384×384 ／ 扉 320×512
        窓の景色 480×320 ／ 庭の景観 960×540 ／ 壁床タイル 256×256"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, math, random

def sh(c,d=0.18): return tuple(max(0,int(v*(1-d))) for v in c)
def li(c,d=0.16): return tuple(min(255,int(v+(255-v)*d)) for v in c)
def canvas(w,h): return Image.new('RGBA',(w,h),(0,0,0,0))
def outline(img,col,w=5):
    a=np.array(img); m=(a[:,:,3]>10).astype('uint8')*255
    mi=Image.fromarray(m).filter(ImageFilter.MinFilter(w))
    a[(m>0)&(np.array(mi)==0)]=(*col,255); return Image.fromarray(a)

# ── 素材 ─────────────────────────────────────────────
def wood(d, box, c, grain=True, vert=False, r=6):
    d.rounded_rectangle(box,r,fill=(*c,255))
    x0,y0,x1,y1=box
    if grain:
        rnd=random.Random(int(x0*7+y0*13))
        if vert:
            for x in range(int(x0)+7,int(x1)-3,11):
                d.line([(x,y0+3),(x+rnd.randint(-2,2),y1-3)],fill=(*sh(c,0.10),255),width=2)
        else:
            for y in range(int(y0)+6,int(y1)-3,10):
                d.line([(x0+3,y),(x1-3,y+rnd.randint(-2,2))],fill=(*sh(c,0.10),255),width=2)
    d.rounded_rectangle([x0,y0,x1,y0+max(3,(y1-y0)//9)],r,fill=(*li(c,0.16),255))

def metal(d, box, c, r=5):
    d.rounded_rectangle(box,r,fill=(*c,255))
    x0,y0,x1,y1=box
    d.line([(x0+3,y0+3),(x0+3,y1-3)],fill=(*li(c,0.5),255),width=3)
    d.line([(x1-3,y0+3),(x1-3,y1-3)],fill=(*sh(c,0.3),255),width=3)

def fabric(d, box, c, r=14, tuft=0):
    d.rounded_rectangle(box,r,fill=(*c,255))
    x0,y0,x1,y1=box
    d.rounded_rectangle([x0,y0,x1,y0+(y1-y0)//3],r,fill=(*li(c,0.09),255))
    d.arc([x0,y1-(y1-y0)//2,x1,y1+(y1-y0)//2],200,340,fill=(*sh(c,0.14),255),width=3)
    if tuft:
        for i in range(tuft):
            for j in range(2):
                cx=x0+(x1-x0)*(i+0.5)/tuft; cy=y0+(y1-y0)*(0.34+0.36*j)
                d.ellipse([cx-4,cy-4,cx+4,cy+4],fill=(*sh(c,0.24),255))

def glass(d, box, tint=(196,220,228), a=120, shine=True):
    im_box=[int(v) for v in box]
    d.rectangle(im_box,fill=(*tint,a))
    if shine:
        x0,y0,x1,y1=im_box
        d.polygon([(x0+6,y1-6),(x0+(x1-x0)*0.45,y0+6),(x0+(x1-x0)*0.62,y0+6),(x0+6,y1-(y1-y0)*0.5)],
                  fill=(255,255,255,70))

def rattan(d, box, c):
    x0,y0,x1,y1=box
    d.rounded_rectangle(box,10,fill=(*c,255))
    for x in range(int(x0)+6,int(x1)-4,14): d.line([(x,y0+4),(x,y1-4)],fill=(*sh(c,0.16),255),width=4)
    for y in range(int(y0)+6,int(y1)-4,14): d.line([(x0+4,y),(x1-4,y)],fill=(*li(c,0.18),255),width=4)

def tatami(d, box, c=(196,196,140), edge=(60,64,52)):
    x0,y0,x1,y1=box
    d.rectangle(box,fill=(*c,255))
    for y in range(int(y0),int(y1),6): d.line([(x0,y),(x1,y)],fill=(*sh(c,0.07),255),width=2)
    d.rectangle([x0,y0,x1,y0+7],fill=(*edge,255)); d.rectangle([x0,y1-7,x1,y1],fill=(*edge,255))

# ── 家具の作り（320×320。床に接する位置＝y300 に揃える）─────
S=320; FLOOR=300
def base():
    return canvas(S,S), None

def sofa(seat, frame=None, legs=(120,86,62), style='soft', cushions=2,
         arm='round', ol=None, tuft=0, back_h=118):
    im=canvas(S,S); d=ImageDraw.Draw(im)
    y0=FLOOR-back_h-64; 
    if style=='rattan':
        rattan(d,[34,y0,286,FLOOR-52],frame or (198,166,116))
    elif frame:
        wood(d,[30,y0+10,290,FLOOR-46],frame,vert=False,r=10)
    # 背もたれ
    fabric(d,[46,y0,274,y0+96],seat,r=18,tuft=tuft)
    # 肘
    for x in (34,262):
        if arm=='round': d.rounded_rectangle([x,y0+44,x+26,FLOOR-52],13,fill=(*sh(seat,0.10),255))
        elif arm=='square': d.rectangle([x,y0+40,x+26,FLOOR-52],fill=(*sh(seat,0.12),255))
    # 座面
    for i in range(cushions):
        w=(200)//cushions
        fabric(d,[52+i*w,y0+86,52+(i+1)*w-6,FLOOR-56],li(seat,0.05),r=13)
    # 脚
    for x in (56,246):
        d.polygon([(x,FLOOR-56),(x+18,FLOOR-56),(x+13,FLOOR),(x+5,FLOOR)],fill=(*legs,255))
    return outline(im,ol) if ol else im

def chair(seat, frame=(150,112,68), back='slat', legs='taper', ol=None, cushion=None):
    im=canvas(S,S); d=ImageDraw.Draw(im)
    if back=='slat':
        for i,x in enumerate(range(108,214,26)):
            wood(d,[x,120,x+15,214],frame,vert=True,r=5)
        wood(d,[100,110,222,132],frame,r=6)
    elif back=='round':
        d.arc([98,104,224,232],180,360,fill=(*frame,255),width=17)
        wood(d,[100,196,222,216],frame,r=6)
    elif back=='panel':
        wood(d,[104,112,218,214],frame,vert=True,r=7)
    wood(d,[92,214,230,236],frame,r=7)                 # 座枠
    fabric(d,[96,208,226,232],cushion or seat,r=8)
    for x,inw in ((100,7),(214,-7)):
        d.polygon([(x,236),(x+16,236),(x+16-inw,FLOOR),(x+inw,FLOOR)],fill=(*frame,255))
    d.line([(108,272),(222,272)],fill=(*sh(frame,0.2),255),width=7)
    return outline(im,ol) if ol else im

def table(top, legs=None, shape='round', h=96, thick=16, mat='wood', ol=None):
    im=canvas(S,S); d=ImageDraw.Draw(im); legs=legs or sh(top,0.28)
    ty=FLOOR-h
    if shape=='round':
        d.ellipse([40,ty-16,280,ty+thick+10],fill=(*top,255))
        d.ellipse([40,ty-16,280,ty+2],fill=(*li(top,0.13),255))
        d.polygon([(150,ty+16),(170,ty+16),(184,FLOOR),(136,FLOOR)],fill=(*legs,255))
        d.ellipse([116,FLOOR-14,204,FLOOR+8],fill=(*sh(legs,0.14),255))
    else:
        if mat=='glass': glass(d,[38,ty,282,ty+thick])
        else: wood(d,[38,ty,282,ty+thick],top,r=5)
        for x in (56,246):
            d.rectangle([x,ty+thick,x+18,FLOOR],fill=(*legs,255))
            d.line([(x+3,ty+thick),(x+3,FLOOR)],fill=(*li(legs,0.35),255),width=3)
        if mat!='glass': d.line([(66,FLOOR-30),(254,FLOOR-30)],fill=(*legs,255),width=9)
    return outline(im,ol) if ol else im

def pendant(shade, cord=(70,66,60), shape='cone', bulb=(252,236,180), ol=None):
    im=canvas(S,S); d=ImageDraw.Draw(im)
    d.line([(160,0),(160,96)],fill=(*cord,255),width=6)
    if shape=='cone':   d.polygon([(160,96),(232,176),(88,176)],fill=(*shade,255))
    elif shape=='dome': d.pieslice([84,96,236,248],180,360,fill=(*shade,255))
    elif shape=='ball': d.ellipse([98,100,222,224],fill=(*shade,255))
    elif shape=='drum': d.rounded_rectangle([96,110,224,196],10,fill=(*shade,255))
    elif shape=='metal':
        d.pieslice([80,92,240,236],180,360,fill=(*shade,255))
        d.arc([80,92,240,236],180,360,fill=(*sh(shade,0.3),255),width=6)
    d.ellipse([144,168,176,206],fill=(*bulb,255))
    d.ellipse([120,190,200,246],fill=(255,244,196,60))
    return outline(im,ol) if ol else im

def floorlamp(shade, pole=(120,120,126), shape='drum', ol=None):
    im=canvas(S,S); d=ImageDraw.Draw(im)
    d.rectangle([154,120,166,FLOOR-14],fill=(*pole,255))
    d.line([(157,120),(157,FLOOR-14)],fill=(*li(pole,0.4),255),width=3)
    d.ellipse([112,FLOOR-22,208,FLOOR+8],fill=(*sh(pole,0.2),255))
    if shape=='drum':  d.polygon([(104,116),(216,116),(206,44),(114,44)],fill=(*shade,255))
    elif shape=='cone':d.polygon([(96,120),(224,120),(196,40),(124,40)],fill=(*shade,255))
    elif shape=='ball':d.ellipse([106,36,214,144],fill=(*shade,255))
    d.ellipse([104,110,216,132],fill=(*li(shade,0.2),255))
    return outline(im,ol) if ol else im
