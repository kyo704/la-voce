#!/usr/bin/env python3
"""約束の台帳の差分（裁定159 §5）。作成 Opus／実行 Code。
見本を実際に開き、全画面（SC の全キー）の注記（.note .warn .usu .wl）の文を集めて、版ごとの控えを作る。
前の版の控えと比べて「増えた約束」「消えた約束」だけを出す。484件を毎回やり直さない。
  控えを作る:  python3 tools/promise_diff.py snapshot design-v19
  比べる:      python3 tools/promise_diff.py diff design-v19 design-v20
  試す:        python3 tools/promise_diff.py --selftest
控えは tools/promises/<版>.json。1文ごとに {file, screens, kind(する/しない), text}。
★文の抜き出しはブラウザの表示の結果から行う（ソースのコメントを読まない＝strip の問題が起きない）
★Sonnet の 484件（手で除いた後の数）とは件数が違ってよい。基準はこの道具の控え"""
import asyncio, json, os, re, sys, urllib.parse, hashlib
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE); OUT=os.path.join(HERE,'promises')
MOCKS=['00-動く見本（さわれる・全画面）.html','00-動く見本-iPhoneで開く用.html','00-動く見本-PC・iPad（運営）.html','00-動く見本-PC・iPad（個人）.html']
NEG=re.compile(r'ません|しない|出さない|作らない|持たない|渡さない|残さない|消さない|使わない|ない$|なし|不可|できない')
def kind(t): return 'しない' if NEG.search(t) else 'する'
PROMISE=re.compile(r'(ます|ません|ない|です|しない|残る|消えない|見えない|伝わる|伝わらない)$')
def split(t):
    """注記を文に分け、約束の形（〜ます／〜ません／〜ない／〜です で終わる文）だけを残す。
    日付・人数・札の言葉など、約束でない短い表示は落とす"""
    out=[]
    for p in re.split(r'[。\n]', t):
        p=re.sub(r'\s+',' ',p).strip(' 　・')
        if len(re.sub(r'\s','',p))<8: continue
        if '見本' in p and ('押' in p or '切替' in p): continue   # 見本の操作の説明は約束ではない
        if PROMISE.search(p.rstrip('）)」 ')): out.append(p)
    return out
async def collect():
    from playwright.async_api import async_playwright
    found={}
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for f in MOCKS:
            pg=await b.new_page(viewport={'width':1400,'height':900}); await pg.goto('file://'+urllib.parse.quote(os.path.join(PACK,f))); await pg.wait_for_timeout(300)
            keys=await pg.evaluate("Object.keys(SC)")
            for k in keys:
                try:
                    txt=await pg.evaluate("""(k)=>{S.stack=[];push(k,0);
                      return [...document.querySelectorAll('.note,.warn,.usu,.wl')].map(e=>e.innerHTML.replace(/<br\\s*\\/?>/g,'\\n').replace(/<[^>]+>/g,'')).join('\\n')}""",k)
                except Exception: continue
                for s in split(txt):
                    fk='スマホ（全画面・iPhone）' if 'iPhone' in f or '全画面' in f else f
                    key=(fk,s); found.setdefault(key,set()).add(k)
            await pg.close()
        await b.close()
    return [{'file':f,'screens':sorted(v),'kind':kind(s),'text':s} for (f,s),v in sorted(found.items())]
def snapshot(ver,rows=None):
    rows=rows if rows is not None else asyncio.run(collect())
    os.makedirs(OUT,exist_ok=True); path=os.path.join(OUT,ver+'.json')
    json.dump({'version':ver,'count':len(rows),'rows':rows},open(path,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
    c={'する':0,'しない':0}
    for r in rows: c[r['kind']]+=1
    print(f'SNAPSHOT {ver}: {len(rows)}文（する {c["する"]}・しない {c["しない"]}） → {os.path.relpath(path,PACK)}'); return rows
def diff(a,b,A=None,B=None):
    A=A or json.load(open(os.path.join(OUT,a+'.json'),encoding='utf-8'))['rows']
    B=B or json.load(open(os.path.join(OUT,b+'.json'),encoding='utf-8'))['rows']
    ka={(r['file'],r['text']):r for r in A}; kb={(r['file'],r['text']):r for r in B}
    add=[kb[k] for k in kb if k not in ka]; rem=[ka[k] for k in ka if k not in kb]
    print(f'PROMISE_DIFF {a} → {b}: 増えた {len(add)}・消えた {len(rem)}')
    for r in add: print(f'  + [{r["kind"]}] {r["file"][:14]} {",".join(r["screens"][:3])} | {r["text"][:90]}')
    for r in rem: print(f'  - [{r["kind"]}] {r["file"][:14]} {",".join(r["screens"][:3])} | {r["text"][:90]}')
    print('  ★「+」は守る処理の欄を空で台帳に足す。「-」は台帳の行を「見本から消えた（日付）」にする（行は消さない）')
    return add,rem
def selftest():
    ok=True
    A=[{'file':'x','screens':['s'],'kind':'する','text':'見ると 記録に 残ります'},{'file':'x','screens':['s'],'kind':'しない','text':'先生には 見えません'}]
    B=[A[1],{'file':'x','screens':['t'],'kind':'しない','text':'順位を 出しません'}]
    add,rem=diff('A','B',A,B)
    if len(add)!=1 or len(rem)!=1 or rem[0]['text']!='見ると 記録に 残ります': print('SELFTEST FAIL: 差分'); ok=False
    if kind('見ると 記録に 残ります')!='する' or kind('先生には 見えません')!='しない': print('SELFTEST FAIL: する／しない'); ok=False
    print('SELFTEST','PASS' if ok else 'FAIL'); return 0 if ok else 2
if __name__=='__main__':
    a=sys.argv[1:]
    if '--selftest' in a: sys.exit(selftest())
    if a[:1]==['snapshot']: snapshot(a[1]); sys.exit(0)
    if a[:1]==['diff']: add,rem=diff(a[1],a[2]); sys.exit(0 if not(add or rem) else 1)
    print(__doc__); sys.exit(2)
