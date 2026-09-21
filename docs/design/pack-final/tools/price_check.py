#!/usr/bin/env python3
"""価格の4か所の突き合わせ（裁定155・確定-学校の値段 §9）。作成 Opus／実行 Code。
正は tools/prices.json（確定文書から写したもの）。これと次を比べる:
  ① 確定文書の早見表（§2）   ② 見本3本の billYen()（ブラウザで実際に計算させる）
  ③ 実装 lib/orgRoster.js の monthlyFee(n)（--impl で渡したときだけ）
  ④ 文書・見本に残った古い数字（stale_patterns）
使い方:  python3 tools/price_check.py [--impl ../repo/lib/orgRoster.js] [--impl-fn monthlyFee]
         python3 tools/price_check.py --selftest   ← 道具が当たるかを先に確かめる（CLAUDE.md の決まり）
終了コード: 0＝一致 ／ 1＝食い違いあり ／ 2＝道具の不具合
★営業資料 v5 は画像の PDF なので対象外（UNKNOWN と出す）"""
import json, re, sys, os, subprocess, glob, asyncio, urllib.parse
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE)
P=json.load(open(os.path.join(HERE,'prices.json'),encoding='utf-8'))
MOCKS=['00-動く見本（さわれる・全画面）.html','00-動く見本-iPhoneで開く用.html','00-動く見本-PC・iPad（運営）.html']

def truth(n,P=P):
    o=P['org']
    if n<=o['free_max_students']: return 0
    if n<=o['kyoshitsu']['max_students']: return o['kyoshitsu']['monthly']
    g=o['gakko']; cands=[max(n,lo)*per for lo,per in g['tiers']]
    return max(g['floor'],min(cands))

def gakko_formula(n,P=P):
    g=P['org']['gakko']; return max(g['floor'],min(max(n,lo)*per for lo,per in g['tiers']))

def check_doc(P=P):
    """① 確定文書 §2 の早見表: 名簿と月額の列を、学校の式で確かめる"""
    out=[]; f=os.path.join(PACK,'確定-学校の値段.md')
    if not os.path.exists(f): return [('①確定文書','MISSING',f)]
    for line in open(f,encoding='utf-8'):
        m=re.match(r'\|\s*(\d+)人\s*\|\s*([\d,]+)\s*\|',line)
        if m:
            n=int(m.group(1)); v=int(m.group(2).replace(',',''))
            exp=gakko_formula(n,P)
            if v!=exp: out.append(('①確定文書',f'{n}人',f'表 {v} ／ 式 {exp}'))
    return out

async def mock_values(points):
    from playwright.async_api import async_playwright
    res={}
    async with async_playwright() as p:
        # ★手元の Chrome を借ります（★2026-09-21・Code が直しました）。
        #   ★★同梱の chromium は入れていません。この品の道具はどれも
        #     ★`channel='chrome'` です（tools/dom_compare.js と同じ）。
        #   ★★150MB の落としものを増やさないため。動きは変わりません。
        b=await p.chromium.launch(channel='chrome')
        for f in MOCKS:
            pg=await b.new_page(); await pg.goto('file://'+urllib.parse.quote(os.path.join(PACK,f))); await pg.wait_for_timeout(300)
            res[f]=await pg.evaluate("""(pts)=>{var o={},real=window.billN,k=ORGPLAN.kind,d=BILL_DEMO;
              pts.forEach(function(n){window.billN=function(){return n};
                ORGPLAN.kind=n<=5?'無料':n<=30?'教室':'学校';ORGPLAN.trial='';ORGPLAN.free='';o[n]=billYen()});
              window.billN=real;ORGPLAN.kind=k;return o}""",points)
            await pg.close()
        await b.close()
    return res

def check_mocks(points,P=P):
    out=[]
    try: vals=asyncio.run(mock_values(points))
    except Exception as e: return [('②見本','TOOL_ERROR',str(e)[:120])]
    for f,v in vals.items():
        for n in points:
            if int(v[str(n)] if str(n) in v else v[n])!=truth(n,P): out.append(('②見本 '+f[:14],f'{n}人',f'見本 {v.get(str(n),v.get(n))} ／ 正 {truth(n,P)}'))
    return out

