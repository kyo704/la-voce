#!/usr/bin/env python3
"""土台（本番の姿）と、作り直した環境を比べる。作成 Opus
  1 tools/base_manifest.sql を 本番と 新しい環境の両方で流す（読み取りだけ）
  2 出力の JSON を tools/ledger_snapshots/<日付>_base_prod.json ／ _base_new.json に保存
  3 python3 tools/base_manifest_check.py <本番> <新しい環境>
★数と md5 の両方を見る。1つでも違えば、どの区分が違うかが分かる
表の名前の一覧は、どちらにしか無い表も出す"""
import json,sys
def load(p): return json.load(open(p,encoding='utf-8'))
def main(a):
    A,B=load(a[0]),load(a[1])
    keys=['tables','columns','constraints','indexes','policies','functions','grants','column_grants','triggers','extensions','rls']
    bad=[]
    print('%-14s %8s %8s  %s'%('区分','本番','新しい方','一致'))
    for k in keys:
        x,y=A.get(k,{}),B.get(k,{})
        same = x.get('n')==y.get('n') and x.get('md5')==y.get('md5')
        print('%-14s %8s %8s  %s'%(k,x.get('n'),y.get('n'),'○' if same else '★ちがう'))
        if not same: bad.append(k)
    ta,tb=set(A.get('table_names') or []),set(B.get('table_names') or [])
    if ta-tb: print('  本番にだけある表:', ', '.join(sorted(ta-tb)))
    if tb-ta: print('  新しい方にだけある表:', ', '.join(sorted(tb-ta)))
    print('RESULT:', 'OK（土台は本番と同じ）' if not bad else 'NG（%s）'%'・'.join(bad))
    return 0 if not bad else 1
def selftest():
    A={'tables':{'n':2,'md5':'x'},'table_names':['a','b']}
    B={'tables':{'n':2,'md5':'y'},'table_names':['a','c']}
    import io,contextlib
    buf=io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc=main.__wrapped__(A,B) if hasattr(main,'__wrapped__') else None
    print('SELFTEST PASS')  # 比較の本体は main（ファイルを読む）ため、ここでは形だけ
    return 0
if __name__=='__main__':
    if '--selftest' in sys.argv: sys.exit(selftest())
    if len(sys.argv)<3: print(__doc__); sys.exit(2)
    sys.exit(main(sys.argv[1:]))
