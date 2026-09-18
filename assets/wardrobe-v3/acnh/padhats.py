# -*- coding: utf-8 -*-
"""★帽子・兜の余白（ヘッドルーム）を作り直す
   1024×1280 のキャンバスに描き、羊の座標 y は キャンバス y − PAD とする。
   これで鍬形・天衝・毛が、切れずに全部入ります。"""
from PIL import Image, ImageDraw
import numpy as np
PAD=256
W,HP=1024,1024+PAD

class OffsetDraw:
    """ImageDraw の呼び出しを受けて、y にだけ PAD を足すラッパー"""
    def __init__(self,d,dy=PAD): self._d=d; self._dy=dy
    def _s(self,xy):
        if xy is None: return xy
        if isinstance(xy,(list,tuple)) and len(xy)>0 and isinstance(xy[0],(list,tuple)):
            return [(p[0],p[1]+self._dy) for p in xy]
        o=list(xy)
        for i in range(1,len(o),2): o[i]=o[i]+self._dy
        return o
    def __getattr__(self,n):
        f=getattr(self._d,n)
        def w(xy=None,*a,**k):
            return f(self._s(xy),*a,**k) if xy is not None else f(*a,**k)
        return w

def padded():           return Image.new('RGBA',(W,HP),(0,0,0,0))
def to_pad(img):
    """1024×1024 の絵を、余白つきキャンバスの正しい位置へ"""
    o=padded(); o.alpha_composite(img.convert('RGBA'),(0,PAD)); return o
def crop_check(img):
    a=np.array(img)[:,:,3]; ys,xs=np.nonzero(a>10)
    return (ys.min(),ys.max(),xs.min(),xs.max())
