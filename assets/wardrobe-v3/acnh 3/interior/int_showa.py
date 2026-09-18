# -*- coding: utf-8 -*-
"""第4便：明治〜昭和の家具／第5便：昭和の壁・床・縁側"""
from interior2 import *
import math, random
KIRI=(198,172,128); DARK=(96,72,50); OAK=(160,126,88); BLK=(52,50,54)
BRS=(190,158,96); GLS=(206,224,226); RED=(178,72,64); CRM=(232,222,196)
GRN=(96,124,96); IVY=(224,214,190); TAT=(198,196,142)

def showa(kind, ol=None):
    im=canvas(S,S); d=ImageDraw.Draw(im)
    if kind=='oil_lamp':                     # 石油ランプ
        d.ellipse([116,FLOOR-30,204,FLOOR+4],fill=(150,146,140,255))
        d.polygon([(134,FLOOR-24),(186,FLOOR-24),(178,232),(142,232)],fill=(190,158,96,255))
        d.ellipse([132,196,188,244],fill=(232,206,150,255))
        d.polygon([(138,196),(182,196),(190,120),(130,120)],fill=(250,244,228,190))
        d.ellipse([146,206,174,234],fill=(252,224,140,255))
    elif kind=='wall_clock':                 # 柱時計
        wood(d,[110,40,210,254],(126,92,60),vert=True,r=8)
        d.ellipse([122,54,198,130],fill=(240,236,226,255))
        d.line([(160,92),(160,66)],fill=(60,56,52,255),width=5)
        d.line([(160,92),(178,104)],fill=(60,56,52,255),width=5)
        d.rectangle([152,144,168,208],fill=(190,158,96,255))
        d.ellipse([140,200,180,240],fill=(198,166,104,255))
        d.polygon([(102,40),(218,40),(160,12)],fill=(112,82,54,255))
    elif kind=='kiri_tansu':                 # 桐たんす
        wood(d,[52,116,268,FLOOR],KIRI,vert=False,r=4)
        for j in range(4):
            y=126+j*44
            d.rectangle([62,y,258,y+36],fill=(*li(KIRI,0.06),255),outline=(*sh(KIRI,0.18),255),width=3)
            for x in (110,210): d.ellipse([x-11,y+14,x+11,y+30],fill=(70,66,60,255))
        d.rectangle([44,106,276,120],fill=(*sh(KIRI,0.22),255))
    elif kind=='kyodai':                     # 鏡台（三面鏡）
        wood(d,[70,196,250,FLOOR],(150,116,78),r=5)
        d.rectangle([84,206,236,232],fill=(*sh((150,116,78),0.16),255))
        for x0,x1,y0 in ((78,124,86),(128,192,60),(196,242,86)):
            d.rounded_rectangle([x0,y0,x1,196],10,fill=(150,116,78,255))
            d.rounded_rectangle([x0+7,y0+7,x1-7,190],8,fill=(214,224,226,255))
    elif kind=='mishin':                     # 足踏みミシン
        wood(d,[54,168,266,192],(126,92,60),r=4)
        d.rectangle([76,192,100,FLOOR],fill=(70,68,72,255))
        d.rectangle([220,192,244,FLOOR],fill=(70,68,72,255))
        d.rectangle([76,262,244,282],fill=(86,84,88,255))
        d.polygon([(120,168),(210,168),(206,110),(154,110),(150,140),(124,140)],fill=(48,46,50,255))
        d.ellipse([194,110,238,154],fill=(190,158,96,255))
    elif kind=='chandelier':                 # 洋燈のシャンデリア
        d.line([(160,0),(160,70)],fill=(120,96,64,255),width=6)
        d.ellipse([140,64,180,88],fill=(190,158,96,255))
        for a in (-1,0,1):
            x=160+a*76
            d.line([(160,80),(x,124)],fill=(190,158,96,255),width=7)
            d.polygon([(x-30,124),(x+30,124),(x+18,178),(x-18,178)],fill=(246,238,220,220))
            d.ellipse([x-13,150,x+13,180],fill=(252,226,150,255))
    elif kind=='chabudai':                   # ちゃぶ台
        d.ellipse([44,196,276,254],fill=(150,110,72,255))
        d.ellipse([44,190,276,240],fill=(176,132,86,255))
        for x in (86,226): d.polygon([(x,238),(x+16,238),(x+22,FLOOR),(x-6,FLOOR)],fill=(130,96,62,255))
    elif kind=='chadansu':                   # 茶箪笥（ガラス戸）
        wood(d,[58,96,262,FLOOR],(140,104,68),vert=True,r=5)
        d.rectangle([70,110,250,206],fill=(*GLS,170))
        for x in (160,): d.line([(x,110),(x,206)],fill=(140,104,68,255),width=10)
        for x in range(78,250,26): d.line([(x,110),(x,206)],fill=(160,124,84,180),width=3)
        d.rectangle([70,222,250,282],fill=(*sh((140,104,68),0.12),255))
        for x in (108,212): d.ellipse([x-11,244,x+11,262],fill=(70,66,60,255))
    elif kind=='hibachi':                    # 火鉢
        d.ellipse([76,196,244,FLOOR+6],fill=(120,96,72,255))
        d.ellipse([76,178,244,262],fill=(150,122,92,255))
        d.ellipse([98,190,222,246],fill=(70,64,58,255))
        d.ellipse([124,204,196,236],fill=(220,150,80,255))
        d.ellipse([142,212,178,230],fill=(250,206,120,255))
    elif kind=='kurodenwa':                  # 黒電話と電話台
        wood(d,[92,214,228,FLOOR],(140,104,68),r=5)
        d.rounded_rectangle([104,164,216,216],14,fill=(38,36,40,255))
        d.ellipse([124,174,180,214],fill=(60,58,62,255))
        d.ellipse([138,186,166,202],fill=(200,198,192,255))
        d.rounded_rectangle([100,142,220,168],12,fill=(30,28,32,255))
    elif kind=='radio':                      # 真空管ラジオ
        wood(d,[70,150,250,FLOOR],(126,92,60),r=8)
        d.pieslice([84,160,236,300],180,360,fill=(*li((126,92,60),0.08),255))
        d.ellipse([98,186,182,262],fill=(96,72,48,255))
        for r in range(14,42,8): d.arc([140-r,224-r,140+r,224+r],0,360,fill=(70,54,38,255),width=3)
        d.ellipse([196,208,238,250],fill=(232,214,170,255))
        d.line([(217,229),(217,212)],fill=(60,56,52,255),width=4)
    elif kind=='zataku':                     # 座卓と座布団
        d.rectangle([46,206,274,226],fill=(150,110,72,255))
        d.rectangle([46,200,274,210],fill=(176,132,86,255))
        for x in (66,236): d.rectangle([x,226,x+18,270],fill=(130,96,62,255))
        for x in (60,210):
            d.rounded_rectangle([x,272,x+52,FLOOR],10,fill=(178,86,80,255))
    elif kind=='tv':                         # ブラウン管テレビ（脚つき）
        wood(d,[62,120,258,254],(140,104,68),r=8)
        d.rounded_rectangle([80,136,222,238],14,fill=(56,58,62,255))
        d.rounded_rectangle([88,144,214,230],10,fill=(150,168,170,255))
        d.polygon([(96,226),(150,152),(168,152),(104,232)],fill=(255,255,255,60))
        for j in range(2): d.ellipse([232,152+j*36,250,170+j*36],fill=(190,158,96,255))
        for x in (86,224): d.polygon([(x,254),(x+18,254),(x+26,FLOOR),(x-8,FLOOR)],fill=(120,90,58,255))
    elif kind=='kotatsu':                    # 電気こたつ
        d.rectangle([40,214,280,236],fill=(150,110,72,255))
        d.polygon([(52,236),(268,236),(284,FLOOR),(36,FLOOR)],fill=(196,120,110,255))
        for x in range(50,280,26): d.line([(x,240),(x-6,FLOOR)],fill=(178,104,96,255),width=4)
        d.rectangle([40,208,280,220],fill=(176,132,86,255))
    elif kind=='stereo':                     # ステレオ／レコード
        wood(d,[46,182,274,FLOOR],(120,88,58),r=6)
        d.rectangle([60,194,146,282],fill=(*sh((120,88,58),0.2),255))
        d.rectangle([174,194,260,282],fill=(*sh((120,88,58),0.2),255))
        for y in range(202,278,10):
            d.line([(66,y),(140,y)],fill=(80,60,42,255),width=3)
            d.line([(180,y),(254,y)],fill=(80,60,42,255),width=3)
        d.rectangle([150,194,170,282],fill=(*li((120,88,58),0.10),255))
        d.ellipse([116,140,204,182],fill=(58,56,60,255))
        d.ellipse([152,156,168,166],fill=(214,90,80,255))
    elif kind=='fan':                        # ダイヤル式の扇風機
        d.ellipse([116,FLOOR-24,204,FLOOR+8],fill=(150,148,142,255))
        d.rectangle([152,180,168,FLOOR-18],fill=(170,168,162,255))
        d.ellipse([84,96,236,248],fill=(196,194,188,255))
        d.ellipse([94,106,226,238],fill=(220,224,224,180))
        for a in range(0,360,72):
            x=160+math.cos(math.radians(a))*44; y=172+math.sin(math.radians(a))*44
            d.ellipse([x-28,y-28,x+28,y+28],fill=(206,208,204,235))
        d.ellipse([146,158,174,186],fill=(120,118,112,255))
    elif kind=='sofa_vinyl':                 # 応接セット（ビニル張り）
        d.rounded_rectangle([40,150,280,214],14,fill=(122,84,66,255))
        d.rounded_rectangle([40,206,280,266],12,fill=(140,96,74,255))
        for x in (40,252): d.rounded_rectangle([x,178,x+28,266],10,fill=(110,76,58,255))
        for x in (66,242): d.rectangle([x,266,x+16,FLOOR],fill=(70,66,60,255))
        for i in range(3): d.line([(78+i*72,158),(78+i*72,206)],fill=(102,70,54,255),width=4)
    elif kind=='sideboard':                  # サイドボード
        wood(d,[36,178,284,278],(122,90,60),r=5)
        for i in range(3):
            x=48+i*76
            d.rectangle([x,190,x+64,266],fill=(*li((122,90,60),0.05),255),outline=(*sh((122,90,60),0.2),255),width=3)
            d.rectangle([x+18,222,x+46,230],fill=(190,158,96,255))
        for x in (54,252): d.polygon([(x,278),(x+16,278),(x+22,FLOOR),(x-6,FLOOR)],fill=(100,72,48,255))
    elif kind=='engawa':                     # ★縁側
        d.rectangle([0,206,S,268],fill=(176,138,92,255))
        for y in range(210,268,11): d.line([(0,y),(S,y)],fill=(150,114,72,255),width=3)
        d.rectangle([0,268,S,282],fill=(140,104,66,255))
        d.rectangle([0,282,S,FLOOR],fill=(120,88,56,255))
        d.rectangle([0,150,S,206],fill=(238,232,214,255))
        for x in range(0,S,54): d.line([(x,150),(x,206)],fill=(150,116,78,255),width=7)
        d.line([(0,178),(S,178)],fill=(150,116,78,255),width=7)
    return outline(im,ol) if ol else im

