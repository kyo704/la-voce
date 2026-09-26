#!/usr/bin/env python3
"""段3a の経路一覧（作成 Opus／実行 Code）。
見本のソースから「どの画面の、どのボタン（文字）から、どんな引数で、次の画面へ移るか」を抜き出し、
タブ（入口）からの最短の道すじを画面ごとに出す。Code が手探りで経路を探す時間を減らすため。
  python3 tools/route_map.py            → tools/経路一覧.md を作る（4本ぶん）
  python3 tools/route_map.py 名簿        → その画面の道すじだけ表示
  python3 tools/route_map.py --selftest
★静的な抜き出し。前提の状態（S.〜 の値）が要る画面は「前提」の欄に onclick の中身をそのまま出す
★道すじが見つからない画面は「入口不明」と出す（見本の不具合か、状態を作ってから開く画面）"""
import re, os, sys, collections
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE)
MOCKS=['00-動く見本（さわれる・全画面）.html','00-動く見本-iPhoneで開く用.html','00-動く見本-PC・iPad（運営）.html','00-動く見本-PC・iPad（個人）.html']
Q=r"(?:\\*')"   # ' または \' または \\'
def defs(src):
    """節（ノード）: 画面 SC['X']／板 SH['x']／関数 function NAME。本体の範囲と名前"""
    fn2sc={}
    for m in re.finditer(r"SC\["+Q+r"([^'\\]+)"+Q+r"\]\s*=\s*([A-Za-z_]\w*)\s*;",src): fn2sc[m.group(2)]=m.group(1)
    for m in re.finditer(r"var\s+SC\s*=\s*\{(.*?)\};",src,re.S):
        for t,fn in re.findall(r"'([^']+)'\s*:\s*(\w+)",m.group(1)): fn2sc.setdefault(fn,t)
    starts=sorted([m.start() for m in re.finditer(r"\n(?:SC\[|SH\[|function\s+\w+\s*\(|var\s)",src)]+[len(src)])
    def end(pos):
        for x in starts:
            if x>pos+5: return x
        return len(src)
    rng=[]
    for m in re.finditer(r"\n\s*SC\["+Q+r"([^'\\]+)"+Q+r"\]\s*=\s*function",src): rng.append((m.start(),end(m.start()),m.group(1)))
    for m in re.finditer(r"\n\s*SH\["+Q+r"([^'\\]+)"+Q+r"\]\s*=\s*function",src): rng.append((m.start(),end(m.start()),'板:'+m.group(1)))
    fnames=[]
    for m in re.finditer(r"\nfunction\s+(\w+)\s*\(",src):
        fn=m.group(1); fnames.append(fn); rng.append((m.start(),end(m.start()),fn2sc.get(fn,'fn:'+fn)))
    return rng,fn2sc,fnames
def roots(src,fn2sc):
    r={}
    for pat in [r"var\s+TAB\s*=\s*\{([^}]*)\}",r"var\s+m\s*=\s*\{([^}]*S_kyou[^}]*)\}"]:
        for m in re.finditer(pat,src):
            for t,fn in re.findall(r"'([^']+)'\s*:\s*(\w+)",m.group(1)): r[t]=fn2sc.get(fn,'fn:'+fn)
    if 'function S_op(' in src: r['運営モード']='fn:S_op'
    return r
def label_after(src,pos):
    m=re.search(r">([^<>]{1,40})<",src[pos:pos+400])
    return re.sub(r"'\s*\+.*","",m.group(1)).strip() if m else ''
def edges(src):
    rng,fn2sc,fnames=defs(src); E=collections.defaultdict(list)
    def owner(p):
        o=None
        for a,b,name in rng:
            if a<=p<b and (o is None or a>o[0]): o=(a,name)
        return o[1] if o else '（場所不明）'
    for m in re.finditer(r"(push|go|goo|openSheet)\("+Q+r"([^'\\]+)"+Q+r"\s*(?:,\s*([^)]{0,40}))?\)",src):
        kind,dst,arg=m.group(1),m.group(2),(m.group(3) or '').strip()
        on=src.rfind('onclick',max(0,m.start()-300),m.start())
        pre=src[on:m.start()] if on>=0 else ''
        pre=re.sub(r"^onclick=\\*\"?","",pre).strip(';\\" ')
        E[owner(m.start())].append({'to':('板:' if kind=='openSheet' else '')+dst,'via':kind,'arg':arg,'label':label_after(src,m.end()),'pre':pre[:80]})
    # ★★組み立て型の 呼び出しも 読みます（2026-09-25）
    #   ★mLi('しらべる機能','しらべる',…) の ように、★行き先を 引数で 渡す 書き方
    #   ★前は ★push('…') の 直書きしか 読めず、★入口不明が 72件に 増えました
    for m in re.finditer(r"\b(mLi|mkLi|navLi)\(" + Q + r"([^'\\]+)" + Q + r"\s*,\s*" + Q + r"([^'\\]*)" + Q, src):
        fn, dst, label = m.group(1), m.group(2), m.group(3)
        E[owner(m.start())].append({'to':dst,'via':fn,'arg':'','label':label,'pre':''})

    fset=set(fnames)
    for a,b,name in rng:   # 関数の呼び出し（同じ画面の中の部品）
        body=src[a:b]
        for fn in set(re.findall(r"\b([A-Za-z_]\w*)\b",body)):   # 呼び出しと、表に入れた名前（{'ご請求':stBill}）の両方
            if fn in fset and fn2sc.get(fn,'fn:'+fn)!=name:
                E[name].append({'to':fn2sc.get(fn,'fn:'+fn),'via':'call','arg':'','label':'（同じ画面の部品）','pre':''})
    return E,rng,fn2sc
