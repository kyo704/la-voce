#!/usr/bin/env python3
"""スマホの見本2本（全画面・iPhone）の「中身」の食い違いを探す（裁定168 P8）。作成・実行 Opus
2本は別々のファイルで、見た目（CSS）は違ってよい。中身（画面の一覧と、各画面に出る文字）は同じでなければならない。
  python3 tools/mobile_parity.py            → 画面の一覧の差と、文字が違う画面を出す（運営モードは学長で）
  python3 tools/mobile_parity.py --selftest
★iPhone 版だけ審査員の帯が無かった（2026-09-21）の型を見つける"""
import asyncio, os, sys, urllib.parse, re, difflib
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE)
A='00-動く見本（さわれる・全画面）.html'; B='00-動く見本-iPhoneで開く用.html'
def norm(t):
    # ★時刻・日付・「〜分前」は取る時刻で変わるので、形だけ残す（値段・人数などの数は比べる）
    t=re.sub(r'\s+','',t)
    t=re.sub(r'\d{4}年','Y年',t); t=re.sub(r'\d{1,2}月\d{1,2}日','M月D日',t); t=re.sub(r'\d{1,2}:\d{2}','H:M',t)
    t=re.sub(r'\d+(分|時間|秒)(前|後)','N\\1\\2',t)
    return t
async def collect(f):
    from playwright.async_api import async_playwright
    out={}
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':390,'height':844})
        await pg.goto('file://'+urllib.parse.quote(os.path.join(PACK,f))); await pg.wait_for_load_state('load'); await pg.wait_for_function("typeof SC==='object'&&typeof push==='function'"); await pg.wait_for_timeout(500)
        keys=await pg.evaluate("Object.keys(SC)")
        for mode in ('p','o'):
            for k in keys:
                try:
                    t=await pg.evaluate("""([k,m])=>{if(m==='o'){dmPost('学長');S.mode='o'}else{S.mode='p'}S.stack=[];push(k,0);
                        var bd=document.getElementById('bd')||document.body;
                        return (SC[k].length>0?'[ARG]':'')+bd.textContent}""",[k,mode])
                except Exception as e: t='ERR:'+str(e)[:60]
                out[(mode,k)]=norm(t)
            # タブのトップも
        await b.close()
    return out,set(keys)
def compare(a,b):
    (ta,ka),(tb,kb)=a,b
    rows=[]
    for k in sorted(ka-kb): rows.append(('全画面にだけある画面',k,''))
    for k in sorted(kb-ka): rows.append(('iPhone にだけある画面',k,''))
    for key in sorted(set(ta)&set(tb)):
        if ta[key]!=tb[key]:
            sm=difflib.SequenceMatcher(None,ta[key],tb[key]); r=sm.ratio()
            ops=[op for op in sm.get_opcodes() if op[0]!='equal'][:2]
            ex='; '.join(f"{op[0]} 全「{ta[key][op[1]:op[2]][:30]}」 iP「{tb[key][op[3]:op[4]][:30]}」" for op in ops)
            rows.append((f'文字が違う（{"運営" if key[0]=="o" else "個人"}・一致 {r:.0%}）',key[1],ex))
    return rows
BAD=re.compile(r'undefined|\[objectObject\]|NaN|\{\{|i18n\.|t\(\'')
def leaks(t):
    """★ことばの出し分け（裁定119）：辞書の鍵や作りかけの印が画面に出ていないか"""
    return sorted({m.group(0) for (k,v) in t.items() for m in [BAD.search(v)] if m})
def main():
    a=asyncio.run(collect(A)); b=asyncio.run(collect(B)); rows=compare(a,b)
    if rows and any('文字が違う' in r[0] for r in rows):   # ★重い時の読み込みの揺れを除くため、食い違いが出たらもう一度だけ取り直す
        a=asyncio.run(collect(A)); b=asyncio.run(collect(B)); rows=compare(a,b)
    print(f'MOBILE_PARITY 食い違い {len(rows)}件')
    for r in rows: print('  ',' | '.join(r))
    bad=[]
    for name,(t,_k) in (('全画面',a),('iPhone',b)):
        for key,v in t.items():
            if v.startswith('[ARG]'): continue      # ★引数が要る画面は、道具が渡した 0 で文字が崩れるため見ない
            m=BAD.search(v)
            if m: bad.append((name,key[1],m.group(0)))
    print(f'  画面に出てはいけない文字（裁定119 ほか）: {len(bad)}件')
    for x in bad[:20]: print('   ',' | '.join(x))
    return 0 if not rows and not bad else 1
def selftest():
    a=({('p','x'):'あいう',('p','y'):'同じ'},{'x','y','z'}); b=({('p','x'):'あいえ',('p','y'):'同じ'},{'x','y'})
    rows=compare(a,b); ok=len(rows)==2 and any('全画面にだけ' in r[0] for r in rows) and any('文字が違う' in r[0] and r[1]=='x' for r in rows)
    print('SELFTEST','PASS' if ok else 'FAIL'); return 0 if ok else 2
if __name__=='__main__': sys.exit(selftest() if '--selftest' in sys.argv else main())