# ══════ 昭和の壁・床（256タイル）══════
T=256
def tile_new(bg): return Image.new('RGBA',(T,T),(*bg,255))
def noise(img,amt=6,seed=1):
    rnd=np.random.default_rng(seed); a=np.array(img).astype(int)
    a[:,:,:3]=np.clip(a[:,:,:3]+rnd.integers(-amt,amt+1,(T,T,1)),0,255)
    return Image.fromarray(a.astype('uint8'))
def sunakabe(c=(206,192,166)):               # 砂壁
    im=tile_new(c); a=np.array(im).astype(int)
    rnd=np.random.default_rng(11)
    a[:,:,:3]=np.clip(a[:,:,:3]+rnd.integers(-14,15,(T,T,3)),0,255)
    return Image.fromarray(a.astype('uint8'))
def senikabe(c=(214,202,172)):               # 繊維壁
    im=tile_new(c); d=ImageDraw.Draw(im); rnd=random.Random(5)
    for _ in range(900):
        x,y=rnd.randrange(T),rnd.randrange(T); l=rnd.randrange(4,13); a=rnd.random()*3.14
        d.line([(x,y),(x+math.cos(a)*l,y+math.sin(a)*l)],
               fill=(*sh(c,rnd.random()*0.22),255),width=2)
    return noise(im,4,3)
