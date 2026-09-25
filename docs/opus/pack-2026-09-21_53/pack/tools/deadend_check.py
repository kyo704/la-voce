#!/usr/bin/env python3
"""★行き止まりの 画面を 見つける。
★2026-09-25: ★香盤表（4段の 最後）に ★「次へ」も「終わる」も 無く、
  ★坂本さんが ★先へ 進めませんでした
★見るもの: ★戻る 以外に ★1つも 押せる 行き先が 無い 画面
  ★★読むだけの 画面は ★それで 正しい ので、★候補として 出すだけ です
使い方: python3 tools/deadend_check.py [--selftest]"""
import os, re, sys, asyncio, urllib.parse
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE)
MOCKS=[('00-動く見本-iPhoneで開く用.html',390),('00-動く見本-PC・iPad（運営）.html',1400)]

async def scan(path,w):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':w,'height':900})
        await pg.goto('file://'+urllib.parse.quote(os.path.abspath(path)))
        await pg.wait_for_function("typeof SC==='object'"); await pg.wait_for_timeout(400)
        r=await pg.evaluate("""(()=>{const out=[];
          for(const k of Object.keys(SC)){ let h='';
            try{h=String(SC[k](0)??'')}catch(e){continue}
            const body=h.replace(/bk\\('[^']*'\\)/,'');           // ★戻るは 除く
            const go=(body.match(/push\\(|openSheet\\(|go\\(/g)||[]).length;
            if(go===0) out.push(k); }
          return out;})()""")
        await b.close(); return r

def analyse(dead, known_ok):
    return sorted(x for x in dead if x not in known_ok)

# ★読むだけで 正しい画面（★行き先が 無くて よい）
OK={'記録のきまり','紙をたしかめる','公開ページ','深い記事','たぶん本文','開いた記録',
 '門下を開いた記録','連絡先を見た記録','役職を変えた記録','半年のまとめ','はじめの1週間',
 '希望がまだの方','希望の地図','まだ使えません','やめるとどうなるか','Woolsong',
 '本番の前後','本番の予定','しらべていること','全部','たな','台帳','まだ','前3日'}

def main():
    total=[]
    for f,w in MOCKS:
        p=os.path.join(PACK,f)
        if not os.path.exists(p): continue
        d=asyncio.run(scan(p,w))
        rows=analyse(d, OK)
        print('DEADEND_CHECK', f[:24], '／行き先が 無い', len(d), '／★見るべき', len(rows))
        for x in rows: print('  DIFF ★行き止まり |', x)
        total+=rows
    print('★これは 候補です。★読むだけの 画面なら それで 正しい です')
    print(f'RESULT: 候補 {len(total)}件')
    return 0

def selftest():
    assert analyse(['A','記録のきまり'], OK)==['A'], '除外が 効かない'
    assert analyse([], OK)==[], '空で 出た'
    print('SELFTEST PASS'); return 0

if __name__=='__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
