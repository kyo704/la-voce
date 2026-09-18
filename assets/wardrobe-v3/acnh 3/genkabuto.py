# -*- coding: utf-8 -*-
"""兜を「上の余白つき」で描き直す（1024×1280／羊のyはキャンバスy−256）"""
import padhats as P
from PIL import Image, ImageDraw
import numpy as np, os
import busho2 as B, acc
EAR=P.to_pad(acc.EARIMG)
_D=ImageDraw.Draw
def Draw_pad(im,*a,**k):
    d=_D(im,*a,**k)
    return P.OffsetDraw(d) if im.size==(P.W,P.HP) else d
B.ImageDraw.Draw=Draw_pad              # ★ここ一箇所だけで y に +256 が入る
B.new=P.padded
def bake_pad(l):
    o=l.copy(); o.alpha_composite(EAR); return o
B.bake_ears=bake_pad
def PH_pad(fn):
    l=P.padded(); fn(Draw_pad(l)); return bake_pad(l)
B.PH=PH_pad
def crescent_pad(bo,bi,col):
    l=P.padded(); _D(l).ellipse([bo[0],bo[1]+P.PAD,bo[2],bo[3]+P.PAD],fill=(*col,255))
    a=np.array(l); yy,xx=np.mgrid[0:P.HP,0:P.W]
    x0,y0,x1,y1=bi; y0+=P.PAD; y1+=P.PAD
    cx,cy=(x0+x1)/2,(y0+y1)/2; rx,ry=(x1-x0)/2,(y1-y0)/2
    a[((xx-cx)/rx)**2+((yy-cy)/ry)**2<=1,3]=0
    return Image.fromarray(a)
B.crescent=crescent_pad
KAB=[('hatKabutoMasamune','伊達 の兜',B.k_masamune),('hatKabutoYukimura','真田 の兜',B.k_yukimura),
     ('hatKabutoIeyasu','徳川 の兜',B.k_ieyasu),('hatKabutoShingen','武田 の兜',B.k_shingen),
     ('hatKabutoKenshin','上杉 の兜',B.k_kenshin),('hatKabutoKanetsugu','直江 の兜',B.k_kanetsugu),
     ('hatKabutoNobunaga','織田 の兜',B.k_nobunaga),('hatKabutoNaomasa','井伊 の兜',B.k_naomasa)]
if __name__=='__main__':
    os.makedirs('/home/claude/out/hats_pad',exist_ok=True)
    for key,nm,fn in KAB:
        g=fn(); g.save(f'/home/claude/out/hats_pad/{key}@pad.png')
        a=np.array(g)[:,:,3]; ys,xs=np.nonzero(a>10)
        print(f'{nm:8s} 羊のy {ys.min()-P.PAD:5d} 〜 {ys.max()-P.PAD:4d}   x{xs.min()}-{xs.max()}')