def tsuchikabe(c=(180,160,128)):             # 土壁
    im=tile_new(c); d=ImageDraw.Draw(im); rnd=random.Random(2)
    for _ in range(220):
        x,y=rnd.randrange(T),rnd.randrange(T); r=rnd.randrange(3,11)
        d.ellipse([x-r,y-r,x+r,y+r],fill=(*sh(c,rnd.random()*0.16),200))
    return noise(im,6,4)
def furukurosu(c=(232,224,204),f=(196,158,150)):   # 花柄の古いクロス
    im=tile_new(c); d=ImageDraw.Draw(im)
    for j in range(4):
        for i in range(4):
            cx,cy=32+i*64,32+j*64
            for a in range(0,360,72):
                x=cx+math.cos(math.radians(a))*15; y=cy+math.sin(math.radians(a))*15
                d.ellipse([x-11,y-11,x+11,y+11],fill=(*f,235))
            d.ellipse([cx-7,cy-7,cx+7,cy+7],fill=(*sh(f,0.2),255))
    return noise(im,4,6)
def mortar(c=(198,196,190)):
    im=tile_new(c); d=ImageDraw.Draw(im); rnd=random.Random(1)
    for _ in range(500):
        x,y=rnd.randrange(T),rnd.randrange(T)
        d.ellipse([x,y,x+3,y+3],fill=(*sh(c,rnd.random()*0.20),160))
    return noise(im,7,2)
