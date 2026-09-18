# -*- coding: utf-8 -*-
"""全アセットを あつ森様式 に変換する"""
import os, shutil, sys
from PIL import Image
import acnh
SRC_DST=[('/home/claude/out/parts','/home/claude/out/acnh/parts'),
         ('/home/claude/out/interior','/home/claude/out/acnh/interior'),
         ('/home/claude/out/hats_pad','/home/claude/out/acnh/kabuto')]
# タイルと景色は「色だけ」（陰影を入れると敷き詰めの継ぎ目が出るため）
FLAT_DIRS={'tile','view'}
SOFT_DIRS={'eyes'}          # メガネは粒を入れない
n=0
for src,dst in SRC_DST:
    for dp,_,fs in os.walk(src):
        rel=os.path.relpath(dp,src); od=os.path.join(dst,rel); os.makedirs(od,exist_ok=True)
        cat=os.path.basename(dp)
        mode='flat' if cat in FLAT_DIRS else ('soft' if cat in SOFT_DIRS else 'full')
        for f in sorted(fs):
            p=os.path.join(dp,f)
            if f.lower().endswith('.png'):
                im=Image.open(p).convert('RGBA')
                acnh.restyle(im,key=f,mode=mode).save(os.path.join(od,f),optimize=True); n+=1
            else:
                shutil.copy(p,os.path.join(od,f))
# 羊そのもの
os.makedirs('/home/claude/out/acnh/sheep',exist_ok=True)
for f,mode in (('sheepparts2/sheep_body.png','full'),('sheepparts2/sheep_head.png','full'),
               ('orig_sheep.png','full')):
    im=Image.open(f).convert('RGBA')
    acnh.restyle(im,key=os.path.basename(f),mode=mode).save('/home/claude/out/acnh/sheep/'+os.path.basename(f),optimize=True); n+=1
acnh.ground_shadow().save('/home/claude/out/acnh/sheep/ground_shadow.png'); n+=1
acnh.grain_tile().save('/home/claude/out/acnh/sheep/grain_tile.png'); n+=1
print('変換した点数',n)
