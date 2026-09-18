# -*- coding: utf-8 -*-
import os, json, shutil
from interior2 import *
import int_style as ST, int_more as MO, int_showa as SW
from PIL import Image, ImageDraw, ImageFont
BG=(250,249,246); ROOM=(236,230,218); FLOORC=(214,204,186)
FB='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
FR='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
fb=lambda s: ImageFont.truetype(FB,s); fr=lambda s: ImageFont.truetype(FR,s)
OUT='/home/claude/out/interior'; shutil.rmtree(OUT,ignore_errors=True)

OAK=(160,126,88); WHT=(244,242,236); BLK=(56,54,58); IRON=(96,96,102)
WAL=(112,80,56); PINE=(206,176,124); CRM=(228,218,192); RED=(178,72,64)

WINDOWS=[('ナチュラル','木の格子',MO.window('wood',PINE)),
 ('アメリカン','白い格子',MO.window('grid',WHT,ol=(196,192,184))),
 ('モダン','黒い細枠',MO.window('slim',BLK)),
 ('北欧','丸窓',MO.window('round',WHT,ol=(196,192,184))),
 ('アジアン','木の格子（細）',MO.window('koshi',(150,116,78))),
 ('インダストリアル','鉄の枠',MO.window('iron',IRON)),
 ('カントリー','アーチ窓',MO.window('arch',CRM,ol=(190,182,160))),
 ('ホテルライク','掃き出し窓',MO.window('full',(196,192,186))),
 ('ミックス','ステンドの小窓',MO.window('stained',(90,86,80))),
 ('昭和','木製サッシ＋すりガラス',MO.window('sash',(150,116,78))),
 ('昭和','雪見障子',MO.window('shoji',(150,116,78))),
 ('昭和','欄間',MO.window('ranma',(140,104,68))),
 ('昭和','格子窓',MO.window('koshi',(126,92,60))),
]
DOORS=[('ナチュラル','木の框戸',MO.door('panel',PINE)),
 ('アメリカン','ガラス入り',MO.door('glassdoor',(160,124,84))),
 ('モダン','鉄の枠',MO.door('iron',BLK)),
 ('北欧','白い框戸',MO.door('panel',WHT,ol=(196,192,184))),
 ('アジアン','引き戸',MO.door('slide',(150,116,78))),
 ('インダストリアル','鉄とガラス',MO.door('iron',IRON)),
 ('カントリー','アーチ扉',MO.door('arch',(186,146,102))),
 ('ホテルライク','框戸（濃色）',MO.door('panel',WAL)),
 ('ミックス','ガラスの引き戸',MO.door('slide',(170,134,90))),
 ('昭和','障子',MO.door('shoji',(150,116,78))),
 ('昭和','襖',MO.door('fusuma',(214,204,178))),
 ('昭和','ガラスの框戸',MO.door('kamachi',(140,104,68))),
]
VIEWS=[('晴れ',MO.view('day')),('夕暮れ',MO.view('sunset')),('夜',MO.view('night')),
 ('雨',MO.view('rain')),('雪',MO.view('snow')),('森',MO.view('forest')),
 ('海',MO.view('sea')),('町',MO.view('town')),('田んぼ',MO.view('rice')),
 ('昭和の路地',MO.view('alley')),('縁側から見た庭',MO.view('garden')),
 ('桜',MO.view('sakura')),('町の屋根',MO.view('roof'))]
GARDEN=[('鳥の水場',MO.garden('birdbath')),('灯籠',MO.garden('lantern')),
 ('鹿おどし',MO.garden('shishi')),('ベンチ',MO.garden('bench')),
 ('植木鉢',MO.garden('pot')),('白い柵',MO.garden('fence',ol=(180,172,152))),
 ('ポスト',MO.garden('post')),('風車',MO.garden('windmill')),
 ('かかし',MO.garden('scarecrow')),('井戸',MO.garden('well')),
 ('焚き火',MO.garden('bonfire')),('物干し',MO.garden('hanging')),
 ('飛び石',MO.garden('stepstone')),('鳥居',MO.garden('torii'))]
WALLART=[('風景の額',MO.wallart('frame_land')),('抽象の額',MO.wallart('frame_abst')),
 ('丸い時計',MO.wallart('clock_round')),('柱時計',MO.wallart('clock_pendulum')),
 ('鏡',MO.wallart('mirror')),('飾り棚',MO.wallart('shelf')),
 ('帽子掛け',MO.wallart('hatrack')),('カレンダー',MO.wallart('calendar')),
 ('掛け軸',MO.wallart('shoji_art')),('写真',MO.wallart('photos')),
 ('トロフィー',MO.wallart('trophy')),('楽譜の額',MO.wallart('score')),
 ('リース',MO.wallart('wreath'))]
