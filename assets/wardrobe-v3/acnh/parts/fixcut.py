# -*- coding: utf-8 -*-
"""ふちで切れているアセットを直す
   ★頭に載る位置（下側）は動かさず、SPLITより上だけを縦に縮める"""
import numpy as np, os, shutil
from PIL import Image
MARGIN=16; SPLIT=250
def fix_top(img, margin=MARGIN, split=SPLIT):
    a=np.array(img); al=a[:,:,3]
    ys,_=np.nonzero(al>10)
    if len(ys)==0 or ys.min()>=margin: return img, False
    y0=ys.min()
    k=(split-margin)/float(split-y0)          # 圧縮率
    out=np.zeros_like(a)
    out[split:]=a[split:]                     # 下はそのまま
    H=a.shape[0]
    for y in range(0,split):
        src = split - (split-y)/k             # 逆写像
        if src<0 or src>=split: continue
        s0=int(np.floor(src)); t=src-s0
        s1=min(s0+1,split-1)
        row=(a[s0].astype(float)*(1-t)+a[s1].astype(float)*t)
        out[y]=np.clip(row,0,255).astype('uint8')
    return Image.fromarray(out), True

def run(paths, outdir=None):
    n=0
    for p in paths:
        img=Image.open(p).convert('RGBA')
        fixed,changed=fix_top(img)
        if changed:
            dst=p if outdir is None else os.path.join(outdir,os.path.basename(p))
            fixed.save(dst); n+=1; print('  直した',os.path.basename(p))
    return n
if __name__=='__main__':
    import sys, glob
    tgt=[]
    for root in sys.argv[1:]:
        for dp,_,fs in os.walk(root):
            for f in fs:
                if f.lower().endswith('.png'): tgt.append(os.path.join(dp,f))
    print('直した数',run(tgt))
