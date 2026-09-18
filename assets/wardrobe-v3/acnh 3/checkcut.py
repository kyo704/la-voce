# -*- coding: utf-8 -*-
"""画面のふちで切れているアセットを、機械で見つける"""
import numpy as np, os, sys
from PIL import Image
MARGIN=4
def scan(root):
    bad=[]
    for dp,_,fs in os.walk(root):
        for f in sorted(fs):
            if not f.lower().endswith('.png'): continue
            p=os.path.join(dp,f)
            try: a=np.array(Image.open(p).convert('RGBA'))[:,:,3]
            except Exception: continue
            h,w=a.shape
            hit=[]
            if (a[:MARGIN,:]>10).any(): hit.append('上')
            if (a[-MARGIN:,:]>10).any(): hit.append('下')
            if (a[:,:MARGIN]>10).any(): hit.append('左')
            if (a[:,-MARGIN:]>10).any(): hit.append('右')
            if hit:
                ys,xs=np.nonzero(a>10)
                bad.append((p, '・'.join(hit), ys.min(), ys.max(), xs.min(), xs.max()))
    return bad
for root in sys.argv[1:]:
    print(f'===== {root}')
    b=scan(root)
    if not b: print('  切れなし')
    for p,h,y0,y1,x0,x1 in b:
        print(f'  {os.path.basename(os.path.dirname(p))}/{os.path.basename(p):28s} {h:6s} y{y0}-{y1} x{x0}-{x1}')