SHOWA=[('石油ランプ',SW.showa('oil_lamp')),('柱時計',SW.showa('wall_clock')),
 ('桐たんす',SW.showa('kiri_tansu')),('鏡台（三面鏡）',SW.showa('kyodai')),
 ('足踏みミシン',SW.showa('mishin')),('洋燈のシャンデリア',SW.showa('chandelier')),
 ('ちゃぶ台',SW.showa('chabudai')),('茶箪笥',SW.showa('chadansu')),
 ('火鉢',SW.showa('hibachi')),('黒電話と電話台',SW.showa('kurodenwa')),
 ('真空管ラジオ',SW.showa('radio')),('座卓と座布団',SW.showa('zataku')),
 ('ブラウン管テレビ',SW.showa('tv')),('電気こたつ',SW.showa('kotatsu')),
 ('ステレオ',SW.showa('stereo')),('扇風機',SW.showa('fan')),
 ('応接セット',SW.showa('sofa_vinyl')),('サイドボード',SW.showa('sideboard')),
 ('★縁側',SW.showa('engawa'))]
TILES=[('壁','砂壁',SW.sunakabe()),('壁','繊維壁',SW.senikabe()),('壁','土壁',SW.tsuchikabe()),
 ('壁','花柄の古いクロス',SW.furukurosu()),('壁','モルタル',SW.mortar()),
 ('床','畳',SW.tatami_tile()),('床','飴色の板の間',SW.ameiro()),
 ('床','リノリウム',SW.linoleum()),('床','昭和の絨毯',SW.carpet_showa())]

GROUPS={'furniture':[(s,n,g) for s,n,g in ST.FURN],
        'window':WINDOWS,'door':DOORS,'view':VIEWS,'garden':GARDEN,
        'wallart':WALLART,'showa':SHOWA,'tile':TILES}
man=[]
for cat,items in GROUPS.items():
    os.makedirs(f'{OUT}/{cat}',exist_ok=True)
    for i,it in enumerate(items):
        if len(it)==3: a,b,img=it; nm=f'{a}／{b}'
        else:          nm,img=it; a=None
        key=f'{cat}_{i+1:02d}'; img.save(f'{OUT}/{cat}/{key}.png')
        man.append({'key':key,'category':cat,'name':nm,'style':a,
                    'src':f'/assets/home/{cat}/{key}.png',
                    'width':img.width,'height':img.height})
json.dump(man,open(f'{OUT}/manifest.json','w'),ensure_ascii=False,indent=1)
print('点数',len(man))

def sheet(items,title,path,cols=6,cell=250,bg=ROOM,floor=True,size=None):
    rows=(len(items)+cols-1)//cols
    im=Image.new('RGB',(cols*cell+40,rows*(cell+44)+110),BG); d=ImageDraw.Draw(im)
    d.text((26,26),title,font=fb(36),fill=(38,38,38))
    for i,it in enumerate(items):
        if len(it)==3: a,b,g=it; lab=[a,b]
        else: b,g=it; lab=['',b]
        r,c=divmod(i,cols); x=20+c*cell; y=92+r*(cell+44)
        w,h=g.size
        bcv=Image.new('RGB',(w,h),bg)
        if floor and h==320: ImageDraw.Draw(bcv).rectangle([0,300,w,h],fill=FLOORC)
        bcv.paste(g,(0,0),g)
        sc=(cell-14)/max(w,h)
        bcv=bcv.resize((int(w*sc),int(h*sc)))
        im.paste(bcv,(x+((cell-14)-bcv.width)//2,y))
        d.text((x+4,y+cell-26),lab[0],font=fr(17),fill=(152,148,142))
        d.text((x+4,y+cell-6),lab[1],font=fr(18),fill=(80,78,74))
    im.save(path,quality=95); print(path)

sheet(WINDOWS,'第3便：窓枠 13点（中は抜いてあり、景色が透けます）','/home/claude/out/内装-窓枠.png',cols=5,bg=(226,232,232),floor=False)
sheet(DOORS,'第3便：扉 12点','/home/claude/out/内装-扉.png',cols=6,bg=ROOM,floor=False)
sheet(VIEWS,'窓の外の景色 13点（480×320）','/home/claude/out/内装-窓の景色.png',cols=4,cell=300,bg=BG,floor=False)
sheet(GARDEN,'庭の置物 14点','/home/claude/out/内装-庭の置物.png',cols=5,bg=(214,226,200))
sheet(WALLART,'壁掛け 13点','/home/claude/out/内装-壁掛け.png',cols=5,bg=ROOM,floor=False)
sheet(SHOWA,'第4便：明治〜昭和の家具 19点','/home/claude/out/内装-昭和の家具.png',cols=5)
sheet(TILES,'第5便：昭和の壁・床 9点（256タイル）','/home/claude/out/内装-昭和の壁床.png',cols=5,bg=BG,floor=False)
