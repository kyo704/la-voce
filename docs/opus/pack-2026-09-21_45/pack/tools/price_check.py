#!/usr/bin/env python3
"""価格の突き合わせ（裁定155・確定-学校の値段 §9）。作成 Opus／実行 Code。
★2026-09-23: ⑤個人の値段の突き合わせを足した（それまで ★学校の値段しか見ていなかった）。
正は tools/prices.json（確定文書から写したもの）。これと次を比べる:
  ① 確定文書の早見表（§2）   ② 見本3本の billYen()（ブラウザで実際に計算させる）
  ③ 実装 lib/orgRoster.js の monthlyFee(n)（--impl で渡したときだけ）
  ④ 文書・見本に残った古い数字（stale_patterns）
使い方:  python3 tools/price_check.py [--impl ../repo/lib/orgRoster.js] [--impl-fn monthlyFee]
         python3 tools/price_check.py --update-baseline --reason "退避した旧見本と日付つきの評価文書（歴史の記録）"
           ← いまの④の当たりを「既知」にする。以後は新しい当たりだけが出る。★理由が要る
         python3 tools/price_check.py --selftest   ← 道具が当たるかを先に確かめる（CLAUDE.md の決まり）
終了コード: 0＝一致 ／ 1＝食い違いあり ／ 2＝道具の不具合
★営業資料 v5 は画像の PDF なので対象外（UNKNOWN と出す）"""
import json, re, sys, os, subprocess, glob, asyncio, urllib.parse, fnmatch, hashlib
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
        b=await p.chromium.launch()
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

def _scan_files():
    ex=P.get('stale_scan_exclude',[])
    out=[]
    for f in glob.glob(os.path.join(PACK,'**','*.*'),recursive=True):
        rel=os.path.relpath(f,PACK).replace(os.sep,'/')
        if not f.endswith(('.md','.html')): continue
        # ★裁定・法務・★報告／査読／進捗の共有は「当時の記録」なので 見ません
        #   2026-09-23: 報告の束を 見てしまい ★366件 出ました（直すものでは ありません）
        if '/legal/' in '/'+rel or os.path.basename(f).startswith('ruling-'): continue
        if '/reports/' in '/'+rel: continue
        if any(fnmatch.fnmatch(rel,g) for g in ex): continue
        out.append(f)
    return out

def _hit_id(rel,why,ctx): return hashlib.sha1((rel+'|'+why+'|'+re.sub(r'\s+','',ctx)).encode()).hexdigest()[:12]

def check_bundle_total(P=P):
    """★「単品の 年額の 合計」が 値段の一覧と 合っているか。
    ★2026-09-24: 裁定180（つたえる 3,600→6,000）のあと、★見本が 14,200 のままでした"""
    ind=P['individual']
    want = ind['tsutaeru']['annual'] + ind['shiraberu']['annual'] + ind['yosooi']['annual']
    saved = want - ind['zenbu']['annual']
    ng=[]
    for f2 in _scan_files():
        t=open(f2,encoding='utf-8',errors='ignore').read()
        if '単品の 年額の 合計' not in t: continue
        import re as _re
        for m in _re.finditer(r'単品の 年額の 合計 ([0-9,]+)円', t):
            got=int(m.group(1).replace(',',''))
            if got!=want:
                ng.append((os.path.relpath(f2,PACK), got, want))
    return ng, want, saved

def check_individual(P=P):
    """★個人の値段（ぜんぶ・学生・しらべる・よそおい・つたえる・型）が、見本に そのまま出ているか。
    いままで この道具は ★学校の値段しか見ていなかった（2026-09-23 に 壊して確かめて分かった）。
    見るもの: 正の値段が ★少なくとも1本の見本に出ていること／★古い値段が どの見本にも出ていないこと"""
    import re as _re
    out=[]
    ind=P['individual']
    def yen(v): return format(int(v), ',')
    want=[]
    for key,label in [('zenbu','ぜんぶ'),('gakusei','学生'),('shiraberu','しらべる'),
                      ('yosooi','よそおい'),('tsutaeru','つたえる')]:
        d=ind.get(key) or {}
        for k2 in ('monthly','annual','gakusei_annual'):
            if d.get(k2): want.append((label+'/'+k2, yen(d[k2])))
    if ind.get('page_type'): want.append(('型','%d'%ind['page_type']))
    texts={}
    for m in MOCKS:
        p=os.path.join(PACK,m)
        if os.path.exists(p): texts[m]=open(p,encoding='utf-8').read()
    for label,v in want:
        # ★「777」のような数字は 色の指定などに紛れる。★「円」が付いた形だけを見る
        pat=_re.compile(r'(?<![\d,])(' + _re.escape(v) + r'|' + _re.escape(v.replace(',','')) + r')\s*円')
        if not any(pat.search(t) for t in texts.values()):
            out.append(('⑤個人の値段', label, '正 %s円 が どの見本にも 出ていない'%v))
    return out

