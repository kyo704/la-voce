# -*- coding: utf-8 -*-
"""第2便：スタイル別の家具 27点（9スタイル×3）"""
from interior2 import *
OAK=(178,140,96); WAL=(112,80,56); PINE=(214,186,140); BLK=(58,56,60)
IRON=(96,96,102); BRASS=(190,158,96); WHT=(244,242,236); CRM=(232,222,200)
LIN=(206,192,164); LEA=(150,96,66); NAVY=(56,68,96); SAGE=(146,164,138)
RAT=(206,176,124); BAMB=(196,190,140); TERR=(190,112,84); ROSE=(206,150,150)
STON=(196,192,186); GRY=(146,148,152); GLS=(196,220,228); WASHI=(240,232,212)

FURN=[
# ── ナチュラル
('ナチュラル','木のベンチ＋布', sofa((214,204,178),frame=PINE,legs=PINE,arm='square',cushions=2,ol=(178,164,130))),
('ナチュラル','丸い木のテーブル', table(PINE,shape='round',h=104,ol=(170,146,106))),
('ナチュラル','麻のシェード', pendant(LIN,shape='cone',ol=(170,158,132))),
# ── アメリカン
('アメリカン','革の大きなソファ', sofa(LEA,legs=WAL,arm='round',cushions=3,tuft=4,back_h=126)),
('アメリカン','鉄脚のローテーブル', table(WAL,legs=IRON,shape='rect',h=76)),
('アメリカン','琺瑯のペンダント', pendant((236,232,224),shape='dome',ol=(190,186,178))),
# ── モダン
('モダン','直線の黒いソファ', sofa(BLK,legs=IRON,arm='square',cushions=2,back_h=104)),
('モダン','ガラスの天板', table(GLS,legs=IRON,shape='rect',h=92,mat='glass')),
('モダン','細い金属のフロアランプ', floorlamp((238,236,230),pole=IRON,shape='cone',ol=(186,184,178))),
# ── 北欧
('北欧','曲線の木脚チェア', chair((222,214,196),frame=OAK,back='round',cushion=(196,206,208),ol=(168,154,120))),
('北欧','白い丸テーブル', table(WHT,legs=OAK,shape='round',h=100,ol=(198,194,186))),
('北欧','白い球のペンダント', pendant(WHT,shape='ball',ol=(196,192,184))),
# ── アジアン
('アジアン','ラタンのソファ', sofa((208,198,172),frame=RAT,legs=RAT,style='rattan',arm='round',ol=(170,142,96))),
('アジアン','竹の低い卓', table(BAMB,legs=sh(BAMB,0.24),shape='rect',h=68,ol=(158,152,108))),
('アジアン','透かし彫りのランプ', pendant((196,158,104),shape='drum',ol=(150,118,72))),
# ── インダストリアル
('インダストリアル','鉄と革のスツール', chair(LEA,frame=IRON,back='panel',legs='straight',ol=(70,70,76))),
('インダストリアル','足場板の作業机', table((156,124,88),legs=IRON,shape='rect',h=96)),
('インダストリアル','裸電球＋金属笠', pendant(IRON,shape='metal',ol=(62,62,68))),
# ── カントリー
('カントリー','花柄のソファ', sofa((214,178,178),frame=OAK,legs=OAK,arm='round',cushions=3,ol=(178,146,110))),
('カントリー','木の食卓', table(OAK,legs=sh(OAK,0.26),shape='rect',h=104)),
('カントリー','ステンドの傘', pendant((188,132,96),shape='cone',ol=(140,92,64))),
# ── ホテルライク
('ホテルライク','低いラウンジチェア', chair(NAVY,frame=WAL,back='round',cushion=(72,86,116),ol=(84,60,42))),
('ホテルライク','石の天板', table(STON,legs=BRASS,shape='rect',h=88,ol=(168,164,158))),
('ホテルライク','間接照明のスタンド', floorlamp(CRM,pole=BRASS,shape='drum',ol=(190,180,158))),
# ── ミックス
('ミックス','座椅子', chair((176,150,132),frame=WAL,back='panel',cushion=(196,170,150),ol=(84,60,42))),
('ミックス','木＋鉄の卓', table(OAK,legs=IRON,shape='rect',h=84)),
('ミックス','和紙のスタンド', floorlamp(WASHI,pole=(150,132,104),shape='ball',ol=(196,188,166))),
]
