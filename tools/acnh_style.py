# -*- coding: utf-8 -*-
"""「あつ森の様式で作ったら」の実験
   ★キャラクターを似せるのではなく、様式（立体的な陰影・布の質感・接地影・
     輪郭線なし・彩度を落とした暖色）だけを当てる"""
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np, math
import garment as G, catalog as C, feet as Ft

def soft_shade(img, lx=-0.55, ly=-0.75, strength=0.30, rim=0.16):
    """面の中に立体的なグラデーションを入れる（3Dレンダリング風）"""
    a=np.array(img).astype(float)
    al=a[:,:,3]
    m=(al>10)
    ys,xs=np.nonzero(m)
    if len(xs)==0: return img
    # 距離場：内側ほど明るく、縁ほど暗く
    mask=Image.fromarray((m*255).astype('uint8'))
    inner=np.array(mask.filter(ImageFilter.GaussianBlur(26))).astype(float)/255.0
    # 方向のある陰影
    h,w=al.shape
    gy,gx=np.mgrid[0:h,0:w].astype(float)
    cx,cy=xs.mean(),ys.mean(); r=max(xs.max()-xs.min(), ys.max()-ys.min())/2.0
    dirv=((gx-cx)/r*lx + (gy-cy)/r*ly)
    dirv=np.clip(dirv,-1,1)
    lit = 1.0 + strength*dirv*inner + rim*(1.0-inner)*(-0.6)
    for c in range(3):
        a[:,:,c]=np.clip(a[:,:,c]*lit,0,255)
    return Image.fromarray(a.astype('uint8'))

def felt(img, amt=7, seed=3):
    """布・フェルトの質感（細かいむら）"""
    a=np.array(img).astype(int)
    rnd=np.random.default_rng(seed)
    h,w=a.shape[:2]
    n=rnd.integers(-amt,amt+1,(h,w,1))
    n=np.array(Image.fromarray(((n[:,:,0]+amt)*(255//(2*amt))).astype('uint8')).filter(ImageFilter.GaussianBlur(0.6)))
    n=(n.astype(int)-127)//9
    a[:,:,:3]=np.clip(a[:,:,:3]+n[:,:,None],0,255)
    return Image.fromarray(a.astype('uint8'))

def warm(img, sat=0.88, warmth=8):
    a=np.array(img).astype(float)
    g=a[:,:,:3].mean(2,keepdims=True)
    a[:,:,:3]=np.clip(g+(a[:,:,:3]-g)*sat,0,255)
    a[:,:,0]=np.clip(a[:,:,0]+warmth,0,255)
    a[:,:,2]=np.clip(a[:,:,2]-warmth*0.6,0,255)
    return Image.fromarray(a.astype('uint8'))

def ground_shadow(img, y=1006, w=340, h=52, a=110, blur=14):
    sh=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(sh)
    cx=img.size[0]//2
    d.ellipse([cx-w//2,y-h//2,cx+w//2,y+h//2],fill=(86,74,60,a))
    return sh.filter(ImageFilter.GaussianBlur(blur))

def restyle(p):
    p=soft_shade(p)
    p=felt(p)
    p=warm(p)
    return p
