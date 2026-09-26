#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★★見本と 実装の 見た目を 1画素まで くらべます。

★★★いちばん 大事な こと
  ★この 道具は ★★同じ 環境で 撮った 2枚 の 間でしか 使えません。
  ★Mac の Safari と ★CI の Linux では ★フォントが 違うので ★必ず 差が 出ます。
  ★★『見本を Mac で 撮り、実装を CI で 撮って くらべる』── ★これは できません。

★★2026-09-26 に 測った こと（★このコンテナ）
  ★同じ 画面を 3回 撮る → ★差 0 画素。★床のノイズが ありません
  ★★だから 閾値は 0（完全一致）が 使えます
  ★閾値 0.005 に すると ★RGB の 差 1（★色の 微妙な ずれ）を 見逃します

★使い方:
  python3 pixel_lint.py 見本.png 実装.png            # ★くらべる（★先に 較正します）
  python3 pixel_lint.py --calibrate 見本.png         # ★道具だけ 試す
"""
import sys, os, numpy as np
from PIL import Image

MAXD = 35215.0          # ★YIQ の 差の 最大値

def load(p):
    im = Image.open(p).convert('RGB')
    return np.asarray(im).astype(np.int16), im.size

def _yiq(a):
    return (a[...,0]*0.29889531 + a[...,1]*0.58662247 + a[...,2]*0.11448223,
            a[...,0]*0.59597799 - a[...,1]*0.27417610 - a[...,2]*0.32180189,
            a[...,0]*0.21147017 - a[...,1]*0.52261711 + a[...,2]*0.31114694)

def delta(a, b):
    ya,ia,qa = _yiq(a); yb,ib,qb = _yiq(b)
    y,i,q = ya-yb, ia-ib, qa-qb
    return 0.5053*y*y + 0.299*i*i + 0.1957*q*q

def compare(p1, p2, thr=0.0, masks=None):
    """thr=0.0 ★完全一致（★既定）。masks=[(x0,y0,x1,y1)…] ★隠す ところ"""
    a, s1 = load(p1); b, s2 = load(p2)
    if s1 != s2:
        return dict(err=f'大きさが 違います {s1} vs {s2}', diff=-1)
    d = delta(a, b)
    if masks:
        for (x0,y0,x1,y1) in masks: d[y0:y1, x0:x1] = 0
    bad = d > MAXD * thr * thr
    n = int(bad.sum())
    ys, xs = np.where(bad)
    return dict(diff=n, total=int(bad.size), pct=100.0*n/bad.size,
                box=(int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())) if n else None,
                worst=float(np.sqrt(d.max()/MAXD)) if n else 0.0, mask_px=
                sum((y1-y0)*(x1-x0) for (x0,y0,x1,y1) in (masks or [])))

def calibrate(base, thr=0.0, quiet=False):
    """★★くらべる 前に ★道具を 試します（★番人を 試す）。

    ★① 同じ 画 → 差 0 に なるか
    ★② 1画素 を ★1 だけ 変えた 画 → ★見つけられるか

    ★★2026-09-26 の しくじり ──
      ★はじめ (v+1)%256 で 仕込んで いました。
      ★まん中が 白（255）だと 0 に 巻き戻り ★差 255 に なり、
      ★★鈍い 道具でも 通って しまい ★番人に なって いませんでした。
    """
    im = Image.open(base).convert('RGB'); a = np.asarray(im).copy()
    im.save('/tmp/_cal_same.png')
    r1 = compare(base, '/tmp/_cal_same.png', thr)
    h, w, _ = a.shape; y, x = h//2, w//2
    v = int(a[y,x,0])
    a[y,x,0] = v-1 if v > 0 else 1                    # ★巻き戻さない
    assert abs(int(a[y,x,0]) - v) == 1, '★仕込みが 差1に なって いません'
    Image.fromarray(a).save('/tmp/_cal_one.png')
    r2 = compare(base, '/tmp/_cal_one.png', thr)
    ok1, ok2 = r1.get('diff') == 0, r2.get('diff') == 1
    if not quiet:
        print(f'  ★① 同じ 画 → 差 {r1.get("diff")}　{"○" if ok1 else "★★NG"}')
        print(f'  ★② 1画素を 1 だけ 変える → 差 {r2.get("diff")}　{"○" if ok2 else "★★NG 見逃しました"}')
    return ok1 and ok2

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    thr = 0.0
    for a in sys.argv[1:]:
        if a.startswith('--thr='): thr = float(a.split('=')[1])
    if '--calibrate' in sys.argv:
        print('CALIBRATE', args[0])
        ok = calibrate(args[0], thr)
        print('RESULT:', 'OK' if ok else 'NG'); return 0 if ok else 1
    p1, p2 = args[0], args[1]
    print('PIXEL_LINT')
    print(' ★はじめに 道具を 試します')
    if not calibrate(p1, thr):
        print('RESULT: NG（★★道具が ずれを 見逃します。くらべっこを しません）'); return 2
    r = compare(p1, p2, thr)
    if r['diff'] < 0:
        print(' ', r['err']); print('RESULT: NG'); return 1
    print(f' ★くらべました　差 {r["diff"]} px / {r["total"]}（{r["pct"]:.4f}%）')
    if r['diff']:
        print(f'   いちばん 大きい ずれ {r["worst"]:.3f}　場所 {r["box"]}')
        print('   ★★ずれた ところの 絵を /tmp/pixel_diff.png に 出しました')
        a,_=load(p1); b,_=load(p2)
        d=delta(a,b); out=np.asarray(Image.open(p2).convert('RGB')).copy()
        out[d > MAXD*thr*thr] = [255,0,255]
        Image.fromarray(out).save('/tmp/pixel_diff.png')
    print('RESULT:', 'OK' if r['diff'] == 0 else f'NG（{r["diff"]}px）')
    return 0 if r['diff'] == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
