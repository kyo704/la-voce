from PIL import Image, ImageDraw, ImageFont
import numpy as np, math
from era import make, sh, li, new, W, H, body, head, jaw, CX, clipsil, torso_hw
from acc import bake_ears

GOLD=(206,168,86); GOLD2=(158,118,46); SILV=(172,182,198)
FONT='/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc'
def top_y(x): return max(jaw(x)-14, 592-150*((x-CX)/300.0)**2)
def PH(fn):
    l=new(); d=ImageDraw.Draw(l); fn(d); return bake_ears(l)
def crescent(bo, bi, col):
    l=new(); ImageDraw.Draw(l).ellipse(bo, fill=(*col,255))
    a=np.array(l); yy,xx=np.mgrid[0:H,0:W]
    x0,y0,x1,y1=bi; cx,cy=(x0+x1)/2,(y0+y1)/2; rx,ry=(x1-x0)/2,(y1-y0)/2
    a[((xx-cx)/rx)**2+((yy-cy)/ry)**2<=1, 3]=0
    return Image.fromarray(a)

# ══ 胴のつくり（ここが武将ごとに変わる）══════════════════
def DO(kind, col, lace):
    """kind: kozane 小札 / iyozane 伊予札 / yokohagi 横矧板 / okegawa 桶側板 /
             nanban 南蛮胴 / hotoke 仏胴（無地）"""
    if kind=='kozane':
        def f(x,y,b):
            yy=y%42
            if yy<6: return sh(b,0.44)
            if yy<13: return li(b,0.12)
            if 15<=yy<34 and (x%48)<10: return lace
            return b
    elif kind=='iyozane':
        def f(x,y,b):
            yy=y%64
            if yy<8: return sh(b,0.44)
            if yy<18: return li(b,0.13)
            if 22<=yy<52 and (x%74)<14: return lace
            return b
    elif kind=='yokohagi':          # 横に板を重ねる（政宗の五枚胴・幸村）
        def f(x,y,b):
            yy=y%74
            if yy<5:  return sh(b,0.52)
            if yy<16: return li(b,0.14)
            if yy>68: return sh(b,0.20)
            return b
    elif kind=='okegawa':           # 縦に板を並べる（桶側胴・井伊）
        def f(x,y,b):
            xx=x%62
            if xx<5:  return sh(b,0.46)
            if xx<14: return li(b,0.13)
            return b
    elif kind=='nanban':            # 南蛮胴：なめらか＋中央の鎬
        def f(x,y,b):
            dx=abs(x-CX)
            if dx<9:  return li(b,0.34)
            if dx<22: return li(b,0.16)
            if y%150<7: return sh(b,0.22)
            return li(b, max(0.0,0.22-dx/900.0))
    else:                           # hotoke 仏胴（無地・つや）
        def f(x,y,b):
            dx=x-CX
            return li(b, max(0.0, 0.26-abs(dx+60)/700.0))
    return f

def panel(d, x0,y0,x1,y1, col, lace, kind, r=14):
    d.rounded_rectangle([x0,y0,x1,y1], r, fill=(*col,255))
    if kind in ('kozane','iyozane'):
        rh = 42 if kind=='kozane' else 64
        cw = 48 if kind=='kozane' else 74
        y=y0
        while y<y1:
            d.rectangle([x0,y,x1,min(y1,y+5)], fill=(*sh(col,0.44),255))
            d.rectangle([x0,min(y1,y+6),x1,min(y1,y+13)], fill=(*li(col,0.12),255))
            x=x0+8
            while x<x1-8:
                d.rectangle([x,min(y1,y+16),min(x1,x+11),min(y1,y+int(rh*0.78))], fill=(*lace,255))
                x+=cw
            y+=rh
    elif kind in ('yokohagi','nanban','hotoke'):
        y=y0
        while y<y1:
            d.rectangle([x0,y,x1,min(y1,y+5)], fill=(*sh(col,0.46),255))
            d.rectangle([x0,min(y1,y+6),x1,min(y1,y+16)], fill=(*li(col,0.14),255))
            y+=74
    elif kind=='okegawa':
        x=x0
        while x<x1:
            d.rectangle([x,y0,min(x1,x+4),y1], fill=(*sh(col,0.44),255))
            d.rectangle([min(x1,x+5),y0,min(x1,x+13),y1], fill=(*li(col,0.13),255))
            x+=62

