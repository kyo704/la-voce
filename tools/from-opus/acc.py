from PIL import Image, ImageDraw
import numpy as np, math

A,B,C,FLAT=-0.00237595,2.49995,-58.78,490.0
def jaw(x): return max(A*x*x+B*x+C,FLAT)
def bot_y(x): return -0.00160767*x*x + 1.643818*x + 255.353
CX=511
orig=Image.open('orig_sheep.png').convert('RGBA')
head=Image.open('sheepparts2/sheep_head.png').convert('RGBA')
body=Image.open('sheepparts2/sheep_body.png').convert('RGBA')
W,H=orig.size; SIL=np.array(orig)[:,:,3]
def sh(c,d): return tuple(max(0,int(v*(1-d))) for v in c)
def li(c,d): return tuple(int(v+(255-v)*d) for v in c)
def new(): return Image.new('RGBA',(W,H),(0,0,0,0))
def clipsil(l):
    a=np.array(l); a[:,:,3]=(a[:,:,3].astype(int)*SIL.astype(int)//255).astype('uint8')
    return Image.fromarray(a)

# ── 耳だけを取り出す（帽子の上に焼き込む） ──────────────
o=np.array(orig).astype(int)
r,g,b,al=o[:,:,0],o[:,:,1],o[:,:,2],o[:,:,3]
gold=(al>60)&(r>150)&(r<240)&(g>110)&(g<200)&(b<150)
dark=(al>60)&(r<150)&(g<130)&(b<110)
earbox=np.zeros((H,W),bool)
earbox[70:240,335:435]=True; earbox[70:240,590:690]=True
EAR=(gold|dark)&earbox
earlayer=np.zeros((H,W,4),'uint8'); earlayer[EAR]=np.array(orig)[EAR]
EARIMG=Image.fromarray(earlayer)

def bake_ears(l):
    out=l.copy(); out.alpha_composite(EARIMG); return out

# ══ 帽子 ═══════════════════════════════════════════════
def hat_beret(col=(132,12,36)):
    l=new(); d=ImageDraw.Draw(l)
    d.ellipse([248,66,774,282], fill=(*col,255))
    d.ellipse([248,66,774,236], fill=(*li(col,0.16),255))
    d.ellipse([296,226,726,300], fill=(*sh(col,0.24),255))
    d.ellipse([478,36,544,102], fill=(*sh(col,0.14),255))
    return bake_ears(l)

def hat_knit(col=(214,204,180), band=None):
    band=band or sh(col,0.14)
    l=new(); d=ImageDraw.Draw(l)
    d.rounded_rectangle([266,68,758,266],150, fill=(*col,255))
    for x in range(284,742,40):
        d.line([(x,86),(x,258)], fill=(*sh(col,0.07),255), width=11)
    d.rounded_rectangle([250,212,774,306],48, fill=(*band,255))
    d.rounded_rectangle([250,212,774,254],32, fill=(*li(band,0.16),255))
    d.ellipse([448,4,574,130], fill=(*li(col,0.22),255))
    return bake_ears(l)

def hat_straw(col=(224,196,132), rib=(132,12,36)):
    l=new(); d=ImageDraw.Draw(l)
    d.ellipse([124,206,898,340], fill=(*col,255))
    d.ellipse([124,206,898,304], fill=(*li(col,0.14),255))
    d.rounded_rectangle([334,96,688,282],96, fill=(*col,255))
    d.rounded_rectangle([334,96,688,200],86, fill=(*li(col,0.18),255))
    d.rectangle([334,224,688,278], fill=(*rib,255))
    d.rectangle([334,224,688,242], fill=(*li(rib,0.22),255))
    for x in range(146,880,28):
        d.line([(x,268),(x,304)], fill=(*sh(col,0.08),255), width=4)
    return bake_ears(l)

def hat_top(col=(38,34,40), band=(132,12,36)):
    l=new(); d=ImageDraw.Draw(l)
    d.ellipse([182,196,840,308], fill=(*col,255))
    d.ellipse([182,196,840,274], fill=(*li(col,0.22),255))
    d.rounded_rectangle([360,22,662,254],28, fill=(*col,255))
    d.rounded_rectangle([360,22,462,254],28, fill=(*li(col,0.14),255))
    d.rectangle([360,186,662,244], fill=(*band,255))
    return bake_ears(l)

def hat_casquette(col=(186,146,96)):
    l=new(); d=ImageDraw.Draw(l)
    d.chord([196,206,826,344],0,180, fill=(*sh(col,0.24),255))   # つば
    d.rounded_rectangle([278,68,744,268],130, fill=(*col,255))
    d.rounded_rectangle([278,68,744,190],120, fill=(*li(col,0.16),255))
    d.line([(511,74),(511,264)], fill=(*sh(col,0.12),255), width=7)
    d.ellipse([483,50,539,106], fill=(*sh(col,0.18),255))
    return bake_ears(l)

def hat_flowers():
    l=new(); d=ImageDraw.Draw(l)
    cols=[(240,168,186),(250,228,166),(198,214,240),(246,196,150),(212,190,232)]
    pts=[(292,236),(340,180),(400,140),(462,116),(511,110),(560,116),(622,140),(682,180),(730,236)]
    for i,(x,y) in enumerate(pts):
        c=cols[i%len(cols)]
        for k in range(5):
            a=k*2*math.pi/5-math.pi/2
            d.ellipse([x+30*math.cos(a)-21,y+30*math.sin(a)-21,x+30*math.cos(a)+21,y+30*math.sin(a)+21], fill=(*c,255))
        d.ellipse([x-15,y-15,x+15,y+15], fill=(250,226,150,255))
    return bake_ears(l)

# ══ 襟巻き（胴と頭のあいだ） ══════════════════════════
def neck(colf, tailcol=None, top_off=16, bot_off=0, tail=True):
    a=np.zeros((H,W,4),'uint8')
    for x in range(240,793):
        t=int(jaw(x)-top_off); b=int(bot_y(x)+bot_off)
        if b-t<50: continue
        for y in range(t,b):
            a[y,x]=(*colf(x,y),255)
    l=Image.fromarray(a); d=ImageDraw.Draw(l)
    if tail:
        tc=tailcol or colf(600,700)
        m=int(bot_y(610))-26
        d.polygon([(556,m),(664,m),(678,812),(590,826)], fill=(*tc,255))
        for i in range(4):
            x0=592+i*22; y0=820+i*3
            d.rounded_rectangle([x0,y0,x0+15,y0+40],7, fill=(*sh(tc,0.22),255))
    return clipsil(l)

def scarf_wine():
    W1=(132,12,36); D=(92,8,26); L=(176,48,72)
    def f(x,y):
        t=jaw(x)-16
        return L if y<t+26 else (D if y>bot_y(x)-30 else W1)
    return neck(f, W1)
def scarf_check():
    B=(78,104,92); C2=(214,198,164); D=(50,70,62)
    def f(x,y):
        return C2 if (((x//46)%2==0)^((y//46)%2==0)) else (D if y>bot_y(x)-28 else B)
    return neck(f,(78,104,92))
def snood():
    C1=(236,226,204)
    def f(x,y):
        t=jaw(x)-22
        k=int((y-t)/26)%2
        return li(C1,0.10) if k==0 else sh(C1,0.06)
    return neck(f, C1, top_off=22, bot_off=34, tail=False)
def ribbon_tie(col=(168,32,48)):
    l=new(); d=ImageDraw.Draw(l)
    j=int(jaw(CX))
    d.polygon([(511,j+8),(392,j-24),(388,j+92),(511,j+56)], fill=(*col,255))
    d.polygon([(511,j+8),(630,j-24),(634,j+92),(511,j+56)], fill=(*li(col,0.10),255))
    d.ellipse([475,j+2,547,j+62], fill=(*sh(col,0.20),255))
    d.polygon([(500,j+52),(524,j+52),(548,j+186),(506,j+192)], fill=(*col,255))
    return clipsil(l)

# ══ 道具（いちばん手前） ═══════════════════════════════
def prop_score():
    l=new(); d=ImageDraw.Draw(l)
    d.polygon([(214,712),(506,668),(506,912),(214,952)], fill=(252,250,244,255))
    d.polygon([(506,668),(798,712),(798,952),(506,912)], fill=(236,231,218,255))
    d.polygon([(214,712),(506,668),(506,912),(214,952)], outline=(176,168,152,255), width=7)
    d.polygon([(506,668),(798,712),(798,952),(506,912)], outline=(176,168,152,255), width=7)
    for i in range(5):
        y=734+i*32
        d.line([(258,y+16),(482,y-8)], fill=(122,114,104,255), width=6)
        d.line([(540,y-8),(760,y+16)], fill=(122,114,104,255), width=6)
    d.line([(506,668),(506,912)], fill=(176,168,152,255), width=8)
    return l
def prop_metronome():
    l=new(); d=ImageDraw.Draw(l)
    d.polygon([(370,948),(652,948),(598,624),(424,624)], fill=(146,92,52,255))
    d.polygon([(370,948),(511,948),(511,624),(424,624)], fill=(178,120,74,255))
    d.polygon([(436,926),(586,926),(556,660),(466,660)], fill=(246,240,224,255))
    d.line([(511,914),(566,660)], fill=(66,56,48,255), width=11)
    d.rounded_rectangle([528,724,580,760],10, fill=(66,56,48,255))
    d.ellipse([492,896,530,934], fill=(66,56,48,255))
    return l
def prop_bottle(col=(68,120,98)):
    l=new(); d=ImageDraw.Draw(l)
    d.rounded_rectangle([548,668,724,948],62, fill=(*col,255))
    d.rounded_rectangle([548,668,610,948],46, fill=(*li(col,0.18),255))
    d.rounded_rectangle([586,606,686,684],28, fill=(*sh(col,0.30),255))
    d.rounded_rectangle([548,780,724,832],14, fill=(*li(col,0.34),255))
    return l
def prop_bouquet():
    l=new(); d=ImageDraw.Draw(l)
    d.polygon([(462,948),(568,948),(552,772),(478,772)], fill=(198,186,158,255))
    cols=[(226,96,110),(246,196,150),(250,232,168),(212,190,232),(240,168,186)]
    for i,(x,y) in enumerate([(452,724),(516,690),(578,724),(486,660),(548,656)]):
        c=cols[i%5]
        for k in range(5):
            a=k*2*math.pi/5-math.pi/2
            d.ellipse([x+26*math.cos(a)-19,y+26*math.sin(a)-19,x+26*math.cos(a)+19,y+26*math.sin(a)+19], fill=(*c,255))
        d.ellipse([x-14,y-14,x+14,y+14], fill=(250,226,150,255))
    d.line([(500,776),(482,704)], fill=(122,152,110,255), width=8)
    d.line([(528,776),(548,704)], fill=(122,152,110,255), width=8)
    return l
def prop_teacup():
    l=new(); d=ImageDraw.Draw(l)
    for (x,y,rr) in [(462,640,30),(508,584,26),(466,530,21),(512,482,17)]:
        d.ellipse([x-rr,y-rr,x+rr,y+rr], fill=(226,220,208,200))
    d.arc([578,742,708,860],270,90, fill=(214,206,190,255), width=30)
    d.rounded_rectangle([368,692,626,900],46, fill=(252,250,246,255))
    d.rounded_rectangle([368,692,626,762],34, fill=(216,208,192,255))
    d.rounded_rectangle([368,692,626,900],46, outline=(196,188,170,255), width=7)
    d.ellipse([326,886,668,952], fill=(216,208,192,255))
    return l

HATS=[('hatBeret','ベレー帽',hat_beret()),('hatKnit','ニット帽',hat_knit()),
      ('hatStraw','麦わら帽子',hat_straw()),('hatTop','シルクハット',hat_top()),
      ('hatCasquette','キャスケット',hat_casquette()),('hatFlowerCrown','花かんむり',hat_flowers())]
NECKS=[('scarfWine','えんじのマフラー',scarf_wine()),('scarfCheck','チェックのマフラー',scarf_check()),
       ('snoodCream','もこもこのスヌード',snood()),('ribbonTie','リボンタイ',ribbon_tie())]
PROPS=[('propScore','楽譜',prop_score()),('propMetronome','メトロノーム',prop_metronome()),
       ('propBottle','水筒',prop_bottle()),('propBouquet','花束',prop_bouquet()),
       ('propTeacup','あたたかい飲みもの',prop_teacup())]

def show(kind,img):
    p=new(); p.alpha_composite(body)
    if kind=='neck': p.alpha_composite(img)
    p.alpha_composite(head)
    if kind=='hat': p.alpha_composite(img)
    if kind=='prop': p.alpha_composite(img)
    return p

rows=[('hat',HATS),('neck',NECKS),('prop',PROPS)]
S=320; cols=6
sheet=Image.new('RGBA',(S*cols+30*(cols+1), (S+30)*3+30),(247,242,230,255))
for ri,(kind,lst) in enumerate(rows):
    for ci,(k,n,img) in enumerate(lst):
        c=Image.new('RGBA',(W,H),(255,253,248,255)); c.alpha_composite(show(kind,img))
        sheet.alpha_composite(c.resize((S,S),Image.LANCZOS),(30+(S+30)*ci, 30+(S+30)*ri))
sheet.convert('RGB').save('/home/claude/out/羊-帽子と襟巻きと道具15点.png')
print('ok')
