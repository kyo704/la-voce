#!/usr/bin/env python3
"""★対応表の 注記が ★画面の 実物と 合っているか ── ★候補を 出す 道具 です。
★ことばで 当てるので ★誤検知が 出ます（★説明文の「つける」を 拾う など）。
★止める道具では ありません。★出た画面を ★人が 開いて 確かめてください。

★2026-09-24: ★私（Opus）は ★画面を 開かずに ★名前から 推測して 書いていました
  → ★Code に 2度 指摘されました（「出す」「記録のきまり」）
★見るもの（★2つだけ・★言い回しでは 当てない）:
  ① ★「読むだけ」と 書いたのに、★決める操作が 画面に ある
  ② ★「書く」と 書いたのに、★決める操作が 画面に 1つも ない
使い方: python3 tools/ops_map_check.py [--selftest]"""
import json, os, re, sys, asyncio, urllib.parse
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE)
OPS=os.path.join(HERE,'screen_ops.json')
MOCKS=[('00-動く見本-iPhoneで開く用.html',390),('00-動く見本-PC・iPad（運営）.html',1400),('00-動く見本-PC・iPad（個人）.html',1200)]
# ★「決める操作」＝ ★押すと 何かが 決まる もの（★見るだけの「›」は 入れない）
# ★2026-09-24: ★語を 足しました（★「伝える」「配る」も 決める操作です）
DECIDE=re.compile(r'(足す|決める|入れる|直す|保存|組む|招く|消す|やめる|始める|受ける|断る|出す|変える'
                  r'|伝える|配る|送る|申し込|応募|上げる|置く|選ぶ|つける|外す|書く|記録|確定|登録)')

async def texts():
    from playwright.async_api import async_playwright
    out={}
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for f,w in MOCKS:
            path=os.path.join(PACK,f)
            if not os.path.exists(path): continue
            pg=await b.new_page(viewport={'width':w,'height':844})
            await pg.goto('file://'+urllib.parse.quote(os.path.abspath(path)))
            await pg.wait_for_function("typeof SC==='object'"); await pg.wait_for_timeout(400)
            r=await pg.evaluate("""(()=>{const o={};
              for(const k of Object.keys(SC)){ let h='';
                try{h=String(SC[k](0)??'')}catch(e){continue}
                o[k]=h.replace(/<[^>]*>/g,' ').replace(/\\s+/g,' '); }
              return o;})()""")
            out.update(r); await pg.close()
        await b.close()
    return out

def analyse(ops, full):
    rows=[]
    for n,o in ops.items():
        if n.startswith('_') or n not in full: continue
        t=full[n]; note=o.get('note',''); w=o.get('w',[])
        decide=bool(DECIDE.search(t))
        if (not w) and decide and ('読むだけ' in note or '台帳を 読まない' in note):
            rows.append((n,'A ★「読むだけ」なのに 決める操作が ある', t[:46]))
        if w and not decide:
            rows.append((n,'B ★「書く」なのに 決める操作が ない', t[:46]))
    return rows

def main():
    ops=json.load(open(OPS,encoding='utf-8'))
    full=asyncio.run(texts())
    rows=analyse(ops, full)
    print('OPS_MAP_CHECK　画面',len(full),'／注記',len([k for k in ops if not k.startswith('_')]))
    for r in rows: print('  DIFF',' | '.join(r))
    print('★これは 候補です。★1つずつ 画面を 開いて 確かめてください')
    print(f'RESULT: 候補 {len(rows)}件')   # ★0 を 返します（★止める道具では ない）
    return 0

def selftest():
    ops={'よむ':{'note':'★読むだけ'},'かく':{'w':['t'],'note':'x'}}
    full={'よむ':' 一覧 足す ','かく':' 見るだけ '}
    rows=analyse(ops, full)
    assert len(rows)==2, rows
    assert rows[0][1].startswith('A') and rows[1][1].startswith('B'), rows
    ok=analyse({'よむ':{'note':'★読むだけ'}}, {'よむ':' 一覧だけ '})
    assert ok==[], ok
    print('SELFTEST PASS'); return 0

if __name__=='__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