def check_impl(path,fn,points,P=P):
    js=("const m=require(%r);const f=m[%r]||(m.default&&m.default[%r]);"
        "if(!f){console.log('NOFN');process.exit(0)}"
        "console.log(JSON.stringify(%s.map(n=>[n,f(n)])))")%(os.path.abspath(path),fn,fn,json.dumps(points))
    try: r=subprocess.run(['node','-e',js],capture_output=True,text=True,timeout=30)
    except Exception as e: return [('③実装','TOOL_ERROR',str(e)[:120])]
    if r.returncode!=0 or 'NOFN' in r.stdout: return [('③実装','TOOL_ERROR',(r.stderr or r.stdout)[:200])]
    out=[]
    for n,v in json.loads(r.stdout.strip().splitlines()[-1]):
        if v!=truth(n,P): out.append(('③実装',f'{n}人',f'実装 {v} ／ 正 {truth(n,P)}'))
    return out

def check_stale(files=None,P=P):
    out=[]; files=files or [f for f in glob.glob(os.path.join(PACK,'**','*.*'),recursive=True)
        if f.endswith(('.md','.html')) and '/legal/' not in f and not os.path.basename(f).startswith('ruling-')]  # 裁定と法務の調査は「当時の記録」なので見ない
    for f in files:
        t=open(f,encoding='utf-8',errors='ignore').read()
        for sp in P['stale_patterns']:
            for m in re.finditer(sp['re'],t):
                ctx=t[max(0,m.start()-30):m.end()+30].replace('\n',' ')
                if re.search(r'廃止|改める|前は|置き換え|使わない|置かない|置いていません|扱わない|扱っていません|削除|B案|撤回|ではなく|→',ctx): continue
                ls=t.rfind('\n',0,m.start())+1
                if re.match(r'\s*design-v\d+',t[ls:ls+20]): continue  # README の版の履歴  # 古い数字を「直した」と書いた行は除く
                out.append(('④古い数字',os.path.relpath(f,PACK),f'{sp["why"]}: …{ctx}…'))
    return out

def run(impl=None,fn='monthlyFee'):
    pts=P['check_points']; rows=check_doc()+check_mocks(pts)+check_stale()
    if impl: rows+=check_impl(impl,fn,pts)
    print('PRICE_CHECK', P['version'])
    print('  ③実装:', 'checked' if impl else 'SKIPPED（--impl で lib/orgRoster.js を渡す）')
    print('  営業資料v5: UNKNOWN（画像のため）')
    if not rows: print('RESULT: MATCH（食い違い 0件）'); return 0
    tool=[r for r in rows if r[1]=='TOOL_ERROR']
    for r in rows: print('  DIFF',' | '.join(r))
    print(f'RESULT: {"TOOL_ERROR" if tool else "MISMATCH"}（{len(rows)}件）'); return 2 if tool else 1

def selftest():
    """わざと間違えた正で、道具が食い違いを見つけるかを確かめる"""
    import copy; ok=True
    bad=copy.deepcopy(P); bad['org']['gakko']['floor']=9800
    if not check_doc(bad): print('SELFTEST FAIL: 確定文書の食い違いを見つけられない'); ok=False
    if not check_mocks([31],bad): print('SELFTEST FAIL: 見本の食い違いを見つけられない'); ok=False
    tmp=os.path.join(HERE,'_selftest.md'); open(tmp,'w',encoding='utf-8').write('教室の 下限 9,800円 です\n表示は 税別\n')
    hits=check_stale([tmp]); os.remove(tmp)
    if len(hits)<2: print('SELFTEST FAIL: 古い数字を見つけられない'); ok=False
    tmp2=os.path.join(HERE,'_selftest2.md'); open(tmp2,'w',encoding='utf-8').write('下限 9,800円 は廃止した\n')
    if check_stale([tmp2]): print('SELFTEST FAIL: 「廃止した」と書いた行まで拾っている'); ok=False
    os.remove(tmp2)
    if check_doc() or check_mocks([5,6,31,216,500]): print('SELFTEST FAIL: 正しい値で食い違いが出る'); ok=False
    print('SELFTEST', 'PASS' if ok else 'FAIL'); return 0 if ok else 2

if __name__=='__main__':
    a=sys.argv[1:]
    if '--selftest' in a: sys.exit(selftest())
    impl=a[a.index('--impl')+1] if '--impl' in a else None
    fn=a[a.index('--impl-fn')+1] if '--impl-fn' in a else 'monthlyFee'
    sys.exit(run(impl,fn))
