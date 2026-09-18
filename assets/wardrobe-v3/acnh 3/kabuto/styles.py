# -*- coding: utf-8 -*-
"""様式の比較 ── 同じ羊に、5つの見せ方を当てる"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

def _mask(img):
    a=np.array(img); return a, (a[:,:,3]>10)

def soft_shade(img, lx=-0.5, ly=-0.8, strength=0.30, rim=0.18, blur=26):
    a=np.array(img).astype(float); al=a[:,:,3]; m=(al>10)
    ys,xs=np.nonzero(m)
    if len(xs)==0: return img
    inner=np.array(Image.fromarray((m*255).astype('uint8')).filter(ImageFilter.GaussianBlur(blur))).astype(float)/255.
    h,w=al.shape; gy,gx=np.mgrid[0:h,0:w].astype(float)
    cx,cy=xs.mean(),ys.mean(); r=max(xs.max()-xs.min(),ys.max()-ys.min())/2.
    dirv=np.clip((gx-cx)/r*lx+(gy-cy)/r*ly,-1,1)
    lit=1.0+strength*dirv*inner-rim*(1.0-inner)*0.6
    for c in range(3): a[:,:,c]=np.clip(a[:,:,c]*lit,0,255)
    return Image.fromarray(a.astype('uint8'))

def top_light(img, amount=0.22):
    """上からのやわらかい光（丸みだけを出す）"""
    a=np.array(img).astype(float); h,w=a.shape[:2]
    g=np.linspace(1+amount,1-amount*0.8,h)[:,None]
    for c in range(3): a[:,:,c]=np.clip(a[:,:,c]*g,0,255)
    return Image.fromarray(a.astype('uint8'))

def grain(img, amt=8, size=0.6, seed=3):
    a=np.array(img).astype(int); h,w=a.shape[:2]
    rnd=np.random.default_rng(seed)
    n=rnd.integers(0,255,(h,w)).astype('uint8')
    n=np.array(Image.fromarray(n).filter(ImageFilter.GaussianBlur(size))).astype(int)
    n=(n-127)*amt//64
    a[:,:,:3]=np.clip(a[:,:,:3]+n[:,:,None],0,255)
    return Image.fromarray(a.astype('uint8'))

def tone(img, sat=1.0, warm=0, sepia=0.0):
    a=np.array(img).astype(float)
    g=a[:,:,:3].mean(2,keepdims=True)
    a[:,:,:3]=np.clip(g+(a[:,:,:3]-g)*sat,0,255)
    if warm:
        a[:,:,0]=np.clip(a[:,:,0]+warm,0,255); a[:,:,2]=np.clip(a[:,:,2]-warm*0.6,0,255)
    if sepia:
        sp=np.stack([g[:,:,0]*1.07,g[:,:,0]*0.97,g[:,:,0]*0.82],2)
        a[:,:,:3]=a[:,:,:3]*(1-sepia)+sp*sepia
    return Image.fromarray(np.clip(a,0,255).astype('uint8'))

def ground(size, y=1006, w=340, h=52, alpha=110, blur=14):
    sh=Image.new('RGBA',size,(0,0,0,0)); d=ImageDraw.Draw(sh)
    cx=size[0]//2
    d.ellipse([cx-w//2,y-h//2,cx+w//2,y+h//2],fill=(86,74,60,alpha))
    return sh.filter(ImageFilter.GaussianBlur(blur))

# ── 5つの様式 ────────────────────────────────────────
STYLES=[
 ('A いま（フラット）', (250,249,246), lambda p: p),
 ('B あつ森の様式', (240,233,218),
   lambda p: grain(tone(soft_shade(p),sat=0.88,warm=8),amt=7,seed=3)),
 ('C 絵本（紙とインク）', (243,238,226),
   lambda p: grain(tone(top_light(p,0.12),sat=0.94,warm=4),amt=15,size=1.1,seed=9)),
 ('D やわらかグラデ', (248,246,244),
   lambda p: soft_shade(top_light(p,0.20),strength=0.20,rim=0.10,blur=44)),
 ('E 和・低彩度', (238,232,222),
   lambda p: grain(tone(soft_shade(p,strength=0.22),sat=0.62,sepia=0.20),amt=10,seed=5)),
]
SHADOW={'A':False,'B':True,'C':False,'D':True,'E':True}