def paths(src):
    E,rng,fn2sc=edges(src); R=roots(src,fn2sc)
    best={}; dq=collections.deque()
    for t,node in R.items():
        best.setdefault(node,[('タブ',t,'','')]); dq.append(node)
        best.setdefault(t,[('タブ',t,'','')]); dq.append(t)
    while dq:
        u=dq.popleft()
        for e in E.get(u,[]):
            v=e['to']
            if e['via'] in ('go','goo') and v in best: continue
            if v not in best:
                step=[] if e['via']=='call' else [(u if not u.startswith('fn:') else best[u][-1][0] if len(best[u])>1 else best[u][0][1],e['label'],e['arg'],e['pre'])]
                best[v]=best[u]+step; dq.append(v)
    screens=sorted(set(re.findall(r"\bSC\["+Q+r"([^'\\]+)"+Q+r"\]",src))|set(fn2sc.values()))
    return screens,best,E
def render(f,src):
    screens,best,E=paths(src); out=[f'## {f}（{len(screens)}画面）','','| 画面 | 道すじ（入口 › 押す文字） | 最後の引数 | 前提（onclick の中） |','|---|---|---|---|']
    miss=0
    for s in screens:
        p=best.get(s)
        if not p: out.append(f'| {s} | ★入口不明 | | |'); miss+=1; continue
        way=' › '.join([p[0][1]]+[f'{x[0]}「{x[1]}」' for x in p[1:]])
        last=p[-1]; out.append(f'| {s} | {way} | {last[2]} | {last[3].replace("|","／")} |')
    out+=['',f'入口不明: {miss}画面',''];return '\n'.join(out),miss
def main(target=None):
    doc=['# 経路一覧（route_map.py が作る。手で直さない）','']
    for f in MOCKS:
        src=open(os.path.join(PACK,f),encoding='utf-8').read()
        if target:
            screens,best,E=paths(src)
            if target in best: print(f[:14],' › '.join([best[target][0][1]]+[f'{x[0]}「{x[1]}」({x[2]})' for x in best[target][1:]]))
            elif target in screens: print(f[:14],'★入口不明')
            continue
        t,miss=render(f,src); doc.append(t); print(f'{f[:18]}: 入口不明 {miss}')
    if not target:
        open(os.path.join(HERE,'経路一覧.md'),'w',encoding='utf-8').write('\n'.join(doc)); print('→ tools/経路一覧.md')
def selftest():
    src="""var TAB={'ホーム':P_home};
function P_home(){return '<div onclick="push(\\\\'名簿\\\\')">名簿を 開く</div>'}
function P_meibo(){return '<tr onclick="S.x=1;push(\\\\'その人\\\\',3)"><td>山田</td></tr>'}
SC['名簿']=P_meibo;
SC['その人']=function(i){return 'x'};
SC['孤立']=function(){return 'y'};
"""
    screens,best,E=paths(src); ok=True
    if 'その人' not in best or best['その人'][-1][2]!='3': print('SELFTEST FAIL: 道すじか引数',best.get('その人')); ok=False
    if '孤立' in best: print('SELFTEST FAIL: 入口の無い画面を見つけられない'); ok=False
    if 'S.x=1' not in (best.get('その人',[[0,0,0,'']])[-1][3]): print('SELFTEST FAIL: 前提が出ない'); ok=False
    print('SELFTEST','PASS' if ok else 'FAIL'); return 0 if ok else 2
if __name__=='__main__':
    a=sys.argv[1:]
    if '--selftest' in a: sys.exit(selftest())
    main(a[0] if a else None)