def check_stale(files=None,P=P,baseline=None):
    """④ 古い数字。★基準線（stale_baseline.json）にある既知の当たりは出さない。新しい当たりだけを出す"""
    out=[]; files=files or _scan_files()
    base=baseline if baseline is not None else _load_baseline()
    for f in files:
        t=open(f,encoding='utf-8',errors='ignore').read(); rel=os.path.relpath(f,PACK)
        for sp in P['stale_patterns']:
            for m in re.finditer(sp['re'],t):
                ctx=t[max(0,m.start()-30):m.end()+30].replace('\n',' ')
                if re.search(r'廃止|改める|前は|置き換え|使わない|置かない|置いていません|扱わない|扱っていません|削除|B案|撤回|ではなく|使えない|→',ctx): continue
                ls=t.rfind('\n',0,m.start())+1
                if re.match(r'\s*design-v\d+',t[ls:ls+20]): continue
                hid=_hit_id(rel,sp['why'],ctx)
                if hid in base: continue
                out.append(('④古い数字',rel,f'{sp["why"]}: …{ctx}…',hid))
    return out

def _load_baseline():
    p=os.path.join(HERE,'stale_baseline.json')
    return json.load(open(p,encoding='utf-8')).get('hits',{}) if os.path.exists(p) else {}

def update_baseline(reason):
    """いまの当たりを「既知」として基準線に入れる。★理由が要る。理由の無い追加はしない"""
    if not reason or len(reason)<6: print('REFUSED: --reason に理由（6文字以上）を書く'); return 2
    p=os.path.join(HERE,'stale_baseline.json'); d=json.load(open(p,encoding='utf-8')) if os.path.exists(p) else {'hits':{}}
    new=check_stale(baseline=d['hits'])
    for r in new: d['hits'][r[3]]={'file':r[1],'what':r[2][:120],'reason':reason}
    json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
    print(f'BASELINE: {len(new)}件を既知に（理由: {reason}）。合計 {len(d["hits"])}件'); return 0

def run(impl=None,fn='monthlyFee'):
    pts=P['check_points']; rows=check_doc()+check_mocks(pts)+check_individual()+check_stale()
    # ★単品の 合計（★裁定180 のあと 見本が 古いままでした・2026-09-24）
    bt, _want, _saved = check_bundle_total()
    rows += [(rel, 'BUNDLE_TOTAL', f'単品の 年額の 合計 {got:,} → ★{w:,} が 正') for rel, got, w in bt]
    if impl: rows+=check_impl(impl,fn,pts)
    print('PRICE_CHECK', P['version'])
    print('  ③実装:', 'checked' if impl else 'SKIPPED（--impl で lib/orgRoster.js を渡す）')
    print('  営業資料v5: UNKNOWN（画像のため）')
    if not rows: print('RESULT: MATCH（食い違い 0件）'); return 0
    tool=[r for r in rows if r[1]=='TOOL_ERROR']
    for r in rows: print('  DIFF',' | '.join(r[:3]))
    print(f'RESULT: {"TOOL_ERROR" if tool else "MISMATCH"}（{len(rows)}件）'); return 2 if tool else 1

def selftest():
    """わざと間違えた正で、道具が食い違いを見つけるかを確かめる"""
    import copy; ok=True
    bad=copy.deepcopy(P); bad['org']['gakko']['floor']=9800
    if not check_doc(bad): print('SELFTEST FAIL: 確定文書の食い違いを見つけられない'); ok=False
    if not check_mocks([31],bad): print('SELFTEST FAIL: 見本の食い違いを見つけられない'); ok=False
    import copy as _copy
    bad2=_copy.deepcopy(P); bad2['individual']['shiraberu']['monthly']=777
    if not check_individual(bad2): print('SELFTEST FAIL: ★個人の値段の食い違いを見つけられない'); ok=False
    if check_individual(P): print('SELFTEST FAIL: 正しい個人の値段で食い違いが出る'); ok=False
    tmp=os.path.join(HERE,'_selftest.md'); open(tmp,'w',encoding='utf-8').write('教室の 下限 9,800円 です\n表示は 税別\n')
    hits=check_stale([tmp],baseline={})
    hid=hits[0][3] if hits else None
    if hid and check_stale([tmp],baseline={hid:1}).__len__()!=len(hits)-1: print('SELFTEST FAIL: 基準線の既知を除けない'); ok=False
    os.remove(tmp)
    if len(hits)<2: print('SELFTEST FAIL: 古い数字を見つけられない'); ok=False
    tmp2=os.path.join(HERE,'_selftest2.md'); open(tmp2,'w',encoding='utf-8').write('下限 9,800円 は廃止した\n')
    if check_stale([tmp2],baseline={}): print('SELFTEST FAIL: 「廃止した」と書いた行まで拾っている'); ok=False
    os.remove(tmp2)
    if check_doc() or check_mocks([5,6,31,216,500]): print('SELFTEST FAIL: 正しい値で食い違いが出る'); ok=False
    print('SELFTEST', 'PASS' if ok else 'FAIL'); return 0 if ok else 2

if __name__=='__main__':
    a=sys.argv[1:]
    if '--selftest' in a: sys.exit(selftest())
    if '--update-baseline' in a: sys.exit(update_baseline(a[a.index('--reason')+1] if '--reason' in a else ''))
    impl=a[a.index('--impl')+1] if '--impl' in a else None
    fn=a[a.index('--impl-fn')+1] if '--impl-fn' in a else 'monthlyFee'
    sys.exit(run(impl,fn))