def tatami_tile():
    im=tile_new((198,196,142)); d=ImageDraw.Draw(im)
    for y in range(0,T,5): d.line([(0,y),(T,y)],fill=(184,182,128,255),width=2)
    d.rectangle([0,0,T,10],fill=(62,66,52,255)); d.rectangle([0,T-10,T,T],fill=(62,66,52,255))
    return im
def ameiro():                                # 飴色の板の間
    im=tile_new((166,120,68)); d=ImageDraw.Draw(im); rnd=random.Random(7)
    for i in range(0,T,42):
        d.rectangle([0,i,T,i+40],fill=(*sh((166,120,68),rnd.random()*0.12),255))
        for _ in range(9):
            y=i+rnd.randrange(4,36)
            d.line([(0,y),(T,y+rnd.randint(-2,2))],fill=(140,98,54,255),width=2)
        d.line([(0,i+41),(T,i+41)],fill=(120,84,46,255),width=3)
    return im
def linoleum(c=(206,196,176)):
    im=tile_new(c); d=ImageDraw.Draw(im)
    for i in range(0,T,64):
        for j in range(0,T,64):
            if (i//64+j//64)%2==0: d.rectangle([i,j,i+63,j+63],fill=(*sh(c,0.10),255))
    return noise(im,5,9)
def carpet_showa():
    im=tile_new((136,96,88)); d=ImageDraw.Draw(im)
    for j in range(0,T,64):
        for i in range(0,T,64):
            d.rectangle([i+8,j+8,i+56,j+56],outline=(196,166,120,255),width=5)
            d.ellipse([i+22,j+22,i+42,j+42],fill=(178,140,104,255))
    return noise(im,4,12)
