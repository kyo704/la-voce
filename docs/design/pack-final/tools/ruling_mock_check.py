#!/usr/bin/env python3
"""裁定の見本への反映（作成 Opus／実行 Code・Sonnet）。
tools/ruling_mock_registry.json の印を、見本のファイルで探す。
  - mock: yes の裁定 → present がすべて在り、absent が1つも無いこと
  - mobile の印は、全画面・iPhone の両方に要る（片方だけ直った、を見つける）
  - 一式にある ruling-*.md のうち、登録の無いもの → 「未登録」
使い方: python3 tools/ruling_mock_check.py  ／  --selftest
終了コード: 0＝そろっている ／ 1＝抜けか未登録あり ／ 2＝道具の不具合"""
import json, os, re, sys, glob
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE)
def load(): return json.load(open(os.path.join(HERE,'ruling_mock_registry.json'),encoding='utf-8'))
def texts(R):
    out={}
    for k,fs in R['files'].items():
        for f in fs: out[f]=open(os.path.join(PACK,f),encoding='utf-8').read()
    return out
def check(R,T):
    rows=[]
    for no,e in sorted(R['rulings'].items(),key=lambda x:int(x[0])):
        if e.get('mock')!='yes': continue
        for k,marks in e.get('present',{}).items():
            for f in R['files'][k]:
                for mk in marks:
                    if mk not in T[f]: rows.append((no,'MISSING',f[:18],mk))
        for k,marks in e.get('absent',{}).items():
            for f in R['files'][k]:
                for mk in marks:
                    if mk in T[f]: rows.append((no,'STILL_THERE',f[:18],mk))
    have={re.match(r'ruling-(\d+)',os.path.basename(p)).group(1) for p in glob.glob(os.path.join(PACK,'ruling-*.md'))}
    for no in sorted(have-set(R['rulings']),key=int):
        if int(no)>=141: rows.append((no,'UNREGISTERED','—','登録が無い（反映が要るか分からない）'))
    return rows
def main():
    R=load(); rows=check(R,texts(R))
    unk=[n for n,e in R['rulings'].items() if e.get('mock')=='unknown']
    print('RULING_MOCK_CHECK'); [print('  ',' | '.join(r)) for r in rows]
    old=sorted({re.match(r'ruling-(\d+)',os.path.basename(p)).group(1) for p in glob.glob(os.path.join(PACK,'ruling-*.md'))}-set(R['rulings']),key=int)
    print('  （141 より前の裁定は未登録のまま:',', '.join(n for n in old if int(n)<141),'→ 触るときに1件ずつ登録）')
    print('RESULT:', 'OK' if not rows else f'NG（{len(rows)}件）'); return 0 if not rows else 1
def selftest():
    R=load(); T=texts(R); ok=True
    f=R['files']['mobile'][1]; T2=dict(T); T2[f]=T2[f].replace('REC_OK','XXX')
    if not any(r[0]=='157' and r[1]=='MISSING' and r[2]==f[:18] for r in check(R,T2)): print('SELFTEST FAIL: iPhone 版だけの抜けを見つけられない'); ok=False
    T3=dict(T); o=R['files']['ops'][0]; T3[o]=T3[o]+'btn g sm">なおす ›'
    if not any(r[0]=='150' and r[1]=='STILL_THERE' for r in check(R,T3)): print('SELFTEST FAIL: 残ってはいけない印を見つけられない'); ok=False
    R4=json.loads(json.dumps(R)); del R4['rulings']['157']
    if not any(r[0]=='157' and r[1]=='UNREGISTERED' for r in check(R4,T)): print('SELFTEST FAIL: 未登録を見つけられない'); ok=False
    if check(R,T): print('SELFTEST FAIL: 正しい状態で抜けが出る'); ok=False
    print('SELFTEST','PASS' if ok else 'FAIL'); return 0 if ok else 2
if __name__=='__main__': sys.exit(selftest() if '--selftest' in sys.argv else main())
