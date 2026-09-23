#!/usr/bin/env python3
"""配布前の自己検証（Opus が zip を作る前に毎回。PART_B の運用を1本に）。
順に走らせ、1つでも NG なら「配らない」と出す:
  1 道具の selftest（全部）  2 allsc（期待: 開けない 6・6・0・0／読込エラー0）
  3 ruling_mock_check        4 price_check（値段）
  5 promise_diff（前の版の控えと比べる。差分があれば、意図したものかを1件ずつ確かめる）
  6 route_map（入口不明の数が前回より増えていないか）
使い方: python3 tools/release_check.py design-v21（新しい版）  design-v20（前の版）  [--accept "約束の文の変化が意図したものである理由"]"""
import subprocess, sys, os, re, json
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE)
def run(cmd,timeout=900):
    r=subprocess.run(cmd,cwd=PACK,capture_output=True,text=True,timeout=timeout); return r.returncode,(r.stdout+r.stderr)
def main(new,old):
    ng=[]
    for t in ['price_check','ruling_mock_check','promise_diff','route_map','decision_needed_check','promise_coverage','policy_diff','fail_closed_lint','ledger_inventory','mobile_parity']:
        p=os.path.join(HERE,t+'.py')
        if os.path.exists(p):
            c,o=run(['python3',p,'--selftest'])
            if c!=0: ng.append(f'selftest {t}')
    c,o=run(['python3',os.path.join(HERE,'allsc.py')])
    exp={'全画面':(0,6),'iPhone':(0,6),'運営':(0,0),'個人':(0,0)}
    for k,(e0,e1) in exp.items():
        m=re.search(k+r'[^\n]*読込エラー(\d+)[^\n]*開けない(\d+)',o)
        if not m or int(m.group(1))!=e0 or int(m.group(2))!=e1: ng.append(f'allsc {k}: '+(m.group(0) if m else '結果なし'))
    c,o=run(['python3',os.path.join(HERE,'ruling_mock_check.py')])
    if c!=0: ng.append('ruling_mock_check: '+o.strip().splitlines()[-1])
    c,o=run(['python3',os.path.join(HERE,'price_check.py')])
    if c!=0: ng.append('price_check: '+o.strip().splitlines()[-1])
    c,o=run(['python3',os.path.join(HERE,'promise_diff.py'),'snapshot',new])
    c,o=run(['python3',os.path.join(HERE,'promise_diff.py'),'diff',old,new])
    print(o)
    if c!=0:
        if ACCEPT:
            with open(os.path.join(HERE,'promises','accepted.md'),'a',encoding='utf-8') as fh: fh.write(f'- {old}→{new}: {ACCEPT}\n')
            print('  約束の文の変化を「意図したもの」として記録した（tools/promises/accepted.md）')
        else: ng.append('promise_diff: 約束の文が変わった（上の +／- を1件ずつ確かめ、意図したものなら --accept "理由" で記録して配る）')
    c,o=run(['python3',os.path.join(HERE,'mobile_parity.py')])
    if c!=0: ng.append('mobile_parity: スマホ2本の中身が食い違っている（'+o.strip().splitlines()[0]+'）')
    c,o=run(['python3',os.path.join(HERE,'route_map.py')])
    miss=[int(x) for x in re.findall(r'入口不明 (\d+)',o)]
    prev=os.path.join(HERE,'.route_miss.json'); before=json.load(open(prev)) if os.path.exists(prev) else None
    if before and sum(miss)>sum(before): ng.append(f'route_map: 入口不明が増えた {sum(before)}→{sum(miss)}')
    json.dump(miss,open(prev,'w'))
    print('RELEASE_CHECK',new,'←',old)
    for n in ng: print('  NG',n)
    print('RESULT:','配ってよい' if not ng else f'配らない（{len(ng)}件）'); return 0 if not ng else 1
ACCEPT=None
if __name__=='__main__':
    a=sys.argv[1:]
    if '--accept' in a:
        i=a.index('--accept'); ACCEPT=a[i+1] if i+1<len(a) else ''; a=a[:i]+a[i+2:]
        if len(ACCEPT)<10: print('REFUSED: --accept に理由（10文字以上）'); sys.exit(2)
    if len(a)<2: print(__doc__); sys.exit(2)
    sys.exit(main(a[0],a[1]))
