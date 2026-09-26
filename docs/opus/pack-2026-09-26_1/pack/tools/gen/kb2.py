# -*- coding: utf-8 -*-
"""★歌舞伎・文楽の 第2陣で 使う 道具。
★★役の 一覧を ★場面から 自動で 集めます ── ★取り違えが 起きません"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from t3_kabuki import KB, BU

def _roles(scenes):
    r = []
    for g, lab, who in scenes:
        for w in who:
            if w not in r: r.append(w)
    return r

def K2(f, title, scenes, **kw):
    return KB(f, title, _roles(scenes), scenes, **kw)

def B2(f, title, scenes, **kw):
    return BU(f, title, _roles(scenes), scenes, **kw)

G = "竹本（義太夫）"; N = "長唄囃子連中"; K = "黒御簾"
T = "太夫"; SH = "三味線"; NG = "人形遣い"