def suit(col, lace=None, kind='kozane', kusa_n=5, kusa_y=(758,928), sode='tousei',
         sode_col=None, kusa_col=None, mune=None, kanagu=GOLD, expand=90,
         tateage=None, hem_y=744):
    lace=lace or sh(col,0.5); sode_col=sode_col or col; kusa_col=kusa_col or col
    g=make(col=col, hem_y=hem_y, pattern=DO(kind,col,lace), sleeve='none',
           collar='stand', collar_col=sh(col,0.28), belt='sash', belt_col=sh(lace,0.12),
           expand=expand)
    d=ImageDraw.Draw(g)
    if tateage:      # 立挙（胸の上の別段）
        d.polygon([(CX-206,612),(CX+206,612),(CX+176,690),(CX-176,690)], fill=(*tateage,255))
        d.line([(CX-206,650),(CX+206,650)], fill=(*sh(tateage,0.3),255), width=6)
    if sode=='o':
        for s in (-1,1):
            x0,x1=sorted([CX+s*196, CX+s*348]); panel(d,x0,592,x1,846,sode_col,lace,kind,16)
    elif sode=='tousei':
        for s in (-1,1):
            x0,x1=sorted([CX+s*204, CX+s*318]); panel(d,x0,600,x1,772,sode_col,lace,kind,18)
    elif sode=='small':
        for s in (-1,1):
            x0,x1=sorted([CX+s*208, CX+s*296]); panel(d,x0,604,x1,724,sode_col,lace,kind,20)
    ky0,ky1=kusa_y
    span=496; wdt=span//kusa_n-8
    for i in range(kusa_n):
        x0=CX-span//2+i*(span//kusa_n)
        panel(d,x0,ky0,x0+wdt,ky1,kusa_col,lace,kind,12)
    if mune=='rokumon':
        for i in range(6):
            x=CX-72+(i%3)*72; y=650+(i//3)*62
            d.ellipse([x-26,y-26,x+26,y+26], fill=(*kanagu,255))
            d.rectangle([x-8,y-8,x+8,y+8], fill=(*col,255))
    elif mune=='none':
        pass
    else:
        d.ellipse([CX-42,636,CX+42,720], fill=(*kanagu,255))
        d.ellipse([CX-24,654,CX+24,702], fill=(*sh(kanagu,0.32),255))
    return clipsil(g, expand)

# ══ 兜 ═════════════════════════════════════════════════
def shikoro(d, col, n=4, w0=316, w1=752, y0=190):
    for i in range(n):
        k=i*18
        d.polygon([(w0-k*1.1,y0+k*0.8),(1024-w0+k*1.1,y0+k*0.8),
                   (w1+k*1.1,y0+78+k*0.9),(1024-w1-k*1.1,y0+78+k*0.9)],
                  fill=(*(col if i%2==0 else sh(col,0.16)),255))
# ★鉢（はち）を高くした：402×230（つぶれて見えた）→ 402×326
BOWL=[310,-22,712,304]
def bowl_suji(d, col, n=13):    # 筋兜（縦の筋がたくさん）
    d.ellipse(BOWL, fill=(*col,255))
    d.ellipse([310,-22,712,196], fill=(*li(col,0.14),255))
    for k in range(-(n//2),n//2+1):
        d.line([(511+k*11,-6),(511+k*30,300)], fill=(*sh(col,0.30),255), width=4)
def bowl_plain(d, col):
    d.ellipse(BOWL, fill=(*col,255))
    d.ellipse([310,-22,712,190], fill=(*li(col,0.16),255))
def ten(d, col=GOLD):
    d.ellipse([479,-24,543,36], fill=(*col,255))

def k_masamune():
    """伊達 の兜（六十二間筋兜・弦月前立）
       ★弦月は左右非対称。片側に偏って高く伸びる。
         （刀を振るうとき顔の前で邪魔にならないよう、利き手側を避けた形）"""
    import math
    l=new(); d=ImageDraw.Draw(l)
    # 弦月：下がり気味の端から、頭上をこえて反対側の高い先へ
    pts_o=[]; pts_i=[]
    for k in range(61):
        t=k/60.0
        a=math.radians(-25+165*t)          # −25°（低い側）→ 140°（高い先）
        r=285+100*t
        w=52*(math.sin(math.pi*t)**0.55)   # 両端は尖り、中ほどが太い
        x=511+r*math.cos(a); y=300-r*math.sin(a)
        nx,ny=math.cos(a),-math.sin(a)
        pts_o.append((x+nx*w/2,y+ny*w/2)); pts_i.append((x-nx*w/2,y-ny*w/2))
    d.polygon(pts_o+pts_i[::-1], fill=(*GOLD,255))
    for k in range(0,61,6):                # 内側に濃い線を1本入れて厚みを出す
        pass
    d.line(pts_i, fill=(*GOLD2,255), width=7)
    shikoro(d,(30,28,36),4)
    bowl_suji(d,(38,36,44),15)             # 六十二間筋兜
    ten(d,GOLD2)
    d.ellipse([471,140,551,214], fill=(*GOLD,255)); d.ellipse([487,156,535,198], fill=(*GOLD2,255))
    return bake_ears(l)
def k_yukimura():
    def f(d):
        shikoro(d,(160,34,38),4); bowl_suji(d,(186,44,46),11); ten(d)
        for s in (-1,1):
            x=511+s*236
            d.line([(x,268),(x+s*70,60)], fill=(*GOLD,255), width=22)
            d.line([(x+s*30,180),(x+s*112,138)], fill=(*GOLD,255), width=18)
            d.line([(x+s*52,120),(x+s*128,52)], fill=(*GOLD,255), width=16)
            d.line([(x+s*66,84),(x+s*40,-4)], fill=(*GOLD,255), width=16)
        for i in range(6):
            x=445+(i%3)*66; y=196+(i//3)*54
            d.ellipse([x-22,y-22,x+22,y+22], fill=(*GOLD,255))
            d.rectangle([x-6,y-6,x+6,y+6], fill=(186,44,46,255))
    return PH(f)
def k_ieyasu():
    def f(d):
        d.ellipse([288,86,734,330], fill=(44,40,46,255))        # 大黒頭巾形
        d.ellipse([288,86,734,250], fill=(70,64,72,255))
        d.ellipse([264,254,758,346], fill=(34,30,36,255))
        for s in (-1,1):
            x0,y0,x1,y1 = 511+s*30,244, 511+s*128,-10
            d.line([(x0,y0),(x1,y1)], fill=(*GOLD2,255), width=10)
            for k in range(9):
                t=k/8.0; px=x0+(x1-x0)*t; py=y0+(y1-y0)*t; ln=52-30*t
                for u in (-1,1):
                    d.polygon([(px,py),(px+u*ln*0.9-s*ln*0.1,py-ln*0.55),
                               (px+u*ln*1.05,py-ln*0.05),(px+u*ln*0.5,py+ln*0.25)],
                              fill=(*(GOLD if k%2==0 else sh(GOLD,0.12)),255))
        d.ellipse([445,198,577,296], fill=(*GOLD,255))
        d.ellipse([469,224,505,258], fill=(44,40,46,255)); d.ellipse([517,224,553,258], fill=(44,40,46,255))
        d.arc([466,252,556,290],0,180, fill=(44,40,46,255), width=9)
    return PH(f)
def k_shingen():
    def f(d):
        WH=(248,246,240)
        for k in range(34):
            a=math.radians(k*10.6)
            x=511+312*math.cos(a); y=210+230*math.sin(a)
            if y>340: continue
            d.ellipse([x-70,y-70,x+70,y+70], fill=(212,208,198,255))
            d.ellipse([x-63,y-63,x+63,y+63], fill=(*WH,255))
        shikoro(d,(164,42,40),3); bowl_plain(d,(190,52,48))
        d.ellipse([449,182,573,286], fill=(*GOLD,255))
        d.ellipse([471,208,505,242], fill=(120,30,30,255)); d.ellipse([517,208,551,242], fill=(120,30,30,255))
        d.arc([466,238,556,282],0,180, fill=(120,30,30,255), width=9)
    return PH(f)
def k_kenshin():
    """上杉 の兜（飯縄権現前立）
       ★主流は「日輪三日月」ではなく、白狐に乗った憤怒形の天狗を
         金銅で立体にした前立。鉢は黒漆にして、金の前立が見えるようにする。"""
    l=new(); d=ImageDraw.Draw(l)
    shikoro(d,(44,40,44),4); bowl_suji(d,(56,52,56),9); ten(d,GOLD)
    G=GOLD; G2=GOLD2; WH=(246,244,238); WH2=(202,198,188)
    # ── 台座（鉢の前の金の板）
    d.polygon([(430,300),(592,300),(576,236),(446,236)], fill=(*G2,255))
    # ── 白狐（前立の下に乗る）
    d.ellipse([398,150,590,224], fill=(*WH,255))
    d.ellipse([398,150,590,196], fill=(255,255,255,255))
    d.ellipse([548,132,624,204], fill=(*WH,255))                    # 頭
    for k in (0,1):
        d.polygon([(566+k*32,138),(580+k*32,90),(596+k*32,140)], fill=(*WH,255))
    d.ellipse([600,158,614,172], fill=(70,64,58,255))               # 目
    d.polygon([(400,178),(326,116),(356,192)], fill=(*WH,255))      # 尾
    d.line([(400,190),(590,190)], fill=(*WH2,255), width=4)
    for k in range(4):                                              # 脚
        d.rectangle([432+k*40,214,448+k*40,240], fill=(*WH2,255))
    # ── 飯縄権現（天狗）── 狐の上に立つ
    d.polygon([(511,148),(424,66),(390,-40),(486,32),(511,-30),
               (536,32),(632,-40),(598,66),(511,148)], fill=(*G2,255))   # 火焔光背
    d.ellipse([466,36,556,140], fill=(*G,255))                       # 胴
    d.ellipse([478,-16,544,50], fill=(*G,255))                       # 頭
    d.polygon([(542,4),(606,18),(544,28)], fill=(*G2,255))           # 長い鼻
    d.ellipse([492,2,506,16], fill=(60,52,36,255)); d.ellipse([518,2,532,16], fill=(60,52,36,255))
    for k in (-1,1):                                                 # 翼
        d.polygon([(511+k*30,52),(511+k*140,-24),(511+k*124,80),(511+k*36,104)], fill=(*G,255))
        d.line([(511+k*40,60),(511+k*126,4)], fill=(*G2,255), width=5)
    d.line([(558,62),(650,-40)], fill=(*G,255), width=14)            # 剣
    d.polygon([(640,-52),(666,-24),(638,-22)], fill=(*G,255))
    d.line([(464,68),(392,116)], fill=(*G,255), width=11)            # 羂索
    return bake_ears(l)
def k_kanetsugu():
    def f(d):
        shikoro(d,(38,48,78),4); bowl_suji(d,(46,58,92),13); ten(d)
        d.ellipse([344,26,678,244], fill=(*GOLD,255))
        d.ellipse([358,40,664,230], fill=(244,242,238,255))
        try:
            fnt=ImageFont.truetype(FONT,176); d.text((511,132),'愛',font=fnt,fill=(*GOLD2,255),anchor='mm')
        except Exception: d.rectangle([460,110,562,222], fill=(*GOLD,255))
    return PH(f)
def k_nobunaga():
    def f(d):                                   # 南蛮兜（モリオン風）
        C=(62,66,76)
        d.ellipse([206,236,816,352], fill=(*sh(C,0.2),255))     # 反り返るつば
        d.ellipse([206,236,816,320], fill=(*C,255))
        d.ellipse([318,-14,704,300], fill=(*C,255))
        d.ellipse([318,-14,704,190], fill=(*li(C,0.20),255))
        d.polygon([(492,40),(530,40),(546,300),(476,300)], fill=(*li(C,0.34),255))  # 鎬
        d.ellipse([196,270,300,336], fill=(*GOLD,255)); d.ellipse([722,270,826,336], fill=(*GOLD,255))
        for k in range(3):
            d.polygon([(600,240-k*8),(742,150-k*26),(800,146-k*22),(742,208-k*16),(636,290-k*6)],
                      fill=(*((230,80,80) if k%2==0 else (196,56,56)),255))
    return PH(f)
def k_naomasa():
    def f(d):                                   # 天衝脇立（大きな金の角）
        shikoro(d,(160,32,36),4); bowl_plain(d,(186,40,44)); ten(d)
        for s in (-1,1):
            d.polygon([(511+s*140,244),(511+s*196,-30),(511+s*268,-24),(511+s*236,266)],
                      fill=(*GOLD,255))
            d.polygon([(511+s*140,244),(511+s*176,40),(511+s*206,44),(511+s*188,258)],
                      fill=(*GOLD2,255))
        d.ellipse([467,180,555,264], fill=(*GOLD,255)); d.ellipse([485,198,537,246], fill=(*GOLD2,255))
    return PH(f)

BUSHO=[
 ('wearMasamune','伊達政宗・黒漆五枚胴具足',
  suit((40,38,46), (66,80,124), 'yokohagi', kusa_n=7, kusa_y=(756,940), sode='small',
       kusa_col=(36,34,42), tateage=(30,28,36), mune='center')),
 ('wearYukimura','真田幸村・朱の赤備え',
  suit((190,46,48), (150,26,32), 'yokohagi', kusa_n=5, kusa_y=(758,928), sode='tousei',
       mune='rokumon')),
 ('wearIeyasu','徳川家康・金陀美具足',
  suit((208,172,78), (168,124,40), 'hotoke', kusa_n=5, kusa_y=(756,930), sode='tousei',
       kusa_col=(196,160,70), kanagu=(120,90,36))),
 ('wearShingen','武田信玄・朱の伊予札',
  suit((192,54,50), (46,42,50), 'iyozane', kusa_n=4, kusa_y=(756,934), sode='o',
       sode_col=(176,46,44))),
 ('wearKenshin','上杉謙信・金小札浅葱糸威',
  suit((198,164,88), (118,180,196), 'kozane', kusa_n=5, kusa_y=(758,928), sode='o',
       sode_col=(182,148,72))),
 ('wearKanetsugu','直江兼続・紺糸威',
  suit((48,60,96), (216,208,190), 'kozane', kusa_n=5, kusa_y=(758,928), sode='tousei')),
 ('wearNobunaga','織田信長・南蛮胴具足',
  suit((68,72,84), (40,42,50), 'nanban', kusa_n=7, kusa_y=(752,916), sode='small',
       kusa_col=(56,60,70), mune='none', tateage=None)),
 ('wearNaomasa','井伊直政・朱の桶側胴',
  suit((188,42,46), (150,26,32), 'okegawa', kusa_n=5, kusa_y=(756,930), sode='small',
       mune='none')),
]
BUSHO_HATS=[
 ('hatKabutoMasamune','政宗の兜（六十二間筋兜・弦月）',k_masamune()),
 ('hatKabutoYukimura','幸村の兜（鹿角と六文銭）',k_yukimura()),
 ('hatKabutoIeyasu','家康の兜（大黒頭巾形・歯朶）',k_ieyasu()),
 ('hatKabutoShingen','信玄の兜（諏訪法性）',k_shingen()),
 ('hatKabutoKenshin','謙信の兜（日輪三日月）',k_kenshin()),
 ('hatKabutoKanetsugu','兼続の兜（愛）',k_kanetsugu()),
 ('hatKabutoNobunaga','信長の兜（南蛮兜）',k_nobunaga()),
 ('hatKabutoNaomasa','直政の兜（天衝脇立）',k_naomasa()),
]

if __name__=='__main__':
    S=310; cols=8
    sheet=Image.new('RGBA',(S*cols+22*(cols+1),(S+22)*2+22),(247,242,230,255))
    for i,((k,n,g),(hk,hn,hg)) in enumerate(zip(BUSHO,BUSHO_HATS)):
        p=new(); p.alpha_composite(body); p.alpha_composite(g); p.alpha_composite(head)
        c=Image.new('RGBA',(W,H),(255,253,248,255)); c.alpha_composite(p)
        sheet.alpha_composite(c.resize((S,S),Image.LANCZOS),(22+(S+22)*i,22))
        p=new(); p.alpha_composite(body); p.alpha_composite(g); p.alpha_composite(head); p.alpha_composite(hg)
        c=Image.new('RGBA',(W,H),(255,253,248,255)); c.alpha_composite(p)
        sheet.alpha_composite(c.resize((S,S),Image.LANCZOS),(22+(S+22)*i,22+(S+22)))
    sheet.convert('RGB').save('/home/claude/out/羊-有名武将8人.png')
    print('ok')
