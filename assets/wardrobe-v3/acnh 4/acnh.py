# -*- coding: utf-8 -*-
"""あつ森の様式に寄せる ── 全アセットに同じ処理をかける
   要点：★光の向きをキャンバスの絶対座標で決める。
        アイテムごとに向きが変わると、まとめたときに「別の世界」に見えます。"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, hashlib

LIGHT=(392, 286)        # 光源（1024基準・左上前方）
FALL =760               # 光の届く半径
SAT  =0.88              # 彩度
WARM =8                 # 赤みを足す量
STRENGTH=0.30           # 立体感の強さ
RIM  =0.20              # ふちの締め
BLUR =26                # 丸みのやわらかさ
GRAIN=5                 # フェルトの粒

def shade(img, strength=STRENGTH, rim=RIM, blur=BLUR, light=LIGHT, fall=FALL):
    a=np.array(img).astype(float); al=a[:,:,3]
    if not (al>10).any(): return img
    h,w=al.shape
    # 「内側ほど明るい」＝丸み（アイテムごとの形から）
    inner=np.array(Image.fromarray(((al>10)*255).astype('uint8'))
                   .filter(ImageFilter.GaussianBlur(blur))).astype(float)/255.
    # 「光の向き」＝キャンバスの絶対座標から（全アイテム共通）
    gy,gx=np.mgrid[0:h,0:w].astype(float)
    dist=np.sqrt((gx-light[0])**2+(gy-light[1])**2)/fall
    lit=1.0+strength*np.clip(1.0-dist,-1,1)*inner-rim*(1.0-inner)*0.65
    for c in range(3): a[:,:,c]=np.clip(a[:,:,c]*lit,0,255)
    return Image.fromarray(a.astype('uint8'))

def felt(img, amt=GRAIN, key='x'):
    """フェルトの質感。★ファイル名から種を作るので、毎回同じ粒になります"""
    a=np.array(img).astype(int); h,w=a.shape[:2]
    seed=int(hashlib.md5(key.encode()).hexdigest()[:8],16)
    rnd=np.random.default_rng(seed)
    n=rnd.integers(0,255,(h,w)).astype('uint8')
    n=np.array(Image.fromarray(n).filter(ImageFilter.GaussianBlur(1.5))).astype(int)
    n=(n-127)*amt//26
    a[:,:,:3]=np.clip(a[:,:,:3]+n[:,:,None],0,255)
    return Image.fromarray(a.astype('uint8'))

def tone(img, sat=SAT, warm=WARM):
    a=np.array(img).astype(float)
    g=a[:,:,:3].mean(2,keepdims=True)
    a[:,:,:3]=np.clip(g+(a[:,:,:3]-g)*sat,0,255)
    a[:,:,0]=np.clip(a[:,:,0]+warm,0,255)
    a[:,:,2]=np.clip(a[:,:,2]-warm*0.6,0,255)
    return Image.fromarray(a.astype('uint8'))

def restyle(img, key='x', mode='full'):
    """mode: full/soft=立体＋色 ／ flat=色だけ（タイル・景色用）
    ★フェルトの粒は焼き込みません。1枚のタイル（grain_tile.png）を
      画面全体に1回かけてください。焼き込むとPNGが8倍に膨らみます。"""
    if mode=='flat':  return tone(img)
    return tone(shade(img))

def grain_tile(size=512, amt=16, blur=1.4, seed=20260906):
    """★実行時に画面全体へ1回かける、継ぎ目のない粒テクスチャ
       使い方：合成した絵の上に overlay（不透明度 10〜14%）で敷き詰める"""
    rnd=np.random.default_rng(seed)
    n=rnd.integers(0,255,(size,size)).astype('uint8')
    big=np.tile(n,(3,3))
    big=np.array(Image.fromarray(big).filter(ImageFilter.GaussianBlur(blur)))
    c=big[size:size*2,size:size*2].astype(int)
    c=np.clip(128+(c-128)*amt//32,0,255).astype("uint8")
    return Image.fromarray(np.dstack([c,c,c,np.full_like(c,255)]),"RGBA")

def ground_shadow(size=(1024,1024), y=1006, w=350, h=54, alpha=104, blur=15):
    """★アイテムに焼き込まず、アプリ側で別レイヤーとして描く"""
    sh=Image.new('RGBA',size,(0,0,0,0))
    ImageDraw.Draw(sh).ellipse([size[0]//2-w//2,y-h//2,size[0]//2+w//2,y+h//2],
                              fill=(84,72,58,alpha))
    return sh.filter(ImageFilter.GaussianBlur(blur))
