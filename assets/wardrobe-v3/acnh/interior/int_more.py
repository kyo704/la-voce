# -*- coding: utf-8 -*-
"""窓枠・扉・窓の景色・庭の景観・庭の置物・壁掛け"""
from interior2 import *
import math, random
WQ=384; DW,DH=320,512; VW,VH=480,320; GW,GH=960,540

# ══════ 窓枠（384×384・中は抜く＝景色が透ける）══════
def window(kind, col, pane=None, ol=None):
    im=canvas(WQ,WQ); d=ImageDraw.Draw(im)
    F=26                                   # 枠の太さ
    if kind=='grid':                        # 白い格子
        d.rectangle([10,10,WQ-10,WQ-10],outline=(*col,255),width=F)
        for x in (WQ//3,WQ*2//3): d.line([(x,20),(x,WQ-20)],fill=(*col,255),width=13)
        d.line([(20,WQ//2),(WQ-20,WQ//2)],fill=(*col,255),width=13)
    elif kind=='slim':                      # 黒い細枠
        d.rectangle([16,16,WQ-16,WQ-16],outline=(*col,255),width=15)
        d.line([(WQ//2,22),(WQ//2,WQ-22)],fill=(*col,255),width=10)
    elif kind=='wood':                      # 木の格子
        wood(d,[6,6,WQ-6,WQ-6],col,r=4)
        d.rectangle([6+F,6+F,WQ-6-F,WQ-6-F],fill=(0,0,0,0))
        for x in range(6+F,WQ-6-F,80): d.line([(x,6+F),(x,WQ-6-F)],fill=(*col,255),width=11)
        for y in range(6+F,WQ-6-F,80): d.line([(6+F,y),(WQ-6-F,y)],fill=(*col,255),width=11)
    elif kind=='arch':                      # アーチ
        d.pieslice([10,10,WQ-10,WQ*3//4],180,360,fill=None,outline=(*col,255),width=F)
        d.rectangle([10,WQ*3//8,WQ-10,WQ-10],outline=(*col,255),width=F)
        d.line([(WQ//2,26),(WQ//2,WQ-24)],fill=(*col,255),width=12)
    elif kind=='full':                      # 掃き出し窓
        d.rectangle([8,8,WQ-8,WQ-8],outline=(*col,255),width=20)
        d.line([(WQ//2,16),(WQ//2,WQ-16)],fill=(*col,255),width=16)
        d.line([(16,WQ-70),(WQ-16,WQ-70)],fill=(*col,255),width=10)
    elif kind=='round':                     # 丸窓
        d.ellipse([12,12,WQ-12,WQ-12],outline=(*col,255),width=F)
        d.line([(24,WQ//2),(WQ-24,WQ//2)],fill=(*col,255),width=12)
    elif kind=='iron':                      # 鉄の枠
        metal(d,[10,10,WQ-10,WQ-10],col,r=4)
        d.rectangle([10+F,10+F,WQ-10-F,WQ-10-F],fill=(0,0,0,0))
        for x in range(10+F,WQ-10-F,58): d.line([(x,10+F),(x,WQ-10-F)],fill=(*col,255),width=7)
    elif kind=='sash':                      # 木製サッシ＋すりガラス
        wood(d,[8,8,WQ-8,WQ-8],col,r=3)
        d.rectangle([8+F,8+F,WQ-8-F,WQ-8-F],fill=(232,236,234,190))
        d.line([(WQ//2-7,8+F),(WQ//2-7,WQ-8-F)],fill=(*col,255),width=15)
        for y in range(8+F,WQ-8-F,16): d.line([(8+F,y),(WQ-8-F,y)],fill=(244,246,244,120),width=4)
    elif kind=='shoji':                     # 雪見障子
        wood(d,[8,8,WQ-8,WQ-8],col,r=3)
        d.rectangle([8+18,8+18,WQ-8-18,WQ*3//5],fill=(244,240,228,235))
        for x in range(8+18,WQ-8-18,52): d.line([(x,8+18),(x,WQ*3//5)],fill=(*col,255),width=6)
        for y in range(8+18,WQ*3//5,52): d.line([(8+18,y),(WQ-8-18,y)],fill=(*col,255),width=6)
        d.rectangle([8+18,WQ*3//5+8,WQ-8-18,WQ-8-18],fill=(0,0,0,0))
        d.rectangle([8+18,WQ*3//5,WQ-8-18,WQ*3//5+12],fill=(*col,255))
    elif kind=='ranma':                     # 欄間
        wood(d,[8,8,WQ-8,WQ-8],col,r=3)
        d.rectangle([8+F,8+F,WQ-8-F,WQ-8-F],fill=(0,0,0,0))
        for i in range(7):
            x=8+F+10+i*44
            d.line([(x,8+F),(x,WQ-8-F)],fill=(*col,255),width=9)
            d.arc([x-22,WQ//2-40,x+22,WQ//2+40],0,360,fill=(*col,255),width=6)
    elif kind=='koshi':                     # 格子窓
        wood(d,[8,8,WQ-8,WQ-8],col,r=3)
        d.rectangle([8+F,8+F,WQ-8-F,WQ-8-F],fill=(0,0,0,0))
        for x in range(8+F,WQ-8-F,30): d.line([(x,8+F),(x,WQ-8-F)],fill=(*col,255),width=8)
    elif kind=='stained':                   # ステンドの小窓
        d.rectangle([56,56,WQ-56,WQ-56],outline=(*col,255),width=18)
        cs=[(196,90,86),(96,132,178),(216,186,96),(120,164,124)]
        rnd=random.Random(4)
        for i in range(4):
            for j in range(4):
                x0=74+i*(WQ-148)//4; y0=74+j*(WQ-148)//4
                d.rectangle([x0,y0,x0+(WQ-148)//4-4,y0+(WQ-148)//4-4],
                            fill=(*rnd.choice(cs),210),outline=(*col,255),width=5)
    if pane: d.rectangle([F+14,F+14,WQ-F-14,WQ-F-14],fill=(*pane,110))
    return outline(im,ol) if ol else im

# ══════ 窓の外の景色（480×320）══════
def view(kind):
    im=Image.new('RGBA',(VW,VH),(0,0,0,0)); d=ImageDraw.Draw(im)
    rnd=random.Random(7)
    def sky(a,b):
        for y in range(VH):
            t=y/VH; d.line([(0,y),(VW,y)],fill=tuple(int(a[k]+(b[k]-a[k])*t) for k in range(3))+(255,))
    if kind=='day':
        sky((150,196,232),(224,238,246))
        for cx,cy,r in ((110,80,34),(150,88,26),(340,60,30),(376,66,22)):
            d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=(255,255,255,235))
        d.rectangle([0,250,VW,VH],fill=(150,178,120,255))
    elif kind=='sunset':
        sky((240,166,110),(250,222,180))
        d.ellipse([190,150,290,250],fill=(252,206,120,255))
        d.rectangle([0,246,VW,VH],fill=(120,104,110,255))
    elif kind=='night':
        sky((28,36,66),(64,74,110))
        for _ in range(60):
            x,y=rnd.randrange(VW),rnd.randrange(230)
            d.ellipse([x,y,x+3,y+3],fill=(255,255,240,rnd.randrange(120,255)))
        d.ellipse([350,44,414,108],fill=(246,244,216,255))
        d.rectangle([0,252,VW,VH],fill=(38,44,58,255))
    elif kind=='rain':
        sky((132,142,156),(186,192,198))
        for _ in range(180):
            x,y=rnd.randrange(-40,VW),rnd.randrange(VH)
            d.line([(x,y),(x+9,y+28)],fill=(224,232,238,150),width=2)
        d.rectangle([0,252,VW,VH],fill=(104,116,104,255))
    elif kind=='snow':
        sky((196,206,220),(238,242,246))
        d.rectangle([0,236,VW,VH],fill=(244,246,250,255))
        for _ in range(120):
            x,y=rnd.randrange(VW),rnd.randrange(VH); r=rnd.randrange(2,6)
            d.ellipse([x,y,x+r,y+r],fill=(255,255,255,220))
    elif kind=='forest':
        sky((168,204,222),(226,238,236))
        for i in range(14):
            x=rnd.randrange(-20,VW); h=rnd.randrange(90,190)
            d.polygon([(x,300),(x+46,300),(x+23,300-h)],fill=(*sh((84,124,88),rnd.random()*0.3),255))
        d.rectangle([0,290,VW,VH],fill=(110,140,96,255))
    elif kind=='sea':
        sky((146,198,232),(216,238,246))
        d.rectangle([0,190,VW,VH],fill=(84,148,186,255))
        for y in range(200,VH,16): d.line([(0,y),(VW,y)],fill=(140,190,216,160),width=4)
    elif kind=='town':
        sky((176,204,226),(230,238,242))
        for i in range(9):
            x=i*56; h=rnd.randrange(60,170)
            d.rectangle([x,300-h,x+48,300],fill=(*sh((176,168,158),rnd.random()*0.35),255))
            for j in range(h//34):
                d.rectangle([x+10,300-h+16+j*32,x+38,300-h+34+j*32],fill=(246,232,180,200))
        d.rectangle([0,296,VW,VH],fill=(150,146,140,255))
    elif kind=='rice':                       # 田んぼ
        sky((160,200,228),(226,238,240))
        d.rectangle([0,196,VW,VH],fill=(158,190,110,255))
        for y in range(208,VH,18): d.line([(0,y),(VW,y)],fill=(132,166,90,200),width=5)
    elif kind=='alley':                      # 昭和の路地
        sky((196,204,214),(234,236,232))
        d.polygon([(0,120),(150,220),(150,VH),(0,VH)],fill=(158,142,124,255))
        d.polygon([(VW,120),(330,220),(330,VH),(VW,VH)],fill=(142,128,112,255))
        d.rectangle([150,220,330,VH],fill=(178,172,164,255))
        for y in range(232,VH,22): d.line([(150,y),(330,y)],fill=(158,152,146,255),width=3)
    elif kind=='garden':                     # 縁側から見た庭
        sky((178,208,226),(230,240,238))
        d.rectangle([0,180,VW,VH],fill=(140,172,104,255))
        d.ellipse([40,196,200,266],fill=(112,146,84,255))
        for x,r in ((330,52),(410,38)):
            d.rectangle([x-6,max(0,220-r),x+6,282],fill=(112,84,58,255))
            d.ellipse([x-r,200-r,x+r,200+r],fill=(96,138,88,255))
        d.ellipse([210,272,300,300],fill=(150,148,142,255))
    elif kind=='sakura':
        sky((208,222,238),(244,238,240))
        d.rectangle([0,262,VW,VH],fill=(160,182,126,255))
        for x,r in ((120,74),(330,60)):
            d.rectangle([x-9,max(0,240-r),x+9,290],fill=(110,86,66,255))
            for _ in range(90):
                a=rnd.random()*6.28; rr=rnd.random()*r
                px,py=x+math.cos(a)*rr, 232-r+math.sin(a)*rr*0.8
                d.ellipse([px-9,py-9,px+9,py+9],fill=(246,204,214,235))
        for _ in range(34):
            px,py=rnd.randrange(VW),rnd.randrange(VH)
            d.ellipse([px,py,px+7,py+6],fill=(250,220,226,210))
    elif kind=='roof':                       # 町の屋根
        sky((186,206,224),(232,238,240))
        for i in range(8):
            x=i*62; h=rnd.randrange(40,110)
            d.polygon([(x-8,300),(x+70,300),(x+62,300-h),(x,300-h)],fill=(*sh((92,104,116),rnd.random()*0.3),255))
            d.polygon([(x-14,300-h),(x+76,300-h),(x+62,300-h-22),(x,300-h-22)],fill=(74,86,98,255))
        d.rectangle([0,296,VW,VH],fill=(148,144,138,255))
    return im

# ══════ 扉（320×512）══════
def door(kind, col, glass_c=(200,220,226), knob=(190,158,96), ol=None):
    im=canvas(DW,DH); d=ImageDraw.Draw(im)
    if kind=='panel':                        # 框戸
        wood(d,[14,10,DW-14,DH-10],col,vert=True,r=6)
        for (y0,y1) in ((44,208),(232,DH-46)):
            d.rectangle([48,y0,DW-48,y1],fill=(*sh(col,0.10),255))
            d.rectangle([56,y0+8,DW-56,y1-8],fill=(*li(col,0.07),255))
        d.ellipse([DW-64,DH//2-12,DW-40,DH//2+12],fill=(*knob,255))
    elif kind=='glassdoor':                  # ガラス入り
        wood(d,[14,10,DW-14,DH-10],col,vert=True,r=6)
        d.rectangle([46,40,DW-46,300],fill=(*glass_c,190))
        for x in range(46,DW-46,68): d.line([(x,40),(x,300)],fill=(*col,255),width=10)
        d.line([(46,170),(DW-46,170)],fill=(*col,255),width=10)
        d.rectangle([46,330,DW-46,DH-46],fill=(*sh(col,0.10),255))
        d.ellipse([DW-64,DH//2+30,DW-40,DH//2+54],fill=(*knob,255))
    elif kind=='iron':                       # 鉄の枠
        metal(d,[14,10,DW-14,DH-10],col,r=4)
        d.rectangle([40,40,DW-40,DH-40],fill=(*glass_c,150))
        for x in range(40,DW-40,46): d.line([(x,40),(x,DH-40)],fill=(*col,255),width=8)
        for y in range(40,DH-40,72): d.line([(40,y),(DW-40,y)],fill=(*col,255),width=8)
        d.rectangle([DW-58,DH//2-40,DW-46,DH//2+40],fill=(*knob,255))
    elif kind=='slide':                      # 引き戸
        wood(d,[8,10,DW//2+4,DH-10],col,vert=True,r=4)
        wood(d,[DW//2-4,10,DW-8,DH-10],sh(col,0.08),vert=True,r=4)
        d.rectangle([DW//2-6,10,DW//2+6,DH-10],fill=(*sh(col,0.30),255))
        for x in (DW//4,DW*3//4):
            d.rectangle([x-14,DH//2-22,x+14,DH//2+22],fill=(*sh(col,0.24),255))
    elif kind=='arch':                       # アーチ扉
        d.pieslice([14,10,DW-14,300],180,360,fill=(*col,255))
        d.rectangle([14,150,DW-14,DH-10],fill=(*col,255))
        d.rectangle([46,190,DW-46,DH-50],fill=(*sh(col,0.10),255))
        d.pieslice([46,66,DW-46,262],180,360,fill=(*glass_c,190))
        d.ellipse([DW-64,DH//2+60,DW-40,DH//2+84],fill=(*knob,255))
    elif kind=='shoji':                      # 障子
        wood(d,[10,10,DW-10,DH-10],col,r=3)
        d.rectangle([26,26,DW-26,DH-26],fill=(246,242,230,240))
        for x in range(26,DW-26,52): d.line([(x,26),(x,DH-26)],fill=(*col,255),width=7)
        for y in range(26,DH-26,58): d.line([(26,y),(DW-26,y)],fill=(*col,255),width=7)
    elif kind=='fusuma':                     # 襖
        d.rectangle([10,10,DW-10,DH-10],fill=(*col,255))
        d.rectangle([10,10,DW-10,DH-10],outline=(64,54,44,255),width=12)
        rnd=random.Random(9)
        for _ in range(26):
            x,y=rnd.randrange(30,DW-30),rnd.randrange(30,DH-30); r=rnd.randrange(10,30)
            d.arc([x-r,y-r,x+r,y+r],rnd.randrange(0,180),rnd.randrange(180,360),
                  fill=(*sh(col,0.10),255),width=3)
        d.ellipse([DW-70,DH//2-24,DW-34,DH//2+24],fill=(48,44,40,255))
        d.ellipse([DW-63,DH//2-17,DW-41,DH//2+17],fill=(*li(col,0.2),255))
    elif kind=='kamachi':                    # 木の框戸（昭和）
        wood(d,[12,10,DW-12,DH-10],col,vert=True,r=4)
        d.rectangle([44,44,DW-44,214],fill=(230,234,232,180))
        for x in range(44,DW-44,58): d.line([(x,44),(x,214)],fill=(*col,255),width=9)
        d.rectangle([44,244,DW-44,DH-44],fill=(*sh(col,0.12),255))
        d.rectangle([DW-70,DH//2+40,DW-52,DH//2+90],fill=(*knob,255))
    return outline(im,ol) if ol else im

# ══════ 庭の置物・壁掛け（320×320）══════
def garden(kind, ol=None):
    im=canvas(S,S); d=ImageDraw.Draw(im)
    if kind=='birdbath':
        d.rectangle([146,196,174,FLOOR],fill=(168,164,158,255))
        d.ellipse([100,166,220,222],fill=(190,188,182,255))
        d.ellipse([114,176,206,212],fill=(150,186,204,255))
        d.ellipse([104,FLOOR-14,216,FLOOR+10],fill=(160,156,150,255))
    elif kind=='lantern':                    # 灯籠
        d.polygon([(120,FLOOR),(200,FLOOR),(190,262),(130,262)],fill=(160,158,150,255))
        d.rectangle([126,222,194,262],fill=(178,176,168,255))
        d.polygon([(106,222),(214,222),(196,182),(124,182)],fill=(190,188,180,255))
        d.rectangle([136,140,184,182],fill=(206,204,196,255))
        d.rectangle([146,150,174,178],fill=(250,232,170,255))
        d.polygon([(112,140),(208,140),(160,100)],fill=(174,172,164,255))
    elif kind=='shishi':                     # 鹿おどし
        d.rectangle([100,180,116,FLOOR],fill=(120,96,64,255))
        d.polygon([(108,196),(232,236),(224,258),(100,218)],fill=(158,138,92,255))
        d.ellipse([206,224,246,264],fill=(120,100,64,255))
        d.ellipse([60,FLOOR-40,180,FLOOR+8],fill=(120,152,170,255))
    elif kind=='bench':
        for x in (66,224):
            d.rectangle([x,236,x+22,FLOOR],fill=(130,100,68,255))
        for i,y in enumerate((222,236)):
            wood(d,[52,y,268,y+13],(170,138,96),r=4)
        for i,y in enumerate((160,182,204)):
            wood(d,[62,y,258,y+14],(170,138,96),r=4)
    elif kind=='pot':                        # 植木鉢
        d.polygon([(112,FLOOR),(208,FLOOR),(196,222),(124,222)],fill=(192,120,90,255))
        d.rectangle([116,206,204,228],fill=(204,132,100,255))
        for a,r in ((-40,60),(0,72),(40,58),(-15,48),(20,50)):
            x=160+math.sin(math.radians(a))*30
            d.ellipse([x-30,200-r,x+30,200-r+60],fill=(*sh((104,148,92),abs(a)/160),255))
    elif kind=='fence':
        for x in range(40,290,36):
            d.rounded_rectangle([x,150,x+18,FLOOR],6,fill=(206,196,176,255))
            d.polygon([(x,150),(x+18,150),(x+9,132)],fill=(214,206,188,255))
        for y in (188,246): d.rectangle([32,y,290,y+14],fill=(190,180,160,255))
    elif kind=='post':                       # ポスト
        d.rectangle([148,200,172,FLOOR],fill=(120,116,110,255))
        d.rounded_rectangle([104,110,216,212],16,fill=(196,74,66,255))
        d.rectangle([120,146,200,160],fill=(120,40,36,255))
        d.pieslice([104,84,216,150],180,360,fill=(210,88,78,255))
    elif kind=='windmill':                   # 風車
        d.rectangle([152,150,168,FLOOR],fill=(150,146,140,255))
        for a in range(0,360,90):
            x=160+math.cos(math.radians(a))*44; y=140+math.sin(math.radians(a))*44
            d.polygon([(160,140),(x,y),(x+math.cos(math.radians(a+50))*30,
                        y+math.sin(math.radians(a+50))*30)],fill=(214,196,150,255))
        d.ellipse([150,130,170,150],fill=(140,136,130,255))
    elif kind=='scarecrow':                  # かかし
        d.rectangle([154,150,166,FLOOR],fill=(150,126,86,255))
        d.rectangle([80,196,240,208],fill=(150,126,86,255))
        d.polygon([(112,200),(208,200),(196,278),(124,278)],fill=(160,140,110,255))
        d.ellipse([132,120,188,180],fill=(226,206,160,255))
        d.polygon([(108,132),(212,132),(160,96)],fill=(196,168,110,255))
        d.ellipse([146,142,154,150],fill=(60,54,48,255)); d.ellipse([168,142,176,150],fill=(60,54,48,255))
    elif kind=='well':                       # 井戸
        d.ellipse([76,232,244,FLOOR+8],fill=(160,156,150,255))
        d.rectangle([76,196,244,268],fill=(178,174,166,255))
        for x in range(84,244,32): d.line([(x,196),(x,268)],fill=(150,146,140,255),width=4)
        for x in (100,212): d.rectangle([x,104,x+14,200],fill=(130,102,68,255))
        d.polygon([(76,110),(244,110),(160,60)],fill=(148,116,80,255))
        d.rectangle([150,120,170,168],fill=(110,86,58,255))
    elif kind=='bonfire':                    # 焚き火
        for a in (-30,0,30):
            x=160+math.sin(math.radians(a))*40
            d.line([(160,FLOOR-10),(x,FLOOR-64)],fill=(122,94,62,255),width=15)
        d.polygon([(160,168),(196,262),(124,262)],fill=(240,152,60,255))
        d.polygon([(160,204),(182,262),(138,262)],fill=(250,214,120,255))
        d.ellipse([104,FLOOR-24,216,FLOOR+6],fill=(150,146,140,255))
    elif kind=='hanging':                    # 物干し
        for x in (60,246):
            d.rectangle([x,120,x+16,FLOOR],fill=(180,178,172,255))
            d.rectangle([x-16,120,x+32,132],fill=(190,188,182,255))
        d.line([(68,140),(254,140)],fill=(200,198,192,255),width=5)
        for i,c in enumerate(((226,168,178),(140,178,206),(232,214,140))):
            d.rectangle([84+i*62,140,84+i*62+44,206],fill=(*c,255))
    elif kind=='stepstone':                  # 飛び石
        rnd=random.Random(2)
        for i,(x,y,r) in enumerate(((80,268,34),(150,246,30),(216,272,32),(250,232,26))):
            d.ellipse([x-r,y-r*0.5,x+r,y+r*0.5],fill=(*sh((176,172,166),rnd.random()*0.2),255))
    elif kind=='torii':
        for x in (86,214):
            d.rectangle([x,148,x+22,FLOOR],fill=(190,72,62,255))
        d.rectangle([62,140,258,158],fill=(200,80,68,255))
        d.rectangle([50,110,270,132],fill=(196,76,64,255))
    return outline(im,ol) if ol else im

def wallart(kind, ol=None):
    im=canvas(S,S); d=ImageDraw.Draw(im)
    if kind=='frame_land':
        d.rectangle([46,80,274,240],fill=(178,146,102,255))
        d.rectangle([62,96,258,224],fill=(214,232,238,255))
        d.rectangle([62,180,258,224],fill=(150,180,120,255))
        d.ellipse([200,110,238,148],fill=(250,226,150,255))
    elif kind=='frame_abst':
        d.rectangle([70,60,250,260],fill=(58,56,60,255))
        d.rectangle([84,74,236,246],fill=(238,234,226,255))
        d.ellipse([104,100,180,176],fill=(196,110,84,255))
        d.rectangle([150,150,216,222],fill=(96,124,150,255))
    elif kind=='clock_round':
        d.ellipse([88,88,232,232],fill=(238,234,226,255),outline=(120,96,64,255),width=11)
        for a in range(0,360,30):
            x=160+math.cos(math.radians(a))*54; y=160+math.sin(math.radians(a))*54
            d.ellipse([x-4,y-4,x+4,y+4],fill=(80,76,72,255))
        d.line([(160,160),(160,116)],fill=(60,56,52,255),width=7)
        d.line([(160,160),(196,178)],fill=(60,56,52,255),width=6)
    elif kind=='clock_pendulum':             # 柱時計
        wood(d,[104,40,216,272],(126,92,60),vert=True,r=8)
        d.ellipse([118,58,202,142],fill=(240,236,226,255))
        d.line([(160,100),(160,72)],fill=(60,56,52,255),width=5)
        d.line([(160,100),(180,112)],fill=(60,56,52,255),width=5)
        d.rectangle([150,150,170,222],fill=(190,158,96,255))
        d.ellipse([138,214,182,258],fill=(198,166,104,255))
    elif kind=='mirror':
        d.ellipse([90,60,230,260],fill=(190,158,96,255))
        d.ellipse([104,74,216,246],fill=(214,226,230,255))
        d.polygon([(120,220),(160,110),(178,110),(126,236)],fill=(255,255,255,90))
    elif kind=='shelf':
        wood(d,[52,150,268,168],(160,126,88),r=4)
        for x in (66,246): d.rectangle([x,168,x+12,196],fill=(140,108,72,255))
        d.rectangle([84,104,104,150],fill=(150,180,140,255))
        d.rectangle([110,116,126,150],fill=(196,140,120,255))
        d.ellipse([150,116,190,150],fill=(214,196,160,255))
        d.rectangle([206,110,226,150],fill=(120,148,180,255))
    elif kind=='hatrack':
        d.rectangle([148,60,172,250],fill=(140,108,72,255))
        for s in (-1,1):
            d.line([(160,110),(160+s*56,90)],fill=(150,118,80,255),width=11)
            d.ellipse([160+s*56-9,82,160+s*56+9,100],fill=(160,128,88,255))
        d.ellipse([90,80,150,120],fill=(178,146,102,255))
    elif kind=='calendar':
        d.rectangle([90,70,230,250],fill=(246,244,238,255),outline=(180,176,170,255),width=5)
        d.rectangle([90,70,230,116],fill=(196,86,78,255))
        for j in range(4):
            for i in range(6):
                d.rectangle([104+i*20,130+j*28,118+i*20,148+j*28],fill=(216,214,208,255))
    elif kind=='shoji_art':                  # 掛け軸
        d.rectangle([120,44,200,276],fill=(238,232,214,255))
        d.rectangle([116,44,204,62],fill=(120,96,64,255))
        d.rectangle([116,258,204,276],fill=(120,96,64,255))
        d.line([(150,100),(150,220)],fill=(70,66,62,255),width=6)
        d.arc([132,120,188,190],200,340,fill=(70,66,62,255),width=5)
    elif kind=='photos':
        rnd=random.Random(6)
        for (x,y,w,h) in ((70,90,72,92),(156,74,84,64),(150,156,68,84),(232,110,60,78)):
            d.rectangle([x,y,x+w,y+h],fill=(250,248,242,255),outline=(196,192,186,255),width=4)
            d.rectangle([x+8,y+8,x+w-8,y+h-16],fill=(*sh((176,192,200),rnd.random()*0.3),255))
    elif kind=='trophy':
        d.polygon([(126,110),(194,110),(184,180),(136,180)],fill=(206,172,100,255))
        d.arc([100,112,140,164],90,270,fill=(206,172,100,255),width=9)
        d.arc([180,112,220,164],270,90,fill=(206,172,100,255),width=9)
        d.rectangle([148,180,172,206],fill=(190,158,96,255))
        d.rectangle([116,206,204,240],fill=(120,96,64,255))
    elif kind=='score':                      # 額の楽譜
        d.rectangle([56,90,264,236],fill=(140,110,74,255))
        d.rectangle([70,104,250,222],fill=(248,246,238,255))
        for j in range(4):
            y=124+j*26
            for k in range(5): d.line([(84,y+k*4),(236,y+k*4)],fill=(120,116,110,255),width=2)
        for (x,y) in ((100,128),(134,136),(168,124),(202,140)):
            d.ellipse([x,y,x+13,y+10],fill=(60,56,52,255))
            d.line([(x+13,y+5),(x+13,y-24)],fill=(60,56,52,255),width=3)
    elif kind=='wreath':
        d.ellipse([80,80,240,240],outline=(104,138,96,255),width=30)
        rnd=random.Random(8)
        for _ in range(18):
            a=rnd.random()*6.28; x=160+math.cos(a)*80; y=160+math.sin(a)*80
            d.ellipse([x-11,y-11,x+11,y+11],fill=(*rnd.choice([(196,90,86),(226,204,140),(150,178,140)]),255))
    return outline(im,ol) if ol else im
